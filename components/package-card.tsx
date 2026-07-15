
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  MapPin, 
  DollarSign, 
  Heart,
  Tag,
  Gavel
} from 'lucide-react'
import { PackageWithBids } from '@/lib/types'
import { CountdownTimer } from './countdown-timer'
import { resolveImageSrc } from '@/lib/image-url'
import { toast } from 'sonner'

interface PackageCardProps {
  package: PackageWithBids
  currentUser?: {
    id: string
    email?: string | null
    firstName?: string
    lastName?: string
    role?: string
  } | null
}

export function PackageCard({ package: packageItem, currentUser }: PackageCardProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false) // This should come from the database
  const [imageFailed, setImageFailed] = useState(false)

  const timeRemaining = new Date(packageItem.bidDeadline).getTime() - new Date().getTime()
  const isExpired = timeRemaining <= 0
  const isEnded = isExpired || packageItem.status === 'sold'

  const resolvedSrc = resolveImageSrc(packageItem.imageUrl)
  const imageSrc = !imageFailed && resolvedSrc ? resolvedSrc : '/placeholder-golf.jpg'

  const handleSavePackage = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!currentUser) {
      toast.error('Please sign in to save auctions')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/packages/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: packageItem.id
        })
      })

      if (response.ok) {
        setIsSaved(!isSaved)
        toast.success(isSaved ? 'Auction removed from saved' : 'Auction saved')
      } else {
        throw new Error('Failed to save package')
      }
    } catch (error) {
      toast.error('Failed to save auction')
      console.error('Save package error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Link href={`/package/${packageItem.id}`}>
      <motion.div 
        className="seva-card overflow-hidden group cursor-pointer h-full flex flex-col"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        {/* Image */}
        <div className="relative w-full aspect-[4/3] bg-gray-200 flex-shrink-0 overflow-hidden">
          <Image
            src={imageSrc}
            alt={packageItem.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"
            onError={() => setImageFailed(true)}
          />

          {/* Demo + Category tags (upper-left, side by side) */}
          <div className="absolute top-3 left-3 flex flex-row items-center gap-2">
            {packageItem.isDemo && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#FF9A17] px-2.5 py-1 rounded-full shadow-sm">
                Demo
              </span>
            )}
            {packageItem.category && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-white bg-[#94B957] px-2.5 py-1 rounded-full shadow-sm">
                <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{packageItem.category}</span>
              </span>
            )}
          </div>

          {/* Save button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-600 hover:text-red-500 transition-colors h-6 w-6"
            onClick={handleSavePackage}
            disabled={isSaving}
          >
            <Heart 
              className={`w-3 h-3 ${isSaved ? 'fill-red-500 text-red-500' : ''}`}
            />
          </Button>

          {/* Supports badge */}
          {(packageItem.orgDisplay || packageItem.supportsText) && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className="bg-black/70 text-white text-xs px-2 py-1 rounded text-center">
                {packageItem.orgDisplay || 'Supports Charity'}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1 min-w-0">
          {/* Time remaining — centered, above title (hidden once ended) */}
          {isEnded ? (
            <div className="flex items-center justify-center mb-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                Ended
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-end flex-wrap gap-x-2 mb-2">
              <span className="inline-flex items-center text-xs text-red-600 font-medium">
                <Clock className="w-3.5 h-3.5 mr-1" />
                Ends
              </span>
              <CountdownTimer deadline={new Date(packageItem.bidDeadline)} inline />
            </div>
          )}

          {/* Title and location */}
          <div className="mb-4">
            <h3 className="font-semibold text-lg text-[#524C4C] mb-1 line-clamp-2 group-hover:text-[#94B957] transition-colors">
              {packageItem.title}
            </h3>
            {packageItem.subHeader && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                {packageItem.subHeader}
              </p>
            )}
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="line-clamp-1">{packageItem.courseAddress}</span>
            </div>
          </div>

          {/* Bidding info */}
          <div className="border-t border-gray-100 pt-4 mt-auto">
            {isEnded ? (
              <>
                <div className="flex flex-col items-center text-center mb-3">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    {packageItem.status === 'sold' ? 'Final Price' : 'Winning Bid'}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 text-[#94B957]" />
                    <span className="text-lg font-semibold text-[#524C4C]">
                      {packageItem.currentBid.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="w-full text-center text-sm font-semibold text-gray-600 bg-gray-100 rounded-md py-2">
                  Ended
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Current Bid
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 text-[#94B957]" />
                      <span className="text-lg font-semibold text-[#524C4C]">
                        {packageItem.currentBid.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Buy Now
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 text-[#FF9A17]" />
                      <span className="text-lg font-semibold text-[#FF9A17]">
                        {packageItem.buyNowPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                {packageItem.isDemo ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      className="text-sm bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200"
                      disabled
                      onClick={(e) => e.preventDefault()}
                    >
                      <Gavel className="w-4 h-4 mr-1" />
                      Bid Now
                    </Button>
                    <Button
                      className="text-sm bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200"
                      disabled
                      onClick={(e) => e.preventDefault()}
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Buy Now
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      className="seva-button-primary text-sm"
                      onClick={(e) => {
                        e.preventDefault()
                        // Navigate to package detail page for bidding
                        window.location.href = `/package/${packageItem.id}`
                      }}
                    >
                      <Gavel className="w-4 h-4 mr-1" />
                      Bid Now
                    </Button>
                    
                    <Button 
                      className="seva-button-secondary text-sm"
                      onClick={(e) => {
                        e.preventDefault()
                        // Navigate to package detail page for buy now
                        window.location.href = `/package/${packageItem.id}?action=buy-now`
                      }}
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Buy Now
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}