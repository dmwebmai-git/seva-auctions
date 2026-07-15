import { NextRequest, NextResponse } from 'next/server'
import { getObjectBuffer } from '@/lib/s3'
import { getBucketConfig } from '@/lib/aws-config'

// Always run on demand so credentials/objects are read fresh.
export const dynamic = 'force-dynamic'

/**
 * Streams a stored (private) storage object to the browser using server-side
 * credentials. Package images are uploaded to a private bucket, so they cannot
 * be loaded directly; the client references them via /api/images?key=<key>.
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key')
  if (!key || key.includes('..')) {
    return new NextResponse('Bad request', { status: 400 })
  }

  // Only allow reads within this app's own storage prefix.
  const { folderPrefix } = getBucketConfig()
  if (folderPrefix && !key.startsWith(folderPrefix)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const { buffer, contentType } = await getObjectBuffer(key)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    })
  } catch (error) {
    console.error('Image proxy error for key', key, error)
    return new NextResponse('Not found', { status: 404 })
  }
}
