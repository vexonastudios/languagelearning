export type QuestionType =
  | 'hear_es_choose_en'
  | 'hear_en_choose_es'
  | 'prompt_en_choose_es'
  | 'prompt_es_choose_en'
  | 'picture_choose_es'
  | 'picture_choose_en'
  | 'sentence_match'
  | 'listen_repeat'

export interface VocabItem {
  id: string
  english_text: string
  spanish_text: string
  image_url: string | null
  distractors_en: string[]
  distractors_es: string[]
  category: string
}

export interface SentenceItem {
  id: string
  english_text: string
  spanish_text: string
}

export interface Question {
  id: string
  type: QuestionType
  itemId: string
  itemType: 'vocabulary' | 'sentence'
  // Audio to play as the prompt
  audioText: string
  audioLanguage: 'en' | 'es'
  // Display text (for accessibility / fallback)
  promptText: string
  // Image (if picture question)
  imageUrl?: string
  // Answer choices
  choices: { label: string; isCorrect: boolean }[]
  // The correct answer text (for feedback)
  correctAnswer: string
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildChoices(
  correct: string,
  distractors: string[],
  allFallback: string[]
): { label: string; isCorrect: boolean }[] {
  // Pick 3 distractors
  let pool = distractors.length >= 3
    ? distractors
    : [...distractors, ...allFallback.filter((x) => x !== correct)]
  
  const wrong = shuffle(pool.filter((x) => x !== correct)).slice(0, 3)
  
  return shuffle([
    { label: correct, isCorrect: true },
    ...wrong.map((w) => ({ label: w, isCorrect: false })),
  ])
}

/**
 * Build a mixed question set for a lesson from its vocabulary and sentences.
 * Returns 6–12 questions per call, mixing types based on what's available.
 */
export function buildQuestionSet(
  vocab: VocabItem[],
  sentences: SentenceItem[],
  targetCount: number = 10
): Question[] {
  const allEnglish = vocab.map((v) => v.english_text)
  const allSpanish = vocab.map((v) => v.spanish_text)

  const questions: Question[] = []

  // Generate questions per vocab item
  for (const item of vocab) {
    const baseId = item.id

    // Type 1: Hear Spanish → choose English
    questions.push({
      id: `${baseId}_hear_es_en`,
      type: 'hear_es_choose_en',
      itemId: item.id,
      itemType: 'vocabulary',
      audioText: item.spanish_text,
      audioLanguage: 'es',
      promptText: `Tap the English word for "${item.spanish_text}"`,
      choices: buildChoices(item.english_text, item.distractors_en, allEnglish),
      correctAnswer: item.english_text,
    })

    // Type 2: Hear English → choose Spanish
    questions.push({
      id: `${baseId}_hear_en_es`,
      type: 'hear_en_choose_es',
      itemId: item.id,
      itemType: 'vocabulary',
      audioText: item.english_text,
      audioLanguage: 'en',
      promptText: `Tap the Spanish word for "${item.english_text}"`,
      choices: buildChoices(item.spanish_text, item.distractors_es, allSpanish),
      correctAnswer: item.spanish_text,
    })

    // Type 3: English prompt → Spanish answer
    questions.push({
      id: `${baseId}_prompt_en_es`,
      type: 'prompt_en_choose_es',
      itemId: item.id,
      itemType: 'vocabulary',
      audioText: `What word is ${item.english_text}?`,
      audioLanguage: 'en',
      promptText: `What word is ${item.english_text}?`,
      choices: buildChoices(item.spanish_text, item.distractors_es, allSpanish),
      correctAnswer: item.spanish_text,
    })

    // Type 4: Picture → Spanish (if image available)
    if (item.image_url) {
      questions.push({
        id: `${baseId}_pic_es`,
        type: 'picture_choose_es',
        itemId: item.id,
        itemType: 'vocabulary',
        audioText: `What is this in Spanish?`,
        audioLanguage: 'en',
        promptText: 'What is this in Spanish?',
        imageUrl: item.image_url,
        choices: buildChoices(item.spanish_text, item.distractors_es, allSpanish),
        correctAnswer: item.spanish_text,
      })
    }
  }

  // Add sentence match questions
  for (const s of sentences) {
    questions.push({
      id: `${s.id}_sentence`,
      type: 'sentence_match',
      itemId: s.id,
      itemType: 'sentence',
      audioText: s.spanish_text,
      audioLanguage: 'es',
      promptText: `What does this mean in English?`,
      choices: buildChoices(
        s.english_text,
        sentences.filter((x) => x.id !== s.id).map((x) => x.english_text),
        []
      ),
      correctAnswer: s.english_text,
    })
  }

  // Shuffle and return target count
  return shuffle(questions).slice(0, targetCount)
}
