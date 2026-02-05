import * as esbuild from 'esbuild';
import { mkdirSync, existsSync, copyFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'dist');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

await esbuild.build({
  entryPoints: [join(__dirname, 'src/index.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: join(outDir, 'index.js'),
  sourcemap: true,
  logLevel: 'info',
  external: ['pg', 'pg-native', '@prisma/client', 'socket.io', 'ioredis', 'fastify', '@fastify/cors', 'dotenv', '@neon-oasis/shared', 'notepack.io', 'ws', '@socket.io/redis-adapter'],
}).catch(() => process.exit(1));

// Copy prisma client
const prismaDir = join(outDir, 'prisma');
if (!existsSync(prismaDir)) mkdirSync(prismaDir, { recursive: true });
try {
  copyFileSync(join(__dirname, 'prisma/schema.prisma'), join(prismaDir, 'schema.prisma'));
} catch (e) {}

console.log('✓ API built successfully');
