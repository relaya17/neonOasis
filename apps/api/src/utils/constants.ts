const DEFAULT_RAKE = 0.15;
let currentRake = DEFAULT_RAKE;

/** Rake (עמלה) — אחוז העמלה של הבית. ניתן לשינוי בזמן אמת מממשק הניהול. */
export function getHouseFeeRate(): number {
  return currentRake;
}

export function setHouseFeeRate(rate: number): void {
  if (rate >= 0 && rate <= 1) currentRake = rate;
}

export const HOUSE_FEE_RATE = DEFAULT_RAKE; // legacy; use getHouseFeeRate()
