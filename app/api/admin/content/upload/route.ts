import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { canManageSettings } from '@/lib/roles'
import { uploadFile } from '@/lib/s3'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !canManageSettings((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    // 15MB limit for inline content images
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 15MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const key = await uploadFile(buffer, file.name)

    // Serve through the image proxy so private-bucket objects load in the browser
    const url = `/api/images?key=${encodeURIComponent(key)}`

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Content image upload error:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
