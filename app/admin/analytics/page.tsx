import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { canManageSettings } from '@/lib/roles'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  Package,
  TrendingUp,
  Gavel,
  Users,
  Eye,
  Trophy,
  BarChart3,
  Tag,
  Heart,
} from 'lucide-react'
import {
  CategoryBarChart,
  CategoryPieChart,
  PricePointsChart,
  FundsRaisedChart,
} from '@/components/admin/analytics-charts'

export const dynamic = 'force-dynamic'

function money(value: number) {
  return `$${Math.round(value).toLocaleString()}`
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !canManageSettings(session.user.role)) {
    redirect('/auth/login')
  }

  const nonDemo = { isDemo: false }

  const [
    totalAuctions,
    activeAuctions,
    totalBids,
    distinctBidders,
    viewsAgg,
    priceAgg,
    wonAgg,
    categoryCounts,
    categorySums,
    topByBids,
    topByViews,
    activeForFunds,
    wonForFunds,
  ] = await Promise.all([
    prisma.golfPackage.count({ where: nonDemo }),
    prisma.golfPackage.count({ where: { ...nonDemo, bidDeadline: { gte: new Date() }, status: 'active' } }),
    prisma.bid.count(),
    prisma.bid.groupBy({ by: ['userId'] }),
    prisma.golfPackage.aggregate({ where: nonDemo, _sum: { viewCount: true } }),
    prisma.golfPackage.aggregate({
      where: nonDemo,
      _avg: { currentBid: true, fairMarketValue: true, buyNowPrice: true },
      _min: { currentBid: true },
      _max: { currentBid: true },
    }),
    prisma.wonPackage.aggregate({ _sum: { winningBid: true }, _avg: { winningBid: true }, _count: true }),
    prisma.golfPackage.groupBy({ by: ['category'], where: nonDemo, _count: { _all: true } }),
    prisma.golfPackage.groupBy({
      by: ['category'],
      where: nonDemo,
      _sum: { totalBids: true, viewCount: true },
    }),
    prisma.golfPackage.findMany({
      where: nonDemo,
      orderBy: { totalBids: 'desc' },
      take: 8,
      select: { id: true, title: true, totalBids: true, category: true, currentBid: true },
    }),
    prisma.golfPackage.findMany({
      where: nonDemo,
      orderBy: { viewCount: 'desc' },
      take: 8,
      select: { id: true, title: true, viewCount: true, category: true },
    }),
    prisma.golfPackage.findMany({
      where: { ...nonDemo, bidDeadline: { gte: new Date() }, status: 'active' },
      select: { category: true, currentBid: true, orgSharePercent: true },
    }),
    prisma.wonPackage.findMany({
      select: {
        winningBid: true,
        package: { select: { category: true, orgSharePercent: true, isDemo: true } },
      },
    }),
  ])

  const totalViews = viewsAgg._sum.viewCount || 0
  const uniqueBidders = distinctBidders.length
  const wonCount = wonAgg._count || 0
  const wonTotal = Number(wonAgg._sum.winningBid || 0)
  const wonAvg = Number(wonAgg._avg.winningBid || 0)

  // Chart data
  const categoryBarData = categoryCounts
    .map((c: { category: string; _count: { _all: number } }) => ({ name: c.category, count: c._count._all }))
    .sort((a, b) => b.count - a.count)

  const bidsByCategory = categorySums
    .map((c: { category: string; _sum: { totalBids: number | null; viewCount: number | null } }) => ({ name: c.category, value: c._sum.totalBids || 0 }))
    .sort((a, b) => b.value - a.value)

  // Funds raised for organizations, by category (realized from won + in-progress from active)
  const fundsMap: Record<string, { realized: number; inProgress: number }> = {}
  for (const p of activeForFunds) {
    const share = p.orgSharePercent ?? 50
    const amt = Number(p.currentBid) * share / 100
    if (!fundsMap[p.category]) fundsMap[p.category] = { realized: 0, inProgress: 0 }
    fundsMap[p.category].inProgress += amt
  }
  for (const w of wonForFunds) {
    if (!w.package || w.package.isDemo) continue
    const share = w.package.orgSharePercent ?? 50
    const amt = Number(w.winningBid) * share / 100
    const cat = w.package.category
    if (!fundsMap[cat]) fundsMap[cat] = { realized: 0, inProgress: 0 }
    fundsMap[cat].realized += amt
  }
  const fundsByCategoryData = Object.entries(fundsMap)
    .map(([name, v]) => ({ name, realized: Math.round(v.realized), inProgress: Math.round(v.inProgress) }))
    .sort((a, b) => (b.realized + b.inProgress) - (a.realized + a.inProgress))
  const totalRealizedFunds = fundsByCategoryData.reduce((s, d) => s + d.realized, 0)
  const totalInProgressFunds = fundsByCategoryData.reduce((s, d) => s + d.inProgress, 0)

  const pricePointsData = [
    { name: 'Avg Current Bid', value: Number(priceAgg._avg.currentBid || 0) },
    { name: 'Avg Winning Bid', value: wonAvg },
    { name: 'Avg Fair Mkt Value', value: Number(priceAgg._avg.fairMarketValue || 0) },
    { name: 'Avg Buy Now Price', value: Number(priceAgg._avg.buyNowPrice || 0) },
  ]

  // Most popular categories table (by bids, then views)
  const popularCategories = categorySums
    .map((c: { category: string; _sum: { totalBids: number | null; viewCount: number | null } }) => ({
      category: c.category,
      bids: c._sum.totalBids || 0,
      views: c._sum.viewCount || 0,
    }))
    .sort((a, b) => b.bids - a.bids || b.views - a.views)
    .slice(0, 8)

  const summaryCards = [
    { title: 'Total Auctions', value: totalAuctions.toLocaleString(), icon: Package, color: 'text-[#94B957]', bg: 'bg-[#94B957]/10' },
    { title: 'Active Auctions', value: activeAuctions.toLocaleString(), icon: TrendingUp, color: 'text-[#0DA354]', bg: 'bg-[#0DA354]/10' },
    { title: 'Total Bids', value: totalBids.toLocaleString(), icon: Gavel, color: 'text-[#FF9A17]', bg: 'bg-[#FF9A17]/10' },
    { title: 'Unique Bidders', value: uniqueBidders.toLocaleString(), icon: Users, color: 'text-[#BFA459]', bg: 'bg-[#BFA459]/10' },
    { title: 'Page Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-[#524C4C]', bg: 'bg-gray-200' },
    { title: 'Auctions Won', value: `${wonCount.toLocaleString()}`, icon: Trophy, color: 'text-[#94B957]', bg: 'bg-[#94B957]/10' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-[#94B957] hover:text-[#7A9941] text-sm font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="seva-heading-xl text-[#524C4C] flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-[#94B957]" />
            Analytics
          </h1>
          <p className="text-gray-600 mt-2">
            Performance overview across all live auctions. Demo listings are excluded.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {summaryCards.map((c) => {
            const Icon = c.icon
            return (
              <Card key={c.title} className="seva-card">
                <CardContent className="p-4">
                  <div className={`${c.bg} ${c.color} w-9 h-9 rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-[#524C4C]">{c.value}</p>
                  <p className="text-xs text-gray-600 mt-1">{c.title}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Winning bids value banner */}
        <Card className="seva-card mb-8">
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#94B957]/10 text-[#94B957] w-11 h-11 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Winning Bid Value</p>
                <p className="text-3xl font-bold text-[#524C4C]">{money(wonTotal)}</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-[#524C4C]">{money(wonAvg)}</span> average per won auction
            </div>
          </CardContent>
        </Card>

        {/* Funds raised for organizations */}
        <Card className="seva-card mb-8">
          <CardHeader>
            <CardTitle className="text-lg text-[#524C4C] flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#0DA354]" />
              Funds Raised for Organizations by Category
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Based on each auction's organization share. Realized reflects won auctions; in-progress reflects the current high bid on active auctions.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#0DA354]/10 rounded-lg p-4">
                <p className="text-xs text-gray-600">Realized (won)</p>
                <p className="text-2xl font-bold text-[#0DA354]">{money(totalRealizedFunds)}</p>
              </div>
              <div className="bg-[#FF9A17]/10 rounded-lg p-4">
                <p className="text-xs text-gray-600">In progress (active)</p>
                <p className="text-2xl font-bold text-[#FF9A17]">{money(totalInProgressFunds)}</p>
              </div>
              <div className="bg-[#94B957]/10 rounded-lg p-4">
                <p className="text-xs text-gray-600">Combined potential</p>
                <p className="text-2xl font-bold text-[#94B957]">{money(totalRealizedFunds + totalInProgressFunds)}</p>
              </div>
            </div>
            <FundsRaisedChart data={fundsByCategoryData} />
          </CardContent>
        </Card>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="seva-card">
            <CardHeader>
              <CardTitle className="text-lg text-[#524C4C] flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#94B957]" />
                Auctions by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryBarChart data={categoryBarData} />
            </CardContent>
          </Card>

          <Card className="seva-card">
            <CardHeader>
              <CardTitle className="text-lg text-[#524C4C] flex items-center gap-2">
                <Gavel className="w-5 h-5 text-[#FF9A17]" />
                Bids by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryPieChart data={bidsByCategory} />
            </CardContent>
          </Card>
        </div>

        {/* Price points */}
        <Card className="seva-card mb-8">
          <CardHeader>
            <CardTitle className="text-lg text-[#524C4C] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#BFA459]" />
              Price Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PricePointsChart data={pricePointsData} />
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Lowest Current Bid</p>
                <p className="font-semibold text-[#524C4C]">{money(Number(priceAgg._min.currentBid || 0))}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Highest Current Bid</p>
                <p className="font-semibold text-[#524C4C]">{money(Number(priceAgg._max.currentBid || 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tables row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Most popular auctions by bids */}
          <Card className="seva-card">
            <CardHeader>
              <CardTitle className="text-lg text-[#524C4C]">Most Popular Auctions (by Bids)</CardTitle>
            </CardHeader>
            <CardContent>
              {topByBids.length === 0 ? (
                <p className="text-sm text-gray-500">No auctions yet.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {topByBids.map((p, i) => (
                    <Link
                      key={p.id}
                      href={`/package/${p.id}`}
                      className="flex items-center justify-between py-2.5 hover:bg-gray-50 rounded px-1 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-semibold text-gray-400 w-5">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#524C4C] truncate">{p.title}</p>
                          <p className="text-xs text-gray-500">{p.category}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-[#94B957] whitespace-nowrap ml-2">
                        {p.totalBids} bids
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most viewed auctions */}
          <Card className="seva-card">
            <CardHeader>
              <CardTitle className="text-lg text-[#524C4C]">Most Viewed Auctions</CardTitle>
            </CardHeader>
            <CardContent>
              {topByViews.length === 0 || topByViews.every((p) => p.viewCount === 0) ? (
                <p className="text-sm text-gray-500">No page views recorded yet.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {topByViews.map((p, i) => (
                    <Link
                      key={p.id}
                      href={`/package/${p.id}`}
                      className="flex items-center justify-between py-2.5 hover:bg-gray-50 rounded px-1 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-semibold text-gray-400 w-5">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#524C4C] truncate">{p.title}</p>
                          <p className="text-xs text-gray-500">{p.category}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-[#FF9A17] whitespace-nowrap ml-2 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {p.viewCount}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Most popular categories table */}
        <Card className="seva-card">
          <CardHeader>
            <CardTitle className="text-lg text-[#524C4C]">Most Popular Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {popularCategories.length === 0 ? (
              <p className="text-sm text-gray-500">No category data yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="py-2 font-medium">Category</th>
                      <th className="py-2 font-medium text-right">Total Bids</th>
                      <th className="py-2 font-medium text-right">Page Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {popularCategories.map((c) => (
                      <tr key={c.category} className="border-b border-gray-50 last:border-0">
                        <td className="py-2.5 text-[#524C4C] font-medium">{c.category}</td>
                        <td className="py-2.5 text-right text-[#94B957] font-semibold">{c.bids}</td>
                        <td className="py-2.5 text-right text-gray-600">{c.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
