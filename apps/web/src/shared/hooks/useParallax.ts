/**
 * Parallax — צ'יפ ארנק הולוגרפי שזז עם תנועת העכבר/מכשיר (Cyber-Vegas 2.0).
 */
import { useState, useCallback, useEffect } from 'react';

const TILT_MAX = 12; // degrees
const SMOOTH = 0.15;

export function useParallax() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = ((e.clientX - centerX) / rect.width) * TILT_MAX;
    const y = ((e.clientY - centerY) / rect.height) * -TILT_MAX;
    setTilt((prev) => ({
      x: prev.x + (x - prev.x) * SMOOTH,
      y: prev.y + (y - prev.y) * SMOOTH,
    }));
  }, []);

  const onMouseLeave = useCallback(() => {
    setTilt((prev) => ({ x: prev.x * 0.7, y: prev.y * 0.7 }));
  }, []);

  useEffect(() => {
    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      const y = Math.max(-TILT_MAX, Math.min(TILT_MAX, (e.beta - 45) * 0.3));
      const x = Math.max(-TILT_MAX, Math.min(TILT_MAX, e.gamma * 0.3));
      setTilt((prev) => ({
        x: prev.x + (x - prev.x) * SMOOTH,
        y: prev.y + (y - prev.y) * SMOOTH,
      }));
    };
    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleDeviceOrientation, true);
      return () => window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
    }
  }, []);

  return { tilt, onMouseMove, onMouseLeave };
}
