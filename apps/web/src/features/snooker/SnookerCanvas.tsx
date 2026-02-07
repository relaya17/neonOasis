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
  2: '/snooker_table.png',
};
const getTableImagePath = (level: number) => TABLE_IMAGE_BY_LEVEL[level] ?? TABLE_IMAGE_BY_LEVEL[2];
/** תמונות כדורים מקצועיים — אם קובץ קיים ב־public/images משתמשים בו */
const BALL_IMAGE_TYPES = ['white', 'red', 'yellow', 'green', 'brown', 'blue', 'pink', 'black'] as const;
const getBallImagePath = (type: string) => `/images/snooker_ball_${type}.png`;
const CUE_LENGTH = 280;
const CUE_OFFSET = 40;
const FRICTION = 0.98;
const POWER_FACTOR = 0.22;
const MIN_VEL = 0.08;

export interface Ball {
  x: number;
  y: number;
  type: 'white' | 'red' | ColorName;
  id?: string;
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

    const pockets = pocketsRef.current;
    const balls = ballsRef.current;
    const white = balls.find((b) => b.type === 'white');
    if (!white) return;

    const drawTable = () => {
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

    const drawPredictionLine = (ax: number, ay: number) => {
      const dx = Math.cos(ax);
      const dy = Math.sin(ax);
      const len = 180;
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = NEON_CYAN;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(white.x, white.y);
      ctx.lineTo(white.x - dx * len, white.y - dy * len);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(0,242,234,0.6)';
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const drawCustomCue = (ax: number, _ay: number, powerNorm: number, cueStyle: CueDesign) => {
      ctx.save();
      ctx.translate(white.x, white.y);
      ctx.rotate(ax);
      const startX = CUE_OFFSET + (1 - powerNorm) * 90;
      const tipX = startX + 18;
      const shaftEnd = startX + CUE_LENGTH;
      ctx.shadowBlur = 16;
      ctx.shadowColor = cueStyle.glowColor;
      ctx.shadowOffsetY = 1;
      const shaftGrad = ctx.createLinearGradient(startX, 0, shaftEnd, 0);
      shaftGrad.addColorStop(0, cueStyle.primaryColor);
      shaftGrad.addColorStop(0.15, cueStyle.primaryColor);
      shaftGrad.addColorStop(0.5, cueStyle.primaryColor);
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
      ctx.fillStyle = '#f5f0e6';
      ctx.beginPath();
      ctx.ellipse(tipX, 0, 10, w2 + 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e8e0d0';
      ctx.lineWidth = 0.8;
      ctx.stroke();
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

    const updatePhysics = () => {
      const v = velocityRef.current;
      if (Math.abs(v.x) < MIN_VEL && Math.abs(v.y) < MIN_VEL) {
        v.x = 0;
        v.y = 0;
        return;
      }
      v.x *= FRICTION;
      v.y *= FRICTION;
      white.x += v.x;
      white.y += v.y;

      if (white.x < BALL_R || white.x > width - BALL_R) {
        white.x = Math.max(BALL_R, Math.min(width - BALL_R, white.x));
        v.x *= -0.6;
      }
      if (white.y < BALL_R || white.y > height - BALL_R) {
        white.y = Math.max(BALL_R, Math.min(height - BALL_R, white.y));
        v.y *= -0.6;
      }

      const others = balls.filter((b) => b !== white && b.type !== 'white');
      for (let i = 0; i < others.length; i++) {
        const o = others[i];
        const d = Math.hypot(white.x - o.x, white.y - o.y);
        if (d < BALL_R * 2) {
          const potted = o.type;
          const idx = balls.indexOf(o);
          if (idx !== -1) balls.splice(idx, 1);
          shockwavesRef.current.push({ x: o.x, y: o.y, t: 0, maxT: 35 });
          const nearestPocket = pocketsRef.current.reduce((best, p) => {
            const dist = (o.x - p.x) ** 2 + (o.y - p.y) ** 2;
            return !best || dist < best.dist ? { p, dist } : best;
          }, null as { p: { x: number; y: number }; dist: number } | null);
          if (nearestPocket) pocketBurstsRef.current.push({ x: nearestPocket.p.x, y: nearestPocket.p.y, t: 0, maxT: 25 });
          if (potted === 'red' && phase === 'red') {
            lastPottedForChatRef.current = 'red';
            onPotRed();
          } else if (potted !== 'red' && potted !== 'white' && phase === 'color') {
            lastPottedForChatRef.current = potted as string;
            onPotColor(potted as ColorName);
          }
          const nx = (white.x - o.x) / d;
          const ny = (white.y - o.y) / d;
          const bounce = 0.4;
          v.x += nx * bounce * 2;
          v.y += ny * bounce * 2;
          break;
        }
      }

      if (isInPocket(white.x, white.y, pocketsRef.current)) {
        const pocket = pocketsRef.current.find((p) => (white.x - p.x) ** 2 + (white.y - p.y) ** 2 <= POCKET_R ** 2);
        if (pocket) pocketBurstsRef.current.push({ x: pocket.x, y: pocket.y, t: 0, maxT: 25 });
        white.x = width * 0.15;
        white.y = height / 2;
        v.x = 0;
        v.y = 0;
      }

      others.forEach((o) => {
        if (isInPocket(o.x, o.y, pocketsRef.current)) {
          pocketsRef.current.forEach((p) => {
            if ((o.x - p.x) ** 2 + (o.y - p.y) ** 2 <= POCKET_R ** 2) {
              pocketBurstsRef.current.push({ x: p.x, y: p.y, t: 0, maxT: 25 });
            }
          });
          const idx = balls.indexOf(o);
          if (idx !== -1) balls.splice(idx, 1);
        }
      });
    };

    const draw = () => {
      drawTable();
      drawShockwaves();
      drawPocketBursts();
      balls.forEach((b) => drawBall(b, true));
      if (velocityRef.current.x === 0 && velocityRef.current.y === 0 && !disabled) {
        const a = angleRef.current;
        drawPredictionLine(a, 0);
        const p = isDragging ? power / 100 : 0;
        drawCustomCue(a, 0, p, activeCue);
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
  }, [width, height, phase, isDragging, power, disabled, onPotRed, onPotColor, activeCue]);

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
        const back = dx * Math.cos(angleRef.current) + dy * Math.sin(angleRef.current);
        const p = Math.min(100, Math.max(0, back * 0.8));
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
    if (dist > BALL_R * 5) return;
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
      const a = angleRef.current;
      velocityRef.current = {
        x: -Math.cos(a) * strength,
        y: -Math.sin(a) * strength,
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
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
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
          maxHeight: height,
          display: 'block',
          borderRadius: 10,
          cursor: disabled ? 'default' : isDragging ? 'none' : 'crosshair',
          boxShadow: '0 0 50px rgba(0,0,0,0.9)',
        }}
      />
      {/* מד כוח נאון — צד ימין */}
      {!disabled && (
        <Box
          sx={{
            position: 'absolute',
            right: -48,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 20,
            height: 160,
            border: '2px solid #ffd700',
            borderRadius: 10,
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
