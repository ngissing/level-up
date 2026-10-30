// Writes docs/COURSE-MAP.md from content/ so the map document never drifts.
//   npm run map-doc
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR } from '../src/html.js';
import { content, requirements } from '../src/content.js';

const c = content();
const vc = (id) => { const e = c.vc[id]; return `L${e.level} ${e.substrand}`; };
const tierName = { 0: 'Base Camp', 1: 'Starter', 2: 'Level 2', 3: 'Boss', 4: 'Crossroads' };
const L = [];
const p = (s = '') => L.push(s);

p('# Level Up Literacy — course map');
p();
p('_Generated from `content/` by `npm run map-doc`. Edit the JSON, not this file._');
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
p('- **Unlock rules** (in `src/content.js`):');
p('  - Starter skills: finish 2 Base Camp skills.');
p('  - Level-2 skills: finish 1 starter in the same zone.');
p('  - Boss skill: finish 1 level-2 skill in the same zone.');
p('  - Crossroads: finish 2 skills in each of the two named zones.');
p('  - While courses are still being written, a rule never asks for more skills than are actually built, so students are never stuck behind an unwritten course.');
p('- **Badges:** one per skill, an *Explorer* and a *Master* badge per zone, *Base Camp Cleared*, and milestones at 1, 5, 10 and 20 skills.');
p('- **Two levels inside every skill.** Core tasks target about Level 4–6. *Level Up* tasks (marked ★ in workbooks) stretch to Level 7–8. Core VC links count as soon as a skill is signed off; Level Up links count only when the teacher confirms the extension work.');
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
  p('| Skill | Tier | Real-life skill | Literacy focus | VC core | VC Level Up | Unlocks after | Badge | Status |');
  p('|---|---|---|---|---|---|---|---|---|');
  for (const s of all.filter((x) => x.zone === z.id)) {
    const req = requirements(s).filter((r) => r.text !== 'Finish 2 Base Camp skills' || s.tier === 1).map((r) => r.text).join('; ') || '—';
    p(`| **${s.title}** | ${tierName[s.tier]} | ${s.realLife} | ${s.literacy} | ${s.vc.core.map(vc).join('<br>')} | ${s.vc.extend.map(vc).join('<br>')} | ${req} | ${s.badge.name} | ${s.ready ? '✅ built' : 'planned'} |`);
  }
  p();
}

p('## Curriculum coverage (Levels 3–8)');
p();
p('Each cell lists how many skills address that sub-strand at that level (core + Level Up).');
p();
const levels = [3, 4, 5, 6, 7, 8];
p(`| Strand › sub-strand | ${levels.map((l) => `L${l}`).join(' | ')} |`);
p(`|---|${levels.map(() => '---').join('|')}|`);
for (const [key, fa] of Object.entries(c.curriculum.focusAreas)) {
  p(`| ${fa.strand} › ${fa.substrand} | ${levels.map((l) => {
    const id = `L${l}-${key}`;
    if (!c.vc[id]) return '·';
    const n = all.filter((s) => s.vc.core.includes(id) || s.vc.extend.includes(id)).length;
    return n ? String(n) : '0';
  }).join(' | ')} |`);
}
p();
p(`> ⚠️ ${c.curriculum.note}`);
p();
writeFileSync(path.join(ROOT_DIR, 'docs', 'COURSE-MAP.md'), L.join('\n'));
console.log('wrote docs/COURSE-MAP.md');
