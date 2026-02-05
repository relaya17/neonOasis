/**
 * AML (Anti-Money Laundering) Service
 * Monitors transactions, detects suspicious patterns, and generates alerts
 */

import type { Pool } from 'pg';
import { pool } from '../db/index.js';

export interface AMLAlert {
  id: string;
  user_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  metadata?: any;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface UserBlock {
  id: string;
  user_id: string;
  reason: string;
  blocked_by?: string;
  is_permanent: boolean;
  expires_at?: string;
  created_at: string;
  lifted_at?: string;
  lifted_by?: string;
}

export class AMLService {
  constructor(private db: Pool) {}

  /**
   * Check if user is blocked
   */
  async isUserBlocked(userId: string): Promise<boolean> {
    const result = await this.db.query<{ is_blocked: boolean }>(
      `SELECT is_blocked FROM users WHERE id = $1`,
      [userId]
    );
    return result.rows[0]?.is_blocked ?? false;
  }

  /**
   * Block user
   */
  async blockUser(params: {
    userId: string;
    reason: string;
    blockedBy?: string;
    isPermanent?: boolean;
    expiresAt?: Date;
  }): Promise<{ success: boolean; error?: string }> {
    const { userId, reason, blockedBy, isPermanent = false, expiresAt } = params;
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Set is_blocked flag
      await client.query(
        `UPDATE users SET is_blocked = true, updated_at = now() WHERE id = $1`,
        [userId]
      );

      // Create block record
      await client.query(
        `INSERT INTO user_blocks (user_id, reason, blocked_by, is_permanent, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, reason, blockedBy, isPermanent, expiresAt]
      );

      // Log event
      await client.query(
        `INSERT INTO aml_events (user_id, event_type, description, metadata)
         VALUES ($1, 'user_blocked', $2, $3)`,
        [userId, reason, JSON.stringify({ blockedBy, isPermanent, expiresAt })]
      );

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Block user error:', error);
      return { success: false, error: 'Failed to block user' };
    } finally {
      client.release();
    }
  }

  /**
   * Unblock user
   */
  async unblockUser(params: {
    userId: string;
    liftedBy?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { userId, liftedBy } = params;
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Clear is_blocked flag
      await client.query(
        `UPDATE users SET is_blocked = false, updated_at = now() WHERE id = $1`,
        [userId]
      );

      // Update block records
      await client.query(
        `UPDATE user_blocks 
         SET lifted_at = now(), lifted_by = $2 
         WHERE user_id = $1 AND lifted_at IS NULL`,
        [userId, liftedBy]
      );

      // Log event
      await client.query(
        `INSERT INTO aml_events (user_id, event_type, description, metadata)
         VALUES ($1, 'user_unblocked', 'User unblocked', $2)`,
        [userId, JSON.stringify({ liftedBy })]
      );

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Unblock user error:', error);
      return { success: false, error: 'Failed to unblock user' };
    } finally {
      client.release();
    }
  }

  /**
   * Create AML alert
   */
  async createAlert(params: {
    userId: string;
    alertType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description?: string;
    metadata?: any;
  }): Promise<AMLAlert | null> {
    const { userId, alertType, severity, description, metadata } = params;

    const result = await this.db.query<AMLAlert>(
      `INSERT INTO aml_alerts (user_id, alert_type, severity, description, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, alertType, severity, description, metadata ? JSON.stringify(metadata) : null]
    );

    return result.rows[0] || null;
  }

