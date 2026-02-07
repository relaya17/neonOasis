import { useEffect, useRef } from 'react';
import { useApiStatusStore } from '../store/apiStatus';

const HEALTH_URL = '/api/health';
const DEFAULT_POLL_MS = 15000;
const MAX_POLL_MS = 60000;
const BACKOFF_MULTIPLIER = 1.5;

async function checkHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(HEALTH_URL, { signal });
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({}));
    return data?.ok === true;
  } catch {
    return false;
  }
}

/** Polls API health; backs off when API is down to avoid console spam (500/connection errors). */
export function useApiStatus(pollMs = DEFAULT_POLL_MS) {
  const setOnline = useApiStatusStore((s) => s.setOnline);
  const currentInterval = useRef(pollMs);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const ok = await checkHealth(controller.signal);
      clearTimeout(timeout);
      if (mounted) {
        setOnline(ok);
        if (ok) currentInterval.current = pollMs;
        else currentInterval.current = Math.min(
          Math.round(currentInterval.current * BACKOFF_MULTIPLIER),
          MAX_POLL_MS
        );
      }
      const next = mounted ? currentInterval.current : pollMs;
      timer = setTimeout(tick, next);
    };

    tick();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [pollMs, setOnline]);
}
