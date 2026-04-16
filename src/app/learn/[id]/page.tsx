'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAudio } from '@/hooks/useAudio'
import type { Question } from '@/lib/lesson-engine'
import styles from './play.module.css'

interface Lesson {
  id: string
  title: string
  category: string
}

type AnswerState = 'idle' | 'correct' | 'wrong'

const FEEDBACK_MESSAGES = {
  correct: ['¡Perfecto! 🎉', '¡Muy bien! ⭐', 'Great job! 🏆', '¡Excelente! 🌟', 'You got it! 🎊'],
  wrong: ['Try again! 💪', 'Almost! 🤔', 'Keep going! ✨', 'So close! 💫'],
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function playDing() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(800, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1)
  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.5)
}

function playBuzz() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(150, ctx.currentTime)
  gain.gain.setValueAtTime(0, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.3)
}

function playFanfare() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const osc3 = ctx.createOscillator()
  const gain = ctx.createGain()
  osc1.connect(gain)
  osc2.connect(gain)
  osc3.connect(gain)
  gain.connect(ctx.destination)
  
  osc1.type = 'square'
  osc2.type = 'square'
  osc3.type = 'square'
  
  const t = ctx.currentTime
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(0.5, t + 0.05)
  
  osc1.frequency.setValueAtTime(523.25, t) 
  osc2.frequency.setValueAtTime(659.25, t + 0.15)
  osc3.frequency.setValueAtTime(783.99, t + 0.3)
  
  osc1.start(t)
  osc2.start(t + 0.15)
  osc3.start(t + 0.3)
  
  gain.gain.exponentialRampToValueAtTime(0.01, t + 1)
  osc1.stop(t + 1.2)
  osc2.stop(t + 1.2)
  osc3.stop(t + 1.2)
}

