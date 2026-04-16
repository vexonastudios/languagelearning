import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { buildQuestionSet } from '@/lib/lesson-engine'

export async function GET(req: Request) {
  const db = getServiceClient()
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  // 1. Get all published lessons
  const { data: lessons, error: lErr } = await db.from('lessons').select('id').eq('status', 'published')
  if (lErr || !lessons || lessons.length === 0) {
    return NextResponse.json({ error: 'No published lessons found' }, { status: 404 })
  }
  const lessonIds = lessons.map(l => l.id)

  // 2. Fetch User Progress to find "weak" items
  const { data: progress } = await db.from('user_progress').select('*').eq('user_id', userId)
  const progressMap = new Map<string, number>()
  const weakItemIds = new Set<string>()

  if (progress) {
    for (const p of progress) {
      progressMap.set(p.item_id, p.mastery_level)
      if (p.mastery_level <= 2) {
        weakItemIds.add(p.item_id)
      }
    }
  }

  // 3. Fetch full content pools from these published lessons
  const [vocabRes, sentenceRes, verbsRes] = await Promise.all([
    db.from('vocabulary_items').select('*').in('lesson_id', lessonIds),
    db.from('sentences').select('*').in('lesson_id', lessonIds),
    db.from('verbs').select('*').in('lesson_id', lessonIds),
  ])

  let allVocab = vocabRes.data ?? []
  let allSentences = sentenceRes.data ?? []
  let allVerbs = verbsRes.data ?? []

  // 4. Narrow the focus to weak items only (if we have any)
  if (weakItemIds.size > 0) {
    const weakVocab = allVocab.filter(v => weakItemIds.has(v.id))
    const weakSentences = allSentences.filter(s => weakItemIds.has(s.id))
    const weakVerbs = allVerbs.filter(v => weakItemIds.has(v.id))

    // Fallback: If we don't have enough weak items to make a 10-question lesson, combine them with random full items
    const combinedVocab = [...weakVocab, ...allVocab.filter(v => !weakItemIds.has(v.id))]
    const combinedSentences = [...weakSentences, ...allSentences.filter(s => !weakItemIds.has(s.id))]
    const combinedVerbs = [...weakVerbs, ...allVerbs.filter(v => !weakItemIds.has(v.id))]
    
    allVocab = combinedVocab
    allSentences = combinedSentences
    allVerbs = combinedVerbs
  }

  // Generate question set, which naturally prioritizes items with lower mastery in its shuffle logic
  const questions = buildQuestionSet(
    allVocab,
    allSentences,
    allVerbs,
    15, // Gym sessions are 15 questions!
    progressMap
  )

  return NextResponse.json({
    lesson: { id: 'review', title: 'Targeted Review Gym', category: 'Review' },
    vocabulary: allVocab,
    sentences: allSentences,
    verbs: allVerbs,
    questions,
  })
}
