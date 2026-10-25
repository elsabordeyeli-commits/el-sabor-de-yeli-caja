import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'node:crypto';
import { hash } from './crypto.js';
import { seedProds } from './seed.js';
 
export const H = 'yeli';
 
// Base de datos Neon (Postgres) conectada desde Vercel → Storage.
// Guardamos todo en una sola tabla clave → JSON, con la misma interfaz de antes.
let sql, ready;
const q = () => {
  if (!sql) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error('Falta DATABASE_URL: conecta la base de datos Neon al proyecto (Storage).');
    sql = neon(url);
  }
  return sql;
};
const init = () => (ready ??= q()`create table if not exists yeli_kv (k text primary key, v jsonb not null)`);
 
export const redis = {
  async hget(_h, k) {
    await init();
    const r = await q()`select v from yeli_kv where k = ${k}`;
    return r.length ? r[0].v : null;
  },
  async hset(_h, o) {
    await init();
    for (const [k, v] of Object.entries(o)) {
      await q()`insert into yeli_kv (k, v) values (${k}, ${JSON.stringify(v ?? null)}::jsonb)
                on conflict (k) do update set v = excluded.v`;
    }
    return 1;
  },
  async hgetall() {
    await init();
    const r = await q()`select k, v from yeli_kv`;
    return r.length ? Object.fromEntries(r.map((x) => [x.k, x.v])) : null;
  },
};
 
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
 
