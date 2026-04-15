import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { isAdminAuth } from '@/lib/admin-auth'

// GET /api/admin/lessons — all lessons for admin (all statuses)
export async function GET(req: Request) {
  if (!isAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getServiceClient()
  const { data, error } = await db
    .from('lessons')
    .select('*, vocabulary_items(count), sentences(count)')
    .order('"order"', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/admin/lessons — create a new lesson
export async function POST(req: Request) {
  if (!isAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getServiceClient()
  const body = await req.json()

  const { data, error } = await db
    .from('lessons')
    .insert({
      title: body.title,
      order: body.order ?? 0,
      category: body.category ?? 'General',
      difficulty: body.difficulty ?? 1,
      status: 'draft',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
