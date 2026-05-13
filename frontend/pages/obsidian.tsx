import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, ApiError } from '../lib/api';
import { ObsidianNote, GraphData } from '../lib/types';
import ObsidianGraph from '../components/ObsidianGraph';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { FadeIn, StaggerContainer, StaggerItem, GlowCard, FloatingParticles } from '../components/animations';

export default function ObsidianPage() {
  const [notes, setNotes] = useState<ObsidianNote[]>([]);
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [vaultPath, setVaultPath] = useState('/home/marco/obsidian-vault');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', content: '', tags: '' });
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [notesData, graphData] = await Promise.all([api.listNotes(), api.getGraph()]);
      setNotes(notesData);
      setGraph(graphData);
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load vault data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await api.syncVault(vaultPath);
      await fetchData();
      showToast(result.message);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const tags = createForm.tags.split(',').map(t => t.trim()).filter(Boolean);
      const result = await api.createVaultNote({ title: createForm.title, content: createForm.content, tags, vault_path: vaultPath });
      showToast(result.message);
      setCreateForm({ title: '', content: '', tags: '' });
      setShowCreateNote(false);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to create note', 'error');
    } finally {
      setCreating(false);
    }
  };

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags))).sort();
  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchTerm || note.note_title.toLowerCase().includes(searchTerm.toLowerCase()) || note.file_path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || note.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const totalWords = notes.reduce((sum, n) => sum + n.word_count, 0);
  const totalLinks = notes.reduce((sum, n) => sum + n.links.length, 0);
  const totalActivities = notes.reduce((sum, n) => sum + n.extracted_activities.length, 0);

  if (loading && notes.length === 0) return <LoadingSpinner text="Loading vault..." fullScreen />;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c' }}>
      <Navbar />
      <FloatingParticles count={5} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
        <FadeIn>
          <header style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, background: 'linear-gradient(135deg, #b8923c, #f4d77a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
              Obsidian Vault
            </h1>
            <p style={{ color: '#888', marginTop: '0.375rem', fontSize: '0.9375rem' }}>Your knowledge graph, visualized. Every note, link, and achievement mapped.</p>
          </header>
        </FadeIn>

        {/* Vault Controls */}
        <FadeIn delay={0.15}>
          <GlowCard style={{ padding: '1.25rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12, marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vault Path</label>
                <input
                  type="text"
                  value={vaultPath}
                  onChange={e => setVaultPath(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem', background: '#1a1a1c', border: '1px solid #3a3a3c', borderRadius: 6, color: '#fff', fontSize: '0.875rem', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <motion.button
                  onClick={handleSync}
                  disabled={syncing}
                  whileHover={{ scale: 1.05, boxShadow: '0 0 20px #b8923c50' }}
                  whileTap={{ scale: 0.95 }}
                  style={{ padding: '0.625rem 1.25rem', background: '#b8923c', color: '#0a0a0c', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.875rem', opacity: syncing ? 0.6 : 1, cursor: syncing ? 'not-allowed' : 'pointer' }}
                >
                  {syncing ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block' }}>⟳</motion.span>
                      Syncing...
                    </span>
                  ) : 'Sync Vault'}
                </motion.button>
                <motion.button
                  onClick={() => setShowCreateNote(v => !v)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ padding: '0.625rem 1.25rem', background: 'transparent', color: '#b8923c', border: '1px solid #b8923c', borderRadius: 6, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  {showCreateNote ? 'Cancel' : '+ New Note'}
                </motion.button>
              </div>
            </div>
          </GlowCard>
        </FadeIn>

        {/* Create Note Panel */}
        <AnimatePresence>
          {showCreateNote && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
              style={{ overflow: 'hidden', marginBottom: '1.5rem' }}
            >
              <form onSubmit={handleCreateNote} style={{ padding: '1.5rem', background: '#111113', border: '1px solid #b8923c40', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <h3 style={{ margin: 0, color: '#f4d77a', fontSize: '1rem' }}>Create Note in Vault</h3>
                <input
                  required
                  placeholder="Note title *"
                  value={createForm.title}
                  onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                  style={inputStyle}
                />
                <textarea
                  required
                  placeholder="Note content (supports Markdown)..."
                  value={createForm.content}
                  onChange={e => setCreateForm(f => ({ ...f, content: e.target.value }))}
                  rows={8}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.6 }}
                />
                <input
                  placeholder="Tags (comma-separated)"
                  value={createForm.tags}
                  onChange={e => setCreateForm(f => ({ ...f, tags: e.target.value }))}
                  style={inputStyle}
                />
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>
                  Will be saved to: <span style={{ color: '#888' }}>{vaultPath}/{createForm.title.replace(/[^\w\s-]/g, '').trim().replace(/ /g, '-') || 'note-title'}.md</span>
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <motion.button type="submit" disabled={creating} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ padding: '0.625rem 1.5rem', background: '#b8923c', color: '#0a0a0c', border: 'none', borderRadius: 6, fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.6 : 1 }}>
                    {creating ? 'Creating…' : 'Create Note'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#f87171', marginBottom: '1rem', padding: '0.75rem 1rem', background: '#f8717110', borderRadius: 8, border: '1px solid #f8717130' }}>
            {error}
          </motion.p>
        )}

        {/* Stats */}
        {notes.length > 0 && (
          <StaggerContainer stagger={0.08} delay={0.2}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.875rem', marginBottom: '1.75rem' }}>
              {[
                { label: 'Notes', value: notes.length, color: '#b8923c' },
                { label: 'Links', value: totalLinks, color: '#60a5fa' },
                { label: 'Words', value: totalWords.toLocaleString(), color: '#f4d77a' },
                { label: 'Activities', value: totalActivities, color: '#34d399' },
                { label: 'Tags', value: allTags.length, color: '#a78bfa' },
              ].map(s => (
                <StaggerItem key={s.label}>
                  <div style={{ padding: '1rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '0.7rem', color: '#888', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        )}

        {/* Graph */}
        {graph && graph.nodes.length > 0 && (
          <FadeIn delay={0.3}>
            <section style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1.125rem', color: '#fff', margin: 0, fontWeight: 600 }}>Knowledge Graph</h2>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>{graph.nodes.length} nodes · {graph.links.length} connections</span>
              </div>
              <ObsidianGraph data={graph} width={1200} height={480} />
            </section>
          </FadeIn>
        )}

        {/* Search + Tags */}
        {notes.length > 0 && (
          <FadeIn delay={0.4}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, flex: 1, minWidth: 200 }}
              />
            </div>
            {allTags.length > 0 && (
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <motion.button onClick={() => setSelectedTag(null)} whileHover={{ scale: 1.04 }} style={{ ...tagBtnStyle, background: !selectedTag ? '#b8923c20' : 'transparent', borderColor: !selectedTag ? '#b8923c' : '#2a2a2c', color: !selectedTag ? '#b8923c' : '#888' }}>All</motion.button>
                {allTags.slice(0, 14).map(tag => (
                  <motion.button key={tag} onClick={() => setSelectedTag(tag === selectedTag ? null : tag)} whileHover={{ scale: 1.04 }} style={{ ...tagBtnStyle, background: selectedTag === tag ? '#b8923c20' : 'transparent', borderColor: selectedTag === tag ? '#b8923c' : '#2a2a2c', color: selectedTag === tag ? '#b8923c' : '#888' }}>
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
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔮</div>
              <p style={{ fontSize: '1.125rem', color: '#fff', marginBottom: '0.5rem' }}>No vault connection yet</p>
              <p style={{ fontSize: '0.875rem' }}>Enter your Obsidian vault path above and sync to map your knowledge.</p>
            </div>
          </FadeIn>
        ) : (
          <StaggerContainer stagger={0.06}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <AnimatePresence>
                {filteredNotes.map(note => (
                  <motion.div key={note.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ type: 'spring', stiffness: 120, damping: 15 }}>
                    <GlowCard style={{ padding: '1.25rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 600 }}>{note.note_title}</h3>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.75rem', color: '#666' }}>{note.word_count} words</span>
                          <span style={{ fontSize: '0.75rem', color: '#555' }}>{new Date(note.last_sync).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#555' }}>{note.file_path}</p>

                      {note.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                          {note.tags.map(tag => (
                            <motion.span key={tag} whileHover={{ scale: 1.05 }} onClick={() => setSelectedTag(tag)} style={{ fontSize: '0.7rem', padding: '0.125rem 0.5rem', background: '#b8923c15', color: '#b8923c', borderRadius: 4, cursor: 'pointer', border: '1px solid #b8923c30' }}>
                              #{tag}
                            </motion.span>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {note.links.length > 0 && <span style={{ fontSize: '0.75rem', color: '#60a5fa' }}>→ {note.links.length} link{note.links.length !== 1 ? 's' : ''}</span>}
                        {note.extracted_activities.length > 0 && (
                          <span style={{ fontSize: '0.75rem', color: '#34d399' }}>⚡ {note.extracted_activities.length} activit{note.extracted_activities.length !== 1 ? 'ies' : 'y'}</span>
                        )}
                      </div>

                      {note.extracted_activities.length > 0 && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#0a0a0c', borderRadius: 8, border: '1px solid #1e1e20' }}>
                          <p style={{ fontSize: '0.65rem', color: '#666', margin: '0 0 0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Extracted Activities</p>
                          {note.extracted_activities.map((act, i) => (
                            <p key={i} style={{ margin: '0.125rem 0', fontSize: '0.8125rem', color: '#c4c4ca' }}>• {act}</p>
                          ))}
                        </div>
                      )}
                    </GlowCard>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredNotes.length === 0 && notes.length > 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', color: '#666', padding: '3rem' }}>No notes match your filters.</motion.p>
              )}
            </div>
          </StaggerContainer>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', padding: '0.75rem 1.5rem', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', zIndex: 1000, background: toast.type === 'error' ? '#f8717120' : '#b8923c20', border: `1px solid ${toast.type === 'error' ? '#f8717180' : '#b8923c80'}`, color: toast.type === 'error' ? '#f87171' : '#b8923c', whiteSpace: 'nowrap' }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '0.625rem 0.75rem', background: '#1a1a1c', border: '1px solid #3a3a3c', borderRadius: 6, color: '#fff', fontSize: '0.875rem', boxSizing: 'border-box' };
const tagBtnStyle: React.CSSProperties = { padding: '0.3rem 0.625rem', borderRadius: 4, border: '1px solid', cursor: 'pointer', fontSize: '0.75rem' };
