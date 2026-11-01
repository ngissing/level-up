// Imports the OFFICIAL Victorian Pathways Certificate (VPC) Literacy Curriculum Design (VCAA):
// units, modules, learning goals, applications and suggested assessment tasks, word for word,
// into content/vpc/curriculum.json.
//
//   npm run import-vpc                          downloads the curriculum design from the VCAA website
//   npm run import-vpc -- CurriculumDesign.docx uses a copy you've downloaded
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { ROOT_DIR } from '../src/html.js';

const URL = 'https://www.vcaa.vic.edu.au/sites/default/files/Documents/VictorianPathwaysCertificate/vpcliteracy/VPCLiteracyCurriculumDesign.docx';
const PAGE = 'https://www.vcaa.vic.edu.au/curriculum/vpc-curriculum/vpc-curriculum-designs/vpc-literacy/vpc-literacy-curriculum-design';

let file = process.argv[2];
if (!file) {
  file = path.join(mkdtempSync(path.join(os.tmpdir(), 'vpc-')), 'curriculum-design.docx');
  try { execFileSync('curl', ['-sSfL', '-m', '60', '-o', file, URL]); }
  catch { console.error(`Couldn't download ${URL}. Check the network allows vcaa.vic.edu.au, or pass a downloaded copy.`); process.exit(1); }
}
const buf = readFileSync(file);
const mammoth = (await import('mammoth')).default;
const lines = (await mammoth.extractRawText({ buffer: buf })).value.split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);

// Skip the contents page: the body starts at the "Unit 1" heading that is followed by a module.
const start = lines.findIndex((l, i) => l === 'Unit 1' && /^Module 1: /.test(lines[i + 1]));
if (start < 0) { console.error('This doesn’t look like the VPC Literacy curriculum design.'); process.exit(1); }
const body = lines.slice(start);

const units = [];
let unit = null, mod = null, mode = null, table = null;
for (const l of body) {
  let m;
  if ((m = l.match(/^Unit ([1-4])$/))) { unit = { unit: Number(m[1]), modules: [] }; units.push(unit); mod = null; mode = null; table = null; continue; }
  if (!unit) continue;
  if ((m = l.match(/^Module ([12]): (.+)$/))) {
    mod = { number: Number(m[1]), title: m[2].trim(), description: [], goal: '', statement: '', goals: [], applications: [], assessment: [] };
    unit.modules.push(mod); mode = 'desc'; continue;
  }
  if (l === 'Assessment') { mode = 'assess'; table = null; continue; }
  if (mode === 'assess' || mode === 'tasks') {
    // The assessment table: "Module 1 Goal 1.1", the goals again, then suggested tasks.
    if ((m = l.match(/^Module ([12]) Goal/))) { table = unit.modules.find((x) => x.number === Number(m[1])); mode = 'assess'; continue; }
    if (/^Assessment could consist of/.test(l)) { mode = 'tasks'; continue; }
    if (/^Where teachers allow students/.test(l)) { mode = null; continue; }
    if (mode === 'tasks' && table) table.assessment.push(l.replace(/[.;]$/, ''));
    continue;
  }
  if (!mod) continue;
  if ((m = l.match(/^Learning goal (\d\.\d)$/))) { mod.goal = m[1]; mode = 'goal'; continue; }
  if (l === 'Application') { mode = 'app'; continue; }
  if (mode === 'desc') mod.description.push(l);
  else if (mode === 'goal') {
    if (/^On completion of this module/.test(l)) mod.statement = l;
    else mod.goals.push(l);
  } else if (mode === 'app') {
    if (/^Demonstration of the learning goal/.test(l)) continue;
    mod.applications.push(l);
  }
}
// In the assessment tables, one "suggested tasks" cell spans every module of the unit.
for (const u of units) {
  const shared = u.modules.find((x) => x.assessment.length)?.assessment || [];
  for (const x of u.modules) if (!x.assessment.length) x.assessment = [...shared];
}

const entries = [];
const focusAreas = {};
const outcomes = [];
for (const u of units) for (const x of u.modules) {
  const focus = `U${u.unit}M${x.number}`;
  const strand = `Unit ${u.unit} · Module ${x.number}`;
  focusAreas[focus] = { strand: `Unit ${u.unit}`, substrand: `Module ${x.number}: ${x.title}` };
  outcomes.push({ id: focus, unit: u.unit, outcome: x.number, goal: x.goal, title: x.title, statement: x.statement, options: [], assessment: x.assessment, description: x.description });
  const add = (list, kind, abbr) => list.forEach((text, k) => entries.push({
    id: `VPC-${focus}-${abbr}${k + 1}`, code: `U${u.unit} M${x.number} ${abbr}${k + 1}`, unit: u.unit, outcome: x.number, kind,
    strand, substrand: x.title, focus, level: null, text: text.replace(/[.;]$/, ''),
  }));
  add(x.goals, 'Learning goal', 'LG');
  add(x.applications, 'Application', 'AP');
}
const bad = outcomes.filter((o) => !o.statement || !entries.some((e) => e.focus === o.id && e.kind === 'Application'));
if (units.length !== 4 || outcomes.length !== 7 || bad.length) {
  console.error(`Expected 4 units and 7 modules with learning goals and applications; found ${units.length} units and ${outcomes.length} modules${bad.length ? ` (incomplete: ${bad.map((o) => o.id).join(', ')})` : ''}.`);
  process.exit(1);
}

writeFileSync(path.join(ROOT_DIR, 'content', 'vpc', 'curriculum.json'), JSON.stringify({
  source: 'Victorian Pathways Certificate Literacy Curriculum Design (accredited 1 January 2023 – 31 December 2027). © VCAA. Copied word for word from the curriculum design.',
  url: PAGE, document: URL, documentSha1: createHash('sha1').update(buf).digest('hex'),
  retrieved: new Date().toISOString().slice(0, 10), verified: true, kind: 'study-design',
  units: units.map((u) => u.unit), focusAreas, outcomes, entries,
}, null, 2));
for (const o of outcomes) {
  const e = entries.filter((x) => x.focus === o.id);
  console.log(`Unit ${o.unit} Module ${o.outcome} (goal ${o.goal}) ${o.title}: ${e.filter((x) => x.kind === 'Learning goal').length} learning goals, ${e.filter((x) => x.kind === 'Application').length} applications, ${o.assessment.length} suggested tasks`);
}
console.log('→ content/vpc/curriculum.json');
