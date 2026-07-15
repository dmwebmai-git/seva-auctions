
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { canAccessAdmin, canManageSettings, canManageUsers, canManagePackages } from '@/lib/roles'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, FileText, Users, DollarSign, TrendingUp, AlertCircle, Settings, Gavel, Plug, ListChecks, MonitorPlay, BarChart3 } from 'lucide-react'
import { SettleAuctionsButton } from '@/components/admin/settle-auctions-button'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !canAccessAdmin(session.user.role)) {
    redirect('/auth/login')
  }

  const role = session.user.role

  // Get statistics
  const [
    totalPackages,
    activePackages,
    totalUsers,
    totalBids,
    totalRevenue,
  ] = await Promise.all([
    prisma.golfPackage.count(),
    prisma.golfPackage.count({ where: { bidDeadline: { gte: new Date() } } }),
    prisma.user.count(),
    prisma.bid.count(),
    prisma.bid.aggregate({ _sum: { amount: true } }),
  ])

  const stats = [
    {
      title: 'Total Auctions',
      value: totalPackages,
      icon: Package,
      color: 'text-[#94B957]',
      bgColor: 'bg-[#94B957]/10',
      href: '/admin/packages'
    },
    {
      title: 'Active Auctions',
      value: activePackages,
      icon: TrendingUp,
      color: 'text-[#0DA354]',
      bgColor: 'bg-[#0DA354]/10',
      href: '/admin/packages'
    },
    {
      title: 'Total Users',
      value: totalUsers,
      icon: Users,
      color: 'text-[#BFA459]',
      bgColor: 'bg-[#BFA459]/10',
      href: '/admin/users'
    },
    {
      title: 'Total Bids',
      value: totalBids,
      icon: DollarSign,
      color: 'text-[#FF9A17]',
      bgColor: 'bg-[#FF9A17]/10',
      href: '/admin/bids'
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="seva-heading-xl text-[#524C4C]">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {session.user.firstName || 'Admin'}!</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Link key={stat.title} href={stat.href}>
                <Card className="seva-card hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                        <p className="text-3xl font-bold text-[#524C4C]">{stat.value}</p>
                      </div>
                      <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {canManagePackages(role) && (
          <Link href="/admin/packages">
            <Card className="seva-card hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#524C4C]">
                  <ListChecks className="w-5 h-5 text-[#94B957]" />
                  Manage Auctions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">View, edit, and remove existing auction listings</p>
              </CardContent>
            </Card>
          </Link>
          )}

          {canManagePackages(role) && (
          <Link href="/admin/demo">
            <Card className="seva-card hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#524C4C]">
                  <MonitorPlay className="w-5 h-5 text-[#FF9A17]" />
                  Demo Auctions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">Manage preview listings shown on the Auctions page with Bid &amp; Buy disabled</p>
              </CardContent>
            </Card>
          </Link>
          )}

          <Link href="/admin/packages/new">
            <Card className="seva-card hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#524C4C]">
                  <Package className="w-5 h-5 text-[#94B957]" />
                  Create New Auction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">Add a new listing to the auction platform</p>
              </CardContent>
            </Card>
          </Link>

          {canManageSettings(role) && (
          <Link href="/admin/analytics">
            <Card className="seva-card hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#524C4C]">
                  <BarChart3 className="w-5 h-5 text-[#94B957]" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">View auctions by category, bids, winning bids, popular listings, and page views</p>
              </CardContent>
            </Card>
          </Link>
          )}

          {canManageSettings(role) && (
          <Link href="/admin/settings">
            <Card className="seva-card hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#524C4C]">
                  <Settings className="w-5 h-5 text-[#94B957]" />
                  Site Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">Update Raised for Charity and homepage statistics</p>
              </CardContent>
            </Card>
          </Link>
          )}

          {canManageUsers(role) && (
          <Link href="/admin/users">
            <Card className="seva-card hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#524C4C]">
                  <Users className="w-5 h-5 text-[#94B957]" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">Create accounts and assign roles for your team</p>
              </CardContent>
            </Card>
          </Link>
          )}

          {canManageSettings(role) && (
          <Link href="/admin/terms">
            <Card className="seva-card hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#524C4C]">
                  <FileText className="w-5 h-5 text-[#BFA459]" />
                  Manage Terms & Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">Edit and update terms and conditions text</p>
              </CardContent>
            </Card>
          </Link>
          )}

          {canManageSettings(role) && (
          <Link href="/admin/content">
            <Card className="seva-card hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#524C4C]">
                  <AlertCircle className="w-5 h-5 text-[#FF9A17]" />
                  Content Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">Manage About Us, How It Works, and other pages</p>
              </CardContent>
            </Card>
          </Link>
          )}

          {canManageSettings(role) && (
          <Card className="seva-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#524C4C]">
                <Gavel className="w-5 h-5 text-[#94B957]" />
                Auction Settlement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">Close expired auctions, notify winners, and trigger payment requests</p>
              <SettleAuctionsButton />
            </CardContent>
          </Card>
          )}

          {canManageSettings(role) && (
          <Link href="/admin/integrations">
            <Card className="seva-card hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#524C4C]">
                  <Plug className="w-5 h-5 text-[#BFA459]" />
                  API Connections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">Connect to Seva Connect and other external services</p>
              </CardContent>
            </Card>
          </Link>
          )}
        </div>
      </div>
    </div>
  )
}
