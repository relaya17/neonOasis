/**
 * גיאומטריית הלוח — מיקומי נקודות (0–23) וחישוב נקודת יעד מגרירה.
 * משותף ל-BoardPlane, DraggableChecker ו-MoveIndicator.
 */

export function getPointPosition(pointIndex: number): { x: number; z: number; isBottom: boolean; isRight: boolean } {
  let quadrant: number, localIdx: number;
  if (pointIndex <= 5) {
    quadrant = 0;
    localIdx = pointIndex;
  } else if (pointIndex <= 11) {
    quadrant = 1;
    localIdx = pointIndex - 6;
  } else if (pointIndex <= 17) {
    quadrant = 2;
    localIdx = pointIndex - 12;
  } else {
    quadrant = 3;
    localIdx = pointIndex - 18;
  }
  const isBottom = quadrant === 0 || quadrant === 1;
  const isRight = quadrant === 0 || quadrant === 3;
  const xBase = isRight ? 1.2 : -7.2;
  const x = xBase + (isRight ? localIdx : (5 - localIdx)) * 1.02;
  const z = isBottom ? 6.2 : -6.2;
  return { x, z, isBottom, isRight };
}

const CHECKER_HEIGHT = 0.16;

/** מרכז נקודה (להצגת MoveIndicator) */
export function getPointCenter(pointIndex: number): [number, number, number] {
  const { x, z } = getPointPosition(pointIndex);
  return [x, 0.05, z];
}

/** מיקום דאמה על הלוח: נקודה + מקום בערימה */
export function getCheckerPosition(
  pointIndex: number,
  checkerIndex: number,
  totalInPoint: number
): [number, number, number] {
  const { x, z, isBottom } = getPointPosition(pointIndex);
  const zOff = isBottom ? -checkerIndex * CHECKER_HEIGHT * 2.6 : checkerIndex * CHECKER_HEIGHT * 2.6;
  const y = 0.05 + checkerIndex * CHECKER_HEIGHT * 2.2;
  if (checkerIndex > 4) {
    const stackY = (checkerIndex - 5) * 0.25;
    return [x, y + stackY, z + zOff * 0.5];
  }
  return [x, y, z + zOff * 0.5];
}

/** מיקום כלים על ה-Bar (לאכילה) */
export function getBarPosition(player: 0 | 1, index: number): [number, number, number] {
  const zSign = player === 0 ? 1 : -1;
  return [0, 0.2 + index * 0.25, zSign * (2 + index * 0.3)];
}

/** מחזיר את אינדקס הנקודה (0–23) הכי קרוב ל-(x, z), או null אם מחוץ ללוח */
export function calculateTargetPoint(x: number, z: number): number | null {
  let bestIndex = 0;
  let bestDist = Infinity;
  for (let i = 0; i < 24; i++) {
    const [px, , pz] = getPointCenter(i);
    const d = (x - px) ** 2 + (z - pz) ** 2;
    if (d < bestDist) {
      bestDist = d;
      bestIndex = i;
    }
  }
  if (bestDist > 4) return null;
  return bestIndex;
}

/** האם המיקום (x,z) באזור הוצאת כלים (bear off) לשחקן? */
export function isInBearOffZone(x: number, z: number, player: 0 | 1): boolean {
  if (player === 0) return z > 7.5;
  return z < -7.5;
}
