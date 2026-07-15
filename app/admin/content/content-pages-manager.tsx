
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RichTextEditor } from '@/components/admin/rich-text-editor'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Save, FileText } from 'lucide-react'
import { toast } from 'sonner'
import type { ContentPage } from '@prisma/client'

export function ContentPagesManager({ pages }: { pages: ContentPage[] }) {
  const [selectedPage, setSelectedPage] = useState<ContentPage | null>(pages[0] || null)
  const [content, setContent] = useState(selectedPage?.content || '')
  const [isActive, setIsActive] = useState(selectedPage?.isActive || false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handlePageSelect = (page: ContentPage) => {
    setSelectedPage(page)
    setContent(page.content)
    setIsActive(page.isActive)
  }

  const handleSave = async () => {
    if (!selectedPage) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/content/${selectedPage.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, isActive })
      })

      if (!response.ok) throw new Error('Failed to update content')

      toast.success('Content page updated successfully')
      router.refresh()
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update content page')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Page List */}
      <div className="lg:col-span-1">
        <Card className="seva-card">
          <CardHeader>
            <CardTitle className="text-[#524C4C]">Pages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => handlePageSelect(page)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-2 ${
                  selectedPage?.id === page.id
                    ? 'bg-[#94B957] text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                {page.title}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Editor */}
      <div className="lg:col-span-3">
        {selectedPage ? (
          <Card className="seva-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-[#524C4C]">{selectedPage.title}</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="active" className="text-sm">
                    {isActive ? 'Active' : 'Inactive'}
                  </Label>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="seva-button-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <RichTextEditor value={content} onChange={setContent} />
              <p className="text-sm text-gray-500 mt-2">
                {isActive 
                  ? `This page is currently active and visible at /${selectedPage.slug}`
                  : 'This page is currently inactive and not visible to users'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="seva-card">
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select a page to edit</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
