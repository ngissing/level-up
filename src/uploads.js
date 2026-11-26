// Students' uploaded work: photos, PDFs, Word files and links (e.g. a video on OneDrive).
// Files are stored in UPLOAD_DIR (on the Railway volume) under a random id, never under
// the student's file name, and are only ever served through an access-checked route.
import { randomBytes } from 'node:crypto';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { db, UPLOAD_DIR } from './db.js';

export const MAX_FILES = 5; // per skill
export const MAX_BYTES = 10 * 1024 * 1024; // per file

// Work out the real type from the file's first bytes, not its name.
export function sniff(buf, name = '') {
  const hex = buf.subarray(0, 12).toString('hex');
  const ascii = buf.subarray(0, 12).toString('latin1');
  if (hex.startsWith('ffd8ff')) return { kind: 'image', mime: 'image/jpeg', ext: 'jpg' };
  if (hex.startsWith('89504e470d0a1a0a')) return { kind: 'image', mime: 'image/png', ext: 'png' };
  if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP') return { kind: 'image', mime: 'image/webp', ext: 'webp' };
  if (ascii.startsWith('%PDF')) return { kind: 'pdf', mime: 'application/pdf', ext: 'pdf' };
  // Word: .docx is a zip; old .doc is an OLE file. Only accept these with a Word file name.
  if (hex.startsWith('504b0304') && /\.docx$/i.test(name)) return { kind: 'doc', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' };
  if (hex.startsWith('d0cf11e0a1b11ae1') && /\.doc$/i.test(name)) return { kind: 'doc', mime: 'application/msword', ext: 'doc' };
  return null;
}

const fileOf = (u) => path.join(UPLOAD_DIR, `${u.id}.${{ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf', 'application/msword': 'doc' }[u.mime] || 'docx'}`);

export const listFor = (userId, skillId) =>
  db.prepare('SELECT * FROM uploads WHERE user_id = ? AND skill_id = ? ORDER BY created_at, rowid').all(userId, skillId);

export const countFor = (userId, skillId) =>
  db.prepare('SELECT COUNT(*) n FROM uploads WHERE user_id = ? AND skill_id = ?').get(userId, skillId).n;

export const get = (id) => db.prepare('SELECT * FROM uploads WHERE id = ?').get(String(id));

const cleanName = (s) => String(s || '').replace(/[^\p{L}\p{N} ._()-]/gu, '').trim().slice(0, 80);

export function saveFile(userId, skillId, buf, name) {
  const type = sniff(buf, name);
  if (!type) return { error: 'That file type can’t be used. Send a photo, a PDF or a Word document.' };
  const id = randomBytes(12).toString('hex');
  const u = { id, user_id: userId, skill_id: skillId, kind: type.kind, mime: type.mime, name: cleanName(name) || `${type.kind}.${type.ext}`, size: buf.length };
  writeFileSync(fileOf(u), buf, { mode: 0o600 });
  db.prepare('INSERT INTO uploads (id, user_id, skill_id, kind, mime, name, size) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(u.id, u.user_id, u.skill_id, u.kind, u.mime, u.name, u.size);
  return { upload: get(id) };
}

export function saveLink(userId, skillId, rawUrl, label) {
  let url;
  try { url = new URL(String(rawUrl || '').trim()); } catch { return { error: 'That doesn’t look like a web link. Copy the share link and paste it in.' }; }
  if (url.protocol !== 'https:') return { error: 'Links must start with https://' };
  const id = randomBytes(12).toString('hex');
  db.prepare("INSERT INTO uploads (id, user_id, skill_id, kind, name, url) VALUES (?, ?, ?, 'link', ?, ?)")
    .run(id, userId, skillId, cleanName(label) || url.hostname, url.href.slice(0, 2000));
  return { upload: get(id) };
}

export function remove(u) {
  if (u.kind !== 'link') { const f = fileOf(u); if (existsSync(f)) unlinkSync(f); }
  db.prepare('DELETE FROM uploads WHERE id = ?').run(u.id);
}

// Call before deleting a user: removes their files from disk (the rows go with the user).
export function removeAllFor(userId) {
  for (const u of db.prepare('SELECT * FROM uploads WHERE user_id = ?').all(userId)) remove(u);
}

export const read = (u) => readFileSync(fileOf(u));
export const fileExists = (u) => existsSync(fileOf(u));
