
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get or create settings
    let settings = await prisma.siteSettings.findFirst()

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.siteSettings.create({
        data: {
          raisedForCharity: '$127K',
          activeAuctions: '48',
          premiumCourses: '95+',
          happyGolfers: '2.3K',
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    // Return default values if database error
    return NextResponse.json({
      raisedForCharity: '$127K',
      activeAuctions: '48',
      premiumCourses: '95+',
      happyGolfers: '2.3K',
    })
  }
}
