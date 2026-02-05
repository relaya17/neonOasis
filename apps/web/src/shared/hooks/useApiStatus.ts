import { useEffect } from 'react';
import { useApiStatusStore } from '../store/apiStatus';

const HEALTH_URL = '/api/health';
const DEFAULT_POLL_MS = 15000;

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

/** Polls API health so UI can degrade gracefully when API is down. */
export function useApiStatus(pollMs = DEFAULT_POLL_MS) {
  const setOnline = useApiStatusStore((s) => s.setOnline);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const ok = await checkHealth(controller.signal);
      clearTimeout(timeout);
      if (mounted) setOnline(ok);
      timer = setTimeout(tick, pollMs);
    };

    tick();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [pollMs, setOnline]);
}
