import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { isAdminAuth } from '@/lib/admin-auth'

export async function GET(req: Request) {
  if (!isAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getServiceClient()
  const { data, error } = await db.from('verbs').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  if (!isAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getServiceClient()
  const payload = await req.json()

  // Validate required fields
  const required = ['infinitive_es', 'infinitive_en', 'yo', 'tu', 'el', 'nosotros', 'ellos']
  for (const field of required) {
    if (!payload[field]) return NextResponse.json({ error: `Missing ${field}` }, { status: 400 })
  }

  const { data, error } = await db.from('verbs').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
