import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 400;
const COLORS = [0xb8923c, 0xf4d77a, 0xff6622, 0xffaa44];

function EmberParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const mouse = useRef({ x: 0, y: 0 });

  const { positions, velocities, phases } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const phases = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
      velocities[i * 3] = (Math.random() - 0.5) * 0.008;
      velocities[i * 3 + 1] = 0.005 + Math.random() * 0.012;
      velocities[i * 3 + 2] = 0;
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions, velocities, phases };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.055,
      color: 0xb8923c,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const t = clock.getElapsedTime();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      pos[i3] += velocities[i3] + Math.sin(t * 0.5 + phases[i]) * 0.002;
      pos[i3 + 1] += velocities[i3 + 1];
      pos[i3 + 2] += velocities[i3 + 2];

      // Mouse attraction
      const dx = mouse.current.x - pos[i3];
      const dy = mouse.current.y - pos[i3 + 1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 3) {
        pos[i3] += dx * 0.0008;
        pos[i3 + 1] += dy * 0.0008;
      }

      // Reset when off screen
      if (pos[i3 + 1] > 8) {
        pos[i3] = (Math.random() - 0.5) * 20;
        pos[i3 + 1] = -8;
        pos[i3 + 2] = (Math.random() - 0.5) * 5;
      }
      if (pos[i3] > 11) pos[i3] = -11;
      if (pos[i3] < -11) pos[i3] = 11;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 20;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 14;
    }, { passive: true });
  }

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

export default function ForgeBackground() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      opacity: 0.4,
    }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        gl={{ antialias: false, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <EmberParticles />
      </Canvas>
    </div>
  );
}
