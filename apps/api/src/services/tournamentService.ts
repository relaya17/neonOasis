/**
 * Tournament Service
 * Handles tournament creation, registration, bracket generation, and prize distribution
 */

import type { Pool, PoolClient } from 'pg';

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  game_type: string;
  entry_fee: string;
  prize_pool: string;
  max_participants: number;
  current_participants: number;
  status: 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';
  start_time?: string;
  end_time?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  seed: number;
  status: 'active' | 'eliminated' | 'winner';
  current_round: number;
  joined_at: string;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  player1_id?: string;
  player2_id?: string;
  winner_id?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  game_id?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export class TournamentService {
  constructor(private db: Pool) {}

  /**
   * Create a new tournament
   */
  async createTournament(params: {
    name: string;
    description?: string;
    game_type?: string;
    entry_fee: number;
    max_participants: number;
    created_by?: string;
  }): Promise<Tournament> {
    const { name, description, game_type = 'backgammon', entry_fee, max_participants, created_by } = params;

    const result = await this.db.query<Tournament>(
      `INSERT INTO tournaments (name, description, game_type, entry_fee, max_participants, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, game_type, entry_fee, max_participants, created_by]
    );

    return result.rows[0];
  }

  /**
   * Get all open tournaments
   */
  async getOpenTournaments(): Promise<Tournament[]> {
    const result = await this.db.query<Tournament>(
      `SELECT * FROM tournaments WHERE status = 'open' ORDER BY start_time ASC, created_at ASC`
    );
    return result.rows;
  }

  /**
   * Get tournament by ID
   */
  async getTournamentById(tournamentId: string): Promise<Tournament | null> {
    const result = await this.db.query<Tournament>(
      `SELECT * FROM tournaments WHERE id = $1`,
      [tournamentId]
    );
    return result.rows[0] || null;
  }

  /**
   * Register user for tournament
   */
  async registerForTournament(tournamentId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // 1. Get tournament
      const tournamentRes = await client.query<Tournament>(
        `SELECT * FROM tournaments WHERE id = $1 FOR UPDATE`,
        [tournamentId]
      );

      if (tournamentRes.rows.length === 0) {
        return { success: false, error: 'Tournament not found' };
      }

      const tournament = tournamentRes.rows[0];

      if (tournament.status !== 'open') {
        return { success: false, error: 'Tournament is not open for registration' };
      }

      if (tournament.current_participants >= tournament.max_participants) {
        return { success: false, error: 'Tournament is full' };
      }

      // 2. Check if user already registered
      const existingRes = await client.query(
        `SELECT id FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2`,
        [tournamentId, userId]
      );

      if (existingRes.rows.length > 0) {
        return { success: false, error: 'Already registered' };
      }

      // 3. Check user balance
      const userRes = await client.query<{ balance: string }>(
        `SELECT balance FROM users WHERE id = $1`,
        [userId]
      );

      if (userRes.rows.length === 0) {
        return { success: false, error: 'User not found' };
      }

      const userBalance = parseFloat(userRes.rows[0].balance);
      const entryFee = parseFloat(tournament.entry_fee);

      if (userBalance < entryFee) {
        return { success: false, error: 'Insufficient balance' };
      }

      // 4. Deduct entry fee
      if (entryFee > 0) {
        await client.query(
          `UPDATE users SET balance = balance - $1, updated_at = now() WHERE id = $2`,
          [entryFee, userId]
        );

        // Record transaction
        await client.query(
          `INSERT INTO transactions (user_id, amount, type, reference_id)
           VALUES ($1, $2, 'bet', $3)`,
          [userId, -entryFee, tournamentId]
        );

        // Add to prize pool
        await client.query(
          `UPDATE tournaments SET prize_pool = prize_pool + $1, updated_at = now() WHERE id = $2`,
          [entryFee * 0.9, tournamentId] // 10% house fee
        );

        // House revenue
        await client.query(
          `INSERT INTO admin_revenues (amount, source_type, source_id)
           VALUES ($1, 'tournament', $2)`,
          [entryFee * 0.1, tournamentId]
        );
      }

      // 5. Add participant (seed = current_participants + 1)
      const seed = tournament.current_participants + 1;
      await client.query(
        `INSERT INTO tournament_participants (tournament_id, user_id, seed)
         VALUES ($1, $2, $3)`,
        [tournamentId, userId, seed]
      );

      // 6. Update participant count
      await client.query(
        `UPDATE tournaments SET current_participants = current_participants + 1, updated_at = now() WHERE id = $1`,
        [tournamentId]
      );

      // 7. If tournament is now full, change status
      if (tournament.current_participants + 1 >= tournament.max_participants) {
        await client.query(
          `UPDATE tournaments SET status = 'full', updated_at = now() WHERE id = $1`,
          [tournamentId]
        );
      }

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Tournament registration error:', error);
      return { success: false, error: 'Registration failed' };
    } finally {
      client.release();
    }
  }

  /**
   * Get tournament participants
   */
  async getTournamentParticipants(tournamentId: string): Promise<TournamentParticipant[]> {
    const result = await this.db.query<TournamentParticipant>(
      `SELECT * FROM tournament_participants WHERE tournament_id = $1 ORDER BY seed ASC`,
      [tournamentId]
    );
    return result.rows;
  }

  /**
   * Generate brackets for tournament (call when tournament is full)
   */
  async generateBrackets(tournamentId: string): Promise<{ success: boolean; error?: string }> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // 1. Get tournament
      const tournamentRes = await client.query<Tournament>(
        `SELECT * FROM tournaments WHERE id = $1 FOR UPDATE`,
        [tournamentId]
      );

      if (tournamentRes.rows.length === 0) {
        return { success: false, error: 'Tournament not found' };
      }

      const tournament = tournamentRes.rows[0];

      if (tournament.status !== 'full') {
        return { success: false, error: 'Tournament is not full yet' };
      }

      // 2. Get participants
      const participantsRes = await client.query<TournamentParticipant>(
        `SELECT * FROM tournament_participants WHERE tournament_id = $1 ORDER BY seed ASC`,
        [tournamentId]
      );

      const participants = participantsRes.rows;
      const numParticipants = participants.length;

      if (numParticipants < 2) {
        return { success: false, error: 'Not enough participants' };
      }

      // 3. Generate first round matches
      const matchesPerRound = Math.floor(numParticipants / 2);

      for (let i = 0; i < matchesPerRound; i++) {
        const player1 = participants[i * 2];
        const player2 = participants[i * 2 + 1];

        await client.query(
          `INSERT INTO tournament_matches (tournament_id, round, match_number, player1_id, player2_id)
           VALUES ($1, 1, $2, $3, $4)`,
          [tournamentId, i + 1, player1.user_id, player2.user_id]
        );
      }

      // 4. Update tournament status
      await client.query(
        `UPDATE tournaments SET status = 'in_progress', start_time = now(), updated_at = now() WHERE id = $1`,
        [tournamentId]
      );

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Bracket generation error:', error);
      return { success: false, error: 'Failed to generate brackets' };
    } finally {
      client.release();
    }
  }

  /**
   * Get tournament matches
   */
  async getTournamentMatches(tournamentId: string): Promise<TournamentMatch[]> {
    const result = await this.db.query<TournamentMatch>(
      `SELECT * FROM tournament_matches WHERE tournament_id = $1 ORDER BY round ASC, match_number ASC`,
      [tournamentId]
    );
    return result.rows;
  }

  /**
   * Record match winner and advance to next round
   */
  async recordMatchWinner(matchId: string, winnerId: string): Promise<{ success: boolean; error?: string }> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // 1. Update match
      const matchRes = await client.query<TournamentMatch>(
        `UPDATE tournament_matches 
         SET winner_id = $1, status = 'completed', completed_at = now() 
         WHERE id = $2
         RETURNING *`,
        [winnerId, matchId]
      );

      if (matchRes.rows.length === 0) {
        return { success: false, error: 'Match not found' };
      }

      const match = matchRes.rows[0];

      // 2. Eliminate loser
      const loserId = match.player1_id === winnerId ? match.player2_id : match.player1_id;

      if (loserId) {
        await client.query(
          `UPDATE tournament_participants SET status = 'eliminated' WHERE tournament_id = $1 AND user_id = $2`,
          [match.tournament_id, loserId]
        );
      }

      // 3. Check if round is complete
      const remainingMatchesRes = await client.query(
        `SELECT COUNT(*) as count FROM tournament_matches WHERE tournament_id = $1 AND round = $2 AND status != 'completed'`,
        [match.tournament_id, match.round]
      );

      const remainingMatches = parseInt(remainingMatchesRes.rows[0].count);

      if (remainingMatches === 0) {
        // Round complete, check if tournament is complete
        const activeParticipantsRes = await client.query(
          `SELECT COUNT(*) as count FROM tournament_participants WHERE tournament_id = $1 AND status = 'active'`,
          [match.tournament_id]
        );

        const activeParticipants = parseInt(activeParticipantsRes.rows[0].count);

        if (activeParticipants === 1) {
          // Tournament complete!
          await client.query(
            `UPDATE tournaments SET status = 'completed', end_time = now(), updated_at = now() WHERE id = $1`,
            [match.tournament_id]
          );

          await client.query(
            `UPDATE tournament_participants SET status = 'winner' WHERE tournament_id = $1 AND user_id = $2`,
            [match.tournament_id, winnerId]
          );

          // Distribute prizes
          await this.distributePrizes(client, match.tournament_id);
        } else {
          // Generate next round
          await this.generateNextRound(client, match.tournament_id, match.round);
        }
      }

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Record match winner error:', error);
      return { success: false, error: 'Failed to record winner' };
    } finally {
      client.release();
    }
  }

  /**
   * Generate next round matches
   */
  private async generateNextRound(client: PoolClient, tournamentId: string, currentRound: number): Promise<void> {
    const winnersRes = await client.query<{ winner_id: string }>(
      `SELECT winner_id FROM tournament_matches 
       WHERE tournament_id = $1 AND round = $2 AND status = 'completed'
       ORDER BY match_number ASC`,
      [tournamentId, currentRound]
    );

    const winners = winnersRes.rows.map(r => r.winner_id).filter(Boolean);
    const nextRound = currentRound + 1;
    const matchesPerRound = Math.floor(winners.length / 2);

    for (let i = 0; i < matchesPerRound; i++) {
      await client.query(
        `INSERT INTO tournament_matches (tournament_id, round, match_number, player1_id, player2_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [tournamentId, nextRound, i + 1, winners[i * 2], winners[i * 2 + 1]]
      );
    }
  }

  /**
   * Distribute prizes to winners
   */
  private async distributePrizes(client: PoolClient, tournamentId: string): Promise<void> {
    const tournamentRes = await client.query<Tournament>(
      `SELECT * FROM tournaments WHERE id = $1`,
      [tournamentId]
    );

    if (tournamentRes.rows.length === 0) return;

    const tournament = tournamentRes.rows[0];
    const prizePool = parseFloat(tournament.prize_pool);

    // Get winner
    const winnerRes = await client.query<{ user_id: string }>(
      `SELECT user_id FROM tournament_participants WHERE tournament_id = $1 AND status = 'winner'`,
      [tournamentId]
    );

    if (winnerRes.rows.length === 0) return;

    const winnerId = winnerRes.rows[0].user_id;

    // Simple prize distribution: 100% to winner (can be customized)
    const prize = prizePool;

    // Credit winner
    await client.query(
      `UPDATE users SET balance = balance + $1, updated_at = now() WHERE id = $2`,
      [prize, winnerId]
    );

    // Record transaction
    await client.query(
      `INSERT INTO transactions (user_id, amount, type, reference_id)
       VALUES ($1, $2, 'win', $3)`,
      [winnerId, prize, tournamentId]
    );

    // Record prize
    await client.query(
      `INSERT INTO tournament_prizes (tournament_id, placement, prize_amount, user_id, claimed, claimed_at)
       VALUES ($1, 1, $2, $3, true, now())`,
      [tournamentId, prize, winnerId]
    );
  }
}
