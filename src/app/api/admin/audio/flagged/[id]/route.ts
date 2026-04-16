import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { isAdminAuth } from '@/lib/admin-auth'
import { generateAndCacheAudio } from '@/lib/audio-cache'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getServiceClient()
  const { id } = await params

  const { data: item } = await db.from('audio_cache').select('*').eq('id', id).single()
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    // We delete the existing entry so it's forced to re-generate from scratch in ElevenLabs
    await db.from('audio_cache').delete().eq('id', id)
    
    // Now trigger it
    const newUrl = await generateAndCacheAudio(item.raw_text, item.language as any)
    
    // Put it back into the flagged state so Admin can review it first
    await db.from('audio_cache').update({ status: 'error' }).eq('cache_key', item.cache_key)

    return NextResponse.json({ success: true, url: newUrl })
  } catch(e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getServiceClient()
  const { id } = await params

  // Admin approves it, move back to ready
  const { error } = await db.from('audio_cache').update({ status: 'ready' }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  return NextResponse.json({ success: true })
}
