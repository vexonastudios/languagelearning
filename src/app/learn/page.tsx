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
    
    fetchLessons()
  }, [])

  async function fetchLessons() {
    const res = await fetch('/api/lessons')
    const data = await res.json()
    setLessons(Array.isArray(data) ? data : [])
    setLoading(false)
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
        <div className={styles.xpBadge} onClick={() => router.push('/store')} style={{ cursor: 'pointer', outline: '2px solid #ca8a04', background: '#fef9c3', color: '#a16207' }} title="Go to Rewards Store">
          🏪 ⭐ {profile.total_xp ?? 0}
        </div>
      </div>

      {/* Streak banner */}
      {(profile.streak ?? 0) > 0 && (
        <div className={styles.streakBanner}>
          🔥 {profile.streak} day streak! Keep it up!
        </div>
      )}

      {/* Leaderboard & Controls Row */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', width: '100%', maxWidth: '600px', margin: '1rem auto' }}>
        <button className="btn" style={{ background: '#f8fafc', color: '#334155', border: '2px solid #e2e8f0', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }} onClick={() => setShowLeaderboard(true)}>
          🏆 Leaderboard
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
