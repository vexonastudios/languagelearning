import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function GET() {
  const db = getServiceClient()
  const { data, error } = await db
    .from('lessons')
    .select('*')
    .eq('status', 'published')
    .order('"order"', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
