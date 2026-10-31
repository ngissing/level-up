import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { db } from './db.js';

const SESSION_DAYS = 14;

export function hashPassword(pw) {
  const salt = randomBytes(16);
  const hash = scryptSync(String(pw), salt, 32);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function checkPassword(pw, stored) {
  const [, saltHex, hashHex] = String(stored).split('$');
  if (!saltHex || !hashHex) return false;
  const hash = scryptSync(String(pw), Buffer.from(saltHex, 'hex'), 32);
  return timingSafeEqual(hash, Buffer.from(hashHex, 'hex'));
}

export function createSession(userId) {
  const token = randomBytes(32).toString('hex');
  const expires = Date.now() + SESSION_DAYS * 864e5;
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expires);
  db.prepare('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?').run(userId);
  return { token, expires };
}

export function destroySession(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((c) => c.trim()).filter(Boolean).map((c) => {
    const i = c.indexOf('=');
    return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))];
  }));
}

const cookieBase = () => `Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;

export function setCookie(res, name, value, maxAgeSec) {
  const prev = res.getHeader('Set-Cookie') || [];
  const list = Array.isArray(prev) ? prev : [prev];
  res.setHeader('Set-Cookie', [...list, `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSec}; ${cookieBase()}`]);
}

// Express middleware: attaches req.user and req.flash / res.flash().
export function sessionMiddleware(req, res, next) {
  req.cookies = parseCookies(req.headers.cookie);
  const token = req.cookies.lu_session;
  req.user = null;
  if (token) {
    const row = db.prepare(`
      SELECT u.id, u.username, u.name, u.role, u.class_id, u.must_change_pw, u.reading_level, u.program, s.expires_at
      FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`).get(token);
    if (row && row.expires_at > Date.now()) req.user = row;
    else if (row) destroySession(token);
  }
  req.flash = req.cookies.lu_flash ? safeJson(req.cookies.lu_flash) : null;
  if (req.flash) setCookie(res, 'lu_flash', '', 0);
  res.flash = (type, text) => setCookie(res, 'lu_flash', JSON.stringify({ type, text }), 60);
  next();
}

function safeJson(s) { try { return JSON.parse(s); } catch { return null; } }

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
  if (req.user.must_change_pw && !req.path.startsWith('/account')) return res.redirect('/account/password');
  if (roles.length && !roles.includes(req.user.role)) return res.status(403).send('Not allowed');
  next();
};
