import type { CSSProperties } from 'react';

/**
 * סגנון אחיד לווידאו רספונסיבי — מכסה את האזור בכל גודל מסך (מובייל, טאבלט, דסקטופ)
 */
export const responsiveVideoStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  minWidth: '100%',
  minHeight: '100%',
  objectFit: 'cover',
  objectPosition: 'center',
};

/** לווידאו במסך מלא (fixed overlay) */
export const fullScreenVideoStyle: CSSProperties = {
  ...responsiveVideoStyle,
  position: 'fixed',
  inset: 0,
};
