/** P2P Skill-Economy — Escrow, Settlement, Oasis Token (single source of truth) */

export type EscrowStatus = 'held' | 'released' | 'refunded';

export interface EscrowHold {
  id: string;
  gameId: string;
  userId: string;
  amount: string;
  status: EscrowStatus;
  createdAt: string;
  releasedAt?: string;
}

export interface P2PSettlementRequest {
  gameId: string;
  winnerId: string;
  loserId: string;
  potAmount: string;
  /** Platform fee rate 0–1 (e.g. 0.1 = 10%) */
  feeRate?: number;
}

export interface P2PSettlementResult {
  success: boolean;
  winnerNewBalance?: string;
  loserNewBalance?: string;
  feeAmount?: string;
  error?: string;
}

export interface OasisMintRequest {
  userId: string;
  amount: string;
  reason: 'win' | 'achievement' | 'tournament';
  referenceId?: string;
}

export interface OasisMintResult {
  success: boolean;
  newOasisBalance?: string;
  error?: string;
}
