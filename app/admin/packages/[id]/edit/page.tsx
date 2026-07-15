import { getServerSession } from 'next-auth/next'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { canManagePackages } from '@/lib/roles'
import { prisma } from '@/lib/db'
import { EditPackageForm } from '@/components/admin/edit-package-form'

export const dynamic = 'force-dynamic'

export default async function EditPackagePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user || !canManagePackages(session.user.role)) {
    redirect('/auth/login')
  }

  const pkg = await prisma.golfPackage.findUnique({
    where: { id: params.id },
  })

  if (!pkg) {
    notFound()
  }

  const initialData = {
    id: pkg.id,
    title: pkg.title,
    subHeader: pkg.subHeader ?? '',
    courseAddress: pkg.courseAddress,
    startingBid: pkg.startingBid.toString(),
    buyNowPrice: pkg.buyNowPrice.toString(),
    bidIncrement: pkg.bidIncrement.toString(),
    fairMarketValue: pkg.fairMarketValue.toString(),
    packageDetails: pkg.packageDetails ?? '',
    bookingRestrictions: pkg.bookingRestrictions ?? '',
    supportsText: pkg.supportsText ?? '',
    orgDisplay: pkg.orgDisplay ?? '',
    orgSharePercent: (pkg.orgSharePercent ?? 50).toString(),
    sponsorName: pkg.sponsorName ?? '',
    sponsorThanksText: pkg.sponsorThanksText ?? '',
    sponsorWebUrl: pkg.sponsorWebUrl ?? '',
    sponsorSevaUrl: pkg.sponsorSevaUrl ?? '',
    state: pkg.state ?? '',
    city: pkg.city ?? '',
    zipCode: pkg.zipCode ?? '',
    category: pkg.category,
    isDemo: pkg.isDemo,
    bidDeadline: pkg.bidDeadline ? new Date(pkg.bidDeadline).toISOString().slice(0, 16) : '',
    attributes: (pkg.attributes as Record<string, string> | null) ?? {},
    imageUrl: pkg.imageUrl,
    additionalImages: pkg.additionalImages ?? [],
    supportsImages: pkg.supportsImages ?? [],
    supportsLinks: pkg.supportsLinks ?? [],
  }

  return <EditPackageForm initialData={initialData} />
}
