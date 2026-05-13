import { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { Activity } from '../lib/types';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listActivities({ limit: 100 })
      .then((data) => {
        setActivities(data);
        setError('');
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load activities'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading activities..." fullScreen />;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <a href="/" style={{ color: '#b8923c', fontSize: '0.875rem', textDecoration: 'none' }}>← Back to Dashboard</a>
        <h1 style={{ fontSize: '2rem', color: '#fff', margin: '1rem 0 0.5rem' }}>Activity Log</h1>
        <p style={{ color: '#888', marginBottom: '2rem' }}>Every action that forged your skills.</p>

        {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}

        {activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#666' }}>
            <p style={{ fontSize: '1.25rem' }}>No activities yet</p>
            <p>Visit a skill tree and log your first achievement.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activities.map((act) => (
              <div key={act.id} style={{ padding: '1rem 1.25rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <p style={{ margin: 0, color: '#fff', fontSize: '0.9375rem' }}>{act.description}</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#666' }}>
                    {act.source} • {new Date(act.created_at).toLocaleDateString()} {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#b8923c', background: '#b8923c15', padding: '0.375rem 0.75rem', borderRadius: 6, whiteSpace: 'nowrap' }}>
                  +{act.xp_amount} XP
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
