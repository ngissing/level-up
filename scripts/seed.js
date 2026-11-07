// Demo data: one teacher, demo classes for every program, and students at different stages.
// Usage: npm run seed   (safe to re-run; skips existing usernames)
import { db } from '../src/db.js';
import { hashPassword } from '../src/auth.js';
import { syncBadges, STEPS, content, courseFor, getSkill } from '../src/content.js';

const add = (name, username, password, role, classId = null) => {
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) return db.prepare('SELECT id FROM users WHERE username = ?').get(username).id;
  return Number(db.prepare('INSERT INTO users (name, username, password_hash, role, class_id) VALUES (?, ?, ?, ?, ?)')
    .run(name, username, hashPassword(password), role, classId).lastInsertRowid);
};

if (!db.prepare("SELECT 1 FROM users WHERE role = 'admin'").get()) add('Admin', 'admin', 'changeme', 'admin');
db.prepare('INSERT OR IGNORE INTO classes (name) VALUES (?)').run('10 Literacy');
const classId = db.prepare('SELECT id FROM classes WHERE name = ?').get('10 Literacy').id;
const t = add('Sam Teacher', 'teacher', 'teacher123', 'teacher');
db.prepare('INSERT OR IGNORE INTO class_teachers (class_id, user_id) VALUES (?, ?)').run(classId, t);

const all = JSON.stringify(STEPS.map((s) => s.id));
const kai = add('Kai Roberts', 'kai', 'student123', 'student', classId);
add('Mia Tran', 'mia', 'student123', 'student', classId);
const jay = add('Jay Wilson', 'jay', 'student123', 'student', classId);
const tia = add('Tia Morgan', 'tia', 'student123', 'student', classId);

// Reading levels (admins can change these under Accounts).
const setLevel = db.prepare('UPDATE users SET reading_level = ? WHERE id = ?');
setLevel.run('support', kai); setLevel.run('extend', jay);

