// Writes docs/COURSE-MAP.md (F–10), docs/COURSE-MAP-VM12.md / -VM34.md (VCE VM Literacy) and
// docs/COURSE-MAP-VPC.md (VPC Literacy) from content/
// so the map documents never drift.
//   npm run map-doc
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR } from '../src/html.js';
import { content, requirements } from '../src/content.js';
import { PROGRAMS } from '../src/programs.js';
import { LEVEL_IDS, LEVELS, levelInfo } from '../src/levels.js';

const c = content('f10');
const vc = (id) => { const e = c.vc[id]; return `${e.code} (${e.substrand})`; };
const tierName = { 0: 'Base Camp', 1: 'Starter', 2: 'Level 2', 3: 'Boss', 4: 'Crossroads' };
const L = [];
const p = (s = '') => L.push(s);

p('# Level Up Literacy — course map: Victorian Curriculum F–10');
p();
p('_Generated from `content/f10/` by `npm run map-doc`. Edit the JSON, not this file. The VCE VM Literacy pathways are in [COURSE-MAP-VM12.md](COURSE-MAP-VM12.md) (Units 1 & 2) and [COURSE-MAP-VM34.md](COURSE-MAP-VM34.md) (Units 3 & 4)._');
p();
p('## The idea');
p();
p('Every skill is a **mini course** that links a part of the Victorian Curriculum F–10 (Version 2.0) English to a real thing a teenager needs to do: spot a scam, read a payslip, pass the L-plate test, write a complaint that gets results. Students read at around Year 3–7 level, so the texts are short and plain, but the topics are pitched at 14–17 year olds.');
p();
p('## How the map works');
p();
p('```');
p('                 BASE CAMP  (3 core skills, all open)');
p('                      │  finish any 2');
p('    ┌─────────┬───────┴──┬──────────┬──────────┐');
p('  MONEY     WORK      DIGITAL    GET SORTED   YOUR VOICE      ← 5 zones, pick any');
p('  2 starters → 2 level-2 skills → 1 boss skill   (in each zone)');
p('    └─────────┴────┬─────┴──────────┴──────────┘');
p('                CROSSROADS  (4 capstones that need 2 skills in each of two zones)');
p('```');
p();
p('- **Hybrid tree, not a straight line.** A small core (Base Camp) gives everyone the same toolkit: reading for purpose, choosing the right tone, finding information fast. After that it is a choose-your-own-adventure: students open any zone and move through it at their own pace.');
p('- **Unlock rules** (set in `content/map.json` → `unlocks`):');
p('  - Starter skills: finish 2 Base Camp skills.');
p('  - Level-2 skills: finish **both** starters in that zone.');
p('  - Boss skill: finish both starters **and** a level-2 skill in that zone.');
p('  - Crossroads: finish 2 skills in each of the two named zones.');
p('  - Unwritten skills block the way like any other. An admin can turn on *preview mode* to skip them while courses are being built.');
p('- **Badges:** one per skill, an *Explorer* and a *Master* badge per zone, *Base Camp Cleared*, and milestones at 1, 5, 10 and 20 skills.');
p('- **Reading levels.** An admin sets each student’s reading level (▲ Foundation, Years 3–4 · ■ Core, Years 5–6 · ● Extended, Year 7+). Each mini course is written at all three levels, and students never see theirs.');
p('- **Curriculum evidence follows the level.** Foundation readers evidence the Level 3–4 content descriptions; everyone else evidences the Core (Level 5–6) codes. *Level Up* tasks (★ in workbooks) evidence the Level 6–8 codes once the teacher confirms that work.');
p('- **Official curriculum.** All codes and wording come word for word from the VCAA website (`npm run import-vcaa`).');
p();
p('## What is inside every mini course');
p();
p('| Step | Student sees | Built from |');
p('|---|---|---|');
p('| 1. Mission brief | Hook, why it matters, “I can” goals, key words (each read aloud) | `brief` |');
p('| 2. Watch | A 2-minute animated explainer that narrates itself, with captions; optional real video | `explainer` |');
p('| 3. Read | A short article plus real, sourced case studies with “think about it” prompts | `read` |');
p('| 4. See it | Diagrams (annotated examples, flow charts) | `diagrams` |');
p('| 5. Workbook | Printable A4 workbook — the main way students show learning | `workbook` |');
p('| 6. Quick check | 5 auto-marked questions with feedback (pass mark set by admin) | `quiz` |');
p('| 7. Show it | Final task checklist, reflection, Level Up claim → teacher sign-off | `show` |');
p('| Teacher guide | Lesson sequence, explicit teaching points, look-fors mapped to VC, answers | `teacher` |');
p();
p('## Status');
p();
const all = Object.values(c.skills);
p(`${all.filter((s) => s.ready).length} of ${all.length} mini courses built. Planned skills are already mapped to the curriculum and appear on the map as “coming soon”.`);
p();
p('**Suggested build order:** Say It Right → Find It Fast (finish Base Camp), then one starter per zone (Read Your Payslip, Crack the Job Ad, Fact or Fake?, Form Filler, Tell Your Story), then level-2 skills where students are heading.');
p();

