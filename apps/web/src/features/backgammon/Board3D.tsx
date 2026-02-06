import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box as MuiBox, Button, Typography } from '@mui/material';
import { Canvas } from '@react-three/fiber';
import { Physics, usePlane } from '@react-three/cannon';
import { OrbitControls, Stars } from '@react-three/drei';
import type { Mesh } from 'three';
import { Dice } from './Dice';
import { useBackgammonStore } from './store';
import { getLegalMoves, applyMove, getWinner } from '@neon-oasis/shared';
import type { BackgammonMove, BackgammonState } from '@neon-oasis/shared';
import { socketService } from '../../api/socketService';
import { hapticLand, hapticClick, useWebGLContextLoss, useAIDealer } from '../../shared/hooks';
import { playSound } from '../../shared/audio';
import { useNavigate } from 'react-router-dom';
import { useApiStatusStore } from '../../shared/store/apiStatus';
import { ProvablyFairDialog } from '../game/ProvablyFairDialog';
import { AIDealerOverlay } from '../game/AIDealerOverlay';
import { useWalletStore } from '../store';

const API_URL = import.meta.env.VITE_API_URL ?? '';

/** לוח שש-בש תלת-ממדי — תאורת ניאון, קוביות פיזיקליות, Stars ברקע */
export function BackgammonBoard3D() {
  const [rolling, setRolling] = useState(false);
  const [provablyFairOpen, setProvablyFairOpen] = useState(false);
  const { state, setState, reset: resetGame } = useBackgammonStore();
  const navigate = useNavigate();
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
    fetch(`${API_URL}/api/games/rng/commit`, {
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
    fetch(`${API_URL}/api/games/rng/roll?gameId=${encodeURIComponent(gameId)}&clientSeed=${encodeURIComponent(clientSeed)}`, {
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
    fetch(`${API_URL}/api/games/rng/reveal?gameId=${encodeURIComponent(gameId)}`, {
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
    <MuiBox sx={{ width: '100%', height: '100vh', bgcolor: '#000', position: 'relative' }}>
      {/* Compact Player Info - Mobile Responsive */}
      <MuiBox
        sx={{
          position: 'absolute',
          top: { xs: 8, sm: 16 },
          right: { xs: 8, sm: 16 },
          zIndex: 20,
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          border: '1px solid #00ffff',
          borderRadius: 1,
          px: { xs: 1, sm: 1.5 },
          py: { xs: 0.5, sm: 1 },
          backdropFilter: 'blur(5px)',
        }}
      >
        <MuiBox sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center' }}>
          <Typography sx={{ 
            color: state.turn === 0 ? '#00ffff' : '#666', 
            fontSize: { xs: '0.75rem', sm: '0.85rem' },
            fontWeight: state.turn === 0 ? 'bold' : 'normal'
          }}>
            🔵 {userId?.slice(0, 6) || 'You'}
          </Typography>
          <Typography sx={{ color: '#ffd700', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>VS</Typography>
          <Typography sx={{ 
            color: state.turn === 1 ? '#ff00ff' : '#666',
            fontSize: { xs: '0.75rem', sm: '0.85rem' },
            fontWeight: state.turn === 1 ? 'bold' : 'normal'
          }}>
            🔴 AI
          </Typography>
        </MuiBox>
      </MuiBox>
      
      <MuiBox
        sx={{
          position: 'absolute',
          top: { xs: 8, sm: 16 },
          left: { xs: 8, sm: 16 },
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Button
          variant="outlined"
          size={window.innerWidth < 600 ? 'small' : 'medium'}
          onClick={() => navigate('/')}
          sx={{
            borderColor: '#00ffff',
            color: '#00ffff',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            '&:hover': { borderColor: '#00ffff', bgcolor: 'rgba(0,255,255,0.1)' },
          }}
        >
          ← חזרה
        </Button>
        {apiOnline === false && (
          <Typography
            variant="caption"
            sx={{
              color: '#ff4d9a',
              bgcolor: 'rgba(255, 0, 85, 0.12)',
              border: '1px solid rgba(255, 0, 85, 0.3)',
              px: 1,
              py: 0.5,
              borderRadius: 1,
            }}
          >
            Offline — ה־API לא פעיל
          </Typography>
        )}
      </MuiBox>
      {/* Compact Status - Only when dice rolled */}
      {state.dice && (
        <MuiBox
          sx={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 19,
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            border: '1px solid #ffd700',
            borderRadius: 1,
            px: 2,
            py: 0.5,
            backdropFilter: 'blur(5px)',
          }}
        >
          <Typography sx={{ color: '#ffd700', fontSize: '0.9rem', fontWeight: 'bold' }}>
            🎲 {state.dice[0]} • {state.dice[1]}
          </Typography>
        </MuiBox>
      )}
      
      <Canvas shadows camera={{ position: [0, 10, 10], fov: 50 }} onCreated={onCanvasCreated}>
        <color attach="background" args={['#050505']} />
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
          <BoardPlane />
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

      <MuiBox
        sx={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          alignItems: 'center',
        }}
      >
        <Button
          variant="contained"
          onClick={handleRoll}
          disabled={rolling || state.dice !== null}
          aria-label={rolling ? 'Rolling dice' : state.dice === null ? 'Roll dice' : `Dice: ${state.dice[0]}, ${state.dice[1]}`}
          sx={{
            background: 'linear-gradient(90deg, #00f5d4, #f72585)',
            boxShadow: state.dice === null ? '0 0 40px rgba(0,245,212,0.8)' : '0 0 20px rgba(0,245,212,0.5)',
            fontSize: { xs: '1rem', sm: '1.2rem', md: '1.3rem' },
            px: { xs: 3, sm: 4, md: 5 },
            py: { xs: 1.2, sm: 1.5, md: 1.8 },
            fontWeight: 'bold',
            '&:hover': { boxShadow: '0 0 50px rgba(247,37,133,0.8)' },
            '&:disabled': { boxShadow: '0 0 10px rgba(100,100,100,0.3)' },
          }}
        >
          {rolling ? '🎲 מגלגל...' : state.dice === null ? '🎲 זרוק / ROLL' : `✅ ${state.dice[0]} • ${state.dice[1]}`}
        </Button>
        {state.dice !== null && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setProvablyFairOpen(true)}
            sx={{
              borderColor: '#ffd700',
              color: '#ffd700',
              fontSize: '0.75rem',
              '&:hover': { borderColor: '#ffd700', bgcolor: 'rgba(255,215,0,0.1)' },
            }}
          >
            🔒 Provably Fair
          </Button>
        )}
        <Button
          variant="text"
          size="small"
          onClick={handleReveal}
          sx={{ color: '#00ffff', fontSize: '0.75rem' }}
        >
          חשוף Seed
        </Button>
        {winner !== -1 && (
          <MuiBox sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mt: 1 }}>
            <Typography sx={{ color: '#00ff00', fontWeight: 'bold' }}>
              {winner === 0 ? '🔵 אתה ניצחת!' : '🔴 ה-AI ניצח'}
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => { playSound('neon_click'); resetGame(); }}
              sx={{ bgcolor: '#00f5d4', color: '#000', fontWeight: 'bold' }}
            >
              משחק חדש
            </Button>
          </MuiBox>
        )}
        {legalMoves.length > 0 && state.turn === 0 && winner === -1 && (
          <MuiBox sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', mt: 1, maxWidth: 320 }}>
            <Typography sx={{ width: '100%', color: '#aaa', fontSize: '0.75rem', textAlign: 'center' }}>
              בחר מהלך:
            </Typography>
            {legalMoves.slice(0, 12).map((move, i) => (
              <Button
                key={i}
                variant="outlined"
                size="small"
                onClick={() => handleApplyMove(move)}
                sx={{
                  borderColor: '#00f5d4',
                  color: '#00f5d4',
                  fontSize: '0.7rem',
                  minWidth: 56,
                  '&:hover': { borderColor: '#00f5d4', bgcolor: 'rgba(0,245,212,0.15)' },
                }}
              >
                {move.from === 'bar' ? 'Bar' : move.from}→{move.to === 'off' ? 'Off' : move.to}
              </Button>
            ))}
            {legalMoves.length > 12 && (
              <Typography sx={{ color: '#888', fontSize: '0.7rem' }}>+{legalMoves.length - 12} עוד</Typography>
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
              borderColor: '#ffd700',
              color: '#ffd700',
              mt: 1,
              '&:hover': { borderColor: '#ffd700', bgcolor: 'rgba(255,215,0,0.1)' },
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

/** לוח שש-בש מעוצב - 24 נקודות (משולשים), כלים, פס מרכזי — מראה פרימיום ניאון */
function BoardPlane() {
  const { state } = useBackgammonStore();
  const [ref] = usePlane(() => ({
    type: 'Static',
    position: [0, 0, 0],
    rotation: [-Math.PI / 2, 0, 0],
  }));

  // Board dimensions - balanced proportions
  const BOARD_WIDTH = 14;
  const BOARD_HEIGHT = 18;
  const FRAME_THICKNESS = 0.25;
  const POINT_WIDTH = 0.85;
  const POINT_HEIGHT = 2.6;
  const CHECKER_RADIUS = 0.38;
  const CHECKER_HEIGHT = 0.18;

  // Classic premium: dark green felt + cream/ivory points (alternating)
  const FELT_COLOR = '#0c2818';
  const POINT_LIGHT = '#e8ddc8';
  const POINT_DARK = '#b8956e';
  const FRAME_NEON = '#00f5d4';
  const BAR_COLOR = '#1a1a1a';
  const BAR_EMISSIVE = '#ffd700';

  const getPointPosition = (pointIndex: number) => {
    let quadrant: number, localIdx: number;
    if (pointIndex <= 5) {
      quadrant = 0;
      localIdx = pointIndex;
    } else if (pointIndex <= 11) {
      quadrant = 1;
      localIdx = pointIndex - 6;
    } else if (pointIndex <= 17) {
      quadrant = 2;
      localIdx = pointIndex - 12;
    } else {
      quadrant = 3;
      localIdx = pointIndex - 18;
    }
    const isBottom = quadrant === 0 || quadrant === 1;
    const isRight = quadrant === 0 || quadrant === 3;
    const xBase = isRight ? 1.2 : -7.2;
    const x = xBase + (isRight ? localIdx : (5 - localIdx)) * 1.02;
    const z = isBottom ? 6.2 : -6.2;
    return { x, z, isBottom, isRight };
  };

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
          <coneGeometry args={[POINT_WIDTH / 2, POINT_HEIGHT, 4]} />
          <meshStandardMaterial
            color={color}
            roughness={0.5}
            metalness={0.15}
          />
        </mesh>
      );
    }
    return points;
  };

  const renderCheckers = () => {
    const checkers: JSX.Element[] = [];
    const COLORS = ['#00f5d4', '#f72585'];

    state.board.forEach((count, pointIndex) => {
      if (count === 0) return;
      const player = count > 0 ? 0 : 1;
      const numCheckers = Math.abs(count);
      const { x, z, isBottom } = getPointPosition(pointIndex);

      for (let i = 0; i < numCheckers; i++) {
        const zOff = isBottom ? -i * CHECKER_HEIGHT * 2.6 : i * CHECKER_HEIGHT * 2.6;
        const y = 0.06 + i * CHECKER_HEIGHT * 2.2;

        checkers.push(
          <mesh key={`checker-${pointIndex}-${i}`} position={[x, y, z + zOff * 0.5]} castShadow>
            <cylinderGeometry args={[CHECKER_RADIUS, CHECKER_RADIUS * 0.98, CHECKER_HEIGHT, 24]} />
            <meshStandardMaterial
              color={COLORS[player]}
              emissive={COLORS[player]}
              emissiveIntensity={0.5}
              roughness={0.25}
              metalness={0.75}
            />
          </mesh>
        );
      }
    });
    return checkers;
  };

  const h = BOARD_HEIGHT / 2;
  const w = BOARD_WIDTH / 2;

  return (
    <group>
      {/* Main board surface - premium dark felt */}
      <mesh
        ref={ref as React.RefObject<Mesh>}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        position={[0, 0, 0]}
      >
        <planeGeometry args={[BOARD_WIDTH, BOARD_HEIGHT]} />
        <meshStandardMaterial
          color={FELT_COLOR}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* Rectangular neon frame */}
      {[
        [0, -h - FRAME_THICKNESS / 2, BOARD_WIDTH + FRAME_THICKNESS * 2, FRAME_THICKNESS],
        [0, h + FRAME_THICKNESS / 2, BOARD_WIDTH + FRAME_THICKNESS * 2, FRAME_THICKNESS],
        [-w - FRAME_THICKNESS / 2, 0, FRAME_THICKNESS, BOARD_HEIGHT + FRAME_THICKNESS * 2],
        [w + FRAME_THICKNESS / 2, 0, FRAME_THICKNESS, BOARD_HEIGHT + FRAME_THICKNESS * 2],
      ].map(([px, pz, fw, fh], i) => (
        <mesh key={`frame-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[px, 0.015, pz]}>
          <planeGeometry args={[fw, fh]} />
          <meshStandardMaterial
            color={FRAME_NEON}
            emissive={FRAME_NEON}
            emissiveIntensity={0.6}
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>
      ))}

      {/* Center bar */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <planeGeometry args={[1, BOARD_HEIGHT]} />
        <meshStandardMaterial
          color={BAR_COLOR}
          emissive={BAR_EMISSIVE}
          emissiveIntensity={0.25}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {renderPoints()}
      {renderCheckers()}

      {/* Corner accents */}
      {[
        [-w - 0.15, -h - 0.15],
        [w + 0.15, -h - 0.15],
        [-w - 0.15, h + 0.15],
        [w + 0.15, h + 0.15],
      ].map(([x, z], i) => (
        <mesh key={`corner-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, z]}>
          <circleGeometry args={[0.35, 20]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#00f5d4' : '#f72585'}
            emissive={i % 2 === 0 ? '#00f5d4' : '#f72585'}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}
