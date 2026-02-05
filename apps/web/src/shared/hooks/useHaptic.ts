/**
 * Cyber-Vegas 2.0 UX: Haptic Feedback (רטט חכם).
 * כשקוביות פוגעות בלוח או קלף מחולק — רטט קטן ומדויק (משחק פיזי).
 */

export function triggerHaptic(pattern: number | number[] = [10, 50, 10]): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore
  }
}

/** קליק קצר — למטבע / כפתור */
export function hapticClick(): void {
  triggerHaptic(10);
}

/** "ניחוח" — קובייה נחתה / קלף חולק */
export function hapticLand(): void {
  triggerHaptic([10, 50, 10]);
}

/** ניצחון — סדרה ארוכה יותר */
export function hapticWin(): void {
  triggerHaptic([20, 30, 20, 30, 50]);
}
