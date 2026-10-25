import { randomUUID } from 'node:crypto';
import { redis, H, ensureSeed } from '../lib/db.js';
import { auth } from '../lib/auth.js';
import { hash } from '../lib/crypto.js';
 
const COMUN = ['cash', 'tabs', 'sales', 'exps', 'credits', 'hist'];
const SOLO_ADMIN = ['prods', 'buys', 'movs', 'use', 'cfg'];
const clean = (u) => ({ id: u.id, name: u.name, user: u.user, role: u.role, blocked: !!u.blocked });
 
async function applyUsers(a, up = [], del = []) {
  let list = (await redis.hget(H, 'users')) || [];
  const can = (t) => (a.role === 'o' ? t.role !== 'o' : a.role === 'a' && t.role === 's');
  const nm = (v) => String(v).trim().slice(0, 60);
  for (const u of up) {
    const ex = list.find((x) => x.id === u.id);
    if (ex) {
      if (ex.id !== a.id && !can(ex)) continue;              // solo se gestionan los roles permitidos
      if (u.name) ex.name = nm(u.name);
      if (u.pass && String(u.pass).length >= 4) ex.pass = hash(u.pass);
      if (a.role === 'o' && ex.id !== a.id && typeof u.blocked === 'boolean') ex.blocked = u.blocked; // solo el presidente bloquea
    } else if (a.role !== 's') {
      const user = String(u.user || '').trim().toLowerCase();
      if (!u.name || !user || String(u.pass || '').length < 4 || list.some((x) => x.user === user)) continue;
      list.push({ id: randomUUID().slice(0, 8), name: nm(u.name), user, pass: hash(u.pass), blocked: false,
        role: u.role === 'a' && a.role === 'o' ? 'a' : 's' });
    }
  }
  list = list.filter((x) => !(del.includes(x.id) && x.id !== a.id && can(x)));
  await redis.hset(H, { users: list });
}
 
export default async function handler(req, res) {
  await ensureSeed();
  const a = await auth(req, res);
  if (!a) return;
 
  if (req.method === 'GET') {
    const all = (await redis.hgetall(H)) || {};
    const s = {};
    for (const k of [...COMUN, ...(a.role === 's' ? [] : SOLO_ADMIN)]) if (all[k] !== undefined) s[k] = all[k];
    if (a.role === 's') s.prods = all.prods || [];
    s.users = a.role === 's' ? [] : (all.users || []).filter((u) => a.role === 'o' || u.role !== 'o').map(clean);
    return res.json({ me: clean(a), state: s });
  }
  if (req.method !== 'POST') return res.status(405).end();
 
  const { set = {}, upsert = {}, del = {} } = req.body || {};
  const ok = [...COMUN, ...(a.role === 's' ? [] : SOLO_ADMIN)];
  const keys = [...Object.keys(set), ...Object.keys(upsert), ...Object.keys(del)];
  if (keys.some((k) => k !== 'users' && !ok.includes(k)) || set.users) return res.status(403).json({ error: 'forbidden' });
 
  const w = {};
  for (const k of ['cash', 'use', 'cfg']) {
    if (!(k in set)) continue;
    if (k === 'cfg') {                                        // el fondo inicial solo se define una vez
      const cur = await redis.hget(H, 'cfg');
      if (cur && !(['o', 'a'].includes(a.role) && set.cfg === null)) continue;
    }
    w[k] = set[k];
  }
  for (const k of new Set([...Object.keys(upsert), ...Object.keys(del)])) {
    if (k === 'users') continue;
    const m = new Map(((await redis.hget(H, k)) || []).map((i) => [i.id, i]));
    (upsert[k] || []).forEach((i) => i && typeof i.id === 'string' && m.set(i.id, i));
    (del[k] || []).forEach((id) => m.delete(id));
    w[k] = [...m.values()];
  }
  if (Object.keys(w).length) await redis.hset(H, w);
  if (upsert.users || del.users) await applyUsers(a, upsert.users, del.users);
  res.json({ ok: true });
}
 
