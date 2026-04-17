import { getServiceClient } from '@/lib/supabase'
import { getCachedAudioUrl, generateAndCacheAudio } from '@/lib/audio-cache'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cacheKey: string }> }
) {
  const { cacheKey } = await params
  const raw = decodeURIComponent(cacheKey)

  // cacheKey format: voiceId|lang|normalizedText
  const parts = raw.split('|')
  if (parts.length < 3) {
    return NextResponse.json({ error: 'Invalid cache key format' }, { status: 400 })
  }

  const [voiceId, lang, ...textParts] = parts
  const text = textParts.join('|')
  const language = lang as 'en' | 'es'

  // Get or generate the Supabase Storage URL (server-side only)
  let storageUrl: string | null = await getCachedAudioUrl(raw)
  if (!storageUrl) {
    try {
      storageUrl = await generateAndCacheAudio(text, language, voiceId)
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }
  }

  if (!storageUrl) {
    return NextResponse.json({ error: 'Could not get audio URL' }, { status: 500 })
  }

  // ✅ PROXY: download from Supabase server-side and stream to client
  // This means the browser only ever hits our Vercel domain — never Supabase directly.
  // Fixes ERR_NAME_NOT_RESOLVED on devices that can't reach supabase.co
  try {
    const db = getServiceClient()

    // Extract the storage path from the URL or handle relative paths
    let audioData: ArrayBuffer | null = null

    if (storageUrl.startsWith('http')) {
      // Full URL — extract the file path from it
      const urlPath = new URL(storageUrl).pathname
      // Path will be like /storage/v1/object/public/audio-cache/audio/xxx.mp3
      const match = urlPath.match(/\/audio-cache\/(.+)$/)
      if (match) {
        const filePath = match[1] // e.g. audio/8mlx...mp3
        const { data, error } = await db.storage.from('audio-cache').download(filePath)
        if (!error && data) audioData = await data.arrayBuffer()
      }
    } else if (storageUrl.startsWith('/')) {
      // Relative path
      const filePath = storageUrl.replace(/^\/api\/audio\/serve\//, '')
      const { data, error } = await db.storage
        .from('audio-cache')
        .download(decodeURIComponent(filePath))
      if (!error && data) audioData = await data.arrayBuffer()
    }

    if (!audioData) {
      return NextResponse.json({ error: 'Audio file not found in storage' }, { status: 404 })
    }

    return new NextResponse(audioData, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=604800, immutable',
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (err) {
    console.error('Audio proxy error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
