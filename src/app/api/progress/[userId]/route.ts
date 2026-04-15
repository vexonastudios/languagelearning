import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const db = getServiceClient()
  const { data, error } = await db
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
