import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

/** GET /api/bible-terms — public endpoint, kids fetch all terms */
export async function GET() {
  const db = getServiceClient()
  const { data, error } = await db
    .from('biblical_terms')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
