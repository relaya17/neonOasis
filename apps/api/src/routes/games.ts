import type { FastifyInstance } from 'fastify';
import { postGameWin } from '../controllers/gamesController';
import { getProvablyFairRoll, postRngCommit, getRngReveal } from '../controllers/rngController';
import {
  postP2PMatchStart,
  postP2PMatchEnd,
  postBackingBet,
  getBackingHistoryHandler,
  postBackingCancel,
  getBackingOddsHandler,
} from '../controllers/p2pController';
import { getMatchmaking } from '../controllers/matchmakingController';

export async function gamesRoutes(fastify: FastifyInstance) {
  fastify.post('/api/games/win', postGameWin);
  fastify.get('/api/games/rng/roll', getProvablyFairRoll);
  fastify.post('/api/games/rng/roll', getProvablyFairRoll);
  fastify.post('/api/games/rng/commit', postRngCommit);
  fastify.get('/api/games/rng/reveal', getRngReveal);
  fastify.post('/api/games/p2p/start', postP2PMatchStart);
  fastify.post('/api/games/p2p/end', postP2PMatchEnd);
  fastify.post('/api/games/p2p/back', postBackingBet);
  fastify.get('/api/games/p2p/back/history', getBackingHistoryHandler);
  fastify.post('/api/games/p2p/back/cancel', postBackingCancel);
  fastify.get('/api/games/p2p/back/odds', getBackingOddsHandler);
  fastify.get('/api/matchmaking', getMatchmaking);
}
