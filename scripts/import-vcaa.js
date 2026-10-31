// Imports the OFFICIAL Victorian Curriculum F–10 v2.0 English content descriptions
// from a VCAA document, and reports how our curriculum links compare.
//
//   npm run import-vcaa -- path/to/English-Curriculum.docx   (.docx, .html or .txt)
//   npm run import-vcaa -- --fetch     (downloads from the VCAA site; needs network access to f10.vcaa.vic.edu.au)
//
// Writes:
//   content/vcaa-english.json   every content description found: code, level, strand, sub-strand, exact text
//   docs/CURRICULUM-CHECK.md    our paraphrased entries side by side with the official text
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR } from '../src/html.js';

const SOURCES = [
  'https://f10.vcaa.vic.edu.au/sites/default/files/2025-07/English%20%E2%80%93%20Curriculum.docx',
  'https://f10.vcaa.vic.edu.au/sites/default/files/2025-02/English%20%E2%80%93%20Curriculum.docx',
];
const STRANDS = { LA: 'Language', LE: 'Literature', LY: 'Literacy' };
const SUBSTRANDS = [
  'Language for interacting with others', 'Text structure and organisation', 'Language for expressing and developing ideas',
  'Phonological and phonemic awareness', 'Literature and contexts', 'Engaging with and responding to literature',
  'Examining literature', 'Creating literature', 'Texts in context', 'Interacting with others',
  'Analysing, interpreting and evaluating', 'Creating texts', 'Phonic and word knowledge',
];
const CODE = /\(?\b(VC2E(F|10|[1-9])(LA|LE|LY)(\d{2}))\b\)?(?!_)/;

async function load(arg) {
  if (arg === '--fetch') {
    for (const url of SOURCES) {
      try {
        const res = await fetch(url);
        if (!res.ok) { console.warn(`  ${res.status} ${url}`); continue; }
        const buf = Buffer.from(await res.arrayBuffer());
        mkdirSync(path.join(ROOT_DIR, 'data'), { recursive: true });
        writeFileSync(path.join(ROOT_DIR, 'data', 'vcaa-english.docx'), buf);
        console.log('Downloaded', url);
        return { text: await docxText(buf), source: url };
      } catch (e) { console.warn(`  could not reach ${url}: ${e.cause?.code || e.message}`); }
    }
    throw new Error('Could not download from the VCAA site. Allow f10.vcaa.vic.edu.au in the network settings, or download the file yourself and pass its path.');
  }
  const buf = readFileSync(arg);
  if (arg.endsWith('.docx')) return { text: await docxText(buf), source: path.basename(arg) };
  let text = buf.toString('utf8');
  if (/\.html?$/.test(arg)) text = text.replace(/<(br|\/p|\/div|\/li|\/td|\/tr|\/h\d)[^>]*>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
  return { text, source: path.basename(arg) };
}

async function docxText(buf) {
  const mammoth = (await import('mammoth')).default;
  return (await mammoth.extractRawText({ buffer: buf })).value;
}

function parse(text) {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const found = new Map();
  let sub = null;
  lines.forEach((line, i) => {
    const s = SUBSTRANDS.find((x) => line.toLowerCase() === x.toLowerCase() || line.toLowerCase().startsWith(x.toLowerCase() + ' '));
    if (s && !CODE.test(line)) sub = s;
    const m = line.match(CODE);
    if (!m) return;
    const [, code, lvl, strandKey] = m;
    // Text is either on the same line before the code, or on the line(s) just above it.
    let t = line.slice(0, m.index).trim();
    if (t.length < 15) {
      for (let k = i - 1; k >= 0 && k >= i - 3; k--) { if (CODE.test(lines[k]) || SUBSTRANDS.includes(lines[k])) break; t = lines[k] + (t ? ' ' + t : ''); if (t.length > 40) break; }
    }
    t = t.replace(/[\s(]+$/, '').trim();
    if (!found.has(code) || found.get(code).text.length < t.length) {
      found.set(code, { code, level: lvl === 'F' ? 0 : Number(lvl), strand: STRANDS[strandKey], substrand: sub, text: t });
    }
  });
  return [...found.values()].sort((a, b) => a.level - b.level || a.code.localeCompare(b.code));
}

const arg = process.argv[2];
if (!arg) { console.log('Usage: npm run import-vcaa -- <file.docx|file.html|file.txt>   or   npm run import-vcaa -- --fetch'); process.exit(1); }
let text, source;
try { ({ text, source } = await load(arg)); } catch (e) { console.error(e.message); process.exit(1); }
const official = parse(text);
if (!official.length) { console.error('No VC2E… codes found. Is this the VCAA English curriculum document?'); process.exit(1); }

writeFileSync(path.join(ROOT_DIR, 'content', 'vcaa-english.json'), JSON.stringify({
  source, importedAt: new Date().toISOString(), count: official.length, contentDescriptions: official,
}, null, 2));
console.log(`Found ${official.length} content descriptions (${[...new Set(official.map((o) => o.level))].map((l) => l || 'F').join(', ')}) → content/vcaa-english.json`);

// Side-by-side report against our paraphrased entries.
const ours = JSON.parse(readFileSync(path.join(ROOT_DIR, 'content', 'curriculum.json'), 'utf8'));
const out = ['# Curriculum check', '', `Official source: ${source} (imported ${new Date().toISOString().slice(0, 10)}).`, '',
  'Each of our paraphrased entries is listed with the official content descriptions for the same level, strand and sub-strand.', ''];
let missingSub = 0;
for (const e of ours.entries) {
  const match = official.filter((o) => o.level === e.level && o.strand === e.strand && (!o.substrand || o.substrand === e.substrand));
  out.push(`## ${e.id} — Level ${e.level} ${e.strand} › ${e.substrand}`, '', `**Ours (paraphrased, ${e.code}):** ${e.text}`, '');
  if (match.length) for (const o of match) out.push(`- **${o.code}** ${o.text}${o.substrand ? '' : ' _(sub-strand not detected)_'}`);
  else { out.push('- ⚠️ No official content description found for this level / sub-strand.'); missingSub++; }
  out.push('');
}
writeFileSync(path.join(ROOT_DIR, 'docs', 'CURRICULUM-CHECK.md'), out.join('\n'));
console.log(`Report → docs/CURRICULUM-CHECK.md (${missingSub} of our entries had no official match)`);
