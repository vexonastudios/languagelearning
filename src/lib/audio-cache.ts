import { getServiceClient } from './supabase'
import { generateAudio, VOICE_EN, VOICE_ES } from './elevenlabs'

// ── Normalization ────────────────────────────────────────────
export function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
}

export function makeCacheKey(voiceId: string, language: 'en' | 'es', text: string): string {
  return `${voiceId}|${language}|${normalizeText(text)}`
}

// ── Look up audio URL from cache ─────────────────────────────
export async function getCachedAudioUrl(
  cacheKey: string
): Promise<string | null> {
  const db = getServiceClient()
  const { data } = await db
    .from('audio_cache')
    .select('file_url, status')
    .eq('cache_key', cacheKey)
    .single()

  if (data?.status === 'ready' && data.file_url) {
    // Update last_used_at
    await db
      .from('audio_cache')
      .update({ last_used_at: new Date().toISOString() })
      .eq('cache_key', cacheKey)
    return data.file_url
  }
  return null
}

// ── Generate + store audio, return public URL ────────────────
export async function generateAndCacheAudio(
  text: string,
  language: 'en' | 'es',
  voiceId?: string
): Promise<string> {
  const vid = voiceId ?? (language === 'es' ? VOICE_ES : VOICE_EN)
  const cacheKey = makeCacheKey(vid, language, text)
  const normalized = normalizeText(text)
  const db = getServiceClient()

  // Check cache first
  const existing = await getCachedAudioUrl(cacheKey)
  if (existing) return existing

  // Insert pending record
  await db.from('audio_cache').upsert({
    cache_key: cacheKey,
    raw_text: text,
    normalized_text: normalized,
    language,
    voice_id: vid,
    status: 'pending',
  }, { onConflict: 'cache_key' })

  try {
    // Generate audio
    const audioBuffer = await generateAudio(text, vid)

    // Upload to Supabase Storage
    const fileName = `audio/${cacheKey.replace(/\|/g, '_').replace(/[^a-z0-9_]/g, '-')}.mp3`
    const { error: uploadError } = await db.storage
      .from('audio-cache')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data: urlData } = db.storage.from('audio-cache').getPublicUrl(fileName)
    const fileUrl = urlData.publicUrl

    // Mark as ready
    await db.from('audio_cache').update({
      file_url: fileUrl,
      status: 'ready',
      last_used_at: new Date().toISOString(),
    }).eq('cache_key', cacheKey)

    return fileUrl
  } catch (err) {
    await db.from('audio_cache').update({
      status: 'error',
      error_message: String(err),
    }).eq('cache_key', cacheKey)
    throw err
  }
}

// ── Pre-render all audio for a lesson ───────────────────────
export async function prerenderLessonAudio(lessonId: string): Promise<{
  total: number
  success: number
  errors: string[]
}> {
  const db = getServiceClient()

  const [vocabRes, sentenceRes] = await Promise.all([
    db.from('vocabulary_items').select('*').eq('lesson_id', lessonId),
    db.from('sentences').select('*').eq('lesson_id', lessonId),
  ])

  const vocab = vocabRes.data ?? []
  const sentences = sentenceRes.data ?? []

  const tasks: { text: string; language: 'en' | 'es' }[] = []

  for (const v of vocab) {
    tasks.push({ text: v.english_text, language: 'en' })
    tasks.push({ text: v.spanish_text, language: 'es' })
    // If we have examples
    if (v.example_en) tasks.push({ text: v.example_en, language: 'en' })
    if (v.example_es) tasks.push({ text: v.example_es, language: 'es' })
    
    // Add prompt variants ALL flagged as 'es' so the voice logic properly maps it
    tasks.push({ text: `Tap the Spanish word for "${v.english_text}"`, language: 'es' })
    tasks.push({ text: `Tap the English word for "${v.spanish_text}"`, language: 'es' })
    tasks.push({ text: `What word is ${v.english_text}?`, language: 'es' })
    tasks.push({ text: `What is this in Spanish?`, language: 'es' })
    tasks.push({ text: `¿Qué palabra es ${v.spanish_text}?`, language: 'es' })
  }

  for (const s of sentences) {
    tasks.push({ text: s.english_text, language: 'en' })
    tasks.push({ text: s.spanish_text, language: 'es' })
    tasks.push({ text: `What does this mean in English?`, language: 'es' })
    tasks.push({ text: `Translate this into English:`, language: 'es' })
  }

  // Feedback phrases
  const feedback = [
    { text: 'Great job!', language: 'en' as const },
    { text: 'Try again.', language: 'en' as const },
    { text: 'That is correct!', language: 'en' as const },
    { text: "Almost! Let's try again.", language: 'en' as const },
  ]
  tasks.push(...feedback)

  let success = 0
  const errors: string[] = []

  // Process in batches of 3 to avoid rate limits
  for (let i = 0; i < tasks.length; i += 3) {
    const batch = tasks.slice(i, i + 3)
    await Promise.all(
      batch.map(async (t) => {
        try {
          await generateAndCacheAudio(t.text, t.language)
          success++
        } catch (e) {
          errors.push(`${t.language}:${t.text} — ${String(e)}`)
        }
      })
    )
  }

  // Mark lesson audio_ready if no errors
  if (errors.length === 0) {
    await db.from('lessons').update({ audio_ready: true }).eq('id', lessonId)
  }

  return { total: tasks.length, success, errors }
}
