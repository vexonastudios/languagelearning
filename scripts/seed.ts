/**
 * Seed script — run once after creating the Supabase schema.
 * Usage: npx tsx scripts/seed.ts
 */
import { createClient } from '@supabase/supabase-js'
import lessons from '../content/seed/lessons.json'
import vocab from '../content/seed/vocab.json'
import sentences from '../content/seed/sentences.json'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seed() {
  console.log('🌱 Seeding lessons...')

  // Insert lessons
  const { data: insertedLessons, error: lessonError } = await supabase
    .from('lessons')
    .insert(lessons.map((l) => ({ ...l, status: 'draft' })))
    .select()

  if (lessonError) {
    console.error('❌ Lesson insert failed:', lessonError.message)
    process.exit(1)
  }
  console.log(`✅ Inserted ${insertedLessons?.length} lessons`)

  // Build a lookup: title → id
  const lessonMap: Record<string, string> = {}
  for (const l of insertedLessons ?? []) {
    lessonMap[l.title] = l.id
  }

  // Insert vocab
  console.log('🌱 Seeding vocabulary...')
  const vocabRows = vocab.map((v: any, i: number) => ({
    english_text: v.english_text,
    spanish_text: v.spanish_text,
    lesson_id: lessonMap[v.lesson] ?? null,
    category: v.category,
    tags: v.tags,
    difficulty: v.difficulty,
    distractors_en: v.distractors_en,
    distractors_es: v.distractors_es,
    sort_order: i,
  }))

  const { error: vocabError } = await supabase.from('vocabulary_items').insert(vocabRows)
  if (vocabError) {
    console.error('❌ Vocab insert failed:', vocabError.message)
    process.exit(1)
  }
  console.log(`✅ Inserted ${vocabRows.length} vocab items`)

  // Insert sentences
  console.log('🌱 Seeding sentences...')
  const sentenceRows = sentences.map((s: any, i: number) => ({
    english_text: s.english_text,
    spanish_text: s.spanish_text,
    lesson_id: lessonMap[s.lesson] ?? null,
    category: s.category,
    grammar_focus: s.grammar_focus,
    sort_order: i,
  }))

  const { error: sentenceError } = await supabase.from('sentences').insert(sentenceRows)
  if (sentenceError) {
    console.error('❌ Sentence insert failed:', sentenceError.message)
    process.exit(1)
  }
  console.log(`✅ Inserted ${sentenceRows.length} sentences`)

  console.log('\n🎉 Seed complete!')
  console.log('\nNext steps:')
  console.log('  1. Go to your Supabase dashboard → Storage → create bucket: audio-cache (public)')
  console.log('  2. Run the app: npm run dev')
  console.log('  3. Go to /admin to publish lessons and render audio')
}

seed().catch(console.error)
