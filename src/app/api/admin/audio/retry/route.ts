import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { isAdminAuth } from '@/lib/admin-auth'
import { generateAndCacheAudio } from '@/lib/audio-cache'

export async function POST(req: Request) {
  if (!isAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getServiceClient()

  // Find all flagged errors
  const { data: errors, error: eErr } = await db.from('audio_cache').select('*').eq('status', 'error')

  if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 })
  if (!errors || errors.length === 0) return NextResponse.json({ fixed: 0 })

  let fixed = 0
  for (const item of errors) {
    // Delete the entry so generateAndCacheAudio doesn't skip it
    await db.from('audio_cache').delete().eq('id', item.id)
    try {
      await generateAndCacheAudio(item.raw_text, item.language as any)
      fixed++
    } catch(e) {
      // ignore
    }
  }

  return NextResponse.json({ fixed })
}
