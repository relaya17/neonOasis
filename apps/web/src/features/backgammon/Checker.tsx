/**
 * דאמה (Checker) עם אנימציית תנועה קשתית (Arc) חלקה — Lerp + גובה באוויר.
 * נועד לחוויית פרימיום: הכלי "נע באוויר" ולא קופץ ממקום למקום.
 */

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { spreadMaterialProps } from '../../types/r3f-materials';

const LERP_FACTOR = 5;
const ARC_HEIGHT_SCALE = 0.9;
const MIN_DISTANCE = 0.005;

interface CheckerProps {
  /** מיקום יעד [x, y, z] */
  position: [number, number, number];
  color: string;
  isNeon?: boolean;
}

export function Checker({ position, color, isNeon = true }: CheckerProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const currentPos = useRef(new THREE.Vector3(position[0], position[1], position[2]));
  const targetPos = useRef(new THREE.Vector3(position[0], position[1], position[2]));

  useEffect(() => {
    targetPos.current.set(position[0], position[1], position[2]);
  }, [position[0], position[1], position[2]]);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    targetPos.current.set(position[0], position[1], position[2]);
    const cur = currentPos.current;
    const distance = cur.distanceTo(targetPos.current);

    if (distance > MIN_DISTANCE) {
      cur.lerp(targetPos.current, Math.min(1, delta * LERP_FACTOR));
      const arcHeight = ARC_HEIGHT_SCALE * Math.sin(Math.min(1, distance) * Math.PI);
      const yWithArc = cur.y + arcHeight;
      meshRef.current.position.set(cur.x, yWithArc, cur.z);
    } else {
      cur.copy(targetPos.current);
      meshRef.current.position.copy(targetPos.current);
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <cylinderGeometry args={[0.36, 0.36 * 0.96, 0.16, 32]} />
      <meshStandardMaterial
        {...spreadMaterialProps({
          color,
          emissive: isNeon ? color : '#000000',
          emissiveIntensity: isNeon ? 0.5 : 0,
          metalness: 0.8,
          roughness: 0.2,
        })}
      />
    </mesh>
  );
}