const prog = db.prepare(`INSERT OR IGNORE INTO progress (user_id, skill_id, status, steps, quiz_best, quiz_total, reflection, level_up, submitted_at, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
// Kai: started Spot the Scam (3 steps in)
prog.run(kai, 'spot-the-scam', 'started', JSON.stringify(['brief', 'watch', 'read']), null, null, null, 0, null, null);
// Jay: submitted, waiting for sign-off
prog.run(jay, 'spot-the-scam', 'submitted', all, 4, 5, 'I learned that scammers try to rush you. I told my nan about the Hi Mum one.', 1, new Date().toISOString(), null);
// Tia: completed (gets badges)
prog.run(tia, 'spot-the-scam', 'complete', all, 5, 5, 'Two red flags = big warning.', 1, null, new Date().toISOString());
syncBadges(tia);

// VCE VM Literacy Units 1 & 2 class
db.prepare('INSERT OR IGNORE INTO classes (name) VALUES (?)').run('11 VM Literacy');
const vmClass = db.prepare('SELECT id FROM classes WHERE name = ?').get('11 VM Literacy').id;
db.prepare('INSERT OR IGNORE INTO class_teachers (class_id, user_id) VALUES (?, ?)').run(vmClass, t);
const zara = add('Zara Ahmed', 'zara', 'student123', 'student', vmClass);
const ben = add('Ben Kelly', 'ben', 'student123', 'student', vmClass);
db.prepare("UPDATE users SET program = 'vm12' WHERE id IN (?, ?)").run(zara, ben);
setLevel.run('support', zara);
prog.run(ben, 'vm-first-payslip', 'started', JSON.stringify(['brief', 'watch']), null, null, null, 0, null, null);

// VCE VM Literacy Units 3 & 4 class
db.prepare('INSERT OR IGNORE INTO classes (name) VALUES (?)').run('12 VM Literacy');
const vm34Class = db.prepare('SELECT id FROM classes WHERE name = ?').get('12 VM Literacy').id;
db.prepare('INSERT OR IGNORE INTO class_teachers (class_id, user_id) VALUES (?, ?)').run(vm34Class, t);
const ella = add('Ella Nguyen', 'ella', 'student123', 'student', vm34Class);
db.prepare("UPDATE users SET program = 'vm34' WHERE id = ?").run(ella);

// VPC Literacy class (levels aim at Years 5, 7 and 9)
db.prepare('INSERT OR IGNORE INTO classes (name) VALUES (?)').run('VPC Literacy');
const vpcClass = db.prepare('SELECT id FROM classes WHERE name = ?').get('VPC Literacy').id;
db.prepare('INSERT OR IGNORE INTO class_teachers (class_id, user_id) VALUES (?, ?)').run(vpcClass, t);
const noah = add('Noah Taylor', 'noah', 'student123', 'student', vpcClass);
const lia = add('Lia Fonoti', 'lia', 'student123', 'student', vpcClass);
db.prepare("UPDATE users SET program = 'vpc' WHERE id IN (?, ?)").run(noah, lia);
setLevel.run('support', noah);

// One student per program who has finished every course in the starting zone (Base Camp, Induction,
// Site Induction, The Workshop), so the next zones are open to explore. Re-running seed adds any
// starting-zone courses written since.
const finishedBase = [
  ['Ruby Walsh', 'ruby', 'f10', '10 Literacy'],
  ['Liam Brooks', 'liam', 'vm12', '11 VM Literacy'],
  ['Amira Hassan', 'amira', 'vm34', '12 VM Literacy'],
  ['Cooper Reid', 'cooper', 'vpc', 'VPC Literacy'],
];
for (const [name, username, program, className] of finishedBase) {
  const cls = db.prepare('SELECT id FROM classes WHERE name = ?').get(className).id;
  const id = add(name, username, 'student123', 'student', cls);
  db.prepare('UPDATE users SET program = ? WHERE id = ?').run(program, id);
  const c = content(program);
  const done = Object.values(c.skills).filter((s) => s.zone === c.baseZone && s.ready);
  done.forEach((s, i) => {
    const n = courseFor(s, 'core').quiz.questions.length;
    const day = new Date(Date.now() - (done.length - i) * 86400000).toISOString();
    prog.run(id, s.id, 'complete', all, n, n, `Finished ${s.title}. The workbook helped me most.`, 0, day, day);
  });
  syncBadges(id);
}

// ---------- Sample class: 14 students at very different stages ----------
// For trying the teacher dashboard, sign-off queue and student pages with realistic data.
// Every student only has progress on skills they could really have unlocked.
db.prepare('INSERT OR IGNORE INTO classes (name) VALUES (?)').run('10B Literacy (sample)');
const sampleClass = db.prepare('SELECT id FROM classes WHERE name = ?').get('10B Literacy (sample)').id;
db.prepare('INSERT OR IGNORE INTO class_teachers (class_id, user_id) VALUES (?, ?)').run(sampleClass, t);
const ago = (days, hours = 0) => new Date(Date.now() - (days * 24 + hours) * 3600e3).toISOString().slice(0, 19).replace('T', ' ');
const record = db.prepare(`INSERT OR IGNORE INTO progress (user_id, skill_id, status, steps, quiz_best, quiz_total, reflection,
  level_up, teacher_comment, signed_off_by, started_at, submitted_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const stepIds = STEPS.map((x) => x.id);
const quizTotal = (skillId, level) => courseFor(getSkill(skillId), level).quiz.questions.length;
// done: signed off. waiting: sent in, waiting for sign-off. doing: partway (n steps; quiz = best score so far).
// sentBack: sent in, then returned by the teacher with a comment.
const sample = {
  done: (u, skill, days, { levelUp = 0, comment = null, missed = 0, note = 'I can use this outside school.' } = {}) => {
    const n = quizTotal(skill, u.level);
    record.run(u.id, skill, 'complete', JSON.stringify(stepIds), n - missed, n, note, levelUp, comment, t, ago(days + 4), ago(days + 1), ago(days));
  },
  waiting: (u, skill, days, note) => {
    const n = quizTotal(skill, u.level);
    record.run(u.id, skill, 'submitted', JSON.stringify(stepIds), n - 1, n, note, 0, null, null, ago(days + 3), ago(days), null);
  },
  doing: (u, skill, n, days, quiz = null) => {
    const steps = stepIds.slice(0, n).filter((x) => quiz === null || x !== 'check');
    record.run(u.id, skill, 'started', JSON.stringify(steps), quiz, quiz === null ? null : quizTotal(skill, u.level), null, 0, null, null, ago(days), null, null);
  },
  sentBack: (u, skill, days, note, comment) => {
    const n = quizTotal(skill, u.level);
    record.run(u.id, skill, 'started', JSON.stringify(stepIds), n, n, note, 0, comment, null, ago(days + 5), ago(days + 1), null);
  },
};
const students = [
  // [name, username, reading level, last seen (days ago, null = never), what they've done]
  ['Ava Nguyen', 'ava', 'extend', 0, (u) => { // racing ahead
    sample.done(u, 'spot-the-scam', 20, { levelUp: 1, comment: 'Brilliant warning message — your nan is lucky.' });
    sample.done(u, 'say-it-right', 16, { levelUp: 1 }); sample.done(u, 'find-it-fast', 14);
    sample.done(u, 'phone-plan-showdown', 9, { levelUp: 1, comment: 'Great use of facts to back up your choice.' });
    sample.done(u, 'fact-or-fake', 5);
    sample.waiting(u, 'review-it', 1, 'Writing about a game I actually play made it easy to give reasons.');
  }],
  ['Hamish Clarke', 'hamish', 'core', 2, (u) => { // steady, working on a starter
    sample.done(u, 'spot-the-scam', 18); sample.done(u, 'say-it-right', 15, { missed: 1 }); sample.done(u, 'find-it-fast', 12);
    sample.doing(u, 'safety-first', 3, 2);
  }],
  ['Isla Papadopoulos', 'isla', 'core', 1, (u) => { // waiting on sign-off
    sample.done(u, 'spot-the-scam', 13); sample.done(u, 'say-it-right', 10);
    sample.waiting(u, 'find-it-fast', 2, 'Ctrl + F is my new best friend.');
  }],
  ['Jayden Morris', 'jayden', 'support', 1, (u) => { // stuck on a quick check
    sample.done(u, 'spot-the-scam', 11, { missed: 1, comment: 'Good work. You spotted every red flag.' });
    sample.doing(u, 'say-it-right', 6, 1, 1);
  }],
  ['Khadija Ali', 'khadija', 'core', 0, (u) => { // well ahead, doing Level Up
    sample.done(u, 'spot-the-scam', 25); sample.done(u, 'say-it-right', 22); sample.done(u, 'find-it-fast', 19, { levelUp: 1 });
    sample.done(u, 'phone-plan-showdown', 12); sample.done(u, 'safety-first', 6, { levelUp: 1, comment: 'Your procedure for the fryer at work is spot on.' });
    sample.doing(u, 'fact-or-fake', 2, 0);
  }],
  ['Lachlan Brown', 'lachlan', 'core', null, () => {}], // never logged in
  ['Maya Singh', 'maya', 'support', 0, (u) => { // slow and steady
    sample.done(u, 'spot-the-scam', 9); sample.done(u, 'say-it-right', 4, { missed: 1 });
    sample.doing(u, 'find-it-fast', 2, 0);
  }],
  ['Nikau Tipene', 'nikau', 'core', 3, (u) => { // work sent back
    sample.sentBack(u, 'spot-the-scam', 3, 'Scams are bad, don’t click links.',
      'Good start! Your warning needs to say what to do. Add the Stop. Check. Protect. steps and send it back.');
  }],
  ['Olivia Chen', 'olivia', 'extend', 1, (u) => { // ahead, one waiting
    sample.done(u, 'spot-the-scam', 21); sample.done(u, 'say-it-right', 17, { levelUp: 1 }); sample.done(u, 'find-it-fast', 13);
    sample.done(u, 'review-it', 6, { levelUp: 1 });
    sample.waiting(u, 'phone-plan-showdown', 3, 'The cheapest plan each month was not the cheapest over a whole year.');
  }],
  ['Patrick O’Neill', 'patrick', 'core', 23, (u) => { // started then stopped coming
    sample.doing(u, 'spot-the-scam', 1, 23);
  }],
  ['Sienna Rossi', 'sienna', 'core', 1, (u) => { // two done, failed one quiz
    sample.done(u, 'spot-the-scam', 8); sample.done(u, 'find-it-fast', 5);
    sample.doing(u, 'say-it-right', 6, 1, 2);
  }],
  ['Tyler Watson', 'tyler', 'support', 6, (u) => { // one done
    sample.done(u, 'spot-the-scam', 6, { missed: 1 });
  }],
  ['Will Thompson', 'will', 'core', 0, (u) => { // ahead across zones
    sample.done(u, 'spot-the-scam', 16); sample.done(u, 'say-it-right', 13); sample.done(u, 'find-it-fast', 10);
    sample.done(u, 'fact-or-fake', 7); sample.done(u, 'safety-first', 3);
    sample.doing(u, 'phone-plan-showdown', 4, 0);
  }],
  ['Zoe Kowalski', 'zoe', 'core', 5, () => {}], // logged in once, hasn't started
];
for (const [name, username, level, seen, fill] of students) {
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) continue; // already seeded: leave as is
  const id = add(name, username, 'student123', 'student', sampleClass);
  setLevel.run(level, id);
  db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(seen === null ? null : ago(seen, 2), id);
  fill({ id, level });
  syncBadges(id);
}

console.log(`Seeded. Logins:
  admin   / changeme   (admin)
  teacher / teacher123 (teacher of every demo class)
  kai, mia, jay, tia / student123 (students)
  Reading levels: kai = Foundation, mia & tia = Core, jay = Extended
  zara, ben / student123 (VM Literacy Units 1 & 2, class "11 VM Literacy"; zara = Foundation, ben = Core)
  ella / student123 (VM Literacy Units 3 & 4, class "12 VM Literacy"; Core)
  noah, lia / student123 (VPC Literacy, class "VPC Literacy"; noah = Foundation, lia = Core)
  Finished the starting zone (next zones open), all Core, password student123:
    ruby (F–10) · liam (VM 1 & 2) · amira (VM 3 & 4) · cooper (VPC)
  Sample class "10B Literacy (sample)", 14 students at different stages, password student123:
    ava, hamish, isla, jayden, khadija, lachlan, maya, nikau, olivia, patrick, sienna, tyler, will, zoe`);
