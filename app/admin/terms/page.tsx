
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { canManageSettings } from '@/lib/roles'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TermsEditor } from './terms-editor'

export default async function AdminTermsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !canManageSettings(session.user.role)) {
    redirect('/auth/login')
  }

  const terms = await prisma.termsAndConditions.findFirst({
    orderBy: { updatedAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center text-[#94B957] hover:text-[#7A9941] mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="seva-heading-xl text-[#524C4C]">Terms & Conditions</h1>
          <p className="text-gray-600 mt-2">Edit and update your terms and conditions</p>
        </div>

        <TermsEditor initialContent={terms?.content || ''} />
      </div>
    </div>
  )
}
