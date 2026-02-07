/**
 * סנוקר Canvas — מערכת כיוון (Cue), פיזיקה, מד כוח, אפקטי פגיעה
 * "העתיד של וגאס" — נאון, מקל יוקרתי, קו תחזית, שוקווייב
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Box } from '@mui/material';
import type { ColorName } from './store';
import { COLOR_ORDER } from './store';
import { playSound } from '../../shared/audio';
import type { CueDesign } from './snookerCues';
import { CUE_DESIGNS, DEFAULT_CUE_ID } from './snookerCues';

const NEON_CYAN = 'rgba(0, 242, 234, 0.8)';
const FELT = '#0d4d2a';
const FELT_LIGHT = '#126b38';
const POCKET_COLOR = '#0a0a0a';
const WHITE = '#f0f0f0';
const RED = '#c41e3a';
const BALL_COLORS: Record<ColorName, string> = {
  yellow: '#f5d033',
  green: '#2e7d32',
  brown: '#5d4037',
  blue: '#1565c0',
  pink: '#ec407a',
  black: '#1a1a1a',
};

const BALL_R = 12;
const POCKET_R = 22;
const TABLE_MARGIN = 24;
/** תמונות שולחן לפי רמה: רמה 1 = table2, רמה 2+ = table */
const TABLE_IMAGE_BY_LEVEL: Record<number, string> = {
  1: '/snooker_table2.png',
  2: 'https://res.cloudinary.com/dora8sxcb/image/upload/v1770488595/lucid-origin_Top-down_orthographic_view_of_an_ultra-luxury_snooker_table_shimmering_gold_silk-2_1_hetnws.jpg',
};
const getTableImagePath = (level: number) => TABLE_IMAGE_BY_LEVEL[level] ?? TABLE_IMAGE_BY_LEVEL[2];
/** תמונות כדורים מקצועיים — אם קובץ קיים ב־public/images משתמשים בו */
const BALL_IMAGE_TYPES = ['white', 'red', 'yellow', 'green', 'brown', 'blue', 'pink', 'black'] as const;
const getBallImagePath = (type: string) => `/images/snooker_ball_${type}.png`;
const CUE_LENGTH = 280;
const CUE_OFFSET = 40;
/** חיכוך ליחידת צעד; עם SUB_STEPS=5 מתקבל חיכוך אפקטיבי ~0.98 לפריים */
const FRICTION = 0.996;
const WALL_BOUNCE = 0.82;
const POWER_FACTOR = 0.32;
const MIN_VEL = 0.05;
const COLLISION_RADIUS = BALL_R * 2.08;

export interface Ball {
  x: number;
  y: number;
  type: 'white' | 'red' | ColorName;
  id?: string;
  /** מהירות (כדורים שאינם לבן) */
  vx?: number;
  vy?: number;
}

interface Shockwave {
  x: number;
  y: number;
  t: number;
  maxT: number;
}

interface PocketBurst {
  x: number;
  y: number;
  t: number;
  maxT: number;
}

interface SnookerCanvasProps {
  width: number;
  height: number;
  redsCount: number;
  colorsPotted: Record<ColorName, boolean>;
  phase: 'red' | 'color';
  onPotRed: () => void;
  onPotColor: (color: ColorName) => void;
  disabled?: boolean;
  onStrike?: () => void;
  /** כשמשתנה — מאפס את מיקומי הכדורים (משחק חדש) */
  resetKey?: number;
  /** עיצוב המקל הפעיל (מהאינבנטורי / מתנות) */
  activeCue?: CueDesign;
  /** רמה 1 = snooker_table2, רמה 2+ = snooker_table */
  level?: number;
  /** גיר פעיל — זוהר כחול וקוביית גיר על קצה המקל */
  chalkActive?: boolean;
  /** דיווח כשגוררים (למניעת שימוש בגיר באמצע כיוון) */
  onDraggingChange?: (isDragging: boolean) => void;
}

