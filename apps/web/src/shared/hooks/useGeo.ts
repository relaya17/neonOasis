/**
 * Geo-Fencing — Play for Coins / Play for Fun (App Store Compliance).
 * GET /api/geo מחזיר playForCoinsAllowed; אם false — להציג "Play for Fun" בלבד.
 */
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? '';

export interface GeoInfo {
  country?: string;
  skillOnly?: boolean;
  playForCoinsAllowed: boolean;
}

let cached: GeoInfo | null = null;

export function useGeo(): GeoInfo {
  const [info, setInfo] = useState<GeoInfo>(() => cached ?? { playForCoinsAllowed: true });

  useEffect(() => {
    if (cached) {
      setInfo(cached);
      return;
    }
    fetch(`${API_URL}/api/geo`)
      .then((r) => r.json())
      .then((data: GeoInfo) => {
        cached = { playForCoinsAllowed: data.playForCoinsAllowed !== false, country: data.country, skillOnly: data.skillOnly };
        setInfo(cached);
      })
      .catch(() => setInfo({ playForCoinsAllowed: true }));
  }, []);

  return info;
}