export default function LessonPlayPage() {
  const router = useRouter()
  const params = useParams()
  const lessonId = params.id as string
  const { play } = useAudio()

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [wrongChoices, setWrongChoices] = useState<string[]>([])
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [showExample, setShowExample] = useState(false)
  const [isStarted, setIsStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ id: string; child_name: string; avatar: string; streak?: number; total_xp?: number; last_active_at?: string } | null>(null)
  const [stars, setStars] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [reportingAudio, setReportingAudio] = useState(false)

  // Phase 2: Sentence Builder state
  const [builtSentence, setBuiltSentence] = useState<string[]>([])
  const [wordBank, setWordBank] = useState<{ id: string; word: string }[]>([])

  // Setup word bank when question changes
  useEffect(() => {
    if (!questions[currentIndex]) return
    const q = questions[currentIndex]
    
    if (q.type === 'sentence_build') {
      const words = q.correctAnswer.split(' ').filter(Boolean)
      
      // Add a couple of dummy distractors
      const distractors = ['the', 'is', 'a', 'not', 'you'].filter(w => !words.map(x => x.toLowerCase()).includes(w))
      const extra = distractors.slice(0, 2)
      
      const allWords = [...words, ...extra]
      // Shuffle words
      allWords.sort(() => Math.random() - 0.5)
      
      setWordBank(allWords.map((w, index) => ({ id: `${index}-${w}`, word: w })))
      setBuiltSentence([])
    }
  }, [currentIndex, questions])

  useEffect(() => {
    const p = localStorage.getItem('spanishkids_active_profile')
    if (p) setProfile(JSON.parse(p))
    loadLesson()
  }, [lessonId])

  async function loadLesson() {
    const p = localStorage.getItem('spanishkids_active_profile')
    const parsed = p ? JSON.parse(p) : null
    const url = parsed ? `/api/lessons/${lessonId}?userId=${parsed.id}` : `/api/lessons/${lessonId}`
    const res = await fetch(url)
    const data = await res.json()
    setLesson(data.lesson)
    setQuestions(data.questions ?? [])
    setLoading(false)
  }

  const currentQuestion = questions[currentIndex]

  // Auto-play question audio on mount and question change
  useEffect(() => {
    if (isStarted && currentQuestion && answerState === 'idle') {
      setTimeout(() => {
        play(currentQuestion.audioText, currentQuestion.audioLanguage)
      }, 300)
    }
  }, [isStarted, currentIndex, questions, answerState])

  function reportBadAudio() {
    setReportingAudio(true)
  }

  async function confirmReportAudio() {
    if (!currentQuestion) return
    setReportingAudio(false)
    await fetch('/api/audio/flag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: currentQuestion.audioText, 
        language: currentQuestion.audioLanguage 
      })
    })
    setFeedbackMsg('⚠️ Audio flagged for developers to fix!')
    setTimeout(() => { if (feedbackMsg === '⚠️ Audio flagged for developers to fix!') setFeedbackMsg('') }, 3000)
  }

  async function handleAnswer(choice: { label: string; isCorrect: boolean }) {
    if (answerState === 'correct') return
    if (wrongChoices.includes(choice.label)) return // Don't allow clicking the same wrong answer twice

    setSelectedChoice(choice.label)

    if (choice.isCorrect) {
      setAnswerState('correct')
      
      // Calculate score only if they answered right on the very first try
      if (wrongChoices.length === 0) {
        setScore((n) => n + 1)
      }
      setTotalAnswered((n) => n + 1)
      setXpEarned((n) => n + 10)
      setFeedbackMsg(randomPick(FEEDBACK_MESSAGES.correct))
      
      // Play ding immediately
      playDing()
      
      // Play context audio OR example sentence
      if (currentQuestion.exampleEs && currentQuestion.exampleEn) {
         setShowExample(true)
         setTimeout(() => {
           play(currentQuestion.exampleEs!, 'es')
         }, 600)
         setTimeout(advance, 4000)
      } else if (currentQuestion.type !== 'sentence_build' && currentQuestion.type !== 'sentence_match') {
        setTimeout(() => {
          if (currentQuestion.audioLanguage === 'en') {
            play(currentQuestion.audioText, 'en')
            setTimeout(() => play(currentQuestion.correctAnswer, 'es'), 1100)
          } else {
            play(currentQuestion.correctAnswer, 'en')
            setTimeout(() => play(currentQuestion.audioText, 'es'), 1100)
          }
        }, 500)
        setTimeout(advance, 3500)
      } else {
        setTimeout(() => play(currentQuestion.correctAnswer, 'es'), 500)
        setTimeout(advance, 2500)
      }

      // Record progress
      if (profile && currentQuestion) {
        fetch('/api/progress/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: profile.id,
            itemId: currentQuestion.itemId,
            itemType: currentQuestion.itemType,
            correct: wrongChoices.length === 0, // Only count as correct mastery if they got it first try
            lessonId,
          }),
        })
      }
    } else {
      // It's wrong! Let them try again.
      setWrongChoices((prev) => [...prev, choice.label])
      setFeedbackMsg(randomPick(FEEDBACK_MESSAGES.wrong))
      playBuzz()
      // Synthesize immediate TTS error using English voice
      setTimeout(() => play('Try again.', 'en'), 300)

      // Record wrong
      if (profile && currentQuestion && wrongChoices.length === 0) {
        // Only record the FIRST wrong attempt to drop their mastery score
        fetch('/api/progress/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: profile.id,
            itemId: currentQuestion.itemId,
            itemType: currentQuestion.itemType,
            correct: false,
            lessonId,
          }),
        })
      }
    }
  }

  function advance() {
    if (currentIndex + 1 >= questions.length) {
      // Calculate stars based on FIRST-TRY correct answers
      const accuracy = score / questions.length
      const earned = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1
      setStars(earned)
      
      // Also update total XP for the profile
      const stored = localStorage.getItem('spanishkids_profiles')
      if (profile && stored) {
        const list = JSON.parse(stored)
        const updatedList = list.map((p: any) => {
          if (p.id === profile.id) {
            const newTotal = (p.total_xp || 0) + xpEarned
            setProfile({ ...p, total_xp: newTotal })
            return { ...p, total_xp: newTotal }
          }
          return p
        })
        localStorage.setItem('spanishkids_profiles', JSON.stringify(updatedList))
        
        // Save completion
        const completedKey = `spanishkids_completed_${profile.id}`
        const completed = JSON.parse(localStorage.getItem(completedKey) || '[]')
        if (lesson && !completed.includes(lesson.id)) {
          completed.push(lesson.id)
          localStorage.setItem(completedKey, JSON.stringify(completed))
        }

        // Apply Streak Logic (Only triggers on FULL LESSON COMPLETION)
        const today = new Date().toISOString().split('T')[0]
        let updatedProfile = { ...profile }

        if (profile.last_active_at) {
          const prevDate = new Date(today)
          prevDate.setDate(prevDate.getDate() - 1)
          const yesterdayStr = prevDate.toISOString().split('T')[0]

          if (profile.last_active_at === yesterdayStr) {
            updatedProfile.streak = (profile.streak || 0) + 1
          } else if (profile.last_active_at !== today) {
            updatedProfile.streak = 1
          }
        } else {
          updatedProfile.streak = 1
        }
        updatedProfile.last_active_at = today
        
        // Save back to sync
        localStorage.setItem('spanishkids_active_profile', JSON.stringify(updatedProfile))
        const allProfiles = JSON.parse(localStorage.getItem('spanishkids_profiles') || '[]')
        const newAll = allProfiles.map((p: any) => p.id === updatedProfile.id ? updatedProfile : p)
        localStorage.setItem('spanishkids_profiles', JSON.stringify(newAll))
      }
      
      setFinished(true)
      setTimeout(playFanfare, 400)
    } else {
      setCurrentIndex((n) => n + 1)
      setAnswerState('idle')
      setWrongChoices([])
      setSelectedChoice(null)
      setFeedbackMsg('')
      setShowExample(false)
      setReportingAudio(false)
    }
  }

  function replayAudio() {
    if (currentQuestion) {
      play(currentQuestion.audioText, currentQuestion.audioLanguage)
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingEmoji}>🌟</div>
        <p>Loading lesson...</p>
      </div>
    )
  }

  // Finished screen
  if (finished) {
    return (
      <div className={styles.finishedPage}>
        <div className={styles.finishedCard}>
          <div className={styles.trophyEmoji}>🏆</div>
          <h2 className={styles.finishedTitle}>Lesson Complete!</h2>
          <div className={styles.starsRow}>
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`${styles.star} ${s <= stars ? styles.starEarned : styles.starEmpty}`}
                style={{ animationDelay: `${(s - 1) * 0.15}s` }}
              >
                ⭐
              </span>
            ))}
          </div>
          <div className={styles.scoreRow}>
            <div className={styles.scoreStat}>
              <div className={styles.scoreNum}>{score}</div>
              <div className={styles.scoreLabel}>Correct</div>
            </div>
            <div className={styles.scoreDivider} />
            <div className={styles.scoreStat}>
              <div className={styles.scoreNum}>{questions.length}</div>
              <div className={styles.scoreLabel}>Total</div>
            </div>
            <div className={styles.scoreDivider} />
            <div className={styles.scoreStat}>
              <div className={styles.scoreNum}>+{xpEarned}</div>
              <div className={styles.scoreLabel}>XP</div>
            </div>
          </div>
          <button
            id="nextLessonBtn"
            className={`btn btn-primary ${styles.nextBtn}`}
            onClick={() => router.push('/learn')}
          >
            More Lessons 🚀
          </button>
          <button
            className={styles.retryBtn}
            onClick={() => {
              setCurrentIndex(0)
              setScore(0)
              setTotalAnswered(0)
              setXpEarned(0)
              setFinished(false)
              setAnswerState('idle')
              setSelectedChoice(null)
            }}
          >
            Try Again 🔄
          </button>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className={styles.loading}>
        <p>No questions available for this lesson yet.</p>
        <button className="btn btn-primary" onClick={() => router.push('/learn')}>
          Back
        </button>
      </div>
    )
  }

  if (!isStarted) {
    return (
      <div className={styles.startShield}>
        <div className={styles.loadingEmoji}>🌟</div>
        <h2 className={styles.startShieldTitle}>Ready?</h2>
        <button className="btn btn-primary" onClick={() => setIsStarted(true)} style={{ fontSize: '1.5rem', padding: '1rem 3rem' }}>
          Start
        </button>
      </div>
    )
  }

  const progress = ((currentIndex) / questions.length) * 100

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.closeBtn} onClick={() => router.push('/learn')}>✕</button>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.questionCount}>
          {currentIndex + 1}/{questions.length}
        </div>
      </div>

      {/* Question Area */}
      <div className={styles.questionArea}>
        {/* Audio prompt button */}
        <div style={{ position: 'relative' }}>
          <button
            id="playAudioBtn"
            className={`${styles.audioBtn} ${answerState === 'correct' ? styles.audioBtnPulse : ''}`}
            onClick={replayAudio}
          >
            🔊
          </button>
          <button 
            onClick={reportBadAudio} 
            title="Report bad audio pronunciation"
            className={styles.reportAudioBtn}
          >
            ⚠️
          </button>
        </div>

        {/* Image if picture question */}
        {currentQuestion.imageUrl && (
          <div className={styles.questionImage}>
            <img src={currentQuestion.imageUrl} alt="question" />
          </div>
        )}

        {/* Prompt text */}
        <p className={styles.promptText}>{currentQuestion.promptText}</p>
        
        {/* Example sentence override display */}
        {showExample && currentQuestion.exampleEs && (
          <div className={styles.exampleSentenceBox}>
            <p className={styles.exampleEs}>{currentQuestion.exampleEs}</p>
            <p className={styles.exampleEn}>{currentQuestion.exampleEn}</p>
          </div>
        )}

        {/* Reporting inline box */}
        {reportingAudio && (
          <div style={{ background: '#fef2f2', border: '2px solid #fecaca', padding: '1rem', borderRadius: '1rem', textAlign: 'center', marginTop: '1rem', animation: 'pop-in 0.2s' }}>
            <p style={{ fontWeight: 800, color: '#991b1b', marginBottom: '0.75rem' }}>Flag this pronunciation as incorrect?</p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={confirmReportAudio} style={{ background: '#ef4444', borderColor: '#b91c1c' }}>Yes, it's bad</button>
              <button className="btn" onClick={() => setReportingAudio(false)} style={{ background: '#e2e8f0', color: '#64748b' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {currentQuestion.type === 'introduce_word' ? (
        <div className={styles.introCard}>
          <h1 className={styles.introEs}>{currentQuestion.correctAnswer}</h1>
          <p className={styles.introEn}>{currentQuestion.exampleEn}</p>
          
          <button className="btn btn-primary" onClick={advance} style={{ marginTop: '2rem', width: '100%' }}>
            Got it!
          </button>
        </div>
      ) : currentQuestion.type === 'sentence_build' ? (
        <div className={styles.sentenceBuilderArea}>
          <div className={styles.dropZone}>
            {builtSentence.length === 0 && <span className={styles.dropPlaceholder}>Tap words below to build the sentence...</span>}
            {builtSentence.map((word, i) => (
              <button 
                key={i} 
                className={`${styles.wordTile} ${styles.wordTileSelected}`}
                onClick={() => {
                  if (answerState !== 'idle') return
                  // Remove from built string, put back in bank
                  setBuiltSentence(prev => prev.filter((_, index) => index !== i))
                  setWordBank(prev => [...prev, { id: `returned-${Date.now()}-${word}`, word }])
                }}
              >
                {word}
              </button>
            ))}
          </div>
          
          <div className={styles.wordBank}>
            {wordBank.map((item) => (
              <button
                key={item.id}
                className={styles.wordTile}
                onClick={() => {
                  if (answerState !== 'idle') return
                  // Add to built string, remove from bank
                  setBuiltSentence(prev => [...prev, item.word])
                  setWordBank(prev => prev.filter(w => w.id !== item.id))
                }}
              >
                {item.word}
              </button>
            ))}
          </div>

          <button 
            className={`btn btn-primary ${styles.checkBtn}`}
            style={{ marginTop: '1rem', width: '100%' }}
            disabled={builtSentence.length === 0 || answerState !== 'idle'}
            onClick={() => handleAnswer({
              label: builtSentence.join(' '), 
              isCorrect: builtSentence.join(' ').toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ") === 
                         currentQuestion.correctAnswer.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ")
            })}
          >
            Check Answer
          </button>
        </div>
      ) : (
        <div className={styles.choicesGrid}>
          {currentQuestion.choices.map((choice, i) => {
            const isWrong = wrongChoices.includes(choice.label)
            let choiceState = ''
            
            if (answerState === 'correct') {
               if (choice.isCorrect) choiceState = styles.choiceCorrect
               else choiceState = styles.choiceDimmed
            } else if (isWrong) {
               choiceState = styles.choiceWrong
            }

            return (
              <button
                key={i}
                id={`choice-${i}`}
                className={`${styles.choiceBtn} ${choiceState}`}
                style={{ animationDelay: `${i * 0.07}s` }}
                onClick={() => handleAnswer(choice)}
                disabled={answerState === 'correct' || isWrong}
              >
                {choice.label}
              </button>
            )
          })}
        </div>
      )}


      {/* Feedback banner */}
      {feedbackMsg && (
        <div className={`${styles.feedbackBanner} ${answerState === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong}`}>
          {feedbackMsg}
        </div>
      )}
    </div>
  )
}
