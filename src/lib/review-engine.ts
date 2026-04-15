import { getServiceClient } from './supabase'

/**
 * Get items due for review (mastery < 3 or next_review_at <= now).
 * Returns vocab items sorted by lowest mastery first.
 */
export async function getReviewItems(userId: string, limit: number = 10) {
  const db = getServiceClient()

  const { data } = await db
    .from('user_progress')
    .select(`
      item_id,
      item_type,
      mastery_level,
      next_review_at
    `)
    .eq('user_id', userId)
    .lte('next_review_at', new Date().toISOString())
    .order('mastery_level', { ascending: true })
    .limit(limit)

  return data ?? []
}

/**
 * Count items per mastery level for a user (for dashboard display).
 */
export async function getMasteryBreakdown(userId: string) {
  const db = getServiceClient()
  const { data } = await db
    .from('user_progress')
    .select('mastery_level')
    .eq('user_id', userId)

  const breakdown = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const row of data ?? []) {
    breakdown[row.mastery_level as keyof typeof breakdown]++
  }
  return breakdown
}
