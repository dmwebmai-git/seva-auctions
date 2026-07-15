
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { redirect, notFound } from 'next/navigation'
import { WinnerPaymentView } from '@/components/winner-payment-view'

export const dynamic = 'force-dynamic'

export default async function WinnerPaymentPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=/package/${params.id}/pay`)
  }

  // Find the won package for this user
  const wonPackage = await prisma.wonPackage.findUnique({
    where: {
      userId_packageId: {
        userId: session.user.id,
        packageId: params.id,
      }
    },
    include: {
      package: true,
    }
  })

  if (!wonPackage) {
    notFound()
  }

  // If already paid, redirect to success page
  if (wonPackage.paymentStatus === 'completed') {
    redirect(`/package/${params.id}/success`)
  }

  return (
    <WinnerPaymentView
      packageData={{
        id: wonPackage.package.id,
        title: wonPackage.package.title,
        subHeader: wonPackage.package.subHeader,
        courseAddress: wonPackage.package.courseAddress,
        imageUrl: wonPackage.package.imageUrl,
        winningBid: Number(wonPackage.winningBid),
        category: wonPackage.package.category,
      }}
    />
  )
}
