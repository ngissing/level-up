// Records explainer narration with Google Cloud Text-to-Speech natural voices.
//
//   GOOGLE_TTS_API_KEY=… npm run voices                 every written skill, all reading levels
//   GOOGLE_TTS_API_KEY=… npm run voices -- spot-the-scam
//   … npm run voices -- --list                          show the Australian voices your key can use
//   … npm run voices -- --force                         re-record everything (e.g. after changing voice)
//   TTS_VOICE=en-AU-Neural2-C npm run voices            pick a specific voice
//   TTS_GENDER=male npm run voices -- --force           best voice of that gender (default: the admin's
//                                                       "Narrator voice" setting in Accounts → Settings)
//
// Audio is saved to public/audio/<skill>/ with a manifest, so each line is only
// recorded once (unchanged lines are skipped) and plays instantly in class.
// Lines are matched by their exact text: edit a "say" line and run this again.
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR } from '../src/html.js';
import { skillList, getSkill, courseFor, lineKey } from '../src/content.js';
import { LEVEL_IDS } from '../src/levels.js';
import { getSetting } from '../src/db.js';

const KEY = process.env.GOOGLE_TTS_API_KEY;
const API = process.env.TTS_API_BASE || 'https://texttospeech.googleapis.com/v1';
const LANG = process.env.TTS_LANGUAGE || 'en-AU';
const args = process.argv.slice(2);
const force = args.includes('--force');

if (!KEY) {
  console.error('Set GOOGLE_TTS_API_KEY first. See docs/VOICES.md for the 5-minute setup.');
  process.exit(1);
}

const fail = (e) => {
  console.error(`\nGoogle Text-to-Speech said: ${e.message}`);
  console.error('Check the API key, that the Text-to-Speech API is enabled, and that billing is set up (docs/VOICES.md).');
  process.exit(1);
};
process.on('unhandledRejection', fail);
process.on('uncaughtException', fail);

async function call(pathname, body) {
  const res = await fetch(`${API}/${pathname}${pathname.includes('?') ? '&' : '?'}key=${encodeURIComponent(KEY)}`, body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`);
  return json;
}

// Best natural voices first: Chirp 3 HD, then Chirp HD, Neural2, WaveNet.
const RANK = [/Chirp3-HD/, /Chirp-HD/, /Neural2/, /Wavenet/, /News|Studio/];
const rank = (n) => { const i = RANK.findIndex((r) => r.test(n)); return i < 0 ? 99 : i; };

const { voices = [] } = await call(`voices?languageCode=${LANG}`);
const sorted = voices.filter((v) => v.languageCodes.includes(LANG)).sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));
if (args.includes('--list')) {
  for (const v of sorted) console.log(`${v.name.padEnd(28)} ${v.ssmlGender.toLowerCase()}`);
  process.exit(0);
}
const gender = (process.env.TTS_GENDER || getSetting('voice_gender') || 'any').toLowerCase();
let voice = process.env.TTS_VOICE;
if (voice && !sorted.some((v) => v.name === voice)) {
  console.error(`Voice "${voice}" isn't available. Run "npm run voices -- --list" to see the names you can use.`);
  process.exit(1);
}
voice ||= (sorted.find((v) => gender === 'any' || v.ssmlGender.toLowerCase() === gender) || sorted[0])?.name;
if (!voice) { console.error(`No ${LANG} voices available to this key.`); process.exit(1); }
const vinfo = sorted.find((v) => v.name === voice);
console.log(`Voice: ${voice} (${vinfo?.ssmlGender.toLowerCase()})`);

const ids = args.filter((a) => !a.startsWith('--'));
const skills = ids.length ? ids.map(getSkill) : skillList().filter((s) => s.ready);
let chars = 0, made = 0, kept = 0;
for (const skill of skills) {
  if (!skill?.course) continue;
  const dir = path.join(ROOT_DIR, 'public', 'audio', skill.id);
  mkdirSync(dir, { recursive: true });
  const mfile = path.join(dir, 'manifest.json');
  const manifest = existsSync(mfile) ? JSON.parse(readFileSync(mfile, 'utf8')) : { lines: {} };
  const lines = new Set(LEVEL_IDS.flatMap((l) => courseFor(skill, l).explainer.scenes.map((s) => s.say).filter(Boolean)));
  const keep = {};
  for (const text of lines) {
    const k = lineKey(text);
    const old = manifest.lines[k];
    if (old && !force && old.voice === voice && existsSync(path.join(dir, old.file))) { keep[k] = old; kept++; continue; }
    const body = { input: { text }, voice: { languageCode: LANG, name: voice }, audioConfig: { audioEncoding: 'MP3' } };
    const { audioContent } = await call('text:synthesize', body);
    // The voice is part of the filename, so browsers never replay a cached old voice.
    const file = `${k}-${lineKey(voice).slice(0, 6)}.mp3`;
    writeFileSync(path.join(dir, file), Buffer.from(audioContent, 'base64'));
    keep[k] = { file, voice, text };
    chars += text.length; made++;
    process.stdout.write('.');
  }
  writeFileSync(mfile, JSON.stringify({ voice, lines: keep }, null, 2));
  // Tidy up recordings that are no longer used (old voice or changed lines).
  const used = new Set(Object.values(keep).map((l) => l.file));
  for (const f of readdirSync(dir)) if (f.endsWith('.mp3') && !used.has(f)) unlinkSync(path.join(dir, f));
  console.log(`\n${skill.title}: ${lines.size} lines`);
}
console.log(`Recorded ${made} new line(s) (${chars} characters), kept ${kept}. Audio is in public/audio/.`);
