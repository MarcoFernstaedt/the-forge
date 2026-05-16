import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, ApiError } from '../lib/api';
import { SkillTree, Stats, Activity, Goal } from '../lib/types';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { FadeIn, StaggerContainer, StaggerItem, GlowCard, PulseGlow, XPBar, AnimatedNumber, FloatingParticles, LevelUpFlash } from '../components/animations';
import { useSoundContext } from '../context/SoundContext';

export default function Dashboard() {
  const [trees, setTrees] = useState<SkillTree[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTreeName, setNewTreeName] = useState('');
  const [newTreeDesc, setNewTreeDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const { playLevelUp, playNavClick } = useSoundContext();

  const loadData = async () => {
    try {
      const [treesData, statsData, activitiesData, goalsData] = await Promise.all([
        api.listTrees(), api.getStats(), api.listActivities({ limit: 30 }), api.listGoals(),
      ]);
      if (stats && statsData.current_level > stats.current_level) {
        setShowLevelUp(true);
        playLevelUp();
        setTimeout(() => setShowLevelUp(false), 3000);
      }
      setTrees(treesData);
      setStats(statsData);
      setRecentActivities(activitiesData);
      setGoals(goalsData);
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreateTree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTreeName.trim()) return;
    setCreating(true);
    try {
      const tree = await api.createTree({ name: newTreeName, description: newTreeDesc || null });
      setNewTreeName(''); setNewTreeDesc(''); setShowCreate(false);
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c' }}>
        <motion.div style={{ textAlign: 'center' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p style={{ color: '#f87171' }}>{error}</p>
          <motion.button onClick={() => window.location.reload()} whileHover={{ scale: 1.05 }} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#b8923c', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
            Retry
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const myTrees = trees.filter(t => !t.is_template);
  const templates = trees.filter(t => t.is_template);
  const activeGoals = goals.filter(g => g.status === 'active').slice(0, 4);

  // XP bar chart — last 14 days
  const chartData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dayStr = d.toDateString();
    const xp = recentActivities.filter(a => new Date(a.created_at).toDateString() === dayStr).reduce((s, a) => s + a.xp_amount, 0);
    return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), xp, isToday: d.toDateString() === new Date().toDateString() };
  });
  const maxBar = Math.max(...chartData.map(d => d.xp), 1);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c' }}>
      <Navbar />
      <LevelUpFlash show={showLevelUp} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
        <FadeIn>
          <header style={{ marginBottom: '2.5rem' }}>
            <motion.h1
              style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', margin: 0, background: 'linear-gradient(135deg, #b8923c, #f4d77a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900, fontFamily: 'Orbitron, sans-serif', letterSpacing: '-0.01em' }}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, type: 'spring', stiffness: 100 }}
            >
              THE FORGE
            </motion.h1>
            <motion.p
              style={{ color: '#c4c4ca', marginTop: '0.4rem', fontSize: '1.0625rem' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {stats?.user.display_name ? `Welcome back, ${stats.user.display_name}.` : 'Where skills are hammered into existence.'}
            </motion.p>
          </header>
        </FadeIn>

        {stats && (
          <>
            {/* Level + Streak */}
            <div data-tour="stats-section">
            <StaggerContainer stagger={0.12} delay={0.15}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <StaggerItem>
                  <GlowCard style={{ padding: '1.5rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                      <div>
                        <span style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Level</span>
                        <div style={{ color: '#f4d77a', fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>
                          <AnimatedNumber value={stats.current_level} />
                        </div>
                      </div>
                      <PulseGlow color="#b8923c">
                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #b8923c, #f4d77a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>⚔️</div>
                      </PulseGlow>
                    </div>
                    <XPBar current={stats.level_progress * 100} max={100} />
                    <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                      <AnimatedNumber value={stats.total_xp} /> XP total · <AnimatedNumber value={stats.next_level_xp} /> XP to next
                    </p>
                  </GlowCard>
                </StaggerItem>

                <StaggerItem>
                  <GlowCard style={{ padding: '1.5rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Daily Streak</span>
                      <motion.span
                        style={{ color: '#f4d77a', fontSize: '2rem', fontWeight: 800 }}
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {stats.streak_days}🔥
                      </motion.span>
                    </div>
                    <p style={{ color: '#666', fontSize: '0.8125rem', marginBottom: '1rem' }}>Longest: {stats.longest_streak} days</p>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {Array.from({ length: 14 }, (_, i) => {
                        const active = i >= 14 - stats.streak_days;
                        return <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: active ? '#b8923c' : '#1e1e20' }} />;
                      })}
                    </div>
                    <p style={{ color: '#555', fontSize: '0.7rem', marginTop: '0.375rem' }}>Last 14 days</p>
                  </GlowCard>
                </StaggerItem>
              </div>
            </StaggerContainer>
            </div>

            {/* Stat Cards */}
            <StaggerContainer stagger={0.08} delay={0.3}>
              <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.875rem', marginBottom: '2rem' }}>
                <StaggerItem><StatCard label="Total XP" value={stats.total_xp} color="#b8923c" /></StaggerItem>
                <StaggerItem><StatCard label="Unlocked" value={stats.skills_unlocked} color="#60a5fa" /></StaggerItem>
                <StaggerItem><StatCard label="Mastered" value={stats.skills_mastered} color="#f4d77a" /></StaggerItem>
                <StaggerItem><StatCard label="Activities" value={stats.total_activities} color="#34d399" /></StaggerItem>
                <StaggerItem><StatCard label="Trees" value={stats.trees_created} color="#a78bfa" /></StaggerItem>
              </div>
            </StaggerContainer>

            {/* XP Chart */}
            {recentActivities.length > 0 && (
              <FadeIn delay={0.4}>
                <div style={{ padding: '1.5rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12, marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '0.875rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0, fontWeight: 600 }}>XP — Last 14 Days</h2>
                    <a href="/activities" style={{ fontSize: '0.75rem', color: '#b8923c', textDecoration: 'none' }}>View all →</a>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'flex-end', height: 80 }}>
                    {chartData.map((d, i) => {
                      const h = Math.max(2, (d.xp / maxBar) * 70);
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}>
                          <motion.div
                            title={`${d.label}: ${d.xp} XP`}
                            initial={{ height: 0 }}
                            animate={{ height: h }}
                            transition={{ duration: 0.5, delay: i * 0.04, type: 'spring', stiffness: 90 }}
                            style={{ width: '100%', background: d.isToday ? 'linear-gradient(180deg, #f4d77a, #b8923c)' : d.xp > 0 ? '#b8923c55' : '#1e1e20', borderRadius: '3px 3px 0 0', boxShadow: d.isToday ? '0 0 10px #b8923c60' : 'none' }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </FadeIn>
            )}
          </>
        )}

        {/* Active Goals widget */}
        {activeGoals.length > 0 && (
          <FadeIn delay={0.45}>
            <section style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0, fontWeight: 700 }}>Active Goals</h2>
                <a href="/goals" style={{ fontSize: '0.8125rem', color: '#b8923c', textDecoration: 'none' }}>All goals →</a>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.875rem' }}>
                {activeGoals.map(goal => {
                  const pct = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
                  return (
                    <a key={goal.id} href="/goals" style={{ textDecoration: 'none' }}>
                      <GlowCard style={{ padding: '1.125rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                          <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>{goal.title}</span>
                          <span style={{ color: '#b8923c', fontSize: '0.8125rem', fontWeight: 700 }}>{pct}%</span>
                        </div>
                        <XPBar current={goal.current_value} max={goal.target_value} />
                        <p style={{ margin: '0.375rem 0 0', fontSize: '0.7rem', color: '#555' }}>{goal.current_value}/{goal.target_value}</p>
                      </GlowCard>
                    </a>
                  );
                })}
              </div>
            </section>
          </FadeIn>
        )}

        {/* My Trees */}
        <FadeIn delay={0.5}>
          <section data-tour="trees-section" style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0, fontWeight: 700 }}>Skill Trees</h2>
              <motion.button
                onClick={() => setShowCreate(!showCreate)}
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px #b8923c50' }}
                whileTap={{ scale: 0.95 }}
                style={{ padding: '0.5rem 1.125rem', background: showCreate ? 'transparent' : '#b8923c', color: showCreate ? '#888' : '#0a0a0c', border: showCreate ? '1px solid #2a2a2c' : 'none', borderRadius: 6, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
              >
                {showCreate ? 'Cancel' : '+ New Tree'}
              </motion.button>
            </div>

            <AnimatePresence>
              {showCreate && (
                <motion.form
                  onSubmit={handleCreateTree}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                  style={{ overflow: 'hidden', padding: '1.25rem', background: '#111113', border: '1px solid #b8923c40', borderRadius: 12, marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                >
                  <input type="text" placeholder="Tree name *" value={newTreeName} onChange={e => setNewTreeName(e.target.value)} required style={inputStyle} />
                  <input type="text" placeholder="Description (optional)" value={newTreeDesc} onChange={e => setNewTreeDesc(e.target.value)} style={inputStyle} />
                  <motion.button type="submit" disabled={creating} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ alignSelf: 'flex-start', padding: '0.5rem 1.25rem', background: '#b8923c', color: '#0a0a0c', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: '0.875rem', cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.6 : 1 }}>
                    {creating ? 'Creating...' : 'Create Tree'}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            {myTrees.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#666', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12 }}>
                <p style={{ marginBottom: '0.375rem', fontSize: '1rem', color: '#fff' }}>No trees yet.</p>
                <p style={{ fontSize: '0.875rem' }}>Create your first skill tree or clone a template below.</p>
              </div>
            ) : (
              <StaggerContainer stagger={0.08}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {myTrees.map(tree => (
                    <StaggerItem key={tree.id}>
                      <a href={`/tree/${tree.id}`} onClick={playNavClick} style={{ display: 'block', textDecoration: 'none' }}>
                        <GlowCard style={{ padding: '1.5rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12, height: '100%' }}>
                          <h3 style={{ margin: '0 0 0.5rem', color: '#fff', fontSize: '1.0625rem', fontWeight: 600 }}>{tree.name}</h3>
                          <p style={{ color: '#888', fontSize: '0.875rem', lineHeight: 1.5, margin: '0 0 0.875rem' }}>{tree.description || 'No description'}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {tree.category && <span style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tree.category}</span>}
                            <span style={{ fontSize: '0.75rem', color: '#555' }}>{tree.skill_count} skills</span>
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

        {/* Templates */}
        {templates.length > 0 && (
          <FadeIn delay={0.55}>
            <section style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1.25rem', fontWeight: 700 }}>Templates</h2>
              <StaggerContainer stagger={0.08}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {templates.map(tree => (
                    <StaggerItem key={tree.id}>
                      <GlowCard style={{ padding: '1.5rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <h3 style={{ margin: 0, color: '#fff', fontSize: '1.0625rem', fontWeight: 600 }}>{tree.name}</h3>
                          <span style={{ fontSize: '0.7rem', color: '#b8923c', background: '#b8923c20', padding: '0.2rem 0.5rem', borderRadius: 4, border: '1px solid #b8923c30' }}>template</span>
                        </div>
                        <p style={{ color: '#888', fontSize: '0.875rem', lineHeight: 1.5, margin: '0 0 1rem' }}>{tree.description || 'No description'}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#555' }}>{tree.skill_count} skills</span>
                          <motion.button onClick={() => handleClone(tree.id)} whileHover={{ scale: 1.05, boxShadow: '0 0 15px #b8923c40' }} whileTap={{ scale: 0.95 }} style={{ padding: '0.4rem 0.875rem', background: 'transparent', color: '#b8923c', border: '1px solid #b8923c', borderRadius: 6, fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer' }}>
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

        {/* Quick Actions */}
        <FadeIn delay={0.6}>
          <section data-tour="quick-actions" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1rem', fontWeight: 700 }}>Quick Actions</h2>
            <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
              {[
                { href: '/goals', label: '🎯 Goals', primary: true },
                { href: '/notes', label: '📓 Journal', primary: false },
                { href: '/activities', label: '⚡ Activities', primary: false },
                { href: '/obsidian', label: '🔮 Vault', primary: false },
              ].map(link => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  whileHover={{ scale: 1.05, boxShadow: '0 0 20px #b8923c40' }}
                  whileTap={{ scale: 0.95 }}
                  style={{ padding: '0.75rem 1.375rem', background: link.primary ? '#b8923c' : 'transparent', color: link.primary ? '#0a0a0c' : '#b8923c', border: link.primary ? 'none' : '1px solid #b8923c', borderRadius: 8, fontWeight: 600, textDecoration: 'none', display: 'inline-block', fontSize: '0.9rem' }}
                >
                  {link.label}
                </motion.a>
              ))}
            </div>
          </section>
        </FadeIn>

        <footer style={{ marginTop: '2rem', textAlign: 'center', color: '#333', fontSize: '0.8rem', paddingBottom: '2rem' }}>
          The Forge — built by Imperator
        </footer>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <GlowCard glowColor={color} style={{ padding: '1.25rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12, textAlign: 'center' }}>
      <div style={{ fontSize: '1.875rem', fontWeight: 700, color, marginBottom: '0.25rem' }}>
        <AnimatedNumber value={value} />
      </div>
      <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </GlowCard>
  );
}

const inputStyle: React.CSSProperties = { padding: '0.625rem', background: '#1a1a1c', border: '1px solid #3a3a3c', borderRadius: 6, color: '#fff', fontSize: '0.9375rem', width: '100%', boxSizing: 'border-box' };
