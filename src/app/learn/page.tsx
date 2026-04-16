'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './learn.module.css'

interface Lesson {
  id: string
  title: string
  order: number
  category: string
  difficulty: number
  status: string
}

interface Profile {
  id: string
  child_name: string
  avatar: string
  streak: number
  total_xp: number
}

const CATEGORY_COLORS: Record<string, string> = {
  Basics: '#38bdf8',
  Animals: '#4ade80',
  Food: '#fbbf24',
  Colors: '#a78bfa',
  Family: '#fb7185',
  Body: '#fb923c',
  Verbs: '#34d399',
  Sentences: '#60a5fa',
  Review: '#f472b6',
  General: '#94a3b8',
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Basics: '⭐',
  Animals: '🦁',
  Food: '🍎',
  Colors: '🌈',
  Family: '👨‍👩‍👧',
  Body: '✋',
  Verbs: '🏃',
  Sentences: '💬',
  Review: '🔄',
  General: '📚',
}

export default function LearnPage() {
  const router = useRouter()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [siblings, setSiblings] = useState<Profile[]>([])
  const [quests, setQuests] = useState<any[]>([])
  const [stories, setStories] = useState<any[]>([])

  const QUEST_TEMPLATES = [
    { id: 'q_perfect', title: 'Perfect Round', icon: '🎯', desc: 'Score 100% on a lesson', goal: 1, reward: 50 },
    { id: 'q_gym', title: 'Target Gym', icon: '🏋️', desc: 'Complete a Gym session', goal: 1, reward: 40 },
    { id: 'q_volume', title: 'Brain Power', icon: '🧠', desc: 'Get 20 correct answers', goal: 20, reward: 30 }
  ]

  useEffect(() => {
    const p = localStorage.getItem('spanishkids_active_profile')
    if (!p) { router.push('/'); return }
    const parsed = JSON.parse(p)
    // Synchronize latest profile state from the full list so XP updates instantly
    const all = JSON.parse(localStorage.getItem('spanishkids_profiles') || '[]')
    
    // Setup sibling leaderboard
    setSiblings([...all].sort((a: any, b: any) => (b.total_xp || 0) - (a.total_xp || 0)))

    const updated = all.find((x: any) => x.id === parsed.id) || parsed
    setProfile(updated)
    
    // Initialize Quests
    const todayStr = new Date().toISOString().split('T')[0]
    const questKey = `spanishkids_quests_${updated.id}`
    const storedQuests = JSON.parse(localStorage.getItem(questKey) || 'null')
    
    if (!storedQuests || storedQuests.date !== todayStr) {
      const freshQuests = {
        date: todayStr,
        quests: QUEST_TEMPLATES.map(t => ({ ...t, current: 0, claimed: false }))
      }
      localStorage.setItem(questKey, JSON.stringify(freshQuests))
      setQuests(freshQuests.quests)
    } else {
      setQuests(storedQuests.quests)
    }

    fetchLessons()
  }, [])

  async function fetchLessons() {
    const res = await fetch('/api/lessons')
    const data = await res.json()
    setLessons(Array.isArray(data) ? data : [])
    
    // Fetch stories too
    try {
      const sRes = await fetch('/api/stories')
      if (sRes.ok) setStories(await sRes.json())
    } catch(e) {}

    setLoading(false)
  }

  function claimQuest(questId: string) {
    if (!profile) return
    const questInfo = quests.find(q => q.id === questId)
    if (!questInfo) return

    const updatedQuests = quests.map(q => {
      if (q.id === questId && q.current >= q.goal && !q.claimed) {
        return { ...q, claimed: true }
      }
      return q
    })
    
    setQuests(updatedQuests)
    const todayStr = new Date().toISOString().split('T')[0]
    localStorage.setItem(`spanishkids_quests_${profile.id}`, JSON.stringify({ date: todayStr, quests: updatedQuests }))
    
    const newProfile = { ...profile, total_xp: (profile.total_xp || 0) + questInfo.reward }
    setProfile(newProfile)
    localStorage.setItem('spanishkids_active_profile', JSON.stringify(newProfile))
    
    const allProfiles = JSON.parse(localStorage.getItem('spanishkids_profiles') || '[]')
    localStorage.setItem('spanishkids_profiles', JSON.stringify(allProfiles.map((p: any) => p.id === newProfile.id ? newProfile : p)))
    
    // Sync the XP
    fetch('/api/profiles/sync', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: newProfile.id, total_xp: newProfile.total_xp }) 
    })
  }

  if (loading || !profile) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingEmoji}>🦁</div>
        <p>Getting your lessons ready...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/')}>
          ←
        </button>
        <div className={styles.profileBadge}>
          <span>{profile.avatar}</span>
          <span>{profile.child_name}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={styles.xpBadge} onClick={() => setShowLeaderboard(true)} style={{ cursor: 'pointer', background: '#f8fafc', color: '#334155', border: '2px solid #e2e8f0', padding: '0.5rem' }} title="Family Leaderboard">
            🏆
          </button>
          <div className={styles.xpBadge} onClick={() => router.push('/store')} style={{ cursor: 'pointer', outline: '2px solid #ca8a04', background: '#fef9c3', color: '#a16207' }} title="Go to Rewards Store">
            🏪 ⭐ {profile.total_xp ?? 0}
          </div>
        </div>
      </div>

      {/* Streak banner */}
      {(profile.streak ?? 0) > 0 && (
        <div className={styles.streakBanner}>
          🔥 {profile.streak} day streak! Keep it up!
        </div>
      )}

      {/* Daily Quests Box */}
      <div style={{ maxWidth: '600px', margin: '1rem auto', padding: '1.5rem', background: 'white', borderRadius: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '2px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#334155', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📜</span> Daily Quests
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {quests.map(q => {
             const progress = Math.min((q.current / q.goal) * 100, 100)
             const isComplete = q.current >= q.goal
             
             return (
               <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: q.claimed ? '#f8fafc' : isComplete ? '#f0fdf4' : '#f8fafc', borderRadius: '1rem', border: `2px solid ${q.claimed ? '#e2e8f0' : isComplete ? '#4ade80' : '#e2e8f0'}` }}>
                 <div style={{ fontSize: '2rem' }}>{q.icon}</div>
                 <div style={{ flex: 1 }}>
                   <div style={{ fontWeight: 700, color: '#334155' }}>{q.title} <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500, display: 'block' }}>{q.desc}</span></div>
                   <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', marginTop: '0.5rem', overflow: 'hidden' }}>
                     <div style={{ width: `${progress}%`, height: '100%', background: isComplete ? '#22c55e' : '#3b82f6', transition: 'width 0.3s' }} />
                   </div>
                   <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem', fontWeight: 600 }}>{q.current} / {q.goal}</div>
                 </div>
                 {isComplete && !q.claimed && (
                   <button className="btn btn-primary" style={{ background: '#ca8a04', borderColor: '#a16207', padding: '0.5rem 1rem' }} onClick={() => claimQuest(q.id)}>
                     Claim ⭐{q.reward}
                   </button>
                 )}
                 {q.claimed && (
                   <div style={{ color: '#94a3b8', fontWeight: 800 }}>✅ Checked Out</div>
                 )}
               </div>
             )
          })}
        </div>
      </div>


      {/* Gym Banner */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '600px', margin: '1rem auto 0 auto' }}>
        <button 
          className="btn" 
          style={{ background: '#f43f5e', color: 'white', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', fontWeight: 800, padding: '1rem', borderRadius: '1.5rem', boxShadow: '0 4px 14px rgba(244,63,94,0.4)', transition: 'transform 0.1s' }}
          onClick={() => router.push('/learn/review')}
        >
          <span style={{ fontSize: '1.5rem' }}>🏋️</span> Target Review Gym
        </button>
      </div>

      <h2 className={styles.pageTitle}>Choose a Lesson</h2>

      {lessons.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyEmoji}>📚</div>
          <p>No lessons published yet.</p>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Ask a parent to add lessons in the admin panel.</p>
        </div>
      )}

      <div className={styles.lessonList}>
        {lessons.map((lesson, i) => {
          const color = CATEGORY_COLORS[lesson.category] ?? '#94a3b8'
          const emoji = CATEGORY_EMOJIS[lesson.category] ?? '📚'
          
          const completedIds = profile ? JSON.parse(localStorage.getItem(`spanishkids_completed_${profile.id}`) || '[]') : []
          const isCompleted = completedIds.includes(lesson.id)
          
          let isLocked = false
          if (lesson.order > 1) {
             // Find the IMMEDIATELY preceding lesson by order
             const prevLesson = lessons.find(l => l.order === lesson.order - 1)
             // If there is a previous lesson, and its ID is NOT in completedIds, lock this one.
             if (prevLesson && !completedIds.includes(prevLesson.id)) {
                isLocked = true
             }
          }

          return (
            <button
              key={lesson.id}
              id={`lesson-${lesson.id}`}
              className={`${styles.lessonCard} ${isLocked ? styles.lessonLocked : ''} ${isCompleted ? styles.lessonCompleted : ''}`}
              style={{
                '--lesson-color': isLocked ? '#94a3b8' : color,
                animationDelay: `${i * 0.06}s`,
              } as React.CSSProperties}
              onClick={() => {
                if (!isLocked) router.push(`/learn/${lesson.id}`)
              }}
            >
              <div className={styles.lessonNumber}>
                 {isCompleted ? <i className="fa-solid fa-check"></i> : lesson.order}
              </div>
              <div className={styles.lessonIcon}>{isLocked ? '🔒' : emoji}</div>
              <div className={styles.lessonInfo}>
                <div className={styles.lessonTitle}>{lesson.title}</div>
                <div className={styles.lessonMeta}>
                  <span className={styles.categoryTag} style={{ background: (isLocked ? '#94a3b8' : color) + '22', color: isLocked ? '#64748b' : color }}>
                    {lesson.category}
                  </span>
                  <span className={styles.difficulty}>
                    {'⭐'.repeat(lesson.difficulty)}
                  </span>
                </div>
              </div>
              <div className={styles.lessonArrow}>
                {isLocked ? <i className="fa-solid fa-lock" style={{ fontSize: '1.2rem'}}></i> : '›'}
              </div>
            </button>
          )
        })}
      </div>

      {stories.length > 0 && (
        <>
          <h2 className={styles.pageTitle} style={{ marginTop: '3rem' }}>📖 Story Mode</h2>
          <div className={styles.lessonList}>
            {stories.map((story, i) => {
              const completedIds = profile ? JSON.parse(localStorage.getItem(`spanishkids_completed_stories_${profile.id}`) || '[]') : []
              const isCompleted = completedIds.includes(story.id)
              return (
                <button
                  key={story.id}
                  className={`${styles.lessonCard} ${isCompleted ? styles.lessonCompleted : ''}`}
                  style={{ '--lesson-color': '#10b981', animationDelay: `${i * 0.06}s` } as React.CSSProperties}
                  onClick={() => router.push(`/story/${story.id}`)}
                >
                  <div className={styles.lessonNumber}>
                    {isCompleted ? <i className="fa-solid fa-check"></i> : '📖'}
                  </div>
                  <div className={styles.lessonInfo}>
                    <div className={styles.lessonTitle}>{story.title}</div>
                    <div className={styles.lessonMeta}>
                      <span className={styles.categoryTag} style={{ background: '#ecfdf5', color: '#059669' }}>
                        Listening Comp
                      </span>
                      <span className={styles.difficulty}>
                        {'⭐'.repeat(story.difficulty)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.lessonArrow}>›</div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {showLeaderboard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowLeaderboard(false)}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '1.5rem', width: '90%', maxWidth: '400px', margin: '0 auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ textAlign: 'center', fontSize: '1.8rem', marginBottom: '1.5rem', color: '#1e293b' }}>🏆 Family Leaderboard</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {siblings.map((sib, idx) => (
                <div key={sib.id} style={{ display: 'flex', alignItems: 'center', padding: '1rem', background: sib.id === profile?.id ? '#fefce8' : '#f8fafc', borderRadius: '1rem', border: `2px solid ${sib.id === profile?.id ? '#fde047' : '#e2e8f0'}` }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: idx === 0 ? '#eab308' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#cbd5e1', width: '2rem', textAlign: 'center' }}>
                    #{idx + 1}
                  </div>
                  <div style={{ fontSize: '2rem', margin: '0 1rem' }}>{sib.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#334155', fontSize: '1.1rem' }}>{sib.child_name}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: '#ca8a04', background: '#fef9c3', padding: '0.3rem 0.8rem', borderRadius: '2rem' }}>
                    ⭐ {sib.total_xp || 0}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '2rem' }} onClick={() => setShowLeaderboard(false)}>Awesome!</button>
          </div>
        </div>
      )}
    </div>
  )
}
