import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export const VOICE_ES = process.env.ELEVENLABS_VOICE_ES ?? '8MlXhVr7f7x9lck6CiCF'
export const VOICE_EN = process.env.ELEVENLABS_VOICE_EN ?? 'SDVJaMLoJa7wc3s2sn7d'

function getClient() {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) throw new Error('Missing ELEVENLABS_API_KEY')
  return new ElevenLabsClient({ apiKey: key })
}

/**
 * Generate TTS audio and return as a Buffer.
 * Uses the ElevenLabs streaming API.
 */
export async function generateAudio(text: string, voiceId: string): Promise<Buffer> {
  const client = getClient()
  // Force all audio to use the Spanish voice per user request, ignoring the passed voiceId
  const forcedVoiceId = VOICE_ES
  const audioStream = await client.textToSpeech.convert(forcedVoiceId, {
    text,
    modelId: 'eleven_multilingual_v2',
    voiceSettings: {
      stability: 0.5,
      similarityBoost: 0.75,
    },
  })

  // Convert ReadableStream to Buffer via Response helper
  const response = new Response(audioStream)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Validate: real MP3 audio should be at least 1KB.
  // If it's smaller, ElevenLabs likely returned an error JSON body instead of audio.
  if (buffer.byteLength < 1024) {
    const preview = buffer.toString('utf8', 0, Math.min(200, buffer.byteLength))
    throw new Error(
      `ElevenLabs returned invalid audio (${buffer.byteLength} bytes). Response: ${preview}`
    )
  }

  return buffer
}
