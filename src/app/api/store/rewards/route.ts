import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function GET(req: Request) {
  const db = getServiceClient()
  
  const { data, error } = await db
    .from('rewards')
    .select('*')
    .order('cost', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
