import { prisma } from '@/lib/db'

/**
 * Seva Connect Public API client.
 *
 * Implements the endpoints documented in the "Seva Connect — Public API
 * Integration Guide". This app (the auction site) is the CONSUMER of that
 * API: it authenticates every request with a scoped API key (Bearer token)
 * stored in the ApiConnection table, and talks to Seva over HTTPS only.
 *
 * The API key is NEVER exposed to the browser — every function here runs
 * server-side and reads the active connection from the database.
 */

export const SEVA_SCOPES = [
  { id: 'identity:verify', label: 'Verify member login' },
  { id: 'consumer:read', label: 'Read member profile, points, membership & organization' },
  { id: 'consumer:write', label: 'Award / deduct points and log activity' },
  { id: 'donation:write', label: 'Record donations to organizations' },
] as const

export type SevaScope = (typeof SEVA_SCOPES)[number]['id']

export interface SevaConnection {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  scopes: string[]
  isActive: boolean
}

export interface SevaResult<T> {
  ok: boolean
  status: number
  data?: T
  error?: string
}

/**
 * Normalizes a stored Seva base URL. The Seva Marketplace API is only served
 * from the `www.` host — the bare apex (thesevamarketplace.com) returns 405 for
 * POSTs like /auth/verify — so we force the www host to avoid login failures if
 * the URL was entered without it.
 */
function normalizeSevaBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, '')
  try {
    const u = new URL(url)
    if (u.hostname === 'thesevamarketplace.com') {
      u.hostname = 'www.thesevamarketplace.com'
      url = u.toString().replace(/\/+$/, '')
    }
  } catch {
    // leave as-is if it isn't a parseable URL
  }
  return url
}

/** Returns the single active Seva Connect connection, or null if none configured. */
export async function getActiveConnection(): Promise<SevaConnection | null> {
  const conn = await prisma.apiConnection.findFirst({
    where: { provider: 'seva-connect', isActive: true },
    orderBy: { updatedAt: 'desc' },
  })
  if (!conn) return null
  return {
    id: conn.id,
    name: conn.name,
    baseUrl: normalizeSevaBaseUrl(conn.baseUrl),
    apiKey: conn.apiKey,
    scopes: conn.scopes,
    isActive: conn.isActive,
  }
}

/**
 * Low-level request helper. Accepts an explicit connection so callers can test
 * a not-yet-saved connection (via the admin test tool) or use the active one.
 */
async function sevaFetch<T = any>(
  conn: Pick<SevaConnection, 'baseUrl' | 'apiKey'>,
  path: string,
  init: { method?: string; body?: any; query?: Record<string, string | undefined> } = {}
): Promise<SevaResult<T>> {
  const base = conn.baseUrl.replace(/\/+$/, '')
  const url = new URL(`${base}${path}`)
  if (init.query) {
    for (const [k, v] of Object.entries(init.query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
    }
  }

  try {
    const res = await fetch(url.toString(), {
      method: init.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${conn.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
    })

    let parsed: any = null
    const text = await res.text()
    if (text) {
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = { raw: text }
      }
    }

    if (!res.ok) {
      const message =
        parsed?.error ||
        (res.status === 401
          ? 'Unauthorized — missing/invalid/expired API key or session token'
          : res.status === 403
          ? 'Forbidden — the API key lacks the required permission'
          : res.status === 404
          ? 'Not found'
          : res.status === 429
          ? 'Rate limit exceeded for this key'
          : `Request failed (HTTP ${res.status})`)
      return { ok: false, status: res.status, data: parsed, error: message }
    }

    return { ok: true, status: res.status, data: parsed as T }
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err?.message
        ? `Could not reach Seva Connect: ${err.message}`
        : 'Could not reach Seva Connect (network error)',
    }
  }
}

// ---------------------------------------------------------------------------
// Endpoint wrappers (section 4 of the integration guide)
// ---------------------------------------------------------------------------

export interface VerifyResult {
  verified: boolean
  token?: string
  expiresAt?: string
  consumer?: { id: string; email: string; firstName?: string; lastName?: string }
  error?: string
}

/** 4.1 Verify a member's login — POST /api/v1/auth/verify (scope: identity:verify) */
export async function verifyMember(
  conn: Pick<SevaConnection, 'baseUrl' | 'apiKey'>,
  email: string,
  password: string
): Promise<SevaResult<VerifyResult>> {
  return sevaFetch<VerifyResult>(conn, '/api/v1/auth/verify', {
    method: 'POST',
    body: { email, password },
  })
}

/** 4.2 Read a member's profile & points — GET /api/v1/consumers/me (scope: consumer:read) */
export async function getConsumer(
  conn: Pick<SevaConnection, 'baseUrl' | 'apiKey'>,
  auth: { token?: string; consumerId?: string }
): Promise<SevaResult<any>> {
  return sevaFetch(conn, '/api/v1/consumers/me', { query: auth })
}

/** 4.3 Check membership level — GET /api/v1/consumers/membership (scope: consumer:read) */
export async function getMembership(
  conn: Pick<SevaConnection, 'baseUrl' | 'apiKey'>,
  auth: { token?: string; consumerId?: string }
): Promise<SevaResult<any>> {
  return sevaFetch(conn, '/api/v1/consumers/membership', { query: auth })
}

