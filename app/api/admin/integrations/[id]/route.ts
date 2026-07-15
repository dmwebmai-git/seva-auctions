import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { canManageSettings } from '@/lib/roles'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !canManageSettings(session.user.role)) return null
  return session
}

// PUT — update a connection. apiKey is only changed when a non-empty value is sent.
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const { name, baseUrl, apiKey, scopes, isActive } = body

    const data: any = {}
    if (name !== undefined) data.name = String(name).trim()
    if (baseUrl !== undefined) data.baseUrl = String(baseUrl).trim().replace(/\/+$/, '')
    if (apiKey !== undefined && String(apiKey).trim() !== '') data.apiKey = String(apiKey).trim()
    if (scopes !== undefined) data.scopes = Array.isArray(scopes) ? scopes : []
    if (isActive !== undefined) data.isActive = !!isActive

    await prisma.apiConnection.update({ where: { id: params.id }, data })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating API connection:', error)
    return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 })
  }
}

// DELETE — remove a connection
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    await prisma.apiConnection.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting API connection:', error)
    return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 })
  }
}
