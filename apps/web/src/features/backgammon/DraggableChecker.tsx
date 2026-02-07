/**
 * דאמה ניתנת לגרירה — Raycasting למישור גרירה, הצמדה ליעד חוקי, onMove ב־שחרור.
 */

import React, { useState, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useBackgammonStore } from './store';
import { getLegalMoves } from '@neon-oasis/shared';
import { calculateTargetPoint, isInBearOffZone } from './backgammonBoardGeometry';
import { spreadMaterialProps } from '../../types/r3f-materials';
import { playSound } from '../../shared/audio';

const DRAG_PLANE_Y = 0.5;
const DRAG_HEIGHT = 1.0;
const LERP_SPEED = 0.2;
const BOARD_X_MIN = -7;
const BOARD_X_MAX = 7;
const BOARD_Z_MIN = -9;
const BOARD_Z_MAX = 9;

interface DraggableCheckerProps {
  pointIndex: number;
  checkerIndex: number;
  totalInPoint: number;
  position: [number, number, number];
  color: string;
  onMove: (from: number | 'bar', to: number | 'off') => void;
}

export function DraggableChecker({
  pointIndex,
  checkerIndex,
  totalInPoint,
  position,
  color,
  onMove,
}: DraggableCheckerProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [isDragging, setIsDragging] = useState(false);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -DRAG_PLANE_Y));
  const intersectPoint = useRef(new THREE.Vector3());
  const state = useBackgammonStore((s) => s.state);
  const setDragging = useBackgammonStore((s) => s.setDragging);
  const legalMovesForSelected = useBackgammonStore((s) => s.legalMovesForSelected);
  const { camera, raycaster, mouse, gl } = useThree();
  const restPosition = useRef(new THREE.Vector3(position[0], position[1], position[2]));

  const updateRestPosition = useCallback(() => {
    restPosition.current.set(position[0], position[1], position[2]);
  }, [position[0], position[1], position[2]]);
  updateRestPosition();

  const handlePointerDown = useCallback(
    (e: { stopPropagation: () => void; pointerId: number }) => {
      e.stopPropagation();
      gl.domElement.setPointerCapture(e.pointerId);
      setIsDragging(true);
      playSound('neon_click');
      const moves = getLegalMoves(state);
      const targets = moves
        .filter((m) => m.from === pointIndex)
        .map((m) => m.to) as (number | 'off')[];
      setDragging(pointIndex, targets);
    },
    [state, pointIndex, setDragging, gl.domElement]
  );

  const handlePointerUp = useCallback(
    (e: { stopPropagation: () => void; pointerId: number }) => {
      e.stopPropagation();
      gl.domElement.releasePointerCapture(e.pointerId);
      setIsDragging(false);
      setDragging(null, []);

      const mesh = meshRef.current;
      if (!mesh) return;
      const finalX = mesh.position.x;
      const finalZ = mesh.position.z;
      const targetPoint = calculateTargetPoint(finalX, finalZ);
      const player = state.turn;

      if (targetPoint !== null && legalMovesForSelected.includes(targetPoint)) {
        onMove(pointIndex, targetPoint);
        playSound('neon_click');
        return;
      }
      if (legalMovesForSelected.includes('off') && isInBearOffZone(finalX, finalZ, player)) {
        onMove(pointIndex, 'off');
        playSound('neon_click');
        return;
      }
      playSound('lose');
    },
    [legalMovesForSelected, state.turn, pointIndex, onMove, setDragging, gl.domElement]
  );

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    if (isDragging) {
      raycaster.setFromCamera(mouse, camera);
      if (raycaster.ray.intersectPlane(dragPlane.current, intersectPoint.current)) {
        const x = THREE.MathUtils.clamp(intersectPoint.current.x, BOARD_X_MIN, BOARD_X_MAX);
        const z = THREE.MathUtils.clamp(intersectPoint.current.z, BOARD_Z_MIN, BOARD_Z_MAX);
        meshRef.current.position.set(x, DRAG_HEIGHT, z);
      }
    } else {
      restPosition.current.set(position[0], position[1], position[2]);
      meshRef.current.position.lerp(restPosition.current, Math.min(1, LERP_SPEED * 60 * delta));
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[position[0], position[1], position[2]]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[0.36, 0.36 * 0.96, 0.16, 32]} />
      <meshStandardMaterial
        {...spreadMaterialProps({
          color,
          emissive: color,
          emissiveIntensity: isDragging ? 0.8 : 0.5,
          metalness: 0.8,
          roughness: 0.2,
        })}
      />
    </mesh>
  );
}
