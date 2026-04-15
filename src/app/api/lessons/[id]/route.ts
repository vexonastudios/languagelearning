import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { buildQuestionSet } from '@/lib/lesson-engine'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getServiceClient()
  const { id: lessonId } = await params

  const [lessonRes, vocabRes, sentenceRes] = await Promise.all([
    db.from('lessons').select('*').eq('id', lessonId).single(),
    db.from('vocabulary_items').select('*').eq('lesson_id', lessonId).order('sort_order'),
    db.from('sentences').select('*').eq('lesson_id', lessonId).order('sort_order'),
  ])

  if (lessonRes.error || !lessonRes.data) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  const questions = buildQuestionSet(
    vocabRes.data ?? [],
    sentenceRes.data ?? [],
    10
  )

  return NextResponse.json({
    lesson: lessonRes.data,
    vocabulary: vocabRes.data ?? [],
    sentences: sentenceRes.data ?? [],
    questions,
  })
}
