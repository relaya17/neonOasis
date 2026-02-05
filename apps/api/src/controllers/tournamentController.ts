/**
 * Tournament Controller
 * REST endpoints for tournament management
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { TournamentService } from '../services/tournamentService.js';
import { db } from '../db/index.js';

const tournamentService = new TournamentService(db);

/**
 * GET /api/tournaments — Get all open tournaments
 */
export async function getTournaments(req: FastifyRequest, reply: FastifyReply) {
  try {
    const tournaments = await tournamentService.getOpenTournaments();
    return reply.send({ tournaments });
  } catch (error) {
    console.error('Get tournaments error:', error);
    return reply.status(500).send({ error: 'Failed to fetch tournaments' });
  }
}

/**
 * GET /api/tournaments/:id — Get tournament details
 */
export async function getTournament(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const tournament = await tournamentService.getTournamentById(id);

    if (!tournament) {
      return reply.status(404).send({ error: 'Tournament not found' });
    }

    const participants = await tournamentService.getTournamentParticipants(id);
    const matches = await tournamentService.getTournamentMatches(id);

    return reply.send({ tournament, participants, matches });
  } catch (error) {
    console.error('Get tournament error:', error);
    return reply.status(500).send({ error: 'Failed to fetch tournament' });
  }
}

/**
 * POST /api/tournaments — Create a new tournament (admin only)
 */
export async function createTournament(
  req: FastifyRequest<{
    Body: {
      name: string;
      description?: string;
      game_type?: string;
      entry_fee: number;
      max_participants: number;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { name, description, game_type, entry_fee, max_participants } = req.body;

    if (!name || entry_fee === undefined || !max_participants) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }

    // TODO: Check if user is admin
    const userId = (req as any).userId || null;

    const tournament = await tournamentService.createTournament({
      name,
      description,
      game_type,
      entry_fee,
      max_participants,
      created_by: userId,
    });

    return reply.send({ success: true, tournament });
  } catch (error) {
    console.error('Create tournament error:', error);
    return reply.status(500).send({ error: 'Failed to create tournament' });
  }
}

/**
 * POST /api/tournaments/:id/register — Register for tournament
 */
export async function registerForTournament(
  req: FastifyRequest<{
    Params: { id: string };
    Body: { userId: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return reply.status(400).send({ error: 'Missing userId' });
    }

    const result = await tournamentService.registerForTournament(id, userId);

    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }

    return reply.send({ success: true });
  } catch (error) {
    console.error('Register for tournament error:', error);
    return reply.status(500).send({ error: 'Failed to register' });
  }
}

/**
 * POST /api/tournaments/:id/start — Start tournament (generate brackets)
 */
export async function startTournament(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;

    // TODO: Check if user is admin

    const result = await tournamentService.generateBrackets(id);

    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }

    return reply.send({ success: true });
  } catch (error) {
    console.error('Start tournament error:', error);
    return reply.status(500).send({ error: 'Failed to start tournament' });
  }
}

/**
 * POST /api/tournaments/matches/:matchId/winner — Record match winner
 */
export async function recordMatchWinner(
  req: FastifyRequest<{
    Params: { matchId: string };
    Body: { winnerId: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { matchId } = req.params;
    const { winnerId } = req.body;

    if (!winnerId) {
      return reply.status(400).send({ error: 'Missing winnerId' });
    }

    const result = await tournamentService.recordMatchWinner(matchId, winnerId);

    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }

    return reply.send({ success: true });
  } catch (error) {
    console.error('Record match winner error:', error);
    return reply.status(500).send({ error: 'Failed to record winner' });
  }
}
