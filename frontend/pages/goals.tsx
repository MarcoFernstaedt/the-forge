import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, ApiError } from '../lib/api';
import { Goal, SkillTree } from '../lib/types';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { FadeIn, StaggerContainer, StaggerItem, GlowCard, XPBar, FloatingParticles } from '../components/animations';

const CATEGORY_COLORS: Record<string, string> = {
  fitness: '#34d399',
  learning: '#60a5fa',
  career: '#f4d77a',
  finance: '#a78bfa',
  health: '#fb7185',
  personal: '#b8923c',
  other: '#888',
};

const MOOD_ICONS: Record<string, string> = {
  active: '🔥',
  completed: '✅',
  paused: '⏸️',
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [trees, setTrees] = useState<SkillTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    title: '', description: '', category: '', target_value: 100,
    current_value: 0, target_date: '', linked_tree_id: '',
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      const [goalsData, treesData] = await Promise.all([api.listGoals(), api.listTrees()]);
      setGoals(goalsData);
      setTrees(treesData.filter(t => !t.is_template));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to load goals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => setForm({ title: '', description: '', category: '', target_value: 100, current_value: 0, target_date: '', linked_tree_id: '' });

  const openCreate = () => { resetForm(); setEditGoal(null); setShowCreate(true); };
  const openEdit = (g: Goal) => {
    setForm({
      title: g.title, description: g.description || '', category: g.category || '',
      target_value: g.target_value, current_value: g.current_value,
      target_date: g.target_date ? g.target_date.split('T')[0] : '',
      linked_tree_id: g.linked_tree_id ? String(g.linked_tree_id) : '',
    });
    setEditGoal(g);
    setShowCreate(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<Goal> = {
        title: form.title,
        description: form.description || null,
        category: form.category || null,
        target_value: form.target_value,
        current_value: form.current_value,
        target_date: form.target_date ? new Date(form.target_date).toISOString() : null,
        linked_tree_id: form.linked_tree_id ? parseInt(form.linked_tree_id) : null,
      };
      if (editGoal) {
        await api.updateGoal(editGoal.id, payload);
        showToast('Goal updated');
      } else {
        await api.createGoal(payload);
        showToast('Goal created');
      }
      setShowCreate(false);
      loadData();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to save goal', 'error');
    }
  };

  const handleProgress = async (goal: Goal, delta: number) => {
    const newVal = Math.min(goal.target_value, Math.max(0, goal.current_value + delta));
    try {
      await api.updateGoal(goal.id, { current_value: newVal });
      setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, current_value: newVal, status: newVal >= goal.target_value ? 'completed' : g.status } : g));
    } catch {}
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
      showToast('Goal deleted');
    } catch {}
  };

  const handleStatusToggle = async (goal: Goal) => {
    const next = goal.status === 'active' ? 'paused' : 'active';
    try {
      await api.updateGoal(goal.id, { status: next });
      setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, status: next } : g));
    } catch {}
  };

  const filtered = filterStatus === 'all' ? goals : goals.filter(g => g.status === filterStatus);
  const completed = goals.filter(g => g.status === 'completed').length;
  const active = goals.filter(g => g.status === 'active').length;

  if (loading) return <LoadingSpinner text="Loading goals..." fullScreen />;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c' }}>
      <Navbar />
      <FloatingParticles count={5} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
        <FadeIn>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 800, background: 'linear-gradient(135deg, #b8923c, #f4d77a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                Goals
              </h1>
              <p style={{ color: '#888', marginTop: '0.375rem', fontSize: '0.9375rem' }}>Track what matters. Forge your future.</p>
            </div>
            <motion.button
              onClick={openCreate}
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px #b8923c50' }}
              whileTap={{ scale: 0.95 }}
              style={{ padding: '0.625rem 1.25rem', background: '#b8923c', color: '#0a0a0c', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
            >
              + New Goal
            </motion.button>
          </div>
        </FadeIn>

        {/* Summary Cards */}
        <StaggerContainer stagger={0.08} delay={0.1}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total', value: goals.length, color: '#b8923c' },
              { label: 'Active', value: active, color: '#60a5fa' },
              { label: 'Completed', value: completed, color: '#34d399' },
              { label: 'Paused', value: goals.length - active - completed, color: '#888' },
            ].map(s => (
              <StaggerItem key={s.label}>
                <div style={{ padding: '1.25rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.875rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{s.label}</div>
                </div>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>

        {/* Filter tabs */}
        <FadeIn delay={0.2}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {['all', 'active', 'completed', 'paused'].map(s => (
              <motion.button
                key={s}
                onClick={() => setFilterStatus(s)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  padding: '0.375rem 0.875rem',
                  borderRadius: 6,
                  border: '1px solid',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: filterStatus === s ? 600 : 400,
                  background: filterStatus === s ? '#b8923c18' : 'transparent',
                  borderColor: filterStatus === s ? '#b8923c' : '#2a2a2c',
                  color: filterStatus === s ? '#b8923c' : '#888',
                  textTransform: 'capitalize',
                }}
              >
                {s === 'all' ? 'All Goals' : s}
              </motion.button>
            ))}
          </div>
        </FadeIn>

        {/* Create/Edit Form */}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, color: '#f4d77a', fontSize: '1rem' }}>{editGoal ? 'Edit Goal' : 'New Goal'}</h3>
                  <button type="button" onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <input required placeholder="Goal title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />
                  <input placeholder="Category (fitness, learning…)" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle} />
                </div>
                <textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Target</label>
                    <input type="number" min={1} value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: parseInt(e.target.value) || 1 }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Current</label>
                    <input type="number" min={0} value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: parseInt(e.target.value) || 0 }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Target Date</label>
                    <input type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
                {trees.length > 0 && (
                  <select value={form.linked_tree_id} onChange={e => setForm(f => ({ ...f, linked_tree_id: e.target.value }))} style={inputStyle}>
                    <option value="">Link to a skill tree (optional)</option>
                    {trees.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <motion.button type="submit" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ padding: '0.625rem 1.5rem', background: '#b8923c', color: '#0a0a0c', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
                    {editGoal ? 'Save Changes' : 'Create Goal'}
                  </motion.button>
                  <motion.button type="button" onClick={() => setShowCreate(false)} whileHover={{ scale: 1.04 }} style={{ padding: '0.625rem 1rem', background: 'transparent', color: '#666', border: '1px solid #2a2a2c', borderRadius: 6, cursor: 'pointer' }}>
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Goals List */}
        {filtered.length === 0 ? (
          <FadeIn delay={0.3}>
            <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#666', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12 }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
              <p style={{ fontSize: '1.125rem', color: '#fff', marginBottom: '0.5rem' }}>
                {filterStatus === 'all' ? 'No goals yet' : `No ${filterStatus} goals`}
              </p>
              <p style={{ fontSize: '0.875rem' }}>Set a goal to start tracking your progress.</p>
            </div>
          </FadeIn>
        ) : (
          <StaggerContainer stagger={0.07}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <AnimatePresence>
                {filtered.map(goal => {
                  const pct = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
                  const catColor = CATEGORY_COLORS[goal.category?.toLowerCase() || ''] || '#b8923c';
                  const daysLeft = goal.target_date ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / 86400000) : null;
                  return (
                    <StaggerItem key={goal.id}>
                      <GlowCard glowColor={catColor} style={{ padding: '1.5rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '1rem' }}>{MOOD_ICONS[goal.status] || '🎯'}</span>
                              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.0625rem', fontWeight: 600 }}>{goal.title}</h3>
                              {goal.category && (
                                <span style={{ fontSize: '0.7rem', padding: '0.125rem 0.5rem', borderRadius: 4, background: `${catColor}20`, color: catColor, textTransform: 'uppercase', letterSpacing: '0.05em', border: `1px solid ${catColor}40` }}>
                                  {goal.category}
                                </span>
                              )}
                            </div>
                            {goal.description && <p style={{ margin: 0, color: '#888', fontSize: '0.875rem', lineHeight: 1.5 }}>{goal.description}</p>}
                          </div>
                          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                            <motion.button onClick={() => openEdit(goal)} whileHover={{ scale: 1.1 }} style={iconBtnStyle} title="Edit">✏️</motion.button>
                            <motion.button onClick={() => handleStatusToggle(goal)} whileHover={{ scale: 1.1 }} style={iconBtnStyle} title={goal.status === 'active' ? 'Pause' : 'Activate'}>
                              {goal.status === 'active' ? '⏸' : '▶️'}
                            </motion.button>
                            <motion.button onClick={() => handleDelete(goal.id)} whileHover={{ scale: 1.1 }} style={{ ...iconBtnStyle, color: '#f87171' }} title="Delete">🗑</motion.button>
                          </div>
                        </div>

                        {/* Progress */}
                        <div style={{ marginBottom: '0.875rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: '#888' }}>Progress</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: catColor }}>{goal.current_value} / {goal.target_value} ({pct}%)</span>
                          </div>
                          <XPBar current={goal.current_value} max={goal.target_value} color={goal.status === 'completed' ? '#34d399' : catColor} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {goal.status !== 'completed' && (
                              <>
                                <motion.button onClick={() => handleProgress(goal, -1)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={progressBtnStyle}>−1</motion.button>
                                <motion.button onClick={() => handleProgress(goal, 1)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ ...progressBtnStyle, background: `${catColor}20`, borderColor: catColor, color: catColor }}>+1</motion.button>
                                <motion.button onClick={() => handleProgress(goal, 5)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ ...progressBtnStyle, background: `${catColor}20`, borderColor: catColor, color: catColor }}>+5</motion.button>
                                <motion.button onClick={() => handleProgress(goal, 10)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} style={{ ...progressBtnStyle, background: `${catColor}20`, borderColor: catColor, color: catColor }}>+10</motion.button>
                              </>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            {daysLeft !== null && (
                              <span style={{ fontSize: '0.75rem', color: daysLeft < 7 ? '#f87171' : '#666' }}>
                                {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Due today' : `${Math.abs(daysLeft)}d overdue`}
                              </span>
                            )}
                            {goal.linked_tree_id && (
                              <a href={`/tree/${goal.linked_tree_id}`} style={{ fontSize: '0.75rem', color: '#60a5fa', textDecoration: 'none' }}>→ Skill Tree</a>
                            )}
                          </div>
                        </div>
                      </GlowCard>
                    </StaggerItem>
                  );
                })}
              </AnimatePresence>
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
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' };
const iconBtnStyle: React.CSSProperties = { background: 'transparent', border: '1px solid #2a2a2c', borderRadius: 6, padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.875rem' };
const progressBtnStyle: React.CSSProperties = { padding: '0.25rem 0.625rem', background: '#1a1a1c', border: '1px solid #3a3a3c', borderRadius: 6, color: '#888', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 };
