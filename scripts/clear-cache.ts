import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function clearAudioCache() {
  console.log('🗑️ Clearing audio cache...')
  
  // We can't do delete() without filters, so we just filter where id is NOT null
  const { error } = await supabase.from('audio_cache').delete().not('id', 'is', null)

  if (error) {
    console.error('❌ Failed to clear cache:', error.message)
    process.exit(1)
  }

  // Also we need to reset all lesson 'audio_ready' flags to false!
  await supabase.from('lessons').update({ audio_ready: false }).not('id', 'is', null)

  console.log('✅ Successfully cleared audio cache and reset lesson flags!')
}

clearAudioCache().catch(console.error)
