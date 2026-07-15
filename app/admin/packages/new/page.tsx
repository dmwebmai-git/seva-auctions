
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Upload, X, Plus } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { CATEGORIES, getCategory } from '@/lib/categories'

export default function NewPackagePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [category, setCategory] = useState<string>('Golf & Country Club')
  const [isDemo, setIsDemo] = useState<boolean>(false)
  const [attributes, setAttributes] = useState<Record<string, string>>({})
  const activeCategory = getCategory(category)

  const handleAttributeChange = (key: string, value: string) => {
    setAttributes(prev => ({ ...prev, [key]: value }))
  }
  
  const [formData, setFormData] = useState({
    title: '',
    subHeader: '',
    courseAddress: '',
    startingBid: '',
    buyNowPrice: '',
    bidIncrement: '',
    bidDuration: '168', // 7 days default
    packageDetails: '',
    bookingRestrictions: '',
    fairMarketValue: '',
    orgDisplay: '',
    supportsText: '',
    orgSharePercent: '50',
    sponsorName: '',
    sponsorThanksText: '',
    sponsorWebUrl: '',
    sponsorSevaUrl: '',
    state: '',
    city: '',
    zipCode: '',
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([])
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([])
  const [supportImageFiles, setSupportImageFiles] = useState<File[]>([])
  const [supportImagePreviews, setSupportImagePreviews] = useState<string[]>([])
  const [supportsLinks, setSupportsLinks] = useState<string[]>([''])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setAdditionalImageFiles(prev => [...prev, ...files])
      
      files.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setAdditionalImagePreviews(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeAdditionalImage = (index: number) => {
    setAdditionalImageFiles(prev => prev.filter((_, i) => i !== index))
    setAdditionalImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSupportImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setSupportImageFiles(prev => [...prev, ...files])
      
      files.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setSupportImagePreviews(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeSupportImage = (index: number) => {
    setSupportImageFiles(prev => prev.filter((_, i) => i !== index))
    setSupportImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const addSupportLink = () => {
    setSupportsLinks(prev => [...prev, ''])
  }

  const updateSupportLink = (index: number, value: string) => {
    setSupportsLinks(prev => prev.map((link, i) => i === index ? value : link))
  }

  const removeSupportLink = (index: number) => {
    setSupportsLinks(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!imageFile) {
      toast.error('Main image is required')
      return
    }

    setIsLoading(true)

    try {
      const submitFormData = new FormData()
      
      // Add all text fields
      Object.entries(formData).forEach(([key, value]) => {
        submitFormData.append(key, value)
      })

      // Add category + category-specific attributes
      submitFormData.append('category', category)
      submitFormData.append('isDemo', String(isDemo))
      submitFormData.append('attributes', JSON.stringify(attributes))

      // Add main image
      submitFormData.append('imageFile', imageFile)

      // Add additional images
      additionalImageFiles.forEach((file, index) => {
        submitFormData.append(`additionalImageFile_${index}`, file)
      })

      // Add support images
      supportImageFiles.forEach((file, index) => {
        submitFormData.append(`supportImageFile_${index}`, file)
      })

      // Add support links (filter out empty ones)
      const validLinks = supportsLinks.filter(link => link.trim() !== '')
      submitFormData.append('supportsLinks', JSON.stringify(validLinks))

      const response = await fetch('/api/admin/packages', {
        method: 'POST',
        body: submitFormData,
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Auction created successfully')
        router.push('/admin/packages')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to create auction')
      }
    } catch (error) {
      console.error('Error creating package:', error)
      toast.error('An error occurred while creating the auction')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/packages" className="inline-flex items-center text-[#94B957] hover:text-[#7A9941] mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Auctions
          </Link>
          <h1 className="seva-heading-xl text-[#524C4C]">Create New Listing</h1>
          <p className="text-gray-600 mt-2">Add a new item to the auction platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="seva-card">
            <CardHeader>
              <CardTitle className="text-[#524C4C]">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={(value) => { setCategory(value); setAttributes({}) }}>
                  <SelectTrigger className="seva-input bg-white">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.slug} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activeCategory && (
                  <p className="text-xs text-gray-500 mt-1">{activeCategory.tagline}</p>
                )}
              </div>

              <div>
                <Label htmlFor="title">Listing Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="seva-input"
                  placeholder="e.g., 7-Night Maldives Overwater Villa Escape"
                  required
                />
              </div>

              <div>
                <Label htmlFor="subHeader">Sub Header</Label>
                <Input
                  id="subHeader"
                  name="subHeader"
                  value={formData.subHeader}
                  onChange={handleChange}
                  className="seva-input"
                  placeholder="Optional subtitle or tagline"
                />
              </div>

              <div>
                <Label htmlFor="courseAddress">Location *</Label>
                <Input
                  id="courseAddress"
                  name="courseAddress"
                  value={formData.courseAddress}
                  onChange={handleChange}
                  className="seva-input"
                  placeholder="Address, city, or 'Ships nationwide'"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="seva-input"
                    placeholder="e.g., California"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="seva-input"
                    placeholder="e.g., Pebble Beach"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="seva-input"
                  placeholder="e.g., 93953"
                />
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="seva-card">
            <CardHeader>
              <CardTitle className="text-[#524C4C]">Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Main Image */}
              <div>
                <Label htmlFor="mainImage">Main Auction Image *</Label>
                <div className="mt-2">
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview('')
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#94B957]">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Click to upload main image</span>
                      <input
                        id="mainImage"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleMainImageChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Additional Images */}
              <div>
                <Label htmlFor="additionalImages">Additional Auction Images</Label>
                <div className="mt-2 space-y-4">
                  {additionalImagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {additionalImagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={preview} 
                            alt={`Additional ${index + 1}`} 
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeAdditionalImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#94B957]">
                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-sm text-gray-500">Add more images</span>
                    <input
                      id="additionalImages"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleAdditionalImagesChange}
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Bidding */}
          <Card className="seva-card">
            <CardHeader>
              <CardTitle className="text-[#524C4C]">Pricing & Bidding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startingBid">Starting Bid ($) *</Label>
                  <Input
                    id="startingBid"
                    name="startingBid"
                    type="number"
                    step="0.01"
                    value={formData.startingBid}
                    onChange={handleChange}
                    className="seva-input"
                    placeholder="e.g., 500.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="buyNowPrice">Buy Now Price ($) *</Label>
                  <Input
                    id="buyNowPrice"
                    name="buyNowPrice"
                    type="number"
                    step="0.01"
                    value={formData.buyNowPrice}
                    onChange={handleChange}
                    className="seva-input"
                    placeholder="e.g., 1500.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bidIncrement">Bid Increment ($) *</Label>
                  <Input
                    id="bidIncrement"
                    name="bidIncrement"
                    type="number"
                    step="0.01"
                    value={formData.bidIncrement}
                    onChange={handleChange}
                    className="seva-input"
                    placeholder="e.g., 50.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="bidDuration">Bid Duration (hours) *</Label>
                  <Input
                    id="bidDuration"
                    name="bidDuration"
                    type="number"
                    value={formData.bidDuration}
                    onChange={handleChange}
                    className="seva-input"
                    placeholder="e.g., 168 (7 days)"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fairMarketValue">Fair Market Value ($) *</Label>
                <Input
                  id="fairMarketValue"
                  name="fairMarketValue"
                  type="number"
                  step="0.01"
                  value={formData.fairMarketValue}
                  onChange={handleChange}
                  className="seva-input"
                  placeholder="e.g., 2000.00"
                  required
                />
              </div>

              <div className="flex items-start justify-between rounded-lg border border-gray-200 p-4 bg-amber-50/40">
                <div className="pr-4">
                  <Label htmlFor="isDemo" className="text-[#524C4C]">Demo auction</Label>
                  <p className="text-xs text-gray-500 mt-1">When on, this listing shows a “Demo” tag and the Bid / Buy buttons are disabled. Use it to preview how auctions look without taking real bids.</p>
                </div>
                <Switch id="isDemo" checked={isDemo} onCheckedChange={setIsDemo} />
              </div>
            </CardContent>
          </Card>

          {/* Category-specific Details */}
          {activeCategory && activeCategory.fields.length > 0 && (
            <Card className="seva-card">
              <CardHeader>
                <CardTitle className="text-[#524C4C]">{activeCategory.name} Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeCategory.fields.map((field) => (
                    <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                      <Label htmlFor={`attr-${field.key}`}>{field.label}</Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          id={`attr-${field.key}`}
                          value={attributes[field.key] || ''}
                          onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                          className="seva-input min-h-[100px]"
                          placeholder={field.placeholder || ''}
                        />
                      ) : (
                        <Input
                          id={`attr-${field.key}`}
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={attributes[field.key] || ''}
                          onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                          className="seva-input"
                          placeholder={field.placeholder || ''}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Item Details */}
          <Card className="seva-card">
            <CardHeader>
              <CardTitle className="text-[#524C4C]">Item Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="packageDetails">Description</Label>
                <Textarea
                  id="packageDetails"
                  name="packageDetails"
                  value={formData.packageDetails}
                  onChange={handleChange}
                  className="seva-input min-h-[100px]"
                  placeholder="Describe what's included in this listing..."
                />
              </div>

              <div>
                <Label htmlFor="bookingRestrictions">Restrictions & Requirements</Label>
                <Textarea
                  id="bookingRestrictions"
                  name="bookingRestrictions"
                  value={formData.bookingRestrictions}
                  onChange={handleChange}
                  className="seva-input min-h-[80px]"
                  placeholder="Any restrictions, redemption terms, or requirements..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Supports Section */}
          <Card className="seva-card">
            <CardHeader>
              <CardTitle className="text-[#524C4C]">This Auction Proudly Supports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="orgDisplay">Org Display</Label>
                <Input
                  id="orgDisplay"
                  name="orgDisplay"
                  value={formData.orgDisplay}
                  onChange={handleChange}
                  className="seva-input"
                  placeholder="Name shown on the auction card (e.g. the charity or organization)"
                />
              </div>
              <div>
                <Label htmlFor="supportsText">Support Description</Label>
                <Textarea
                  id="supportsText"
                  name="supportsText"
                  value={formData.supportsText}
                  onChange={handleChange}
                  className="seva-input min-h-[80px]"
                  placeholder="Describe the nonprofit or cause this auction supports..."
                />
              </div>
              <div>
                <Label htmlFor="orgSharePercent">Organization Share (%)</Label>
                <Input
                  id="orgSharePercent"
                  name="orgSharePercent"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.orgSharePercent}
                  onChange={handleChange}
                  className="seva-input"
                  placeholder="50"
                />
                <p className="text-xs text-gray-500 mt-1">Percentage of the winning bid that goes to the organization. Used to show the amount raised on the auction page.</p>
              </div>

              {/* Support Images */}
              <div>
                <Label htmlFor="supportImages">Support Images (logos, photos)</Label>
                <div className="mt-2 space-y-4">
                  {supportImagePreviews.length > 0 && (
                    <div className="grid grid-cols-4 gap-4">
                      {supportImagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={preview} 
                            alt={`Support ${index + 1}`} 
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeSupportImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#94B957]">
                    <Upload className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">Add support images</span>
                    <input
                      id="supportImages"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleSupportImagesChange}
                    />
                  </label>
                </div>
              </div>

              {/* Support Links */}
              <div>
                <Label>Support Links</Label>
                <div className="mt-2 space-y-2">
                  {supportsLinks.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={link}
                        onChange={(e) => updateSupportLink(index, e.target.value)}
                        className="seva-input flex-1"
                        placeholder="https://nonprofit-website.org"
                      />
                      {supportsLinks.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeSupportLink(index)}
                          variant="outline"
                          size="icon"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={addSupportLink}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Link
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Sponsor Section */}
          <Card className="seva-card">
            <CardHeader>
              <CardTitle className="text-[#524C4C]">Business Sponsor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sponsorName">Business Name</Label>
                <Input
                  id="sponsorName"
                  name="sponsorName"
                  value={formData.sponsorName}
                  onChange={handleChange}
                  className="seva-input"
                  placeholder="Name of the sponsoring business"
                />
              </div>
              <div>
                <Label htmlFor="sponsorThanksText">Special Thanks / Partnership</Label>
                <Textarea
                  id="sponsorThanksText"
                  name="sponsorThanksText"
                  value={formData.sponsorThanksText}
                  onChange={handleChange}
                  className="seva-input min-h-[80px]"
                  placeholder="Describe the partnership or add a special thank-you message..."
                />
              </div>
              <div>
                <Label htmlFor="sponsorWebUrl">Web Address</Label>
                <Input
                  id="sponsorWebUrl"
                  name="sponsorWebUrl"
                  value={formData.sponsorWebUrl}
                  onChange={handleChange}
                  className="seva-input"
                  placeholder="https://sponsor-website.com"
                />
              </div>
              <div>
                <Label htmlFor="sponsorSevaUrl">Seva Business Page</Label>
                <Input
                  id="sponsorSevaUrl"
                  name="sponsorSevaUrl"
                  value={formData.sponsorSevaUrl}
                  onChange={handleChange}
                  className="seva-input"
                  placeholder="https://seva-business-page-link"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <Link href="/admin/packages">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isLoading}
              className="seva-button-primary"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="seva-spinner mr-2"></div>
                  Creating...
                </div>
              ) : (
                'Create Auction'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}