import type { FastifyRequest, FastifyReply } from 'fastify';
import { getClientIp, getCountryFromIp, isSkillOnlyCountry, isPlayForCoinsAllowed } from '../services/geoService';

/** Geo stub — החזרת מדינה לפי IP. Play for Coins / Play for Fun (App Store Compliance). */
export async function getGeo(req: FastifyRequest, reply: FastifyReply) {
  try {
    const ip = getClientIp(req);
    const country = getCountryFromIp(ip);
    return reply.send({
      ip: ip ?? undefined,
      country,
      skillOnly: isSkillOnlyCountry(country),
      /** אם false — הכפתורים הופכים ל-"Play for Fun" (Geo-Fencing) */
      playForCoinsAllowed: isPlayForCoinsAllowed(country),
    });
  } catch {
    return reply.send({ country: 'US', skillOnly: false, playForCoinsAllowed: true });
  }
}
