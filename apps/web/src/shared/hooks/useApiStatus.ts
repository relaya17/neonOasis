import { useEffect, useRef } from 'react';
import { useApiStatusStore } from '../store/apiStatus';

const HEALTH_URL = '/api/health';
/** כשהשרת מחובר — בדיקה כל 10 שניות */
const POLL_WHEN_ONLINE_MS = 10000;
/** כשהשרת down — מרווח ארוך כדי לא להציף קונסול ב-500 */
const POLL_WHEN_OFFLINE_MS = 30000;
const INITIAL_DELAY_MS = 2000;

const isDevBypass = () =>
  typeof import.meta !== 'undefined' &&
  import.meta.env?.DEV &&
  (import.meta.env as { VITE_DEV_BYPASS_API?: string }).VITE_DEV_BYPASS_API === 'true';

/**
 * בודק אם ה-API חי. כש-online — כל 10s, כש-offline — כל 30s (פחות 500 בקונסול).
 * ב-dev: VITE_DEV_BYPASS_API=true — לא קוראים ל-API ומסמנים online=true (משחרר את הלובי).
 */
export function useApiStatus() {
  const setOnline = useApiStatusStore((s) => s.setOnline);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isDevBypass()) {
      setOnline(true);
      return;
    }

    const run = async () => {
      try {
        const res = await fetch(HEALTH_URL);
        const ok = res.ok;
        setOnline(ok);
        timeoutRef.current = setTimeout(run, ok ? POLL_WHEN_ONLINE_MS : POLL_WHEN_OFFLINE_MS);
      } catch {
        setOnline(false);
        timeoutRef.current = setTimeout(run, POLL_WHEN_OFFLINE_MS);
      }
    };

    const first = setTimeout(run, INITIAL_DELAY_MS);

    return () => {
      clearTimeout(first);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [setOnline]);
}
