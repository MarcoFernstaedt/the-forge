import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import SkillTreeCanvas from '../../components/SkillTreeCanvas';
import NodeDetail from '../../components/NodeDetail';

interface SkillNode {
  id: number;
  name: string;
  description: string;
  category: string;
  x: number;
  y: number;
  xp_required: number;
  max_xp: number;
  icon: string;
  prerequisite_ids: number[];
  current_xp: number;
  status: 'locked' | 'unlocked' | 'mastered';
  unlocked_at?: string;
  mastered_at?: string;
}

interface TreeData {
  id: number;
  name: string;
  description: string;
  skills: SkillNode[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

export default function TreePage() {
  const router = useRouter();
  const { id } = router.query;
  const [tree, setTree] = useState<TreeData | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);
  const [hoveredSkill, setHoveredSkill] = useState<SkillNode | null>(null);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/trees/${id}`)
      .then((r) => r.json())
      .then((data) => setTree(data))
      .catch(console.error);
  }, [id]);

  const handleLogActivity = async (skillId: number, description: string, xp: number) => {
    try {
      const res = await fetch(`${API_BASE}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill_id: skillId, description, xp_amount: xp, source: 'web' }),
      });
      const result = await res.json();
      if (res.ok) {
        setNotification(`+${xp} XP awarded!`);
        if (result.new_unlocks?.length > 0) {
          setNotification((prev) => prev + ` ${result.new_unlocks.length} new skill(s) unlocked!`);
        }
        if (result.new_masteries?.length > 0) {
          setNotification((prev) => prev + ` ${result.new_masteries.length} skill(s) mastered!`);
        }
        setTimeout(() => setNotification(''), 4000);
        // Refresh tree
        const treeRes = await fetch(`${API_BASE}/trees/${id}`);
        const treeData = await treeRes.json();
        setTree(treeData);
        // Update selected skill
        const updatedSkill = treeData.skills.find((s: SkillNode) => s.id === skillId);
        if (updatedSkill) setSelectedSkill(updatedSkill);
      }
    } catch (err) {
      console.error(err);
      setNotification('Failed to log activity');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  if (!tree) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c' }}>
        <p style={{ color: '#b8923c' }}>Loading skill tree...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #2a2a2c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#0a0a0c',
        }}
      >
        <div>
          <a href="/" style={{ color: '#b8923c', fontSize: '0.875rem', textDecoration: 'none' }}>
            ← Back to Dashboard
          </a>
          <h1 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', color: '#fff' }}>{tree.name}</h1>
        </div>
        {notification && (
          <div
            style={{
              padding: '0.5rem 1rem',
              background: '#1a1508',
              border: '1px solid #b8923c',
              borderRadius: 8,
              color: '#f4d77a',
              fontWeight: 600,
              animation: 'fade-in 0.3s ease-out',
            }}
          >
            {notification}
          </div>
        )}
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Canvas */}
        <div style={{ flex: 1, padding: '1rem' }}>
          <SkillTreeCanvas
            skills={tree.skills}
            onNodeClick={(skill) => setSelectedSkill(skill)}
            onNodeHover={(skill) => setHoveredSkill(skill)}
            width={1200}
            height={800}
          />
        </div>

        {/* Sidebar */}
        <div
          style={{
            width: 360,
            minWidth: 360,
            padding: '1rem',
            borderLeft: '1px solid #2a2a2c',
            overflowY: 'auto',
            background: '#0a0a0c',
          }}
        >
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
