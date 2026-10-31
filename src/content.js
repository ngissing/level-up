// Loads the course map, curriculum and mini-course files, and works out
// unlocks and badges. Content lives in /content as JSON so new mini courses
// can be authored (with Claude) and dropped in without touching code.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { ROOT_DIR } from './html.js';
import { db, getSetting } from './db.js';
import { LEVEL_IDS, DEFAULT_LEVEL } from './levels.js';
import { PROGRAMS, PROGRAM_IDS, DEFAULT_PROGRAM } from './programs.js';

const CONTENT = path.join(ROOT_DIR, 'content');
const caches = {};

function stamp(dir) {
  // Cheap change detection so edited content shows up without a restart.
  let t = 0;
  for (const f of ['map.json', 'curriculum.json']) t = Math.max(t, statSync(path.join(dir, f)).mtimeMs);
  const skills = path.join(dir, 'skills');
  if (existsSync(skills)) for (const f of readdirSync(skills)) t = Math.max(t, statSync(path.join(skills, f)).mtimeMs);
  return t;
}

// One program's content: content/<program>/{map.json, curriculum.json, skills/}.
export function content(program = DEFAULT_PROGRAM) {
  if (!PROGRAMS[program]) program = DEFAULT_PROGRAM;
  const dir = path.join(CONTENT, program);
  const s = stamp(dir);
  if (caches[program]?.stamp === s) return caches[program];
  const map = JSON.parse(readFileSync(path.join(dir, 'map.json'), 'utf8'));
  const curriculum = JSON.parse(readFileSync(path.join(dir, 'curriculum.json'), 'utf8'));
  const vc = Object.fromEntries(curriculum.entries.map((e) => [e.id, e]));
  const zones = Object.fromEntries(map.zones.map((z) => [z.id, z]));
  const skills = {};
  for (const sk of map.skills) {
    const file = path.join(dir, 'skills', `${sk.id}.json`);
    const course = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
    skills[sk.id] = { ...sk, program, zoneObj: zones[sk.zone], course, ready: sk.status === 'ready' && !!course };
  }
  caches[program] = {
    program, programObj: PROGRAMS[program], map, curriculum, vc, zones, skills, milestones: map.milestones,
    baseZone: map.baseZone || 'basecamp', crossZone: map.crossZone || 'crossroads', stamp: s,
  };
  levelCache?.clear();
  return caches[program];
}

export const allPrograms = () => PROGRAM_IDS.map((p) => content(p));
// Skill, zone and badge ids are unique across programs, so lookups can search them all.
export const skillList = (program) => (program ? Object.values(content(program).skills) : allPrograms().flatMap((c) => Object.values(c.skills)));
export const getSkill = (id) => allPrograms().find((c) => c.skills[id])?.skills[id];
export const zoneSkills = (zone) => skillList().filter((s) => s.zone === zone);
export const vcEntry = (id) => allPrograms().find((c) => c.vc[id])?.vc[id];

// ---------- Reading levels ----------
// Any value in a course file can be written per level:
//   "body": { "support": "…", "core": "…", "extend": "…" }   (missing levels fall back to core)
// and any object in a list can be limited to some levels:
//   { "q": "…", "levels": ["core", "extend"] }
const isLeveled = (o) => o && typeof o === 'object' && !Array.isArray(o) && 'core' in o
  && Object.keys(o).every((k) => LEVEL_IDS.includes(k));

export function resolveLevel(v, level) {
  if (Array.isArray(v)) {
    return v.filter((x) => !(x && typeof x === 'object' && Array.isArray(x.levels) && !x.levels.includes(level)))
      .map((x) => resolveLevel(x, level));
  }
  if (isLeveled(v)) return resolveLevel(level in v ? v[level] : v.core, level);
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, x] of Object.entries(v)) if (k !== 'levels') out[k] = resolveLevel(x, level);
    return out;
  }
  return v;
}

// Automatic adjustments that don't need authoring.
function adapt(course, level) {
  if (level === 'support') {
    for (const q of course.quiz?.questions || []) {
      if (q.options.length <= 3 || q.keepOptions) continue;
      // Keep the answer plus the first two distractors, in their original order.
      const keep = q.options.map((o, i) => i).filter((i) => i === q.answer).concat(
        q.options.map((o, i) => i).filter((i) => i !== q.answer).slice(0, 2)).sort((a, b) => a - b);
      q.answer = keep.indexOf(q.answer);
      q.options = keep.map((i) => q.options[i]);
    }
  }
  return course;
}

var levelCache = new Map(); // var: content() may run before this line on first import
export function courseFor(skill, level = DEFAULT_LEVEL) {
  if (!skill.course) return null;
  const key = `${skill.id}|${level}|${content(skill.program).stamp}`;
  if (!levelCache.has(key)) levelCache.set(key, adapt(resolveLevel(skill.course, level), level));
  return levelCache.get(key);
}

