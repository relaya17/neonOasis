import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box as MuiBox, Button, Typography } from '@mui/material';
import { Canvas } from '@react-three/fiber';
import { Physics, usePlane } from '@react-three/cannon';
import { OrbitControls, Stars } from '@react-three/drei';
import type { Mesh } from 'three';
import { spreadMaterialProps } from '../../types/r3f-materials';
import { Dice } from './Dice';
import { Checker } from './Checker';
import { DraggableChecker } from './DraggableChecker';
import { MoveIndicator } from './MoveIndicator';
import { getPointPosition, getCheckerPosition, getPointCenter } from './backgammonBoardGeometry';
import { useBackgammonStore } from './store';
import { getLegalMoves, applyMove, getWinner } from '@neon-oasis/shared';
import type { BackgammonMove, BackgammonState } from '@neon-oasis/shared';
import { socketService } from '../../api/socketService';
import { hapticLand, hapticClick, useWebGLContextLoss, useAIDealer } from '../../shared/hooks';
import { playSound } from '../../shared/audio';
import { useApiStatusStore } from '../../shared/store/apiStatus';
import { ProvablyFairDialog } from '../game/ProvablyFairDialog';
import { AIDealerOverlay } from '../game/AIDealerOverlay';
import { useWalletStore } from '../store';
import { getApiBase } from '../../config/apiBase';

const getApi = () => getApiBase() || '';
const NEON_CYAN = '#00f5d4';
const NEON_PINK = '#f72585';
const NEON_GOLD = '#ffd700';
const ELECTRIC_BLUE = '#00ffff';

export interface BackgammonBoard3DProps {
  tableId?: string;
  onMove?: (from: number | 'bar', to: number | 'off') => void;
  /** נקרא כשקורה אירוע דרמטי (למשל סוף משחק) */
  onEvent?: (message: string) => void;
}

