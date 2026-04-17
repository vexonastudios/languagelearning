import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

// GET /api/progress/completions?userId=xxx
// Returns all lesson IDs the user has completed
export async function GET(req: Request) {
  const db = getServiceClient()
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const { data, error } = await db
    .from('lesson_sessions')
    .select('lesson_id')
    .eq('user_id', userId)
    .not('completed_at', 'is', null) // only truly completed sessions

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const completedLessonIds = [...new Set((data || []).map((s: any) => s.lesson_id))]
  return NextResponse.json({ completedLessonIds })
}

// POST /api/progress/completions
// Records a lesson as completed
export async function POST(req: Request) {
  const db = getServiceClient()
  const body = await req.json()
  const { userId, lessonId, accuracy, xpEarned, questionsTotal, questionsCorrect } = body

  if (!userId || !lessonId) {
    return NextResponse.json({ error: 'Missing userId or lessonId' }, { status: 400 })
  }

  // Upsert: if a session exists for this user+lesson that's not completed, complete it.
  // Otherwise, insert a fresh completed session.
  const { error } = await db
    .from('lesson_sessions')
    .insert({
      user_id: userId,
      lesson_id: lessonId,
      completed_at: new Date().toISOString(),
      accuracy: accuracy ?? null,
      xp_earned: xpEarned ?? 0,
      questions_total: questionsTotal ?? 0,
      questions_correct: questionsCorrect ?? 0,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