// A copy of the skill with its course and curriculum links set for one reading level.
export function withLevel(skill, level = DEFAULT_LEVEL) {
  return { ...skill, level, course: courseFor(skill, level), vcNow: vcFor(skill, level) };
}

// Foundation-level students can show earlier-level curriculum (vc.support) for the same skill.
export function vcFor(skill, level = DEFAULT_LEVEL) {
  return { core: level === 'support' && skill.vc.support ? skill.vc.support : skill.vc.core, extend: skill.vc.extend };
}

// ---------- Unlock rules ----------
// Set in content/<program>/map.json → "unlocks":
//   tier 0  Base Camp: always open
//   tier 1  zone starters: finish `starters.baseCamp` Base Camp skills
//   tier 2  level 2: finish `level2.starters` starters in the same zone
//   tier 3  boss: finish `boss.starters` starters and `boss.level2` level-2 skills in the zone
//   tier 4  Crossroads: explicit `requires` [{zone, min}]
// Unwritten skills block the way like any other, unless an admin turns on
// "preview mode", which skips skills that aren't written yet.
const count = (n, ids) => (n === 'all' ? ids.length : Math.min(Number(n) || 0, ids.length));
const words = (n, total, noun) => (n === total ? (total === 2 ? `both ${noun}s` : total === 1 ? `the ${noun}` : `all ${total} ${noun}s`) : `${n} ${noun}${n === 1 ? '' : 's'}`);

export function requirements(skill) {
  const c = content(skill.program);
  const rules = c.map.unlocks || {};
  const preview = getSetting('skip_unwritten') === '1';
  const group = (ids, n, noun, where) => {
    const min = count(n, ids);
    const ready = ids.filter((id) => c.skills[id].ready).length;
    return { ids, min: preview ? Math.min(min, ready) : min, text: `Finish ${words(min, ids.length, noun)}${where}` };
  };
  const inZone = (zone, tier) => zoneSkills(zone).filter((s) => tier === undefined || s.tier === tier).map((s) => s.id);
  const zname = skill.zoneObj.name;
  const base = group(inZone(c.baseZone), rules.starters?.baseCamp ?? 2, `${c.zones[c.baseZone].name} skill`, '');
  const starters = (n) => group(inZone(skill.zone, 1), n, 'starter', ` in ${zname}`);
  switch (skill.tier) {
    case 0: return [];
    case 1: return [base];
    case 2: return [base, starters(rules.level2?.starters ?? 'all')];
    case 3: return [base, starters(rules.boss?.starters ?? 'all'), group(inZone(skill.zone, 2), rules.boss?.level2 ?? 1, 'level-2 skill', ` in ${zname}`)];
    default:
      return [base, ...(skill.requires || []).map((r) => group(inZone(r.zone), r.min, 'skill', ` in ${c.zones[r.zone].name}`))];
  }
}

export function isUnlocked(skill, done) {
  return requirements(skill).every((r) => r.ids.filter((id) => done.has(id)).length >= r.min);
}

// ---------- Student state ----------
export function progressFor(userId) {
  const rows = db.prepare('SELECT * FROM progress WHERE user_id = ?').all(userId);
  return Object.fromEntries(rows.map((r) => [r.skill_id, { ...r, steps: JSON.parse(r.steps || '[]') }]));
}

export function doneSet(progress) {
  return new Set(Object.values(progress).filter((p) => p.status === 'complete').map((p) => p.skill_id));
}

// locked | soon | open | started | submitted | complete
export function skillState(skill, progress, done = doneSet(progress)) {
  const p = progress[skill.id];
  if (p?.status === 'complete') return 'complete';
  if (!isUnlocked(skill, done)) return 'locked';
  if (!skill.ready) return 'soon';
  if (p?.status === 'submitted') return 'submitted';
  if (p) return 'started';
  return 'open';
}

// ---------- Badges ----------
export function allBadges(program = DEFAULT_PROGRAM) {
  const c = content(program);
  const out = [];
  for (const s of Object.values(c.skills)) out.push({ id: `skill:${s.id}`, name: s.badge.name, icon: s.badge.icon, color: s.zoneObj.color, ink: s.zoneObj.ink, kind: 'skill', desc: `Complete “${s.title}”` });
  for (const z of c.map.zones) {
    if (z.id === c.baseZone || z.id === c.crossZone) continue;
    out.push({ id: `explore:${z.id}`, name: `${z.name} Explorer`, icon: z.icon, color: z.color, ink: z.ink, kind: 'zone', desc: `Finish your first ${z.name} skill` });
    out.push({ id: `master:${z.id}`, name: `${z.name} Master`, icon: 'lucide:crown', color: z.color, ink: z.ink, kind: 'zone', desc: `Finish every ${z.name} skill` });
  }
  const bz = c.zones[c.baseZone];
  out.push({ id: c.baseZone, name: `${bz.name} Cleared`, icon: bz.icon, color: bz.color, ink: bz.ink, kind: 'zone', desc: `Finish all ${bz.name} skills` });
  for (const m of c.milestones) out.push({ id: m.id, name: m.name, icon: m.icon, color: '#111', ink: '#fff', kind: 'milestone', desc: `Finish ${m.count} skill${m.count > 1 ? 's' : ''}` });
  return out;
}

