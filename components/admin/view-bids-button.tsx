'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Gavel, Loader2, Trophy } from 'lucide-react'

type AdminBid = {
  id: string
  amount: number
  isWinning: boolean
  createdAt: string
  firstName: string | null
  lastName: string | null
  email: string | null
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ViewBidsButton({
  packageId,
  bidCount,
}: {
  packageId: string
  bidCount: number
}) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bids, setBids] = useState<AdminBid[]>([])
  const [loaded, setLoaded] = useState(false)

  const fetchBids = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/packages/${packageId}/bids`)
      if (!res.ok) {
        throw new Error('Failed to load bids')
      }
      const data = await res.json()
      setBids(data.bids || [])
      setLoaded(true)
    } catch (err) {
      setError('Unable to load bid history. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next && !loaded && !isLoading) {
      fetchBids()
    }
  }

  const displayName = (bid: AdminBid) => {
    const name = [bid.firstName, bid.lastName].filter(Boolean).join(' ').trim()
    return name || 'Unknown bidder'
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Gavel className="w-4 h-4" />
          View Bids
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#524C4C]">
            Bid History{' '}
            <span className="text-sm font-normal text-gray-500">
              ({bidCount} bid{bidCount !== 1 ? 's' : ''})
            </span>
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading bids...
          </div>
        )}

        {!isLoading && error && (
          <div className="py-8 text-center text-red-600">
            {error}
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={fetchBids}>
                Retry
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !error && loaded && bids.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No bids have been placed on this auction yet.
          </div>
        )}

        {!isLoading && !error && bids.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-2 font-medium">#</th>
                  <th className="py-2 pr-2 font-medium">Bidder</th>
                  <th className="py-2 pr-2 font-medium">Email</th>
                  <th className="py-2 pr-2 font-medium">Date</th>
                  <th className="py-2 pl-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bids.map((bid, index) => (
                  <tr
                    key={bid.id}
                    className={`border-b border-gray-100 ${
                      index === 0 ? 'bg-[#F3F7EA]' : ''
                    }`}
                  >
                    <td className="py-2 pr-2 text-gray-500">{index + 1}</td>
                    <td className="py-2 pr-2 font-medium text-[#524C4C]">
                      <span className="inline-flex items-center gap-1">
                        {index === 0 && (
                          <Trophy className="w-3.5 h-3.5 text-[#94B957]" />
                        )}
                        {displayName(bid)}
                      </span>
                    </td>
                    <td className="py-2 pr-2 text-gray-600 break-all">
                      {bid.email || '\u2014'}
                    </td>
                    <td className="py-2 pr-2 text-gray-500 whitespace-nowrap">
                      {formatDateTime(bid.createdAt)}
                    </td>
                    <td
                      className={`py-2 pl-2 text-right font-bold ${
                        index === 0 ? 'text-[#94B957]' : 'text-[#524C4C]'
                      }`}
                    >
                      ${bid.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
