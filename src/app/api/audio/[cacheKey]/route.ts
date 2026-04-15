import { NextResponse } from 'next/server'
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
    return NextResponse.json({ url: cached, cached: true })
  }

  // Generate and cache
  try {
    const url = await generateAndCacheAudio(text, language, voiceId)
    return NextResponse.json({ url, cached: false })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
