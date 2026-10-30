// Loads the course map, curriculum and mini-course files, and works out
// unlocks and badges. Content lives in /content as JSON so new mini courses
// can be authored (with Claude) and dropped in without touching code.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR } from './html.js';
import { db } from './db.js';

const CONTENT = path.join(ROOT_DIR, 'content');
let cache = null;
let cacheStamp = 0;

function stamp() {
  // Cheap change detection so edited content shows up without a restart.
  let t = 0;
  for (const f of ['map.json', 'curriculum.json']) t = Math.max(t, statSync(path.join(CONTENT, f)).mtimeMs);
  const dir = path.join(CONTENT, 'skills');
  for (const f of readdirSync(dir)) t = Math.max(t, statSync(path.join(dir, f)).mtimeMs);
  return t;
}

export function content() {
  const s = stamp();
  if (cache && s === cacheStamp) return cache;
  const map = JSON.parse(readFileSync(path.join(CONTENT, 'map.json'), 'utf8'));
  const curriculum = JSON.parse(readFileSync(path.join(CONTENT, 'curriculum.json'), 'utf8'));
  const vc = Object.fromEntries(curriculum.entries.map((e) => [e.id, e]));
  const zones = Object.fromEntries(map.zones.map((z) => [z.id, z]));
  const skills = {};
  for (const sk of map.skills) {
    const file = path.join(CONTENT, 'skills', `${sk.id}.json`);
    const course = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
    skills[sk.id] = { ...sk, zoneObj: zones[sk.zone], course, ready: sk.status === 'ready' && !!course };
  }
  cache = { map, curriculum, vc, zones, skills, milestones: map.milestones };
  cacheStamp = s;
  return cache;
}

export const skillList = () => Object.values(content().skills);
export const getSkill = (id) => content().skills[id];
export const zoneSkills = (zone) => skillList().filter((s) => s.zone === zone);

// ---------- Unlock rules ----------
// tier 0  Base Camp: always open
// tier 1  zone starters: complete 2 Base Camp skills
// tier 2  complete 1 tier-1 skill in the same zone
// tier 3  zone "boss": complete 1 tier-2 skill in the same zone
// tier 4  Crossroads: explicit `requires` [{zone, min}]
// While courses are still being written, a rule never asks for more skills
// than are actually available (status "ready") in that group.
export function requirements(skill) {
  const c = content();
  const group = (ids, min, text) => {
    const ready = ids.filter((id) => c.skills[id].ready).length;
    return { ids, min: Math.min(min, ready), text };
  };
  const inZone = (zone, tier) => zoneSkills(zone).filter((s) => tier === undefined || s.tier === tier).map((s) => s.id);
  const zname = skill.zoneObj.name;
  // Every rule includes Base Camp, so skills never open early while their
  // own prerequisites are still unwritten.
  const base = group(inZone('basecamp'), 2, 'Finish 2 Base Camp skills');
  switch (skill.tier) {
    case 0: return [];
    case 1: return [base];
    case 2: return [base, group(inZone(skill.zone, 1), 1, `Finish 1 starter skill in ${zname}`)];
    case 3: return [base, group(inZone(skill.zone, 2), 1, `Finish a level-2 skill in ${zname}`)];
    default:
      return [base, ...(skill.requires || []).map((r) =>
        group(inZone(r.zone), r.min, `Finish ${r.min} skills in ${c.zones[r.zone].name}`))];
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
export function allBadges() {
  const c = content();
  const out = [];
  for (const s of skillList()) out.push({ id: `skill:${s.id}`, name: s.badge.name, icon: s.badge.icon, color: s.zoneObj.color, ink: s.zoneObj.ink, kind: 'skill', desc: `Complete “${s.title}”` });
  for (const z of c.map.zones) {
    if (z.id === 'basecamp' || z.id === 'crossroads') continue;
    out.push({ id: `explore:${z.id}`, name: `${z.name} Explorer`, icon: z.icon, color: z.color, ink: z.ink, kind: 'zone', desc: `Finish your first ${z.name} skill` });
    out.push({ id: `master:${z.id}`, name: `${z.name} Master`, icon: 'lucide:crown', color: z.color, ink: z.ink, kind: 'zone', desc: `Finish every ${z.name} skill` });
  }
  out.push({ id: 'basecamp', name: 'Base Camp Cleared', icon: 'lucide:tent', color: c.zones.basecamp.color, ink: c.zones.basecamp.ink, kind: 'zone', desc: 'Finish all Base Camp skills' });
  for (const m of c.milestones) out.push({ id: m.id, name: m.name, icon: m.icon, color: '#111', ink: '#fff', kind: 'milestone', desc: `Finish ${m.count} skill${m.count > 1 ? 's' : ''}` });
  return out;
}

export function earnedBadgeIds(done) {
  const c = content();
  const ids = [...done].map((id) => `skill:${id}`);
  for (const z of c.map.zones) {
    const zs = zoneSkills(z.id);
    const n = zs.filter((s) => done.has(s.id)).length;
    if (z.id === 'basecamp') { if (n === zs.length) ids.push('basecamp'); continue; }
    if (z.id === 'crossroads') continue;
    if (n >= 1) ids.push(`explore:${z.id}`);
    if (n === zs.length) ids.push(`master:${z.id}`);
  }
  for (const m of c.milestones) if (done.size >= m.count) ids.push(m.id);
  return ids;
}

// Awards any newly earned badges; returns the new badge ids.
export function syncBadges(userId) {
  const done = doneSet(progressFor(userId));
  const have = new Set(db.prepare('SELECT badge_id FROM badges WHERE user_id = ?').all(userId).map((r) => r.badge_id));
  const fresh = earnedBadgeIds(done).filter((id) => !have.has(id));
  const ins = db.prepare('INSERT OR IGNORE INTO badges (user_id, badge_id) VALUES (?, ?)');
  for (const id of fresh) ins.run(userId, id);
  return fresh;
}

// Skills that became available because `skillId` was completed.
export function newlyUnlocked(done, skillId) {
  const before = new Set(done); before.delete(skillId);
  return skillList().filter((s) => !isUnlocked(s, before) && isUnlocked(s, done));
}

// ---------- Curriculum coverage ----------
// Core VC links count once a skill is complete; extension links count when
// the teacher confirms the Level Up work.
export function coverage(progress) {
  const c = content();
  const cov = {};
  for (const p of Object.values(progress)) {
    if (p.status !== 'complete') continue;
    const s = c.skills[p.skill_id];
    if (!s) continue;
    for (const id of s.vc.core) (cov[id] ||= []).push({ skill: s, extend: false });
    if (p.level_up) for (const id of s.vc.extend) (cov[id] ||= []).push({ skill: s, extend: true });
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
