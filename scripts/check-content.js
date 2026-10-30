// Validates content/ and estimates reading level of student-facing text.
//   npm run check
import { content, STEPS } from '../src/content.js';

const BLOCKS = ['cover', 'goals', 'vocab-match', 'reading', 'questions', 'scenarios', 'phone-annotate', 'sort', 'case-study',
  'table', 'equation', 'flow', 'write', 'levelup-draw', 'reflect', 'signoff'];
const SCENES = ['title', 'message', 'stat', 'big', 'flag', 'steps', 'end'];
const TARGET_GRADE = 7; // students read at about Year 3–7 level

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
  for (const id of [...s.vc.core, ...s.vc.extend]) if (!vcIds.has(id)) err(s.id, `unknown VC id ${id}`);
  if (!c.zones[s.zone]) err(s.id, `unknown zone ${s.zone}`);
  if (s.status === 'ready' && !s.course) err(s.id, 'status is "ready" but content/skills/<id>.json is missing');
  if (!s.course) continue;

  const k = s.course;
  console.log(`\n${s.title} (${s.id})`);
  for (const key of ['brief', 'explainer', 'read', 'diagrams', 'quiz', 'show', 'workbook', 'teacher']) if (!k[key]) err(s.id, `missing "${key}"`);
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
    const g = fkGrade(t);
    if (g === null) continue;
    const flag = g > TARGET_GRADE + 1 ? '!' : '✓';
    if (flag === '!') warnings++;
    console.log(`  ${flag} reading level ${g.toFixed(1)} — ${label}`);
  }
}
console.log(`\n${errors} error(s), ${warnings} warning(s). Reading level target: about Year ${TARGET_GRADE} or below.`);
process.exit(errors ? 1 : 0);
