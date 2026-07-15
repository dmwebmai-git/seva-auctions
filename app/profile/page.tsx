
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { ProfileView } from '@/components/profile-view'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login')
  }

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      streetAddress: true,
    }
  })

  if (!user) {
    redirect('/auth/login')
  }

  // Get saved packages with package details
  const savedPackagesData = await prisma.savedPackage.findMany({
    where: { userId: session.user.id },
    include: {
      package: {
        include: {
          _count: {
            select: { bids: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const savedPackages = savedPackagesData.map(sp => sp.package)

  // Get user's active bids
  const userBids = await prisma.bid.findMany({
    where: { 
      userId: session.user.id
    },
    include: {
      package: {
        include: {
          _count: {
            select: { bids: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Filter to only show bids on active auctions
  const activeBids = userBids.filter(bid => 
    bid.package.status === 'active' && 
    new Date(bid.package.bidDeadline) > new Date()
  )

  // Get won packages from the database
  const wonPackagesData = await prisma.wonPackage.findMany({
    where: { userId: session.user.id },
    include: {
      package: {
        include: {
          _count: {
            select: { bids: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const wonPackages = wonPackagesData.map(wp => ({
    ...wp.package,
    wonBid: Number(wp.winningBid),
    paymentStatus: wp.paymentStatus
  }))

  return (
    <ProfileView 
      user={user}
      savedPackages={savedPackages}
      wonPackages={wonPackages}
      activeBids={activeBids}
    />
  )
}
