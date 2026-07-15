import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { canManagePackages } from '@/lib/roles'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user || !canManagePackages(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pkg = await prisma.golfPackage.findUnique({
    where: { id: params.id },
    select: { id: true, title: true },
  })

  if (!pkg) {
    return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
  }

  const bids = await prisma.bid.findMany({
    where: { packageId: params.id },
    orderBy: { amount: 'desc' },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  return NextResponse.json({
    title: pkg.title,
    bids: bids.map((bid) => ({
      id: bid.id,
      amount: Number(bid.amount),
      isWinning: bid.isWinning,
      createdAt: bid.createdAt,
      firstName: bid.user?.firstName ?? null,
      lastName: bid.user?.lastName ?? null,
      email: bid.user?.email ?? null,
    })),
  })
}
