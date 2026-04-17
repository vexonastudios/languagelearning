'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAudio } from '@/hooks/useAudio'
import styles from '../../learn/learn.module.css'

export default function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const { play } = useAudio()

  const [story, setStory] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  // States: 'loading', 'reading', 'question', 'finished'
  const [phase, setPhase] = useState<'loading' | 'reading' | 'question' | 'finished'>('loading')
  const [isPlaying, setIsPlaying] = useState(false)
  const [answers, setAnswers] = useState<string[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  useEffect(() => {
    const p = localStorage.getItem('spanishkids_active_profile')
    if (!p) { router.push('/'); return }
    setProfile(JSON.parse(p))

    fetch(`/api/stories/${id}`)
      .then(res => res.json())
      .then(data => {
        setStory(data)
        
        // Shuffle answers
        const ans = [data.correct_answer, data.distractor_1, data.distractor_2, data.distractor_3]
        for (let i = ans.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [ans[i], ans[j]] = [ans[j], ans[i]];
        }
        setAnswers(ans)
        setPhase('reading')
      })
  }, [id])

  async function handlePlayAudio() {
    if (!story || isPlaying) return
    setIsPlaying(true)
    await play(story.content_es, 'es')
    setIsPlaying(false)
  }

  function handleChoice(ans: string) {
    if (selectedAnswer) return // Already guessed
    setSelectedAnswer(ans)
    
    if (ans === story.correct_answer) {
      setIsCorrect(true)
      // Confetti & reward!
      const audio = new window.Audio('/correct.mp3') // Assume exist or generic ping
      audio.play().catch(e => {})
      
      setTimeout(() => finishStory(), 2000)
    } else {
      setIsCorrect(false)
      const audio = new window.Audio('/incorrect.mp3')
      audio.play().catch(e => {})
      
      // Reset after a second to try again
      setTimeout(() => {
        setSelectedAnswer(null)
        setIsCorrect(null)
      }, 1500)
    }
  }

  function finishStory() {
    setPhase('finished')

    fetch('/api/progress/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: profile.id, score: 50, isReview: false })
    })

    // Store completion — localStorage + server for cross-device sync
    const completedKey = `spanishkids_completed_stories_${profile.id}`
    const completed = JSON.parse(localStorage.getItem(completedKey) || '[]')
    if (!completed.includes(story.id)) {
      completed.push(story.id)
      localStorage.setItem(completedKey, JSON.stringify(completed))
    }

    // ✅ Persist story completion to Supabase
    fetch('/api/progress/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: profile.id,
        lessonId: story.id, // stories share the same completions endpoint
        accuracy: 1,
        xpEarned: 50,
        questionsTotal: 1,
        questionsCorrect: 1,
      }),
    })

    const todayStr = new Date().toISOString().split('T')[0]

    // Sync XP
    const newProfile = { ...profile, total_xp: profile.total_xp + 50 }
    localStorage.setItem('spanishkids_active_profile', JSON.stringify(newProfile))
    const all = JSON.parse(localStorage.getItem('spanishkids_profiles') || '[]')
    localStorage.setItem('spanishkids_profiles', JSON.stringify(all.map((p: any) => p.id === profile.id ? newProfile : p)))

    fetch('/api/profiles/sync', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: profile.id, total_xp: newProfile.total_xp }) 
    })
  }

  if (phase === 'loading' || !story) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingEmoji}>📖</div>
        <p>Loading story...</p>
      </div>
    )
  }

  if (phase === 'finished') {
    return (
      <div className={styles.finishedScreen}>
        <h1 className={styles.finishTitle}>¡Excelente!</h1>
        <div style={{ fontSize: '5rem', margin: '2rem 0', animation: 'bounce 1s infinite' }}>🏆</div>
        <p style={{ fontSize: '1.2rem', color: '#334155', fontWeight: 600 }}>Story Master +50 XP</p>
        <button className="btn btn-primary" style={{ marginTop: '2rem', fontSize: '1.2rem', padding: '1rem 3rem' }} onClick={() => router.push('/learn')}>
          Back to Map
        </button>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/learn')}>
          ←
        </button>
        <div style={{ fontWeight: 800, color: '#334155', fontSize: '1.2rem', textAlign: 'center', flex: 1, paddingRight: '3rem' }}>
          📖 {story.title}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        
        {phase === 'reading' && (
          <div style={{ animation: 'slideIn 0.4s ease', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, background: 'white', padding: '2rem', borderRadius: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '2px solid #e2e8f0', marginBottom: '2rem', display: 'flex', alignItems: 'center' }}>
              <div style={{ fontSize: '1.6rem', lineHeight: '1.6', color: '#1e293b', fontWeight: 700, textAlign: 'center' }}>
                {story.content_es}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 'auto', paddingBottom: '2rem' }}>
              <button 
                className={`btn btn-primary`}
                style={{ fontSize: '1.3rem', padding: '1rem', background: isPlaying ? '#94a3b8' : '#3b82f6', borderColor: isPlaying ? '#64748b' : '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', width: '100%' }}
                onClick={handlePlayAudio}
                disabled={isPlaying}
              >
                <i className={`fa-solid ${isPlaying ? 'fa-spinner fa-spin' : 'fa-volume-up'}`}></i>
                {isPlaying ? 'Listening...' : 'Play Audio'}
              </button>
              
              <button 
                className="btn btn-success" 
                style={{ fontSize: '1.3rem', padding: '1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}
                onClick={() => setPhase('question')}
              >
                I'm Ready <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
        )}

        {phase === 'question' && (
          <div style={{ animation: 'slideIn 0.4s ease' }}>
            <button className="btn" style={{ background: '#f1f5f9', color: '#64748b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setPhase('reading')}>
              <i className="fa-solid fa-arrow-left"></i> Read story again
            </button>
            
            <div style={{ background: 'white', padding: '2rem', borderRadius: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '2px solid #e2e8f0', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', justifyContent: 'center' }}>
                <h2 style={{ fontSize: '1.8rem', color: '#1e293b', textAlign: 'center', margin: 0, fontWeight: 800 }}>
                  {story.question_es}
                </h2>
                <button 
                  className="btn" 
                  style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.6rem', borderRadius: '50%', width: '3rem', height: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  onClick={() => play(story.question_es, 'es')}
                  title="Listen to question"
                >
                  <i className="fa-solid fa-volume-up"></i>
                </button>
              </div>
              <div style={{ color: '#64748b', textAlign: 'center', marginTop: '0.5rem', fontWeight: 600 }}>{story.question_en}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              {answers.map(ans => (
                <button
                  key={ans}
                  className={`btn ${selectedAnswer === ans ? (isCorrect ? 'btn-success' : 'btn-danger') : 'btn-outline'}`}
                  style={{ padding: '1.2rem', fontSize: '1.2rem', fontWeight: 700, border: selectedAnswer === ans ? undefined : '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => handleChoice(ans)}
                  disabled={selectedAnswer !== null}
                >
                  <span>{ans}</span>
                  {selectedAnswer === ans && (
                    <i className={`fa-solid ${isCorrect ? 'fa-check' : 'fa-xmark'}`} style={{ fontSize: '1.4rem' }}></i>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
