import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, ApiError } from '../lib/api';
import { Activity } from '../lib/types';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { FadeIn, StaggerContainer, StaggerItem, GlowCard, FloatingParticles, AnimatedNumber } from '../components/animations';

const SOURCE_COLORS: Record<string, string> = {
  manual: '#b8923c',
  obsidian: '#a78bfa',
  web: '#60a5fa',
  import: '#34d399',
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    api.listActivities({ limit: 200 })
      .then(data => { setActivities(data); setError(''); })
      .catch(err => setError(err instanceof ApiError ? err.message : 'Failed to load activities'))
      .finally(() => setLoading(false));
  }, []);

  const sources = Array.from(new Set(activities.map(a => a.source)));

  const filtered = activities
    .filter(a => {
      const matchSearch = !search || a.description.toLowerCase().includes(search.toLowerCase());
      const matchSource = !filterSource || a.source === filterSource;
      return matchSearch && matchSource;
    })
    .sort((a, b) => sortOrder === 'desc'
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    .slice(0, limit);

  // Group by date
  const grouped: Record<string, Activity[]> = {};
  filtered.forEach(act => {
    const d = new Date(act.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    (grouped[d] = grouped[d] || []).push(act);
  });

  const totalXP = activities.reduce((s, a) => s + a.xp_amount, 0);
  const todayXP = activities.filter(a => new Date(a.created_at).toDateString() === new Date().toDateString()).reduce((s, a) => s + a.xp_amount, 0);
  const weekXP = activities.filter(a => Date.now() - new Date(a.created_at).getTime() < 7 * 86400000).reduce((s, a) => s + a.xp_amount, 0);

  // Simple bar chart data — XP per day for last 14 days
  const chartData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dayStr = d.toDateString();
    const xp = activities.filter(a => new Date(a.created_at).toDateString() === dayStr).reduce((s, a) => s + a.xp_amount, 0);
    return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), xp, dayStr };
  });
  const maxBar = Math.max(...chartData.map(d => d.xp), 1);

  if (loading) return <LoadingSpinner text="Loading activities..." fullScreen />;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c' }}>
      <Navbar />
      <FloatingParticles count={5} />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem', position: 'relative', zIndex: 1 }}>
        <FadeIn>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, background: 'linear-gradient(135deg, #b8923c, #f4d77a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.375rem' }}>
            Activity Log
          </h1>
          <p style={{ color: '#888', fontSize: '0.9375rem', marginBottom: '2rem' }}>Every action that forged your skills.</p>
        </FadeIn>

        {/* Stats */}
        <StaggerContainer stagger={0.07} delay={0.1}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.875rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Actions', value: activities.length, color: '#b8923c' },
              { label: 'Total XP', value: totalXP, color: '#f4d77a' },
              { label: 'Today XP', value: todayXP, color: '#34d399' },
              { label: 'This Week XP', value: weekXP, color: '#60a5fa' },
            ].map(s => (
              <StaggerItem key={s.label}>
                <GlowCard glowColor={s.color} style={{ padding: '1.25rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.625rem', fontWeight: 700, color: s.color }}><AnimatedNumber value={s.value} /></div>
                  <div style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{s.label}</div>
                </GlowCard>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>

        {/* XP Bar Chart */}
        {activities.length > 0 && (
          <FadeIn delay={0.25}>
            <div style={{ padding: '1.5rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12, marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '0.875rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 1.25rem', fontWeight: 600 }}>
                XP — Last 14 Days
              </h2>
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'flex-end', height: 90 }}>
                {chartData.map((d, i) => {
                  const h = maxBar > 0 ? Math.max(2, (d.xp / maxBar) * 80) : 2;
                  const isToday = d.dayStr === new Date().toDateString();
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}>
                      <motion.div
                        title={`${d.label}: ${d.xp} XP`}
                        initial={{ height: 0 }}
                        animate={{ height: h }}
                        transition={{ duration: 0.6, delay: i * 0.04, type: 'spring', stiffness: 80 }}
                        style={{
                          width: '100%',
                          background: isToday ? 'linear-gradient(180deg, #f4d77a, #b8923c)' : d.xp > 0 ? '#b8923c60' : '#1e1e20',
                          borderRadius: '3px 3px 0 0',
                          cursor: 'default',
                          boxShadow: isToday ? '0 0 8px #b8923c60' : 'none',
                        }}
                      />
                      {(i === 0 || i === 6 || i === 13) && (
                        <span style={{ fontSize: '0.55rem', color: '#555', whiteSpace: 'nowrap', position: 'absolute', bottom: -16 }}>
                          {d.label.split(' ')[1]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </FadeIn>
        )}

        {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}

        {/* Filters */}
        {activities.length > 0 && (
          <FadeIn delay={0.3}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="Search activities..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, minWidth: 180, padding: '0.5rem 0.75rem', background: '#1a1a1c', border: '1px solid #3a3a3c', borderRadius: 6, color: '#fff', fontSize: '0.875rem' }}
              />
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {['', ...sources].map(src => {
                  const color = src ? SOURCE_COLORS[src] || '#888' : '#b8923c';
                  return (
                    <motion.button key={src || 'all'} onClick={() => setFilterSource(src)} whileHover={{ scale: 1.04 }} style={{
                      padding: '0.3rem 0.75rem', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: '0.8rem',
                      background: filterSource === src ? `${color}20` : 'transparent',
                      borderColor: filterSource === src ? color : '#2a2a2c',
                      color: filterSource === src ? color : '#888',
                      textTransform: 'capitalize',
                    }}>
                      {src || 'All'}
                    </motion.button>
                  );
                })}
              </div>
              <motion.button
                onClick={() => setSortOrder(v => v === 'desc' ? 'asc' : 'desc')}
                whileHover={{ scale: 1.04 }}
                style={{ padding: '0.3rem 0.75rem', borderRadius: 6, border: '1px solid #2a2a2c', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                {sortOrder === 'desc' ? '↓ Newest' : '↑ Oldest'}
              </motion.button>
            </div>
          </FadeIn>
        )}

        {/* Activity List grouped by day */}
        {activities.length === 0 ? (
          <FadeIn delay={0.3}>
            <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#666', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 12 }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
              <p style={{ fontSize: '1.125rem', color: '#fff', marginBottom: '0.5rem' }}>No activities yet</p>
              <p style={{ fontSize: '0.875rem' }}>Visit a skill tree and log your first achievement.</p>
            </div>
          </FadeIn>
        ) : (
          <StaggerContainer stagger={0.04}>
            {Object.entries(grouped).map(([date, acts]) => (
              <div key={date} style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 600 }}>{date}</span>
                  <div style={{ flex: 1, height: 1, background: '#1e1e20' }} />
                  <span style={{ fontSize: '0.75rem', color: '#b8923c', fontWeight: 600 }}>+{acts.reduce((s, a) => s + a.xp_amount, 0)} XP</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <AnimatePresence>
                    {acts.map(act => {
                      const srcColor = SOURCE_COLORS[act.source] || '#888';
                      return (
                        <StaggerItem key={act.id}>
                          <GlowCard glowColor={srcColor} style={{ padding: '0.875rem 1.125rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, color: '#fff', fontSize: '0.9375rem', lineHeight: 1.4 }}>{act.description}</p>
                              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.7rem', padding: '0.125rem 0.5rem', background: `${srcColor}20`, color: srcColor, borderRadius: 4, border: `1px solid ${srcColor}40`, textTransform: 'capitalize' }}>{act.source}</span>
                                <span style={{ fontSize: '0.75rem', color: '#555' }}>
                                  {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                            <motion.span
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              style={{ fontSize: '0.875rem', fontWeight: 700, color: '#b8923c', background: '#b8923c15', padding: '0.375rem 0.75rem', borderRadius: 6, whiteSpace: 'nowrap', border: '1px solid #b8923c30' }}
                            >
                              +{act.xp_amount} XP
                            </motion.span>
                          </GlowCard>
                        </StaggerItem>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}

            {filtered.length === 0 && activities.length > 0 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', color: '#666', padding: '3rem' }}>No activities match your filters.</motion.p>
            )}

            {activities.filter(a => {
              const matchSearch = !search || a.description.toLowerCase().includes(search.toLowerCase());
              const matchSource = !filterSource || a.source === filterSource;
              return matchSearch && matchSource;
            }).length > limit && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <motion.button onClick={() => setLimit(l => l + 50)} whileHover={{ scale: 1.05 }} style={{ padding: '0.625rem 1.5rem', background: 'transparent', color: '#b8923c', border: '1px solid #b8923c', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                  Load More
                </motion.button>
              </div>
            )}
          </StaggerContainer>
        )}
      </div>
    </div>
  );
}
