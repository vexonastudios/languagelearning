import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { isAdminAuth } from '@/lib/admin-auth'

// GET all child profiles (Public so the login screen can sync deletions)
export async function GET(req: Request) {
  const db = getServiceClient()
  const { data, error } = await db
    .from('child_profiles')
    .select('id, child_name, avatar, streak, total_xp, last_active_at')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST create child profile
export async function POST(req: Request) {
  const db = getServiceClient()
  const body = await req.json()

  const { data, error } = await db
    .from('child_profiles')
    .insert({
      child_name: body.child_name,
      age: body.age ?? null,
      avatar: body.avatar ?? '🦁',
      pin: body.pin ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
