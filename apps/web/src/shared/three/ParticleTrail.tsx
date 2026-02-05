/**
 * Particle Trail Effect
 * Creates a glowing trail behind moving checkers/objects
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleTrailProps {
  position: [number, number, number];
  color?: string;
  active?: boolean;
}

export function ParticleTrail({ position, color = '#00f5d4', active = true }: ParticleTrailProps) {
  // @ts-ignore - THREE types not resolving correctly
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 50;

  // Create particle geometry
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    // @ts-ignore - THREE types not resolving correctly
    const colorObj = new THREE.Color(color);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position[0];
      positions[i * 3 + 1] = position[1];
      positions[i * 3 + 2] = position[2];

      colors[i * 3] = colorObj.r;
      colors[i * 3 + 1] = colorObj.g;
      colors[i * 3 + 2] = colorObj.b;

      sizes[i] = Math.random() * 0.1 + 0.05;
    }

    return { positions, colors, sizes };
  }, [color, position]);

  const geometry = useMemo(() => {
    // @ts-ignore - THREE types not resolving correctly
    const geo = new THREE.BufferGeometry();
    // @ts-ignore - THREE types not resolving correctly
    geo.setAttribute('position', new THREE.BufferAttribute(particles.positions, 3));
    // @ts-ignore - THREE types not resolving correctly
    geo.setAttribute('color', new THREE.BufferAttribute(particles.colors, 3));
    // @ts-ignore - THREE types not resolving correctly
    geo.setAttribute('size', new THREE.BufferAttribute(particles.sizes, 1));
    return geo;
  }, [particles]);

  const material = useMemo(
    () =>
      // @ts-ignore - THREE types not resolving correctly
      new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        // @ts-ignore - THREE types not resolving correctly
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useFrame((state) => {
    if (!particlesRef.current || !active) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < particleCount; i++) {
      // Trail effect: particles lag behind
      const lag = i / particleCount;
      positions[i * 3] = position[0] + Math.sin(time * 2 + i) * 0.05;
      positions[i * 3 + 1] = position[1] - lag * 0.5;
      positions[i * 3 + 2] = position[2] + Math.cos(time * 2 + i) * 0.05;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!active) return null;

  return <points ref={particlesRef} geometry={geometry} material={material} />;
}
