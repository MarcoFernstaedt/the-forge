import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, ApiError } from '../lib/api';
import { ObsidianNote, GraphData } from '../lib/types';
import ObsidianGraph from '../components/ObsidianGraph';
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

  useEffect(() => {
    fetchData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await api.syncVault(vaultPath);
      await fetchData();
      // Toast notification instead of alert
      showToast(result.message);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Compute all unique tags
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags))).sort();

  // Filtered notes
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      !searchTerm ||
      note.note_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.file_path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || note.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  // Stats
  const totalWords = notes.reduce((sum, n) => sum + n.word_count, 0);
  const totalLinks = notes.reduce((sum, n) => sum + n.links.length, 0);
  const totalActivities = notes.reduce((sum, n) => sum + n.extracted_activities.length, 0);

  if (loading && notes.length === 0) return <LoadingSpinner text="Loading vault..." fullScreen />;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', padding: '2rem 1rem', position: 'relative' }}>
      <FloatingParticles count={6} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <FadeIn>
          <header style={{ marginBottom: '2.5rem' }}>
            <motion.a
              href="/"
              whileHover={{ x: -4 }}
              style={{ color: '#b8923c', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span>←</span> Back to Dashboard
            </motion.a>
            <motion.h1
              style={{ fontSize: '2.5rem', color: '#fff', margin: '1rem 0 0.5rem', background: 'linear-gradient(135deg, #b8923c, #f4d77a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: 'spring' }}
            >
              Obsidian Vault
            </motion.h1>
            <p style={{ color: '#888', fontSize: '1rem', maxWidth: 600 }}>
              Your knowledge graph, visualized. Every note, link, and extracted achievement mapped in real time.
            </p>
          </header>
        </FadeIn>

        {/* Vault Path + Sync */}
        <FadeIn delay={0.2}>
          <GlowCard style={{ padding: '1.25rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12, marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Vault Path
                </label>
                <input
                  type="text"
                  value={vaultPath}
                  onChange={(e) => setVaultPath(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem', background: '#1a1a1c', border: '1px solid #3a3a3c', borderRadius: 6, color: '#fff', fontSize: '0.875rem' }}
                />
              </div>
              <motion.button
                onClick={handleSync}
                disabled={syncing}
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px #b8923c50' }}
                whileTap={{ scale: 0.95 }}
                style={{ padding: '0.625rem 1.5rem', background: '#b8923c', color: '#0a0a0c', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.875rem', opacity: syncing ? 0.6 : 1, cursor: syncing ? 'not-allowed' : 'pointer', marginTop: '0.75rem' }}
              >
                {syncing ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block' }}>
                      ⟳
                    </motion.span>
                    Syncing...
                  </span>
                ) : (
                  'Sync Vault'
                )}
              </motion.button>
            </div>
          </GlowCard>
        </FadeIn>

        {error && (
          <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#f87171', marginBottom: '1rem', padding: '0.75rem 1rem', background: '#f8717110', borderRadius: 8, border: '1px solid #f8717130' }}>
            {error}
          </motion.p>
        )}

        {/* Stats */}
        {notes.length > 0 && (
          <StaggerContainer stagger={0.1} delay={0.3}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <StaggerItem>
                <div style={{ padding: '1.25rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#b8923c' }}>{notes.length}</div>
                  <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</div>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div style={{ padding: '1.25rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#60a5fa' }}>{totalLinks}</div>
                  <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Links</div>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div style={{ padding: '1.25rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f4d77a' }}>{totalWords.toLocaleString()}</div>
                  <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Words</div>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div style={{ padding: '1.25rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#34d399' }}>{totalActivities}</div>
                  <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activities</div>
                </div>
              </StaggerItem>
            </div>
          </StaggerContainer>
        )}

        {/* Graph Visualization */}
        {graph && graph.nodes.length > 0 && (
          <FadeIn delay={0.4}>
            <section style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>Vault Graph</h2>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>{graph.nodes.length} nodes · {graph.links.length} connections</span>
              </div>
              <ObsidianGraph data={graph} width={1200} height={500} />
            </section>
          </FadeIn>
        )}

        {/* Search + Tag Filters */}
        {notes.length > 0 && (
          <FadeIn delay={0.5}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem 0.875rem', background: '#1a1a1c', border: '1px solid #3a3a3c', borderRadius: 6, color: '#fff', fontSize: '0.875rem' }}
                />
              </div>
              {allTags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  <motion.button
                    onClick={() => setSelectedTag(null)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '0.375rem 0.625rem',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      border: '1px solid',
                      cursor: 'pointer',
                      background: selectedTag === null ? '#b8923c20' : 'transparent',
                      borderColor: selectedTag === null ? '#b8923c' : '#3a3a3c',
                      color: selectedTag === null ? '#b8923c' : '#888',
                    }}
                  >
                    All
                  </motion.button>
                  {allTags.slice(0, 12).map((tag) => (
                    <motion.button
                      key={tag}
                      onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        padding: '0.375rem 0.625rem',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        border: '1px solid',
                        cursor: 'pointer',
                        background: selectedTag === tag ? '#b8923c20' : 'transparent',
                        borderColor: selectedTag === tag ? '#b8923c' : '#3a3a3c',
                        color: selectedTag === tag ? '#b8923c' : '#888',
                      }}
                    >
                      #{tag}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </FadeIn>
        )}

        {/* Notes List */}
        {notes.length === 0 ? (
          <FadeIn delay={0.3}>
            <motion.div
              style={{ textAlign: 'center', padding: '5rem 2rem', color: '#666', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12 }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📓</div>
              <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#fff' }}>No vault connection yet</p>
              <p style={{ fontSize: '0.875rem' }}>Enter your Obsidian vault path above and sync to begin mapping your knowledge.</p>
            </motion.div>
          </FadeIn>
        ) : (
          <StaggerContainer stagger={0.08}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <AnimatePresence>
                {filteredNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                  >
                    <GlowCard style={{ padding: '1.25rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 600 }}>{note.note_title}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#666' }}>{note.word_count} words</span>
                          <span style={{ fontSize: '0.75rem', color: '#666' }}>{new Date(note.last_sync).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: '#666' }}>{note.file_path}</p>

                      {note.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                          {note.tags.map((tag) => (
                            <motion.span
                              key={tag}
                              whileHover={{ scale: 1.05 }}
                              onClick={() => setSelectedTag(tag)}
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#b8923c15', color: '#b8923c', borderRadius: 4, cursor: 'pointer', border: '1px solid #b8923c30' }}
                            >
                              #{tag}
                            </motion.span>
                          ))}
                        </div>
                      )}

                      {note.links.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#60a5fa' }}>→ {note.links.length} link{note.links.length > 1 ? 's' : ''}</span>
                        </div>
                      )}

                      {note.extracted_activities.length > 0 && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#0a0a0c', borderRadius: 8, border: '1px solid #2a2a2c' }}>
                          <p style={{ fontSize: '0.7rem', color: '#666', margin: '0 0 0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Extracted Activities</p>
                          {note.extracted_activities.map((act, i) => (
                            <motion.p
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              style={{ margin: '0.125rem 0', fontSize: '0.8125rem', color: '#c4c4ca' }}
                            >
                              • {act}
                            </motion.p>
                          ))}
                        </div>
                      )}
                    </GlowCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {filteredNotes.length === 0 && notes.length > 0 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', color: '#666', padding: '3rem 1rem' }}>
                No notes match your filters.
              </motion.p>
            )}
          </StaggerContainer>
        )}

        <footer style={{ marginTop: '4rem', textAlign: 'center', color: '#555', fontSize: '0.875rem', paddingBottom: '2rem' }}>
          The Forge — built by Imperator
        </footer>
      </div>

      {/* Toast */}
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
