
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { PackageDetailView } from '@/components/package-detail-view'
import { canAccessAdmin } from '@/lib/roles'

export const dynamic = "force-dynamic"

interface PackageDetailPageProps {
  params: {
    id: string
  }
  searchParams: {
    action?: string
  }
}

export default async function PackageDetailPage({ params, searchParams }: PackageDetailPageProps) {
  const session = await getServerSession(authOptions)
  
  try {
    const packageItem = await prisma.golfPackage.findUnique({
      where: {
        id: params.id
      },
      include: {
        bids: {
          orderBy: {
            amount: 'desc'
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
        },
        _count: {
          select: {
            bids: true
          }
        }
      }
    })

    if (!packageItem) {
      notFound()
    }

    // Track a page view (built-in view counter). Exclude admin/creator viewers
    // so internal browsing doesn't inflate the numbers, and never count demos.
    const isStaffViewer = canAccessAdmin(session?.user?.role)
    if (!isStaffViewer && !packageItem.isDemo) {
      prisma.golfPackage
        .update({
          where: { id: packageItem.id },
          data: { viewCount: { increment: 1 } },
        })
        .catch((e) => console.error('Failed to record view:', e))
    }

    // Convert Decimal fields to numbers
    const packageWithNumbers = {
      ...packageItem,
      startingBid: Number(packageItem.startingBid),
      currentBid: Number(packageItem.currentBid),
      buyNowPrice: Number(packageItem.buyNowPrice),
      bidIncrement: Number(packageItem.bidIncrement),
      fairMarketValue: Number(packageItem.fairMarketValue),
      status: packageItem.status as 'active' | 'sold' | 'expired',
      bids: packageItem.bids.map(bid => ({
        ...bid,
        amount: Number(bid.amount)
      }))
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="seva-container py-8">
          <PackageDetailView 
            package={packageWithNumbers}
            currentUser={session?.user || null}
            initialAction={searchParams.action}
          />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading package:', error)
    notFound()
  }
}
