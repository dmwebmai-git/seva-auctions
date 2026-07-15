
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, MapPin, Users, Trophy, Calendar, Mail, Home } from 'lucide-react'

export const dynamic = "force-dynamic"

interface SuccessPageProps {
  params: {
    id: string
  }
  searchParams: {
    session_id?: string
  }
}

export default async function SuccessPage({ params, searchParams }: SuccessPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  // Verify the purchase exists
  const wonPackage = await prisma.wonPackage.findFirst({
    where: {
      packageId: params.id,
      userId: session.user.id
    },
    include: {
      package: true
    }
  })

  if (!wonPackage) {
    notFound()
  }

  const packageItem = wonPackage.package

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="seva-heading-xl text-[#524C4C] mb-2">
            Purchase Successful!
          </h1>
          <p className="text-lg text-gray-600">
            Congratulations on your purchase
          </p>
        </div>

        {/* Package Details Card */}
        <Card className="seva-card mb-6">
          <CardHeader>
            <CardTitle className="text-[#524C4C]">Auction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg text-[#524C4C] mb-2">
                {packageItem.title}
              </h3>
              {packageItem.subHeader && (
                <p className="text-gray-600 mb-3">{packageItem.subHeader}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-[#94B957] mr-2 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Location</div>
                  <div className="text-sm text-gray-600">{packageItem.courseAddress}</div>
                </div>
              </div>

              <div className="flex items-start">
                <Trophy className="w-5 h-5 text-[#94B957] mr-2 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Category</div>
                  <div className="text-sm text-gray-600">{packageItem.category}</div>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-[#94B957] mr-2 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Purchase Price</div>
                  <div className="text-sm text-gray-600 font-semibold">
                    ${Number(wonPackage.winningBid).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps Card */}
        <Card className="seva-card mb-6">
          <CardHeader>
            <CardTitle className="text-[#524C4C]">Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-[#94B957] mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-700 mb-1">Check Your Email</div>
                <p className="text-sm text-gray-600">
                  A confirmation email with your receipt has been sent to {session.user.email}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Calendar className="w-5 h-5 text-[#94B957] mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-700 mb-1">Booking Instructions</div>
                <p className="text-sm text-gray-600">
                  {packageItem.bookingRestrictions || 
                    'Please contact the provider directly to redeem your purchase. Present your confirmation email when booking.'}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <Home className="w-5 h-5 text-[#94B957] mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-700 mb-1">View Your Auctions</div>
                <p className="text-sm text-gray-600">
                  Access your purchased auctions anytime from your profile page
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/profile">
            <Button className="seva-button-primary w-full sm:w-auto">
              View My Profile
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              Browse More Packages
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
