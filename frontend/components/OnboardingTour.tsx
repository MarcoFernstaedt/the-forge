import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TOUR_KEY = 'forge_tour_v1';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // data-tour attribute value
  type: 'fullscreen' | 'spotlight' | 'demo' | 'cta';
  demoType?: 'tree' | 'xp' | 'levelup';
}

const STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to The Forge',
    description: 'Your personal skill progression engine — where raw ambition becomes mastery.',
    type: 'fullscreen',
  },
  {
    id: 'stats',
    title: 'Your Command Center',
    description: 'Track your level, XP, and daily streak. Every activity you log pushes these numbers higher.',
    target: 'stats-section',
    type: 'spotlight',
  },
  {
    id: 'trees',
    title: 'Skill Trees',
    description: 'Organize your learning into interconnected skill nodes. Unlock prerequisites, master nodes, and watch your expertise branch outward.',
    target: 'trees-section',
    type: 'spotlight',
  },
  {
    id: 'demo-tree',
    title: 'Explore the Skill Tree',
    description: 'Navigate nodes, track prerequisites, and see your progress visualized in real time.',
    type: 'demo',
    demoType: 'tree',
  },
  {
    id: 'demo-xp',
    title: 'Log Activities & Earn XP',
    description: 'Every study session, project, or practice logs XP to your skills — watch them unlock and level up.',
    type: 'demo',
    demoType: 'xp',
  },
  {
    id: 'demo-levelup',
    title: 'Level Up',
    description: 'Accumulate enough XP and you ascend — a permanent mark of your growing mastery.',
    type: 'demo',
    demoType: 'levelup',
  },
  {
    id: 'goals',
    title: 'Goals & Journal',
    description: 'Set ambitious targets, track progress, and journal your journey. The Forge remembers every step.',
    target: 'quick-actions',
    type: 'spotlight',
  },
  {
    id: 'voice',
    title: 'Voice Control',
    description: 'Navigate hands-free. Say "Go to goals", "Zoom in", or "Log activity" — The Forge listens.',
    target: 'voice-button',
    type: 'spotlight',
  },
  {
    id: 'ready',
    title: 'The Forge is Yours',
    description: 'Start hammering. Every skill you unlock, every goal you crush, every streak you build — it all compounds.',
    type: 'cta',
  },
];

// Mini demo skill tree canvas
function DemoTreeCanvas({ phase }: { phase: 'tree' | 'xp' | 'levelup' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTime = useRef(Date.now());

  const nodes = [
    { id: 0, x: 200, y: 240, label: 'Foundation', status: 'mastered' as const, xp: 100, maxXp: 100 },
    { id: 1, x: 120, y: 150, label: 'Theory', status: 'unlocked' as const, xp: 60, maxXp: 100 },
    { id: 2, x: 280, y: 150, label: 'Practice', status: 'unlocked' as const, xp: 30, maxXp: 100 },
    { id: 3, x: 80, y: 60, label: 'Deep Dive', status: 'locked' as const, xp: 0, maxXp: 100 },
    { id: 4, x: 320, y: 60, label: 'Applied', status: 'locked' as const, xp: 0, maxXp: 100 },
  ];

  const edges = [[0, 1], [0, 2], [1, 3], [2, 4]];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const t = (Date.now() - startTime.current) / 1000;
      ctx.clearRect(0, 0, 400, 300);

      // Compute animated state
      let animNodes = nodes.map(n => ({ ...n }));

      if (phase === 'xp') {
        const progress = Math.min(1, (t % 4) / 2);
        animNodes[2].xp = Math.round(30 + progress * 70);
        if (animNodes[2].xp >= 100) {
          animNodes[2].status = 'mastered';
          animNodes[4].status = 'unlocked';
          animNodes[4].xp = 0;
        }
      }

      if (phase === 'levelup') {
        animNodes[1].xp = 100;
        animNodes[1].status = 'mastered';
        animNodes[2].xp = 100;
        animNodes[2].status = 'mastered';
        animNodes[3].status = 'unlocked';
        animNodes[4].status = 'unlocked';
      }

      // Draw edges
      edges.forEach(([a, b]) => {
        const na = animNodes[a];
        const nb = animNodes[b];
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.strokeStyle = '#2a2a2c';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw nodes
      animNodes.forEach((node, i) => {
        const isSelected = phase === 'tree' && i === Math.floor(t * 0.7) % 5;
        const glow = phase === 'levelup' || isSelected;

        if (glow) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 26, 0, Math.PI * 2);
          ctx.fillStyle = node.status === 'mastered' ? '#f4d77a20' : '#b8923c20';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
        ctx.fillStyle =
          node.status === 'mastered' ? '#2a1f00' :
          node.status === 'unlocked' ? '#1a1200' : '#111113';
        ctx.strokeStyle =
          node.status === 'mastered' ? '#f4d77a' :
          node.status === 'unlocked' ? '#b8923c' : '#2a2a2c';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle =
          node.status === 'mastered' ? '#f4d77a' :
          node.status === 'unlocked' ? '#b8923c' : '#555';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y);

        // XP bar
        if (node.status !== 'locked') {
          const barW = 44;
          const barH = 4;
          const bx = node.x - barW / 2;
          const by = node.y + 26;
          ctx.fillStyle = '#2a2a2c';
          ctx.fillRect(bx, by, barW, barH);
          ctx.fillStyle = node.status === 'mastered' ? '#f4d77a' : '#b8923c';
          ctx.fillRect(bx, by, barW * (node.xp / node.maxXp), barH);
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={300}
      style={{ borderRadius: 12, background: '#0a0a0c', border: '1px solid #2a2a2c' }}
    />
  );
}

function SpotlightOverlay({ target, onNext, onSkip, step, stepIndex, totalSteps }: {
  target: string;
  onNext: () => void;
  onSkip: () => void;
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const el = document.querySelector(`[data-tour="${target}"]`);
    if (el) {
      setRect(el.getBoundingClientRect());
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setRect(el.getBoundingClientRect()), 400);
    }
  }, [target]);

  const pad = 16;
  const hole = rect ? {
    x: rect.left - pad,
    y: rect.top - pad,
    w: rect.width + pad * 2,
    h: rect.height + pad * 2,
  } : null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 800 }}>
      {hole ? (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} onClick={onNext}>
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx={12} fill="black" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#tour-mask)" />
          <rect x={hole.x - 2} y={hole.y - 2} width={hole.w + 4} height={hole.h + 4} rx={14} fill="none" stroke="#b8923c" strokeWidth="2" />
        </svg>
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)' }} onClick={onNext} />
      )}
      <TourCard step={step} stepIndex={stepIndex} totalSteps={totalSteps} onNext={onNext} onSkip={onSkip} rect={rect} />
    </div>
  );
}

