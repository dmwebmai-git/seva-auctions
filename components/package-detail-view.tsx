
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { resolveImageSrc } from '@/lib/image-url'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Tag, 
  Trophy, 
  Clock, 
  DollarSign, 
  Heart,
  Gavel,
  ArrowLeft,
  Calendar,
  Info,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Building2
} from 'lucide-react'
import { PackageWithBids } from '@/lib/types'
import { describeAttributes } from '@/lib/categories'
import { CountdownTimer } from './countdown-timer'
import { toast } from 'sonner'
import Link from 'next/link'

interface PackageDetailViewProps {
  package: PackageWithBids
  currentUser: {
    id: string
    email?: string | null
    firstName?: string
    lastName?: string
    role?: string
  } | null
  initialAction?: string
}

export function PackageDetailView({ package: packageItem, currentUser, initialAction }: PackageDetailViewProps) {
  const [bidAmount, setBidAmount] = useState('')
  const [isPlacingBid, setIsPlacingBid] = useState(false)
  const [isBuying, setIsBuying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false) // This should come from API

  // Combined image list (main image + any additional images) for the gallery carousel
  const allImages = [packageItem.imageUrl, ...(packageItem.additionalImages || [])].filter(Boolean) as string[]
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const hasMultipleImages = allImages.length > 1
  const showPrevImage = () =>
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  const showNextImage = () =>
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length)

  const timeRemaining = new Date(packageItem.bidDeadline).getTime() - new Date().getTime()
  const isExpired = timeRemaining <= 0
  const minBidAmount = packageItem.currentBid + packageItem.bidIncrement

  const handlePlaceBid = async () => {
    if (!currentUser) {
      toast.error('Please sign in to place bids')
      return
    }

    const bid = parseFloat(bidAmount)
    if (isNaN(bid) || bid < minBidAmount) {
      toast.error(`Minimum bid is $${minBidAmount.toLocaleString()}`)
      return
    }

    setIsPlacingBid(true)
    
    try {
      const response = await fetch('/api/packages/bid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: packageItem.id,
          bidAmount: bid
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(`Bid placed successfully! You're the current high bidder at $${bid.toLocaleString()}`)
        setBidAmount('')
        // Reload the page to show updated data
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to place bid')
      }
    } catch (error) {
      toast.error('Failed to place bid')
      console.error('Bid error:', error)
    } finally {
      setIsPlacingBid(false)
    }
  }

  const handleBuyNow = async () => {
    if (!currentUser) {
      toast.error('Please sign in to purchase')
      return
    }

    setIsBuying(true)
    
    try {
      const response = await fetch('/api/packages/buy-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: packageItem.id
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Redirect to Stripe checkout
        if (result.checkoutUrl) {
          window.location.href = result.checkoutUrl
        }
      } else {
        toast.error(result.error || 'Failed to process purchase')
        setIsBuying(false)
      }
    } catch (error) {
      toast.error('Failed to process purchase')
      console.error('Buy now error:', error)
      setIsBuying(false)
    }
  }

  const handleSavePackage = async () => {
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
    <div className="max-w-7xl mx-auto">
      {/* Back button */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="text-[#94B957] hover:bg-[#94B957]/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Auctions
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Main Content - 60% */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Image Gallery */}
            <div className="seva-card overflow-hidden mb-6">
              <div className="relative aspect-[4/3] bg-gray-200">
                <Image
                  src={resolveImageSrc(allImages[currentImageIndex] || packageItem.imageUrl) || '/placeholder-golf.jpg'}
                  alt={packageItem.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 60vw"
                  priority
                />

                {/* Gallery navigation arrows */}
                {hasMultipleImages && (
                  <>
                    <button
                      type="button"
                      onClick={showPrevImage}
                      aria-label="Previous image"
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/80 hover:bg-white text-[#524C4C] shadow-md transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      type="button"
                      onClick={showNextImage}
                      aria-label="Next image"
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/80 hover:bg-white text-[#524C4C] shadow-md transition-colors"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                      {allImages.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setCurrentImageIndex(index)}
                          aria-label={`Go to image ${index + 1}`}
                          className={`h-2 rounded-full transition-all ${
                            index === currentImageIndex ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white/80'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Status badge */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {packageItem.isDemo && (
                    <Badge className="bg-[#FF9A17] hover:bg-[#FF9A17] text-sm">
                      DEMO
                    </Badge>
                  )}
                  {isExpired && (
                    <Badge variant="destructive" className="bg-red-600 text-sm">
                      EXPIRED
                    </Badge>
                  )}
                  <Badge className="bg-[#94B957] hover:bg-[#7A9941] text-sm">
                    {packageItem.category}
                  </Badge>
                </div>

                {/* Save button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-600 hover:text-red-500"
                  onClick={handleSavePackage}
                  disabled={isSaving}
                >
                  <Heart 
                    className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`}
                  />
                </Button>
              </div>
            </div>

            {/* Package Information */}
            <div className="seva-card p-6">
              <div className="mb-6">
                <h1 className="seva-heading-xl text-[#524C4C] mb-3">
                  {packageItem.title}
                </h1>
                {packageItem.subHeader && (
                  <p className="text-lg text-gray-600 mb-4">
                    {packageItem.subHeader}
                  </p>
                )}
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>{packageItem.courseAddress}</span>
                </div>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Tag className="w-6 h-6 text-[#94B957] mx-auto mb-2" />
                  <div className="font-semibold text-[#524C4C] text-sm">{packageItem.category}</div>
                  <div className="text-sm text-gray-600">Category</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-[#94B957] mx-auto mb-2" />
                  <div className="font-semibold text-[#524C4C]">${packageItem.fairMarketValue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Fair Market Value</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Gavel className="w-6 h-6 text-[#94B957] mx-auto mb-2" />
                  <div className="font-semibold text-[#524C4C]">{packageItem._count.bids}</div>
                  <div className="text-sm text-gray-600">Total Bids</div>
                </div>
              </div>

              {/* Description */}
              {packageItem.packageDetails && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#524C4C] mb-3 flex items-center">
                    <Info className="w-5 h-5 mr-2" />
                    Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {packageItem.packageDetails}
                  </p>
                </div>
              )}

              {/* Category-specific Attributes */}
              {(() => {
                const attrs = describeAttributes(packageItem.category, packageItem.attributes as Record<string, any> | null | undefined)
                if (attrs.length === 0) return null
                return (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-[#524C4C] mb-3 flex items-center">
                      <Info className="w-5 h-5 mr-2" />
                      Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {attrs.map(({ label, value }) => (
                        <div key={label} className="flex flex-col bg-gray-50 rounded-lg p-3">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
                          <span className="text-[#524C4C] font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Restrictions & Requirements */}
              {packageItem.bookingRestrictions && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#524C4C] mb-3 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Restrictions & Requirements
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {packageItem.bookingRestrictions}
                  </p>
                </div>
              )}

              {/* Supports Section */}
              {(packageItem.orgDisplay || packageItem.supportsText) && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-[#524C4C] mb-3">
                    This Auction Proudly Supports
                  </h3>
                  {packageItem.orgDisplay && (
                    <p className="text-[#524C4C] font-semibold mb-2">
                      {packageItem.orgDisplay}
                    </p>
                  )}
                  {packageItem.supportsText && (
                    <p className="text-gray-700 leading-relaxed">
                      {packageItem.supportsText}
                    </p>
                  )}
                </div>
              )}

              {/* Photo Gallery (additional images) */}
              {packageItem.additionalImages && packageItem.additionalImages.length > 0 && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-[#524C4C] mb-3 flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Photo Gallery
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {packageItem.additionalImages.map((img, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() => setCurrentImageIndex(allImages.indexOf(img))}
                        aria-label={`View photo ${index + 2}`}
                        className="relative aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#94B957] transition-all"
                      >
                        <Image
                          src={resolveImageSrc(img) || '/placeholder-golf.jpg'}
                          alt={`${packageItem.title} photo ${index + 2}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 33vw, 20vw"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Bidding Panel - 40% */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="seva-bidding-panel"
          >
            <div className="seva-card p-6">
              {/* Current Bid */}
              <div className="text-center mb-6">
                <div className="text-sm text-gray-500 uppercase tracking-wide mb-2">
                  Current High Bid
                </div>
                <div className="text-4xl font-bold text-[#524C4C] mb-2">
                  ${packageItem.currentBid.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  {packageItem._count.bids} bid{packageItem._count.bids !== 1 ? 's' : ''}
                </div>
                {(() => {
                  const sharePercent = packageItem.orgSharePercent ?? 50
                  const raised = Math.round(packageItem.currentBid * sharePercent / 100)
                  if (raised <= 0) return null
                  return (
                    <div className="mt-4 rounded-lg bg-[#94B957]/10 border border-[#94B957]/30 p-3">
                      <div className="flex items-center justify-center text-[#7A9941]">
                        <Heart className="w-4 h-4 mr-2" />
                        <span className="text-lg font-bold">${raised.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        raised for {packageItem.orgDisplay || 'the organization'} so far
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Countdown Timer */}
              {!isExpired && (
                <div className="mb-6">
                  <div className="flex items-center justify-center mb-3">
                    <Clock className="w-4 h-4 text-red-500 mr-2" />
                    <span className="text-sm font-medium text-red-600">Time Remaining</span>
                  </div>
                  <CountdownTimer deadline={new Date(packageItem.bidDeadline)} compact className="flex justify-center" />
                </div>
              )}

              {packageItem.isDemo ? (
                <div className="text-center py-6">
                  <div className="inline-flex items-center gap-2 text-white bg-[#FF9A17] px-3 py-1 rounded-full text-sm font-semibold mb-4">
                    Demo Auction
                  </div>
                  <div className="text-lg font-semibold text-[#524C4C] mb-2">
                    This is a preview listing
                  </div>
                  <p className="text-gray-600">
                    Bidding and Buy It Now are disabled for demo auctions. This item is shown to illustrate how our auctions look.
                  </p>
                </div>
              ) : !isExpired ? (
                <>
                  {/* Bidding Form */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Bid (minimum ${minBidAmount.toLocaleString()})
                      </label>
                      <Input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={minBidAmount.toString()}
                        className="seva-input text-lg font-semibold"
                        min={minBidAmount}
                        step={packageItem.bidIncrement}
                      />
                    </div>

                    <Button
                      onClick={handlePlaceBid}
                      disabled={isPlacingBid || !currentUser}
                      className="w-full seva-button-primary h-12 text-lg"
                    >
                      {isPlacingBid ? (
                        <div className="flex items-center justify-center">
                          <div className="seva-spinner mr-2"></div>
                          Placing Bid...
                        </div>
                      ) : (
                        <>
                          <Gavel className="w-5 h-5 mr-2" />
                          Place Bid
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or</span>
                    </div>
                  </div>

                  {/* Buy Now */}
                  <div className="text-center mb-6">
                    <div className="text-sm text-gray-500 uppercase tracking-wide mb-2">
                      Skip the Bidding
                    </div>
                    <div className="text-2xl font-bold text-[#FF9A17] mb-4">
                      ${packageItem.buyNowPrice.toLocaleString()}
                    </div>
                    <Button
                      onClick={handleBuyNow}
                      disabled={isBuying || !currentUser}
                      className="w-full seva-button-secondary h-12 text-lg"
                    >
                      {isBuying ? (
                        <div className="flex items-center justify-center">
                          <div className="seva-spinner mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        <>
                          <DollarSign className="w-5 h-5 mr-2" />
                          Buy It Now
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="text-2xl font-bold text-red-600 mb-2">
                    AUCTION ENDED
                  </div>
                  <div className="text-gray-600 mb-4">
                    Final bid: ${packageItem.currentBid.toLocaleString()}
                  </div>
                  {packageItem.status === 'sold' && packageItem.bids?.[0] && currentUser?.id === packageItem.bids[0].userId && (
                    <div className="mt-4">
                      <div className="bg-[#F3F7EA] rounded-lg p-4 mb-4">
                        <Trophy className="w-8 h-8 text-[#94B957] mx-auto mb-2" />
                        <p className="text-[#94B957] font-semibold">You won this auction!</p>
                      </div>
                      <Link href={`/package/${packageItem.id}/pay`}>
                        <Button className="w-full seva-button-primary h-12 text-lg">
                          <DollarSign className="w-5 h-5 mr-2" />
                          Complete Payment - ${packageItem.currentBid.toLocaleString()}
                        </Button>
                      </Link>
                    </div>
                  )}
                  {packageItem.status === 'expired' && (
                    <div className="bg-gray-100 rounded-lg p-4 mt-4">
                      <p className="text-gray-500">This auction ended with no winning bids.</p>
                    </div>
                  )}
                </div>
              )}

              {!currentUser && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 text-center">
                    <Link href="/auth/login" className="font-medium hover:underline">
                      Sign in
                    </Link>
                    {' or '}
                    <Link href="/auth/signup" className="font-medium hover:underline">
                      join Seva
                    </Link>
                    {' to place bids'}
                  </p>
                </div>
              )}

              {/* Bid History */}
              {packageItem.bids && packageItem.bids.length > 0 && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-[#524C4C] mb-4">
                    Bid History
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {packageItem.bids.map((bid, index) => (
                      <div 
                        key={bid.id} 
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          index === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            index === 0 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-[#524C4C]">
                              {bid.user?.firstName || 'Anonymous'} {bid.user?.lastName?.charAt(0) || ''}.
                              {index === 0 && currentUser?.id === bid.userId && (
                                <span className="ml-2 text-xs text-green-600 font-semibold">(You)</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(bid.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className={`font-bold ${
                          index === 0 ? 'text-green-600 text-lg' : 'text-[#524C4C]'
                        }`}>
                          ${Number(bid.amount).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Business Sponsor */}
            {(packageItem.sponsorName || packageItem.sponsorThanksText || packageItem.sponsorWebUrl || packageItem.sponsorSevaUrl) && (
              <div className="seva-card p-6 mt-6">
                <h3 className="text-lg font-semibold text-[#524C4C] mb-4 flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Business Sponsor
                </h3>
                {packageItem.sponsorName && (
                  <div className="text-[#524C4C] font-semibold mb-2">{packageItem.sponsorName}</div>
                )}
                {packageItem.sponsorThanksText && (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-3">
                    {packageItem.sponsorThanksText}
                  </p>
                )}
                <div className="space-y-2">
                  {packageItem.sponsorWebUrl && (
                    <a
                      href={packageItem.sponsorWebUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-[#94B957] hover:text-[#7A9941] font-medium"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit Website
                    </a>
                  )}
                  {packageItem.sponsorSevaUrl && (
                    <a
                      href={packageItem.sponsorSevaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-[#94B957] hover:text-[#7A9941] font-medium"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Seva Business Page
                    </a>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