export function earnedBadgeIds(done, program = DEFAULT_PROGRAM) {
  const c = content(program);
  const mine = new Set([...done].filter((id) => c.skills[id]));
  const ids = [...mine].map((id) => `skill:${id}`);
  for (const z of c.map.zones) {
    const zs = Object.values(c.skills).filter((s) => s.zone === z.id);
    const n = zs.filter((s) => mine.has(s.id)).length;
    if (z.id === c.baseZone) { if (n === zs.length) ids.push(z.id); continue; }
    if (z.id === c.crossZone) continue;
    if (n >= 1) ids.push(`explore:${z.id}`);
    if (n === zs.length) ids.push(`master:${z.id}`);
  }
  for (const m of c.milestones) if (mine.size >= m.count) ids.push(m.id);
  return ids;
}

// Awards any newly earned badges (in every program); returns the new badge ids.
export function syncBadges(userId) {
  const done = doneSet(progressFor(userId));
  const have = new Set(db.prepare('SELECT badge_id FROM badges WHERE user_id = ?').all(userId).map((r) => r.badge_id));
  const fresh = PROGRAM_IDS.flatMap((p) => earnedBadgeIds(done, p)).filter((id) => !have.has(id));
  const ins = db.prepare('INSERT OR IGNORE INTO badges (user_id, badge_id) VALUES (?, ?)');
  for (const id of fresh) ins.run(userId, id);
  return fresh;
}

// Skills that became available because `skillId` was completed.
export function newlyUnlocked(done, skillId) {
  const before = new Set(done); before.delete(skillId);
  return skillList(getSkill(skillId)?.program).filter((s) => !isUnlocked(s, before) && isUnlocked(s, done));
}

// ---------- Curriculum coverage ----------
// Core VC links count once a skill is complete; extension links count when
// the teacher confirms the Level Up work.
export function coverage(progress, level = DEFAULT_LEVEL, program = DEFAULT_PROGRAM) {
  const c = content(program);
  const cov = {};
  for (const p of Object.values(progress)) {
    if (p.status !== 'complete') continue;
    const s = c.skills[p.skill_id];
    if (!s) continue;
    const vc = vcFor(s, level);
    for (const id of vc.core) (cov[id] ||= []).push({ skill: s, extend: false });
    if (p.level_up) for (const id of vc.extend) (cov[id] ||= []).push({ skill: s, extend: true });
  }
  return cov;
}

export const STEPS = [
  { id: 'brief', label: 'Mission brief', icon: 'lucide:flag' },
  { id: 'watch', label: 'Watch', icon: 'lucide:play' },
  { id: 'read', label: 'Read', icon: 'lucide:book-open' },
  { id: 'see', label: 'See it', icon: 'lucide:eye' },
  { id: 'workbook', label: 'Workbook', icon: 'lucide:notebook-pen' },
  { id: 'check', label: 'Quick check', icon: 'lucide:circle-help' },
  { id: 'show', label: 'Show it', icon: 'lucide:send' },
];

// ---------- Recorded narration (scripts/make-voices.js) ----------
export const lineKey = (text) => createHash('sha1').update(String(text).trim()).digest('hex').slice(0, 16);

// Returns a function: narration text -> audio URL (or null if not recorded).
export function audioFor(skillId) {
  const file = path.join(ROOT_DIR, 'public', 'audio', skillId, 'manifest.json');
  if (!existsSync(file)) return Object.assign(() => null, { voice: null });
  const { lines = {}, voice = null } = JSON.parse(readFileSync(file, 'utf8'));
  const fn = (text) => { const l = lines[lineKey(text || '')]; return l ? `/audio/${skillId}/${l.file}` : null; };
  return Object.assign(fn, { voice });
}

