import { useState } from 'react';

interface SkillNode {
  id: number;
  name: string;
  description: string;
  category: string;
  xp_required: number;
  max_xp: number;
  icon: string;
  current_xp: number;
  status: 'locked' | 'unlocked' | 'mastered';
  unlocked_at?: string;
  mastered_at?: string;
}

interface NodeDetailProps {
  skill: SkillNode;
  onLogActivity: (skillId: number, description: string, xp: number) => void;
}

export default function NodeDetail({ skill, onLogActivity }: NodeDetailProps) {
  const [activityDesc, setActivityDesc] = useState('');
  const [xpAmount, setXpAmount] = useState(10);
  const [showForm, setShowForm] = useState(false);

  const xpPercent = skill.max_xp > 0 ? Math.min(100, (skill.current_xp / skill.max_xp) * 100) : 0;

  const statusColors = {
    locked: '#3a3a3c',
    unlocked: '#b8923c',
    mastered: '#f4d77a',
  };

  return (
    <div
      style={{
        background: '#111113',
        border: '1px solid #2a2a2c',
        borderRadius: 12,
        padding: '1.5rem',
        maxWidth: 320,
        animation: 'fade-in 0.3s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '2rem' }}>{skill.icon}</span>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>{skill.name}</h3>
          <span
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: statusColors[skill.status],
              fontWeight: 600,
            }}
          >
            {skill.status}
          </span>
        </div>
      </div>

      <p style={{ color: '#c4c4ca', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '1rem' }}>
        {skill.description}
      </p>

      {skill.status !== 'locked' && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#999' }}>Progress</span>
            <span style={{ fontSize: '0.875rem', color: '#b8923c' }}>
              {skill.current_xp} / {skill.max_xp} XP
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 6,
              background: '#2a2a2c',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${xpPercent}%`,
                height: '100%',
                background: skill.status === 'mastered' ? '#f4d77a' : '#b8923c',
                borderRadius: 3,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      )}

      {skill.status === 'locked' && (
        <div style={{ padding: '0.75rem', background: '#1a1a1c', borderRadius: 8, marginBottom: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#888' }}>
            Requires {skill.xp_required} XP to unlock
          </p>
        </div>
      )}

      {skill.unlocked_at && (
        <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
          Unlocked: {new Date(skill.unlocked_at).toLocaleDateString()}
        </p>
      )}

      {skill.mastered_at && (
        <p style={{ fontSize: '0.75rem', color: '#f4d77a', marginBottom: '0.5rem' }}>
          Mastered: {new Date(skill.mastered_at).toLocaleDateString()}
        </p>
      )}

      {skill.status !== 'locked' && (
        <div style={{ marginTop: '1rem' }}>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              style={{
                width: '100%',
                padding: '0.625rem',
                background: '#b8923c',
                color: '#0a0a0c',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Log Activity
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="What did you accomplish?"
                value={activityDesc}
                onChange={(e) => setActivityDesc(e.target.value)}
                style={{
                  padding: '0.5rem',
                  background: '#1a1a1c',
                  border: '1px solid #3a3a3c',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: '0.875rem',
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  value={xpAmount}
                  onChange={(e) => setXpAmount(parseInt(e.target.value) || 0)}
                  min={1}
                  max={100}
                  style={{
                    width: 80,
                    padding: '0.5rem',
                    background: '#1a1a1c',
                    border: '1px solid #3a3a3c',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: '0.875rem',
                  }}
                />
                <button
                  onClick={() => {
                    if (activityDesc.trim()) {
                      onLogActivity(skill.id, activityDesc, xpAmount);
                      setActivityDesc('');
                      setShowForm(false);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: '#b8923c',
                    color: '#0a0a0c',
                    border: 'none',
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Award XP
                </button>
              </div>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  padding: '0.375rem',
                  background: 'transparent',
                  color: '#888',
                  border: 'none',
                  fontSize: '0.75rem',
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
