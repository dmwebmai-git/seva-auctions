import { prisma } from '@/lib/db'
import {
  getActiveConnection,
  awardPoints,
  recordActivity,
  recordDonation,
  getOrganization,
  type SevaConnection,
} from '@/lib/seva-connect'

/**
 * Server-side "write" bridge that pushes auction events into a linked member's
 * Seva Connect account (points, activity, donations).
 *
 * Design principles:
 *  - DURABLE: uses the member's stored `sevaConsumerId` (not a 1-hour session
 *    token), because these events happen long after login — at bid time, at
 *    auction settlement (possibly days later), and at payment. Every read/write
 *    endpoint accepts `consumerId` directly (see integration guide §3).
 *  - NON-BREAKING: every function is fire-and-forget and fully guarded. If Seva
 *    is unreachable, no connection is configured, the key lacks the scope, or
 *    the user isn't linked to Seva, we log and return quietly — the core auction
 *    flow (bids, settlement, payments) must never fail because of Seva.
 *  - GATED: nothing is sent unless an ACTIVE connection exists AND its key holds
 *    the required scope AND the user has a `sevaConsumerId`. So until a real key
 *    with write scopes is configured, these are complete no-ops.
 */

/**
 * Flat number of Seva points awarded to a winner, added to their existing Seva
 * Marketplace balance. (Business rule: every auction win = 50 points, regardless
 * of the winning amount.) Adjust here if the reward changes.
 */
export const POINTS_PER_WIN = 50

/**
 * Stripe processing fee model used to compute the net proceeds of a paid winning
 * bid before the 70/30 split. Standard Stripe pricing: 2.9% + $0.30 per charge.
 */
export const STRIPE_PERCENT_FEE = 0.029
export const STRIPE_FIXED_FEE = 0.30

/**
 * Share of the net (post-Stripe-fee) proceeds that becomes the donation credited
 * to the member's chosen organization. The remaining 30% is Seva Connect's
 * platform fee. Business rule: winning bid is split 70/30 after Stripe fees —
 * the organization gets the larger 70% share to maximize fundraising. Seva's
 * own donation fee is applied by Seva on their side to the amount we send.
 */
export const ORG_DONATION_SHARE = 0.7

/** Computes the split of a paid winning bid: Stripe fee, org donation, platform fee. */
export function computeDonationSplit(winningBid: number): {
  gross: number
  stripeFee: number
  net: number
  orgDonation: number
  platformFee: number
} {
  const gross = Math.max(0, Number(winningBid) || 0)
  const stripeFee = gross > 0 ? gross * STRIPE_PERCENT_FEE + STRIPE_FIXED_FEE : 0
  const net = Math.max(0, gross - stripeFee)
  const orgDonation = Math.round(net * ORG_DONATION_SHARE * 100) / 100
  const platformFee = Math.round((net - orgDonation) * 100) / 100
  return { gross, stripeFee: Math.round(stripeFee * 100) / 100, net: Math.round(net * 100) / 100, orgDonation, platformFee }
}

interface LinkedContext {
  conn: SevaConnection
  consumerId: string
  donorName?: string
  donorEmail?: string
}

/**
 * Resolves the active connection + the user's Seva consumer id, but only if the
 * connection's key carries the required scope. Returns null (silently) otherwise.
 */
async function resolveLinked(
  userId: string,
  requiredScope: string
): Promise<LinkedContext | null> {
  try {
    const conn = await getActiveConnection()
    if (!conn) return null
    if (!conn.scopes?.includes(requiredScope)) return null

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sevaConsumerId: true, email: true, firstName: true, lastName: true },
    })
    if (!user?.sevaConsumerId) return null

    const donorName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined
    return { conn, consumerId: user.sevaConsumerId, donorName, donorEmail: user.email || undefined }
  } catch (err) {
    console.error('[seva-sync] resolveLinked failed:', err)
    return null
  }
}

/** Log an audit-trail activity (no points) — e.g. "Placed a bid on X". */
export async function syncActivity(userId: string, description: string): Promise<void> {
  const ctx = await resolveLinked(userId, 'consumer:write')
  if (!ctx) return
  try {
    const res = await recordActivity(ctx.conn, { consumerId: ctx.consumerId, description })
    if (!res.ok) console.error('[seva-sync] activity not recorded:', res.status, res.error)
  } catch (err) {
    console.error('[seva-sync] syncActivity failed:', err)
  }
}

/**
 * Award the flat win reward (POINTS_PER_WIN) to a winner's existing Seva balance.
 * `amount` (the winning bid) is accepted for signature stability/logging but the
 * award is a flat amount by business rule. type 'reward' so it lands in the
 * member's reward bucket rather than game points.
 */
export async function syncAwardPointsForWin(
  userId: string,
  amount: number,
  packageTitle: string
): Promise<void> {
  const ctx = await resolveLinked(userId, 'consumer:write')
  if (!ctx) return
  const points = POINTS_PER_WIN
  if (points <= 0) return
  try {
    const res = await awardPoints(ctx.conn, {
      consumerId: ctx.consumerId,
      points,
      description: `Won auction: ${packageTitle}`,
      type: 'reward',
    })
    if (!res.ok) console.error('[seva-sync] points not awarded:', res.status, res.error)
  } catch (err) {
    console.error('[seva-sync] syncAwardPointsForWin failed:', err)
  }
}

/**
 * Record a donation to the member's chosen Seva organization when a winning bid
 * is paid. Looks up the member's org first; if they haven't chosen one, skips.
 */
export async function syncDonationForPayment(params: {
  userId: string
  amount: number
  packageTitle: string
  paymentIntentId?: string
}): Promise<void> {
  const ctx = await resolveLinked(params.userId, 'donation:write')
  if (!ctx) return

  try {
    // Need the member's organization id. Reading it requires consumer:read.
    if (!ctx.conn.scopes?.includes('consumer:read')) {
      console.error('[seva-sync] donation skipped: key lacks consumer:read to resolve organization')
      return
    }
    const orgRes = await getOrganization(ctx.conn, { consumerId: ctx.consumerId })
    const organizationId = orgRes.ok ? orgRes.data?.organization?.id : undefined
    if (!organizationId) {
      console.log('[seva-sync] donation skipped: member has no chosen organization')
      return
    }

    // Business rule: take standard Stripe fees off the top of the winning bid,
    // then split the remainder 70/30 — the organization's 70% is the donation
    // recorded here; the remaining 30% is Seva Connect's platform fee (retained on
    // the auction's Stripe balance, not sent to Seva).
    const split = computeDonationSplit(Number(params.amount))
    if (split.orgDonation <= 0) {
      console.log('[seva-sync] donation skipped: computed organization share is zero')
      return
    }

    const res = await recordDonation(ctx.conn, {
      organizationId,
      amount: split.orgDonation,
      donorName: ctx.donorName,
      donorEmail: ctx.donorEmail,
      consumerId: ctx.consumerId,
      message: `From my winning auction bid: ${params.packageTitle}`,
      paymentIntentId: params.paymentIntentId,
    })
    if (!res.ok) console.error('[seva-sync] donation not recorded:', res.status, res.error)
  } catch (err) {
    console.error('[seva-sync] syncDonationForPayment failed:', err)
  }
}
