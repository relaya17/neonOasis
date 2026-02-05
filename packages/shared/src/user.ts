/** User & identity — AI Guardian, matchmaking */

export type AgeRating = 'all' | '13+' | '18+';

export interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  avatar_id: string;
  is_verified: boolean;
  balance: string;
  level: number;
  /** ELO/MMR — Skill Matching (Fair Play) */
  elo_rating?: number;
  /** Oasis Token — Proof of Skill */
  oasis_balance?: string;
  ageRating?: AgeRating;
  /** For matchmaking — play style, speed preference */
  preferences?: MatchmakingPreferences;
  verifiedAt?: number;
}

export interface MatchmakingPreferences {
  playSpeed: 'fast' | 'normal' | 'relaxed';
  preferredGames: string[];
}

export interface SafetyFlags {
  ageVerified: boolean;
  chatBlocked: boolean;
  flaggedByAI: boolean;
}
