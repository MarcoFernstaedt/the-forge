import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';

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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface SkillTreeCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetCamera: () => void;
  selectNodeByName: (name: string) => void;
}

interface SkillTreeCanvasProps {
  skills: SkillNode[];
  onNodeClick: (skill: SkillNode) => void;
  onNodeHover: (skill: SkillNode | null) => void;
  width?: number;
  height?: number;
}

const COLORS = {
  bg: '#0a0a0c',
  locked: '#3a3a3c',
  unlocked: '#b8923c',
  mastered: '#f4d77a',
  connection: '#c4c4ca40',
  connectionActive: '#b8923c80',
  text: '#ffffff',
  textMuted: '#c4c4ca',
  categories: {
    root: '#f4d77a',
    engineering: '#60a5fa',
    sales: '#f87171',
    operations: '#a78bfa',
    finance: '#34d399',
    leadership: '#fbbf24',
  },
};

const SkillTreeCanvas = forwardRef<SkillTreeCanvasHandle, SkillTreeCanvasProps>(function SkillTreeCanvas({
  skills,
  onNodeClick,
  onNodeHover,
  width = 1200,
  height = 800,
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const cameraStart = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const skillsRef = useRef<SkillNode[]>(skills);

  useEffect(() => {
    skillsRef.current = skills;
  }, [skills]);

  // Spawn particles when a node is mastered
  const spawnParticles = useCallback((x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30 + Math.random() * 0.3;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 60,
        maxLife: 60,
        color,
        size: 2 + Math.random() * 3,
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  // Convert normalized coordinates to canvas coordinates
  const toCanvas = useCallback(
    (nx: number, ny: number) => ({
      x: nx * width * camera.zoom + camera.x,
      y: ny * height * camera.zoom + camera.y,
    }),
    [camera, width, height]
  );

  // Convert canvas coordinates to normalized
  const toNormalized = useCallback(
    (cx: number, cy: number) => ({
      x: (cx - camera.x) / (width * camera.zoom),
      y: (cy - camera.y) / (height * camera.zoom),
    }),
    [camera, width, height]
  );

  // Find node at canvas position
  const getNodeAtPosition = useCallback(
    (cx: number, cy: number): SkillNode | null => {
      const norm = toNormalized(cx, cy);
      const nodeRadius = 25 / camera.zoom;
      for (const skill of skillsRef.current) {
        const dx = skill.x - norm.x;
        const dy = skill.y - norm.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nodeRadius) {
          return skill;
        }
      }
      return null;
    },
    [toNormalized, camera.zoom]
  );

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid
    ctx.strokeStyle = '#1a1a1c';
    ctx.lineWidth = 1;
    const gridSize = 50 * camera.zoom;
    const offsetX = camera.x % gridSize;
    const offsetY = camera.y % gridSize;
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const currentSkills = skillsRef.current;

    // Draw connections first (behind nodes)
    for (const skill of currentSkills) {
      if (!skill.prerequisite_ids || skill.prerequisite_ids.length === 0) continue;
      const start = toCanvas(skill.x, skill.y);
      for (const prereqId of skill.prerequisite_ids) {
        const prereq = currentSkills.find((s) => s.id === prereqId);
        if (!prereq) continue;
        const end = toCanvas(prereq.x, prereq.y);

        const isActive = skill.status !== 'locked';
        ctx.strokeStyle = isActive ? COLORS.connectionActive : COLORS.connection;
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.setLineDash(isActive ? [] : [5, 5]);

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        const midX = (start.x + end.x) / 2;
        ctx.bezierCurveTo(midX, start.y, midX, end.y, end.x, end.y);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // Draw particles
    particlesRef.current = particlesRef.current.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life--;

      if (p.life <= 0) return false;

      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
    ctx.globalAlpha = 1;

    // Draw nodes
    for (const skill of currentSkills) {
      const pos = toCanvas(skill.x, skill.y);
      const nodeRadius = Math.max(20, 30 * camera.zoom);
      const isHovered = hoveredNode === skill.id;
      const isSelected = selectedNode === skill.id;

      // Glow for unlocked/mastered
      if (skill.status !== 'locked') {
        const glowRadius = nodeRadius + 8;
        const gradient = ctx.createRadialGradient(
          pos.x, pos.y, nodeRadius,
          pos.x, pos.y, glowRadius
        );
        const color = skill.status === 'mastered' ? COLORS.mastered : COLORS.unlocked;
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);

      if (skill.status === 'locked') {
        ctx.fillStyle = COLORS.locked;
        ctx.strokeStyle = '#555';
      } else if (skill.status === 'mastered') {
        ctx.fillStyle = '#1a1508';
        ctx.strokeStyle = COLORS.mastered;
        ctx.lineWidth = 3;
      } else {
        ctx.fillStyle = '#1a1205';
        ctx.strokeStyle = COLORS.unlocked;
        ctx.lineWidth = 2;
      }

      ctx.fill();
      ctx.stroke();

      // Category accent
      const catColor = (COLORS.categories as any)[skill.category] || COLORS.unlocked;
      if (skill.status !== 'locked') {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, nodeRadius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = catColor + '40';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Icon
      ctx.font = `${Math.max(14, 18 * camera.zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = skill.status === 'locked' ? '#666' : '#fff';
      ctx.fillText(skill.icon, pos.x, pos.y);

      // Name label
      if (camera.zoom > 0.5 || isHovered || isSelected) {
        ctx.font = `${Math.max(10, 12 * camera.zoom)}px Inter, sans-serif`;
        ctx.fillStyle = skill.status === 'locked' ? COLORS.textMuted : COLORS.text;
        ctx.fillText(skill.name, pos.x, pos.y + nodeRadius + 15);
      }

      // XP bar for unlocked skills
      if (skill.status === 'unlocked') {
        const barWidth = nodeRadius * 2;
        const barHeight = 4;
        const barY = pos.y + nodeRadius + 22;
        const xpPercent = Math.min(1, skill.current_xp / skill.max_xp);

        ctx.fillStyle = '#333';
        ctx.fillRect(pos.x - barWidth / 2, barY, barWidth, barHeight);

        ctx.fillStyle = COLORS.unlocked;
        ctx.fillRect(pos.x - barWidth / 2, barY, barWidth * xpPercent, barHeight);
      }

      // Hover/selected highlight
      if (isHovered || isSelected) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, nodeRadius + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [camera, hoveredNode, selectedNode, toCanvas, width, height]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw]);

  // Mouse handlers
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      setCamera((prev) => ({
        ...prev,
        x: cameraStart.current.x + (x - dragStart.current.x),
        y: cameraStart.current.y + (y - dragStart.current.y),
      }));
      return;
    }

    const node = getNodeAtPosition(x, y);
    if (node) {
      setHoveredNode(node.id);
      onNodeHover(node);
      if (canvasRef.current) canvasRef.current.style.cursor = 'pointer';
    } else {
      setHoveredNode(null);
      onNodeHover(null);
      if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const node = getNodeAtPosition(x, y);
    if (node) {
      setSelectedNode(node.id);
      onNodeClick(node);
      if (node.status === 'mastered') {
        const pos = toCanvas(node.x, node.y);
        spawnParticles(pos.x, pos.y, COLORS.mastered);
      }
    } else {
      setIsDragging(true);
      dragStart.current = { x, y };
      cameraStart.current = { ...camera };
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(3, camera.zoom * zoomFactor));

    // Zoom towards mouse position
    const norm = toNormalized(mouseX, mouseY);
    setCamera((prev) => ({
      zoom: newZoom,
      x: mouseX - norm.x * width * newZoom,
      y: mouseY - norm.y * height * newZoom,
    }));
  };

  // Expose camera controls via ref
  useImperativeHandle(ref, () => ({
    zoomIn: () => setCamera(prev => ({ ...prev, zoom: Math.min(3, prev.zoom * 1.3) })),
    zoomOut: () => setCamera(prev => ({ ...prev, zoom: Math.max(0.3, prev.zoom * 0.77) })),
    resetCamera: () => setCamera({ x: 0, y: 0, zoom: 1 }),
    selectNodeByName: (name: string) => {
      const lower = name.toLowerCase();
      const node = skillsRef.current.find(s => s.name.toLowerCase().includes(lower));
      if (node) {
        setSelectedNode(node.id);
        onNodeClick(node);
        setCamera(prev => ({
          ...prev,
          x: width / 2 - node.x * width * prev.zoom,
          y: height / 2 - node.y * height * prev.zoom,
        }));
      }
    },
  }), [onNodeClick, width, height]);

  // Touch handlers
  const touchState = useRef<{ type: 'drag' | 'pinch'; startX: number; startY: number; startDist: number; startZoom: number; camStart: { x: number; y: number } }>({ type: 'drag', startX: 0, startY: 0, startDist: 0, startZoom: 1, camStart: { x: 0, y: 0 } });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;
      const node = getNodeAtPosition(x, y);
      if (node) {
        setSelectedNode(node.id);
        onNodeClick(node);
        return;
      }
      touchState.current = { type: 'drag', startX: t.clientX, startY: t.clientY, startDist: 0, startZoom: camera.zoom, camStart: { ...camera } };
    } else if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      touchState.current = { type: 'pinch', startX: 0, startY: 0, startDist: dist, startZoom: camera.zoom, camStart: { ...camera } };
    }
  }, [camera, getNodeAtPosition, onNodeClick]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && touchState.current.type === 'drag') {
      const t = e.touches[0];
      const dx = t.clientX - touchState.current.startX;
      const dy = t.clientY - touchState.current.startY;
      setCamera(prev => ({ ...prev, x: touchState.current.camStart.x + dx, y: touchState.current.camStart.y + dy }));
    } else if (e.touches.length === 2 && touchState.current.type === 'pinch') {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / touchState.current.startDist;
      const newZoom = Math.max(0.3, Math.min(3, touchState.current.startZoom * scale));
      setCamera(prev => ({ ...prev, zoom: newZoom }));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchState.current.type = 'drag';
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedNode) return;
      const current = skillsRef.current.find((s) => s.id === selectedNode);
      if (!current) return;

      const neighbors = skillsRef.current.filter(
        (s) =>
          s.prerequisite_ids?.includes(selectedNode) ||
          current.prerequisite_ids?.includes(s.id)
      );
      if (neighbors.length === 0) return;

      let next: SkillNode | null = null;
      switch (e.key) {
        case 'ArrowUp':
          next = neighbors.reduce((best, s) =>
            !best || s.y < best.y ? s : best
          , null as SkillNode | null);
          break;
        case 'ArrowDown':
          next = neighbors.reduce((best, s) =>
            !best || s.y > best.y ? s : best
          , null as SkillNode | null);
          break;
        case 'ArrowLeft':
          next = neighbors.reduce((best, s) =>
            !best || s.x < best.x ? s : best
          , null as SkillNode | null);
          break;
        case 'ArrowRight':
          next = neighbors.reduce((best, s) =>
            !best || s.x > best.x ? s : best
          , null as SkillNode | null);
          break;
        case 'Enter':
          onNodeClick(current);
          return;
      }

      if (next) {
        setSelectedNode(next.id);
        const pos = toCanvas(next.x, next.y);
        // Center camera on selected node
        setCamera((prev) => ({
          ...prev,
          x: width / 2 - next!.x * width * prev.zoom,
          y: height / 2 - next!.y * height * prev.zoom,
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, onNodeClick, toCanvas, width, height]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: 8,
        border: '1px solid #2a2a2c',
        background: COLORS.bg,
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'grab',
          display: 'block',
          touchAction: 'none',
        }}
        tabIndex={0}
        aria-label="Interactive skill tree. Use mouse to pan and zoom. Tab to navigate nodes with keyboard."
      />
    </div>
  );
});

export default SkillTreeCanvas;
