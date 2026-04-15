import { createClient } from '@supabase/supabase-js'

// Public client (anon key) — for client components
// Gracefully returns null during build if env vars are placeholders
export const supabase = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || url === 'your_supabase_url_here' || !key || key === 'your_supabase_anon_key_here') {
    return null as any // only during build; runtime will have real values via Vercel
  }
  return createClient(url, key)
})()

// Server-side admin client (service role) — for API routes only
export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !key) throw new Error('Missing Supabase server env vars')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
