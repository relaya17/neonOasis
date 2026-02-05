import { useCallback, useEffect, useState } from 'react';
import type { RootState } from '@react-three/fiber';

/**
 * Tracks WebGL context loss for a single canvas.
 * Use onCanvasCreated with <Canvas onCreated={...} />.
 */
export function useWebGLContextLoss() {
  const [webglLost, setWebglLost] = useState(false);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  const onCanvasCreated = useCallback((state: RootState) => {
    setCanvas(state.gl.domElement);
  }, []);

  useEffect(() => {
    if (!canvas) return;

    const onLost = (e: Event) => {
      e.preventDefault();
      setWebglLost(true);
    };
    const onRestored = () => setWebglLost(false);

    canvas.addEventListener('webglcontextlost', onLost as EventListener, false);
    canvas.addEventListener('webglcontextrestored', onRestored as EventListener, false);

    return () => {
      canvas.removeEventListener('webglcontextlost', onLost as EventListener);
      canvas.removeEventListener('webglcontextrestored', onRestored as EventListener);
    };
  }, [canvas]);

  return { webglLost, onCanvasCreated };
}
