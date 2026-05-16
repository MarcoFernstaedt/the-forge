import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceContext } from '../context/VoiceContext';
import { useSoundContext } from '../context/SoundContext';

const GLOBAL_COMMANDS = [
  { command: 'dashboard / home', description: 'Go to dashboard' },
  { command: 'goals', description: 'Open goals page' },
  { command: 'journal / notes', description: 'Open journal' },
  { command: 'activities', description: 'View activity feed' },
  { command: 'vault / obsidian', description: 'Open vault' },
  { command: 'start tour', description: 'Replay onboarding tour' },
  { command: 'mute / unmute', description: 'Toggle sound effects' },
  { command: 'show commands / help', description: 'Show this list' },
];

const TREE_COMMANDS = [
  { command: 'zoom in / zoom out', description: 'Zoom the skill tree' },
  { command: 'reset zoom / fit view', description: 'Reset camera' },
  { command: 'log activity', description: 'Log XP to selected skill' },
  { command: 'select [skill name]', description: 'Jump to a skill' },
];

export default function VoiceControlUI() {
  const { listening, transcript, lastCommand, toggleListening, isSupported, showCommands, setShowCommands } = useVoiceContext();
  const { playVoiceActivate } = useSoundContext();

  const handleToggle = () => {
    if (!listening) playVoiceActivate();
    toggleListening();
  };

  return (
    <>
      {/* Transcript pill */}
      <AnimatePresence>
        {(listening && transcript) && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.9 }}
            style={{
              position: 'fixed',
              top: 64,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(10,10,12,0.95)',
              border: '1px solid #b8923c60',
              borderRadius: 20,
              padding: '0.375rem 1rem',
              fontSize: '0.8rem',
              color: '#f4d77a',
              zIndex: 200,
              backdropFilter: 'blur(12px)',
              pointerEvents: 'none',
              maxWidth: '80vw',
              textAlign: 'center',
            }}
          >
            🎙 {transcript}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Last command flash */}
      <AnimatePresence>
        {lastCommand && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'fixed',
              top: 64,
              right: '1rem',
              background: '#22c55e20',
              border: '1px solid #22c55e',
              borderRadius: 8,
              padding: '0.3rem 0.75rem',
              fontSize: '0.75rem',
              color: '#22c55e',
              zIndex: 200,
            }}
          >
            ✓ {lastCommand}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <motion.button
          onClick={handleToggle}
          title={!isSupported ? 'Voice not supported in this browser' : listening ? 'Stop listening' : 'Start voice control'}
          disabled={!isSupported}
          whileHover={isSupported ? { scale: 1.1 } : {}}
          whileTap={isSupported ? { scale: 0.9 } : {}}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: listening ? '2px solid #ef4444' : '1px solid #3a3a3c',
            background: listening ? '#ef444420' : 'transparent',
            cursor: isSupported ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.95rem',
            color: listening ? '#ef4444' : isSupported ? '#888' : '#444',
            position: 'relative',
          }}
        >
          {listening && (
            <motion.div
              animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                position: 'absolute',
                inset: -4,
                borderRadius: '50%',
                border: '2px solid #ef4444',
                pointerEvents: 'none',
              }}
            />
          )}
          🎙
        </motion.button>

        <motion.button
          onClick={() => setShowCommands(true)}
          title="Voice commands"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: '1px solid #2a2a2c',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.65rem',
            color: '#555',
          }}
        >
          ?
        </motion.button>
      </div>

      {/* Commands modal */}
      <AnimatePresence>
        {showCommands && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCommands(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              zIndex: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#111113',
                border: '1px solid #b8923c40',
                borderRadius: 16,
                padding: '1.5rem',
                maxWidth: 480,
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ color: '#f4d77a', fontSize: '1rem', fontWeight: 700, margin: 0 }}>🎙 Voice Commands</h2>
                <button onClick={() => setShowCommands(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>Global</p>
                {GLOBAL_COMMANDS.map(c => (
                  <div key={c.command} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #1e1e20' }}>
                    <code style={{ color: '#b8923c', fontSize: '0.8rem', background: '#b8923c12', padding: '0.1rem 0.4rem', borderRadius: 4 }}>{c.command}</code>
                    <span style={{ color: '#888', fontSize: '0.8rem' }}>{c.description}</span>
                  </div>
                ))}
              </div>

              <div>
                <p style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>On Skill Tree Pages</p>
                {TREE_COMMANDS.map(c => (
                  <div key={c.command} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #1e1e20' }}>
                    <code style={{ color: '#60a5fa', fontSize: '0.8rem', background: '#60a5fa12', padding: '0.1rem 0.4rem', borderRadius: 4 }}>{c.command}</code>
                    <span style={{ color: '#888', fontSize: '0.8rem' }}>{c.description}</span>
                  </div>
                ))}
              </div>

              <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '1rem', textAlign: 'center' }}>
                Click the 🎙 button to start listening
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
