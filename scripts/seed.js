// Demo data: one teacher, one class, four students at different points.
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

const prog = db.prepare(`INSERT OR IGNORE INTO progress (user_id, skill_id, status, steps, quiz_best, quiz_total, reflection, level_up, submitted_at, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
// Kai: started Spot the Scam (3 steps in)
prog.run(kai, 'spot-the-scam', 'started', JSON.stringify(['brief', 'watch', 'read']), null, null, null, 0, null, null);
// Jay: submitted, waiting for sign-off
prog.run(jay, 'spot-the-scam', 'submitted', all, 4, 5, 'I learned that scammers try to rush you. I told my nan about the Hi Mum one.', 1, new Date().toISOString(), null);
// Tia: completed (gets badges)
prog.run(tia, 'spot-the-scam', 'complete', all, 5, 5, 'Two red flags = big warning.', 1, null, new Date().toISOString());
syncBadges(tia);

console.log(`Seeded. Logins:
  admin   / changeme   (admin)
  teacher / teacher123 (teacher, class "10 Literacy")
  kai, mia, jay, tia / student123 (students)`);
