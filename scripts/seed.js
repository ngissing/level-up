// Demo data: one teacher, an F–10 class with four students and a VCE VM Literacy class with two.
// Usage: npm run seed   (safe to re-run; skips existing usernames)
import { db } from '../src/db.js';
import { hashPassword } from '../src/auth.js';
import { syncBadges, STEPS } from '../src/content.js';

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

console.log(`Seeded. Logins:
  admin   / changeme   (admin)
  teacher / teacher123 (teacher of "10 Literacy", "11 VM Literacy", "12 VM Literacy" and "VPC Literacy")
  kai, mia, jay, tia / student123 (students)
  Reading levels: kai = Foundation, mia & tia = Core, jay = Extended
  zara, ben / student123 (VM Literacy Units 1 & 2, class "11 VM Literacy"; zara = Foundation, ben = Core)
  ella / student123 (VM Literacy Units 3 & 4, class "12 VM Literacy"; Core)
  noah, lia / student123 (VPC Literacy, class "VPC Literacy"; noah = Foundation, lia = Core)`);
