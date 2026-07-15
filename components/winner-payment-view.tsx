
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, CreditCard, MapPin, Users, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { resolveImageSrc } from '@/lib/image-url'
import { toast } from 'sonner'

interface WinnerPaymentViewProps {
  packageData: {
    id: string
    title: string
    subHeader: string | null
    courseAddress: string
    imageUrl: string
    winningBid: number
    category: string
  }
}

export function WinnerPaymentView({ packageData }: WinnerPaymentViewProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handlePayment = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/packages/pay-auction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: packageData.id }),
      })

      const result = await response.json()

      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      } else {
        toast.error(result.error || 'Failed to start payment')
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#94B957]/10 mb-4">
            <Trophy className="w-8 h-8 text-[#94B957]" />
          </div>
          <h1 className="text-3xl font-bold text-[#524C4C] mb-2">Congratulations!</h1>
          <p className="text-gray-600">You won this auction. Complete your payment to secure your package.</p>
        </div>

        <Card className="seva-card overflow-hidden mb-6">
          <div className="relative aspect-video bg-gray-200">
            <Image
              src={resolveImageSrc(packageData.imageUrl) || '/placeholder-golf.jpg'}
              alt={packageData.title}
              fill
              className="object-cover"
            />
          </div>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-[#524C4C] mb-2">{packageData.title}</h2>
            {packageData.subHeader && (
              <p className="text-gray-600 mb-4">{packageData.subHeader}</p>
            )}
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2 text-[#94B957]" />
                {packageData.courseAddress}
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="w-4 h-4 mr-2 text-[#94B957]" />
                {packageData.category}
              </div>
            </div>

            <div className="bg-[#F3F7EA] rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Winning Bid</span>
                <span className="text-2xl font-bold text-[#94B957]">
                  ${packageData.winningBid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isLoading}
              className="w-full bg-[#94B957] hover:bg-[#7A9941] text-white py-6 text-lg font-semibold"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><CreditCard className="w-5 h-5 mr-2" /> Pay ${packageData.winningBid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Secure payment powered by Stripe. Please complete payment within 48 hours.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
