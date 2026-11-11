// The Reading Room: reading for interest, not for marks. Every real case study in the app is
// a short story students can choose freely, at their own reading level, and they can log
// anything else they read. Volume and choice are what build fluency.
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR } from './html.js';
import { db } from './db.js';
import { allPrograms, courseFor, getSkill, plainText } from './content.js';

const FILE = path.join(ROOT_DIR, 'content', 'reads.json');
let cache = null;
export function readsConfig() {
  const t = statSync(FILE).mtimeMs;
  if (cache?.t !== t) cache = { t, data: JSON.parse(readFileSync(FILE, 'utf8')) };
  return cache.data;
}

const WPM = 130; // an unhurried reading pace
export const minutesFor = (text) => Math.max(1, Math.round(plainText(text).split(/\s+/).length / WPM));

// Every story on the shelf for this student. A story that appears in two programs is listed once
// (the student's own program wins).
export function stories(user) {
  const cfg = readsConfig();
  const level = user.reading_level || 'core';
  const out = new Map();
  const programs = allPrograms().sort((a, b) => (b.program === user.program) - (a.program === user.program));
  for (const c of programs) for (const skill of Object.values(c.skills)) {
    if (!skill.ready) continue;
    const course = courseFor(skill, level);
    (course.read?.caseStudies || []).forEach((cs, i) => {
      const key = cs.title.toLowerCase();
      if (out.has(key)) return;
      out.set(key, { ref: `${skill.id}:${i}`, skill, i, title: cs.title, icon: cs.icon, minutes: minutesFor(cs.body), interest: cfg.tags[skill.id] || 'voice' });
    });
  }
  return [...out.values()];
}

export function story(user, ref) {
  const [skillId, i] = String(ref).split(':');
  const skill = getSkill(skillId);
  if (!skill?.ready) return null;
  const course = courseFor(skill, user.reading_level || 'core');
  const cs = course.read?.caseStudies?.[Number(i)];
  if (!cs) return null;
  return { ref: `${skill.id}:${Number(i)}`, skill, i: Number(i), cs, course, minutes: minutesFor(cs.body), interest: readsConfig().tags[skill.id] || 'voice' };
}

export const logFor = (userId) => db.prepare('SELECT * FROM reading_log WHERE user_id = ? ORDER BY created_at DESC, id DESC').all(userId);

export function stats(userId) {
  const month = db.prepare("SELECT COUNT(*) n, COALESCE(SUM(minutes),0) m FROM reading_log WHERE user_id = ? AND created_at >= datetime('now','-30 days')").get(userId);
  const all = db.prepare('SELECT COUNT(*) n, COALESCE(SUM(minutes),0) m FROM reading_log WHERE user_id = ?').get(userId);
  return { monthReads: month.n, monthMinutes: month.m, reads: all.n, minutes: all.m };
}

const clip = (s, n) => String(s || '').trim().slice(0, n);

export function logStory(user, ref, { rating, note }) {
  const s = story(user, ref);
  if (!s) return false;
  // Reading the same story again updates the entry instead of padding the log.
  const had = db.prepare("SELECT id FROM reading_log WHERE user_id = ? AND kind = 'story' AND ref = ?").get(user.id, s.ref);
  const r = [1, 2, 3].includes(Number(rating)) ? Number(rating) : null;
  if (had) db.prepare('UPDATE reading_log SET rating = ?, note = ? WHERE id = ?').run(r, clip(note, 300) || null, had.id);
  else db.prepare("INSERT INTO reading_log (user_id, kind, ref, title, minutes, rating, note) VALUES (?, 'story', ?, ?, ?, ?, ?)")
    .run(user.id, s.ref, s.cs.title, s.minutes, r, clip(note, 300) || null);
  return true;
}

export function logOwn(user, { title, kind, minutes, rating, note }) {
  const t = clip(title, 120);
  if (!t) return false;
  const kinds = readsConfig().kinds;
  const k = kinds.includes(kind) ? kind : kinds[kinds.length - 1];
  const m = Math.max(1, Math.min(240, Math.round(Number(minutes)) || 10));
  const r = [1, 2, 3].includes(Number(rating)) ? Number(rating) : null;
  db.prepare('INSERT INTO reading_log (user_id, kind, ref, title, minutes, rating, note) VALUES (?, ?, NULL, ?, ?, ?, ?)')
    .run(user.id, k, t, m, r, clip(note, 300) || null);
  return true;
}
