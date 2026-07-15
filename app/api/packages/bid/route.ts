
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { sendNotificationEmail, buildOutbidEmail } from '@/lib/email'
import { syncActivity } from '@/lib/seva-sync'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { packageId, bidAmount } = body

    if (!packageId || !bidAmount) {
      return NextResponse.json(
        { success: false, error: 'Auction ID and bid amount are required' },
        { status: 400 }
      )
    }

    // Get the package
    const packageItem = await prisma.golfPackage.findUnique({
      where: { id: packageId }
    })

    if (!packageItem) {
      return NextResponse.json(
        { success: false, error: 'Auction not found' },
        { status: 404 }
      )
    }

    // Demo auctions do not accept bids
    if (packageItem.isDemo) {
      return NextResponse.json(
        { success: false, error: 'This is a demo auction and does not accept bids' },
        { status: 400 }
      )
    }

    // Check if auction is still active
    if (packageItem.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'This auction is no longer active' },
        { status: 400 }
      )
    }

    // Check if auction has expired
    if (new Date(packageItem.bidDeadline) <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'This auction has expired' },
        { status: 400 }
      )
    }

    // Validate bid amount
    const currentBid = Number(packageItem.currentBid)
    const bidIncrement = Number(packageItem.bidIncrement)
    const minBid = currentBid + bidIncrement
    const bidAmountNum = Number(bidAmount)

    if (bidAmountNum < minBid) {
      return NextResponse.json(
        { success: false, error: `Minimum bid is $${minBid.toLocaleString()}` },
        { status: 400 }
      )
    }

    // Create the bid in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mark all previous bids for this package as not winning
      await tx.bid.updateMany({
        where: {
          packageId: packageId,
          isWinning: true
        },
        data: {
          isWinning: false
        }
      })

      // Create the new bid
      const newBid = await tx.bid.create({
        data: {
          amount: bidAmountNum,
          userId: session.user.id,
          packageId: packageId,
          isWinning: true
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      // Update the package with new current bid and total bids
      const updatedPackage = await tx.golfPackage.update({
        where: { id: packageId },
        data: {
          currentBid: bidAmountNum,
          totalBids: {
            increment: 1
          }
        },
        include: {
          bids: {
            orderBy: {
              amount: 'desc'
            },
            take: 10,
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              bids: true
            }
          }
        }
      })

      return { newBid, updatedPackage }
    })

    // Send outbid notification to the previous highest bidder (non-blocking)
    const previousHighBidder = result.updatedPackage.bids.find(
      (b) => b.userId !== session.user.id && Number(b.amount) < bidAmountNum
    )
    if (previousHighBidder?.user?.email) {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://sevaconnectgolf.com'
      sendNotificationEmail({
        notificationId: process.env.NOTIF_ID_OUTBID_ALERT!,
        recipientEmail: previousHighBidder.user.email,
        subject: `You've been outbid on ${packageItem.title}`,
        htmlBody: buildOutbidEmail({
          packageTitle: packageItem.title,
          previousBid: Number(previousHighBidder.amount),
          newBid: bidAmountNum,
          packageUrl: `${baseUrl}/package/${packageId}`,
        }),
      }).catch((e) => console.error('Failed to send outbid email:', e))
    }

    // Mirror the bid as an activity on the member's linked Seva account (no-op
    // unless a Seva connection with consumer:write is configured and linked).
    await syncActivity(session.user.id, `Placed a bid on ${packageItem.title}`)

    return NextResponse.json({
      success: true,
      bid: {
        ...result.newBid,
        amount: Number(result.newBid.amount)
      },
      package: {
        ...result.updatedPackage,
        startingBid: Number(result.updatedPackage.startingBid),
        currentBid: Number(result.updatedPackage.currentBid),
        buyNowPrice: Number(result.updatedPackage.buyNowPrice),
        bidIncrement: Number(result.updatedPackage.bidIncrement),
        fairMarketValue: Number(result.updatedPackage.fairMarketValue),
        bids: result.updatedPackage.bids.map(bid => ({
          ...bid,
          amount: Number(bid.amount)
        }))
      }
    })

  } catch (error) {
    console.error('Error placing bid:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to place bid' },
      { status: 500 }
    )
  }
}