/** 4.4 Read the member's chosen organization — GET /api/v1/consumers/organization (scope: consumer:read) */
export async function getOrganization(
  conn: Pick<SevaConnection, 'baseUrl' | 'apiKey'>,
  auth: { token?: string; consumerId?: string }
): Promise<SevaResult<any>> {
  return sevaFetch(conn, '/api/v1/consumers/organization', { query: auth })
}

/** 4.5 Award / deduct points — POST /api/v1/consumers/points (scope: consumer:write) */
export async function awardPoints(
  conn: Pick<SevaConnection, 'baseUrl' | 'apiKey'>,
  params: { token?: string; consumerId?: string; points: number; description: string; type?: 'game' | 'reward' | 'redemption' }
): Promise<SevaResult<any>> {
  return sevaFetch(conn, '/api/v1/consumers/points', { method: 'POST', body: params })
}

/** 4.6 Record an activity (no points) — POST /api/v1/consumers/activity (scope: consumer:write) */
export async function recordActivity(
  conn: Pick<SevaConnection, 'baseUrl' | 'apiKey'>,
  params: { token?: string; consumerId?: string; description: string }
): Promise<SevaResult<any>> {
  return sevaFetch(conn, '/api/v1/consumers/activity', { method: 'POST', body: params })
}

/** 4.7 Record a donation — POST /api/v1/donations (scope: donation:write) */
export async function recordDonation(
  conn: Pick<SevaConnection, 'baseUrl' | 'apiKey'>,
  params: {
    organizationId: string
    amount: number
    donorName?: string
    donorEmail?: string
    token?: string
    consumerId?: string
    message?: string
    paymentIntentId?: string
  }
): Promise<SevaResult<any>> {
  return sevaFetch(conn, '/api/v1/donations', { method: 'POST', body: params })
}

/**
 * Tests whether a connection's key is live and correctly scoped.
 *
 * Strategy: call auth/verify with deliberately invalid credentials.
 *  - 200/401 with a `verified` field  -> reached the API and the key
 *    authenticated successfully; only the member credentials were wrong.
 *    => connection is VALID.
 *  - 401 without a `verified` field    -> the API key itself is bad/expired.
 *  - 403                               -> key valid but missing identity:verify scope.
 */
export async function testConnection(
  conn: Pick<SevaConnection, 'baseUrl' | 'apiKey'>
): Promise<{ status: 'success' | 'error' | 'warning'; message: string }> {
  const res = await verifyMember(conn, '__seva_connection_probe__@example.invalid', '__invalid_probe__')

  if (res.status === 0) {
    return { status: 'error', message: res.error || 'Could not reach Seva Connect' }
  }

  // Key authenticated (the API processed our request) — cred check just failed.
  if (res.data && typeof (res.data as any).verified !== 'undefined') {
    return { status: 'success', message: 'Connection verified — API key is live and accepted.' }
  }

  if (res.status === 401) {
    return { status: 'error', message: 'API key is missing, invalid, revoked, or expired (401).' }
  }
  if (res.status === 403) {
    return { status: 'warning', message: 'API key is valid but lacks the identity:verify permission (403).' }
  }
  if (res.status === 429) {
    return { status: 'warning', message: 'Rate limit exceeded for this key (429). The key appears valid.' }
  }
  if (res.ok) {
    return { status: 'success', message: 'Connection reachable and key accepted.' }
  }
  return { status: 'error', message: res.error || `Unexpected response (HTTP ${res.status}).` }
}

/** Masks an API key for display, e.g. svak_live_abcd…wxyz -> svak_live_••••••wxyz */
export function maskApiKey(key: string): string {
  if (!key) return ''
  if (key.length <= 12) return '••••••'
  const prefixMatch = key.match(/^(svak_[a-z]+_)/)
  const prefix = prefixMatch ? prefixMatch[1] : key.slice(0, 6)
  const last4 = key.slice(-4)
  return `${prefix}••••••${last4}`
}

// ---------------------------------------------------------------------------
// Seamless SSO login hand-off (see Seva_Connect_SSO_Handoff_Spec)
// ---------------------------------------------------------------------------

export interface ExchangeResult {
  verified: boolean
  token?: string
  expiresAt?: string
  consumer?: { id: string; email: string; firstName?: string; lastName?: string }
  error?: string
}

/**
 * Exchange a one-time SSO hand-off code for a member identity + session token.
 *
 * POST /api/v1/auth/exchange (scope: identity:verify)
 *
 * This is the client side of the "seamless login" flow: when a member clicks
 * "Go to Auctions" inside the Seva Marketplace portal, Seva mints a short-lived,
 * single-use code and redirects the browser to /sso?code=... . This app then
 * swaps that code (server-to-server, with the secret API key) for the member's
 * identity and a normal 1-hour session token — no password is ever entered.
 *
 * NOTE: The Seva side of this endpoint is not live yet. This wrapper is built
 * against the agreed spec so the auction side is ready the moment Seva enables
 * `POST /api/v1/auth/exchange`.
 */
export async function exchangeCode(
  conn: Pick<SevaConnection, 'baseUrl' | 'apiKey'>,
  code: string
): Promise<SevaResult<ExchangeResult>> {
  return sevaFetch<ExchangeResult>(conn, '/api/v1/auth/exchange', {
    method: 'POST',
    body: { code },
  })
}
