import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { isAdminAuth } from '@/lib/admin-auth'

// GET — all vocab (optionally filter by lesson)
export async function GET(req: Request) {
  if (!isAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getServiceClient()
  const url = new URL(req.url)
  const lessonId = url.searchParams.get('lessonId')

  let query = db.from('vocabulary_items').select('*').order('sort_order')
  if (lessonId) query = query.eq('lesson_id', lessonId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — create vocab item
export async function POST(req: Request) {
  if (!isAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getServiceClient()
  const body = await req.json()

  const { data, error } = await db
    .from('vocabulary_items')
    .insert({
      english_text: body.english_text,
      spanish_text: body.spanish_text,
      lesson_id: body.lesson_id,
      category: body.category ?? 'General',
      image_url: body.image_url ?? null,
      tags: body.tags ?? [],
      difficulty: body.difficulty ?? 1,
      distractors_en: body.distractors_en ?? [],
      distractors_es: body.distractors_es ?? [],
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
