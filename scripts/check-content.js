import { readFileSync } from 'node:fs';
// Validates content/ and estimates reading level of student-facing text.
//   npm run check
import { content, courseFor } from '../src/content.js';
import { PROGRAM_IDS, PROGRAMS } from '../src/programs.js';
import { LEVEL_IDS, LEVELS, levelInfo } from '../src/levels.js';

const BLOCKS = ['cover', 'goals', 'vocab-match', 'reading', 'questions', 'scenarios', 'phone-annotate', 'doc-annotate', 'sort', 'case-study',
  'table', 'equation', 'flow', 'write', 'do-it', 'storyboard', 'levelup-draw', 'reflect', 'signoff', 'model'];
const SCENES = ['title', 'message', 'stat', 'big', 'flag', 'steps', 'end'];
// Rough reading-level ceilings per version (Flesch–Kincaid grade) come from src/levels.js,
// and can differ by program (VPC aims at Years 5, 7 and 9).

const READS = JSON.parse(readFileSync(new URL('../content/reads.json', import.meta.url), 'utf8'));
let errors = 0, warnings = 0;
const err = (id, m) => { errors++; console.log(`  ✗ ${id}: ${m}`); };
const warn = (id, m) => { warnings++; console.log(`  ! ${id}: ${m}`); };

