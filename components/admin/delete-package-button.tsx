'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function DeletePackageButton({ packageId, title }: { packageId: string; title: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/packages?packageId=${encodeURIComponent(packageId)}`, {
        method: 'DELETE',
      })
      const result = await res.json()

      if (res.ok && result.success) {
        toast.success('Auction deleted successfully')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to delete auction')
      }
    } catch (error) {
      toast.error('An error occurred while deleting the auction')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      variant="outline"
      size="sm"
      className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      <Trash2 className="w-4 h-4" />
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  )
}
