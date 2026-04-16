'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './admin.module.css'

type Tab = 'lessons' | 'vocab' | 'audio' | 'learners' | 'rewards'

interface Lesson {
  id: string
  title: string
  order: number
  category: string
  difficulty: number
  status: string
  audio_ready: boolean
}

interface VocabItem {
  id: string
  english_text: string
  spanish_text: string
  lesson_id: string | null
  category: string
  difficulty: number
}

export default function AdminPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [tab, setTab] = useState<Tab>('lessons')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [learners, setLearners] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [rewards, setRewards] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [flaggedAudio, setFlaggedAudio] = useState<any[]>([])
  const [newReward, setNewReward] = useState({ title: '', cost: 50, icon: '🎁' })

  // Lesson form
  const [newLesson, setNewLesson] = useState({ title: '', category: 'Basics', difficulty: 1 })
  
  // Vocab form
  const [newVocab, setNewVocab] = useState({
    english_text: '',
    spanish_text: '',
    lesson_id: '',
    category: 'General',
    difficulty: 1,
    distractors_en: '',
    distractors_es: '',
  })

  const [statusMsg, setStatusMsg] = useState('')
  const [publishingId, setPublishingId] = useState<string | null>(null)

  function getAuthHeader() {
    return { Authorization: `Bearer ${password}` }
  }

  async function handleLogin() {
    const res = await fetch('/api/admin/lessons', {
      headers: { Authorization: `Bearer ${password}` },
    })
    if (res.ok) {
      setAuthed(true)
      const data = await res.json()
      setLessons(data)
    } else {
      setAuthError('Wrong password. Try again.')
    }
  }

  async function fetchLessons() {
    const res = await fetch('/api/admin/lessons', { headers: getAuthHeader() })
    if (res.ok) setLessons(await res.json())
  }

  async function fetchVocab() {
    const res = await fetch('/api/admin/vocab', { headers: getAuthHeader() })
    if (res.ok) setVocab(await res.json())
  }

  async function fetchLearners() {
    const res = await fetch('/api/profiles', { headers: getAuthHeader() })
    if (res.ok) setLearners(await res.json())
  }

  async function fetchRewards() {
    const res = await fetch('/api/admin/rewards', { headers: getAuthHeader() })
    if (res.ok) {
      const data = await res.json()
      setRewards(data.rewards)
      setPurchases(data.purchases)
    }
  }

  async function fetchFlaggedAudio() {
    const res = await fetch('/api/admin/audio/flagged', { headers: getAuthHeader() })
    if (res.ok) setFlaggedAudio(await res.json())
  }

  useEffect(() => {
    if (authed && tab === 'vocab') fetchVocab()
    if (authed && tab === 'learners') fetchLearners()
    if (authed && tab === 'rewards') fetchRewards()
    if (authed && tab === 'audio') { fetchLessons(); fetchFlaggedAudio() }
  }, [authed, tab])

  async function createLesson() {
    if (!newLesson.title.trim()) return
    const res = await fetch('/api/admin/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ ...newLesson, order: lessons.length + 1 }),
    })
    if (res.ok) {
      setNewLesson({ title: '', category: 'Basics', difficulty: 1 })
      await fetchLessons()
      showStatus('Lesson created ✅')
    }
  }

  async function updateLessonStatus(id: string, status: string) {
    await fetch(`/api/admin/lessons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ status }),
    })
    await fetchLessons()
  }

  async function publishLesson(id: string) {
    setPublishingId(id)
    showStatus('Rendering audio & publishing...')
    const res = await fetch(`/api/admin/publish/${id}`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    })
    const data = await res.json()
    setPublishingId(null)
    await fetchLessons()
    showStatus(`Published! ${data.audio?.success ?? 0} audio clips ready ✅`)
  }

  async function createVocab() {
    if (!newVocab.english_text.trim() || !newVocab.spanish_text.trim()) return
    const payload = {
      ...newVocab,
      lesson_id: newVocab.lesson_id || null,
      distractors_en: newVocab.distractors_en.split(',').map((s) => s.trim()).filter(Boolean),
      distractors_es: newVocab.distractors_es.split(',').map((s) => s.trim()).filter(Boolean),
    }
    const res = await fetch('/api/admin/vocab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setNewVocab({ english_text: '', spanish_text: '', lesson_id: '', category: 'General', difficulty: 1, distractors_en: '', distractors_es: '' })
      await fetchVocab()
      showStatus('Word added ✅')
    }
  }

  async function deleteVocab(id: string) {
    if (!confirm('Delete this word?')) return
    await fetch(`/api/admin/vocab/${id}`, { method: 'DELETE', headers: getAuthHeader() })
    await fetchVocab()
    showStatus('Deleted ✅')
  }

  async function deleteLearner(id: string) {
    if (!confirm('Permanently delete this learner profile and all their progress?')) return
    const res = await fetch(`/api/profiles/${id}`, { method: 'DELETE', headers: getAuthHeader() })
    if (res.ok) {
      await fetchLearners()
      showStatus('Learner deleted ✅')
    } else {
      showStatus('Failed to delete learner ❌')
    }
  }

  async function playFlaggedAudio(url: string) {
    const a = new window.Audio(url)
    a.play()
  }

  async function approveFlaggedAudio(id: string) {
    const res = await fetch(`/api/admin/audio/flagged/${id}`, { method: 'DELETE', headers: getAuthHeader() })
    if (res.ok) {
      fetchFlaggedAudio()
      showStatus('Flag dismissed/approved ✅')
    }
  }

  async function regenerateSpecificAudio(id: string) {
    showStatus('Regenerating audio snippet...')
    const res = await fetch(`/api/admin/audio/flagged/${id}`, { method: 'POST', headers: getAuthHeader() })
    if (res.ok) {
      const { url } = await res.json()
      fetchFlaggedAudio()
      showStatus('Audio fully re-generated! You can test it now.')
      setTimeout(() => playFlaggedAudio(url), 500)
    } else {
      showStatus('Failed to regenerate audio ❌')
    }
  }

  async function createReward() {
    if (!newReward.title.trim()) return
    const res = await fetch('/api/admin/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(newReward)
    })
    if (res.ok) {
      setNewReward({ title: '', cost: 50, icon: '🎁' })
      await fetchRewards()
      showStatus('Reward added ✅')
    }
  }

  async function deleteReward(id: string) {
    if (!confirm('Delete this reward?')) return
    await fetch(`/api/admin/rewards/${id}`, { method: 'DELETE', headers: getAuthHeader() })
    await fetchRewards()
    showStatus('Reward deleted ✅')
  }

  async function fulfillPurchase(id: string) {
    if (!confirm('Mark this reward as given/fulfilled?')) return
    await fetch(`/api/admin/purchases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ status: 'fulfilled' })
    })
    await fetchRewards()
    showStatus('Purchase fulfilled ✅')
  }

  function showStatus(msg: string) {
    setStatusMsg(msg)
    setTimeout(() => setStatusMsg(''), 4000)
  }

  // Login screen
  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.loginLogo}>🌎</div>
          <h1 className={styles.loginTitle}>Admin Panel</h1>
          <p className={styles.loginSub}>SpanishKids — Parent Controls</p>
          <input
            id="adminPassword"
            className={styles.passwordInput}
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          {authError && <p className={styles.authError}>{authError}</p>}
          <button className={`btn btn-primary ${styles.loginBtn}`} onClick={handleLogin}>
            Enter
          </button>
          <a href="/" className={styles.backToApp}>← Back to app</a>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.adminPage}>
      {/* Status toast */}
      {statusMsg && (
        <div className={styles.toast}>{statusMsg}</div>
      )}

      {/* Header */}
      <div className={styles.adminHeader}>
        <div className={styles.adminLogo}>
          <span>🌎</span>
          <span>SpanishKids Admin</span>
        </div>
        <a href="/" className={styles.viewAppLink}>View App →</a>
      </div>

      {/* Tab nav */}
      <div className={styles.tabNav}>
        {(['lessons', 'vocab', 'audio', 'learners', 'rewards'] as Tab[]).map((t) => (
          <button
            key={t}
            id={`tab-${t}`}
            className={`${styles.tabBtn} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'lessons' ? '📚 Lessons' : t === 'vocab' ? '📝 Vocab' : t === 'audio' ? '🔊 Audio' : t === 'learners' ? '👤 Learners' : '🎁 Rewards'}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>

        {/* ── LESSONS TAB ── */}
        {tab === 'lessons' && (
          <div>
            <h2 className={styles.sectionTitle}>Lessons</h2>

            {/* Create lesson form */}
            <div className={styles.formCard}>
              <h3 className={styles.formTitle}>Add Lesson</h3>
              <div className={styles.formRow}>
                <input
                  id="lessonTitle"
                  className={styles.input}
                  placeholder="Lesson title"
                  value={newLesson.title}
                  onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                />
                <select
                  className={styles.select}
                  value={newLesson.category}
                  onChange={(e) => setNewLesson({ ...newLesson, category: e.target.value })}
                >
                  {['Basics', 'Animals', 'Food', 'Colors', 'Family', 'Body', 'Verbs', 'Sentences', 'Review'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <button id="addLessonBtn" className={`btn btn-primary ${styles.addBtn}`} onClick={createLesson}>
                  Add
                </button>
              </div>
            </div>

            {/* Lessons list */}
            <div className={styles.itemList}>
              {lessons.map((lesson) => (
                <div key={lesson.id} className={styles.itemCard}>
                  <div className={styles.itemMain}>
                    <div className={styles.itemOrder}>#{lesson.order}</div>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemTitle}>{lesson.title}</div>
                      <div className={styles.itemMeta}>
                        {lesson.category} · Difficulty {lesson.difficulty}
                        {lesson.audio_ready && <span className={styles.audioBadge}>🔊 Audio ready</span>}
                      </div>
                    </div>
                    <div className={styles.itemStatus}>
                      <span className={`${styles.statusBadge} ${styles['status_' + lesson.status]}`}>
                        {lesson.status}
                      </span>
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    {lesson.status === 'draft' && (
                      <button
                        className={`btn btn-success ${styles.actionBtn}`}
                        onClick={() => publishLesson(lesson.id)}
                        disabled={publishingId === lesson.id}
                      >
                        {publishingId === lesson.id ? '⏳ Publishing...' : '🚀 Publish'}
                      </button>
                    )}
                    {lesson.status === 'published' && (
                      <button
                        className={`btn ${styles.actionBtn} ${styles.rerenderBtn}`}
                        onClick={() => publishLesson(lesson.id)}
                        disabled={publishingId === lesson.id}
                      >
                        {publishingId === lesson.id ? '⏳...' : '🔄 Re-render Audio'}
                      </button>
                    )}
                    {lesson.status !== 'archived' && (
                      <button
                        className={`${styles.archiveBtn}`}
                        onClick={() => updateLessonStatus(lesson.id, 'archived')}
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VOCAB TAB ── */}
        {tab === 'vocab' && (
          <div>
            <h2 className={styles.sectionTitle}>Vocabulary</h2>

            {/* Add vocab form */}
            <div className={styles.formCard}>
              <h3 className={styles.formTitle}>Add Word</h3>
              <div className={styles.vocabFormGrid}>
                <input
                  id="englishWord"
                  className={styles.input}
                  placeholder="English"
                  value={newVocab.english_text}
                  onChange={(e) => setNewVocab({ ...newVocab, english_text: e.target.value })}
                />
                <input
                  id="spanishWord"
                  className={styles.input}
                  placeholder="Spanish"
                  value={newVocab.spanish_text}
                  onChange={(e) => setNewVocab({ ...newVocab, spanish_text: e.target.value })}
                />
                <select
                  className={styles.select}
                  value={newVocab.lesson_id}
                  onChange={(e) => setNewVocab({ ...newVocab, lesson_id: e.target.value })}
                >
                  <option value="">No lesson</option>
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
                <input
                  className={styles.input}
                  placeholder="Distractors EN (comma-sep)"
                  value={newVocab.distractors_en}
                  onChange={(e) => setNewVocab({ ...newVocab, distractors_en: e.target.value })}
                />
                <input
                  className={styles.input}
                  placeholder="Distractors ES (comma-sep)"
                  value={newVocab.distractors_es}
                  onChange={(e) => setNewVocab({ ...newVocab, distractors_es: e.target.value })}
                />
              </div>
              <button id="addVocabBtn" className={`btn btn-primary ${styles.addBtn}`} onClick={createVocab}>
                Add Word
              </button>
            </div>

            {/* Vocab list */}
            <div className={styles.itemList}>
              {vocab.map((item) => (
                <div key={item.id} className={styles.vocabCard}>
                  <div className={styles.vocabPair}>
                    <span className={styles.vocabEn}>{item.english_text}</span>
                    <span className={styles.vocabArrow}>→</span>
                    <span className={styles.vocabEs}>{item.spanish_text}</span>
                  </div>
                  <div className={styles.vocabMeta}>{item.category}</div>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => deleteVocab(item.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AUDIO TAB ── */}
        {tab === 'audio' && (
          <div>
            <h2 className={styles.sectionTitle}>Audio Status & Reporting</h2>
            <p className={styles.audioHint}>
              When users report bad pronunciations, they appear here. Test them, click Regenerate to draw a fresh read from ElevenLabs, and click Approve once it sounds right.
            </p>

            {flaggedAudio.length > 0 && (
              <div style={{ marginBottom: '2rem', background: '#fef2f2', border: '2px solid #fecaca', padding: '1rem', borderRadius: '1rem' }}>
                <h3 style={{ color: '#991b1b', marginBottom: '1rem' }}>⚠️ Action Required: Flagged Audio</h3>
                <div className={styles.itemList}>
                  {flaggedAudio.map((item) => (
                    <div key={item.id} className={styles.vocabCard}>
                      <div className={styles.vocabPair}>
                        <span className={styles.vocabEn} style={{ fontWeight: 'normal' }}>"{item.raw_text}"</span>
                        <span className={styles.vocabMeta} style={{ marginLeft: '0.5rem' }}>[{item.language}]</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn" style={{ background: '#bfdbfe', color: '#1e3a8a' }} onClick={() => playFlaggedAudio(item.file_url)}>
                          ▶️ Test Audio
                        </button>
                        <button className="btn btn-primary" onClick={() => regenerateSpecificAudio(item.id)}>
                          🔄 Regenerate
                        </button>
                        <button className="btn btn-success" onClick={() => approveFlaggedAudio(item.id)}>
                          ✅ Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>Lesson Render Status</h3>
            <p className={styles.audioHint}>Pre-render audio for entire lessons below.</p>

            <div className={styles.itemList}>
              {lessons.map((lesson) => (
                <div key={lesson.id} className={styles.audioCard}>
                  <div className={styles.audioCardTitle}>{lesson.title}</div>
                  <div className={styles.audioCardMeta}>
                    Status: <strong>{lesson.status}</strong>
                    {' · '}
                    Audio: <strong>{lesson.audio_ready ? '✅ Ready' : '❌ Not rendered'}</strong>
                  </div>
                  <button
                    className={`btn btn-primary ${styles.actionBtn}`}
                    onClick={() => publishLesson(lesson.id)}
                    disabled={publishingId === lesson.id}
                  >
                    {publishingId === lesson.id ? '⏳ Rendering...' : '🔊 Render Audio'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LEARNERS TAB ── */}
        {tab === 'learners' && (
          <div>
            <h2 className={styles.sectionTitle}>Manage Learners</h2>
            <p className={styles.audioHint}>
              View and delete child profiles. Note: deleting a profile deletes all their progress.
            </p>
            <div className={styles.itemList}>
              {learners.length === 0 && <p style={{ color: '#94a3b8' }}>No learners found.</p>}
              {learners.map((learner) => (
                <div key={learner.id} className={styles.vocabCard}>
                  <div className={styles.vocabPair}>
                    <span className={styles.vocabEs} style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>{learner.avatar}</span>
                    <span className={styles.vocabEn}>{learner.child_name}</span>
                  </div>
                  <div className={styles.vocabMeta}>
                    XP: {learner.total_xp} · Streak: {learner.streak}
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => deleteLearner(learner.id)}
                    title="Delete Learner"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── REWARDS TAB ── */}
        {tab === 'rewards' && (
          <div>
            <h2 className={styles.sectionTitle}>Store & Rewards</h2>
            <p className={styles.audioHint}>Add items for your children to buy with their XP stars!</p>
            
            <div className={styles.formCard}>
              <h3 className={styles.formTitle}>Add Reward</h3>
              <div className={styles.formRow}>
                <input
                  className={styles.input}
                  style={{ width: '4rem' }}
                  placeholder="Emoji"
                  value={newReward.icon}
                  onChange={(e) => setNewReward({ ...newReward, icon: e.target.value })}
                />
                <input
                  className={styles.input}
                  placeholder="Reward Title"
                  value={newReward.title}
                  onChange={(e) => setNewReward({ ...newReward, title: e.target.value })}
                />
                <input
                  type="number"
                  className={styles.input}
                  style={{ width: '6rem' }}
                  placeholder="XP"
                  value={newReward.cost}
                  onChange={(e) => setNewReward({ ...newReward, cost: parseInt(e.target.value) || 0 })}
                />
                <button className={`btn btn-primary ${styles.addBtn}`} onClick={createReward}>Add</button>
              </div>
            </div>

            <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>Pending Purchases</h3>
            <div className={styles.itemList}>
              {purchases.filter(p => p.status === 'pending').length === 0 && <p style={{ color: '#94a3b8' }}>No pending purchases.</p>}
              {purchases.filter(p => p.status === 'pending').map((p) => (
                <div key={p.id} className={styles.vocabCard} style={{ background: '#fefce8', borderColor: '#fde047' }}>
                  <div className={styles.vocabPair}>
                    <span className={styles.vocabEs} style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>{p.profile.avatar}</span>
                    <span className={styles.vocabEn}>
                      {p.profile.child_name} bought <strong>{p.reward.icon} {p.reward.title}</strong>
                    </span>
                  </div>
                  <button className="btn btn-success" onClick={() => fulfillPurchase(p.id)}>
                    Fulfill ✅
                  </button>
                </div>
              ))}
            </div>

            <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: '#1e293b' }}>Available Store Items</h3>
            <div className={styles.itemList}>
              {rewards.map((reward) => (
                <div key={reward.id} className={styles.vocabCard}>
                  <div className={styles.vocabPair}>
                    <span className={styles.vocabEs} style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>{reward.icon}</span>
                    <span className={styles.vocabEn}>{reward.title}</span>
                  </div>
                  <div className={styles.vocabMeta}>
                    Cost: ⭐ {reward.cost}
                  </div>
                  <button className={styles.deleteBtn} onClick={() => deleteReward(reward.id)} title="Delete Reward">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
