import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { isAdminAuth } from '@/lib/admin-auth'

export async function GET(req: Request) {
  if (!isAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getServiceClient()

  const { data, error } = await db
    .from('audio_cache')
    .select('*')
    .eq('status', 'error')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
