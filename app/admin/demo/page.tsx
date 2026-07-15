import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { canManagePackages } from '@/lib/roles'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit, ArrowLeft, Eye } from 'lucide-react'
import Image from 'next/image'
import { resolveImageSrc } from '@/lib/image-url'
import { DeletePackageButton } from '@/components/admin/delete-package-button'

export const dynamic = 'force-dynamic'

function formatDeadline(date: Date) {
  return new Date(date).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default async function AdminDemoPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !canManagePackages(session.user.role)) {
    redirect('/auth/login')
  }

  const packages = await prisma.golfPackage.findMany({
    where: { isDemo: true },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { bids: true }
      }
    }
  })

  const now = new Date()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center text-[#94B957] hover:text-[#7A9941] mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="seva-heading-xl text-[#524C4C]">Demo Auctions</h1>
              <p className="text-gray-600 mt-2">
                Preview listings shown on the Auctions page with Bid &amp; Buy disabled. Set a future End Date so a demo appears live.
              </p>
            </div>
            <Link href="/admin/packages/new">
              <Button className="seva-button-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create New Listing
              </Button>
            </Link>
          </div>
        </div>

        {/* Demo Packages List */}
        <div className="grid gap-4">
          {packages.map((pkg) => {
            const isLive = new Date(pkg.bidDeadline) > now
            return (
              <Card key={pkg.id} className="seva-card">
                <CardContent className="p-0">
                  <div className="flex gap-4">
                    <div className="relative w-48 h-32 flex-shrink-0">
                      <Image
                        src={resolveImageSrc(pkg.imageUrl) || '/placeholder-golf.jpg'}
                        alt={pkg.title}
                        fill
                        className="object-cover rounded-l-lg"
                      />
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#FF9A17] px-2 py-0.5 rounded-full shadow-sm">
                        Demo
                      </span>
                    </div>
                    <div className="flex-1 p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-[#524C4C] mb-1">{pkg.title}</h3>
                        <p className="text-sm text-gray-600 mb-1">{pkg.category}</p>
                        <p className="text-sm text-gray-600">{pkg.courseAddress}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                          <span className="text-sm text-gray-500">Current Bid: <strong className="text-[#94B957]">${pkg.currentBid.toLocaleString()}</strong></span>
                          <span className="text-sm text-gray-500">Buy Now: <strong className="text-[#FF9A17]">${pkg.buyNowPrice.toLocaleString()}</strong></span>
                          <span className="text-sm text-gray-500">End Date: <strong>{formatDeadline(pkg.bidDeadline)}</strong></span>
                          {isLive ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#94B957]">
                              <Eye className="w-3.5 h-3.5" /> Live on Auctions page
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-gray-400">Not shown (past end date)</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/admin/packages/${pkg.id}/edit`}>
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                        </Link>
                        <DeletePackageButton packageId={pkg.id} title={pkg.title} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {packages.length === 0 && (
            <Card className="seva-card">
              <CardContent className="text-center py-12">
                <p className="text-gray-600 mb-4">No demo auctions yet</p>
                <p className="text-sm text-gray-500">
                  Turn on the &ldquo;Demo auction&rdquo; toggle when creating or editing a listing to add one here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
