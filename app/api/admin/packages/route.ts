

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { canManagePackages } from '@/lib/roles'
import { prisma } from '@/lib/db'
import { uploadFile, getPublicUrl } from '@/lib/s3'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !canManagePackages(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    
    // Extract form fields
    const title = formData.get('title') as string
    const subHeader = formData.get('subHeader') as string || ''
    const courseAddress = formData.get('courseAddress') as string
    const startingBid = parseFloat(formData.get('startingBid') as string)
    const buyNowPrice = parseFloat(formData.get('buyNowPrice') as string)
    const bidIncrement = parseFloat(formData.get('bidIncrement') as string)
    const bidDuration = parseInt(formData.get('bidDuration') as string) // hours
    const packageDetails = formData.get('packageDetails') as string || ''
    const category = formData.get('category') as string || 'Golf & Country Club'
    const bookingRestrictions = formData.get('bookingRestrictions') as string || ''
    const fairMarketValue = parseFloat(formData.get('fairMarketValue') as string)
    const supportsText = formData.get('supportsText') as string || ''
    const orgDisplay = formData.get('orgDisplay') as string || ''
    const orgSharePercentRaw = parseInt(formData.get('orgSharePercent') as string)
    const orgSharePercent = Number.isFinite(orgSharePercentRaw) ? Math.min(100, Math.max(0, orgSharePercentRaw)) : 50
    const sponsorName = formData.get('sponsorName') as string || ''
    const sponsorThanksText = formData.get('sponsorThanksText') as string || ''
    const sponsorWebUrl = formData.get('sponsorWebUrl') as string || ''
    const sponsorSevaUrl = formData.get('sponsorSevaUrl') as string || ''
    const state = formData.get('state') as string || ''
    const zipCode = formData.get('zipCode') as string || ''
    const city = formData.get('city') as string || ''
    const isDemo = formData.get('isDemo') === 'true'
    
    // Parse arrays
    const supportsLinks = formData.get('supportsLinks') 
      ? JSON.parse(formData.get('supportsLinks') as string) 
      : []

    // Parse category-specific attributes
    const attributes = formData.get('attributes')
      ? JSON.parse(formData.get('attributes') as string)
      : {}

    // Handle main image upload
    const imageFile = formData.get('imageFile') as File | null
    let imageUrl = ''
    
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer())
      const key = await uploadFile(buffer, imageFile.name)
      imageUrl = getPublicUrl(key)
    }

    // Handle additional images upload
    const additionalImages: string[] = []
    let imageIndex = 0
    while (formData.get(`additionalImageFile_${imageIndex}`)) {
      const file = formData.get(`additionalImageFile_${imageIndex}`) as File
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const key = await uploadFile(buffer, file.name)
        additionalImages.push(getPublicUrl(key))
      }
      imageIndex++
    }

    // Handle support images upload
    const supportsImages: string[] = []
    let supportImageIndex = 0
    while (formData.get(`supportImageFile_${supportImageIndex}`)) {
      const file = formData.get(`supportImageFile_${supportImageIndex}`) as File
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const key = await uploadFile(buffer, file.name)
        supportsImages.push(getPublicUrl(key))
      }
      supportImageIndex++
    }

    // Calculate bid deadline
    const bidDeadline = new Date()
    bidDeadline.setHours(bidDeadline.getHours() + bidDuration)

    // Create package in database
    const golfPackage = await prisma.golfPackage.create({
      data: {
        title,
        subHeader: subHeader || null,
        courseAddress,
        imageUrl,
        additionalImages,
        startingBid,
        currentBid: startingBid,
        buyNowPrice,
        bidIncrement,
        bidDeadline,
        totalBids: 0,
        status: 'active',
        category,
        isDemo,
        attributes,
        packageDetails: packageDetails || null,
        bookingRestrictions: bookingRestrictions || null,
        fairMarketValue,
        supportsText: supportsText || null,
        orgDisplay: orgDisplay || null,
        orgSharePercent,
        sponsorName: sponsorName || null,
        sponsorThanksText: sponsorThanksText || null,
        sponsorWebUrl: sponsorWebUrl || null,
        sponsorSevaUrl: sponsorSevaUrl || null,
        supportsImages,
        supportsLinks,
        state: state || null,
        zipCode: zipCode || null,
        city: city || null,
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: golfPackage 
    })

  } catch (error: any) {
    console.error('Package creation error:', error?.name, error?.message)
    return NextResponse.json(
      { error: 'Failed to create auction' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !canManagePackages(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const packageId = formData.get('packageId') as string
    
    if (!packageId) {
      return NextResponse.json({ error: 'Auction ID is required' }, { status: 400 })
    }

    // Get existing package
    const existingPackage = await prisma.golfPackage.findUnique({
      where: { id: packageId }
    })

    if (!existingPackage) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    // Extract form fields
    const title = formData.get('title') as string
    const subHeader = formData.get('subHeader') as string || ''
    const courseAddress = formData.get('courseAddress') as string
    const startingBid = parseFloat(formData.get('startingBid') as string)
    const buyNowPrice = parseFloat(formData.get('buyNowPrice') as string)
    const bidIncrement = parseFloat(formData.get('bidIncrement') as string)
    const packageDetails = formData.get('packageDetails') as string || ''
    const category = formData.get('category') as string || existingPackage.category
    const bookingRestrictions = formData.get('bookingRestrictions') as string || ''
    const fairMarketValue = parseFloat(formData.get('fairMarketValue') as string)
    const supportsText = formData.get('supportsText') as string || ''
    const orgDisplay = formData.get('orgDisplay') as string || ''
    const orgSharePercentRaw = parseInt(formData.get('orgSharePercent') as string)
    const orgSharePercent = Number.isFinite(orgSharePercentRaw) ? Math.min(100, Math.max(0, orgSharePercentRaw)) : 50
    const sponsorName = formData.get('sponsorName') as string || ''
    const sponsorThanksText = formData.get('sponsorThanksText') as string || ''
    const sponsorWebUrl = formData.get('sponsorWebUrl') as string || ''
    const sponsorSevaUrl = formData.get('sponsorSevaUrl') as string || ''
    const state = formData.get('state') as string || ''
    const zipCode = formData.get('zipCode') as string || ''
    const city = formData.get('city') as string || ''
    const isDemo = formData.get('isDemo') === 'true'
    const bidDeadlineRaw = formData.get('bidDeadline') as string | null
    
    // Parse arrays
    const supportsLinks = formData.get('supportsLinks') 
      ? JSON.parse(formData.get('supportsLinks') as string) 
      : []

    // Parse category-specific attributes
    const attributes = formData.get('attributes')
      ? JSON.parse(formData.get('attributes') as string)
      : (existingPackage.attributes ?? {})

    // Handle main image upload if changed
    const imageFile = formData.get('imageFile') as File | null
    let imageUrl = existingPackage.imageUrl
    
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer())
      const key = await uploadFile(buffer, imageFile.name)
      imageUrl = getPublicUrl(key)
    }

    // Handle additional images
    const additionalImages: string[] = []
    let imageIndex = 0
    while (formData.get(`additionalImageFile_${imageIndex}`)) {
      const file = formData.get(`additionalImageFile_${imageIndex}`) as File
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const key = await uploadFile(buffer, file.name)
        additionalImages.push(getPublicUrl(key))
      }
      imageIndex++
    }

    // Handle support images
    const supportsImages: string[] = []
    let supportImageIndex = 0
    while (formData.get(`supportImageFile_${supportImageIndex}`)) {
      const file = formData.get(`supportImageFile_${supportImageIndex}`) as File
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const key = await uploadFile(buffer, file.name)
        supportsImages.push(getPublicUrl(key))
      }
      supportImageIndex++
    }

    // Update package in database
    const updatedPackage = await prisma.golfPackage.update({
      where: { id: packageId },
      data: {
        title,
        subHeader: subHeader || null,
        courseAddress,
        imageUrl,
        additionalImages: additionalImages.length > 0 ? additionalImages : existingPackage.additionalImages,
        startingBid,
        buyNowPrice,
        bidIncrement,
        category,
        isDemo,
        ...(bidDeadlineRaw ? { bidDeadline: new Date(bidDeadlineRaw) } : {}),
        attributes,
        packageDetails: packageDetails || null,
        bookingRestrictions: bookingRestrictions || null,
        fairMarketValue,
        supportsText: supportsText || null,
        orgDisplay: orgDisplay || null,
        orgSharePercent,
        sponsorName: sponsorName || null,
        sponsorThanksText: sponsorThanksText || null,
        sponsorWebUrl: sponsorWebUrl || null,
        sponsorSevaUrl: sponsorSevaUrl || null,
        supportsImages: supportsImages.length > 0 ? supportsImages : existingPackage.supportsImages,
        supportsLinks,
        state: state || null,
        zipCode: zipCode || null,
        city: city || null,
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: updatedPackage 
    })

  } catch (error) {
    console.error('Package update error:', error)
    return NextResponse.json(
      { error: 'Failed to update auction' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !canManagePackages(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const packageId = searchParams.get('packageId')
    
    if (!packageId) {
      return NextResponse.json({ error: 'Auction ID is required' }, { status: 400 })
    }

    // Delete package
    await prisma.golfPackage.delete({
      where: { id: packageId }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Auction deleted successfully' 
    })

  } catch (error) {
    console.error('Package deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete auction' },
      { status: 500 }
    )
  }
}