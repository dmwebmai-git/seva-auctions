
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { canManageSettings } from '@/lib/roles'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !canManageSettings(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    // Upsert terms and conditions
    const terms = await prisma.termsAndConditions.upsert({
      where: { id: '1' },
      update: { content },
      create: { id: '1', content }
    })

    return NextResponse.json({ success: true, terms })
  } catch (error) {
    console.error('Terms update error:', error)
    return NextResponse.json(
      { error: 'Failed to update terms' },
      { status: 500 }
    )
  }
}
