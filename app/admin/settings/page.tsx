
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Save, ArrowLeft, DollarSign, Clock, Trophy, Users } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function SiteSettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [formData, setFormData] = useState({
    raisedForCharity: '',
    activeAuctions: '',
    premiumCourses: '',
    happyGolfers: '',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsFetching(true)
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setFormData({
          raisedForCharity: data.raisedForCharity || '',
          activeAuctions: data.activeAuctions || '',
          premiumCourses: data.premiumCourses || '',
          happyGolfers: data.happyGolfers || '',
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setIsFetching(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Settings updated successfully!')
        router.refresh()
      } else {
        toast.error('Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('An error occurred while updating settings')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center text-[#94B957] hover:text-[#7A9941] mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#94B957]/10 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-[#94B957]" />
            </div>
            <div>
              <h1 className="seva-heading-xl text-[#524C4C]">Site Settings</h1>
              <p className="text-gray-600 mt-1">Manage homepage statistics and hero section values</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="seva-card">
          <CardHeader>
            <CardTitle className="text-[#524C4C]">Homepage Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Raised for Charity */}
              <div>
                <Label htmlFor="raisedForCharity" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#FF9A17]" />
                  Raised for Charity
                </Label>
                <div className="mt-2">
                  <Input
                    id="raisedForCharity"
                    name="raisedForCharity"
                    type="text"
                    value={formData.raisedForCharity}
                    onChange={handleChange}
                    className="seva-input"
                    placeholder="e.g., $127K"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the total amount raised for charity (e.g., $127K, $1.2M)
                  </p>
                </div>
              </div>

              {/* Active Auctions */}
              <div>
                <Label htmlFor="activeAuctions" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF9A17]" />
                  Active Auctions
                </Label>
                <div className="mt-2">
                  <Input
                    id="activeAuctions"
                    name="activeAuctions"
                    type="text"
                    value={formData.activeAuctions}
                    onChange={handleChange}
                    className="seva-input"
                    placeholder="e.g., 48"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the number of active auctions
                  </p>
                </div>
              </div>

              {/* Premium Courses */}
              <div>
                <Label htmlFor="premiumCourses" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#FF9A17]" />
                  Exclusive Listings
                </Label>
                <div className="mt-2">
                  <Input
                    id="premiumCourses"
                    name="premiumCourses"
                    type="text"
                    value={formData.premiumCourses}
                    onChange={handleChange}
                    className="seva-input"
                    placeholder="e.g., 95+"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the number of exclusive listings (can include + for 95+)
                  </p>
                </div>
              </div>

              {/* Happy Bidders */}
              <div>
                <Label htmlFor="happyGolfers" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#FF9A17]" />
                  Happy Bidders
                </Label>
                <div className="mt-2">
                  <Input
                    id="happyGolfers"
                    name="happyGolfers"
                    type="text"
                    value={formData.happyGolfers}
                    onChange={handleChange}
                    className="seva-input"
                    placeholder="e.g., 2.3K"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the number of happy bidders (e.g., 2.3K, 5K)
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="seva-button-primary"
                  disabled={isLoading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Settings'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