for (const z of c.map.zones) {
  p(`## ${z.name}`);
  p();
  p(`_${z.pitch}_`);
  p();
  p('| Skill | Tier | Real-life skill | Literacy focus | VC ▲ Foundation | VC Core | VC ★ Level Up | Unlocks after | Badge | Status |');
  p('|---|---|---|---|---|---|---|---|---|---|');
  for (const s of all.filter((x) => x.zone === z.id)) {
    const req = requirements(s).filter((r) => r.text !== 'Finish 2 Base Camp skills' || s.tier === 1).map((r) => r.text).join('; ') || '—';
    p(`| **${s.title}** | ${tierName[s.tier]} | ${s.realLife} | ${s.literacy} | ${(s.vc.support || []).map(vc).join('<br>')} | ${s.vc.core.map(vc).join('<br>')} | ${s.vc.extend.map(vc).join('<br>')} | ${req} | ${s.badge.name} | ${s.ready ? '✅ built' : 'planned'} |`);
  }
  p();
}

p('## Curriculum coverage (Levels 3–10)');
p();
p('Each cell shows how many of the official content descriptions at that level and sub-strand are linked to at least one skill.');
p();
const levels = [3, 4, 5, 6, 7, 8, 9, 10];
p(`| Strand › sub-strand | ${levels.map((l) => `L${l}`).join(' | ')} |`);
p(`|---|${levels.map(() => '---').join('|')}|`);
for (const [key, fa] of Object.entries(c.curriculum.focusAreas)) {
  p(`| ${fa.strand} › ${fa.substrand} | ${levels.map((l) => {
    const es = c.curriculum.entries.filter((e) => e.level === l && e.focus === key);
    if (!es.length) return '·';
    const n = es.filter((e) => all.some((s) => [...(s.vc.support || []), ...s.vc.core, ...s.vc.extend].includes(e.id))).length;
    return `${n}/${es.length}`;
  }).join(' | ')} |`);
}
p();
p(`Source: ${c.curriculum.source} Retrieved ${c.curriculum.retrieved} from ${c.curriculum.url}.`);
p();
writeFileSync(path.join(ROOT_DIR, 'docs', 'COURSE-MAP.md'), L.join('\n'));
console.log('wrote docs/COURSE-MAP.md');

