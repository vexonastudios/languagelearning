'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './profiles.module.css'

const LAN_MODE = process.env.NEXT_PUBLIC_LAN_MODE === 'true'

const AVATARS = ['🦁', '🐼', '🦊', '🐸', '🦋', '🐧', '🦄', '🐯', '🐻', '🦅']

interface Profile {
  id: string
  child_name: string
  avatar: string
  color?: string
  streak: number
  total_xp: number
  last_active_at?: string
}

export default function ProfileSelectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAvatar, setNewAvatar] = useState('🦁')
  const [loading, setLoading] = useState(true)
  const [autoSelecting, setAutoSelecting] = useState(false)

  useEffect(() => {
    fetchProfiles()
  }, [])

  async function fetchProfiles() {
    // Load from localStorage cache first for instant display
    const local = localStorage.getItem('spanishkids_profiles')
    if (local) {
      setProfiles(JSON.parse(local))
    }
    setLoading(false)

    // Sync from server silently to catch admin deletions
    try {
      const res = await fetch('/api/profiles')
      if (res.ok) {
        const data = await res.json()
        setProfiles(data)
        localStorage.setItem('spanishkids_profiles', JSON.stringify(data))

        // Auto-select when BodeeGuard passes ?student_id=xxx in the URL
        const studentId = searchParams.get('student_id')
        if (studentId && !autoSelecting) {
          const match = data.find((p: Profile) => p.id === studentId)
          if (match) {
            setAutoSelecting(true)
            selectProfile(match)
            return
          }
        }
      }
    } catch (e) {
      // Offline fallback
    }
  }

  async function createProfile() {
    if (!newName.trim()) {
      alert("Please enter a name first!")
      return
    }
    
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_name: newName.trim(), avatar: newAvatar }),
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create profile')
      }
      
      const profile = await res.json()
      const updated = [...profiles, profile]
      setProfiles(updated)
      localStorage.setItem('spanishkids_profiles', JSON.stringify(updated))
      setCreating(false)
      setNewName('')
      
      // Auto-jump to learning page right after creating!
      selectProfile(profile)
    } catch (e: any) {
      console.error(e)
      alert("Error creating profile: " + e.message)
    }
  }

  function selectProfile(profile: Profile) {
    localStorage.setItem('spanishkids_active_profile', JSON.stringify(profile))
    router.push('/learn')
  }

  if (loading || autoSelecting) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingEmoji}>🌟</div>
        <p>{autoSelecting ? '¡Bienvenido! Loading your lessons…' : 'Loading...'}</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Background decorations */}
      <div className={styles.bgDecor}>
        <span className={styles.cloud} style={{ top: '8%', left: '5%', fontSize: '3rem', opacity: 0.15 }}>☁️</span>
        <span className={styles.cloud} style={{ top: '15%', right: '8%', fontSize: '2rem', opacity: 0.12 }}>☁️</span>
        <span className={styles.cloud} style={{ top: '60%', left: '2%', fontSize: '2.5rem', opacity: 0.1 }}>⭐</span>
        <span className={styles.cloud} style={{ top: '80%', right: '5%', fontSize: '2rem', opacity: 0.12 }}>🌙</span>
      </div>

      <div className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoEmoji}>🌎</span>
          <h1 className={styles.logoText}>SpanishKids</h1>
        </div>
        <p className={styles.subtitle}>¡Hola! Who is learning today?</p>
      </div>

      <div className={styles.profileGrid}>
        {profiles.map((profile, i) => (
          <button
            key={profile.id}
            className={styles.profileCard}
            onClick={() => selectProfile(profile)}
            style={{
              animationDelay: `${i * 0.08}s`,
              ...(profile.color ? { '--profile-color': profile.color } as any : {}),
            }}
          >
            <div className={styles.profileAvatar}>{profile.avatar}</div>
            <div className={styles.profileName}>{profile.child_name}</div>
            {profile.streak > 0 && (
              <div className={styles.profileStreak}>🔥 {profile.streak}</div>
            )}
          </button>
        ))}

        {/* Add profile button — hidden in LAN mode (students come from BodeeGuard) */}
        {!LAN_MODE && !creating && (
          <button
            className={styles.addProfileCard}
            onClick={() => setCreating(true)}
          >
            <div className={styles.addIcon}>+</div>
            <div className={styles.addText}>Add Learner</div>
          </button>
        )}
      </div>

      {/* Create profile modal — disabled in LAN mode */}
      {!LAN_MODE && creating && (
        <div className={styles.modalOverlay} onClick={() => setCreating(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>New Learner 🌟</h2>

            <input
              id="newLearnerName"
              className={styles.nameInput}
              placeholder="What's your name?"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createProfile()}
              autoFocus
            />

            <p className={styles.pickAvatarLabel}>Pick your avatar:</p>
            <div className={styles.avatarPicker}>
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  className={`${styles.avatarOption} ${newAvatar === emoji ? styles.avatarSelected : ''}`}
                  onClick={() => setNewAvatar(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className={styles.modalActions}>
              <button className={`btn btn-success ${styles.createBtn}`} onClick={createProfile}>
                Let's Go! 🚀
              </button>
              <button className={styles.cancelBtn} onClick={() => setCreating(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin link */}
      <a href="/admin" className={styles.adminLink}>Parent / Admin →</a>
    </div>
  )
}
