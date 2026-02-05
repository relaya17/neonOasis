const REF_KEY = 'neon-oasis-ref';

export function getPendingReferralInviterId(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    try {
      localStorage.setItem(REF_KEY, ref);
    } catch {
      // ignore
    }
    return ref;
  }
  try {
    const stored = localStorage.getItem(REF_KEY);
    return stored;
  } catch {
    return null;
  }
}

export function clearPendingReferral(): void {
  try {
    localStorage.removeItem(REF_KEY);
  } catch {
    // ignore
  }
}

/** Call API to claim referral bonus if user came via ref link. */
export async function claimReferralIfPending(referredId: string): Promise<void> {
  const inviterId = getPendingReferralInviterId();
  if (!inviterId || inviterId === referredId) return;
  const base = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : '';
  try {
    const res = await fetch(`${base}/api/referral/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviterId, referredId }),
    });
    if (res.ok) clearPendingReferral();
  } catch {
    // ignore
  }
}
