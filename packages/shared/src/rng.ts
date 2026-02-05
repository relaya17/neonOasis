/** Provably fair RNG — PRD: certified for fairness, client-verifiable */

export interface ProvablyFairRoll {
  /** Server seed (or combined with client seed in full flow) */
  seed: string;
  /** Nonce for this roll (e.g. round id) */
  nonce: string;
  /** HMAC or hash(seed + nonce) so client can verify dice */
  hash: string;
  /** Dice values [d1, d2] 1–6 */
  dice: [number, number];
  /** Server timestamp for audit */
  timestamp: number;
}

export interface RollRequest {
  roomId?: string;
  gameId?: string;
  /** Optional client seed for full provably-fair flow */
  clientSeed?: string;
}
