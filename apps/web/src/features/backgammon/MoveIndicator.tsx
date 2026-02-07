/**
 * אינדיקטור למהלך חוקי — משולש זוהר מעל נקודה שאליה מותר להניח כלי.
 */

import React from 'react';
import { spreadMaterialProps } from '../../types/r3f-materials';

const NEON_CYAN = '#00f5d4';

interface MoveIndicatorProps {
  position: [number, number, number];
  isTargeted?: boolean;
}

export function MoveIndicator({ position, isTargeted = true }: MoveIndicatorProps) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <coneGeometry args={[0.5, 1.2, 3]} />
      <meshStandardMaterial
        {...spreadMaterialProps({
          color: isTargeted ? NEON_CYAN : '#ffffff',
          emissive: isTargeted ? NEON_CYAN : '#ffffff',
          emissiveIntensity: 1.2,
          transparent: true,
          opacity: 0.35,
        })}
      />
    </mesh>
  );
}
