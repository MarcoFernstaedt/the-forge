import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

export function FadeIn({ children, delay = 0, duration = 0.5, direction = 'up' }: { children: ReactNode; delay?: number; duration?: number; direction?: 'up' | 'down' | 'left' | 'right' }) {
  const dirs = { up: { y: 30 }, down: { y: -30 }, left: { x: 30 }, right: { x: -30 } };
  return (
    <motion.div
      initial={{ opacity: 0, ...dirs[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, type: 'spring', stiffness: 100, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ children, stagger = 0.1, delay = 0 }: { children: ReactNode; stagger?: number; delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 25, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 120, damping: 15 } },
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function GlowCard({ children, onClick, style, glowColor = '#b8923c' }: { children: ReactNode; onClick?: () => void; style?: React.CSSProperties; glowColor?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: `0 0 30px ${glowColor}35`, borderColor: glowColor }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', ...style }}
    >
      {children}
    </motion.div>
  );
}

export function PulseGlow({ children, color = '#b8923c' }: { children: ReactNode; color?: string }) {
  return (
    <motion.div
      animate={{ boxShadow: [`0 0 0px ${color}00`, `0 0 20px ${color}40`, `0 0 0px ${color}00`] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}

export function XPBar({ current, max, color = '#b8923c' }: { current: number; max: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (current / max) * 100));
  return (
    <div style={{ width: '100%', height: 10, background: '#2a2a2c', borderRadius: 5, overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, type: 'spring', stiffness: 60, damping: 15 }}
        style={{ height: '100%', background: color, borderRadius: 5 }}
      />
    </div>
  );
}

export function AnimatedNumber({ value, duration = 1.5 }: { value: number; duration?: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -10, scale: 1.5 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration, type: 'spring', stiffness: 200, damping: 15 }}
      style={{ display: 'inline-block' }}
    >
      {value.toLocaleString()}
    </motion.span>
  );
}

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 100, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}

export function FloatingParticles({ count = 6 }: { count?: number }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: 4 + Math.random() * 6,
            height: 4 + Math.random() * 6,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${['#b8923c', '#f4d77a', '#c4c4ca'][i % 3]} 0%, transparent 70%)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export function SkillNodeOrb({ unlocked, mastered, onClick, children }: { unlocked: boolean; mastered: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <motion.div
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      animate={unlocked ? {
        boxShadow: mastered
          ? ['0 0 10px #f4d77a60', '0 0 25px #f4d77a80', '0 0 10px #f4d77a60']
          : ['0 0 5px #b8923c40', '0 0 15px #b8923c60', '0 0 5px #b8923c40'],
      } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', borderRadius: '50%' }}
    >
      {children}
    </motion.div>
  );
}

export function LevelUpFlash({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{ position: 'fixed', inset: 0, background: '#b8923c', zIndex: 999, pointerEvents: 'none' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.3, y: -40 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 15 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              background: 'linear-gradient(135deg, #0a0a0c, #1a1200)',
              border: '2px solid #f4d77a',
              borderRadius: 20,
              padding: '2.5rem 4rem',
              textAlign: 'center',
              boxShadow: '0 0 80px #b8923c80, inset 0 0 40px #b8923c20',
            }}
          >
            <motion.div animate={{ rotate: [0, 8, -8, 4, -4, 0] }} transition={{ duration: 0.6 }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚔️</div>
              <h2 style={{
                color: '#f4d77a',
                fontSize: '2.5rem',
                margin: '0 0 0.25rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                textShadow: '0 0 30px #f4d77a80',
                fontFamily: 'Orbitron, sans-serif',
              }}>
                LEVEL UP!
              </h2>
              <p style={{ color: '#b8923c', fontSize: '1rem', margin: 0 }}>Your mastery grows stronger</p>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function ScreenFlash({ color = '#b8923c', show }: { color?: string; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{ position: 'fixed', inset: 0, background: color, zIndex: 998, pointerEvents: 'none' }}
        />
      )}
    </AnimatePresence>
  );
}

export function AchievementToast({ title, description, show, icon = '🏆' }: { title: string; description: string; show: boolean; icon?: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 80, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '1.5rem',
            background: 'linear-gradient(135deg, #111113, #1a1400)',
            border: '1px solid #b8923c60',
            borderRadius: 12,
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            zIndex: 600,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px #b8923c30',
            maxWidth: 320,
          }}
        >
          <div style={{ fontSize: '1.75rem' }}>{icon}</div>
          <div>
            <div style={{ color: '#f4d77a', fontWeight: 700, fontSize: '0.9rem' }}>{title}</div>
            <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.1rem' }}>{description}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function HUDNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, scale: 1.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        display: 'inline-block',
        fontFamily: 'Orbitron, monospace',
        letterSpacing: '0.05em',
      }}
    >
      {prefix}{value.toLocaleString()}
    </motion.span>
  );
}
