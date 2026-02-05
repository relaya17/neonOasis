import React, { useEffect, useRef } from 'react';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import type { Mesh } from 'three';

const NEON_CYAN = '#00f5d4';
const NEON_PINK = '#f72585';

/** רוטציה (א Euler) כך שהפאה עם המספר value תהיה למעלה (+Y). קוביה סטנדרטית: 1 מול 6, 2 מול 5, 3 מול 4 */
// @ts-ignore - THREE types not resolving correctly
function eulerForFace(value: number): THREE.Euler {
  const [x, y, z] = (() => {
    switch (value) {
      case 1: return [0, 0, 0];
      case 6: return [Math.PI, 0, 0];
      case 2: return [-Math.PI / 2, 0, 0];
      case 5: return [Math.PI / 2, 0, 0];
      case 3: return [0, 0, -Math.PI / 2];
      case 4: return [0, 0, Math.PI / 2];
      default: return [0, 0, 0];
    }
  })();
  // @ts-ignore - THREE types not resolving correctly
  return new THREE.Euler(x, y, z);
}

interface DiceProps {
  position: [number, number, number];
  value: number;
  /** כשמועבר מהשרת — אחרי גלגול קצר הקוביה "נוחתת" על הפאה הנכונה */
  serverResult?: number;
}

/** קוביה עם פיזיקה — מתגלגלת, ניאון. עם serverResult הקוביה נוחתת על הערך מהשרת (RNG) */
export function Dice({ position, value, serverResult }: DiceProps) {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position,
    args: [0.4, 0.4, 0.4],
    restitution: 0.3,
    friction: 0.8,
  }));

  const initialImpulse = useRef(false);
  useEffect(() => {
    if (initialImpulse.current) return;
    initialImpulse.current = true;
    api.velocity.set(
      (Math.random() - 0.5) * 4,
      -(8 + Math.random() * 4),
      (Math.random() - 0.5) * 4
    );
    api.angularVelocity.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    );
  }, [api]);

  // RNG מהשרת: אחרי ~1.2s מכריחים את הקוביה להציג את serverResult
  const resultToApply = serverResult ?? value;
  useEffect(() => {
    if (resultToApply < 1 || resultToApply > 6) return;
    const t = setTimeout(() => {
      // @ts-ignore - THREE types not resolving correctly
      const q = new THREE.Quaternion().setFromEuler(eulerForFace(resultToApply));
      api.quaternion.set(q.x, q.y, q.z, q.w);
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
    }, 1200);
    return () => clearTimeout(t);
  }, [api, resultToApply]);

  return (
    <mesh ref={ref as React.RefObject<Mesh>} castShadow>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial
        // @ts-ignore - R3F material props type issue
        color={value % 2 === 0 ? NEON_CYAN : NEON_PINK}
        emissive={value % 2 === 0 ? NEON_CYAN : NEON_PINK}
        emissiveIntensity={0.9}
        roughness={0.15}
        metalness={0.4}
      />
    </mesh>
  );
}
