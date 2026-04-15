import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { isAdminAuth } from '@/lib/admin-auth'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = getServiceClient()
  const body = await req.json()

  const { data, error } = await db
    .from('vocabulary_items')
    .update({
      english_text: body.english_text,
      spanish_text: body.spanish_text,
      lesson_id: body.lesson_id,
      category: body.category,
      image_url: body.image_url,
      tags: body.tags,
      difficulty: body.difficulty,
      distractors_en: body.distractors_en,
      distractors_es: body.distractors_es,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = getServiceClient()
  const { error } = await db.from('vocabulary_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
