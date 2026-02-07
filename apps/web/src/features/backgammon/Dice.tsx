import React, { useEffect } from 'react';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { spreadMaterialProps } from '../../types/r3f-materials';

const NEON_CYAN = '#00f5d4';
const NEON_PINK = '#f72585';

function eulerForFace(value: number) {
  switch (value) {
    case 1: return new THREE.Euler(0, 0, 0);
    case 6: return new THREE.Euler(Math.PI, 0, 0);
    case 2: return new THREE.Euler(-Math.PI / 2, 0, 0);
    case 5: return new THREE.Euler(Math.PI / 2, 0, 0);
    case 3: return new THREE.Euler(0, 0, -Math.PI / 2);
    case 4: return new THREE.Euler(0, 0, Math.PI / 2);
    default: return new THREE.Euler(0, 0, 0);
  }
}

export function Dice({ position, value }: { position: [number, number, number], value: number }) {
  const [ref, api] = useBox(() => ({
    mass: 1.2,
    position,
    args: [0.5, 0.5, 0.5],
    restitution: 0.4,
  }));

  useEffect(() => {
    // גלגול ראשוני
    api.velocity.set((Math.random() - 0.5) * 4, 5, (Math.random() - 0.5) * 4);
    api.angularVelocity.set(Math.random() * 10, Math.random() * 10, Math.random() * 10);

    // נחיתה מדויקת אחרי 1.5 שניות
    const timer = setTimeout(() => {
      const q = new THREE.Quaternion().setFromEuler(eulerForFace(value));
      api.quaternion.set(q.x, q.y, q.z, q.w);
      api.angularVelocity.set(0, 0, 0);
    }, 1500);
    return () => clearTimeout(timer);
  }, [value, api]);

  return (
    <mesh ref={ref as React.RefObject<unknown>} castShadow>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial
        {...spreadMaterialProps({
          color: value % 2 === 0 ? NEON_CYAN : NEON_PINK,
          emissive: value % 2 === 0 ? NEON_CYAN : NEON_PINK,
          emissiveIntensity: 1.2,
          metalness: 0.8,
          roughness: 0.1,
        })}
      />
    </mesh>
  );
}