'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './admin.module.css'

type Tab = 'lessons' | 'vocab' | 'verbs' | 'stories' | 'audio' | 'learners' | 'rewards' | 'bible'

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
  const [verbs, setVerbs] = useState<any[]>([])
  const [stories, setStories] = useState<any[]>([])
  const [learners, setLearners] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const [rewards, setRewards] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [flaggedAudio, setFlaggedAudio] = useState<any[]>([])
  const [newReward, setNewReward] = useState({ title: '', cost: 50, icon: '🎁' })

  // Biblical Terms
  const [bibleTerms, setBibleTerms] = useState<any[]>([])
  const [newBibleTerm, setNewBibleTerm] = useState({
    term: '', spanish_text: '', definition: '', scripture_ref: '', scripture_text: '',
    category: 'Faith', emoji: '✝️',
    distractor_1: '', distractor_2: '', distractor_3: '',
    difficulty: 1,
  })

  // Lesson form
  const [newLesson, setNewLesson] = useState({ title: '', category: 'Basics', difficulty: 1 })
  
  const [newVocab, setNewVocab] = useState({
    english_text: '',
    spanish_text: '',
    lesson_id: '',
    category: 'General',
    difficulty: 1,
    distractors_en: '',
    distractors_es: '',
  })

  // Verb form
  const [newVerb, setNewVerb] = useState({
    infinitive_es: '',
    infinitive_en: '',
    lesson_id: '',
    category: 'General',
    difficulty: 1,
    yo: '',
    tu: '',
    el: '',
    nosotros: '',
    ellos: '',
  })

  // Story form
  const [newStory, setNewStory] = useState({
    title: '', content_es: '', content_en: '', question_es: '', question_en: '', correct_answer: '', distractor_1: '', distractor_2: '', distractor_3: '', difficulty: 1
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

  async function fetchVerbs() {
    const res = await fetch('/api/admin/verbs', { headers: getAuthHeader() })
    if (res.ok) setVerbs(await res.json())
  }

  async function fetchStories() {
    const res = await fetch('/api/admin/stories', { headers: getAuthHeader() })
    if (res.ok) setStories(await res.json())
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

  async function fetchBibleTerms() {
    const res = await fetch('/api/admin/bible-terms', { headers: getAuthHeader() })
    if (res.ok) setBibleTerms(await res.json())
  }

  async function createBibleTerm() {
    if (!newBibleTerm.term.trim() || !newBibleTerm.definition.trim()) return
    const res = await fetch('/api/admin/bible-terms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(newBibleTerm),
    })
    if (res.ok) {
      setNewBibleTerm({ term: '', spanish_text: '', definition: '', scripture_ref: '', scripture_text: '', category: 'Faith', emoji: '✝️', distractor_1: '', distractor_2: '', distractor_3: '', difficulty: 1 })
      await fetchBibleTerms()
      showStatus('Biblical term added ✅')
    }
  }

  async function deleteBibleTerm(id: string) {
    if (!confirm('Delete this biblical term?')) return
    await fetch(`/api/admin/bible-terms/${id}`, { method: 'DELETE', headers: getAuthHeader() })
    await fetchBibleTerms()
    showStatus('Deleted ✅')
  }

  useEffect(() => {
    if (authed && tab === 'vocab') fetchVocab()
    if (authed && tab === 'verbs') fetchVerbs()
    if (authed && tab === 'stories') fetchStories()
    if (authed && tab === 'learners') fetchLearners()
    if (authed && tab === 'rewards') fetchRewards()
    if (authed && tab === 'audio') { fetchLessons(); fetchFlaggedAudio() }
    if (authed && tab === 'bible') fetchBibleTerms()
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

  async function createVerb() {
    if (!newVerb.infinitive_es.trim()) return
    const payload = { ...newVerb, lesson_id: newVerb.lesson_id || null }
    const res = await fetch('/api/admin/verbs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setNewVerb({ infinitive_es: '', infinitive_en: '', lesson_id: '', category: 'General', difficulty: 1, yo: '', tu: '', el: '', nosotros: '', ellos: '' })
      await fetchVerbs()
      showStatus('Verb added ✅')
    }
  }

  async function deleteVerb(id: string) {
    if (!confirm('Delete this verb?')) return
    await fetch(`/api/admin/verbs/${id}`, { method: 'DELETE', headers: getAuthHeader() })
    await fetchVerbs()
    showStatus('Deleted ✅')
  }

  async function createStory() {
    if (!newStory.title.trim()) return
    const res = await fetch('/api/admin/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(newStory),
    })
    if (res.ok) {
      setNewStory({ title: '', content_es: '', content_en: '', question_es: '', question_en: '', correct_answer: '', distractor_1: '', distractor_2: '', distractor_3: '', difficulty: 1 })
      await fetchStories()
      showStatus('Story added ✅')
    }
  }

  async function deleteStory(id: string) {
    if (!confirm('Delete this story?')) return
    await fetch(`/api/admin/stories/${id}`, { method: 'DELETE', headers: getAuthHeader() })
    await fetchStories()
    showStatus('Story deleted ✅')
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
      <div className={styles.tabNav} style={{ overflowX: 'auto', display: 'flex' }}>
        {(['lessons', 'vocab', 'verbs', 'stories', 'audio', 'learners', 'rewards', 'bible'] as Tab[]).map((t) => (
          <button
            key={t}
            id={`tab-${t}`}
            className={`${styles.tabBtn} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {t === 'lessons' ? '📚 Lessons' : t === 'vocab' ? '📝 Vocab' : t === 'verbs' ? '🏃 Verbs' : t === 'stories' ? '📖 Stories' : t === 'audio' ? '🔊 Audio' : t === 'learners' ? '👤 Learners' : t === 'bible' ? '✝️ Bible' : '🎁 Rewards'}
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

        {/* ── VERBS TAB ── */}
        {tab === 'verbs' && (
          <div>
            <h2 className={styles.sectionTitle}>Verb Conjugations</h2>
            
            <div className={styles.formCard}>
              <h3 className={styles.formTitle}>Add Verb</h3>
              <div className={styles.vocabFormGrid}>
                <input
                  className={styles.input}
                  placeholder="Infinitive (Spanish e.g. hablar)"
                  value={newVerb.infinitive_es}
                  onChange={(e) => setNewVerb({ ...newVerb, infinitive_es: e.target.value })}
                />
                <input
                  className={styles.input}
                  placeholder="Meaning (English e.g. to speak)"
                  value={newVerb.infinitive_en}
                  onChange={(e) => setNewVerb({ ...newVerb, infinitive_en: e.target.value })}
                />
                <select
                  className={styles.select}
                  value={newVerb.lesson_id}
                  onChange={(e) => setNewVerb({ ...newVerb, lesson_id: e.target.value })}
                >
                  <option value="">No lesson</option>
                  {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
                <input
                  className={styles.input}
                  placeholder="yo (I)"
                  value={newVerb.yo}
                  onChange={(e) => setNewVerb({ ...newVerb, yo: e.target.value })}
                />
                <input
                  className={styles.input}
                  placeholder="tú (you)"
                  value={newVerb.tu}
                  onChange={(e) => setNewVerb({ ...newVerb, tu: e.target.value })}
                />
                <input
                  className={styles.input}
                  placeholder="él/ella (he/she)"
                  value={newVerb.el}
                  onChange={(e) => setNewVerb({ ...newVerb, el: e.target.value })}
                />
                <input
                  className={styles.input}
                  placeholder="nosotros (we)"
                  value={newVerb.nosotros}
                  onChange={(e) => setNewVerb({ ...newVerb, nosotros: e.target.value })}
                />
                <input
                  className={styles.input}
                  placeholder="ellos (they)"
                  value={newVerb.ellos}
                  onChange={(e) => setNewVerb({ ...newVerb, ellos: e.target.value })}
                />
              </div>
              <button className={`btn btn-primary ${styles.addBtn}`} onClick={createVerb}>
                Add Verb
              </button>
            </div>

            <div className={styles.itemList}>
              {verbs.map((verb) => (
                <div key={verb.id} className={styles.vocabCard}>
                  <div className={styles.vocabPair}>
                    <span className={styles.vocabEn}>{verb.infinitive_en}</span>
                    <span className={styles.vocabArrow}>→</span>
                    <span className={styles.vocabEs} style={{ fontWeight: 800 }}>{verb.infinitive_es}</span>
                  </div>
                  <div className={styles.vocabMeta} style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>👤 Yo {verb.yo}</div>
                    <div>👉 Tú {verb.tu}</div>
                    <div>🙋‍♂️ Él {verb.el}</div>
                    <div>👥 Nosotros {verb.nosotros}</div>
                    <div>👨‍👩‍👧‍👦 Ellos {verb.ellos}</div>
                  </div>
                  <button className={styles.deleteBtn} style={{ marginTop: '1rem' }} onClick={() => deleteVerb(verb.id)}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STORIES TAB ── */}
        {tab === 'stories' && (
          <div>
            <h2 className={styles.sectionTitle}>Story Mode (Listening Comp)</h2>
            
            <div className={styles.formCard}>
              <h3 className={styles.formTitle}>Write a Story</h3>
              <div className={styles.vocabFormGrid}>
                <input
                  className={styles.input} style={{ gridColumn: '1 / -1' }}
                  placeholder="Title (e.g. El Perro Rojo)"
                  value={newStory.title} onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                />
                <textarea
                  className={styles.input} style={{ gridColumn: '1 / -1', minHeight: '80px', fontFamily: 'monospace' }}
                  placeholder="Spanish Paragraph..."
                  value={newStory.content_es} onChange={(e) => setNewStory({ ...newStory, content_es: e.target.value })}
                />
                <textarea
                  className={styles.input} style={{ gridColumn: '1 / -1', minHeight: '60px', fontFamily: 'monospace' }}
                  placeholder="English Translation..."
                  value={newStory.content_en} onChange={(e) => setNewStory({ ...newStory, content_en: e.target.value })}
                />
                <input
                  className={styles.input} placeholder="Question (ES)"
                  value={newStory.question_es} onChange={(e) => setNewStory({ ...newStory, question_es: e.target.value })}
                />
                <input
                  className={styles.input} placeholder="Question (EN)"
                  value={newStory.question_en} onChange={(e) => setNewStory({ ...newStory, question_en: e.target.value })}
                />
                <input
                  className={styles.input} placeholder="Correct Answer (ES)" style={{ borderColor: '#4ade80' }}
                  value={newStory.correct_answer} onChange={(e) => setNewStory({ ...newStory, correct_answer: e.target.value })}
                />
                <input
                  className={styles.input} placeholder="Wrong Answer 1"
                  value={newStory.distractor_1} onChange={(e) => setNewStory({ ...newStory, distractor_1: e.target.value })}
                />
                <input
                  className={styles.input} placeholder="Wrong Answer 2"
                  value={newStory.distractor_2} onChange={(e) => setNewStory({ ...newStory, distractor_2: e.target.value })}
                />
                <input
                  className={styles.input} placeholder="Wrong Answer 3"
                  value={newStory.distractor_3} onChange={(e) => setNewStory({ ...newStory, distractor_3: e.target.value })}
                />
              </div>
              <button className={`btn btn-primary ${styles.addBtn}`} onClick={createStory}>
                Save Story
              </button>
            </div>

            <div className={styles.itemList}>
              {stories.map((story) => (
                <div key={story.id} className={styles.vocabCard}>
                  <div className={styles.vocabPair}>
                    <span className={styles.vocabEs} style={{ fontWeight: 800 }}>{story.title}</span>
                  </div>
                  <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: '#f8fafc', borderRadius: '0.5rem', fontStyle: 'italic', color: '#475569' }}>
                    {story.content_es}
                  </div>
                  <div className={styles.vocabMeta} style={{ marginTop: '0.8rem' }}>
                    <strong>Q:</strong> {story.question_es}<br/>
                    <strong>A:</strong> {story.correct_answer}
                  </div>
                  <button className={styles.deleteBtn} style={{ marginTop: '1rem' }} onClick={() => deleteStory(story.id)}>✕</button>
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

        {/* ── BIBLICAL TERMS TAB ── */}
        {tab === 'bible' && (
          <div>
            <h2 className={styles.sectionTitle}>✝️ Biblical Terms</h2>
            <p className={styles.audioHint}>Add faith vocabulary for Christian families — terms like Grace, Covenant, Sanctification, etc.</p>

            <div className={styles.formCard}>
              <h3 className={styles.formTitle}>Add Biblical Term</h3>
              <div className={styles.vocabFormGrid}>
                <input
                  className={styles.input}
                  placeholder="Term in English (e.g. Grace)"
                  value={newBibleTerm.term}
                  onChange={(e) => setNewBibleTerm({ ...newBibleTerm, term: e.target.value })}
                />
                <input
                  className={styles.input}
                  placeholder="Spanish translation (e.g. Gracia) "
                  value={newBibleTerm.spanish_text}
                  onChange={(e) => setNewBibleTerm({ ...newBibleTerm, spanish_text: e.target.value })}
                />
                <input
                  className={styles.input}
                  style={{ width: '4rem' }}
                  placeholder="Emoji"
                  value={newBibleTerm.emoji}
                  onChange={(e) => setNewBibleTerm({ ...newBibleTerm, emoji: e.target.value })}
                />
                <textarea
                  className={styles.input}
                  style={{ gridColumn: '1 / -1', minHeight: '70px' }}
                  placeholder="Kid-friendly definition (e.g. God's gift to us that we don't earn...)"
                  value={newBibleTerm.definition}
                  onChange={(e) => setNewBibleTerm({ ...newBibleTerm, definition: e.target.value })}
                />
                <input
                  className={styles.input}
                  placeholder="Scripture Ref (e.g. Ephesians 2:8)"
                  value={newBibleTerm.scripture_ref}
                  onChange={(e) => setNewBibleTerm({ ...newBibleTerm, scripture_ref: e.target.value })}
                />
                <input
                  className={styles.input}
                  placeholder="Verse snippet"
                  value={newBibleTerm.scripture_text}
                  onChange={(e) => setNewBibleTerm({ ...newBibleTerm, scripture_text: e.target.value })}
                />
                <select
                  className={styles.select}
                  value={newBibleTerm.category}
                  onChange={(e) => setNewBibleTerm({ ...newBibleTerm, category: e.target.value })}
                >
                  {['Faith', 'Salvation', 'Foundation', 'Worship', 'Promise', 'Sacrament', 'Character of God', 'Growth', 'Scripture'].map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <input
                  className={styles.input}
                  placeholder="Wrong Answer 1"
                  value={newBibleTerm.distractor_1}
                  onChange={(e) => setNewBibleTerm({ ...newBibleTerm, distractor_1: e.target.value })}
                />
                <input
                  className={styles.input}
                  placeholder="Wrong Answer 2"
                  value={newBibleTerm.distractor_2}
                  onChange={(e) => setNewBibleTerm({ ...newBibleTerm, distractor_2: e.target.value })}
                />
                <input
                  className={styles.input}
                  placeholder="Wrong Answer 3"
                  value={newBibleTerm.distractor_3}
                  onChange={(e) => setNewBibleTerm({ ...newBibleTerm, distractor_3: e.target.value })}
                />
              </div>
              <button className={`btn btn-primary ${styles.addBtn}`} onClick={createBibleTerm}>
                Add Term
              </button>
            </div>

            <div className={styles.itemList}>
              {bibleTerms.length === 0 && <p style={{ color: '#94a3b8' }}>No terms yet. Add some above!</p>}
              {bibleTerms.map((bt) => (
                <div key={bt.id} className={styles.vocabCard}>
                  <div className={styles.vocabPair}>
                    <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>{bt.emoji}</span>
                    <span className={styles.vocabEn}>{bt.term}</span>
                    <span className={styles.vocabArrow}>→</span>
                    <span className={styles.vocabEs}>{bt.spanish_text}</span>
                  </div>
                  <div className={styles.vocabMeta} style={{ marginTop: '0.4rem' }}>
                    {bt.definition}
                  </div>
                  {bt.scripture_ref && (
                    <div className={styles.vocabMeta} style={{ marginTop: '0.3rem', fontStyle: 'italic', color: '#7c3aed' }}>
                      📖 {bt.scripture_ref}
                    </div>
                  )}
                  <button className={styles.deleteBtn} style={{ marginTop: '0.75rem' }} onClick={() => deleteBibleTerm(bt.id)}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
