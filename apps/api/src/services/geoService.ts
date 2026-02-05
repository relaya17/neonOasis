/**
 * Geo-Fencing stub — IP → country (Israel = skill-based games only).
 * Production: use GeoIP DB (e.g. maxmind) or API.
 */

/** Extract client IP from request (x-forwarded-for, x-real-ip, socket). */
export function getClientIp(req: { headers: Record<string, string | string[] | undefined>; ip?: string }): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0] : Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return first?.trim() ?? null;
  }
  const real = req.headers['x-real-ip'];
  const realIp = Array.isArray(real) ? real[0] : real;
  if (realIp) return realIp;
  return req.ip ?? null;
}

/** Stub: return country code. Set GEO_STUB_COUNTRY=IL for testing Israel. */
export function getCountryFromIp(ip: string | null): string {
  const stub = process.env.GEO_STUB_COUNTRY;
  if (stub) return stub.toUpperCase().slice(0, 2);
  // Stub: no real GeoIP — default to US. Replace with maxmind/lookup in production.
  if (!ip || ip === '127.0.0.1' || ip === '::1') return 'US';
  return 'US';
}

/** Whether this country should see skill-based games only (Israel). */
export function isSkillOnlyCountry(country: string): boolean {
  return country === 'IL';
}

/** מדינות שבהן "Play for Coins" אסור — הכפתור הופך ל-"Play for Fun" (Geo-Fencing). */
const RESTRICTED_COUNTRIES = new Set(
  (process.env.GEO_RESTRICTED_COUNTRIES ?? '').split(',').map((c) => c.trim().toUpperCase()).filter(Boolean)
);

export function isPlayForCoinsAllowed(country: string): boolean {
  return !RESTRICTED_COUNTRIES.has(country);
}
