import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getCachedAudioUrl, generateAndCacheAudio } from '@/lib/audio-cache'

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

  // Check cache
  const cached = await getCachedAudioUrl(raw)
  if (cached) {
    // If it's a full HTTPS URL (Supabase public), return it directly
    if (cached.startsWith('http')) {
      return NextResponse.json({ url: cached, cached: true })
    }
    // If it's a relative path or bare filename, proxy it through our API
    return NextResponse.json({ url: `/api/audio/serve/${encodeURIComponent(cached)}`, cached: true })
  }

  // Generate and cache
  try {
    const url = await generateAndCacheAudio(text, language, voiceId)
    // Ensure we return a usable URL
    if (url.startsWith('http')) {
      return NextResponse.json({ url, cached: false })
    }
    return NextResponse.json({ url: `/api/audio/serve/${encodeURIComponent(url)}`, cached: false })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
