import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';

interface Scene3DProps {
  children: React.ReactNode;
}

/** React Three Fiber canvas — GLB models, rigging; Suspense for smooth load */
export function Scene3D({ children }: Scene3DProps) {
  return (
    <Suspense fallback={<div>Loading 3D...</div>}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        {children}
      </Canvas>
    </Suspense>
  );
}
