import type { FastifyRequest, FastifyReply } from 'fastify';
import { startP2PMatch, endP2PMatch } from '../services/gameService';
import { placeBackingBet, getBackingHistory, cancelBackingBet, getBackingOdds } from '../services/walletService';
import { emitBalanceUpdate } from '../sockets/ioRef';
import { getIdempotency, setIdempotency } from '../services/idempotencyService';

type StartBody = {
  gameId: string;
  gameKind?: string;
  player1Id: string;
  player2Id: string;
  stakeAmount: string;
  idempotencyKey?: string;
};

type EndBody = {
  gameId: string;
  winnerId: string;
  loserId: string;
  sessionId: string;
  stakeAmount: string;
  idempotencyKey?: string;
};

type BackingBody = {
  gameId: string;
  supporterId: string;
  playerId: string;
  amount: string;
  odds?: number;
  idempotencyKey?: string;
};

type BackingHistoryQuery = {
  supporterId: string;
  limit?: string;
};

type BackingCancelBody = {
  betId: string;
  supporterId: string;
  idempotencyKey?: string;
};

type BackingOddsQuery = {
  gameId: string;
  playerId: string;
};

export async function postP2PMatchStart(
  req: FastifyRequest<{ Body: StartBody }>,
  reply: FastifyReply
) {
  try {
    const body = (req.body ?? {}) as StartBody;
    const { gameId, gameKind = 'backgammon', player1Id, player2Id, stakeAmount, idempotencyKey } = body;
    const ip = req.ip;

    if (idempotencyKey) {
      const stored = await getIdempotency(idempotencyKey);
      if (stored && stored.responseType === 'p2p_start') {
        return reply.send(stored.responsePayload as { sessionId: string });
      }
    }

    if (!gameId || !player1Id || !player2Id || !stakeAmount) {
      const err = { error: 'gameId, player1Id, player2Id, stakeAmount required' };
      if (idempotencyKey) await setIdempotency(idempotencyKey, 'p2p_start_error', err);
      return reply.status(400).send(err);
    }
    const result = await startP2PMatch(
      gameId,
      gameKind,
      player1Id,
      player2Id,
      stakeAmount,
      ip
    );
    if (!result.ok) {
      const err = { error: (result as { error: string }).error };
      if (idempotencyKey) await setIdempotency(idempotencyKey, 'p2p_start_error', err);
      return reply.status(400).send(err);
    }
    const payload = { sessionId: result.sessionId };
    if (idempotencyKey) await setIdempotency(idempotencyKey, 'p2p_start', payload);
    return reply.send(payload);
  } catch (_e) {
    return reply.status(500).send({ error: 'P2P start failed' });
  }
}

export async function postP2PMatchEnd(
  req: FastifyRequest<{ Body: EndBody }>,
  reply: FastifyReply
) {
  try {
    const body = (req.body ?? {}) as EndBody;
    const { gameId, winnerId, loserId, sessionId, stakeAmount, idempotencyKey } = body;

    if (idempotencyKey) {
      const stored = await getIdempotency(idempotencyKey);
      if (stored && stored.responseType === 'p2p_end') {
        return reply.send(stored.responsePayload as { winnerNewBalance: string; feeAmount: string });
      }
    }

    if (!gameId || !winnerId || !loserId || !sessionId || !stakeAmount) {
      const err = { error: 'gameId, winnerId, loserId, sessionId, stakeAmount required' };
      if (idempotencyKey) await setIdempotency(idempotencyKey, 'p2p_end_error', err);
      return reply.status(400).send(err);
    }
    const result = await endP2PMatch(gameId, winnerId, loserId, sessionId, stakeAmount);
    if (!result.success) {
      const err = { error: (result as { error: string }).error };
      if (idempotencyKey) await setIdempotency(idempotencyKey, 'p2p_end_error', err);
      return reply.status(400).send(err);
    }
    if (result.winnerNewBalance) emitBalanceUpdate(winnerId, result.winnerNewBalance);
    const payload = {
      winnerNewBalance: result.winnerNewBalance,
      feeAmount: result.feeAmount,
    };
    if (idempotencyKey) await setIdempotency(idempotencyKey, 'p2p_end', payload);
    return reply.send(payload);
  } catch (_e) {
    return reply.status(500).send({ error: 'P2P end failed' });
  }
}

