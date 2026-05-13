import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraphData } from '../lib/types';

interface Props {
  data: GraphData;
  width?: number;
  height?: number;
}

interface Node {
  id: string;
  label: string;
  group: string;
  val: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Link {
  source: string;
  target: string;
}

const NODE_COLORS: Record<string, string> = {
  note: '#b8923c',
  link: '#60a5fa',
  tag: '#34d399',
  default: '#c4c4ca',
};

export default function ObsidianGraph({ data, width = 800, height = 500 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const animRef = useRef<number>(0);
  const draggingRef = useRef<string | null>(null);

  useEffect(() => {
    if (!data.nodes.length) return;

    const nodes: Node[] = data.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      group: n.group || 'note',
      val: n.val || 1,
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0,
    }));

    nodesRef.current = nodes;

    const links: Link[] = data.links.map((l) => ({
      source: l.source,
      target: l.target,
    }));

    let running = true;
    const ITERATIONS = 300;
    let tick = 0;

    function simulate() {
      if (!running) return;
      const alpha = Math.max(0.01, 1 - tick / ITERATIONS);
      tick++;

      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (200 * alpha) / dist;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodes[i].vx -= fx;
          nodes[i].vy -= fy;
          nodes[j].vx += fx;
          nodes[j].vy += fy;
        }
      }

      // Attraction along links
      for (const link of links) {
        const s = nodes.find((n) => n.id === link.source);
        const t = nodes.find((n) => n.id === link.target);
        if (s && t) {
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist * alpha) / 50;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          s.vx += fx;
          s.vy += fy;
          t.vx -= fx;
          t.vy -= fy;
        }
      }

      // Center gravity
      for (const n of nodes) {
        n.vx += (width / 2 - n.x) * 0.01 * alpha;
        n.vy += (height / 2 - n.y) * 0.01 * alpha;
      }

      // Apply velocity + damping
      for (const n of nodes) {
        n.vx *= 0.9;
        n.vy *= 0.9;
        if (!draggingRef.current || draggingRef.current !== n.id) {
          n.x += n.vx;
          n.y += n.vy;
        }
        // Bounds
        n.x = Math.max(20, Math.min(width - 20, n.x));
        n.y = Math.max(20, Math.min(height - 20, n.y));
      }

      draw();

      if (tick < ITERATIONS) {
        animRef.current = requestAnimationFrame(simulate);
      } else {
        animRef.current = requestAnimationFrame(idleLoop);
      }
    }

    function idleLoop() {
      if (!running) return;
      for (const n of nodes) {
        n.vx *= 0.95;
        n.vy *= 0.95;
        if (!draggingRef.current || draggingRef.current !== n.id) {
          n.x += n.vx;
          n.y += n.vy;
        }
        n.x = Math.max(20, Math.min(width - 20, n.x));
        n.y = Math.max(20, Math.min(height - 20, n.y));
      }
      draw();
      animRef.current = requestAnimationFrame(idleLoop);
    }

    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      // Links
      for (const link of links) {
        const s = nodes.find((n) => n.id === link.source);
        const t = nodes.find((n) => n.id === link.target);
        if (s && t) {
          const isHighlighted = hovered === s.id || hovered === t.id || selected === s.id || selected === t.id;
          ctx.strokeStyle = isHighlighted ? '#b8923c80' : '#2a2a2c';
          ctx.lineWidth = isHighlighted ? 2 : 1;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(t.x, t.y);
          ctx.stroke();
        }
      }

      // Nodes
      for (const n of nodes) {
        const isHovered = hovered === n.id;
        const isSelected = selected === n.id;
        const r = 4 + n.val * 3 + (isHovered || isSelected ? 4 : 0);
        const color = NODE_COLORS[n.group] || NODE_COLORS.default;

        // Glow
        if (isHovered || isSelected) {
          const glow = ctx.createRadialGradient(n.x, n.y, r * 0.5, n.x, n.y, r * 3);
          glow.addColorStop(0, color + '60');
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Circle
        ctx.fillStyle = isSelected ? '#fff' : color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Label
        if (isHovered || isSelected || n.val >= 3) {
          ctx.fillStyle = '#c4c4ca';
          ctx.font = `600 ${isHovered || isSelected ? 13 : 10}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(n.label.slice(0, 30), n.x, n.y + r + 14);
        }
      }
    }

    simulate();

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [data, width, height]);

  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);

    if (draggingRef.current) {
      const n = nodesRef.current.find((n) => n.id === draggingRef.current);
      if (n) {
        n.x = pos.x;
        n.y = pos.y;
      }
      return;
    }

    let found: string | null = null;
    for (const n of nodesRef.current) {
      const r = 4 + n.val * 3;
      const dx = pos.x - n.x;
      const dy = pos.y - n.y;
      if (dx * dx + dy * dy < r * r * 1.5) {
        found = n.id;
        break;
      }
    }
    setHovered(found);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    for (const n of nodesRef.current) {
      const r = 4 + n.val * 3;
      const dx = pos.x - n.x;
      const dy = pos.y - n.y;
      if (dx * dx + dy * dy < r * r * 2) {
        draggingRef.current = n.id;
        setSelected(n.id);
        return;
      }
    }
    setSelected(null);
  };

  const handleMouseUp = () => {
    draggingRef.current = null;
  };

  const selectedNode = selected ? nodesRef.current.find((n) => n.id === selected) : null;

  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid #2a2a2c' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setHovered(null); draggingRef.current = null; }}
        style={{ width: '100%', height, cursor: hovered ? 'pointer' : 'grab', display: 'block' }}
      />

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        style={{ position: 'absolute', top: 12, left: 12, padding: '0.5rem 0.75rem', background: '#0a0a0cee', border: '1px solid #2a2a2c', borderRadius: 8, fontSize: '0.75rem', color: '#888' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: NODE_COLORS.note }} />
          Notes
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: NODE_COLORS.link }} />
          Linked
        </div>
      </motion.div>

      {/* Selected node info */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{ position: 'absolute', bottom: 12, left: 12, right: 12, padding: '0.75rem 1rem', background: '#0a0a0cee', border: '1px solid #b8923c40', borderRadius: 10 }}
          >
            <p style={{ margin: 0, color: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>{selectedNode.label}</p>
            <p style={{ margin: '0.25rem 0 0', color: '#888', fontSize: '0.75rem' }}>{selectedNode.id}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