// ---------- Read-aloud text ----------
// The exact words each read-aloud button speaks. Used both to render the
// buttons and by scripts/make-voices.js, so recordings always match.
export const plainText = (md = '') => String(md)
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/[*_`#>]/g, '')
  .replace(/^\s*\d+\.\s+/gm, '')
  .replace(/^\s*[-•]\s+/gm, '')
  .replace(/\s*\n+\s*/g, ' ')
  .replace(/\s{2,}/g, ' ')
  .trim();

export function readUnits(course) {
  const b = course.brief;
  return {
    brief: [plainText(b.hook), 'Why this matters.', plainText(b.why), 'By the end you can:', ...b.canDo.map(plainText),
      'How you’ll show it.', plainText(b.showIt)].join(' '),
    vocab: Object.fromEntries(b.vocab.map((v) => [v.word, `${v.word}. ${v.meaning}.`])),
    articles: course.read.articles.map((a) => `${a.title}. ${plainText(a.body)}`),
    cases: course.read.caseStudies.map((cs) => `${cs.title}. ${plainText(cs.body)} Think about it. ${cs.think.map(plainText).join(' ')}`),
    quiz: course.quiz.questions.map((q) => `${plainText(q.q)} Is it: ${q.options.map(plainText).join('? Or ')}?`),
  };
}

// Every line that can be spoken in a course: explainer narration plus read-aloud text.
export function speechLines(course, { explainerOnly = false } = {}) {
  const lines = course.explainer.scenes.map((s) => s.say).filter(Boolean);
  if (explainerOnly) return lines;
  const u = readUnits(course);
  return [...lines, u.brief, ...Object.values(u.vocab), ...u.articles, ...u.cases, ...u.quiz];
}

// ---------- Workbook pages ----------
// Blocks flow onto A4 sheets; a block with `pagebreak` starts a new one. Page 1 is the cover.
export function workbookSheets(course) {
  const sheets = [];
  let cur = null;
  for (const b of course.workbook.pages) {
    if (b.type === 'cover') continue;
    if (!cur || b.pagebreak) { cur = []; sheets.push(cur); }
    cur.push(b);
  }
  return sheets;
}

// ---------- Where a curriculum point is evidenced (staff only) ----------
// Any part of a course can carry `"vc": [ids]` (and an optional `"vcNote"`): explainer scenes,
// articles, case studies, diagrams, quiz questions, workbook blocks and their items, and `show`.
const BLOCK_NAMES = { goals: 'Your mission', 'vocab-match': 'Word Power', signoff: 'Teacher check', equation: 'Diagram', cover: 'Cover' };

function locationsIn(course, id) {
  const has = (x) => Array.isArray(x?.vc) && x.vc.includes(id);
  const out = [];
  course.explainer.scenes.forEach((s, i) => has(s) && out.push({ key: `watch:${i}`, step: 'watch', what: 'Explainer', title: `Scene ${i + 1}: ${s.title}`, note: s.vcNote }));
  course.read.articles.forEach((a, i) => has(a) && out.push({ key: `article:${i}`, step: 'read', what: 'Reading', title: a.title, note: a.vcNote }));
  course.read.caseStudies.forEach((c, i) => has(c) && out.push({ key: `case:${i}`, step: 'read', what: 'Case study', title: c.title, note: c.vcNote }));
  course.diagrams.forEach((d, i) => has(d) && out.push({ key: `diagram:${i}`, step: 'see', what: 'Diagram', title: d.title, note: d.vcNote }));
  const qs = course.quiz.questions.map((q, i) => (has(q) ? i + 1 : null)).filter(Boolean);
  if (qs.length) out.push({ key: 'quiz', step: 'check', what: 'Quick check', title: 'Questions', where: `Q${qs.join(', Q')}` });
  workbookSheets(course).forEach((blocks, si) => blocks.forEach((b, bi) => {
    const items = (b.items || []).map((it, k) => (has(it) ? k + 1 : null)).filter(Boolean);
    if (!has(b) && !items.length) return;
    out.push({ key: `wb:${b.type}:${b.title || bi}`, step: 'workbook', what: 'Workbook', title: b.title || b.name || BLOCK_NAMES[b.type] || b.type,
      where: `p.${si + 2}${items.length ? ` · Q${items.join(', Q')}` : ''}`, page: si + 2, note: b.vcNote });
  }));
  if (has(course.show)) out.push({ key: 'show', step: 'show', what: 'Show it', title: 'Final task', note: course.show.vcNote });
  return out;
}

// For one skill and one curriculum point: the teacher's look-for note, and every place
// in the course that gives evidence for it, with where it sits in each reading-level version.
export function evidenceFor(skill, id) {
  const look = (skill.course?.teacher?.lookFors || []).filter((l) => l.vc === id);
  if (!skill.course) return { look, places: [] };
  const merged = new Map();
  for (const level of LEVEL_IDS) {
    for (const loc of locationsIn(courseFor(skill, level), id)) {
      if (!merged.has(loc.key)) merged.set(loc.key, { ...loc, byLevel: {} });
      merged.get(loc.key).byLevel[level] = { where: loc.where || '', page: loc.page };
    }
  }
  return { look, places: [...merged.values()] };
}
