/**
 * Nuclear reset: mark ALL audio_cache entries as 'error' so they regenerate on demand.
 * Use this when files are corrupted/0-byte and you want a clean slate.
 * Files will repopulate automatically as users play each word.
 *
 * Run with:
 *   $env:NEXT_PUBLIC_SUPABASE_URL="https://oqrgkndlzmprayyfhvil.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="your_key"
 *   node scripts/reset-broken-audio.js
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars')
  process.exit(1)
}

const db = createClient(supabaseUrl, supabaseKey)

async function resetAll() {
  console.log('Resetting ALL audio_cache entries to force regeneration...')

  const { error, count } = await db
    .from('audio_cache')
    .update({ 
      status: 'error', 
      file_url: null,
      error_message: 'Bulk reset — files were 0-byte. Will regenerate on next play.' 
    })
    .neq('id', '00000000-0000-0000-0000-000000000000') // match all rows

  if (error) {
    console.error('Failed:', error.message)
    process.exit(1)
  }

  console.log(`✅ All audio cache entries reset. Audio will regenerate as kids play lessons.`)
}

resetAll()
