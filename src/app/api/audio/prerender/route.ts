import { NextResponse } from 'next/server'
import { prerenderLessonAudio } from '@/lib/audio-cache'
import { isAdminAuth } from '@/lib/admin-auth'

export async function POST(req: Request) {
  if (!isAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { lessonId } = await req.json()
  if (!lessonId) {
    return NextResponse.json({ error: 'lessonId required' }, { status: 400 })
  }

  try {
    const result = await prerenderLessonAudio(lessonId)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
