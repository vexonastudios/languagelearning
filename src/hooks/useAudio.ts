'use client'
import { useEffect, useRef } from 'react'
import { makeCacheKey } from '@/lib/audio-cache'

const VOICE_ES = process.env.NEXT_PUBLIC_VOICE_ES ?? '8MlXhVr7f7x9lck6CiCF'
const VOICE_EN = process.env.NEXT_PUBLIC_VOICE_EN ?? 'SDVJaMLoJa7wc3s2sn7d'

/**
 * Hook to play audio from the cache.
 * Returns a `play(text, language)` function.
 */
export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio()
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  async function play(text: string, language: 'en' | 'es') {
    const voiceId = language === 'es' ? VOICE_ES : VOICE_EN
    const cacheKey = makeCacheKey(voiceId, language, text)
    const encodedKey = encodeURIComponent(cacheKey)

    try {
      const res = await fetch(`/api/audio/${encodedKey}`)
      const { url } = await res.json()
      if (url && audioRef.current) {
        audioRef.current.src = url
        audioRef.current.currentTime = 0
        await audioRef.current.play()
      }
    } catch (err) {
      console.warn('Audio play failed:', err)
    }
  }

  return { play }
}
