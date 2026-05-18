'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import styles from './bible.module.css'

interface BiblicalTerm {
  id: string
  term: string
  definition: string
  scripture_ref: string | null
  scripture_text: string | null
  category: string
  emoji: string
  distractor_1: string
  distractor_2: string
  distractor_3: string
  difficulty: number
  sort_order: number
}

interface Profile {
  id: string
  child_name: string
  avatar: string
  streak: number
  total_xp: number
}

type GamePhase = 'browse' | 'flashcard' | 'quiz' | 'results'

const CATEGORY_COLORS: Record<string, string> = {
  Faith:            '#818cf8',
  Salvation:        '#f472b6',
  Foundation:       '#38bdf8',
  Worship:          '#fbbf24',
  Promise:          '#34d399',
  Sacrament:        '#60a5fa',
  'Character of God': '#fb923c',
  Growth:           '#4ade80',
  Scripture:        '#a78bfa',
  Default:          '#94a3b8',
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Faith: '⭐',
  Salvation: '✝️',
  Foundation: '🏛️',
  Worship: '🎵',
  Promise: '🌈',
  Sacrament: '💧',
  'Character of God': '💛',
  Growth: '🌱',
  Scripture: '📜',
}

export default function BibleTermsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [terms, setTerms] = useState<BiblicalTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<GamePhase>('browse')

  // Flashcard state
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  // Quiz state
  const [quizTerms, setQuizTerms] = useState<BiblicalTerm[]>([])
  const [quizIndex, setQuizIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<boolean[]>([])
  const [showExplanation, setShowExplanation] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)

  // Completion state
  const [masteredIds, setMasteredIds] = useState<string[]>([])

  useEffect(() => {
    const p = localStorage.getItem('spanishkids_active_profile')
    if (!p) { router.push('/'); return }
    const parsed = JSON.parse(p)
    const all = JSON.parse(localStorage.getItem('spanishkids_profiles') || '[]')
    const updated = all.find((x: any) => x.id === parsed.id) || parsed
    setProfile(updated)

    // Load mastered terms from localStorage
    const mastered = JSON.parse(localStorage.getItem(`bible_mastered_${updated.id}`) || '[]')
    setMasteredIds(mastered)

    fetchTerms()
  }, [])

  async function fetchTerms() {
    try {
      const res = await fetch('/api/bible-terms')
      if (res.ok) {
        const data = await res.json()
        setTerms(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      // offline fallback — terms will be empty
    }
    setLoading(false)
  }

  function playPop() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(500, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.1)
    } catch (e) {}
  }

  function playCorrect() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      ;[523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.2)
        osc.start(ctx.currentTime + i * 0.12)
        osc.stop(ctx.currentTime + i * 0.12 + 0.25)
      })
    } catch (e) {}
  }

  function playWrong() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sawtooth'
      osc.frequency.value = 200
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.45)
    } catch (e) {}
  }

  // ── FLASHCARD MODE ──
  function startFlashcards() {
    setCardIndex(0)
    setFlipped(false)
    setPhase('flashcard')
    playPop()
  }

  function nextCard() {
    setFlipped(false)
    setTimeout(() => setCardIndex(i => i + 1), 150)
  }

  function prevCard() {
    setFlipped(false)
    setTimeout(() => setCardIndex(i => i - 1), 150)
  }

  // ── QUIZ MODE ──
  function startQuiz() {
    const shuffled = [...terms].sort(() => Math.random() - 0.5).slice(0, Math.min(10, terms.length))
    setQuizTerms(shuffled)
    setQuizIndex(0)
    setSelectedAnswer(null)
    setQuizAnswers([])
    setShowExplanation(false)
    setXpEarned(0)
    setPhase('quiz')
    playPop()
  }

  function getQuizChoices(term: BiblicalTerm): string[] {
    const choices = [
      term.definition,
      term.distractor_1,
      term.distractor_2,
      term.distractor_3,
    ].filter(Boolean)
    return choices.sort(() => Math.random() - 0.5)
  }

  function handleAnswer(choice: string) {
    if (selectedAnswer !== null) return
    const currentTerm = quizTerms[quizIndex]
    const isCorrect = choice === currentTerm.definition
    setSelectedAnswer(choice)
    setShowExplanation(true)
    const newAnswers = [...quizAnswers, isCorrect]
    setQuizAnswers(newAnswers)

    if (isCorrect) {
      playCorrect()
      setXpEarned(xp => xp + 15)
    } else {
      playWrong()
    }
  }

  function nextQuestion() {
    if (quizIndex + 1 >= quizTerms.length) {
      // Quiz done — save mastered terms & award XP
      finishQuiz()
    } else {
      setQuizIndex(i => i + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    }
  }

  function finishQuiz() {
    if (!profile) return
    const correctCount = quizAnswers.filter(Boolean).length

    // Mark terms from correct answers as mastered
    const newMastered = [...masteredIds]
    quizAnswers.forEach((correct, idx) => {
      if (correct && !newMastered.includes(quizTerms[idx].id)) {
        newMastered.push(quizTerms[idx].id)
      }
    })
    setMasteredIds(newMastered)
    localStorage.setItem(`bible_mastered_${profile.id}`, JSON.stringify(newMastered))

    // Award XP
    if (xpEarned > 0) {
      const newProfile = { ...profile, total_xp: (profile.total_xp || 0) + xpEarned }
      setProfile(newProfile)
      localStorage.setItem('spanishkids_active_profile', JSON.stringify(newProfile))
      const allProfiles = JSON.parse(localStorage.getItem('spanishkids_profiles') || '[]')
      localStorage.setItem('spanishkids_profiles', JSON.stringify(
        allProfiles.map((p: any) => p.id === newProfile.id ? newProfile : p)
      ))
      fetch('/api/profiles/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newProfile.id, total_xp: newProfile.total_xp })
      }).catch(() => {})
    }

    setPhase('results')
  }

  const currentCard = terms[cardIndex]
  const currentQuizTerm = quizTerms[quizIndex]
  const quizChoices = currentQuizTerm ? getQuizChoices(currentQuizTerm) : []

  // Group terms by category for browse view
  const categories = [...new Set(terms.map(t => t.category))]

  if (loading || !profile) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingEmoji}>✝️</div>
        <p>Loading Biblical Terms...</p>
      </div>
    )
  }

  // ── RESULTS PHASE ──
  if (phase === 'results') {
    const correct = quizAnswers.filter(Boolean).length
    const total = quizAnswers.length
    const pct = Math.round((correct / total) * 100)
    return (
      <div className={styles.page}>
        <div className={styles.resultsPage}>
          <div className={styles.resultsMedal}>
            {pct >= 90 ? '🏆' : pct >= 70 ? '🌟' : pct >= 50 ? '👍' : '📖'}
          </div>
          <h1 className={styles.resultsTitle}>
            {pct >= 90 ? 'Excellent! Well done!' : pct >= 70 ? 'Great Job!' : pct >= 50 ? 'Good Try!' : 'Keep Learning!'}
          </h1>
          <p className={styles.resultsScore}>{correct} / {total} correct ({pct}%)</p>
          {xpEarned > 0 && (
            <div className={styles.xpAward}>
              <span>⭐</span> +{xpEarned} XP earned!
            </div>
          )}
          <div className={styles.resultsBreakdown}>
            {quizTerms.map((term, i) => (
              <div key={term.id} className={`${styles.resultItem} ${quizAnswers[i] ? styles.resultCorrect : styles.resultWrong}`}>
                <span>{quizAnswers[i] ? '✅' : '❌'}</span>
                <span>{term.emoji} {term.term}</span>
              </div>
            ))}
          </div>
          <div className={styles.resultsActions}>
            <button className="btn btn-primary" onClick={startQuiz}>Play Again 🔄</button>
            <button className={styles.browseBtn} onClick={() => setPhase('browse')}>Back to Terms 📖</button>
          </div>
        </div>
      </div>
    )
  }

  // ── QUIZ PHASE ──
  if (phase === 'quiz') {
    const progress = ((quizIndex) / quizTerms.length) * 100
    return (
      <div className={styles.page}>
        <div className={styles.quizHeader}>
          <button className={styles.backBtn} onClick={() => setPhase('browse')}>←</button>
          <div className={styles.quizProgress}>
            <div className={styles.quizProgressBar}>
              <div className={styles.quizProgressFill} style={{ width: `${progress}%` }} />
            </div>
            <span>{quizIndex + 1} / {quizTerms.length}</span>
          </div>
          <div className={styles.quizXp}>⭐ +{xpEarned}</div>
        </div>

        {currentQuizTerm && (
          <div className={styles.quizContainer}>
            <div className={styles.quizCard}>
              <div className={styles.quizEmoji}>{currentQuizTerm.emoji}</div>
              <h2 className={styles.quizTerm}>{currentQuizTerm.term}</h2>
              <p className={styles.quizInstruction}>What does this word mean?</p>
            </div>

            <div className={styles.choiceGrid}>
              {quizChoices.map((choice, i) => {
                const isSelected = selectedAnswer === choice
                const isCorrect = choice === currentQuizTerm.definition
                let choiceClass = styles.choiceBtn
                if (selectedAnswer !== null) {
                  if (isCorrect) choiceClass = `${styles.choiceBtn} ${styles.choiceCorrect}`
                  else if (isSelected) choiceClass = `${styles.choiceBtn} ${styles.choiceWrong}`
                  else choiceClass = `${styles.choiceBtn} ${styles.choiceDim}`
                }
                return (
                  <button
                    key={i}
                    className={choiceClass}
                    onClick={() => handleAnswer(choice)}
                    disabled={selectedAnswer !== null}
                  >
                    {choice}
                  </button>
                )
              })}
            </div>

            {showExplanation && (
              <div className={`${styles.explanation} ${selectedAnswer === currentQuizTerm.definition ? styles.explanationCorrect : styles.explanationWrong}`}>
                {selectedAnswer === currentQuizTerm.definition ? (
                  <>
                    <strong>✅ Correct!</strong> {currentQuizTerm.definition}
                    {currentQuizTerm.scripture_ref && (
                      <div className={styles.verseRef}>
                        📖 <em>"{currentQuizTerm.scripture_text}"</em> — {currentQuizTerm.scripture_ref}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <strong>❌ Not quite.</strong> "{currentQuizTerm.term}" means: {currentQuizTerm.definition}
                  </>
                )}
                <button
                  className={styles.nextBtn}
                  onClick={nextQuestion}
                >
                  {quizIndex + 1 >= quizTerms.length ? 'See Results 🏁' : 'Next Word →'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── FLASHCARD PHASE ──
  if (phase === 'flashcard') {
    return (
      <div className={styles.page}>
        <div className={styles.flashcardHeader}>
          <button className={styles.backBtn} onClick={() => setPhase('browse')}>←</button>
          <span className={styles.flashcardCounter}>{cardIndex + 1} of {terms.length}</span>
          <div style={{ width: '2.5rem' }} />
        </div>

        {currentCard && (
          <div className={styles.flashcardArea}>
            {/* Progress dots */}
            <div className={styles.dotRow}>
              {terms.map((_, i) => (
                <div key={i} className={`${styles.dot} ${i === cardIndex ? styles.dotActive : ''} ${masteredIds.includes(terms[i].id) ? styles.dotMastered : ''}`} />
              ))}
            </div>

            {/* Card */}
            <div className={`${styles.flashcard} ${flipped ? styles.flashcardFlipped : ''}`} onClick={() => setFlipped(f => !f)}>
              <div className={styles.flashcardInner}>
                {/* Front */}
                <div className={styles.flashcardFront}>
                  <div className={styles.fcEmoji}>{currentCard.emoji}</div>
                  <h2 className={styles.fcTerm}>{currentCard.term}</h2>
                  <span className={styles.fcCategory} style={{ background: (CATEGORY_COLORS[currentCard.category] ?? CATEGORY_COLORS.Default) + '22', color: CATEGORY_COLORS[currentCard.category] ?? CATEGORY_COLORS.Default }}>
                    {CATEGORY_EMOJIS[currentCard.category] ?? '📖'} {currentCard.category}
                  </span>
                  <p className={styles.tapHint}>Tap to reveal definition ↓</p>
                </div>
                {/* Back */}
                <div className={styles.flashcardBack}>
                  <div className={styles.fcEmoji}>{currentCard.emoji}</div>
                  <p className={styles.fcDefinition}>{currentCard.definition}</p>
                  {currentCard.scripture_ref && (
                    <div className={styles.fcVerse}>
                      <div className={styles.fcVerseText}>"{currentCard.scripture_text}"</div>
                      <div className={styles.fcVerseRef}>— {currentCard.scripture_ref}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className={styles.flashcardNav}>
              <button className={styles.navBtn} onClick={prevCard} disabled={cardIndex === 0}>← Prev</button>
              <button className={styles.startQuizMini} onClick={startQuiz}>Take Quiz ✏️</button>
              <button className={styles.navBtn} onClick={nextCard} disabled={cardIndex === terms.length - 1}>Next →</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── BROWSE PHASE (default) ──
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/learn')}>←</button>
        <div className={styles.headerTitle}>
          <span>✝️</span>
          <span>Biblical Terms</span>
        </div>
        <div className={styles.profileBadge}>
          <span>{profile.avatar}</span>
          <span>⭐ {profile.total_xp}</span>
        </div>
      </div>

      {/* Hero banner */}
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>God's Word 📖</h1>
          <p className={styles.heroSubtitle}>Learn the language of faith! {terms.length} terms to explore.</p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>{masteredIds.length}</span>
              <span className={styles.heroStatLabel}>Mastered</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>{terms.length - masteredIds.length}</span>
              <span className={styles.heroStatLabel}>To Learn</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className={styles.actionRow}>
        <button className={styles.flashcardAction} onClick={startFlashcards} disabled={terms.length === 0}>
          <span style={{ fontSize: '1.8rem' }}>🃏</span>
          <span>Flashcards</span>
          <span className={styles.actionSub}>Flip to learn</span>
        </button>
        <button className={styles.quizAction} onClick={startQuiz} disabled={terms.length === 0}>
          <span style={{ fontSize: '1.8rem' }}>✏️</span>
          <span>Take Quiz</span>
          <span className={styles.actionSub}>Earn ⭐ XP</span>
        </button>
      </div>

      {/* Terms by category */}
      {terms.length === 0 && (
        <div className={styles.emptyState}>
          <div style={{ fontSize: '4rem', animation: 'float 3s ease-in-out infinite' }}>📖</div>
          <p>No biblical terms yet.</p>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Ask a parent to add terms in the admin panel.</p>
        </div>
      )}

      {categories.map(cat => {
        const catTerms = terms.filter(t => t.category === cat)
        const color = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Default
        const catEmoji = CATEGORY_EMOJIS[cat] ?? '📖'
        return (
          <div key={cat} className={styles.categorySection}>
            <h2 className={styles.categoryTitle} style={{ color }}>
              {catEmoji} {cat}
            </h2>
            <div className={styles.termGrid}>
              {catTerms.map(term => {
                const isMastered = masteredIds.includes(term.id)
                return (
                  <div key={term.id} className={`${styles.termCard} ${isMastered ? styles.termMastered : ''}`}>
                    <div className={styles.termCardTop}>
                      <span className={styles.termEmoji}>{term.emoji}</span>
                      {isMastered && <span className={styles.masteredBadge}>✅</span>}
                    </div>
                    <div className={styles.termWord}>{term.term}</div>
                    <p className={styles.termDef}>{term.definition}</p>
                    {term.scripture_ref && (
                      <div className={styles.termRef}>📖 {term.scripture_ref}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div style={{ height: '2rem' }} />
    </div>
  )
}
