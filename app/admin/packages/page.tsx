
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { canManagePackages } from '@/lib/roles'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { resolveImageSrc } from '@/lib/image-url'
import { DeletePackageButton } from '@/components/admin/delete-package-button'
import { ViewBidsButton } from '@/components/admin/view-bids-button'

export default async function AdminPackagesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !canManagePackages(session.user.role)) {
    redirect('/auth/login')
  }

  const packages = await prisma.golfPackage.findMany({
    where: { isDemo: false },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { bids: true }
      }
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <Link href="/admin" className="inline-flex items-center text-[#94B957] hover:text-[#7A9941]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="seva-heading-xl text-[#524C4C]">Manage Auctions</h1>
            <p className="text-gray-600 mt-2">Create, edit, and delete auction listings</p>
          </div>
          <Link href="/admin/packages/new">
            <Button className="seva-button-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create New Auction
            </Button>
          </Link>
        </div>

        {/* Packages List */}
        <div className="grid gap-4">
          {packages.map((pkg) => (
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
                  </div>
                  <div className="flex-1 p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-[#524C4C] mb-1">{pkg.title}</h3>
                      {pkg.subHeader && (
                        <p className="text-sm text-gray-600 mb-2">{pkg.subHeader}</p>
                      )}
                      <p className="text-sm text-gray-600">{pkg.courseAddress}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-gray-500">Current Bid: <strong className="text-[#94B957]">${pkg.currentBid.toLocaleString()}</strong></span>
                        <span className="text-sm text-gray-500">Bids: <strong>{pkg._count.bids}</strong></span>
                        <span className="text-sm text-gray-500">Buy Now: <strong className="text-[#FF9A17]">${pkg.buyNowPrice.toLocaleString()}</strong></span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <ViewBidsButton packageId={pkg.id} bidCount={pkg._count.bids} />
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
          ))}

          {packages.length === 0 && (
            <Card className="seva-card">
              <CardContent className="text-center py-12">
                <p className="text-gray-600 mb-4">No auctions yet</p>
                <Link href="/admin/packages/new">
                  <Button className="seva-button-primary">
                    Create Your First Auction
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
