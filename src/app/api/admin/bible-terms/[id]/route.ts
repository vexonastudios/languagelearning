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
    .from('biblical_terms')
    .update({
      term: body.term,
      definition: body.definition,
      scripture_ref: body.scripture_ref,
      scripture_text: body.scripture_text,
      category: body.category,
      emoji: body.emoji,
      distractor_1: body.distractor_1,
      distractor_2: body.distractor_2,
      distractor_3: body.distractor_3,
      difficulty: body.difficulty,
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
  const { error } = await db.from('biblical_terms').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
