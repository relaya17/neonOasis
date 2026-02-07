/**
 * Base URL for API requests.
 * In dev we use '' so requests go to same origin and Vite proxy forwards to the API (avoids ERR_CONNECTION_REFUSED to :4000).
 * In production use VITE_API_URL when set.
 */
export const getApiBase = (): string =>
  typeof import.meta !== 'undefined' && import.meta.env?.DEV
    ? ''
    : (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_API_URL as string)) || '';
