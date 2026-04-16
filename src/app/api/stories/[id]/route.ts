import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getServiceClient()
  const { id } = await params

  const { data, error } = await db.from('stories').select('*').eq('id', id).single()
  
  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Story not found' }, { status: 404 })
  }
  
  return NextResponse.json(data)
}
