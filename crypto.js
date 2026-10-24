import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';

export const hash = (p) => {
  const s = randomBytes(16).toString('hex');
  return s + ':' + scryptSync(String(p), s, 32).toString('hex');
};
export const check = (p, h) => {
  const [s, k] = String(h || '').split(':');
  if (!s || !k) return false;
  return timingSafeEqual(Buffer.from(k, 'hex'), scryptSync(String(p), s, 32));
};
const secret = () => {
  if (!process.env.AUTH_SECRET) throw new Error('Falta la variable AUTH_SECRET');
  return process.env.AUTH_SECRET;
};
export const sign = (o) => {
  const b = Buffer.from(JSON.stringify({ ...o, exp: Date.now() + 12 * 36e5 })).toString('base64url');
  return b + '.' + createHmac('sha256', secret()).update(b).digest('base64url');
};
export const verify = (t) => {
  const [b, m] = String(t || '').split('.');
  if (!b || !m) return null;
  const e = createHmac('sha256', secret()).update(b).digest('base64url');
  if (m.length !== e.length || !timingSafeEqual(Buffer.from(m), Buffer.from(e))) return null;
  const o = JSON.parse(Buffer.from(b, 'base64url').toString());
  return o.exp > Date.now() ? o : null;
};
