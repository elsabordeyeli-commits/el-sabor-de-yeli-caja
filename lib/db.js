import { Redis } from '@upstash/redis';
import { randomUUID } from 'node:crypto';
import { hash } from './crypto.js';
import { seedProds } from './seed.js';

export const H = 'yeli';
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

// Primera vez: crea los 3 usuarios de prueba y el menú.
export async function ensureSeed() {
  if (await redis.hget(H, 'users')) return;
  const u = (name, user, pass, role) => ({ id: randomUUID().slice(0, 8), name, user, pass: hash(pass), role, blocked: false });
  await redis.hset(H, {
    users: [
      u('Presidente', 'presidente', process.env.OWNER_PASSWORD || 'dueno123', 'o'),
      u('Administrador', 'admin', 'admin123', 'a'),
      u('Vendedor', 'vendedor', 'vende123', 's'),
    ],
    prods: seedProds(),
  });
}
