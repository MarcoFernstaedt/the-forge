import { useState } from 'react';
import { api, ApiError } from '../lib/api';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const user = await api.createUser(username, displayName || undefined);
      setSuccess(`Account created! Your API key: ${user.api_key}`);
      setApiKey(user.api_key || '');
      localStorage.setItem('forge_api_key', user.api_key || '');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }
    localStorage.setItem('forge_api_key', apiKey.trim());
    window.location.href = '/';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', margin: 0, background: 'linear-gradient(135deg, #b8923c, #f4d77a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            The Forge
          </h1>
          <p style={{ color: '#888', marginTop: '0.5rem' }}>Enter your empire</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              padding: '0.625rem',
              background: mode === 'login' ? '#b8923c' : 'transparent',
              color: mode === 'login' ? '#0a0a0c' : '#b8923c',
              border: '1px solid #b8923c',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Login
          </button>
          <button
            onClick={() => setMode('register')}
            style={{
              flex: 1,
              padding: '0.625rem',
              background: mode === 'register' ? '#b8923c' : 'transparent',
              color: mode === 'register' ? '#0a0a0c' : '#b8923c',
              border: '1px solid #b8923c',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Register
          </button>
        </div>

        {mode === 'register' ? (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ padding: '0.75rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 6, color: '#fff', fontSize: '0.9375rem' }}
            />
            <input
              type="text"
              placeholder="Display name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{ padding: '0.75rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 6, color: '#fff', fontSize: '0.9375rem' }}
            />
            {error && <p style={{ color: '#f87171', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
            {success && <p style={{ color: '#34d399', fontSize: '0.875rem', margin: 0, wordBreak: 'break-all' }}>{success}</p>}
            <button type="submit" style={{ padding: '0.75rem', background: '#b8923c', color: '#0a0a0c', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer' }}>
              Create Account
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="text"
              placeholder="API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
              style={{ padding: '0.75rem', background: '#111113', border: '1px solid #2a2a2c', borderRadius: 6, color: '#fff', fontSize: '0.9375rem' }}
            />
            {error && <p style={{ color: '#f87171', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
            <button type="submit" style={{ padding: '0.75rem', background: '#b8923c', color: '#0a0a0c', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer' }}>
              Enter The Forge
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', color: '#555', fontSize: '0.75rem', marginTop: '2rem' }}>
          In dev mode, no key is required.
        </p>
      </div>
    </div>
  );
}
