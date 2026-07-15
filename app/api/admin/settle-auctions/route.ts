
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendNotificationEmail, buildAuctionWonEmail } from '@/lib/email'
import { syncAwardPointsForWin } from '@/lib/seva-sync'
import { canManageSettings } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify this is called by admin or internal cron via secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      // Also allow admin session
      const { getServerSession } = await import('next-auth/next')
      const { authOptions } = await import('@/lib/auth-options')
      const session = await getServerSession(authOptions)
      if (!session?.user?.id || !canManageSettings((session.user as any).role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Find all expired auctions that are still marked 'active'
    const expiredAuctions = await prisma.golfPackage.findMany({
      where: {
        status: 'active',
        isDemo: false,
        bidDeadline: {
          lte: new Date()
        }
      },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        _count: {
          select: { bids: true }
        }
      }
    })

    if (expiredAuctions.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No expired auctions to settle',
        settled: 0 
      })
    }

    const results = []

    for (const auction of expiredAuctions) {
      const highestBid = auction.bids[0]

      if (highestBid) {
        // There is a winner — create WonPackage and mark as sold
        await prisma.$transaction(async (tx) => {
          // Create won package record with pending payment
          await tx.wonPackage.upsert({
            where: {
              userId_packageId: {
                userId: highestBid.userId,
                packageId: auction.id,
              }
            },
            create: {
              userId: highestBid.userId,
              packageId: auction.id,
              winningBid: Number(highestBid.amount),
              paymentStatus: 'pending',
            },
            update: {}
          })

          // Update package status
          await tx.golfPackage.update({
            where: { id: auction.id },
            data: { status: 'sold' }
          })

          // Mark winning bid
          await tx.bid.updateMany({
            where: { packageId: auction.id },
            data: { isWinning: false }
          })
          await tx.bid.update({
            where: { id: highestBid.id },
            data: { isWinning: true }
          })
        })

        // Send winner notification email
        const baseUrl = process.env.NEXTAUTH_URL || 'https://sevaconnectgolf.com'
        const paymentUrl = `${baseUrl}/package/${auction.id}/pay`
        
        if (highestBid.user.email) {
          await sendNotificationEmail({
            notificationId: process.env.NOTIF_ID_AUCTION_WON!,
            recipientEmail: highestBid.user.email,
            subject: `🏆 You won the auction for ${auction.title}!`,
            htmlBody: buildAuctionWonEmail({
              packageTitle: auction.title,
              winningBid: Number(highestBid.amount),
              paymentUrl,
              courseAddress: auction.courseAddress,
            }),
          })
        }

        // Award Seva points to the winner (no-op unless a Seva connection with
        // consumer:write is configured and the winner is linked to Seva).
        await syncAwardPointsForWin(highestBid.userId, Number(highestBid.amount), auction.title)

        results.push({
          packageId: auction.id,
          title: auction.title,
          winnerId: highestBid.userId,
          winnerEmail: highestBid.user.email,
          winningBid: Number(highestBid.amount),
          status: 'settled_with_winner'
        })
      } else {
        // No bids — mark as expired
        await prisma.golfPackage.update({
          where: { id: auction.id },
          data: { status: 'expired' }
        })

        results.push({
          packageId: auction.id,
          title: auction.title,
          status: 'expired_no_bids'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Settled ${results.length} auction(s)`,
      settled: results.length,
      results
    })

  } catch (error) {
    console.error('Error settling auctions:', error)
    return NextResponse.json(
      { error: 'Failed to settle auctions' },
      { status: 500 }
    )
  }
}
