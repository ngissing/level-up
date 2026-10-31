// Imports the OFFICIAL Victorian Curriculum F–10 Version 2.0 English from the VCAA website.
//
//   npm run import-vcaa                         downloads https://f10.vcaa.vic.edu.au/learning-areas/english/english/curriculum
//   npm run import-vcaa -- saved-page.html      uses a copy of that page saved from a browser ("Save page as… HTML")
//
// The VCAA page embeds the curriculum as structured data (levels → strands → sub-strands →
// content descriptions, elaborations and achievement standards). This script copies it word
// for word into content/f10/curriculum.json. Nothing is paraphrased.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT_DIR } from '../src/html.js';

const URL = 'https://f10.vcaa.vic.edu.au/learning-areas/english/english/curriculum';
const STRAND_KEY = { Language: 'LA', Literature: 'LE', Literacy: 'LY' };

async function getPage(arg) {
  if (arg) return readFileSync(arg, 'utf8');
  try {
    const res = await fetch(URL);
    if (res.ok) return await res.text();
    throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    // Node's fetch ignores HTTPS_PROXY; curl doesn't.
    try { return execFileSync('curl', ['-sSfL', '-m', '60', URL], { encoding: 'utf8', maxBuffer: 64 << 20 }); }
    catch { throw new Error(`Could not download ${URL} (${e.message}). Check the network allows f10.vcaa.vic.edu.au, or save the page from a browser and pass its path.`); }
  }
}

const strip = (h = '') => h.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;|&rsquo;/g, '’')
  .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

const levelNum = (id) => (/^\d+$/.test(id) ? Number(id) : 0);

let html;
try { html = await getPage(process.argv[2]); } catch (e) { console.error(e.message); process.exit(1); }
const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (!m) { console.error('This doesn’t look like the VCAA English curriculum page (no embedded data found).'); process.exit(1); }
const levels = JSON.parse(m[1]).props.pageProps.additionalContent.curriculum.pathways[0].curriculum;

const entries = [];
const byUuid = {};
const standards = {};
for (const lv of levels) {
  for (const strand of lv.contentDescriptionsContent) {
    for (const sub of strand.subStrands) {
      for (const cd of sub.contentDescriptions) {
        const e = {
          id: cd.code, code: cd.code, levelId: lv.id, levelName: lv.level, level: levelNum(lv.id),
          strand: strand.title, substrand: sub.title, text: cd.contentDescription.trim(),
          elaborations: (cd.elaborations || []).map((x) => strip(x.elaborationText)).filter(Boolean),
        };
        entries.push(e);
        byUuid[cd.id] = e.code;
      }
    }
  }
  // Achievement standard, by language mode, with the content descriptions each sentence draws on.
  standards[lv.id] = {
    intro: strip(lv.achievementStandardContent),
    modes: (lv.modes || []).map((md) => ({
      mode: md.title,
      extracts: [...(md.content || '').matchAll(/<a [^>]*name="([^"]+)"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map(([, name, href, body]) => ({
        id: name, text: strip(body), codes: href.split(';').map((s) => s.replace(/^&amp;|^&/, '').trim()).filter(Boolean).map((u) => byUuid[u]).filter(Boolean),
      })),
    })),
  };
}

// Sub-strand keys used by the app (stable short names for grids and filters).
const SUBKEY = {
  'Language for interacting with others': 'LIO', 'Text structure and organisation': 'TSO', 'Language for expressing and developing ideas': 'EDI',
  'Phonological and phonemic awareness': 'PPA', 'Literature and contexts': 'LC', 'Engaging with and responding to literature': 'ER',
  'Examining literature': 'EX', 'Creating literature': 'CL', 'Interacting with others': 'IWO', 'Phonic and word knowledge': 'PWK',
  'Word knowledge': 'WK', 'Building fluency and making meaning': 'BFM', 'Texts in context': 'TIC', 'Analysing, interpreting and evaluating': 'AIE', 'Creating texts': 'CT',
};
const found = {};
for (const e of entries) {
  e.focus = SUBKEY[e.substrand] || e.substrand.replace(/[^A-Za-z]/g, '').slice(0, 6).toUpperCase();
  found[e.focus] ||= { strand: e.strand, substrand: e.substrand };
}
// Order sub-strands as the VCAA does: by strand, then in the order they appear in the levels the app uses most.
const STRAND_ORDER = ['Language', 'Literature', 'Literacy'];
const firstSeen = (k) => entries.findIndex((e) => e.focus === k && e.level >= 3);
const focusAreas = Object.fromEntries(Object.entries(found).sort(([a, x], [b, y]) =>
  STRAND_ORDER.indexOf(x.strand) - STRAND_ORDER.indexOf(y.strand) || (firstSeen(a) < 0 ? 1e9 : firstSeen(a)) - (firstSeen(b) < 0 ? 1e9 : firstSeen(b))));
const unknownCodes = entries.filter((e) => !new RegExp(`^VC2E${e.levelId.replace(/^FL/, 'F')}${STRAND_KEY[e.strand]}\\d{2}$`).test(e.code));

const out = {
  source: 'Victorian Curriculum F–10 Version 2.0 — English. © VCAA. Copied word for word from the VCAA website.',
  url: URL,
  retrieved: new Date().toISOString().slice(0, 10),
  verified: true,
  focusAreas,
  levels: levels.map((l) => ({ id: l.id, name: l.level })),
  achievementStandards: standards,
  entries,
};
writeFileSync(path.join(ROOT_DIR, 'content', 'f10', 'curriculum.json'), JSON.stringify(out, null, 2));
console.log(`Imported ${entries.length} content descriptions across ${levels.length} levels → content/f10/curriculum.json`);
if (unknownCodes.length) console.log(`  note: ${unknownCodes.length} codes don’t follow the usual pattern: ${unknownCodes.slice(0, 5).map((e) => e.code).join(', ')}…`);