// Flesch–Kincaid grade level: a rough guide, not a verdict.
function syllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  const m = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g);
  return Math.max(1, m ? m.length : 1);
}
function fkGrade(text) {
  const plain = text.replace(/^\s*\d+\.\s/gm, '').replace(/[*_#>`\[\]()]/g, ' ').replace(/https?:\S+/g, '');
  const sentences = Math.max(1, (plain.match(/[.!?]+(\s|$)/g) || []).length);
  const words = plain.split(/\s+/).filter((w) => /[a-z]/i.test(w));
  if (words.length < 30) return null;
  const syl = words.reduce((n, w) => n + syllables(w), 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syl / words.length) - 15.59;
}

const seenIds = new Map();
for (const program of PROGRAM_IDS) {
const c = content(program);
const vcIds = new Set(Object.keys(c.vc));
console.log(`\n===== ${PROGRAMS[program].name}: ${c.map.zones.length} zones, ${Object.keys(c.skills).length} skills =====`);
for (const z of [c.baseZone, c.crossZone]) if (!c.zones[z]) err(program, `map.json names zone "${z}" but it doesn't exist`);
for (const id of [...Object.keys(c.skills), ...Object.keys(c.zones), ...c.milestones.map((m) => m.id)]) {
  if (seenIds.has(id) && seenIds.get(id) !== program) err(id, `id is used in both ${seenIds.get(id)} and ${program} — ids must be unique across programs`);
  seenIds.set(id, program);
}

for (const s of Object.values(c.skills)) {
  for (const id of [...s.vc.core, ...s.vc.extend, ...(s.vc.support || [])]) if (!vcIds.has(id)) err(s.id, `unknown VC id ${id}`);
  if (!c.zones[s.zone]) err(s.id, `unknown zone ${s.zone}`);
  if (s.status === 'ready' && !s.course) err(s.id, `status is "ready" but content/${program}/skills/${s.id}.json is missing`);
  if (!s.course) continue;

  console.log(`\n${s.title} (${s.id})`);
  for (const level of LEVEL_IDS) {
  const k = courseFor(s, level);
  const tag = `${s.id}/${level}`;
  console.log(`  — ${LEVELS[level].label} version: ${k.brief?.vocab?.length} key words, ${k.quiz?.questions?.length} quiz questions, ${k.workbook?.pages?.length} workbook blocks`);
  for (const key of ['brief', 'explainer', 'read', 'diagrams', 'quiz', 'show', 'workbook', 'teacher']) if (!k[key]) err(tag, `missing "${key}"`);
  if (!k.brief) continue;
  k.explainer?.scenes?.forEach((sc, i) => { if (!SCENES.includes(sc.kind)) err(s.id, `scene ${i}: unknown kind "${sc.kind}"`); if (!sc.say) warn(s.id, `scene ${i} has no "say" narration`); });
  k.quiz?.questions?.forEach((q, i) => { if (!(q.answer >= 0 && q.answer < q.options.length)) err(s.id, `quiz ${i}: answer index out of range`); });
  for (const b of k.workbook?.pages || []) {
    if (!BLOCKS.includes(b.type)) err(s.id, `workbook: unknown block "${b.type}"`);
    if ('diagram' in b && !k.diagrams[b.diagram]) err(s.id, `workbook ${b.type}: no diagram ${b.diagram}`);
    if ('article' in b && !k.read.articles[b.article]) err(s.id, `workbook ${b.type}: no article ${b.article}`);
    if ('caseStudy' in b && !k.read.caseStudies[b.caseStudy]) err(s.id, `workbook ${b.type}: no case study ${b.caseStudy}`);
    // Workbook page numbers change with reading level, so never hard-code them; and double-sided printing
    // means "the back of this page" is another workbook page.
    const bt = JSON.stringify(b);
    const ref = bt.match(/\bpage \d+\b|back of this page|over the page/i);
    if (ref) warn(tag, `workbook ${b.type} "${b.title || ''}": says "${ref[0]}" — refer to the page by its title instead`);
    if (b.type === 'doc-annotate' && Array.isArray(b.wordBank) && b.wordBank.length && k.diagrams[b.diagram || 0]?.callouts && b.wordBank.length !== k.diagrams[b.diagram || 0].callouts.length) {
      warn(tag, `workbook doc-annotate "${b.title}": word bank has ${b.wordBank.length} words for ${k.diagrams[b.diagram || 0].callouts.length} numbered parts`);
    }
  }
  for (const l of k.teacher?.lookFors || []) if (!vcIds.has(l.vc)) err(s.id, `teacher lookFor: unknown VC id ${l.vc}`);
  // "Where" tags: every vc tag inside the course must be a real id that the skill links to.
  const linked = new Set([...(s.vc.support || []), ...s.vc.core, ...s.vc.extend]);
  const walk = (o, at) => {
    if (Array.isArray(o)) return o.forEach((x, i) => walk(x, `${at}[${i}]`));
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o.vc)) for (const id of o.vc) {
      if (!vcIds.has(id)) err(tag, `${at}: unknown vc tag ${id}`);
      else if (!linked.has(id)) warn(tag, `${at}: tagged ${id}, but the skill isn't linked to it in map.json`);
    }
    for (const [key, v] of Object.entries(o)) if (key !== 'vc') walk(v, `${at}.${key}`);
  };
  if (level === 'core') walk(k, 'course');
  for (const cs of k.read?.caseStudies || []) if (!cs.source?.url) warn(s.id, `case study "${cs.title}" has no source URL — real cases need a source`);

  // "What good looks like": a model answer, a three-row rubric and (usually) a choice of topic.
  const sh = k.show || {};
  if (!sh.model) warn(tag, 'no model answer (show.model): students need to see what good looks like');
  if (level === 'core' && !READS.tags[s.id]) warn(s.id, 'no Reading Room topic: add this course to "tags" in content/reads.json');
  else if (level === 'core' && !READS.interests.some((i) => i.id === READS.tags[s.id])) err(s.id, 'content/reads.json tags this course with a topic that does not exist');
  else {
    if (!sh.model.kind || typeof sh.model.text !== 'string') err(tag, 'show.model needs "kind" and "text"');
    if (!Array.isArray(sh.model.why) || sh.model.why.length < 2) err(tag, 'show.model.why needs at least two "why it works" notes');
  }
  if (sh.model && !Array.isArray(sh.rubric)) warn(tag, 'no rubric (show.rubric)');
  for (const r of sh.rubric || []) for (const f of ['skill', 'start', 'good', 'great']) if (!r[f]) err(tag, `rubric row "${r.skill || '?'}" is missing "${f}"`);
  if (sh.rubric && sh.rubric.length !== 3) warn(tag, `rubric has ${sh.rubric.length} rows: three fits the workbook page`);
  if (sh.choices && (!sh.choices.prompt || !Array.isArray(sh.choices.options) || sh.choices.options.length < 2)) err(tag, 'show.choices needs a prompt and at least two options');
  if (sh.solo !== undefined && typeof sh.solo !== 'string') err(tag, 'show.solo must be text');
  if (/\b(support|core|extend|foundation|extended) (level|version)\b/i.test(JSON.stringify([sh.model, sh.rubric, sh.choices, sh.solo]))) err(tag, 'show.* mentions a reading level by name: students see this');

  const texts = [['mission brief', [k.brief.hook, k.brief.why].join(' ')],
    // Model answers are laid out in lines (greetings, labels, dot points), so a line counts as a sentence.
    ...(typeof sh.model?.text === 'string' ? [[`model answer "${sh.model.kind}"`, sh.model.text.replace(/([^.!?:*\s])(\*{0,2})\s*$/gm, '$1$2.')]] : []),
    ...k.read.articles.map((a) => [`article "${a.title}"`, a.body]),
    ...k.read.caseStudies.map((cs) => [`case "${cs.title}"`, cs.body])];
  for (const [label, t] of texts) {
    if (typeof t !== 'string') { err(tag, `${label} did not resolve to text`); continue; }
    const g = fkGrade(t);
    if (g === null) continue;
    const target = levelInfo(level, program).target;
    const flag = g > target ? '!' : '✓';
    if (flag === '!') warnings++;
    console.log(`     ${flag} reading level ${g.toFixed(1)} (aim ≤ ${target}) — ${label}`);
  }
  }
}
}
console.log(`\n${errors} error(s), ${warnings} warning(s).`);
process.exit(errors ? 1 : 0);
