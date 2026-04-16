import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function GET() {
  const db = getServiceClient()
  
  // Notice we don't query questions/answers until the specific story is loaded 
  // to avoid sending all answers to the client in advance if possible, 
  // but for simplicity we can just return everything unless we want strict cheating prevention
  const { data, error } = await db.from('stories').select('id, title, difficulty, created_at').order('created_at', { ascending: false })
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
