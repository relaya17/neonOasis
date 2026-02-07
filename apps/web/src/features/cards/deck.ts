/**
 * חפיסת קלפים לפוקר ומשחקי קלפים — ייבוא מ־SimplePoker, PokerTable, pokerUtils
 */

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export interface Card {
  suit: string;
  rank: string;
  faceUp: boolean;
  id: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push({
        suit,
        rank,
        faceUp: false,
        id: `${rank}${suit}-${Math.random().toString(36).slice(2, 9)}`,
      });
    });
  });
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  return shuffle(deck);
}
