import { redis, H, ensureSeed } from '../lib/db.js';
import { check, sign } from '../lib/crypto.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  await ensureSeed();
  const { user, pass } = req.body || {};
  const u = ((await redis.hget(H, 'users')) || []).find((x) => x.user === String(user || '').toLowerCase());
  if (!u || !check(pass, u.pass)) return res.status(401).json({ error: 'credenciales' });
  if (u.blocked) return res.status(403).json({ error: 'blocked' });
  res.json({ token: sign({ id: u.id }) });
}