/** לוח שש-בש תלת-ממדי — תאורת ניאון, קוביות פיזיקליות, גרירה */
export function BackgammonBoard3D({ tableId: _tableId, onMove, onEvent }: BackgammonBoard3DProps = {}) {
  const [rolling, setRolling] = useState(false);
  const [provablyFairOpen, setProvablyFairOpen] = useState(false);
  const { state, setState, reset: resetGame } = useBackgammonStore();
  const apiOnline = useApiStatusStore((s) => s.online);
  const { webglLost, onCanvasCreated } = useWebGLContextLoss();
  const userId = useWalletStore((s) => s.userId);
  const lastDealerDice = useRef<string | null>(null);
  const [clientSeed, setClientSeed] = useState('');
  const [pfCommit, setPfCommit] = useState('');
  const [pfNonce, setPfNonce] = useState('');
  const [pfServerSeed, setPfServerSeed] = useState<string | null>(null);
  const [pfError, setPfError] = useState<string | null>(null);

  const gameId = useMemo(
    () => `bg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    []
  );
  const { message: dealerMessage, triggerRoll } = useAIDealer({ userId, gameId });

  useEffect(() => {
    const seed = `client-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    setClientSeed(seed);
    const controller = new AbortController();
    fetch(`${getApi()}/api/games/rng/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, clientSeed: seed }),
      signal: controller.signal,
    })
      .then(async (res) => (res.ok ? res.json() : Promise.reject(new Error('commit failed'))))
      .then((data: { commitment: string; nonce: string }) => {
        setPfCommit(data.commitment);
        setPfNonce(data.nonce);
      })
      .catch((err) => {
        setPfError(err?.message ?? 'commit failed');
      });

    return () => controller.abort();
  }, [gameId]);

  useEffect(() => {
    if (!state.dice) return;
    const key = `${state.dice[0]}-${state.dice[1]}`;
    if (lastDealerDice.current === key) return;
    lastDealerDice.current = key;
    triggerRoll(state.dice, undefined, userId, gameId);
  }, [state.dice, triggerRoll, userId, gameId]);

  const handleRoll = () => {
    if (state.dice !== null) return; // already rolled this turn
    playSound('neon_click');
    hapticClick();
    setRolling(true);
    const controller = new AbortController();
    fetch(`${getApi()}/api/games/rng/roll?gameId=${encodeURIComponent(gameId)}&clientSeed=${encodeURIComponent(clientSeed)}`, {
      signal: controller.signal,
    })
      .then(async (res) => (res.ok ? res.json() : Promise.reject(new Error('roll failed'))))
      .then((data: { dice: [number, number] }) => {
        setState((s: BackgammonState) => ({ ...s, dice: data.dice, lastMoveAt: Date.now() }));
        setTimeout(() => {
          setRolling(false);
          hapticLand();
          playSound('dice_land');
        }, 2000);
      })
      .catch(() => {
        const d1 = 1 + Math.floor(Math.random() * 6);
        const d2 = 1 + Math.floor(Math.random() * 6);
        setState((s: BackgammonState) => ({ ...s, dice: [d1, d2], lastMoveAt: Date.now() }));
        setTimeout(() => {
          setRolling(false);
          hapticLand();
          playSound('dice_land');
        }, 2000);
      });

    return () => controller.abort();
  };

  const legalMoves = state.dice !== null ? getLegalMoves(state) : [];
  const winner = getWinner(state);

  const lastWinnerRef = useRef<number>(-1);
  useEffect(() => {
    if (winner === -1 || !onEvent || winner === lastWinnerRef.current) return;
    lastWinnerRef.current = winner;
    onEvent(`🏆 סוף משחק! המנצח: ${winner === 0 ? 'ציאן' : 'ורוד'}`);
  }, [winner, onEvent]);

  const aiTurnDoneRef = useRef(false);
  useEffect(() => {
    if (winner !== -1 || state.turn !== 1 || state.dice === null) {
      aiTurnDoneRef.current = false;
      return;
    }
    if (aiTurnDoneRef.current) return;
    const aiMoves = getLegalMoves(state);
    if (aiMoves.length === 0) {
      aiTurnDoneRef.current = true;
      setState((s: BackgammonState) => ({ ...s, dice: null, turn: 0 }));
      return;
    }
    const t = setTimeout(() => {
      aiTurnDoneRef.current = true;
      const move = aiMoves[0];
      setState((s: BackgammonState) => {
        const next = applyMove(s, move);
        return next ? { ...next, dice: null, turn: 0 } : s;
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [state.turn, state.dice, winner]);

  const handleApplyMove = (move: BackgammonMove) => {
    const next = applyMove(state, move);
    if (!next) return;
    playSound('neon_click');
    setState({
      ...next,
      dice: null,
      turn: (state.turn === 0 ? 1 : 0) as 0 | 1,
    });
    socketService.socket?.connected && socketService.sendMove('main', { from: move.from, to: move.to });
  };

  const handleReveal = () => {
    const controller = new AbortController();
    fetch(`${getApi()}/api/games/rng/reveal?gameId=${encodeURIComponent(gameId)}`, {
      signal: controller.signal,
    })
      .then(async (res) => (res.ok ? res.json() : Promise.reject(new Error('reveal failed'))))
      .then((data: { seed: string; dice: [number, number] }) => {
        setPfServerSeed(data.seed);
        if (state.dice === null) {
          setState({
            ...state,
            dice: data.dice,
            lastMoveAt: Date.now(),
          });
        }
      })
      .catch((err) => {
        setPfError(err?.message ?? 'reveal failed');
      });

    return () => controller.abort();
  };

  return (
    <MuiBox
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 320,
        position: 'relative',
        borderRadius: { xs: 2, sm: 4 },
        overflow: 'hidden',
        background: 'linear-gradient(165deg, rgba(8,20,28,0.97) 0%, rgba(4,12,18,0.98) 50%, #050810 100%)',
        border: '1px solid rgba(0,245,212,0.35)',
        boxShadow: `
          0 0 0 1px rgba(0,255,255,0.08),
          0 8px 32px rgba(0,0,0,0.6),
          inset 0 1px 0 rgba(255,255,255,0.03)
        `,
      }}
    >
      {/* Turn indicator - compact pill */}
      <MuiBox
        sx={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.6,
          borderRadius: 3,
          bgcolor: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(0,255,255,0.2)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Typography
          sx={{
            color: state.turn === 0 ? ELECTRIC_BLUE : 'rgba(255,255,255,0.4)',
            fontSize: '0.8rem',
            fontWeight: state.turn === 0 ? 700 : 400,
          }}
        >
          אתה
        </Typography>
        <Typography sx={{ color: NEON_GOLD, fontSize: '0.7rem' }}>•</Typography>
        <Typography
          sx={{
            color: state.turn === 1 ? NEON_PINK : 'rgba(255,255,255,0.4)',
            fontSize: '0.8rem',
            fontWeight: state.turn === 1 ? 700 : 400,
          }}
        >
          AI
        </Typography>
      </MuiBox>
      {apiOnline === false && (
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 20,
            color: NEON_PINK,
            bgcolor: 'rgba(255,77,154,0.15)',
            border: '1px solid rgba(255,77,154,0.4)',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.7rem',
          }}
        >
          Offline
        </Typography>
      )}
      {/* Dice result badge */}
      {state.dice && (
        <MuiBox
          sx={{
            position: 'absolute',
            top: 48,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 19,
            px: 2,
            py: 0.75,
            borderRadius: 2,
            background: `linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))`,
            border: '1px solid rgba(255,215,0,0.4)',
            boxShadow: '0 0 20px rgba(255,215,0,0.15)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <Typography sx={{ color: NEON_GOLD, fontSize: '1rem', fontWeight: 700, letterSpacing: 1 }}>
            🎲 {state.dice[0]} — {state.dice[1]}
          </Typography>
        </MuiBox>
      )}
      
      <Canvas
        shadows
        camera={{ position: [0, 10, 10], fov: 50 }}
        onCreated={onCanvasCreated}
        gl={{ alpha: true }}
        style={{ background: 'transparent' }}
      >
        {/* רקע שקוף — הגרדיאנט של הכרטיס מהדף הבית נראה דרך ה־Canvas */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <ambientLight intensity={0.2} />
        <spotLight
          position={[10, 15, 10]}
          angle={0.3}
          penumbra={1}
          castShadow
          intensity={1.5}
        />
        <pointLight position={[-5, 8, 5]} color="#00f5d4" intensity={0.8} />
        <pointLight position={[5, 8, -5]} color="#f72585" intensity={0.6} />

        <Physics gravity={[0, -20, 0]}>
          <BoardPlane onMove={onMove} />
          {state.dice !== null && (
            <>
              <pointLight position={[-1.2, 3, 0]} color="#00f5d4" intensity={1.2} distance={4} decay={2} />
              <pointLight position={[1.2, 3, 0]} color="#f72585" intensity={1.2} distance={4} decay={2} />
              <Dice position={[-1.2, 4, 0]} value={state.dice[0]} />
              <Dice position={[1.2, 4, 0]} value={state.dice[1]} />
            </>
          )}
        </Physics>

        <OrbitControls
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          enablePan={false}
        />
      </Canvas>

      {/* Bottom control strip — one primary CTA, secondary row, then moves */}
      <MuiBox
        sx={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          alignItems: 'center',
          maxWidth: 'min(360px, 90vw)',
        }}
      >
        <Button
          variant="contained"
          onClick={handleRoll}
          disabled={rolling || state.dice !== null}
          aria-label={rolling ? 'Rolling dice' : state.dice === null ? 'Roll dice' : `Dice: ${state.dice[0]}, ${state.dice[1]}`}
          sx={{
            background: state.dice === null
              ? `linear-gradient(135deg, ${NEON_CYAN}, ${ELECTRIC_BLUE})`
              : 'rgba(255,255,255,0.12)',
            color: state.dice === null ? '#000' : 'rgba(255,255,255,0.7)',
            boxShadow: state.dice === null
              ? `0 0 24px rgba(0,245,212,0.5), 0 4px 12px rgba(0,0,0,0.3)`
              : 'none',
            fontSize: '1.05rem',
            px: 4,
            py: 1.4,
            fontWeight: 700,
            borderRadius: 2,
            border: state.dice === null ? 'none' : '1px solid rgba(255,255,255,0.15)',
            '&:hover': {
              background: state.dice === null
                ? `linear-gradient(135deg, ${NEON_CYAN}, ${ELECTRIC_BLUE})`
                : 'rgba(255,255,255,0.18)',
              boxShadow: state.dice === null ? `0 0 32px rgba(0,245,212,0.6)` : 'none',
            },
            '&:disabled': { color: 'rgba(255,255,255,0.5)' },
          }}
        >
          {rolling ? '🎲 מגלגל...' : state.dice === null ? '🎲 זרוק קוביות' : `✓ ${state.dice[0]} — ${state.dice[1]}`}
        </Button>
        <MuiBox sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          {state.dice !== null && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setProvablyFairOpen(true)}
              sx={{
                borderColor: 'rgba(255,215,0,0.5)',
                color: NEON_GOLD,
                fontSize: '0.75rem',
                borderRadius: 1.5,
                py: 0.5,
                '&:hover': { borderColor: NEON_GOLD, bgcolor: 'rgba(255,215,0,0.08)' },
              }}
            >
              Provably Fair
            </Button>
          )}
          <Button
            variant="text"
            size="small"
            onClick={handleReveal}
            sx={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.75rem',
              '&:hover': { color: ELECTRIC_BLUE },
            }}
          >
            חשוף Seed
          </Button>
        </MuiBox>
        {winner !== -1 && (
          <MuiBox
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              mt: 0.5,
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(0,255,255,0.2)',
            }}
          >
            <Typography sx={{ color: winner === 0 ? NEON_CYAN : NEON_PINK, fontWeight: 700, fontSize: '1rem' }}>
              {winner === 0 ? '🎉 אתה ניצחת!' : 'ה-AI ניצח'}
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => { playSound('neon_click'); resetGame(); }}
              sx={{
                bgcolor: NEON_CYAN,
                color: '#000',
                fontWeight: 700,
                borderRadius: 1.5,
                '&:hover': { bgcolor: ELECTRIC_BLUE },
              }}
            >
              משחק חדש
            </Button>
          </MuiBox>
        )}
        {legalMoves.length > 0 && state.turn === 0 && winner === -1 && (
          <MuiBox
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5,
              justifyContent: 'center',
              mt: 0.5,
            }}
          >
            <Typography sx={{ width: '100%', color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textAlign: 'center', mb: 0.25 }}>
              בחר מהלך
            </Typography>
            {legalMoves.slice(0, 10).map((move, i) => (
              <Button
                key={i}
                variant="outlined"
                size="small"
                onClick={() => handleApplyMove(move)}
                sx={{
                  borderColor: 'rgba(0,245,212,0.5)',
                  color: NEON_CYAN,
                  fontSize: '0.7rem',
                  minWidth: 52,
                  py: 0.4,
                  borderRadius: 1.5,
                  '&:hover': { borderColor: NEON_CYAN, bgcolor: 'rgba(0,245,212,0.1)' },
                }}
              >
                {move.from === 'bar' ? 'Bar' : move.from}→{move.to === 'off' ? 'Off' : move.to}
              </Button>
            ))}
            {legalMoves.length > 10 && (
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', alignSelf: 'center' }}>
                +{legalMoves.length - 10}
              </Typography>
            )}
          </MuiBox>
        )}
        {legalMoves.length === 0 && state.dice !== null && state.turn === 0 && winner === -1 && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              playSound('neon_click');
              const d1 = 1 + Math.floor(Math.random() * 6);
              const d2 = 1 + Math.floor(Math.random() * 6);
              setState((s: BackgammonState) => ({ ...s, turn: 1, dice: [d1, d2], lastMoveAt: Date.now() }));
            }}
            sx={{
              borderColor: 'rgba(255,215,0,0.5)',
              color: NEON_GOLD,
              borderRadius: 1.5,
              fontSize: '0.8rem',
              '&:hover': { borderColor: NEON_GOLD, bgcolor: 'rgba(255,215,0,0.08)' },
            }}
          >
            אין מהלך — העבר תור
          </Button>
        )}
      </MuiBox>

      <ProvablyFairDialog
        open={provablyFairOpen}
        onClose={() => setProvablyFairOpen(false)}
        gameId={gameId}
        clientSeed={clientSeed}
        commitment={pfCommit}
        nonce={pfNonce}
        serverSeed={pfServerSeed ?? 'hidden_until_reveal'}
        diceResult={state.dice || [0, 0]}
        errorMessage={pfError}
      />
      <AIDealerOverlay message={dealerMessage} />

      {webglLost && (
        <MuiBox
          role="alert"
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.8)',
            zIndex: 30,
            textAlign: 'center',
            p: 3,
          }}
        >
          <MuiBox>
            <Typography sx={{ color: '#ff4d9a', mb: 1, fontWeight: 600 }}>
              WebGL הושבת בדפדפן
            </Typography>
            <Typography sx={{ color: '#ccc', mb: 2, fontSize: '0.9rem' }}>
              נסה לרענן את הדף או לסגור טאב־ים כבדים.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
              sx={{
                borderColor: '#00ffff',
                color: '#00ffff',
                '&:hover': { borderColor: '#00ffff', bgcolor: 'rgba(0,255,255,0.1)' },
              }}
            >
              רענן
            </Button>
          </MuiBox>
        </MuiBox>
      )}
    </MuiBox>
  );
}

/** לוח שש-בש מעוצב — 24 נקודות, כלים, גרירה ואינדיקטורים */
function BoardPlane({
  onMove,
}: {
  onMove?: (from: number | 'bar', to: number | 'off') => void;
}) {
  const state = useBackgammonStore((s) => s.state);
  const draggingFrom = useBackgammonStore((s) => s.draggingFrom);
  const legalMovesForSelected = useBackgammonStore((s) => s.legalMovesForSelected);
  const [ref] = usePlane(() => ({
    type: 'Static',
    position: [0, 0, 0],
    rotation: [-Math.PI / 2, 0, 0],
  }));

  const BOARD_WIDTH = 14;
  const BOARD_HEIGHT = 18;
  const FRAME_THICKNESS = 0.2;
  const POINT_WIDTH = 0.82;
  const POINT_HEIGHT = 2.5;

  const FELT_COLOR = '#0a1f14';
  const POINT_LIGHT = '#eae4d8';
  const POINT_DARK = '#6b5344';
  const FRAME_NEON = '#00f5d4';
  const BAR_COLOR = '#0d0d0d';
  const BAR_EMISSIVE = '#ffd700';

  const canDrag = state.turn === 0 && state.dice !== null && typeof onMove === 'function';

  const renderPoints = () => {
    const points: JSX.Element[] = [];
    const colors = [POINT_LIGHT, POINT_DARK];

    for (let i = 0; i < 24; i++) {
      const { x, z, isBottom } = getPointPosition(i);
      const rotation = isBottom ? 0 : Math.PI;
      const color = colors[i % 2];

      points.push(
        <mesh
          key={`point-${i}`}
          position={[x, 0.02, z]}
          rotation={[-Math.PI / 2, 0, rotation]}
          castShadow
        >
          <coneGeometry args={[POINT_WIDTH / 2, POINT_HEIGHT, 3]} />
          <meshStandardMaterial {...spreadMaterialProps({ color, roughness: 0.6, metalness: 0.1 })} />
        </mesh>
      );
    }
    return points;
  };

  const renderCheckers = () => {
    const COLORS = [NEON_CYAN, NEON_PINK];

    return state.board.flatMap((count, pointIndex) => {
      if (count === 0) return [];
      const player = count > 0 ? 0 : 1;
      const numCheckers = Math.abs(count);
      return Array.from({ length: numCheckers }, (_, i) => {
        const pos = getCheckerPosition(pointIndex, i, numCheckers);
        const isTopChecker = i === numCheckers - 1;
        if (canDrag && isTopChecker && onMove) {
          return (
            <DraggableChecker
              key={`checker-${pointIndex}-${i}`}
              pointIndex={pointIndex}
              checkerIndex={i}
              totalInPoint={numCheckers}
              position={pos}
              color={COLORS[player]}
              onMove={onMove}
            />
          );
        }
        return (
          <Checker
            key={`checker-${pointIndex}-${i}`}
            position={pos}
            color={COLORS[player]}
            isNeon
          />
        );
      });
    });
  };

  const h = BOARD_HEIGHT / 2;
  const w = BOARD_WIDTH / 2;

  return (
    <group>
      {/* Main board surface — dark felt */}
      <mesh
        ref={ref as React.RefObject<Mesh>}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, 0, 0]}
      >
        <planeGeometry args={[BOARD_WIDTH, BOARD_HEIGHT]} />
        <meshStandardMaterial {...spreadMaterialProps({ color: FELT_COLOR, roughness: 0.9, metalness: 0.02 })} />
      </mesh>

      {/* Rectangular neon frame */}
      {[
        [0, -h - FRAME_THICKNESS / 2, BOARD_WIDTH + FRAME_THICKNESS * 2, FRAME_THICKNESS],
        [0, h + FRAME_THICKNESS / 2, BOARD_WIDTH + FRAME_THICKNESS * 2, FRAME_THICKNESS],
        [-w - FRAME_THICKNESS / 2, 0, FRAME_THICKNESS, BOARD_HEIGHT + FRAME_THICKNESS * 2],
        [w + FRAME_THICKNESS / 2, 0, FRAME_THICKNESS, BOARD_HEIGHT + FRAME_THICKNESS * 2],
      ].map(([px, pz, fw, fh], i) => (
        <mesh key={`frame-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[px, 0.012, pz]}>
          <planeGeometry args={[fw, fh]} />
          <meshStandardMaterial
            {...spreadMaterialProps({
              color: FRAME_NEON,
              emissive: FRAME_NEON,
              emissiveIntensity: 0.4,
              roughness: 0.25,
              metalness: 0.6,
            })}
          />
        </mesh>
      ))}

      {/* Center bar */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 0]}>
        <planeGeometry args={[1.1, BOARD_HEIGHT]} />
        <meshStandardMaterial
          {...spreadMaterialProps({
            color: BAR_COLOR,
            emissive: BAR_EMISSIVE,
            emissiveIntensity: 0.2,
            roughness: 0.3,
            metalness: 0.85,
          })}
        />
      </mesh>

      {renderPoints()}
      {legalMovesForSelected.map((target) =>
        target === 'off' ? null : (
          <MoveIndicator key={`move-${target}`} position={getPointCenter(target)} isTargeted />
        )
      )}
      {renderCheckers()}

      {/* Corner accents — subtle */}
      {[
        [-w - 0.12, -h - 0.12],
        [w + 0.12, -h - 0.12],
        [-w - 0.12, h + 0.12],
        [w + 0.12, h + 0.12],
      ].map(([x, z], i) => (
        <mesh key={`corner-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, z]}>
          <circleGeometry args={[0.28, 24]} />
          <meshStandardMaterial
            {...spreadMaterialProps({
              color: i % 2 === 0 ? NEON_CYAN : NEON_PINK,
              emissive: i % 2 === 0 ? NEON_CYAN : NEON_PINK,
              emissiveIntensity: 0.35,
              roughness: 0.3,
              metalness: 0.5,
            })}
          />
        </mesh>
      ))}
    </group>
  );
}
