import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

/**
 * Proxy audio from Supabase Storage.
 * Used when the bucket is private or when file_url is a bare path.
 * GET /api/audio/serve/[fileName]
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ fileName: string }> }
) {
  const { fileName } = await params
  const rawFileName = decodeURIComponent(fileName)

  const db = getServiceClient()

  // Download the file from the storage bucket
  const { data, error } = await db.storage
    .from('audio-cache')
    .download(rawFileName.startsWith('audio/') ? rawFileName : `audio/${rawFileName}`)

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'File not found' }, { status: 404 })
  }

  const buffer = await data.arrayBuffer()
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=604800, immutable',
    },
  })
}
