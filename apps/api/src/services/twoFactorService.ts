/**
 * Two-Factor Authentication Service
 * Adds an extra layer of security for sensitive operations
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import type { Pool } from 'pg';

export class TwoFactorService {
  constructor(private db: Pool) {}

  /**
   * Generate 2FA secret for user
   */
  async generateSecret(userId: string, username: string): Promise<{ secret: string; qrCode: string }> {
    const secret = speakeasy.generateSecret({
      name: `Neon Oasis (${username})`,
      issuer: 'Neon Oasis',
      length: 32,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    // Store secret in database (encrypted in production!)
    await this.db.query(
      `UPDATE users SET two_factor_secret = $1, two_factor_enabled = false WHERE id = $2`,
      [secret.base32, userId]
    );

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  /**
   * Verify 2FA token
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    const result = await this.db.query<{ two_factor_secret: string; two_factor_enabled: boolean }>(
      `SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) return false;

    const { two_factor_secret, two_factor_enabled } = result.rows[0];

    if (!two_factor_secret) return false;

    const verified = speakeasy.totp.verify({
      secret: two_factor_secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after for clock drift
    });

    return verified;
  }

  /**
   * Enable 2FA for user (after verifying first token)
   */
  async enableTwoFactor(userId: string, token: string): Promise<{ success: boolean; error?: string }> {
    const verified = await this.verifyToken(userId, token);

    if (!verified) {
      return { success: false, error: 'Invalid token' };
    }

    await this.db.query(
      `UPDATE users SET two_factor_enabled = true WHERE id = $1`,
      [userId]
    );

    return { success: true };
  }

  /**
   * Disable 2FA for user
   */
  async disableTwoFactor(userId: string, token: string): Promise<{ success: boolean; error?: string }> {
    const verified = await this.verifyToken(userId, token);

    if (!verified) {
      return { success: false, error: 'Invalid token' };
    }

    await this.db.query(
      `UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1`,
      [userId]
    );

    return { success: true };
  }

  /**
   * Check if user has 2FA enabled
   */
  async is2FAEnabled(userId: string): Promise<boolean> {
    const result = await this.db.query<{ two_factor_enabled: boolean }>(
      `SELECT two_factor_enabled FROM users WHERE id = $1`,
      [userId]
    );

    return result.rows[0]?.two_factor_enabled ?? false;
  }

  /**
   * Require 2FA for sensitive operations
   */
  async require2FA(userId: string, token?: string): Promise<{ success: boolean; error?: string }> {
    const enabled = await this.is2FAEnabled(userId);

    if (!enabled) {
      return { success: true }; // 2FA not enabled, allow operation
    }

    if (!token) {
      return { success: false, error: '2FA token required' };
    }

    const verified = await this.verifyToken(userId, token);

    if (!verified) {
      return { success: false, error: 'Invalid 2FA token' };
    }

    return { success: true };
  }
}
