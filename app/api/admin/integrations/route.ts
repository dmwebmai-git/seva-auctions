import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { maskApiKey } from '@/lib/seva-connect'
import { canManageSettings } from '@/lib/roles'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !canManageSettings(session.user.role)) return null
  return session
}

// GET — list all connections (API keys are masked, never returned in full)
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const connections = await prisma.apiConnection.findMany({
    orderBy: { createdAt: 'desc' },
  })
  const safe = connections.map((c) => ({
    id: c.id,
    name: c.name,
    provider: c.provider,
    baseUrl: c.baseUrl,
    apiKeyMasked: maskApiKey(c.apiKey),
    scopes: c.scopes,
    isActive: c.isActive,
    lastTestedAt: c.lastTestedAt,
    lastTestStatus: c.lastTestStatus,
    lastTestMessage: c.lastTestMessage,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }))
  return NextResponse.json({ connections: safe })
}

// POST — create a new connection
export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { name, baseUrl, apiKey, scopes, isActive, provider } = body

    if (!name || !baseUrl || !apiKey) {
      return NextResponse.json(
        { error: 'Name, Base URL and API Key are required.' },
        { status: 400 }
      )
    }

    const created = await prisma.apiConnection.create({
      data: {
        name: String(name).trim(),
        provider: provider ? String(provider) : 'seva-connect',
        baseUrl: String(baseUrl).trim().replace(/\/+$/, ''),
        apiKey: String(apiKey).trim(),
        scopes: Array.isArray(scopes) ? scopes : [],
        isActive: isActive !== false,
      },
    })

    return NextResponse.json({ id: created.id, success: true })
  } catch (error) {
    console.error('Error creating API connection:', error)
    return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 })
  }
}
