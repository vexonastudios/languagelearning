import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { makeCacheKey } from '@/lib/audio-cache'
import { VOICE_EN, VOICE_ES } from '@/lib/elevenlabs'

export async function POST(req: Request) {
  const body = await req.json()
  const { text, language } = body

  if (!text || !language) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  const voiceId = language === 'es' ? VOICE_ES : VOICE_EN
  const cacheKey = makeCacheKey(voiceId, language, text)

  const db = getServiceClient()
  
  // Set status to error
  const { error } = await db.from('audio_cache').update({ status: 'error' }).eq('cache_key', cacheKey)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, cacheKey })
}
