/** אחוז העמלה (Rake) — ניתן לשינוי מהדשבורד */
let rakeRate = 0.15;

export function getRakeRate(): number {
  return rakeRate;
}

export function setRakeRate(rate: number): number {
  const clamped = Math.max(0, Math.min(1, rate));
  rakeRate = clamped;
  return rakeRate;
}
