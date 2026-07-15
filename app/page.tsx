
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { PackageGallery } from '@/components/package-gallery'
import { HeroSection } from '@/components/hero-section'
import { PackageFilters } from '@/components/package-filters'

export const dynamic = "force-dynamic"

interface SearchParams {
  search?: string
  state?: string
  city?: string
  minPrice?: string
  maxPrice?: string
  category?: string
  sort?: string
  page?: string
}

interface HomePageProps {
  searchParams: SearchParams
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await getServerSession(authOptions)
  
  // Parse search parameters
  const {
    search = '',
    state = '',
    city = '',
    minPrice,
    maxPrice,
    category = '',
    sort = 'ending-soon',
    page = '1'
  } = searchParams

  const currentPage = parseInt(page)
  const pageSize = 12
  const now = new Date()
  const isEnded = sort === 'ended'

  // Build where clause for filtering
  const whereClause: any = {}
  if (isEnded) {
    // Ended = purchased via Buy Now (sold) OR bidding deadline has passed.
    // Demo listings are previews only and never appear in the Ended view.
    whereClause.isDemo = false
    whereClause.OR = [
      { status: 'sold' },
      { bidDeadline: { lte: now } }
    ]
  } else {
    whereClause.status = 'active'
    whereClause.bidDeadline = { gt: now }
  }

  if (search) {
    whereClause.AND = [
      ...(whereClause.AND || []),
      {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { courseAddress: { contains: search, mode: 'insensitive' } }
        ]
      }
    ]
  }

  if (category) {
    whereClause.category = category
  }

  if (state) {
    whereClause.state = state
  }

  if (city) {
    whereClause.city = city
  }

  if (minPrice) {
    whereClause.currentBid = {
      ...whereClause.currentBid,
      gte: parseFloat(minPrice)
    }
  }

  if (maxPrice) {
    whereClause.currentBid = {
      ...whereClause.currentBid,
      lte: parseFloat(maxPrice)
    }
  }

  // Build order by clause
  let orderBy: any = {}
  switch (sort) {
    case 'newly-listed':
      orderBy = { createdAt: 'desc' }
      break
    case 'highest-bid':
      orderBy = { currentBid: 'desc' }
      break
    case 'lowest-bid':
      orderBy = { currentBid: 'asc' }
      break
    case 'ended':
      orderBy = { bidDeadline: 'desc' }
      break
    case 'ending-soon':
    default:
      orderBy = { bidDeadline: 'asc' }
      break
  }

  try {
    // Get packages with pagination
    const [packages, totalCount] = await Promise.all([
      prisma.golfPackage.findMany({
        where: whereClause,
        orderBy,
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        include: {
          bids: {
            orderBy: { amount: 'desc' },
            take: 1,
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
      }),
      prisma.golfPackage.count({ where: whereClause })
    ])

    // Get filter options
    const [states, cities, priceRange, categories] = await Promise.all([
      prisma.golfPackage.findMany({
        where: { status: 'active' },
        select: { state: true },
        distinct: ['state']
      }).then(results => results.map(r => r.state).filter(Boolean) as string[]),
      prisma.golfPackage.findMany({
        where: { status: 'active', ...(state ? { state } : {}) },
        select: { city: true },
        distinct: ['city']
      }).then(results => results.map(r => r.city).filter(Boolean) as string[]),
      prisma.golfPackage.aggregate({
        where: { status: 'active' },
        _min: { currentBid: true },
        _max: { currentBid: true }
      }).then(result => ({
        min: Number(result._min.currentBid) || 0,
        max: Number(result._max.currentBid) || 1000
      })),
      prisma.golfPackage.findMany({
        where: { status: 'active' },
        select: { category: true },
        distinct: ['category']
      }).then(results => results.map(r => r.category).filter(Boolean) as string[])
    ])

    const searchResults = {
      packages: packages.map(pkg => ({
        ...pkg,
        startingBid: Number(pkg.startingBid),
        currentBid: Number(pkg.currentBid),
        buyNowPrice: Number(pkg.buyNowPrice),
        bidIncrement: Number(pkg.bidIncrement),
        fairMarketValue: Number(pkg.fairMarketValue),
        status: pkg.status as 'active' | 'sold' | 'expired',
        bids: pkg.bids.map(bid => ({
          ...bid,
          amount: Number(bid.amount)
        }))
      })),
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage,
      filters: {
        states: states.sort(),
        cities: cities.sort(),
        priceRange,
        categories: categories.sort()
      }
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <HeroSection />
        
        <div className="seva-container py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-[17.5%]">
              <PackageFilters 
                filters={searchResults.filters}
                currentFilters={{
                  search,
                  state,
                  city,
                  minPrice: minPrice ? parseFloat(minPrice) : undefined,
                  maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
                  category: category || undefined,
                  sort: sort as any
                }}
              />
            </div>

            {/* Main Content */}
            <div className="lg:flex-1 lg:min-w-0">
              <div className="text-center mt-6 mb-8">
                <h1 className="seva-heading-lg text-[#524C4C] mb-2">
                  {isEnded ? 'Ended Auctions' : 'Auction Gallery'}
                </h1>
                <p className="text-gray-600">
                  {isEnded
                    ? `${totalCount} ended ${category || 'auction'} listing${totalCount === 1 ? '' : 's'}`
                    : `${totalCount} exclusive ${category || 'auction'} listings available`}
                </p>
              </div>

              <PackageGallery 
                searchResults={searchResults}
                currentUser={session?.user}
              />
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading packages:', error)
    return (
      <div className="min-h-screen bg-gray-50">
        <HeroSection />
        <div className="seva-container py-16 text-center">
          <div className="seva-card p-8 max-w-md mx-auto">
            <p className="text-gray-600 mb-4">
              Sorry, we're having trouble loading the auction listings.
            </p>
            <p className="text-sm text-gray-500">
              Please try again later or contact support if the problem persists.
            </p>
          </div>
        </div>
      </div>
    )
  }
}
