
'use client'

import { motion } from 'framer-motion'
import { PackageCard } from './package-card'
import { Pagination } from './pagination'
import { SearchResult } from '@/lib/types'
import { Trophy } from 'lucide-react'

interface PackageGalleryProps {
  searchResults: SearchResult
  currentUser?: {
    id: string
    email?: string | null
    firstName?: string
    lastName?: string
    role?: string
  } | null
}

export function PackageGallery({ searchResults, currentUser }: PackageGalleryProps) {
  const { packages, totalCount, totalPages, currentPage } = searchResults

  if (packages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="seva-card p-8 max-w-md mx-auto">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No auctions found
          </h3>
          <p className="text-gray-500 text-sm">
            Try adjusting your filters or search terms to find auctions.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div id="packages">
      {/* Results info */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-600">
          Showing {((currentPage - 1) * 12) + 1}-{Math.min(currentPage * 12, totalCount)} of {totalCount} results
        </p>
      </div>

      {/* Package Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="seva-package-grid mb-8"
      >
        {packages.map((packageItem, index) => (
          <motion.div
            key={packageItem.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.1,
              ease: "easeOut" 
            }}
          >
            <PackageCard 
              package={packageItem}
              currentUser={currentUser}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
          />
        </div>
      )}
    </div>
  )
}
