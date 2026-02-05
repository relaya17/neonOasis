import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';

interface GameSceneProps {
  type: string;
  isActive: boolean;
}

export function GameScene({ type, isActive }: GameSceneProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current && isActive) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  const color = isActive ? '#00f5d4' : '#333';
  const scale = isActive ? 1.2 : 0.8;

  return (
    <mesh ref={meshRef} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      {/* @ts-ignore - R3F material props type issue */}
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isActive ? 0.3 : 0} />
    </mesh>
  );
}
