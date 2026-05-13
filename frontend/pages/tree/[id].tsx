import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, ApiError } from '../../lib/api';
import { TreeData, SkillNode } from '../../lib/types';
import SkillTreeCanvas from '../../components/SkillTreeCanvas';
import NodeDetail from '../../components/NodeDetail';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function TreePage() {
  const router = useRouter();
  const { id } = router.query;
  const [tree, setTree] = useState<TreeData | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);
  const [hoveredSkill, setHoveredSkill] = useState<SkillNode | null>(null);
  const [notification, setNotification] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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

  // Fallback: parse tree ID from URL path for static export
  useEffect(() => {
    if (id) return; // Already handled by router
    if (typeof window === 'undefined') return;
    const match = window.location.pathname.match(/\/tree\/(\d+)/);
    if (match) {
      fetchTree(Number(match[1]));
    }
  }, []);

  const handleLogActivity = async (skillId: number, description: string, xp: number) => {
    try {
      const result = await api.logActivity(skillId, description, xp);
      setNotification(`+${xp} XP awarded!`);
      if (result.new_unlocks?.length > 0) {
        setNotification(prev => prev + ` ${result.new_unlocks.length} new skill(s) unlocked!`);
      }
      if (result.new_masteries?.length > 0) {
        setNotification(prev => prev + ` ${result.new_masteries.length} skill(s) mastered!`);
      }
      setTimeout(() => setNotification(''), 4000);
      if (id) {
        await fetchTree(Number(id));
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

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #2a2a2c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a0c', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <a href="/" style={{ color: '#b8923c', fontSize: '0.875rem', textDecoration: 'none' }}>← Back to Dashboard</a>
          <h1 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', color: '#fff' }}>{tree.name}</h1>
        </div>
        {notification && (
          <div style={{ padding: '0.5rem 1rem', background: '#1a1508', border: '1px solid #b8923c', borderRadius: 8, color: '#f4d77a', fontWeight: 600 }}>
            {notification}
          </div>
        )}
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'row' }}>
        <div style={{ flex: 1, padding: '1rem', minHeight: 0 }}>
          <SkillTreeCanvas
            skills={tree.skills}
            onNodeClick={(skill) => setSelectedSkill(skill)}
            onNodeHover={(skill) => setHoveredSkill(skill)}
            width={1200}
            height={800}
          />
        </div>

        <div style={{ width: 360, minWidth: 360, padding: '1rem', borderLeft: '1px solid #2a2a2c', overflowY: 'auto', background: '#0a0a0c' }}>
          {selectedSkill ? (
            <NodeDetail skill={selectedSkill} onLogActivity={handleLogActivity} />
          ) : hoveredSkill ? (
            <NodeDetail skill={hoveredSkill} onLogActivity={handleLogActivity} />
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#666' }}>
              <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Select a skill node</p>
              <p style={{ fontSize: '0.875rem' }}>Click any node on the tree to view details and log activities.</p>
              <div style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#555' }}>
                <p>Controls:</p>
                <p>Mouse wheel to zoom</p>
                <p>Drag to pan</p>
                <p>Click node to select</p>
                <p>Arrow keys to navigate</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
