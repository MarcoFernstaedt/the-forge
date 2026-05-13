import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, ApiError } from '../lib/api';
import { SkillTree, Stats } from '../lib/types';
import LoadingSpinner from '../components/LoadingSpinner';
import { FadeIn, StaggerContainer, StaggerItem, GlowCard, PulseGlow, XPBar, AnimatedNumber, FloatingParticles, LevelUpFlash } from '../components/animations';

export default function Dashboard() {
  const [trees, setTrees] = useState<SkillTree[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTreeName, setNewTreeName] = useState('');
  const [newTreeDesc, setNewTreeDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(0);

  const loadData = async () => {
    try {
      const [treesData, statsData] = await Promise.all([api.listTrees(), api.getStats()]);
      if (stats && statsData.current_level > stats.current_level) {
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
      }
      setPrevLevel(stats?.current_level || 0);
      setTrees(treesData);
      setStats(statsData);
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTreeName.trim()) return;
    setCreating(true);
    try {
      const tree = await api.createTree({ name: newTreeName, description: newTreeDesc || null });
      setNewTreeName('');
      setNewTreeDesc('');
      setShowCreate(false);
      window.location.href = `/tree/${tree.id}`;
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to create tree');
    } finally {
      setCreating(false);
    }
  };

  const handleClone = async (treeId: number) => {
    try {
      const result = await api.cloneTree(treeId);
      await api.initProgress(result.tree_id);
      window.location.href = `/tree/${result.tree_id}`;
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to clone tree');
    }
  };

  if (loading) return <LoadingSpinner text="Loading The Forge..." fullScreen />;
  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', padding: '2rem' }}>
        <motion.div style={{ textAlign: 'center' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p style={{ color: '#f87171' }}>{error}</p>
          <motion.button
            onClick={() => window.location.reload()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#b8923c', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
          >
            Retry
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const myTrees = trees.filter(t => !t.is_template);
  const templates = trees.filter(t => t.is_template);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', padding: '2rem 1rem', position: 'relative' }}>
      <FloatingParticles count={8} />
      <LevelUpFlash show={showLevelUp} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <FadeIn>
          <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
            <motion.h1
              style={{ fontSize: '3.5rem', margin: 0, background: 'linear-gradient(135deg, #b8923c, #f4d77a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, type: 'spring', stiffness: 100 }}
            >
              The Forge
            </motion.h1>
            <motion.p
              style={{ color: '#c4c4ca', marginTop: '0.5rem', fontSize: '1.125rem' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Where skills are hammered into existence. Your goals. Your trees. Your empire.
            </motion.p>
          </header>
        </FadeIn>

        {stats && (
          <>
            <StaggerContainer stagger={0.15} delay={0.2}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StaggerItem>
                  <GlowCard style={{ padding: '1.5rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ color: '#888', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Level</span>
                      <span style={{ color: '#f4d77a', fontSize: '1.5rem', fontWeight: 700 }}><AnimatedNumber value={stats.current_level} /></span>
                    </div>
                    <XPBar current={stats.total_xp} max={stats.total_xp + stats.next_level_xp} />
                    <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                      <AnimatedNumber value={stats.total_xp} /> XP / Next: <AnimatedNumber value={stats.total_xp + stats.next_level_xp} /> XP
                    </p>
                  </GlowCard>
                </StaggerItem>

                <StaggerItem>
                  <GlowCard style={{ padding: '1.5rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#888', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Streak</span>
                      <motion.span
                        style={{ color: '#f4d77a', fontSize: '1.5rem', fontWeight: 700 }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {stats.streak_days}d
                      </motion.span>
                    </div>
                    <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                      Longest: {stats.longest_streak} days
                    </p>
                  </GlowCard>
                </StaggerItem>
              </div>
            </StaggerContainer>

            <StaggerContainer stagger={0.1} delay={0.4}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
                <StaggerItem><StatCard label="Total XP" value={stats.total_xp} color="#b8923c" /></StaggerItem>
                <StaggerItem><StatCard label="Skills Unlocked" value={stats.skills_unlocked} color="#60a5fa" /></StaggerItem>
                <StaggerItem><StatCard label="Skills Mastered" value={stats.skills_mastered} color="#f4d77a" /></StaggerItem>
                <StaggerItem><StatCard label="Activities" value={stats.total_activities} color="#34d399" /></StaggerItem>
              </div>
            </StaggerContainer>
          </>
        )}

        <FadeIn delay={0.5}>
          <section style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>Your Skill Trees</h2>
              <motion.button
                onClick={() => setShowCreate(!showCreate)}
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px #b8923c50' }}
                whileTap={{ scale: 0.95 }}
                style={{ padding: '0.625rem 1.25rem', background: '#b8923c', color: '#0a0a0c', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
              >
                {showCreate ? 'Cancel' : '+ New Tree'}
              </motion.button>
            </div>

            <AnimatePresence>
              {showCreate && (
                <motion.form
                  onSubmit={handleCreateTree}
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                  style={{ overflow: 'hidden', padding: '1.25rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12, marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                >
                  <input
                    type="text"
                    placeholder="Tree name (e.g., Fitness, Language Learning, Career)"
                    value={newTreeName}
                    onChange={(e) => setNewTreeName(e.target.value)}
                    required
                    style={{ padding: '0.625rem', background: '#1a1a1c', border: '1px solid #3a3a3c', borderRadius: 6, color: '#fff', fontSize: '0.9375rem' }}
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newTreeDesc}
                    onChange={(e) => setNewTreeDesc(e.target.value)}
                    style={{ padding: '0.625rem', background: '#1a1a1c', border: '1px solid #3a3a3c', borderRadius: 6, color: '#fff', fontSize: '0.9375rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <motion.button
                      type="submit"
                      disabled={creating}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ padding: '0.625rem 1.25rem', background: '#b8923c', color: '#0a0a0c', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: '0.875rem', cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.6 : 1 }}
                    >
                      {creating ? 'Creating...' : 'Create Tree'}
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {myTrees.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ padding: '2rem', textAlign: 'center', color: '#666', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12 }}
              >
                <p style={{ marginBottom: '0.5rem' }}>No trees yet.</p>
                <p style={{ fontSize: '0.875rem' }}>Create your first tree or clone a template below.</p>
              </motion.div>
            ) : (
              <StaggerContainer stagger={0.1}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {myTrees.map((tree, i) => (
                    <StaggerItem key={tree.id}>
                      <a
                        href={`/tree/${tree.id}`}
                        style={{ display: 'block', textDecoration: 'none' }}
                      >
                        <GlowCard style={{ padding: '1.5rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.125rem' }}>{tree.name}</h3>
                          </div>
                          <p style={{ color: '#888', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>
                            {tree.description || 'No description'}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                            {tree.category && (
                              <span style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {tree.category}
                              </span>
                            )}
                            <span style={{ fontSize: '0.75rem', color: '#666' }}>{tree.skill_count} skills</span>
                          </div>
                        </GlowCard>
                      </a>
                    </StaggerItem>
                  ))}
                </div>
              </StaggerContainer>
            )}
          </section>
        </FadeIn>

        {templates.length > 0 && (
          <FadeIn delay={0.6}>
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '1.5rem' }}>Templates</h2>
              <StaggerContainer stagger={0.1}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {templates.map((tree) => (
                    <StaggerItem key={tree.id}>
                      <GlowCard style={{ padding: '1.5rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <h3 style={{ margin: 0, color: '#fff', fontSize: '1.125rem' }}>{tree.name}</h3>
                          <span style={{ fontSize: '0.75rem', color: '#b8923c', background: '#b8923c20', padding: '0.25rem 0.5rem', borderRadius: 4 }}>template</span>
                        </div>
                        <p style={{ color: '#888', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>
                          {tree.description || 'No description'}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#666' }}>{tree.skill_count} skills</span>
                          <motion.button
                            onClick={() => handleClone(tree.id)}
                            whileHover={{ scale: 1.05, boxShadow: '0 0 15px #b8923c40' }}
                            whileTap={{ scale: 0.95 }}
                            style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#b8923c', border: '1px solid #b8923c', borderRadius: 6, fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}
                          >
                            Clone & Use
                          </motion.button>
                        </div>
                      </GlowCard>
                    </StaggerItem>
                  ))}
                </div>
              </StaggerContainer>
            </section>
          </FadeIn>
        )}

        <FadeIn delay={0.7}>
          <section style={{ marginTop: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '1rem' }}>Quick Actions</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <motion.a
                href="/activities"
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px #b8923c50' }}
                whileTap={{ scale: 0.95 }}
                style={{ padding: '0.875rem 1.5rem', background: '#b8923c', color: '#0a0a0c', borderRadius: 8, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}
              >
                View Activity Log
              </motion.a>
              <motion.a
                href="/obsidian"
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px #b8923c40' }}
                whileTap={{ scale: 0.95 }}
                style={{ padding: '0.875rem 1.5rem', background: 'transparent', color: '#b8923c', border: '1px solid #b8923c', borderRadius: 8, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}
              >
                Obsidian Vault
              </motion.a>
              <motion.a
                href="/login"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ padding: '0.875rem 1.5rem', background: 'transparent', color: '#888', border: '1px solid #3a3a3c', borderRadius: 8, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}
              >
                Account
              </motion.a>
            </div>
          </section>
        </FadeIn>

        <footer style={{ marginTop: '4rem', textAlign: 'center', color: '#555', fontSize: '0.875rem', paddingBottom: '2rem' }}>
          The Forge — built by Imperator
        </footer>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <GlowCard style={{ padding: '1.5rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12, textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', fontWeight: 700, color, marginBottom: '0.25rem' }}>
        <AnimatedNumber value={value} />
      </div>
      <div style={{ fontSize: '0.875rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </GlowCard>
  );
}
