import type { FastifyInstance } from 'fastify';
import { getGeo } from '../controllers/geoController';

export async function geoRoutes(fastify: FastifyInstance) {
  fastify.get('/api/geo', getGeo);
}
