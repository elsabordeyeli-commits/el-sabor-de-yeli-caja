import { redis, H } from './db.js';
import { verify } from './crypto.js';

// Devuelve el usuario autenticado o responde 401/403 y devuelve null.
export async function auth(req, res) {
  const p = verify((req.headers.authorization || '').replace('Bearer ', ''));
  const u = p && ((await redis.hget(H, 'users')) || []).find((x) => x.id === p.id);
  if (!u) { res.status(401).json({ error: 'auth' }); return null; }
  if (u.blocked) { res.status(403).json({ error: 'blocked' }); return null; }
  return u;
}
