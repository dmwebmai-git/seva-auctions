import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { canManageSettings } from '@/lib/roles'
import { prisma } from '@/lib/db'
import { testConnection } from '@/lib/seva-connect'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !canManageSettings(session.user.role)) return null
  return session
}

/**
 * POST — test a connection.
 * Body: either { id } to test a saved connection, or { baseUrl, apiKey } to
 * probe an ad-hoc (not-yet-saved) connection.
 */
export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    let baseUrl: string | undefined = body.baseUrl
    let apiKey: string | undefined = body.apiKey
    let savedId: string | undefined = body.id

    if (savedId) {
      const conn = await prisma.apiConnection.findUnique({ where: { id: savedId } })
      if (!conn) return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
      baseUrl = conn.baseUrl
      apiKey = conn.apiKey
    }

    if (!baseUrl || !apiKey) {
      return NextResponse.json({ error: 'Base URL and API Key are required.' }, { status: 400 })
    }

    const result = await testConnection({ baseUrl, apiKey })

    if (savedId) {
      await prisma.apiConnection.update({
        where: { id: savedId },
        data: {
          lastTestedAt: new Date(),
          lastTestStatus: result.status,
          lastTestMessage: result.message,
        },
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error testing API connection:', error)
    return NextResponse.json({ error: 'Failed to test connection' }, { status: 500 })
  }
}
