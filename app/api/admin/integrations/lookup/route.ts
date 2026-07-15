import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { canManageSettings } from '@/lib/roles'
import { prisma } from '@/lib/db'
import { verifyMember, getConsumer, getMembership, getOrganization } from '@/lib/seva-connect'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !canManageSettings(session.user.role)) return null
  return session
}

/**
 * POST — full end-to-end test: verify a real member's login against a saved
 * connection, then read their profile, points, membership and organization.
 * Body: { id (connection id), email, password }
 */
export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id, email, password } = await request.json()
    if (!id || !email || !password) {
      return NextResponse.json(
        { error: 'Connection, member email and password are required.' },
        { status: 400 }
      )
    }

    const conn = await prisma.apiConnection.findUnique({ where: { id } })
    if (!conn) return NextResponse.json({ error: 'Connection not found' }, { status: 404 })

    const creds = { baseUrl: conn.baseUrl, apiKey: conn.apiKey }
    const verify = await verifyMember(creds, email, password)

    if (!verify.ok || !verify.data?.verified || !verify.data?.token) {
      return NextResponse.json({
        verified: false,
        error: verify.data?.error || verify.error || 'Verification failed',
        status: verify.status,
      })
    }

    const token = verify.data.token
    const [profile, membership, organization] = await Promise.all([
      getConsumer(creds, { token }),
      getMembership(creds, { token }),
      getOrganization(creds, { token }),
    ])

    return NextResponse.json({
      verified: true,
      consumer: verify.data.consumer,
      expiresAt: verify.data.expiresAt,
      profile: profile.data ?? null,
      membership: membership.data ?? null,
      organization: organization.data ?? null,
    })
  } catch (error) {
    console.error('Error in member lookup:', error)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