function TourCard({ step, stepIndex, totalSteps, onNext, onSkip, rect }: {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  rect?: DOMRect | null;
}) {
  const cardStyle: React.CSSProperties = rect
    ? {
        position: 'fixed',
        left: '50%',
        top: rect.bottom + 24 + window.scrollY > window.innerHeight - 200
          ? rect.top - 180
          : rect.bottom + 24,
        transform: 'translateX(-50%)',
      }
    : {
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
      };

  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      style={{
        ...cardStyle,
        background: 'linear-gradient(135deg, #111113, #1a1200)',
        border: '1px solid #b8923c50',
        borderRadius: 16,
        padding: '1.5rem',
        maxWidth: 380,
        width: 'calc(100vw - 2rem)',
        zIndex: 801,
        boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 30px #b8923c20',
      }}
    >
      <div style={{ display: 'flex', gap: '4px', marginBottom: '1rem' }}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= stepIndex ? '#b8923c' : '#2a2a2c', transition: 'background 0.3s' }} />
        ))}
      </div>
      <h3 style={{ color: '#f4d77a', fontSize: '1.0625rem', fontWeight: 700, margin: '0 0 0.5rem', fontFamily: 'Orbitron, sans-serif' }}>
        {step.title}
      </h3>
      <p style={{ color: '#c4c4ca', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
        {step.description}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onSkip} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.8rem' }}>
          Skip tour
        </button>
        <motion.button
          onClick={onNext}
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px #b8923c50' }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: '0.5rem 1.25rem',
            background: 'linear-gradient(135deg, #b8923c, #f4d77a)',
            color: '#0a0a0c',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          {stepIndex === totalSteps - 1 ? 'Enter The Forge' : 'Next →'}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [levelUpDemo, setLevelUpDemo] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const completed = localStorage.getItem(TOUR_KEY);
    if (!completed) {
      setTimeout(() => setActive(true), 1200);
    }

    const handler = () => {
      setStepIndex(0);
      setActive(true);
    };
    window.addEventListener('forge:start-tour', handler);
    return () => window.removeEventListener('forge:start-tour', handler);
  }, []);

  const complete = useCallback(() => {
    localStorage.setItem(TOUR_KEY, '1');
    setActive(false);
  }, []);

  const next = useCallback(() => {
    if (stepIndex >= STEPS.length - 1) {
      complete();
      return;
    }
    const nextStep = STEPS[stepIndex + 1];
    if (nextStep.demoType === 'levelup') {
      setLevelUpDemo(true);
      setTimeout(() => setLevelUpDemo(false), 2000);
    }
    setStepIndex(s => s + 1);
  }, [stepIndex, complete]);

  if (!active) return null;

  const step = STEPS[stepIndex];

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Level-up demo flash */}
          {levelUpDemo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{ duration: 1.5 }}
              style={{ position: 'fixed', inset: 0, background: '#b8923c', zIndex: 850, pointerEvents: 'none' }}
            />
          )}

          {/* Fullscreen steps */}
          {step.type === 'fullscreen' && (
            <motion.div
              key={step.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(ellipse at center, #1a0d00 0%, #0a0a0c 100%)',
                flexDirection: 'column',
                gap: '2rem',
                padding: '2rem',
                textAlign: 'center',
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: '5rem' }}
              >
                ⚒️
              </motion.div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  style={{
                    color: '#f4d77a',
                    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                    fontWeight: 900,
                    margin: '0 0 0.5rem',
                    textShadow: '0 0 40px #b8923c80',
                    fontFamily: 'Orbitron, sans-serif',
                  }}
                >
                  {step.title}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  style={{ color: '#c4c4ca', fontSize: '1.125rem', maxWidth: 480, margin: '0 auto' }}
                >
                  {step.description}
                </motion.p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px #b8923c60' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={next}
                  style={{
                    padding: '0.875rem 2.5rem',
                    background: 'linear-gradient(135deg, #b8923c, #f4d77a)',
                    color: '#0a0a0c',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontFamily: 'Orbitron, sans-serif',
                  }}
                >
                  Begin Tour
                </motion.button>
                <button
                  onClick={complete}
                  style={{ background: 'none', border: '1px solid #2a2a2c', color: '#666', padding: '0.875rem 1.5rem', borderRadius: 10, cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Skip
                </button>
              </div>
            </motion.div>
          )}

          {/* CTA step */}
          {step.type === 'cta' && (
            <motion.div
              key={step.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(ellipse at center, #1a0d00 0%, #0a0a0c 100%)',
                flexDirection: 'column',
                gap: '2rem',
                padding: '2rem',
                textAlign: 'center',
              }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: '4rem' }}
              >
                ⚔️
              </motion.div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  style={{
                    color: '#f4d77a',
                    fontSize: 'clamp(1.75rem, 4vw, 3rem)',
                    fontWeight: 900,
                    margin: '0 0 0.5rem',
                    textShadow: '0 0 30px #b8923c80',
                    fontFamily: 'Orbitron, sans-serif',
                  }}
                >
                  {step.title}
                </motion.h1>
                <p style={{ color: '#c4c4ca', fontSize: '1.0625rem', maxWidth: 420, margin: '0 auto 2rem' }}>{step.description}</p>
                <motion.button
                  whileHover={{ scale: 1.07, boxShadow: '0 0 40px #b8923c70' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={complete}
                  style={{
                    padding: '1rem 3rem',
                    background: 'linear-gradient(135deg, #b8923c, #f4d77a)',
                    color: '#0a0a0c',
                    border: 'none',
                    borderRadius: 12,
                    fontWeight: 800,
                    fontSize: '1.0625rem',
                    cursor: 'pointer',
                    fontFamily: 'Orbitron, sans-serif',
                    letterSpacing: '0.04em',
                  }}
                >
                  Enter The Forge →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Demo steps */}
          {step.type === 'demo' && step.demoType && (
            <motion.div
              key={step.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.88)',
                flexDirection: 'column',
                gap: '1.5rem',
                padding: '2rem',
              }}
            >
              {step.demoType === 'levelup' ? (
                <motion.div
                  animate={{ scale: [1, 1.1, 1], boxShadow: ['0 0 20px #b8923c40', '0 0 60px #b8923c80', '0 0 20px #b8923c40'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    background: 'linear-gradient(135deg, #0a0a0c, #1a1200)',
                    border: '2px solid #f4d77a',
                    borderRadius: 20,
                    padding: '2rem 3rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚔️</div>
                  <h2 style={{ color: '#f4d77a', fontSize: '2rem', fontFamily: 'Orbitron, sans-serif', margin: '0 0 0.25rem' }}>LEVEL UP!</h2>
                  <p style={{ color: '#b8923c', margin: 0 }}>Your mastery grows stronger</p>
                </motion.div>
              ) : (
                <DemoTreeCanvas phase={step.demoType} />
              )}
              <TourCard step={step} stepIndex={stepIndex} totalSteps={STEPS.length} onNext={next} onSkip={complete} />
            </motion.div>
          )}

          {/* Spotlight steps */}
          {step.type === 'spotlight' && step.target && (
            <AnimatePresence mode="wait">
              <motion.div key={step.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SpotlightOverlay
                  target={step.target}
                  onNext={next}
                  onSkip={complete}
                  step={step}
                  stepIndex={stepIndex}
                  totalSteps={STEPS.length}
                />
              </motion.div>
            </AnimatePresence>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
