export type QuestionType =
  | 'introduce_word'
  | 'hear_es_choose_en'
  | 'hear_en_choose_es'
  | 'prompt_en_choose_es'
  | 'prompt_es_choose_en'
  | 'picture_choose_es'
  | 'picture_choose_en'
  | 'sentence_match'
  | 'sentence_build'
  | 'listen_repeat'
  | 'conjugate_verb'

export interface VerbItem {
  id: string
  infinitive_es: string
  infinitive_en: string
  yo: string
  tu: string
  el: string
  nosotros: string
  ellos: string
}

export interface VocabItem {
  id: string
  english_text: string
  spanish_text: string
  image_url: string | null
  distractors_en: string[]
  distractors_es: string[]
  category: string
  example_en: string | null
  example_es: string | null
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
  imageUrl?: string | null
  // Answer choices
  choices: { label: string; isCorrect: boolean }[]
  // The correct answer text (for feedback)
  correctAnswer: string
  exampleEn?: string | null
  exampleEs?: string | null
  
  // For conjugation type
  conjugationSubject?: string
  conjugationInfinitive?: string
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
  verbs: VerbItem[],
  targetCount: number = 10,
  progressMap?: Map<string, number>
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
      audioText: `Tap the English word for "${item.spanish_text}"`,
      audioLanguage: 'es',
      promptText: `Tap the English word for "${item.spanish_text}"`,
      choices: buildChoices(item.english_text, item.distractors_en, allEnglish),
      correctAnswer: item.english_text,
      exampleEn: item.example_en,
      exampleEs: item.example_es,
    })

    // Type 2: Hear English → choose Spanish
    questions.push({
      id: `${baseId}_hear_en_es`,
      type: 'hear_en_choose_es',
      itemId: item.id,
      itemType: 'vocabulary',
      audioText: `Tap the Spanish word for "${item.english_text}"`,
      audioLanguage: 'es',
      promptText: `Tap the Spanish word for "${item.english_text}"`,
      choices: buildChoices(item.spanish_text, item.distractors_es, allSpanish),
      correctAnswer: item.spanish_text,
      exampleEn: item.example_en,
      exampleEs: item.example_es,
    })

    // Type 3: English prompt → Spanish answer
    questions.push({
      id: `${baseId}_prompt_en_es`,
      type: 'prompt_en_choose_es',
      itemId: item.id,
      itemType: 'vocabulary',
      audioText: `What word is ${item.english_text}?`,
      audioLanguage: 'es',
      promptText: `What word is ${item.english_text}?`,
      choices: buildChoices(item.spanish_text, item.distractors_es, allSpanish),
      correctAnswer: item.spanish_text,
      exampleEn: item.example_en,
      exampleEs: item.example_es,
    })

    // Type 4: Picture → Spanish (if image available)
    if (item.image_url) {
      questions.push({
        id: `${baseId}_pic_es`,
        type: 'picture_choose_es',
        itemId: item.id,
        itemType: 'vocabulary',
        audioText: `What is this in Spanish?`,
        audioLanguage: 'es',
        promptText: 'What is this in Spanish?',
        imageUrl: item.image_url,
        choices: buildChoices(item.spanish_text, item.distractors_es, allSpanish),
        correctAnswer: item.spanish_text,
        exampleEn: item.example_en,
        exampleEs: item.example_es,
      })
    }
  }

  // Add sentence match questions
  for (const s of sentences) {
    // Original Sentence Match
    questions.push({
      id: `${s.id}_sentence_match`,
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

    // Phase 2: Sentence Builder
    questions.push({
      id: `${s.id}_sentence_build`,
      type: 'sentence_build',
      itemId: s.id,
      itemType: 'sentence',
      audioText: s.spanish_text,
      audioLanguage: 'es',
      promptText: `Translate this into English:`,
      // For sentence builder, we store the full translated sentence in correctAnswer
      // Choices can be individual words from the target sentence mixed with distractors.
      choices: [], // Not used the same way for drag/drop
      correctAnswer: s.english_text,
    })
  }

  // Adding Verb Conjugation Questions
  for (const v of verbs) {
    const subjects = [
      { sub: 'Yo', answer: v.yo },
      { sub: 'Tú', answer: v.tu },
      { sub: 'Él/Ella', answer: v.el },
      { sub: 'Nosotros', answer: v.nosotros },
      { sub: 'Ellos', answer: v.ellos },
    ]

    for (const { sub, answer } of subjects) {
      if (!answer) continue // skip if blank

      // The distractor pool is the other conjugations for this same verb
      const otherConjugations = subjects.map(s => s.answer).filter(s => s !== answer && s !== '')

      questions.push({
        id: `${v.id}_conj_${sub}`,
        type: 'conjugate_verb',
        itemId: v.id,
        itemType: 'vocabulary', // treating verbs as vocab for progress tracking
        audioText: `${sub} ${answer}`,
        audioLanguage: 'es',
        promptText: `Conjugate: ${v.infinitive_es} (${v.infinitive_en})`,
        conjugationSubject: sub,
        conjugationInfinitive: v.infinitive_es,
        choices: buildChoices(answer, otherConjugations, []),
        correctAnswer: answer,
      })
    }
  }

  // Spacer Repetition Logic: 
  // Base shuffle but weighted. Lower mastery items bubble to the top. Items with mastery > 3 get strongly penalized.
  const mapped = questions.map((q) => {
    let m = progressMap?.get(q.itemId) ?? 0
    if (m >= 3) m += 5 // Penalize heavily if already mastered 3+ times
    return { q, sortWeight: m + (Math.random() * 2) } 
  })

  mapped.sort((a, b) => a.sortWeight - b.sortWeight)
  const selected = shuffle(mapped.slice(0, targetCount).map(x => x.q)) // shuffle the chosen handful to mix types up

  // Gather unique vocab items used in the selection to introduce them first
  const usedVocabIds = new Set(selected.filter((q) => q.itemType === 'vocabulary').map((q) => q.itemId))
  const introductions: Question[] = []

  for (const item of vocab) {
    if (usedVocabIds.has(item.id)) {
      introductions.push({
        id: `${item.id}_intro`,
        type: 'introduce_word',
        itemId: item.id,
        itemType: 'vocabulary',
        audioText: item.spanish_text,
        audioLanguage: 'es',
        promptText: 'New word!',
        imageUrl: item.image_url,
        choices: [],
        correctAnswer: item.spanish_text, // used to display the Spanish word
        exampleEn: item.english_text, // hijack this field to display the English translation on the intro card
        exampleEs: item.example_es,
      })
    }
  }

  // Prepend introductions
  return [...introductions, ...selected]
}

