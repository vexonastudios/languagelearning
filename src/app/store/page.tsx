'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './store.module.css'

interface Reward {
  id: string
  title: string
  cost: number
  icon: string
}

export default function RewardStorePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<Reward | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const p = localStorage.getItem('spanishkids_active_profile')
    if (!p) { router.push('/'); return }
    const parsedProfile = JSON.parse(p)

    // Ensure we have the most up to date offline synced XP before trusting it
    const all = JSON.parse(localStorage.getItem('spanishkids_profiles') || '[]')
    const updated = all.find((x: any) => x.id === parsedProfile.id) || parsedProfile
    setProfile(updated)

    fetch('/api/store/rewards')
      .then(res => res.json())
      .then(data => {
        const parentRewards = Array.isArray(data) ? data : []
        setRewards([
          { id: 'streak_freeze', title: 'Streak Freeze', cost: 200, icon: '🧊' },
          ...parentRewards
        ])
        setLoading(false)
      })
  }, [])

  async function handlePurchase() {
    if (!buying || !profile) return
    setProcessing(true)
    
    try {
      const res = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id, rewardId: buying.id })
      })

      const data = await res.json()
      
      if (!res.ok) {
        alert(data.error || 'Purchase failed.')
        setProcessing(false)
        return
      }

      // Update the local profile XP instantly!
      const newXp = data.newXp
      const newProfile = { ...profile, total_xp: newXp }
      setProfile(newProfile)
      localStorage.setItem('spanishkids_active_profile', JSON.stringify(newProfile))
      
      const all = JSON.parse(localStorage.getItem('spanishkids_profiles') || '[]')
      const updatedAll = all.map((p: any) => p.id === profile.id ? newProfile : p)
      localStorage.setItem('spanishkids_profiles', JSON.stringify(updatedAll))

      if (buying.id === 'streak_freeze') {
        const inventory = JSON.parse(localStorage.getItem(`spanishkids_inventory_${profile.id}`) || '[]')
        inventory.push('streak_freeze')
        localStorage.setItem(`spanishkids_inventory_${profile.id}`, JSON.stringify(inventory))
        alert('🧊 Streak Freeze purchased! It will automatically save your streak if you miss a day.')
      } else {
        alert(`🎉 Woohoo! You bought ${buying.title}! Your parents will be notified!`)
      }
      
      setBuying(null)
    } catch (e: any) {
      alert("Error processing purchase!")
    }
    setProcessing(false)
  }

  if (loading || !profile) {
    return <div className={styles.emptyState}>Loading the store... 🛍️</div>
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/learn')}>
          ←
        </button>
        <div className={styles.titleBox}>
          <span className={styles.storeEmoji}>🏪</span>
          <span className={styles.titleText}>Rewards</span>
        </div>
        <div className={styles.xpBadge}>
          ⭐ {profile.total_xp}
        </div>
      </div>

      {rewards.length === 0 ? (
        <div className={styles.emptyState}>
          No rewards have been added yet!<br/>
          Ask a parent to add some in the Admin panel!
        </div>
      ) : (
        <div className={styles.grid}>
          {rewards.map((reward, i) => {
            const affordable = profile.total_xp >= reward.cost
            return (
              <button
                key={reward.id}
                className={styles.rewardCard}
                style={{
                  opacity: affordable ? 1 : 0.6,
                  animationDelay: `${i * 0.05}s`
                }}
                onClick={() => {
                  if (affordable) setBuying(reward)
                  else alert("You need more stars to buy this! Keep learning! ⭐")
                }}
              >
                <div className={styles.icon}>{reward.icon}</div>
                <div className={styles.title}>{reward.title}</div>
                <div className={styles.cost} style={{ opacity: affordable ? 1 : 0.7 }}>
                  ⭐ {reward.cost}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Buy dialog */}
      {buying && (
        <div className={styles.modalOverlay} onClick={() => !processing && setBuying(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{buying.icon}</div>
            <h2 className={styles.modalTitle}>Buy {buying.title}?</h2>
            <p style={{ fontWeight: 700, color: '#64748b', marginBottom: '1rem' }}>
              This will cost ⭐ {buying.cost} stars.
            </p>
            <div className={styles.modalActions}>
              <button 
                className="btn btn-primary" 
                onClick={handlePurchase} 
                disabled={processing}
                style={{ fontSize: '1.2rem', padding: '1rem' }}
              >
                {processing ? '⏳ Please Wait...' : '✅ Yes, buy it!'}
              </button>
              <button 
                className="btn" 
                onClick={() => !processing && setBuying(null)}
                style={{ background: '#e2e8f0', color: '#64748b', padding: '1rem' }}
              >
                Nah, save my stars
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
