import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { isAdminAuth } from '@/lib/admin-auth'

export async function GET(req: Request) {
  if (!isAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getServiceClient()
  
  // Fetch rewards
  const { data: rewards, error: rErr } = await db.from('rewards').select('*').order('created_at', { ascending: true })
  
  // Fetch specific pending/completed purchases
  const { data: purchases, error: pErr } = await db
    .from('reward_purchases')
    .select(`
      id, status, created_at,
      profile:child_profiles(child_name, avatar),
      reward:rewards(title, icon, cost)
    `)
    .order('created_at', { ascending: false })

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 })

  return NextResponse.json({
    rewards: rewards ?? [],
    purchases: purchases ?? []
  })
}

export async function POST(req: Request) {
  if (!isAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getServiceClient()
  const body = await req.json()

  const { data, error } = await db
    .from('rewards')
    .insert({
      title: body.title,
      cost: parseInt(body.cost, 10),
      icon: body.icon || '🎁'
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
