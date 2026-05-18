import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { buildQuestionSet, ProgressEntry } from '@/lib/lesson-engine'

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

  // 2. Fetch the full user progress record (including next_review_at)
  const { data: progress } = await db
    .from('user_progress')
    .select('item_id, item_type, mastery_level, next_review_at')
    .eq('user_id', userId)

  const now = new Date()
  const progressMap = new Map<string, ProgressEntry>()
  const dueItemIds = new Set<string>()
  const weakItemIds = new Set<string>()

  if (progress) {
    for (const p of progress) {
      const nextReview = p.next_review_at ? new Date(p.next_review_at) : null
      progressMap.set(p.item_id, {
        mastery: p.mastery_level,
        nextReview,
      })

      // "Due" = review date has arrived (or is overdue)
      if (nextReview !== null && nextReview <= now) {
        dueItemIds.add(p.item_id)
      }

      // "Weak" = not yet mastered (fallback pool if not enough due items)
      if (p.mastery_level <= 2) {
        weakItemIds.add(p.item_id)
      }
    }
  }

  // 3. Fetch all content from published lessons
  const [vocabRes, sentenceRes, verbsRes] = await Promise.all([
    db.from('vocabulary_items').select('*').in('lesson_id', lessonIds),
    db.from('sentences').select('*').in('lesson_id', lessonIds),
    db.from('verbs').select('*').in('lesson_id', lessonIds),
  ])

  const allVocab = vocabRes.data ?? []
  const allSentences = sentenceRes.data ?? []
  const allVerbs = verbsRes.data ?? []

  // 4. Build item pools:
  //    Primary:   items that are chronologically DUE
  //    Secondary: weak items that aren't already in the due set (padding)
  //    Fallback:  any remaining item (to always fill the Gym to 15 questions)
  const dueVocab = allVocab.filter(v => dueItemIds.has(v.id))
  const dueSentences = allSentences.filter(s => dueItemIds.has(s.id))
  const dueVerbs = allVerbs.filter(v => dueItemIds.has(v.id))

  const weakVocab = allVocab.filter(v => weakItemIds.has(v.id) && !dueItemIds.has(v.id))
  const weakSentences = allSentences.filter(s => weakItemIds.has(s.id) && !dueItemIds.has(s.id))
  const weakVerbs = allVerbs.filter(v => weakItemIds.has(v.id) && !dueItemIds.has(v.id))

  const restVocab = allVocab.filter(v => !dueItemIds.has(v.id) && !weakItemIds.has(v.id))
  const restSentences = allSentences.filter(s => !dueItemIds.has(s.id) && !weakItemIds.has(s.id))
  const restVerbs = allVerbs.filter(v => !dueItemIds.has(v.id) && !weakItemIds.has(v.id))

  // Merge pools: due first → weak padding → everything else
  const priorityVocab = [...dueVocab, ...weakVocab, ...restVocab]
  const prioritySentences = [...dueSentences, ...weakSentences, ...restSentences]
  const priorityVerbs = [...dueVerbs, ...weakVerbs, ...restVerbs]

  // 5. Generate question set — buildQuestionSet's SRS bands will do the final ordering
  const questions = buildQuestionSet(
    priorityVocab,
    prioritySentences,
    priorityVerbs,
    15, // Gym sessions are 15 questions
    progressMap
  )

  return NextResponse.json({
    lesson: { id: 'review', title: 'Targeted Review Gym', category: 'Review' },
    vocabulary: allVocab,
    sentences: allSentences,
    verbs: allVerbs,
    questions,
    // Surface stats for the UI to display if it wants
    meta: {
      dueCount: dueItemIds.size,
      weakCount: weakItemIds.size,
    },
  })
}
