
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Gavel, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export function SettleAuctionsButton() {
  const [isSettling, setIsSettling] = useState(false)
  const [result, setResult] = useState<{ settled: number; message: string } | null>(null)

  const handleSettle = async () => {
    setIsSettling(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/settle-auctions', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({ settled: data.settled, message: data.message })
        if (data.settled > 0) {
          toast.success(`Settled ${data.settled} auction(s) successfully`)
        } else {
          toast.info('No expired auctions to settle')
        }
      } else {
        toast.error(data.error || 'Failed to settle auctions')
      }
    } catch (error) {
      console.error('Error settling auctions:', error)
      toast.error('An error occurred while settling auctions')
    } finally {
      setIsSettling(false)
    }
  }

  return (
    <div>
      <Button
        onClick={handleSettle}
        disabled={isSettling}
        className="w-full bg-[#94B957] hover:bg-[#7A9941] text-white"
      >
        {isSettling ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Settling...</>
        ) : (
          <><Gavel className="w-4 h-4 mr-2" /> Settle Expired Auctions</>
        )}
      </Button>
      {result && (
        <div className="mt-3 flex items-center text-sm text-gray-600">
          <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
          {result.message}
        </div>
      )}
    </div>
  )
}
