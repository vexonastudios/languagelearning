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

export default function LessonPlayPage() {
  const router = useRouter()
  const params = useParams()
  const lessonId = params.id as string
  const { play } = useAudio()

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [score, setScore] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ id: string; child_name: string; avatar: string } | null>(null)
  const [stars, setStars] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)

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
    const res = await fetch(`/api/lessons/${lessonId}`)
    const data = await res.json()
    setLesson(data.lesson)
    setQuestions(data.questions ?? [])
    setLoading(false)
  }

  const currentQuestion = questions[currentIndex]

  // Auto-play question audio on mount and question change
  useEffect(() => {
    if (currentQuestion && answerState === 'idle') {
      setTimeout(() => {
        play(currentQuestion.audioText, currentQuestion.audioLanguage)
      }, 300)
    }
  }, [currentIndex, questions, answerState])

  async function handleAnswer(choice: { label: string; isCorrect: boolean }) {
    if (answerState !== 'idle') return

    setSelectedChoice(choice.label)
    setTotalAnswered((n) => n + 1)

    if (choice.isCorrect) {
      setAnswerState('correct')
      setScore((n) => n + 1)
      setXpEarned((n) => n + 10)
      setFeedbackMsg(randomPick(FEEDBACK_MESSAGES.correct))
      await play('Great job!', 'en')

      // Record progress
      if (profile && currentQuestion) {
        fetch('/api/progress/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: profile.id,
            itemId: currentQuestion.itemId,
            itemType: currentQuestion.itemType,
            correct: true,
            lessonId,
          }),
        })
      }

      // Auto-advance after 1.2s
      setTimeout(advance, 1200)
    } else {
      setAnswerState('wrong')
      setFeedbackMsg(randomPick(FEEDBACK_MESSAGES.wrong))
      await play('Try again.', 'en')

      // Record wrong
      if (profile && currentQuestion) {
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

      // Show correct answer, then advance after 2s
      setTimeout(advance, 2000)
    }
  }

  function advance() {
    if (currentIndex + 1 >= questions.length) {
      // Calculate stars
      const accuracy = score / questions.length
      const earned = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1
      setStars(earned)
      setFinished(true)
    } else {
      setCurrentIndex((n) => n + 1)
      setAnswerState('idle')
      setSelectedChoice(null)
      setFeedbackMsg('')
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

      {/* Question card */}
      <div className={styles.questionArea} key={currentIndex}>
        {/* Audio prompt button */}
        <button
          id="playAudioBtn"
          className={`${styles.audioBtn} ${answerState === 'idle' ? 'animate-pulse-glow' : ''}`}
          onClick={replayAudio}
        >
          🔊
        </button>

        {/* Image if picture question */}
        {currentQuestion.imageUrl && (
          <div className={styles.questionImage}>
            <img src={currentQuestion.imageUrl} alt="question" />
          </div>
        )}

        {/* Prompt text */}
        <p className={styles.promptText}>{currentQuestion.promptText}</p>
      </div>

      {currentQuestion.type === 'sentence_build' ? (
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
            let choiceState = ''
            if (answerState !== 'idle' && selectedChoice === choice.label) {
              choiceState = answerState === 'correct' ? styles.choiceCorrect : styles.choiceWrong
            } else if (answerState === 'wrong' && choice.isCorrect) {
              choiceState = styles.choiceReveal
            }

            return (
              <button
                key={i}
                id={`choice-${i}`}
                className={`${styles.choiceBtn} ${choiceState} ${answerState !== 'idle' && !choiceState ? styles.choiceDimmed : ''}`}
                style={{ animationDelay: `${i * 0.07}s` }}
                onClick={() => handleAnswer(choice)}
                disabled={answerState !== 'idle'}
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
