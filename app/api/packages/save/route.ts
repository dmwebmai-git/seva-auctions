
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { packageId } = body

    if (!packageId) {
      return NextResponse.json(
        { error: 'Auction ID is required' },
        { status: 400 }
      )
    }

    // Check if package exists
    const packageExists = await prisma.golfPackage.findUnique({
      where: { id: packageId }
    })

    if (!packageExists) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      )
    }

    // Check if already saved
    const existingSave = await prisma.savedPackage.findUnique({
      where: {
        userId_packageId: {
          userId: session.user.id,
          packageId
        }
      }
    })

    if (existingSave) {
      // Remove from saved
      await prisma.savedPackage.delete({
        where: {
          id: existingSave.id
        }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Auction removed from saved',
        saved: false
      })
    } else {
      // Add to saved
      await prisma.savedPackage.create({
        data: {
          userId: session.user.id,
          packageId
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Auction saved successfully',
        saved: true
      })
    }
  } catch (error) {
    console.error('Save package error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const packageId = searchParams.get('packageId')

    if (packageId) {
      // Check if specific package is saved
      const savedPackage = await prisma.savedPackage.findUnique({
        where: {
          userId_packageId: {
            userId: session.user.id,
            packageId
          }
        }
      })

      return NextResponse.json({
        success: true,
        saved: !!savedPackage
      })
    } else {
      // Get all saved packages for user
      const savedPackages = await prisma.savedPackage.findMany({
        where: {
          userId: session.user.id
        },
        include: {
          package: {
            include: {
              bids: {
                orderBy: { amount: 'desc' },
                take: 1
              },
              _count: {
                select: { bids: true }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return NextResponse.json({
        success: true,
        data: savedPackages.map(save => ({
          ...save.package,
          startingBid: Number(save.package.startingBid),
          currentBid: Number(save.package.currentBid),
          buyNowPrice: Number(save.package.buyNowPrice),
          bidIncrement: Number(save.package.bidIncrement),
          fairMarketValue: Number(save.package.fairMarketValue),
          bids: save.package.bids.map(bid => ({
            ...bid,
            amount: Number(bid.amount)
          }))
        }))
      })
    }
  } catch (error) {
    console.error('Get saved packages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
