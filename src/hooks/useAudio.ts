'use client'
import { useEffect, useRef } from 'react'
import { makeCacheKey } from '@/lib/audio-cache'

const VOICE_ES = process.env.NEXT_PUBLIC_VOICE_ES ?? '8MlXhVr7f7x9lck6CiCF'
const VOICE_EN = process.env.NEXT_PUBLIC_VOICE_EN ?? 'SDVJaMLoJa7wc3s2sn7d'

/**
 * Hook to play audio from the cache.
 * Returns a `play(text, language)` function.
 * 
 * Audio is served via the Next.js API proxy — the browser never contacts
 * Supabase Storage directly, which avoids ERR_NAME_NOT_RESOLVED on
 * networks that block supabase.co.
 */
export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentBlobUrl = useRef<string | null>(null)

  useEffect(() => {
    audioRef.current = new Audio()
    return () => {
      audioRef.current?.pause()
      // Clean up any blob URLs we created
      if (currentBlobUrl.current) {
        URL.revokeObjectURL(currentBlobUrl.current)
      }
    }
  }, [])

  async function play(text: string, language: 'en' | 'es') {
    const voiceId = language === 'es' ? VOICE_ES : VOICE_EN
    const cacheKey = makeCacheKey(voiceId, language, text)
    const encodedKey = encodeURIComponent(cacheKey)

    try {
      // Fetch the audio as binary data from our Next.js proxy
      // The proxy streams from Supabase server-side, so no direct CDN request is made
      const res = await fetch(`/api/audio/${encodedKey}`)
      if (!res.ok) {
        console.warn('Audio fetch failed:', res.status, await res.text())
        return
      }

      const blob = await res.blob()
      if (blob.size < 100) {
        console.warn('Audio response was too small, likely an error')
        return
      }

      // Revoke any previous blob URL to free memory
      if (currentBlobUrl.current) {
        URL.revokeObjectURL(currentBlobUrl.current)
      }

      const blobUrl = URL.createObjectURL(blob)
      currentBlobUrl.current = blobUrl

      if (audioRef.current) {
        // Pause any currently playing audio first to avoid AbortError
        audioRef.current.pause()
        audioRef.current.src = blobUrl
        audioRef.current.currentTime = 0
        await audioRef.current.play()
      }
    } catch (err) {
      console.warn('Audio play failed:', err)
    }
  }

  return { play }
}
