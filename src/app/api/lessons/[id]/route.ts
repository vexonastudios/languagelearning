import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { buildQuestionSet, ProgressEntry } from '@/lib/lesson-engine'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getServiceClient()
  const { id: lessonId } = await params
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  const [lessonRes, vocabRes, sentenceRes, verbsRes] = await Promise.all([
    db.from('lessons').select('*').eq('id', lessonId).single(),
    db.from('vocabulary_items').select('*').eq('lesson_id', lessonId).order('sort_order'),
    db.from('sentences').select('*').eq('lesson_id', lessonId).order('sort_order'),
    db.from('verbs').select('*').eq('lesson_id', lessonId),
  ])

  if (lessonRes.error || !lessonRes.data) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  // Build true SRS progress map from user_progress table
  const progressMap = new Map<string, ProgressEntry>()
  if (userId) {
    // FIX: was incorrectly using 'child_id' — correct column is 'user_id'
    const { data: prog } = await db
      .from('user_progress')
      .select('item_id, mastery_level, next_review_at')
      .eq('user_id', userId)

    if (prog) {
      for (const p of prog) {
        progressMap.set(p.item_id, {
          mastery: p.mastery_level,
          nextReview: p.next_review_at ? new Date(p.next_review_at) : null,
        })
      }
    }
  }

  const questions = buildQuestionSet(
    vocabRes.data ?? [],
    sentenceRes.data ?? [],
    verbsRes.data ?? [],
    10,
    progressMap
  )

  return NextResponse.json({
    lesson: lessonRes.data,
    vocabulary: vocabRes.data ?? [],
    sentences: sentenceRes.data ?? [],
    verbs: verbsRes.data ?? [],
    questions,
  })
}
