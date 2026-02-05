/**
 * Snapshot Interpolation — PRD: Zero Latency.
 * השרת שולח רק "נקודות ציון" (StateSnapshot); הלקוח משלים אנימציה חלקה ב-60FPS.
 */
import { useRef, useCallback } from 'react';
import type { StateSnapshot } from '@neon-oasis/shared';

const INTERPOLATION_MS = 100;

/** Linear interpolate between two numbers */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Recursively lerp plain objects with number values (one level deep) */
function lerpState(current: unknown, target: unknown, t: number): unknown {
  if (current == null || target == null) return target;
  if (typeof current !== 'object' || typeof target !== 'object') return t >= 1 ? target : current;
  const curr = current as Record<string, unknown>;
  const tgt = target as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(tgt)) {
    const c = curr[key];
    const g = tgt[key];
    if (typeof c === 'number' && typeof g === 'number') {
      out[key] = lerp(c, g, t);
    } else if (t >= 1) {
      out[key] = g;
    } else {
      out[key] = c;
    }
  }
  return out;
}

/**
 * Use snapshot interpolation: given a StateSnapshot and setState,
 * interpolate from current state to snapshot.state over INTERPOLATION_MS.
 * If setState is not provided or state is not lerp-able, applies snapshot at end.
 */
export function useSnapshotInterpolation<T>(
  setState: (state: T) => void,
  getCurrentState: () => T
) {
  const rafRef = useRef<number | null>(null);
  const applySnapshot = useCallback(
    (snapshot: StateSnapshot) => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      const target = snapshot.state as T;
      const start = performance.now();
      const tick = () => {
        const elapsed = performance.now() - start;
        const t = Math.min(1, elapsed / INTERPOLATION_MS);
        const current = getCurrentState();
        const blended = lerpState(current, target, t) as T;
        setState(blended);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [setState, getCurrentState]
  );
  return { applySnapshot };
}