// ---------- Study designs: VCE VM Literacy and VPC Literacy ----------
for (const program of ['vm12', 'vm34', 'vpc']) {
  const P = PROGRAMS[program];
  const [K1, K2] = P.kinds;
  const v = content(program);
  const name = v.programObj.name;
  const V = [];
  const q = (x = '') => V.push(x);
  const item = (id) => { const e = v.vc[id]; return `${e.code} — ${e.text}`; };
  const tierV = { 0: v.zones[v.baseZone].name, 1: 'Starter', 2: 'Level 2', 3: 'Boss', 4: v.zones[v.crossZone].name };
  const allV = Object.values(v.skills);
  q(`# Level Up · ${name} — course map`);
  q();
  q(`_Generated from \`content/${program}/\` by \`npm run map-doc\`. Edit the JSON, not this file._`);
  q();
  const midZones = v.map.zones.length - 2;
  if (program === 'vpc') {
    q(`Mini courses for students enrolled in **${name}**, linked to the learning goals (LG) and applications (AP) of the seven modules in the Victorian Pathways Certificate Literacy Curriculum Design. The units are standalone and can be done in any order, so VPC is one pathway: ${v.zones[v.baseZone].name} → ${midZones} zones, one per module (starters, Level 2, boss) → ${v.zones[v.crossZone].name} (Unit 4's negotiated project). Every course is hands-on: it ends with a real-world **Do it** task. Codes such as **U1 M1 AP3** mean Unit 1, Module 1, 3rd application, in curriculum order.`);
    q();
    q(`Reading levels work the same way as F–10 and VM, but aim higher: ${LEVEL_IDS.map((l) => `${LEVELS[l].symbol} ${LEVELS[l].label} ${levelInfo(l, program).years}`).join(', ')}.`);
  } else {
    q(`Mini courses for students enrolled in **${name}**, linked to the key knowledge (KK) and key skills (KS) of its four outcomes in the VCE Vocational Major Literacy Study Design. Same structure as the F–10 pathway: ${v.zones[v.baseZone].name} → four zones (starters, Level 2, boss) → Capstones. Reading levels work the same way. Codes such as **U1 O1 KK3** mean Unit 1, Outcome 1, 3rd key knowledge point, in study-design order.`);
  }
  q();
  q(`${allV.filter((s) => s.ready).length} of ${allV.length} mini courses built.`);
  q();
  for (const z of v.map.zones) {
    q(`## ${z.name} (${z.units})`);
    q();
    q(`_${z.pitch}_`);
    q();
    q(`| Skill | Tier | Real-life skill | Literacy focus | ${K1.plural} / ${K2.plural.toLowerCase()} | ★ Level Up | Badge | Status |`);
    q('|---|---|---|---|---|---|---|---|');
    for (const s of allV.filter((x) => x.zone === z.id)) {
      q(`| **${s.title}** | ${tierV[s.tier]} | ${s.realLife} | ${s.literacy} | ${s.vc.core.map(item).join('<br>')} | ${s.vc.extend.map(item).join('<br>')} | ${s.badge.name} | ${s.ready ? '✅ built' : 'planned'} |`);
    }
    q();
  }
  q(`## Coverage by ${P.part.toLowerCase()}`);
  q();
  q(`| ${P.part} | ${K1.plural} linked | ${K2.plural} linked |`);
  q('|---|---|---|');
  const used = new Set(allV.flatMap((s) => [...s.vc.core, ...s.vc.extend]));
  for (const o of v.curriculum.outcomes) {
    const es = v.curriculum.entries.filter((e) => e.focus === o.id);
    const frac = (k) => { const x = es.filter((e) => e.kind === k); return `${x.filter((e) => used.has(e.id)).length}/${x.length}`; };
    q(`| Unit ${o.unit}, ${P.part} ${o.outcome}: ${o.title} | ${frac(K1.kind)} | ${frac(K2.kind)} |`);
  }
  q();
  q(`Source: ${v.curriculum.source} Retrieved ${v.curriculum.retrieved} from ${v.curriculum.url}.`);
  q();
  const out = `COURSE-MAP-${program.toUpperCase()}.md`;
  writeFileSync(path.join(ROOT_DIR, 'docs', out), V.join('\n'));
  console.log(`wrote docs/${out}`);
}
