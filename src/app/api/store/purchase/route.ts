import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function POST(req: Request) {
  const db = getServiceClient()
  const body = await req.json()
  const { profileId, rewardId } = body

  if (!profileId || !rewardId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  // Verify reward cost
  const { data: reward, error: rErr } = await db.from('rewards').select('*').eq('id', rewardId).single()
  if (rErr || !reward) return NextResponse.json({ error: 'Reward not found' }, { status: 404 })

  // Check user XP
  const { data: profile, error: pErr } = await db.from('child_profiles').select('total_xp').eq('id', profileId).single()
  if (pErr || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  if (profile.total_xp < reward.cost) {
    return NextResponse.json({ error: 'Not enough XP' }, { status: 400 })
  }

  // Deduct XP
  const newXp = profile.total_xp - reward.cost
  await db.from('child_profiles').update({ total_xp: newXp }).eq('id', profileId)

  // Insert purchase log
  await db.from('reward_purchases').insert({
    profile_id: profileId,
    reward_id: rewardId,
    status: 'pending'
  })

  // We return the new XP so the client can update localStorage securely
  return NextResponse.json({ success: true, newXp })
}
