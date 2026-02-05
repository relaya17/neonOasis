import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerRoutes } from './routes';

export async function buildApp() {
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5273',
  });

  await registerRoutes(fastify);

  return fastify;
}
