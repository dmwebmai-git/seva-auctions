import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import * as bcrypt from 'bcryptjs'
import {
  ROLES,
  Role,
  normalizeRole,
  canManageUsers,
  canAssignRole,
} from '@/lib/roles'

export const dynamic = 'force-dynamic'

async function requireUserManager() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !canManageUsers(session.user.role)) return null
  return session
}

// GET — list all accounts (optionally filtered by ?q= search term)
export async function GET(request: NextRequest) {
  const session = await requireUserManager()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const q = (request.nextUrl.searchParams.get('q') || '').trim()
  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: 'insensitive' as const } },
          { firstName: { contains: q, mode: 'insensitive' as const } },
          { lastName: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
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

  const safe = users.map((u) => ({
    ...u,
    role: normalizeRole(u.role),
    linkedToSeva: !!u.sevaConsumerId,
  }))

  return NextResponse.json({ users: safe, currentUserId: session.user.id })
}

// POST — create a brand-new account with a chosen role
export async function POST(request: NextRequest) {
  const session = await requireUserManager()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const firstName = String(body.firstName || '').trim() || null
  const lastName = String(body.lastName || '').trim() || null
  const role = normalizeRole(body.role)

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }
  if (!(ROLES as readonly string[]).includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }
  if (!canAssignRole(session.user.role, role as Role)) {
    return NextResponse.json(
      { error: 'You cannot create an account with a role higher than your own' },
      { status: 403 },
    )
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 10)
  const created = await prisma.user.create({
    data: {
      email,
      password: hashed,
      firstName,
      lastName,
      role,
      acceptTerms: true,
      emailVerified: new Date(),
    },
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
    user: { ...created, role: normalizeRole(created.role), linkedToSeva: !!created.sevaConsumerId },
  })
}
