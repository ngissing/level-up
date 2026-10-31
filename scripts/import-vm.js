// Imports the OFFICIAL VCE Vocational Major Literacy Study Design (VCAA): units, areas of
// study, outcomes, key knowledge and key skills, word for word. Units 1 & 2 go to
// content/vm12/curriculum.json and Units 3 & 4 to content/vm34/curriculum.json.
//
//   npm run import-vm                        downloads the study design from the VCAA website
//   npm run import-vm -- StudyDesign.docx    uses a copy you've downloaded
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { ROOT_DIR } from '../src/html.js';

const URL = 'https://vcaa.vic.edu.au/sites/default/files/2025-04/VCEVMLiteracyStudyDesign.docx';
const PAGE = 'https://www.vcaa.vic.edu.au/curriculum/vce-curriculum/vce-study-designs/vce-vm-literacy';

let file = process.argv[2];
if (!file) {
  file = path.join(mkdtempSync(path.join(os.tmpdir(), 'vm-')), 'study-design.docx');
  try { execFileSync('curl', ['-sSfL', '-m', '60', '-o', file, URL]); }
  catch { console.error(`Couldn't download ${URL}. Check the network allows vcaa.vic.edu.au, or pass a downloaded copy.`); process.exit(1); }
}
const buf = readFileSync(file);
const mammoth = (await import('mammoth')).default;
const lines = (await mammoth.extractRawText({ buffer: buf })).value.split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);

// Skip the table of contents: the body starts at the second "Unit 1" heading that is followed by an Area of Study.
const starts = lines.map((l, i) => (l === 'Unit 1' && /^Area of Study 1:/.test(lines[i + 1]) ? i : -1)).filter((i) => i >= 0);
if (!starts.length) { console.error('This doesn’t look like the VCE VM Literacy study design.'); process.exit(1); }
const body = lines.slice(starts[0]);

const units = [];
let unit = null, aos = null, mode = null;
for (let i = 0; i < body.length; i++) {
  const l = body[i];
  let m;
  if ((m = l.match(/^Unit ([1-4])$/))) { unit = { unit: Number(m[1]), areas: [] }; units.push(unit); mode = null; continue; }
  if ((m = l.match(/^Area of Study ([12]): (.+)$/))) { aos = { number: Number(m[1]), title: m[2].trim(), description: [], statement: '', options: [], keyKnowledge: [], keySkills: [] }; unit.areas.push(aos); mode = 'desc'; continue; }
  if (/^Satisfactory completion$/.test(l) || /^Assessment tools$/.test(l)) { mode = null; aos = null; continue; }
  if (!aos) continue;
  if (/^Outcome [12]$/.test(l)) { mode = 'outcome'; continue; }
  if (/^Key knowledge$/.test(l)) { mode = 'kk'; continue; }
  if (/^Key skills$/.test(l)) { mode = 'ks'; continue; }
  if (mode === 'desc') aos.description.push(l);
  else if (mode === 'outcome') {
    if (/^On completion of this unit/.test(l)) aos.statement = l;
    else if (/^To achieve this outcome/.test(l)) continue;
    else aos.options.push(l);
  } else if (mode === 'kk') aos.keyKnowledge.push(l);
  else if (mode === 'ks') aos.keySkills.push(l);
}

const entries = [];
const focusAreas = {};
const outcomes = [];
for (const u of units) for (const a of u.areas) {
  const focus = `U${u.unit}O${a.number}`;
  const strand = `Unit ${u.unit} · Outcome ${a.number}`;
  focusAreas[focus] = { strand: `Unit ${u.unit}`, substrand: `Outcome ${a.number}: ${a.title}` };
  outcomes.push({ id: focus, unit: u.unit, outcome: a.number, title: a.title, statement: a.statement, options: a.options, description: a.description });
  const add = (list, kind, abbr) => list.forEach((text, k) => entries.push({
    id: `VM-${focus}-${abbr}${k + 1}`, code: `U${u.unit} O${a.number} ${abbr}${k + 1}`, unit: u.unit, outcome: a.number, kind,
    strand, substrand: a.title, focus, level: null, text: text.replace(/[.;]$/, ''),
  }));
  add(a.keyKnowledge, 'Key knowledge', 'KK');
  add(a.keySkills, 'Key skill', 'KS');
}
if (units.length !== 4 || outcomes.length !== 8) { console.error(`Expected 4 units and 8 outcomes, found ${units.length} and ${outcomes.length}.`); process.exit(1); }

// Units 1 & 2 and Units 3 & 4 are separate courses (programs vm12 and vm34).
const meta = {
  source: 'VCE Vocational Major Literacy Study Design (accredited 1 January 2023 – 31 December 2027). © VCAA. Copied word for word from the study design.',
  url: PAGE, document: URL, documentSha1: createHash('sha1').update(buf).digest('hex'),
  retrieved: new Date().toISOString().slice(0, 10), verified: true, kind: 'study-design',
};
for (const [program, units] of [['vm12', [1, 2]], ['vm34', [3, 4]]]) {
  const keep = (x) => units.includes(x.unit);
  const fa = Object.fromEntries(Object.entries(focusAreas).filter(([k]) => units.includes(Number(k[1]))));
  writeFileSync(path.join(ROOT_DIR, 'content', program, 'curriculum.json'), JSON.stringify({
    ...meta, units, focusAreas: fa, outcomes: outcomes.filter(keep), entries: entries.filter(keep),
  }, null, 2));
  const e = entries.filter(keep);
  console.log(`Units ${units.join(' & ')}: ${outcomes.filter(keep).length} outcomes, ${e.filter((x) => x.kind === 'Key knowledge').length} key knowledge, ${e.filter((x) => x.kind === 'Key skill').length} key skills → content/${program}/curriculum.json`);
}
