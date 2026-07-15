
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
}

export function Pagination({ currentPage, totalPages, totalCount }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigate = (page: number) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (page === 1) {
      params.delete('page')
    } else {
      params.set('page', page.toString())
    }
    router.push(`/?${params.toString()}`)
  }

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  if (totalPages <= 1) return null

  const visiblePages = getVisiblePages()

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center space-x-2">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(currentPage - 1)}
          disabled={currentPage === 1}
          className="seva-button-outline"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`dots-${index}`} className="px-3 py-2 text-gray-500">
                  ...
                </span>
              )
            }

            const pageNum = page as number
            const isActive = pageNum === currentPage

            return (
              <Button
                key={pageNum}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => navigate(pageNum)}
                className={isActive ? 'seva-button-primary' : 'seva-button-outline'}
              >
                {pageNum}
              </Button>
            )
          })}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="seva-button-outline"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Results info */}
      <p className="text-sm text-gray-600">
        Page {currentPage} of {totalPages} ({totalCount} total results)
      </p>
    </div>
  )
}
