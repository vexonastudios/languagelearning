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

    // Store completion
    const completedKey = `spanishkids_completed_stories_${profile.id}`
    const completed = JSON.parse(localStorage.getItem(completedKey) || '[]')
    if (!completed.includes(story.id)) {
      completed.push(story.id)
      localStorage.setItem(completedKey, JSON.stringify(completed))
    }

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
      <div className={styles.lessonHeader}>
        <button className={styles.backBtn} onClick={() => router.push('/learn')}>×</button>
        <div style={{ fontWeight: 800, color: '#334155' }}>{story.title}</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        
        {phase === 'reading' && (
          <div style={{ animation: 'slideIn 0.4s ease' }}>
            <div style={{ background: 'white', padding: '3rem', borderRadius: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
              <div 
                style={{ fontSize: '1.8rem', lineHeight: '1.6', color: '#1e293b', fontWeight: 600, fontFamily: 'serif' }}
              >
                {story.content_es}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="btn btn-primary" 
                style={{ fontSize: '1.4rem', padding: '1rem 3rem', background: isPlaying ? '#94a3b8' : '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.8rem' }}
                onClick={handlePlayAudio}
                disabled={isPlaying}
              >
                {isPlaying ? '🔊 Listening...' : '▶️ Play Audio'}
              </button>
              
              <button 
                className="btn" 
                style={{ fontSize: '1.4rem', padding: '1rem 3rem', background: '#22c55e', color: 'white' }}
                onClick={() => setPhase('question')}
              >
                I'm Ready ➔
              </button>
            </div>
          </div>
        )}

        {phase === 'question' && (
          <div style={{ animation: 'slideIn 0.4s ease' }}>
            <button className="btn" style={{ background: '#f1f5f9', color: '#64748b', marginBottom: '2rem' }} onClick={() => setPhase('reading')}>
              ← Back to story
            </button>
            <h2 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '2rem', textAlign: 'center' }}>
              {story.question_es}
            </h2>
            <div style={{ color: '#64748b', textAlign: 'center', marginBottom: '2rem' }}>{story.question_en}</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1rem' }}>
              {answers.map(ans => (
                <button
                  key={ans}
                  className={`btn ${selectedAnswer === ans ? (isCorrect ? 'btn-success' : 'btn-danger') : 'btn-outline'}`}
                  style={{ padding: '1.5rem', fontSize: '1.3rem', border: selectedAnswer === ans ? undefined : '2px solid #e2e8f0' }}
                  onClick={() => handleChoice(ans)}
                  disabled={selectedAnswer !== null}
                >
                  {ans}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
