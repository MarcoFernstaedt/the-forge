import { useEffect, useState } from 'react';

interface Tree {
  id: number;
  name: string;
  description: string;
  category: string;
  is_template: boolean;
}

interface Stats {
  user: { id: number; username: string; display_name: string | null };
  trees_created: number;
  total_activities: number;
  total_xp: number;
  skills_unlocked: number;
  skills_mastered: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

export default function Dashboard() {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/trees`).then((r) => r.json()),
      fetch(`${API_BASE}/stats`).then((r) => r.json()),
    ])
      .then(([treesData, statsData]) => {
        setTrees(treesData);
        setStats(statsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c' }}>
        <p style={{ color: '#b8923c', fontSize: '1.25rem' }}>Loading The Forge...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', margin: 0, background: 'linear-gradient(135deg, #b8923c, #f4d77a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            The Forge
          </h1>
          <p style={{ color: '#c4c4ca', marginTop: '0.5rem', fontSize: '1.125rem' }}>
            Where skills are hammered into existence
          </p>
        </header>

        {/* Stats Grid */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
            <StatCard label="Total XP" value={stats.total_xp.toLocaleString()} color="#b8923c" />
            <StatCard label="Skills Unlocked" value={stats.skills_unlocked} color="#60a5fa" />
            <StatCard label="Skills Mastered" value={stats.skills_mastered} color="#f4d77a" />
            <StatCard label="Activities Logged" value={stats.total_activities} color="#34d399" />
          </div>
        )}

        {/* Trees Section */}
        <section>
          <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '1.5rem' }}>Your Skill Trees</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {trees.map((tree) => (
              <a
                key={tree.id}
                href={`/tree/${tree.id}`}
                style={{
                  display: 'block',
                  padding: '1.5rem',
                  background: '#111113',
                  border: '1px solid #2a2a2c',
                  borderRadius: 12,
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#b8923c';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2a2a2c';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.125rem' }}>{tree.name}</h3>
                  {tree.is_template && (
                    <span style={{ fontSize: '0.75rem', color: '#b8923c', background: '#b8923c20', padding: '0.25rem 0.5rem', borderRadius: 4 }}>
                      template
                    </span>
                  )}
                </div>
                <p style={{ color: '#888', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>
                  {tree.description || 'No description'}
                </p>
                {tree.category && (
                  <span style={{ display: 'inline-block', marginTop: '0.75rem', fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {tree.category}
                  </span>
                )}
              </a>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section style={{ marginTop: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '1rem' }}>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a
              href="/activities"
              style={{
                padding: '0.875rem 1.5rem',
                background: '#b8923c',
                color: '#0a0a0c',
                borderRadius: 8,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              View Activity Log
            </a>
            <a
              href="/obsidian"
              style={{
                padding: '0.875rem 1.5rem',
                background: 'transparent',
                color: '#b8923c',
                border: '1px solid #b8923c',
                borderRadius: 8,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Obsidian Vault
            </a>
          </div>
        </section>

        <footer style={{ marginTop: '4rem', textAlign: 'center', color: '#555', fontSize: '0.875rem', paddingBottom: '2rem' }}>
          The Forge — built by Imperator
        </footer>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div
      style={{
        padding: '1.5rem',
        background: '#111113',
        border: '1px solid #2a2a2c',
        borderRadius: 12,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '2rem', fontWeight: 700, color, marginBottom: '0.25rem' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.875rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
    </div>
  );
}
