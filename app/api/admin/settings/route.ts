
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { canManageSettings } from '@/lib/roles'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !canManageSettings(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !canManageSettings(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { raisedForCharity, activeAuctions, premiumCourses, happyGolfers } = body

    // Get or create settings
    let settings = await prisma.siteSettings.findFirst()

    if (!settings) {
      // Create new settings
      settings = await prisma.siteSettings.create({
        data: {
          raisedForCharity: raisedForCharity || '$127K',
          activeAuctions: activeAuctions || '48',
          premiumCourses: premiumCourses || '95+',
          happyGolfers: happyGolfers || '2.3K',
        },
      })
    } else {
      // Update existing settings
      settings = await prisma.siteSettings.update({
        where: { id: settings.id },
        data: {
          raisedForCharity,
          activeAuctions,
          premiumCourses,
          happyGolfers,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