  /**
   * Get open alerts
   */
  async getOpenAlerts(limit: number = 50): Promise<AMLAlert[]> {
    const result = await this.db.query<AMLAlert>(
      `SELECT * FROM aml_alerts WHERE status IN ('open', 'investigating') ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(params: {
    alertId: string;
    status: 'open' | 'investigating' | 'resolved' | 'false_positive';
    reviewedBy?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { alertId, status, reviewedBy } = params;

    try {
      await this.db.query(
        `UPDATE aml_alerts 
         SET status = $1, reviewed_by = $2, reviewed_at = now(), updated_at = now()
         WHERE id = $3`,
        [status, reviewedBy, alertId]
      );
      return { success: true };
    } catch (error) {
      console.error('Update alert status error:', error);
      return { success: false, error: 'Failed to update alert' };
    }
  }

  /**
   * Check for high volume transactions (potential money laundering)
   */
  async checkHighVolumeTransactions(userId: string): Promise<void> {
    // Get last 24 hours transactions
    const result = await this.db.query<{ total: string; count: string }>(
      `SELECT 
         COALESCE(SUM(ABS(amount)), 0)::text as total,
         COUNT(*)::text as count
       FROM transactions
       WHERE user_id = $1 
         AND created_at >= now() - interval '24 hours'`,
      [userId]
    );

    const total = parseFloat(result.rows[0]?.total ?? '0');
    const count = parseInt(result.rows[0]?.count ?? '0');

    // Threshold: more than 10,000 coins or 50+ transactions in 24h
    if (total > 10000 || count > 50) {
      await this.createAlert({
        userId,
        alertType: 'high_volume',
        severity: total > 50000 ? 'critical' : total > 25000 ? 'high' : 'medium',
        description: `High volume activity detected: ${total.toFixed(2)} coins in ${count} transactions`,
        metadata: { total, count, period: '24h' },
      });
    }
  }

  /**
   * Check for rapid deposit-withdraw pattern (potential wash trading)
   */
  async checkRapidDepositWithdraw(userId: string): Promise<void> {
    // Get recent deposit-like and withdraw-like transactions
    const result = await this.db.query<{ deposits: string; withdraws: string }>(
      `SELECT 
         COUNT(*) FILTER (WHERE amount > 0)::text as deposits,
         COUNT(*) FILTER (WHERE amount < 0)::text as withdraws
       FROM transactions
       WHERE user_id = $1 
         AND created_at >= now() - interval '1 hour'
         AND type IN ('purchase', 'bet', 'win')`,
      [userId]
    );

    const deposits = parseInt(result.rows[0]?.deposits ?? '0');
    const withdraws = parseInt(result.rows[0]?.withdraws ?? '0');

    // Suspicious if more than 5 deposit-withdraw cycles in 1 hour
    if (deposits > 5 && withdraws > 5) {
      await this.createAlert({
        userId,
        alertType: 'rapid_deposit_withdraw',
        severity: 'high',
        description: `Rapid deposit-withdraw pattern: ${deposits} deposits, ${withdraws} withdraws in 1 hour`,
        metadata: { deposits, withdraws, period: '1h' },
      });
    }
  }

  /**
   * Monitor user for suspicious activity (call after each transaction)
   */
  async monitorUser(userId: string): Promise<void> {
    try {
      await Promise.all([
        this.checkHighVolumeTransactions(userId),
        this.checkRapidDepositWithdraw(userId),
      ]);
    } catch (error) {
      console.error('AML monitoring error:', error);
    }
  }

  /**
   * Check and flag suspicious pair (collusion detection)
   */
  async checkAndFlagSuspiciousPair(userId1: string, userId2: string, sessionId: string): Promise<void> {
    // Check if these users play together frequently
    const result = await this.db.query<{ count: string }>(
      `SELECT COUNT(*)::text as count
       FROM game_sessions
       WHERE (player1_id = $1 AND player2_id = $2) OR (player1_id = $2 AND player2_id = $1)
       AND created_at >= now() - interval '24 hours'`,
      [userId1, userId2]
    );

    const count = parseInt(result.rows[0]?.count ?? '0');
    
    // Flag if they play together more than 10 times in 24h (potential collusion)
    if (count > 10) {
      await this.createAlert({
        userId: userId1,
        alertType: 'suspicious_pair',
        severity: 'high',
        description: `Suspicious pair detected: ${count} games together in 24h`,
        metadata: { userId1, userId2, sessionId, count },
      });
    }
  }

  /**
   * Get flagged sessions for admin review
   */
  async getFlaggedSessions(limit: number = 50): Promise<any[]> {
    const result = await this.db.query(
      `SELECT gs.*, u1.username as player1_username, u2.username as player2_username
       FROM game_sessions gs
       LEFT JOIN users u1 ON gs.player1_id = u1.id
       LEFT JOIN users u2 ON gs.player2_id = u2.id
       WHERE gs.is_flagged = true
       ORDER BY gs.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
}

// Export singleton instance
let amlServiceInstance: AMLService | null = null;

export function getAMLService(): AMLService {
  if (!pool) throw new Error('Database not configured');
  if (!amlServiceInstance) {
    amlServiceInstance = new AMLService(pool);
  }
  return amlServiceInstance;
}

// Export convenience functions
export async function checkAndFlagSuspiciousPair(userId1: string, userId2: string, sessionId: string): Promise<void> {
  const service = getAMLService();
  await service.checkAndFlagSuspiciousPair(userId1, userId2, sessionId);
}

export async function getFlaggedSessions(limit: number = 50): Promise<any[]> {
  const service = getAMLService();
  return service.getFlaggedSessions(limit);
}
