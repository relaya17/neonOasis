/**
 * Slow Motion Camera Effect
 * Dramatically slows down and zooms in during critical moments
 */

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface SlowMotionCameraProps {
  active: boolean;
  targetPosition?: [number, number, number];
  duration?: number;
  onComplete?: () => void;
}

export function SlowMotionCamera({
  active,
  targetPosition = [0, 5, 5],
  duration = 2,
  onComplete,
}: SlowMotionCameraProps) {
  const { camera } = useThree();
  // @ts-ignore - THREE types not resolving correctly
  const originalPositionRef = useRef(new THREE.Vector3());
  const isAnimatingRef = useRef(false);
  const progressRef = useRef(0);
  // @ts-ignore - THREE types not resolving correctly
  const targetRef = useRef(new THREE.Vector3());

  useEffect(() => {
    if (active && !isAnimatingRef.current) {
      isAnimatingRef.current = true;
      progressRef.current = 0;
      originalPositionRef.current.copy(camera.position);
      targetRef.current.set(targetPosition[0], targetPosition[1], targetPosition[2]);
    }
  }, [active, camera.position, targetPosition]);

  useFrame((_, delta) => {
    if (!isAnimatingRef.current) return;

    progressRef.current += delta / duration;

    if (progressRef.current >= 1) {
      // Animation complete
      camera.position.copy(originalPositionRef.current);
      isAnimatingRef.current = false;
      if (onComplete) onComplete();
      return;
    }

    // Lerp between original and target (zoom in then out)
    const t = progressRef.current < 0.5 
      ? progressRef.current * 2 // 0 to 1 in first half
      : (1 - progressRef.current) * 2; // 1 to 0 in second half

    camera.position.lerpVectors(originalPositionRef.current, targetRef.current, t * 0.5);
    camera.lookAt(0, 0, 0);
  });

  return null; // This is a controller component, renders nothing
}
