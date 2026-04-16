import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const db = getServiceClient()
  const body = await req.json()
  const { id, total_xp, streak, last_active_at } = body

  if (!id) return NextResponse.json({ error: 'Missing profile ID' }, { status: 400 })

  const updatePayload: any = {}
  if (total_xp !== undefined) updatePayload.total_xp = total_xp
  if (streak !== undefined) updatePayload.streak = streak
  if (last_active_at !== undefined) updatePayload.last_active_at = last_active_at

  const { error } = await db
    .from('child_profiles')
    .update(updatePayload)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
