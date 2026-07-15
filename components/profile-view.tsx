
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { resolveImageSrc } from '@/lib/image-url'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Mail, Phone, MapPin, Package, Trophy, Edit2, Save, X, Gavel } from 'lucide-react'
import { toast } from 'sonner'
import type { GolfPackage as PrismaPackage, Bid } from '@prisma/client'

interface UserData {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phoneNumber: string | null
  streetAddress: string | null
}

interface BidWithPackage extends Bid {
  package: PrismaPackage & { _count: { bids: number } }
}

interface ProfileViewProps {
  user: UserData
  savedPackages: (PrismaPackage & { _count: { bids: number } })[]
  wonPackages: (PrismaPackage & { wonBid?: number, paymentStatus?: string })[]
  activeBids: BidWithPackage[]
}

export function ProfileView({ user, savedPackages, wonPackages, activeBids }: ProfileViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams?.get('tab')
  const initialTab = tabParam === 'saved' || tabParam === 'won' ? tabParam : 'bids'
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phoneNumber || '',
    address: user.streetAddress || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to update profile')

      toast.success('Profile updated successfully')
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phoneNumber || '',
      address: user.streetAddress || '',
    })
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="seva-heading-xl text-[#524C4C]">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account and view your auctions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information Card */}
          <div className="lg:col-span-1">
            <Card className="seva-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-[#524C4C]">
                  <User className="w-5 h-5 text-[#94B957]" />
                  Profile Information
                </CardTitle>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="ghost"
                    size="sm"
                    className="text-[#94B957] hover:text-[#7A9941]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      disabled={isLoading}
                      size="sm"
                      className="bg-[#0DA354] hover:bg-[#0c8f49] text-white"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={handleCancel}
                      disabled={isLoading}
                      variant="ghost"
                      size="sm"
                      className="text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">First Name</Label>
                  {isEditing ? (
                    <Input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="mt-1"
                      disabled={isLoading}
                    />
                  ) : (
                    <p className="mt-1 text-[#524C4C]">{user.firstName || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                  {isEditing ? (
                    <Input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="mt-1"
                      disabled={isLoading}
                    />
                  ) : (
                    <p className="mt-1 text-[#524C4C]">{user.lastName || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <p className="mt-1 text-[#524C4C]">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </Label>
                  {isEditing ? (
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1"
                      disabled={isLoading}
                      placeholder="(555) 123-4567"
                    />
                  ) : (
                    <p className="mt-1 text-[#524C4C]">{user.phoneNumber || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MapPin className="w-4 h-4" />
                    Address
                  </Label>
                  {isEditing ? (
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="mt-1"
                      disabled={isLoading}
                      placeholder="123 Main St, City, State"
                    />
                  ) : (
                    <p className="mt-1 text-[#524C4C]">{user.streetAddress || 'Not provided'}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Packages Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue={initialTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="bids" className="flex items-center gap-2">
                  <Gavel className="w-4 h-4" />
                  My Bids ({activeBids.length})
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Saved ({savedPackages.length})
                </TabsTrigger>
                <TabsTrigger value="won" className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Won ({wonPackages.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bids" className="space-y-4">
                {activeBids.length === 0 ? (
                  <Card className="seva-card">
                    <CardContent className="text-center py-12">
                      <Gavel className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">You don't have any active bids</p>
                      <Link href="/">
                        <Button className="seva-button-primary">
                          Start Bidding
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {activeBids.map((bid) => (
                      <BidCard key={bid.id} bid={bid} userId={user.id} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="saved" className="space-y-4">
                {savedPackages.length === 0 ? (
                  <Card className="seva-card">
                    <CardContent className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">You haven't saved any auctions yet</p>
                      <Link href="/">
                        <Button className="seva-button-primary">
                          Browse Auctions
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {savedPackages.map((pkg) => (
                      <PackageCard key={pkg.id} package={pkg} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="won" className="space-y-4">
                {wonPackages.length === 0 ? (
                  <Card className="seva-card">
                    <CardContent className="text-center py-12">
                      <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">You haven't won any auctions yet</p>
                      <Link href="/">
                        <Button className="seva-button-primary">
                          Start Bidding
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {wonPackages.map((pkg) => (
                      <PackageCard key={pkg.id} package={pkg} won />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

function PackageCard({ package: pkg, won = false }: { package: PrismaPackage & { _count?: { bids: number } }, won?: boolean }) {
  return (
    <Link href={`/package/${pkg.id}`}>
      <Card className="seva-card hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-0">
          <div className="flex gap-4">
            <div className="relative w-48 h-32 flex-shrink-0">
              <Image
                src={resolveImageSrc(pkg.imageUrl) || '/placeholder-golf.jpg'}
                alt={pkg.title}
                fill
                className="object-cover rounded-l-lg"
              />
              {won && (
                <div className="absolute top-2 right-2 bg-[#0DA354] text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  Won
                </div>
              )}
            </div>
            <div className="flex-1 p-4">
              <h3 className="font-semibold text-[#524C4C] mb-1 line-clamp-1">{pkg.title}</h3>
              {pkg.subHeader && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-1">{pkg.subHeader}</p>
              )}
              <p className="text-sm text-gray-600 mb-3 line-clamp-1">{pkg.courseAddress}</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500">Current Bid</span>
                  <p className="text-lg font-bold text-[#94B957]">${pkg.currentBid.toLocaleString()}</p>
                </div>
                {pkg._count && (
                  <div className="text-right">
                    <span className="text-xs text-gray-500">Total Bids</span>
                    <p className="text-lg font-semibold text-[#524C4C]">{pkg._count.bids}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function BidCard({ bid, userId }: { bid: BidWithPackage, userId: string }) {
  const pkg = bid.package
  const isWinning = bid.isWinning
  const timeRemaining = new Date(pkg.bidDeadline).getTime() - new Date().getTime()
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60))
  const daysRemaining = Math.floor(hoursRemaining / 24)

  return (
    <Link href={`/package/${pkg.id}`}>
      <Card className="seva-card hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-0">
          <div className="flex gap-4">
            <div className="relative w-48 h-32 flex-shrink-0">
              <Image
                src={resolveImageSrc(pkg.imageUrl) || '/placeholder-golf.jpg'}
                alt={pkg.title}
                fill
                className="object-cover rounded-l-lg"
              />
              {isWinning ? (
                <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  Winning
                </div>
              ) : (
                <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  Outbid
                </div>
              )}
            </div>
            <div className="flex-1 p-4">
              <h3 className="font-semibold text-[#524C4C] mb-1 line-clamp-1">{pkg.title}</h3>
              {pkg.subHeader && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-1">{pkg.subHeader}</p>
              )}
              <p className="text-sm text-gray-600 mb-3 line-clamp-1">{pkg.courseAddress}</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500">Your Bid</span>
                  <p className="text-lg font-bold text-[#94B957]">${Number(bid.amount).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">Current High Bid</span>
                  <p className="text-lg font-semibold text-[#524C4C]">${Number(pkg.currentBid).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">Time Left</span>
                  <p className="text-sm font-medium text-red-600">
                    {daysRemaining > 0 ? `${daysRemaining}d` : `${hoursRemaining}h`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}