export async function postBackingBet(
  req: FastifyRequest<{ Body: BackingBody }>,
  reply: FastifyReply
) {
  try {
    const body = (req.body ?? {}) as BackingBody;
    const { gameId, supporterId, playerId, amount, odds, idempotencyKey } = body;

    if (idempotencyKey) {
      const stored = await getIdempotency(idempotencyKey);
      if (stored && stored.responseType === 'backing_bet') {
        return reply.send(stored.responsePayload as { betId: string });
      }
    }

    if (!gameId || !supporterId || !playerId || !amount) {
      const err = { error: 'gameId, supporterId, playerId, amount required' };
      if (idempotencyKey) await setIdempotency(idempotencyKey, 'backing_bet_error', err);
      return reply.status(400).send(err);
    }

    const result = await placeBackingBet(gameId, supporterId, playerId, amount, odds);
    if (!result.ok) {
      const err = { error: (result as { error: string }).error };
      if (idempotencyKey) await setIdempotency(idempotencyKey, 'backing_bet_error', err);
      return reply.status(400).send(err);
    }
    const payload = { betId: result.betId };
    if (idempotencyKey) await setIdempotency(idempotencyKey, 'backing_bet', payload);
    return reply.send(payload);
  } catch (_e) {
    return reply.status(500).send({ error: 'Backing bet failed' });
  }
}

export async function getBackingHistoryHandler(
  req: FastifyRequest<{ Querystring: BackingHistoryQuery }>,
  reply: FastifyReply
) {
  try {
    const { supporterId, limit } = req.query ?? {};
    if (!supporterId) return reply.status(400).send({ error: 'supporterId required' });
    const lim = limit ? parseInt(limit, 10) : 20;
    const history = await getBackingHistory(supporterId, lim);
    return reply.send({ history });
  } catch (_e) {
    return reply.status(500).send({ error: 'Backing history failed' });
  }
}

export async function postBackingCancel(
  req: FastifyRequest<{ Body: BackingCancelBody }>,
  reply: FastifyReply
) {
  try {
    const { betId, supporterId, idempotencyKey } = (req.body ?? {}) as BackingCancelBody;
    if (idempotencyKey) {
      const stored = await getIdempotency(idempotencyKey);
      if (stored && stored.responseType === 'backing_cancel') {
        return reply.send(stored.responsePayload as { ok: true });
      }
    }
    if (!betId || !supporterId) {
      const err = { error: 'betId, supporterId required' };
      if (idempotencyKey) await setIdempotency(idempotencyKey, 'backing_cancel_error', err);
      return reply.status(400).send(err);
    }
    const result = await cancelBackingBet(betId, supporterId);
    if (!result.ok) {
      const err = { error: (result as { error: string }).error };
      if (idempotencyKey) await setIdempotency(idempotencyKey, 'backing_cancel_error', err);
      return reply.status(400).send(err);
    }
    const payload = { ok: true };
    if (idempotencyKey) await setIdempotency(idempotencyKey, 'backing_cancel', payload);
    return reply.send(payload);
  } catch (_e) {
    return reply.status(500).send({ error: 'Backing cancel failed' });
  }
}

export async function getBackingOddsHandler(
  req: FastifyRequest<{ Querystring: BackingOddsQuery }>,
  reply: FastifyReply
) {
  try {
    const { gameId, playerId } = req.query ?? {};
    if (!gameId || !playerId) return reply.status(400).send({ error: 'gameId, playerId required' });
    const result = await getBackingOdds(gameId, playerId);
    return reply.send(result);
  } catch (_e) {
    return reply.status(500).send({ error: 'Backing odds failed' });
  }
}
