import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { updateProgress, addXp } from '@/lib/progress-tracker'

export async function POST(req: Request) {
  const body = await req.json()
  const { userId, itemId, itemType, correct, lessonId, sessionId } = body

  if (!userId || !itemId || !itemType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  await updateProgress({ userId, itemId, itemType, correct })

  // Award XP
  const xp = correct ? 10 : 0
  if (xp > 0) await addXp(userId, xp)

  return NextResponse.json({ ok: true, xp })
}
