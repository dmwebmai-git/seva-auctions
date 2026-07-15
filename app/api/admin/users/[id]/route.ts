import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import {
  ROLES,
  Role,
  normalizeRole,
  canManageUsers,
  canAssignRole,
  canManageSubject,
} from '@/lib/roles'

export const dynamic = 'force-dynamic'

async function requireUserManager() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !canManageUsers(session.user.role)) return null
  return session
}

// Guard: never allow removing the last remaining Super Admin from the system.
async function wouldStrandSuperAdmins(targetId: string): Promise<boolean> {
  const superAdmins = await prisma.user.findMany({
    where: { role: 'super_admin' },
    select: { id: true },
  })
  const remaining = superAdmins.filter((u) => u.id !== targetId)
  return remaining.length === 0
}

// PATCH — change an account's role
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireUserManager()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const targetId = params.id
  if (targetId === session.user.id) {
    return NextResponse.json({ error: 'You cannot change your own role' }, { status: 403 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const newRole = normalizeRole(body.role)
  if (!(ROLES as readonly string[]).includes(newRole)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } })
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Actor must outrank (or equal) the target's current role, and may only
  // assign a role at or below their own level.
  if (!canManageSubject(session.user.role, target.role)) {
    return NextResponse.json({ error: 'You cannot manage this account' }, { status: 403 })
  }
  if (!canAssignRole(session.user.role, newRole as Role)) {
    return NextResponse.json(
      { error: 'You cannot assign a role higher than your own' },
      { status: 403 },
    )
  }

  // Protect the last Super Admin from being demoted.
  if (normalizeRole(target.role) === 'super_admin' && newRole !== 'super_admin') {
    if (await wouldStrandSuperAdmins(targetId)) {
      return NextResponse.json(
        { error: 'Cannot demote the last remaining Super Admin' },
        { status: 409 },
      )
    }
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { role: newRole },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      sevaConsumerId: true,
      createdAt: true,
    },
  })

  return NextResponse.json({
    user: { ...updated, role: normalizeRole(updated.role), linkedToSeva: !!updated.sevaConsumerId },
  })
}

// DELETE — remove an account
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireUserManager()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const targetId = params.id
  if (targetId === session.user.id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 403 })
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } })
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (!canManageSubject(session.user.role, target.role)) {
    return NextResponse.json({ error: 'You cannot delete this account' }, { status: 403 })
  }

  if (normalizeRole(target.role) === 'super_admin' && (await wouldStrandSuperAdmins(targetId))) {
    return NextResponse.json(
      { error: 'Cannot delete the last remaining Super Admin' },
      { status: 409 },
    )
  }

  await prisma.user.delete({ where: { id: targetId } })
  return NextResponse.json({ success: true })
}
