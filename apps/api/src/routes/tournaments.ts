/**
 * Tournament Routes
 */

import type { FastifyInstance } from 'fastify';
import {
  getTournaments,
  getTournament,
  createTournament,
  registerForTournament,
  startTournament,
  recordMatchWinner,
} from '../controllers/tournamentController';

export async function tournamentsRoutes(fastify: FastifyInstance) {
  // Get all open tournaments
  fastify.get('/api/tournaments', getTournaments);

  // Get specific tournament
  fastify.get('/api/tournaments/:id', getTournament);

  // Create tournament (admin)
  fastify.post('/api/tournaments', createTournament);

  // Register for tournament
  fastify.post('/api/tournaments/:id/register', registerForTournament);

  // Start tournament (generate brackets)
  fastify.post('/api/tournaments/:id/start', startTournament);

  // Record match winner
  fastify.post('/api/tournaments/matches/:matchId/winner', recordMatchWinner);
}
