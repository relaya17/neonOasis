import type { FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../db';
import * as adminService from '../services/adminService';
import { getRakeRate, setRakeRate } from '../config/rake';
import { getIo } from '../sockets/ioRef';
import { getActiveRooms, shutdownRoom } from '../modules/room/roomMeta';
import { getMintDailyBudget, setMintDailyCap } from '../services/walletService';
import { getFlaggedSessions } from '../services/amlService';

const fallbackStats = {
  revenue: 45200,
  activePlayers: 2540,
  aiAlerts: 12,
  revenueByHour: [
    { name: '08:00', revenue: 4000, players: 240 },
    { name: '12:00', revenue: 7500, players: 600 },
    { name: '16:00', revenue: 12000, players: 1100 },
    { name: '20:00', revenue: 18500, players: 2500 },
    { name: '00:00', revenue: 22100, players: 1800 },
  ],
};

const fallbackAlerts = [
  { id: '1', type: 'bot', userId: 'u_abc', room: 'BACKGAMMON_1', time: '14:32' },
  { id: '2', type: 'minor', userId: 'u_xyz', room: null, time: '15:01' },
];

export async function getAdminStats(_req: FastifyRequest, reply: FastifyReply) {
  if (!pool) return reply.send(fallbackStats);
  try {
    const stats = await adminService.getAdminStats();
    return reply.send({
      revenue: stats.revenue,
      activePlayers: stats.activePlayers,
      aiAlerts: stats.aiAlerts,
      churnRate: stats.churnRate,
      revenueByHour: stats.revenueByHour,
    });
  } catch {
    return reply.send(fallbackStats);
  }
}

export async function getAdminAlerts(_req: FastifyRequest, reply: FastifyReply) {
  if (!pool) return reply.send({ alerts: fallbackAlerts });
  try {
    const rows = await adminService.getAIFraudAlerts(50);
    return reply.send({
      alerts: rows.map((r) => ({
        id: r.id,
        type: r.type,
        userId: r.userId,
        room: r.roomId,
        time: r.time,
      })),
    });
  } catch {
    return reply.send({ alerts: fallbackAlerts });
  }
}

export async function getAdminUsers(
  req: FastifyRequest<{ Querystring: { q?: string } }>,
  reply: FastifyReply
) {
  const q = req.query.q ?? '';
  try {
    const users = await adminService.searchUsers(q, 50);
    return reply.send({ users });
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Failed to search users' });
  }
}

export async function getAdminUserTransactions(
  req: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) {
  const { userId } = req.params;
  try {
    const transactions = await adminService.getUserTransactions(userId, 100);
    return reply.send({ transactions });
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: 'Failed to get transactions' });
  }
}

export async function getAdminRake(_req: FastifyRequest, reply: FastifyReply) {
  return reply.send({ rake: getRakeRate() });
}

export async function putAdminRake(
  req: FastifyRequest<{ Body: { rake?: number } }>,
  reply: FastifyReply
) {
  const rate = req.body?.rake;
  if (typeof rate !== 'number' || rate < 0 || rate > 1) {
    return reply.status(400).send({ error: 'rake must be a number between 0 and 1' });
  }
  const updated = setRakeRate(rate);
  await adminService.logAdminAudit('rake_updated', { details: { rake: updated } });
  return reply.send({ rake: updated });
}

export async function getAdminRooms(_req: FastifyRequest, reply: FastifyReply) {
  const rooms = getActiveRooms();
  return reply.send({ rooms });
}

export async function postAdminRoomShutdown(
  req: FastifyRequest<{ Params: { roomId: string } }>,
  reply: FastifyReply
) {
  const io = getIo();
  if (!io) return reply.status(503).send({ error: 'Socket server not ready' });
  const { roomId } = req.params;
  const disconnected = shutdownRoom(io, roomId);
  await adminService.logAdminAudit('room_shutdown', { targetType: 'room', targetId: roomId, details: { disconnected } });
  return reply.send({ roomId, disconnected });
}

export async function postAdminBlockUser(
  req: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) {
  const { userId } = req.params;
  const result = await adminService.blockUser(userId);
  if (!result.success) return reply.status(400).send({ error: result.error });
  return reply.send({ ok: true });
}

export async function postAdminUnblockUser(
  req: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply
) {
  const { userId } = req.params;
  const result = await adminService.unblockUser(userId);
  if (!result.success) return reply.status(400).send({ error: result.error });
  return reply.send({ ok: true });
}

/** לוח בקרה מוניטרי — מכסת הנפקת Oasis יומית */
export async function getAdminMintBudget(_req: FastifyRequest, reply: FastifyReply) {
  const budget = await getMintDailyBudget();
  if (!budget) return reply.send({ budgetDate: null, mintedToday: '0', dailyCap: '100000' });
  return reply.send(budget);
}

export async function putAdminMintBudget(
  req: FastifyRequest<{ Body: { dailyCap?: number } }>,
  reply: FastifyReply
) {
  const cap = req.body?.dailyCap;
  if (typeof cap !== 'number' || cap < 0) {
    return reply.status(400).send({ error: 'dailyCap must be a non-negative number' });
  }
  await setMintDailyCap(cap);
  return reply.send({ dailyCap: cap });
}

/** AML — משחקים מסומנים (Chip Dumping / זוגות חשודים) */
export async function getAdminAmlFlagged(_req: FastifyRequest, reply: FastifyReply) {
  const sessions = await getFlaggedSessions();
  return reply.send({ sessions });
}
