import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { buildQuestionSet } from '@/lib/lesson-engine'

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

  // Enhance: Fetch user mastery from progress table
  let progressMap = new Map<string, number>()
  if (userId) {
    const { data: prog } = await db.from('user_progress').select('item_id, mastery_level').eq('child_id', userId)
    if (prog) prog.forEach((p: any) => progressMap.set(p.item_id, p.mastery_level))
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
