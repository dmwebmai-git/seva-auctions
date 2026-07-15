
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Save } from 'lucide-react'
import { toast } from 'sonner'

export function TermsEditor({ initialContent }: { initialContent: string }) {
  const [content, setContent] = useState(initialContent)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (!response.ok) throw new Error('Failed to update terms')

      toast.success('Terms & conditions updated successfully')
      router.refresh()
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update terms & conditions')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="seva-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[#524C4C]">Edit Content</CardTitle>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="seva-button-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardHeader>
      <CardContent>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[500px] font-mono"
          placeholder="Enter terms and conditions text here..."
          disabled={isLoading}
        />
        <p className="text-sm text-gray-500 mt-2">
          This content will appear in the terms & conditions popup during user registration.
        </p>
      </CardContent>
    </Card>
  )
}
