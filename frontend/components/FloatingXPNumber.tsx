import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface XPEntry {
  id: number;
  x: number;
  y: number;
  amount: number;
}

let nextId = 0;

export default function FloatingXPNumbers() {
  const [entries, setEntries] = useState<XPEntry[]>([]);

  useEffect(() => {
    const handler = (e: CustomEvent<{ x?: number; y?: number; amount: number }>) => {
      const id = nextId++;
      const x = e.detail.x ?? window.innerWidth / 2;
      const y = e.detail.y ?? window.innerHeight / 2;
      setEntries(prev => [...prev, { id, x, y, amount: e.detail.amount }]);
      setTimeout(() => setEntries(prev => prev.filter(en => en.id !== id)), 1400);
    };
    window.addEventListener('forge:xp-gained', handler as EventListener);
    return () => window.removeEventListener('forge:xp-gained', handler as EventListener);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 700 }}>
      <AnimatePresence>
        {entries.map(entry => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -70, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: entry.x,
              top: entry.y,
              transform: 'translate(-50%, -50%)',
              color: '#f4d77a',
              fontWeight: 800,
              fontSize: '1.25rem',
              textShadow: '0 0 12px #b8923c, 0 0 24px #b8923c80',
              whiteSpace: 'nowrap',
              fontFamily: 'Orbitron, sans-serif',
            }}
          >
            +{entry.amount} XP
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
