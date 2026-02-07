/**
 * קטלוג מקלות סנוקר — Inventory בסגנון TikTok Live / Vegas
 * כל מקל: צבע, זוהר, אפקט שובל, בונוס עוצמה
 */

export type CueDesignId = 'GOLD_VIP' | 'NEON_CYBER' | 'LASER_KNIGHT';

export interface CueDesign {
  id: CueDesignId;
  name: string;
  primaryColor: string;
  glowColor: string;
  trailEffect: 'sparkles' | 'glitch' | 'laser';
  powerBonus: number;
}

export const CUE_DESIGNS: Record<CueDesignId, CueDesign> = {
  GOLD_VIP: {
    id: 'GOLD_VIP',
    name: 'Vegas Gold',
    primaryColor: '#ffd700',
    glowColor: 'rgba(255, 215, 0, 0.8)',
    trailEffect: 'sparkles',
    powerBonus: 1.2,
  },
  NEON_CYBER: {
    id: 'NEON_CYBER',
    name: 'Cyber Tokyo',
    primaryColor: '#00f2ea',
    glowColor: 'rgba(0, 242, 234, 0.9)',
    trailEffect: 'glitch',
    powerBonus: 1.0,
  },
  LASER_KNIGHT: {
    id: 'LASER_KNIGHT',
    name: 'Laser Knight',
    primaryColor: '#ff2d55',
    glowColor: 'rgba(255, 45, 85, 1)',
    trailEffect: 'laser',
    powerBonus: 1.1,
  },
};

export const DEFAULT_CUE_ID: CueDesignId = 'NEON_CYBER';