function getInitialBalls(redsCount: number, colorsPotted: Record<ColorName, boolean>, w: number, h: number): Ball[] {
  const balls: Ball[] = [];
  const cx = w / 2;
  balls.push({ x: w * 0.15, y: h / 2, type: 'white' });

  for (let i = 0; i < redsCount; i++) {
    const row = Math.floor(i / 5);
    const col = i % 5;
    const bx = cx - 30 + col * 22;
    const by = h * 0.35 - 20 + row * 18;
    balls.push({ x: bx, y: by, type: 'red', id: `red-${i}` });
  }

  const colorY = h * 0.58;
  const g = 28;
  let colorIndex = 0;
  COLOR_ORDER.forEach((color) => {
    if (colorsPotted[color]) return;
    const startX = cx - (g * 2.5);
    balls.push({ x: startX + colorIndex * g, y: colorY, type: color, id: `color-${color}` });
    colorIndex++;
  });

  return balls;
}

/** קואורדינטות חורים עם פרספקטיבה — החלק העליון צר יותר מהתחתון */
function getPocketCenters(w: number, h: number): { x: number; y: number }[] {
  return [
    { x: w * 0.12, y: h * 0.08 },
    { x: w * 0.88, y: h * 0.08 },
    { x: w * 0.08, y: h * 0.5 },
    { x: w * 0.92, y: h * 0.5 },
    { x: w * 0.08, y: h * 0.92 },
    { x: w * 0.92, y: h * 0.92 },
  ];
}

function isInPocket(x: number, y: number, pockets: { x: number; y: number }[]): boolean {
  return pockets.some((p) => (x - p.x) ** 2 + (y - p.y) ** 2 <= POCKET_R * POCKET_R);
}

