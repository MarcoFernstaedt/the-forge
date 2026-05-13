interface Props {
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ text = 'Loading...', fullScreen = false }: Props) {
  const wrapperStyle: React.CSSProperties = fullScreen
    ? { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', flexDirection: 'column', gap: '1rem' }
    : { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', flexDirection: 'column', gap: '0.5rem' };

  return (
    <div style={wrapperStyle}>
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid #2a2a2c',
          borderTopColor: '#b8923c',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p style={{ color: '#b8923c', fontSize: '0.9375rem' }}>{text}</p>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
