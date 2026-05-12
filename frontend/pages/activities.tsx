import { useEffect, useState } from 'react';

interface Activity {
  id: number;
  skill_id: number | null;
  description: string;
  xp_amount: number;
  source: string;
  source_url: string | null;
  created_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/activities`)
      .then((r) => r.json())
      .then((data) => {
        setActivities(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <a href="/" style={{ color: '#b8923c', fontSize: '0.875rem', textDecoration: 'none' }}>
          ← Back to Dashboard
        </a>
        <h1 style={{ fontSize: '2rem', color: '#fff', margin: '1rem 0 2rem' }}>Activity Log</h1>

        {loading ? (
          <p style={{ color: '#888' }}>Loading...</p>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#666' }}>
            <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No activities yet</p>
            <p>Visit a skill tree and log your first accomplishment.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  padding: '1rem 1.25rem',
                  background: '#111113',
                  border: '1px solid #2a2a2c',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: '#fff', fontSize: '0.9375rem' }}>
                    {activity.description}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.375rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>
                      {new Date(activity.created_at).toLocaleDateString()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>
                      {activity.source}
                    </span>
                    {activity.source_url && (
                      <a
                        href={activity.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.75rem', color: '#b8923c' }}
                      >
                        view proof →
                      </a>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    padding: '0.375rem 0.75rem',
                    background: '#b8923c20',
                    borderRadius: 6,
                    color: '#b8923c',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  +{activity.xp_amount} XP
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
