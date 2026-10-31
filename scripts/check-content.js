// Validates content/ and estimates reading level of student-facing text.
//   npm run check
import { content, courseFor } from '../src/content.js';
import { LEVEL_IDS, LEVELS } from '../src/levels.js';

const BLOCKS = ['cover', 'goals', 'vocab-match', 'reading', 'questions', 'scenarios', 'phone-annotate', 'sort', 'case-study',
  'table', 'equation', 'flow', 'write', 'levelup-draw', 'reflect', 'signoff'];
const SCENES = ['title', 'message', 'stat', 'big', 'flag', 'steps', 'end'];
// Rough reading-level ceilings per version (Flesch–Kincaid grade).
const TARGET = { support: 4.5, core: 6.5, extend: 8.5 };

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

const c = content();
const vcIds = new Set(Object.keys(c.vc));
console.log(`Map: ${c.map.zones.length} zones, ${Object.keys(c.skills).length} skills`);

for (const s of Object.values(c.skills)) {
  for (const id of [...s.vc.core, ...s.vc.extend, ...(s.vc.support || [])]) if (!vcIds.has(id)) err(s.id, `unknown VC id ${id}`);
  if (!c.zones[s.zone]) err(s.id, `unknown zone ${s.zone}`);
  if (s.status === 'ready' && !s.course) err(s.id, 'status is "ready" but content/skills/<id>.json is missing');
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
  }
  for (const l of k.teacher?.lookFors || []) if (!vcIds.has(l.vc)) err(s.id, `teacher lookFor: unknown VC id ${l.vc}`);
  for (const cs of k.read?.caseStudies || []) if (!cs.source?.url) warn(s.id, `case study "${cs.title}" has no source URL — real cases need a source`);

  const texts = [['mission brief', [k.brief.hook, k.brief.why].join(' ')],
    ...k.read.articles.map((a) => [`article "${a.title}"`, a.body]),
    ...k.read.caseStudies.map((cs) => [`case "${cs.title}"`, cs.body])];
  for (const [label, t] of texts) {
    if (typeof t !== 'string') { err(tag, `${label} did not resolve to text`); continue; }
    const g = fkGrade(t);
    if (g === null) continue;
    const flag = g > TARGET[level] ? '!' : '✓';
    if (flag === '!') warnings++;
    console.log(`     ${flag} reading level ${g.toFixed(1)} (aim ≤ ${TARGET[level]}) — ${label}`);
  }
  }
}
console.log(`\n${errors} error(s), ${warnings} warning(s).`);
process.exit(errors ? 1 : 0);
