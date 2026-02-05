import 'dotenv/config';
import { buildApp } from './app';
import { initSocket } from './core/socket';

const PORT = Number(process.env.PORT) || 4000;

async function start() {
  const fastify = await buildApp();

  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Neon Oasis API — http://localhost:${PORT} 🎰`);

    try {
      initSocket(fastify.server);
    } catch (socketErr) {
      fastify.log.warn(socketErr, 'Socket.io init failed — real-time sync disabled');
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
