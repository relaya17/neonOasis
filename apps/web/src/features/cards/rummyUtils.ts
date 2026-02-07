export type RummyColor = '#e53935' | '#1e88e5' | '#43a047' | '#fb8c00';

export interface Tile {
  number: number;
  color: RummyColor;
  id: string;
}

const COLORS: RummyColor[] = ['#e53935', '#1e88e5', '#43a047', '#fb8c00'];
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;
const COPIES = 2;

export function createTiles(): Tile[] {
  const tiles: Tile[] = [];
  COLORS.forEach((color) => {
    NUMBERS.forEach((num) => {
      for (let c = 0; c < COPIES; c++) {
        tiles.push({
          number: num,
          color,
          id: `${num}-${color}-${c}-${Math.random().toString(36).slice(2, 9)}`,
        });
      }
    });
  });
  return tiles;
}

export function shuffleTiles<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function dealTiles(pool: Tile[], count: number): { drawn: Tile[]; rest: Tile[] } {
  return { drawn: pool.slice(0, count), rest: pool.slice(count) };
}

/** קבוצה תקנית: 3–4 אבנים עם אותו מספר, צבעים שונים */
export function isValidSet(tiles: Tile[]): boolean {
  if (tiles.length < 3 || tiles.length > 4) return false;
  const num = tiles[0].number;
  const colors = new Set(tiles.map((t) => t.color));
  return tiles.every((t) => t.number === num) && colors.size === tiles.length;
}

/** סדרה תקנית: 3+ אבנים באותו צבע, מספרים עוקבים */
export function isValidRun(tiles: Tile[]): boolean {
  if (tiles.length < 3) return false;
  const color = tiles[0].color;
  const sorted = [...tiles].sort((a, b) => a.number - b.number);
  if (!sorted.every((t) => t.color === color)) return false;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].number !== sorted[i - 1].number + 1) return false;
  }
  return true;
}

export function isValidGroup(tiles: Tile[]): boolean {
  return isValidSet(tiles) || isValidRun(tiles);
}
