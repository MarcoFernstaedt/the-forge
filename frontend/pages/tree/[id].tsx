import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { api, ApiError } from '../../lib/api';
import { TreeData, SkillNode } from '../../lib/types';
import SkillTreeCanvas, { SkillTreeCanvasHandle } from '../../components/SkillTreeCanvas';
import NodeDetail from '../../components/NodeDetail';
import LoadingSpinner from '../../components/LoadingSpinner';
import Navbar from '../../components/Navbar';
import { useVoiceContext } from '../../context/VoiceContext';
import { useSoundContext } from '../../context/SoundContext';

export default function TreePage() {
  const router = useRouter();
  const { id } = router.query;
  const [tree, setTree] = useState<TreeData | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);
  const [hoveredSkill, setHoveredSkill] = useState<SkillNode | null>(null);
  const [notification, setNotification] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const canvasRef = useRef<SkillTreeCanvasHandle>(null);
  const { registerCommands, unregisterCommands } = useVoiceContext();
  const { playXPGain, playNodeUnlock, playNavClick } = useSoundContext();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchTree = async (treeId: number) => {
    try {
      const data = await api.getTree(treeId);
      setTree(data);
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load tree');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchTree(Number(id));
  }, [id]);

  useEffect(() => {
    if (id) return;
    if (typeof window === 'undefined') return;
    const match = window.location.pathname.match(/\/tree\/(\d+)/);
    if (match) fetchTree(Number(match[1]));
  }, []);

  // Register page-specific voice commands
  useEffect(() => {
    const commands = {
      'zoom in': () => canvasRef.current?.zoomIn(),
      'zoom out': () => canvasRef.current?.zoomOut(),
      'reset zoom': () => canvasRef.current?.resetCamera(),
      'fit view': () => canvasRef.current?.resetCamera(),
      'log activity': () => setSheetOpen(true),
    };
    registerCommands(commands);
    return () => unregisterCommands(Object.keys(commands));
  }, [registerCommands, unregisterCommands]);

  const handleNodeClick = useCallback((skill: SkillNode) => {
    setSelectedSkill(skill);
    if (isMobile) setSheetOpen(true);
  }, [isMobile]);

  const handleLogActivity = async (skillId: number, description: string, xp: number) => {
    try {
      const result = await api.logActivity(skillId, description, xp);
      playXPGain();

      // Dispatch floating XP number event
      window.dispatchEvent(new CustomEvent('forge:xp-gained', {
        detail: { amount: xp, x: window.innerWidth / 2, y: window.innerHeight / 2 },
      }));

      let msg = `+${xp} XP awarded!`;
      if (result.new_unlocks?.length > 0) {
        msg += ` ${result.new_unlocks.length} new skill(s) unlocked!`;
        playNodeUnlock();
      }
      if (result.new_masteries?.length > 0) {
        msg += ` ${result.new_masteries.length} skill(s) mastered!`;
      }
      setNotification(msg);
      setTimeout(() => setNotification(''), 4000);

      const treeId = id || window.location.pathname.match(/\/tree\/(\d+)/)?.[1];
      if (treeId) {
        await fetchTree(Number(treeId));
        const updatedSkill = tree?.skills.find((s: SkillNode) => s.id === skillId);
        if (updatedSkill) setSelectedSkill(updatedSkill);
      }
    } catch (err) {
      setNotification(err instanceof ApiError ? err.message : 'Failed to log activity');
      setTimeout(() => setNotification(''), 4000);
    }
  };

  if (loading) return <LoadingSpinner text="Loading skill tree..." fullScreen />;
  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#f87171' }}>{error}</p>
          <button onClick={() => id && fetchTree(Number(id))} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#b8923c', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (!tree) return <LoadingSpinner text="Loading skill tree..." fullScreen />;

  const activeSkill = selectedSkill ?? hoveredSkill;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <header style={{
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid #2a2a2c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(10,10,12,0.9)',
        backdropFilter: 'blur(8px)',
        flexWrap: 'wrap',
        gap: '0.5rem',
        position: 'sticky',
        top: 56,
        zIndex: 50,
      }}>
        <div>
          <a href="/" onClick={playNavClick} style={{ color: '#b8923c', fontSize: '0.8125rem', textDecoration: 'none' }}>← Dashboard</a>
          <h1 style={{ margin: '0.2rem 0 0', fontSize: 'clamp(1rem, 3vw, 1.375rem)', color: '#fff', fontWeight: 700, fontFamily: 'Orbitron, sans-serif' }}>
            {tree.name}
          </h1>
        </div>

        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              style={{
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #1a1508, #1a0d00)',
                border: '1px solid #b8923c',
                borderRadius: 8,
                color: '#f4d77a',
                fontWeight: 600,
                fontSize: '0.875rem',
                boxShadow: '0 0 20px #b8923c30',
              }}
            >
              {notification}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Canvas + Sidebar layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '0.75rem', minHeight: 0, minWidth: 0 }}>
          <SkillTreeCanvas
            ref={canvasRef}
            skills={tree.skills}
            onNodeClick={handleNodeClick}
            onNodeHover={(skill) => !isMobile && setHoveredSkill(skill)}
            width={1200}
            height={800}
          />
        </div>

        {/* Desktop sidebar */}
        {!isMobile && (
          <motion.div
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            style={{
              width: 360,
              minWidth: 360,
              padding: '1rem',
              borderLeft: '1px solid #2a2a2c',
              overflowY: 'auto',
              background: 'rgba(10,10,12,0.85)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {activeSkill ? (
              <NodeDetail skill={activeSkill} onLogActivity={handleLogActivity} />
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#555' }}>
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ fontSize: '2.5rem', marginBottom: '1rem' }}
                >
                  ⚔️
                </motion.div>
                <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#888' }}>Select a skill node</p>
                <p style={{ fontSize: '0.8125rem' }}>Click any node to view details and log activities.</p>
                <div style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#444', lineHeight: 2 }}>
                  <p>🖱 Scroll to zoom</p>
                  <p>✋ Drag to pan</p>
                  <p>👆 Click to select</p>
                  <p>⌨️ Arrow keys to navigate</p>
                  <p>🎙 Voice: "zoom in" / "zoom out"</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {isMobile && (
        <AnimatePresence>
          {sheetOpen && activeSkill && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSheetOpen(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150 }}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.1, bottom: 0.3 }}
                onDragEnd={(_, info) => { if (info.offset.y > 80) setSheetOpen(false); }}
                transition={{ type: 'spring', stiffness: 300, damping: 35 }}
                style={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: '#111113',
                  borderTop: '1px solid #2a2a2c',
                  borderRadius: '20px 20px 0 0',
                  zIndex: 160,
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  padding: '0 1rem 2rem',
                }}
              >
                {/* Drag handle */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '0.875rem 0 0.5rem' }}>
                  <div style={{ width: 40, height: 4, background: '#3a3a3c', borderRadius: 2 }} />
                </div>
                <NodeDetail skill={activeSkill} onLogActivity={handleLogActivity} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
