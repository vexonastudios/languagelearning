import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { isAdminAuth } from '@/lib/admin-auth'
import { prerenderLessonAudio } from '@/lib/audio-cache'

// POST /api/admin/publish/[lessonId] — pre-render audio then publish
export async function POST(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  if (!isAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getServiceClient()
  const { lessonId } = await params

  // Pre-render all audio
  const result = await prerenderLessonAudio(lessonId)

  // Always publish (even if some audio errors — admin can fix individually)
  await db.from('lessons').update({
    status: 'published',
    audio_ready: result.errors.length === 0,
    updated_at: new Date().toISOString(),
  }).eq('id', lessonId)

  return NextResponse.json({ published: true, audio: result })
}
