
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { canManageSettings } from '@/lib/roles'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !canManageSettings(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, isActive } = body

    const contentPage = await prisma.contentPage.update({
      where: { slug: params.slug },
      data: { content, isActive }
    })

    return NextResponse.json({ success: true, contentPage })
  } catch (error) {
    console.error('Content update error:', error)
    return NextResponse.json(
      { error: 'Failed to update content page' },
      { status: 500 }
    )
  }
}
