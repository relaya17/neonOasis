/**
 * Poker utilities — hand ranking for Texas Hold'em
 */

import type { Card } from './deck';

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const POKER_VAL: Record<string, number> = {};
RANKS.forEach((r, i) => { POKER_VAL[r] = i + 2; }); // 2=2 .. A=14

export function pokerValue(c: Card): number {
  return POKER_VAL[c.rank] ?? 0;
}

export type HandRankName =
  | 'high'
  | 'pair'
  | 'two_pair'
  | 'three'
  | 'straight'
  | 'flush'
  | 'full_house'
  | 'four'
  | 'straight_flush';

export interface HandRank {
  name: HandRankName;
  value: number; // for comparison
  tiebreak: number[]; // high cards for tie-break
}

function countByRank(cards: Card[]): Map<number, number> {
  const m = new Map<number, number>();
  cards.forEach((c) => {
    const v = pokerValue(c);
    m.set(v, (m.get(v) ?? 0) + 1);
  });
  return m;
}

function countBySuit(cards: Card[]): Map<string, number> {
  const m = new Map<string, number>();
  cards.forEach((c) => m.set(c.suit, (m.get(c.suit) ?? 0) + 1));
  return m;
}

function valuesSorted(cards: Card[]): number[] {
  return cards.map(pokerValue).sort((a, b) => b - a);
}

function isStraight(vals: number[]): boolean {
  const s = [...new Set(vals)].sort((a, b) => b - a);
  if (s.length < 5) return false;
  for (let i = 0; i <= s.length - 5; i++) {
    if (s[i] - s[i + 4] === 4) return true;
  }
  if (s.includes(14)) {
    const low = s.filter((x) => x !== 14).concat([1]);
    low.sort((a, b) => b - a);
    if (low.length >= 4 && low[0] === 5 && low[low.length - 1] === 1) return true;
  }
  return false;
}

function combine5(indices: number[], n: number, start: number, result: number[][]): void {
  if (indices.length === 5) {
    result.push([...indices]);
    return;
  }
  for (let i = start; i < n; i++) {
    indices.push(i);
    combine5(indices, n, i + 1, result);
    indices.pop();
  }
}

/** Best 5-card hand from 5 or 7 cards (Texas Hold'em). */
export function evaluateHand(cards: Card[]): HandRank {
  if (cards.length < 5) return { name: 'high', value: 1, tiebreak: [] };
  const toTry = cards.length === 5 ? [cards] : (() => {
    const combos: number[][] = [];
    combine5([], cards.length, 0, combos);
    return combos.map((idx) => idx.map((i) => cards[i]));
  })();
  let best: HandRank = { name: 'high', value: 1, tiebreak: [] };
  toTry.forEach((five) => {
    const h = evaluateFive(five);
    if (compareRanks(h, best) > 0) best = h;
  });
  return best;
}

function compareRanks(a: HandRank, b: HandRank): number {
  if (a.value !== b.value) return a.value - b.value;
  for (let i = 0; i < Math.max(a.tiebreak.length, b.tiebreak.length); i++) {
    const va = a.tiebreak[i] ?? 0;
    const vb = b.tiebreak[i] ?? 0;
    if (va !== vb) return va - vb;
  }
  return 0;
}

function evaluateFive(all: Card[]): HandRank {
  const vals = valuesSorted(all);
  const byRank = countByRank(all);
  const bySuit = countBySuit(all);
  const counts = [...byRank.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flushSuit = [...bySuit.entries()].find(([, n]) => n >= 5)?.[0];
  const flushCards = flushSuit ? all.filter((c) => c.suit === flushSuit) : all;
  const flushVals = valuesSorted(flushCards).slice(0, 5);
  const straightFlush = flushCards.length >= 5 && isStraight(flushCards.map(pokerValue));

  if (straightFlush && flushVals[0] === 14) return { name: 'straight_flush', value: 9, tiebreak: flushVals };
  if (straightFlush) return { name: 'straight_flush', value: 9, tiebreak: flushVals };
  if (counts[0]?.[1] === 4) return { name: 'four', value: 8, tiebreak: [counts[0][0], ...vals.filter((v) => v !== counts[0][0]).slice(0, 1)] };
  if (counts[0]?.[1] === 3 && counts[1]?.[1] >= 2) return { name: 'full_house', value: 7, tiebreak: [counts[0][0], counts[1][0]] };
  if (flushSuit) return { name: 'flush', value: 6, tiebreak: flushVals.slice(0, 5) };
  if (isStraight(all.map(pokerValue))) return { name: 'straight', value: 5, tiebreak: vals.slice(0, 5) };
  if (counts[0]?.[1] === 3) return { name: 'three', value: 4, tiebreak: [counts[0][0], ...vals.filter((v) => v !== counts[0][0]).slice(0, 2)] };
  if (counts[0]?.[1] === 2 && counts[1]?.[1] === 2) return { name: 'two_pair', value: 3, tiebreak: [counts[0][0], counts[1][0], ...vals.filter((v) => v !== counts[0][0] && v !== counts[1][0]).slice(0, 1)] };
  if (counts[0]?.[1] === 2) return { name: 'pair', value: 2, tiebreak: [counts[0][0], ...vals.filter((v) => v !== counts[0][0]).slice(0, 3)] };
  return { name: 'high', value: 1, tiebreak: vals.slice(0, 5) };
}

export function compareHands(a: Card[], b: Card[]): number {
  const ha = evaluateHand(a);
  const hb = evaluateHand(b);
  if (ha.value !== hb.value) return ha.value - hb.value;
  for (let i = 0; i < Math.max(ha.tiebreak.length, hb.tiebreak.length); i++) {
    const va = ha.tiebreak[i] ?? 0;
    const vb = hb.tiebreak[i] ?? 0;
    if (va !== vb) return va - vb;
  }
  return 0;
}

export const HAND_NAMES_HE: Record<HandRankName, string> = {
  high: 'גבוה',
  pair: 'זוג',
  two_pair: 'שני זוגות',
  three: 'שלישייה',
  straight: 'סטרייט',
  flush: 'צבע',
  full_house: 'פול האוס',
  four: 'קרֶבֶט',
  straight_flush: 'סטרייט פלאש',
};
