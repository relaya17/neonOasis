/**
 * קטלוג מקלות סנוקר — Freemium / Money Maker
 * מקל בסיס חינם, השאר Premium עם תמונות מלאונרדו
 */

export type CueDesignId = 'default' | 'snake' | 'dragon' | 'phoenix' | 'GOLD_VIP' | 'NEON_CYBER' | 'LASER_KNIGHT';

export interface CueDesign {
  id: string;
  name: string;
  /** נתיב ל-PNG המקל. אם חסר — גרדיאנט מ־primaryColor */
  imagePath: string;
  glowColor: string;
  price: number;
  powerBonus: number;
  primaryColor?: string;
  /** תיאור בונוס לחנות */
  bonusLabel?: string;
  trailEffect?: 'sparkles' | 'glitch' | 'laser';
}

export const CUE_DESIGNS: Record<string, CueDesign> = {
  default: {
    id: 'default',
    name: 'מקל עץ קלאסי',
    imagePath: '/images/snookerSimple.png',
    glowColor: 'rgba(255, 255, 255, 0.3)',
    price: 0,
    powerBonus: 1.0,
    primaryColor: '#c4a574',
    bonusLabel: 'בסיסי',
  },
  snake: {
    id: 'snake',
    name: 'מקל הנחש',
    imagePath: '/images/cues/snake_cue.png',
    glowColor: 'rgba(255, 215, 0, 0.7)',
    price: 500,
    powerBonus: 1.05,
    primaryColor: '#daa520',
    bonusLabel: 'יציבות משופרת',
  },
  dragon: {
    id: 'dragon',
    name: 'מקל הדרקון',
    imagePath: '/images/cues/dragon_cue.png',
    glowColor: 'rgba(180, 0, 255, 0.6)',
    price: 1200,
    powerBonus: 1.1,
    primaryColor: '#8b008b',
    bonusLabel: 'עוצמה +10%',
  },
  phoenix: {
    id: 'phoenix',
    name: 'ציפור החול',
    imagePath: '/images/cues/phoenix_cue.png',
    glowColor: 'rgba(255, 100, 0, 0.6)',
    price: 2500,
    powerBonus: 1.2,
    primaryColor: '#ff6600',
    bonusLabel: 'אפקט אש במכה',
  },
  GOLD_VIP: {
    id: 'GOLD_VIP',
    name: 'Vegas Gold',
    imagePath: '',
    primaryColor: '#ffd700',
    glowColor: 'rgba(255, 215, 0, 0.8)',
    price: 0,
    powerBonus: 1.2,
    trailEffect: 'sparkles',
  },
  NEON_CYBER: {
    id: 'NEON_CYBER',
    name: 'Cyber Tokyo',
    imagePath: '',
    primaryColor: '#00f2ea',
    glowColor: 'rgba(0, 242, 234, 0.9)',
    price: 0,
    powerBonus: 1.0,
    trailEffect: 'glitch',
  },
  LASER_KNIGHT: {
    id: 'LASER_KNIGHT',
    name: 'Laser Knight',
    imagePath: '',
    primaryColor: '#ff2d55',
    glowColor: 'rgba(255, 45, 85, 1)',
    price: 0,
    powerBonus: 1.1,
    trailEffect: 'laser',
  },
};

export const DEFAULT_CUE_ID: CueDesignId = 'default';

/** מחירי מתנות במטבעות (תואם ל-LiveSidebar GIFT_TYPES) */
export const GIFT_PRICES: Record<string, number> = {
  chalk: 10,
  beer: 50,
  diamond: 500,
};
