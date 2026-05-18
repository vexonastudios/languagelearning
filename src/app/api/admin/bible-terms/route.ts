import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { isAdminAuth } from '@/lib/admin-auth'

/** GET /api/admin/bible-terms — admin list */
export async function GET(req: Request) {
  if (!isAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getServiceClient()
  const { data, error } = await db
    .from('biblical_terms')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** POST /api/admin/bible-terms — create a new term */
export async function POST(req: Request) {
  if (!isAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getServiceClient()
  const body = await req.json()

  // Get current max sort_order and increment
  const { data: existing } = await db
    .from('biblical_terms')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = ((existing as any)?.sort_order ?? 0) + 1

  const { data, error } = await db
    .from('biblical_terms')
    .insert({
      term: body.term,
      definition: body.definition,
      scripture_ref: body.scripture_ref || null,
      scripture_text: body.scripture_text || null,
      category: body.category || 'Faith',
      emoji: body.emoji || '✝️',
      distractor_1: body.distractor_1 || '',
      distractor_2: body.distractor_2 || '',
      distractor_3: body.distractor_3 || '',
      difficulty: body.difficulty || 1,
      sort_order: nextOrder,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
