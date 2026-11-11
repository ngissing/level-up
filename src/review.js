// Spaced review ("warm-ups"). Skills a student has finished come back as a few quick
// questions, days and then weeks later, because recalling something is what makes it stick.
//
// Every quiz question and key word from a finished course is an item. Items move through
// boxes: get it right and it comes back after a longer gap; miss it and it's back tomorrow.
import { db } from './db.js';
import { getSkill, courseFor, progressFor, lineKey, plainText } from './content.js';

// Days until an item is asked again, by box. Box 0 = just missed.
export const GAPS = [1, 3, 7, 14, 30, 60];
export const WARMUP_SIZE = 5;
const MAX_PER_SKILL = 2;

export const today = (d = new Date()) => d.toISOString().slice(0, 10);
const addDays = (day, n) => { const d = new Date(`${day}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return today(d); };

// A small, repeatable shuffle (same order all day for one item, different tomorrow).
function seeded(n, seed) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const idx = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = (h ^ (h >>> 13)) >>> 0;
    const j = h % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

// Every item a finished course offers, at the student's reading level.
function itemsOf(skill, level) {
  const course = courseFor(skill, level);
  if (!course) return [];
  const out = [];
  for (const q of course.quiz?.questions || []) out.push({ id: `q:${skill.id}:${lineKey(q.q)}`, kind: 'q', skill, q });
  for (const v of course.brief?.vocab || []) out.push({ id: `v:${skill.id}:${lineKey(v.word)}`, kind: 'v', skill, v, vocab: course.brief.vocab });
  return out;
}

// Turn an item into a question: { id, skill, kind, prompt, options, answer, explain }.
// Options are in a fixed order for the day, so a page and its answers always match.
export function ask(item, day = today()) {
  if (item.kind === 'q') {
    const { q } = item;
    return { id: item.id, skill: item.skill, kind: 'q', prompt: q.q, options: q.options, answer: q.answer, explain: q.explain };
  }
  const { v, vocab } = item;
  const others = vocab.filter((x) => x.word !== v.word);
  const order = seeded(others.length, `${item.id}|${day}`).slice(0, 3).map((i) => others[i]);
  // Asking for the meaning gives the word away if the meaning repeats it, so flip those round.
  const meaningFirst = !new RegExp(`\\b${v.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(v.meaning)
    && seeded(2, `${item.id}|way|${day}`)[0] === 0;
  const pool = [v, ...order];
  const mix = seeded(pool.length, `${item.id}|mix|${day}`).map((i) => pool[i]);
  return {
    id: item.id, skill: item.skill, kind: 'v',
    prompt: meaningFirst ? `Which word means: “${v.meaning}”?` : `What does **${v.word}** mean?`,
    options: mix.map((x) => (meaningFirst ? x.word : x.meaning)),
    answer: mix.indexOf(v),
    explain: `**${v.word}**: ${v.meaning}. *${plainText(v.example)}*`,
  };
}

// Everything that could be asked today, most urgent first.
function pool(user, day = today()) {
  const progress = progressFor(user.id);
  const rows = Object.fromEntries(db.prepare('SELECT * FROM review_items WHERE user_id = ?').all(user.id).map((r) => [r.item, r]));
  const due = [], fresh = [];
  for (const p of Object.values(progress)) {
    if (p.status !== 'complete' || !p.completed_at) continue;
    const skill = getSkill(p.skill_id);
    if (!skill?.course || skill.program !== user.program) continue;
    // New items wait until the day after the course was finished: no point asking straight away.
    const doneDay = p.completed_at.slice(0, 10);
    for (const it of itemsOf(skill, user.reading_level)) {
      const row = rows[it.id];
      if (row) { if (row.due <= day) due.push({ ...it, row }); }
      else if (doneDay < day) fresh.push({ ...it, doneDay });
    }
  }
  due.sort((a, b) => a.row.due.localeCompare(b.row.due) || a.row.box - b.row.box);
  // Oldest finished courses first, shuffled within a course so it isn't always question 1.
  fresh.sort((a, b) => a.doneDay.localeCompare(b.doneDay));
  return { due, fresh };
}

export function dueCount(user, day = today()) {
  const { due, fresh } = pool(user, day);
  return due.length + fresh.length;
}

export const doneToday = (user, day = today()) =>
  !!db.prepare('SELECT 1 FROM review_sessions WHERE user_id = ? AND day = ?').get(user.id, day);

// Pick today's warm-up: things that are due come first, then new ones. Mixed across
// courses (interleaving), with at least one key word when there is one.
export function pick(user, day = today(), size = WARMUP_SIZE) {
  const { due, fresh } = pool(user, day);
  const freshMixed = seeded(fresh.length, `${user.id}|${day}`).map((i) => fresh[i]);
  const all = [...due, ...freshMixed];
  const chosen = [], perSkill = {};
  const take = (it) => {
    if (chosen.length >= size || chosen.includes(it)) return;
    if ((perSkill[it.skill.id] || 0) >= MAX_PER_SKILL) return;
    perSkill[it.skill.id] = (perSkill[it.skill.id] || 0) + 1; chosen.push(it);
  };
  const firstWord = all.find((it) => it.kind === 'v'); if (firstWord) take(firstWord);
  for (const it of all) take(it);
  // Not enough variety to fill it? Allow more from the same course.
  for (const it of all) { if (chosen.length >= size) break; if (!chosen.includes(it)) chosen.push(it); }
  const order = seeded(chosen.length, `${user.id}|order|${day}`).map((i) => chosen[i]);
  return order.map((it) => ask(it, day));
}

// Rebuild one question from its id (used to mark answers).
export function find(user, id, day = today()) {
  const [kind, skillId] = String(id).split(':');
  const skill = getSkill(skillId);
  if (!skill?.course || !['q', 'v'].includes(kind)) return null;
  const item = itemsOf(skill, user.reading_level).find((it) => it.id === id);
  return item ? ask(item, day) : null;
}

// Record answers and reschedule each item. answers: [{ id, chosen }]
export function record(user, answers, day = today()) {
  const results = [];
  const get = db.prepare('SELECT * FROM review_items WHERE user_id = ? AND item = ?');
  const put = db.prepare(`INSERT INTO review_items (user_id, item, skill_id, box, due, seen, correct, last_seen) VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(user_id, item) DO UPDATE SET box = excluded.box, due = excluded.due, seen = seen + 1, correct = correct + excluded.correct, last_seen = excluded.last_seen`);
  for (const a of answers) {
    const q = find(user, a.id, day);
    if (!q) continue;
    const right = Number(a.chosen) === q.answer;
    const row = get.get(user.id, q.id);
    // Already marked today (a double submit)? Don't move it twice.
    if (row?.last_seen === day) { results.push({ q, chosen: Number(a.chosen), right, next: row.due }); continue; }
    const box = right ? Math.min((row ? row.box : 0) + 1, GAPS.length - 1) : 0;
    const due = addDays(day, GAPS[box]);
    put.run(user.id, q.id, q.skill.id, box, due, right ? 1 : 0, day);
    results.push({ q, chosen: Number(a.chosen), right, next: due });
  }
  if (results.length && !doneToday(user, day)) {
    db.prepare('INSERT INTO review_sessions (user_id, day, asked, correct) VALUES (?, ?, ?, ?)')
      .run(user.id, day, results.length, results.filter((r) => r.right).length);
  }
  return results;
}

// For teachers: how warm-ups are going for one student.
export function summary(userId, day = today()) {
  const since = addDays(day, -30);
  const s = db.prepare('SELECT COUNT(*) n, COALESCE(SUM(asked),0) asked, COALESCE(SUM(correct),0) correct FROM review_sessions WHERE user_id = ? AND day >= ?').get(userId, since);
  const bySkill = db.prepare(`SELECT skill_id, SUM(seen) seen, SUM(correct) correct, SUM(box = 0) shaky FROM review_items
    WHERE user_id = ? GROUP BY skill_id HAVING SUM(seen) > 0 ORDER BY (SUM(correct) * 1.0 / SUM(seen)), SUM(seen) DESC`).all(userId)
    .map((r) => ({ ...r, skill: getSkill(r.skill_id) })).filter((r) => r.skill);
  return { sessions: s.n, asked: s.asked, correct: s.correct, bySkill };
}

export const nextDue = (user) => db.prepare('SELECT MIN(due) d FROM review_items WHERE user_id = ?').get(user.id)?.d || null;
