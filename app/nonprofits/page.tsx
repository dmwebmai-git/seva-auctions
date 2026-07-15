
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'

export const dynamic = "force-dynamic"

export default async function NonprofitsPage() {
  try {
    const page = await prisma.contentPage.findUnique({
      where: {
        slug: 'nonprofits'
      }
    })

    if (!page || !page.isActive) {
      notFound()
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="seva-container py-12">
          <div className="max-w-4xl mx-auto">
            <div className="seva-card p-8">
              <h1 className="seva-heading-xl text-[#524C4C] mb-8 text-center">
                {page.title}
              </h1>
              
              <div 
                className="seva-content max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading nonprofits page:', error)
    notFound()
  }
}
