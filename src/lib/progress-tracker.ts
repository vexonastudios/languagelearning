import { getServiceClient } from './supabase'

export interface ProgressUpdate {
  userId: string
  itemId: string
  itemType: 'vocabulary' | 'sentence'
  correct: boolean
}

/**
 * Update mastery level for a single item.
 * Correct: +1 (max 5). Wrong: -1 (min 0).
 * Schedules next review using spaced repetition (2^mastery days).
 */
export async function updateProgress(update: ProgressUpdate): Promise<void> {
  const db = getServiceClient()

  // Get existing progress
  const { data: existing } = await db
    .from('user_progress')
    .select('*')
    .eq('user_id', update.userId)
    .eq('item_id', update.itemId)
    .eq('item_type', update.itemType)
    .single()

  const currentMastery = existing?.mastery_level ?? 0
  const currentAttempts = existing?.attempts ?? 0
  const currentScore = existing?.score ?? 0

  const newMastery = update.correct
    ? Math.min(5, currentMastery + 1)
    : Math.max(0, currentMastery - 1)

  // Spaced repetition: next review = now + 2^mastery days
  const daysUntilReview = Math.pow(2, newMastery)
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + daysUntilReview)

  const payload = {
    user_id: update.userId,
    item_id: update.itemId,
    item_type: update.itemType,
    mastery_level: newMastery,
    score: currentScore + (update.correct ? 1 : 0),
    attempts: currentAttempts + 1,
    last_seen_at: new Date().toISOString(),
    next_review_at: nextReview.toISOString(),
  }

  await db.from('user_progress').upsert(payload, {
    onConflict: 'user_id,item_id,item_type',
  })
}

/**
 * Update streak and total XP for a child profile.
 */
export async function addXp(userId: string, xp: number): Promise<void> {
  const db = getServiceClient()
  const { data } = await db
    .from('child_profiles')
    .select('total_xp, streak, last_active_at')
    .eq('id', userId)
    .single()

  if (!data) return

  const now = new Date()
  const lastActive = data.last_active_at ? new Date(data.last_active_at) : null
  const isNewDay = !lastActive || now.toDateString() !== lastActive.toDateString()
  const streak = isNewDay ? data.streak + 1 : data.streak

  await db.from('child_profiles').update({
    total_xp: data.total_xp + xp,
    streak,
    last_active_at: now.toISOString(),
  }).eq('id', userId)
}
