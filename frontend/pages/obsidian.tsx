import { useEffect, useState } from 'react';

interface ObsidianNote {
  id: number;
  note_title: string;
  vault_path: string;
  tags: string;
  extracted_activities: string;
  last_sync: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

export default function ObsidianPage() {
  const [notes, setNotes] = useState<ObsidianNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [vaultPath, setVaultPath] = useState('/home/marco/obsidian-vault');

  useEffect(() => {
    fetch(`${API_BASE}/obsidian/notes`)
      .then((r) => r.json())
      .then((data) => {
        setNotes(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const handleSync = async () => {
    try {
      const res = await fetch(`${API_BASE}/obsidian/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vault_path: vaultPath }),
      });
      const result = await res.json();
      alert(result.message);
    } catch (err) {
      alert('Sync failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <a href="/" style={{ color: '#b8923c', fontSize: '0.875rem', textDecoration: 'none' }}>
          ← Back to Dashboard
        </a>
        <h1 style={{ fontSize: '2rem', color: '#fff', margin: '1rem 0 0.5rem' }}>Obsidian Vault</h1>
        <p style={{ color: '#888', marginBottom: '2rem' }}>
          Connect your vault to auto-extract activities and achievements.
        </p>

        {/* Sync Controls */}
        <div
          style={{
            padding: '1.25rem',
            background: '#111113',
            border: '1px solid #2a2a2c',
            borderRadius: 10,
            marginBottom: '2rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={vaultPath}
            onChange={(e) => setVaultPath(e.target.value)}
            style={{
              flex: 1,
              padding: '0.625rem',
              background: '#1a1a1c',
              border: '1px solid #3a3a3c',
              borderRadius: 6,
              color: '#fff',
              fontSize: '0.875rem',
            }}
          />
          <button
            onClick={handleSync}
            style={{
              padding: '0.625rem 1.25rem',
              background: '#b8923c',
              color: '#0a0a0c',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            Sync Vault
          </button>
        </div>

        {/* Notes Timeline */}
        {loading ? (
          <p style={{ color: '#888' }}>Loading notes...</p>
        ) : notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#666' }}>
            <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No vault connection yet</p>
            <p>Enter your Obsidian vault path above and sync to begin.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {notes.map((note) => {
              let tags: string[] = [];
              let activities: string[] = [];
              try { tags = JSON.parse(note.tags); } catch {}
              try { activities = JSON.parse(note.extracted_activities); } catch {}

              return (
                <div
                  key={note.id}
                  style={{
                    padding: '1.25rem',
                    background: '#111113',
                    border: '1px solid #2a2a2c',
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>{note.note_title}</h3>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>
                      {new Date(note.last_sync).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: '#888' }}>
                    {note.vault_path}
                  </p>
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            background: '#b8923c20',
                            color: '#b8923c',
                            borderRadius: 4,
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {activities.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 0.375rem' }}>Extracted Activities:</p>
                      {activities.map((act, i) => (
                        <p key={i} style={{ margin: '0.125rem 0', fontSize: '0.8125rem', color: '#c4c4ca' }}>
                          • {act}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