export function SnookerCanvas({
  width,
  height,
  redsCount,
  colorsPotted,
  phase,
  onPotRed,
  onPotColor,
  disabled,
  onStrike,
  resetKey = 0,
  activeCue = CUE_DESIGNS[DEFAULT_CUE_ID],
  level = 1,
  chalkActive = false,
  onDraggingChange,
}: SnookerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [power, setPower] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; angle: number } | null>(null);
  const angleRef = useRef(0);
  const mousePos = useRef({ x: 0, y: 0 });
  const ballsRef = useRef<Ball[]>([]);
  const velocityRef = useRef({ x: 0, y: 0 });
  const shockwavesRef = useRef<Shockwave[]>([]);
  const pocketBurstsRef = useRef<PocketBurst[]>([]);
  const pocketsRef = useRef(getPocketCenters(width, height));
  const lastPottedForChatRef = useRef<string | null>(null);
  const tableImageRef = useRef<HTMLImageElement | null>(null);
  const ballImagesRef = useRef<Record<string, HTMLImageElement | null>>({});
  const cueImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!activeCue?.imagePath) {
      cueImageRef.current = null;
      return;
    }
    const img = new Image();
    img.onload = () => { cueImageRef.current = img; };
    img.onerror = () => { cueImageRef.current = null; };
    img.src = activeCue.imagePath;
    return () => { cueImageRef.current = null; };
  }, [activeCue?.id, activeCue?.imagePath]);

  useEffect(() => {
    onDraggingChange?.(isDragging);
  }, [isDragging, onDraggingChange]);

  useEffect(() => {
    BALL_IMAGE_TYPES.forEach((type) => {
      const img = new Image();
      img.onload = () => { ballImagesRef.current[type] = img; };
      img.onerror = () => { ballImagesRef.current[type] = null; };
      img.src = getBallImagePath(type);
    });
  }, []);

  useEffect(() => {
    const path = getTableImagePath(level);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { tableImageRef.current = img; };
    img.onerror = () => { tableImageRef.current = null; };
    img.src = path;
    // לא מנקים את ה-ref כאן — נשארים עם התמונה הקודמת עד שהחדשה נטענת
  }, [level]);

  useEffect(() => {
    pocketsRef.current = getPocketCenters(width, height);
  }, [width, height]);

  useEffect(() => {
    ballsRef.current = getInitialBalls(redsCount, colorsPotted, width, height);
    velocityRef.current = { x: 0, y: 0 };
    // רק כשמתחילים משחק חדש (resetKey) — לא אחרי כל פוט
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawTable = () => {
      const pockets = pocketsRef.current;
      const img = tableImageRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, width, height);
      } else {
        ctx.fillStyle = FELT;
        ctx.fillRect(0, 0, width, height);
        const grad = ctx.createLinearGradient(0, 0, width * 0.3, height * 0.3);
        grad.addColorStop(0, FELT_LIGHT);
        grad.addColorStop(0.5, FELT);
        grad.addColorStop(1, '#0a3018');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = POCKET_COLOR;
        pockets.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#1a1a1a';
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }
    };

    const drawBall = (b: Ball, glow = false) => {
      const baseColor = b.type === 'white' ? WHITE : b.type === 'red' ? RED : BALL_COLORS[b.type as ColorName];
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 3;
      if (glow) {
        ctx.shadowBlur = 14;
        ctx.shadowColor = baseColor;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      const ballImg = ballImagesRef.current[b.type];
      if (ballImg && ballImg.complete && ballImg.naturalWidth > 0) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        const d = BALL_R * 2;
        ctx.drawImage(ballImg, 0, 0, ballImg.naturalWidth, ballImg.naturalHeight, b.x - BALL_R, b.y - BALL_R, d, d);
      } else {
        ctx.beginPath();
        ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
        const hx = b.x - BALL_R * 0.35;
        const hy = b.y - BALL_R * 0.35;
        const grad = ctx.createRadialGradient(hx, hy, 0, b.x, b.y, BALL_R * 2);
        if (b.type === 'white') {
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.25, '#f5f5f5');
          grad.addColorStop(0.6, '#e8e8e8');
          grad.addColorStop(1, '#c0c0c0');
        } else {
          const dark = b.type === 'red' ? '#8b0000' : 'rgba(0,0,0,0.4)';
          grad.addColorStop(0, 'rgba(255,255,255,0.85)');
          grad.addColorStop(0.2, baseColor);
          grad.addColorStop(0.6, baseColor);
          grad.addColorStop(1, dark);
        }
        ctx.fillStyle = grad;
        ctx.fill();
        if (b.type === 'white' || b.type !== 'red') {
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      ctx.restore();
    };

    const drawPredictionLine = (w: Ball, ax: number, _ay: number) => {
      const dx = Math.cos(ax);
      const dy = Math.sin(ax);
      const len = 180;
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = NEON_CYAN;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w.x, w.y);
      ctx.lineTo(w.x + dx * len, w.y + dy * len);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(0,242,234,0.6)';
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const drawCustomCue = (w: Ball, ax: number, _ay: number, powerNorm: number, cueStyle: CueDesign) => {
      ctx.save();
      ctx.translate(w.x, w.y);
      ctx.rotate(ax + Math.PI);
      const startX = CUE_OFFSET + (1 - powerNorm) * 90;
      const tipX = startX + 18;
      const shaftEnd = startX + CUE_LENGTH;
      const cueImg = cueImageRef.current;
      const primaryColor = cueStyle.primaryColor ?? '#c4a574';

      ctx.shadowBlur = 16;
      ctx.shadowColor = cueStyle.glowColor;
      ctx.shadowOffsetY = 1;

      if (cueImg && cueImg.complete && cueImg.naturalWidth > 0) {
        const cueW = 12;
        const cueLen = shaftEnd - startX;
        ctx.drawImage(cueImg, startX, -cueW / 2, cueLen, cueW);
      } else {
        const shaftGrad = ctx.createLinearGradient(startX, 0, shaftEnd, 0);
        shaftGrad.addColorStop(0, primaryColor);
        shaftGrad.addColorStop(0.15, primaryColor);
        shaftGrad.addColorStop(0.5, primaryColor);
        shaftGrad.addColorStop(0.85, '#2a1810');
        shaftGrad.addColorStop(1, '#1a0f08');
        ctx.fillStyle = shaftGrad;
        ctx.beginPath();
        const w1 = 4;
        const w2 = 5.5;
        ctx.moveTo(startX, -w1);
        ctx.lineTo(tipX, -w2);
        ctx.lineTo(shaftEnd, -w2);
        ctx.lineTo(shaftEnd, w2);
        ctx.lineTo(tipX, w2);
        ctx.lineTo(startX, w1);
        ctx.closePath();
        ctx.fill();
      }

      const w2 = 5.5;
      if (chalkActive) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(92, 158, 173, 0.9)';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      ctx.fillStyle = '#f5f0e6';
      ctx.beginPath();
      ctx.ellipse(tipX, 0, 10, w2 + 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e8e0d0';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      if (chalkActive) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(92, 158, 173, 0.95)';
        ctx.fillRect(tipX + 14, -3, 6, 6);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(tipX + 14, -3, 6, 6);
      }
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    };

    const drawShockwaves = () => {
      shockwavesRef.current = shockwavesRef.current.filter((s) => s.t < s.maxT);
      shockwavesRef.current.forEach((s) => {
        const progress = s.t / s.maxT;
        const r = 15 + progress * 45;
        const alpha = 1 - progress;
        ctx.strokeStyle = `rgba(0, 242, 234, ${alpha * 0.8})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.stroke();
        s.t += 1.2;
      });
    };

    const drawPocketBursts = () => {
      pocketBurstsRef.current = pocketBurstsRef.current.filter((b) => b.t < b.maxT);
      pocketBurstsRef.current.forEach((b) => {
        const progress = b.t / b.maxT;
        const r = progress * 40;
        const alpha = 1 - progress;
        ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(255, 242, 0, ${alpha * 0.2})`;
        ctx.fill();
        b.t += 1.5;
      });
    };

    const SUB_STEPS = 5;
    /**
     * פיזיקה — כל הקוד שאחראי על תנועה והתנגשויות:
     * 1. חיכוך (FRICTION) וזרימת תנועה (v, ball.vx/vy)
     * 2. התנגשות עם קירות (WALL_BOUNCE)
     * 3. התנגשות אלסטית כדור–כדור (החלפת רכיב מהירות לאורך הנורמל)
     * 4. כיסים (isInPocket, הסרת כדורים)
     * מקור המהירות הראשונית: handleMouseUp (velocityRef = cos/sin * strength).
     */
    const updatePhysics = () => {
      const balls = ballsRef.current;
      const white = balls.find((b) => b.type === 'white');
      if (!white) return;
      const v = velocityRef.current;

      for (let step = 0; step < SUB_STEPS; step++) {
        const others = balls.filter((b) => b !== white && b.type !== 'white');

        // 1. חיכוך + תזוזה — כדור לבן
        v.x *= FRICTION;
        v.y *= FRICTION;
        white.x += v.x;
        white.y += v.y;
        if (white.x < BALL_R || white.x > width - BALL_R) {
          white.x = Math.max(BALL_R, Math.min(width - BALL_R, white.x));
          v.x *= -WALL_BOUNCE;
        }
        if (white.y < BALL_R || white.y > height - BALL_R) {
          white.y = Math.max(BALL_R, Math.min(height - BALL_R, white.y));
          v.y *= -WALL_BOUNCE;
        }

        // הזזת שאר הכדורים
        others.forEach((o) => {
          const ovx = o.vx ?? 0;
          const ovy = o.vy ?? 0;
          (o as Ball).vx = ovx * FRICTION;
          (o as Ball).vy = ovy * FRICTION;
          o.x += (o.vx ?? 0);
          o.y += (o.vy ?? 0);
          if (o.x < BALL_R || o.x > width - BALL_R) {
            o.x = Math.max(BALL_R, Math.min(width - BALL_R, o.x));
            (o as Ball).vx = (o.vx ?? 0) * -WALL_BOUNCE;
          }
          if (o.y < BALL_R || o.y > height - BALL_R) {
            o.y = Math.max(BALL_R, Math.min(height - BALL_R, o.y));
            (o as Ball).vy = (o.vy ?? 0) * -WALL_BOUNCE;
          }
        });

        // 2. התנגשות אלסטית (מסה שווה): לבן מול אחרים — החלפת רכיב מהירות לאורך נורמל
        for (const o of others) {
          let d = Math.hypot(white.x - o.x, white.y - o.y);
          if (d < 1) d = 1;
          if (d >= COLLISION_RADIUS) continue;
          const nx = (white.x - o.x) / d;
          const ny = (white.y - o.y) / d;
          const ovx = o.vx ?? 0;
          const ovy = o.vy ?? 0;
          const vrn = (v.x - ovx) * nx + (v.y - ovy) * ny;
          if (vrn <= 0) continue;
          v.x -= vrn * nx;
          v.y -= vrn * ny;
          (o as Ball).vx = ovx + vrn * nx;
          (o as Ball).vy = ovy + vrn * ny;
          const overlap = COLLISION_RADIUS - d;
          white.x += nx * (overlap / 2);
          white.y += ny * (overlap / 2);
          o.x -= nx * (overlap / 2);
          o.y -= ny * (overlap / 2);
          shockwavesRef.current.push({ x: o.x, y: o.y, t: 0, maxT: 35 });
        }

        // 3. התנגשות כדור–כדור (אחרים ביניהם) — אותה פיזיקה
        for (let i = 0; i < others.length; i++) {
          for (let j = i + 1; j < others.length; j++) {
            const a = others[i];
            const b = others[j];
            let d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 1) d = 1;
            if (d >= COLLISION_RADIUS) continue;
            const nx = (a.x - b.x) / d;
            const ny = (a.y - b.y) / d;
            const avx = a.vx ?? 0;
            const avy = a.vy ?? 0;
            const bvx = b.vx ?? 0;
            const bvy = b.vy ?? 0;
            const vrn = (avx - bvx) * nx + (avy - bvy) * ny;
            if (vrn <= 0) continue;
            (a as Ball).vx = avx - vrn * nx;
            (a as Ball).vy = avy - vrn * ny;
            (b as Ball).vx = bvx + vrn * nx;
            (b as Ball).vy = bvy + vrn * ny;
            const overlap = COLLISION_RADIUS - d;
            a.x += nx * (overlap / 2);
            a.y += ny * (overlap / 2);
            b.x -= nx * (overlap / 2);
            b.y -= ny * (overlap / 2);
          }
        }
      }

      // עצירת לבן כשהמהירות נמוכה
      if (Math.abs(v.x) < MIN_VEL && Math.abs(v.y) < MIN_VEL) {
        v.x = 0;
        v.y = 0;
      }

      // כיסים: לבן נפל — איפוס מיקום
      if (isInPocket(white.x, white.y, pocketsRef.current)) {
        const pocket = pocketsRef.current.find((p) => (white.x - p.x) ** 2 + (white.y - p.y) ** 2 <= POCKET_R ** 2);
        if (pocket) pocketBurstsRef.current.push({ x: pocket.x, y: pocket.y, t: 0, maxT: 25 });
        white.x = width * 0.15;
        white.y = height / 2;
        v.x = 0;
        v.y = 0;
      }

      // כיסים: כדור צבעוני/אדום נפל — הסרה + callback
      const toRemove: Ball[] = [];
      balls.forEach((b) => {
        if (b === white) return;
        if (isInPocket(b.x, b.y, pocketsRef.current)) toRemove.push(b);
      });
      toRemove.forEach((o) => {
        const idx = balls.indexOf(o);
        if (idx !== -1) balls.splice(idx, 1);
        pocketsRef.current.forEach((p) => {
          if ((o.x - p.x) ** 2 + (o.y - p.y) ** 2 <= POCKET_R ** 2) {
            pocketBurstsRef.current.push({ x: p.x, y: p.y, t: 0, maxT: 25 });
          }
        });
        if (o.type === 'red' && phase === 'red') {
          lastPottedForChatRef.current = 'red';
          onPotRed();
        } else if (o.type !== 'red' && o.type !== 'white' && phase === 'color') {
          lastPottedForChatRef.current = o.type as string;
          onPotColor(o.type as ColorName);
        }
      });
    };

    const draw = () => {
      const balls = ballsRef.current;
      const white = balls.find((b) => b.type === 'white');
      drawTable();
      drawShockwaves();
      drawPocketBursts();
      balls.forEach((b) => drawBall(b, true));
      if (white && velocityRef.current.x === 0 && velocityRef.current.y === 0 && !disabled) {
        const a = isDragging && dragStart.current ? dragStart.current.angle : angleRef.current;
        drawPredictionLine(white, a, 0);
        const p = isDragging ? power / 100 : 0;
        drawCustomCue(white, a, 0, p, activeCue);
      }
    };

    let rafId: number;
    const loop = () => {
      updatePhysics();
      draw();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [width, height, phase, isDragging, power, disabled, onPotRed, onPotColor, activeCue, chalkActive]);

  const getCanvasCoords = (e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const { x, y } = getCanvasCoords(e);
      mousePos.current = { x, y };
      const white = ballsRef.current.find((b) => b.type === 'white');
      if (!white) return;
      angleRef.current = Math.atan2(y - white.y, x - white.x);
      if (isDragging && dragStart.current) {
        const dx = white.x - x;
        const dy = white.y - y;
        const aimAngle = dragStart.current.angle;
        const back = dx * Math.cos(aimAngle) + dy * Math.sin(aimAngle);
        const p = Math.min(100, Math.max(0, back * 1.8));
        setPower(p);
      }
    },
    [isDragging]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    const v = velocityRef.current;
    if (v.x !== 0 || v.y !== 0) return;
    const white = ballsRef.current.find((b) => b.type === 'white');
    if (!white) return;
    const { x, y } = getCanvasCoords(e);
    const dist = Math.hypot(x - white.x, y - white.y);
    if (dist > BALL_R * 8) return;
    const a = Math.atan2(y - white.y, x - white.x);
    if (dist > BALL_R * 2) angleRef.current = a;
    mousePos.current = { x, y };
    setIsDragging(true);
    setPower(0);
    dragStart.current = { x, y, angle: angleRef.current };
  }, [disabled]);

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragStart.current) return;
      const white = ballsRef.current.find((b) => b.type === 'white');
      if (!white) return;
      const bonus = activeCue?.powerBonus ?? 1;
      const strength = (power / 100) * POWER_FACTOR * 12 * bonus;
      const a = dragStart.current.angle;
      // מקור המהירות הראשונית לפיזיקה (updatePhysics קורא ל־velocityRef)
      velocityRef.current = {
        x: Math.cos(a) * strength,
        y: Math.sin(a) * strength,
      };
      playSound('neon_click');
      onStrike?.();
      setIsDragging(false);
      setPower(0);
      dragStart.current = null;
    },
    [isDragging, power, onStrike, activeCue]
  );

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setPower(0);
      dragStart.current = null;
    }
  }, [isDragging]);

  return (
    <Box sx={{ position: 'relative', display: 'inline-block', pointerEvents: 'auto', width: '100%', maxWidth: width }}>
      <Box
        sx={{
          perspective: '1100px',
          perspectiveOrigin: '50% 30%',
          width: '100%',
          maxWidth: width,
          '& > .snooker-table-3d': {
            transform: 'rotateX(6deg)',
            transformOrigin: 'center 85%',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            borderRadius: 12,
            boxShadow: '0 6px 24px rgba(0,0,0,0.45), 0 30px 70px rgba(0,0,0,0.35), 0 0 0 8px #2a1810',
          },
        }}
      >
        <Box className="snooker-table-3d" sx={{ position: 'relative', width: '100%' }}>
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{
              width: '100%',
              maxWidth: width,
              height: 'auto',
              aspectRatio: `${width} / ${height}`,
              maxHeight: height,
              display: 'block',
              borderRadius: 8,
              cursor: disabled ? 'default' : isDragging ? 'none' : 'crosshair',
              touchAction: 'none',
            }}
          />
        </Box>
      </Box>
      {/* מד כוח נאון — צד ימין, מותאם לגובה */}
      {!disabled && (
        <Box
          sx={{
            position: 'absolute',
            right: -44,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 18,
            height: 'min(160px, 28vh)',
            minHeight: 100,
            border: '2px solid #ffd700',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 0 12px rgba(255,215,0,0.5)',
            bgcolor: 'rgba(0,0,0,0.6)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${power}%`,
              bgcolor: '#ffd700',
              transition: 'height 0.08s ease-out',
              boxShadow: '0 0 14px #ffd700',
            }}
          />
        </Box>
      )}
    </Box>
  );
}
