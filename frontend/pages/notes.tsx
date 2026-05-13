import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, ApiError } from '../lib/api';
import { ProgressNote, SkillTree } from '../lib/types';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { FadeIn, StaggerContainer, StaggerItem, GlowCard, FloatingParticles } from '../components/animations';

const MOOD_OPTIONS = [
  { value: 'great', label: '🌟 Great', color: '#34d399' },
  { value: 'good', label: '😊 Good', color: '#60a5fa' },
  { value: 'okay', label: '😐 Okay', color: '#f4d77a' },
  { value: 'tough', label: '💪 Tough', color: '#f87171' },
];

const MOOD_COLORS: Record<string, string> = { great: '#34d399', good: '#60a5fa', okay: '#f4d77a', tough: '#f87171' };

export default function NotesPage() {
  const [notes, setNotes] = useState<ProgressNote[]>([]);
  const [trees, setTrees] = useState<SkillTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMood, setFilterMood] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({ title: '', content: '', tags: '', mood: '', linked_tree_id: '' });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      const [notesData, treesData] = await Promise.all([api.listProgressNotes(), api.listTrees()]);
      setNotes(notesData);
      setTrees(treesData.filter(t => !t.is_template));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to load notes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      await api.createProgressNote({
        title: form.title,
        content: form.content,
        tags,
        mood: form.mood || null,
        linked_tree_id: form.linked_tree_id ? parseInt(form.linked_tree_id) : null,
      });
      setForm({ title: '', content: '', tags: '', mood: '', linked_tree_id: '' });
      setShowCreate(false);
      showToast('Note saved');
      loadData();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to save note', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteProgressNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      showToast('Note deleted');
    } catch {}
  };

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags))).sort();

  const filtered = notes.filter(n => {
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    const matchMood = !filterMood || n.mood === filterMood;
    const matchTag = !filterTag || n.tags.includes(filterTag);
    return matchSearch && matchMood && matchTag;
  });

  const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

  if (loading) return <LoadingSpinner text="Loading journal..." fullScreen />;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c' }}>
      <Navbar />
      <FloatingParticles count={5} />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
        <FadeIn>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 800, background: 'linear-gradient(135deg, #b8923c, #f4d77a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                Journal
              </h1>
              <p style={{ color: '#888', marginTop: '0.375rem', fontSize: '0.9375rem' }}>Progress notes. Reflections. Breakthroughs.</p>
            </div>
            <motion.button
              onClick={() => setShowCreate(v => !v)}
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px #b8923c50' }}
              whileTap={{ scale: 0.95 }}
              style={{ padding: '0.625rem 1.25rem', background: showCreate ? 'transparent' : '#b8923c', color: showCreate ? '#888' : '#0a0a0c', border: showCreate ? '1px solid #2a2a2c' : 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
            >
              {showCreate ? 'Cancel' : '+ New Entry'}
            </motion.button>
          </div>
        </FadeIn>

        {/* Stats row */}
        <StaggerContainer stagger={0.07} delay={0.1}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.875rem', marginBottom: '2rem' }}>
            {[
              { label: 'Entries', value: notes.length, color: '#b8923c' },
              { label: 'Words', value: notes.reduce((s, n) => s + wordCount(n.content), 0).toLocaleString(), color: '#60a5fa' },
              { label: 'Tags', value: allTags.length, color: '#f4d77a' },
              { label: 'This Week', value: notes.filter(n => Date.now() - new Date(n.created_at).getTime() < 7 * 86400000).length, color: '#34d399' },
            ].map(s => (
              <StaggerItem key={s.label}>
                <div style={{ padding: '1rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>{s.label}</div>
                </div>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>

        {/* Create Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
              style={{ overflow: 'hidden', marginBottom: '1.5rem' }}
            >
              <form onSubmit={handleSubmit} style={{ padding: '1.5rem', background: '#111113', border: '1px solid #b8923c40', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <h3 style={{ margin: 0, color: '#f4d77a', fontSize: '1rem' }}>New Journal Entry</h3>
                <input
                  required
                  placeholder="Entry title *"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  style={inputStyle}
                />
                <textarea
                  required
                  placeholder="What happened today? What did you learn? How did it go?..."
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={6}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <input
                    placeholder="Tags (comma-separated)"
                    value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    style={inputStyle}
                  />
                  <select value={form.mood} onChange={e => setForm(f => ({ ...f, mood: e.target.value }))} style={inputStyle}>
                    <option value="">Mood (optional)</option>
                    {MOOD_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                {trees.length > 0 && (
                  <select value={form.linked_tree_id} onChange={e => setForm(f => ({ ...f, linked_tree_id: e.target.value }))} style={inputStyle}>
                    <option value="">Link to skill tree (optional)</option>
                    {trees.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
                {form.content && (
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>{wordCount(form.content)} words</p>
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <motion.button type="submit" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ padding: '0.625rem 1.5rem', background: '#b8923c', color: '#0a0a0c', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
                    Save Entry
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        {notes.length > 0 && (
          <FadeIn delay={0.2}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="Search entries..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, flex: 1, minWidth: 180 }}
              />
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {MOOD_OPTIONS.map(m => (
                  <motion.button
                    key={m.value}
                    onClick={() => setFilterMood(v => v === m.value ? '' : m.value)}
                    whileHover={{ scale: 1.05 }}
                    style={{
                      padding: '0.3rem 0.625rem',
                      borderRadius: 6,
                      border: '1px solid',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      background: filterMood === m.value ? `${m.color}20` : 'transparent',
                      borderColor: filterMood === m.value ? m.color : '#2a2a2c',
                      color: filterMood === m.value ? m.color : '#888',
                    }}
                  >
                    {m.label}
                  </motion.button>
                ))}
              </div>
            </div>
            {allTags.length > 0 && (
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <motion.button onClick={() => setFilterTag('')} whileHover={{ scale: 1.04 }} style={{ ...tagBtnStyle, background: filterTag === '' ? '#b8923c20' : 'transparent', borderColor: filterTag === '' ? '#b8923c' : '#2a2a2c', color: filterTag === '' ? '#b8923c' : '#888' }}>
                  All
                </motion.button>
                {allTags.map(tag => (
                  <motion.button key={tag} onClick={() => setFilterTag(v => v === tag ? '' : tag)} whileHover={{ scale: 1.04 }} style={{ ...tagBtnStyle, background: filterTag === tag ? '#b8923c20' : 'transparent', borderColor: filterTag === tag ? '#b8923c' : '#2a2a2c', color: filterTag === tag ? '#b8923c' : '#888' }}>
                    #{tag}
                  </motion.button>
                ))}
              </div>
            )}
          </FadeIn>
        )}

        {/* Notes List */}
        {notes.length === 0 ? (
          <FadeIn delay={0.3}>
            <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#666', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12 }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📓</div>
              <p style={{ fontSize: '1.125rem', color: '#fff', marginBottom: '0.5rem' }}>Your journal is empty</p>
              <p style={{ fontSize: '0.875rem' }}>Start logging progress notes, reflections, and wins.</p>
            </div>
          </FadeIn>
        ) : (
          <StaggerContainer stagger={0.07}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <AnimatePresence>
                {filtered.map(note => {
                  const moodColor = note.mood ? MOOD_COLORS[note.mood] : '#b8923c';
                  const isExpanded = expanded === note.id;
                  const preview = note.content.length > 200 ? note.content.slice(0, 200) + '…' : note.content;
                  return (
                    <StaggerItem key={note.id}>
                      <GlowCard glowColor={moodColor} style={{ padding: '1.5rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.75rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                              {note.mood && <span style={{ fontSize: '1rem' }}>{MOOD_OPTIONS.find(m => m.value === note.mood)?.label.split(' ')[0]}</span>}
                              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.0625rem', fontWeight: 600 }}>{note.title}</h3>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#555' }}>
                              {new Date(note.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              {' · '}{wordCount(note.content)} words
                            </p>
                          </div>
                          <motion.button onClick={() => handleDelete(note.id)} whileHover={{ scale: 1.1 }} style={{ background: 'transparent', border: '1px solid #2a2a2c', borderRadius: 6, padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#f87171' }}>
                            🗑
                          </motion.button>
                        </div>

                        <motion.div
                          initial={false}
                          animate={{ height: isExpanded ? 'auto' : undefined }}
                          style={{ overflow: 'hidden' }}
                        >
                          <p style={{ margin: '0 0 0.75rem', color: '#c4c4ca', fontSize: '0.9rem', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                            {isExpanded ? note.content : preview}
                          </p>
                        </motion.div>

                        {note.content.length > 200 && (
                          <motion.button
                            onClick={() => setExpanded(isExpanded ? null : note.id)}
                            whileHover={{ scale: 1.02 }}
                            style={{ background: 'none', border: 'none', color: '#b8923c', cursor: 'pointer', fontSize: '0.8rem', padding: '0.125rem 0', marginBottom: '0.75rem' }}
                          >
                            {isExpanded ? 'Show less' : 'Read more'}
                          </motion.button>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {note.tags.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                              {note.tags.map(tag => (
                                <span key={tag} onClick={() => setFilterTag(tag)} style={{ fontSize: '0.7rem', padding: '0.125rem 0.5rem', background: '#b8923c15', color: '#b8923c', borderRadius: 4, cursor: 'pointer', border: '1px solid #b8923c30' }}>
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {note.linked_tree_id && (
                            <a href={`/tree/${note.linked_tree_id}`} style={{ fontSize: '0.75rem', color: '#60a5fa', textDecoration: 'none' }}>→ View Tree</a>
                          )}
                        </div>
                      </GlowCard>
                    </StaggerItem>
                  );
                })}
              </AnimatePresence>
              {filtered.length === 0 && notes.length > 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', color: '#666', padding: '3rem' }}>
                  No entries match your filters.
                </motion.p>
              )}
            </div>
          </StaggerContainer>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', padding: '0.75rem 1.5rem', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', zIndex: 1000, background: toast.type === 'error' ? '#f8717120' : '#b8923c20', border: `1px solid ${toast.type === 'error' ? '#f8717180' : '#b8923c80'}`, color: toast.type === 'error' ? '#f87171' : '#b8923c' }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '0.625rem 0.75rem', background: '#1a1a1c', border: '1px solid #3a3a3c', borderRadius: 6, color: '#fff', fontSize: '0.875rem', boxSizing: 'border-box' };
const tagBtnStyle: React.CSSProperties = { padding: '0.25rem 0.625rem', borderRadius: 4, border: '1px solid', cursor: 'pointer', fontSize: '0.75rem' };
