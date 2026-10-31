import express from 'express';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { db, getSetting, setSetting } from './src/db.js';
import { html, icon, ROOT_DIR } from './src/html.js';
import { sessionMiddleware, requireRole, checkPassword, hashPassword, createSession, destroySession, setCookie } from './src/auth.js';
import { getSkill, progressFor, doneSet, skillState, syncBadges, newlyUnlocked, allBadges, STEPS, content, withLevel, audioFor } from './src/content.js';
import { LEVEL_IDS, normalizeLevel } from './src/levels.js';
import { PROGRAM_IDS, PROGRAMS, normalizeProgram, familyOf } from './src/programs.js';
import { mapPage, skillPage, badgesPage, myCurriculumPage, readiness, explainer } from './src/views/student.js';
import { dashboardPage, studentDetailPage, skillsIndexPage, teacherGuidePage, curriculumMapPage, whereContent, wherePage } from './src/views/teacher.js';
import { adminPage, loginPage, passwordPage } from './src/views/admin.js';
import { workbookPage } from './src/views/workbook.js';
import { head, asset } from './src/views/layout.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(ROOT_DIR, 'public'), { maxAge: '1h' }));
// Fonts come from npm packages and are served locally (fast, offline-friendly, no layout shift).
app.use('/fonts/lexend', express.static(path.join(ROOT_DIR, 'node_modules/@fontsource-variable/lexend/files'), { maxAge: '30d', immutable: true }));
app.use('/fonts/bricolage', express.static(path.join(ROOT_DIR, 'node_modules/@fontsource-variable/bricolage-grotesque/files'), { maxAge: '30d', immutable: true }));
app.use(sessionMiddleware);

const send = (res, view) => res.type('html').send(String(view));
const passPct = () => Number(getSetting('quiz_pass_percent') || 60);
// Students always get their own reading level; staff can preview any level with ?level=.
const levelOf = (req) => (req.user.role === 'student' ? req.user.reading_level : LEVEL_IDS.includes(req.query.level) ? req.query.level : 'core');
// Staff pages pick a program with ?program= (default: Victorian Curriculum F–10).
const programOf = (req) => (req.user.role === 'student' ? req.user.program : PROGRAM_IDS.includes(req.query.program) ? req.query.program : 'f10');
const baseUrl = (req) => process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

// ---------- Auth ----------
app.get('/', (req, res) => {
  if (!req.user) return res.redirect('/login');
  res.redirect(req.user.role === 'student' ? '/map' : '/teacher');
});

app.get('/login', (req, res) => send(res, loginPage(req, { next: req.query.next })));
app.post('/login', (req, res) => {
  const { username = '', password = '', next = '' } = req.body;
  const u = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
  if (!u || !checkPassword(password, u.password_hash)) {
    return send(res.status(401), loginPage(req, { error: 'That username or password didn’t work. Try again.', next }));
  }
  const { token } = createSession(u.id);
  setCookie(res, 'lu_session', token, 14 * 86400);
  res.redirect(next && next.startsWith('/') && !next.startsWith('//') ? next : '/');
});
app.post('/logout', (req, res) => {
  destroySession(req.cookies.lu_session);
  setCookie(res, 'lu_session', '', 0);
  res.redirect('/login');
});

app.get('/account/password', requireRole(), (req, res) => send(res, passwordPage(req, {})));
app.post('/account/password', requireRole(), (req, res) => {
  const { password = '', confirm = '' } = req.body;
  if (password.length < 6) return send(res, passwordPage(req, { error: 'Make it at least 6 characters.' }));
  if (password !== confirm) return send(res, passwordPage(req, { error: 'Those two don’t match.' }));
  db.prepare('UPDATE users SET password_hash = ?, must_change_pw = 0 WHERE id = ?').run(hashPassword(password), req.user.id);
  res.flash('ok', 'Password saved.');
  res.redirect('/');
});

// ---------- Student ----------
const student = requireRole('student', 'teacher', 'admin');

app.get('/map', student, (req, res) => {
  const progress = progressFor(req.user.id);
  const unseen = db.prepare('SELECT badge_id FROM badges WHERE user_id = ? AND seen = 0').all(req.user.id).map((r) => r.badge_id);
  const badgeDefs = Object.fromEntries(allBadges(req.user.program).map((b) => [b.id, b]));
  req.badgeCount = db.prepare('SELECT COUNT(*) n FROM badges WHERE user_id = ?').get(req.user.id).n;
  const unlocked = (req.cookies.lu_unlocked || '').split(',').filter(Boolean).map(getSkill).filter(Boolean);
  if (unlocked.length) setCookie(res, 'lu_unlocked', '', 0);
  send(res, mapPage(req, { progress, newBadges: unseen.map((id) => badgeDefs[id]).filter(Boolean), unlocked }));
});

function loadSkill(req, res) {
  const skill = getSkill(req.params.id);
  // Students only see skills from the program they're enrolled in.
  if (!skill || (req.user.role === 'student' && skill.program !== req.user.program)) { res.status(404).send('Skill not found'); return null; }
  return skill;
}

function canWork(skill, progress) {
  return ['open', 'started', 'submitted', 'complete'].includes(skillState(skill, progress));
}

app.get('/skill/:id', student, (req, res) => {
  let skill = loadSkill(req, res); if (!skill) return;
  skill = withLevel(skill, levelOf(req));
  const progress = progressFor(req.user.id);
  const p = progress[skill.id];
  let step = STEPS.some((s) => s.id === req.query.step) ? req.query.step : null;
  if (!step) step = STEPS.find((s) => !(p?.steps || []).includes(s.id))?.id || 'show';
  send(res, skillPage(req, { skill, progress, step, passPct: passPct() }));
});

app.post('/skill/:id/start', student, (req, res) => {
  const skill = loadSkill(req, res); if (!skill) return;
  if (!canWork(skill, progressFor(req.user.id))) return res.redirect(`/skill/${skill.id}`);
  db.prepare('INSERT OR IGNORE INTO progress (user_id, skill_id) VALUES (?, ?)').run(req.user.id, skill.id);
  res.redirect(`/skill/${skill.id}?step=brief`);
});

app.post('/skill/:id/step', student, (req, res) => {
  const skill = loadSkill(req, res); if (!skill) return;
  const p = progressFor(req.user.id)[skill.id];
  const step = req.body.step;
  if (!p || !STEPS.some((s) => s.id === step)) return res.redirect(`/skill/${skill.id}`);
  const steps = [...new Set([...p.steps, step])];
  db.prepare('UPDATE progress SET steps = ? WHERE user_id = ? AND skill_id = ?').run(JSON.stringify(steps), req.user.id, skill.id);
  const idx = STEPS.findIndex((s) => s.id === step);
  res.redirect(`/skill/${skill.id}?step=${STEPS[Math.min(idx + 1, STEPS.length - 1)].id}`);
});

app.post('/skill/:id/quiz', student, (req, res) => {
  let skill = loadSkill(req, res); if (!skill?.course) return;
  skill = withLevel(skill, levelOf(req));
  const progress = progressFor(req.user.id);
  const p = progress[skill.id];
  if (!p) return res.redirect(`/skill/${skill.id}`);
  const qs = skill.course.quiz.questions;
  const result = qs.map((q, i) => { const chosen = Number(req.body[`q${i}`]); return { chosen, correct: chosen === q.answer }; });
  const score = result.filter((r) => r.correct).length;
  const passed = (score / qs.length) * 100 >= passPct();
  const best = Math.max(score, p.quiz_best ?? 0);
  const steps = passed ? [...new Set([...p.steps, 'check'])] : p.steps;
  db.prepare('UPDATE progress SET quiz_best = ?, quiz_total = ?, steps = ? WHERE user_id = ? AND skill_id = ?')
    .run(best, qs.length, JSON.stringify(steps), req.user.id, skill.id);
  req.flash = passed
    ? { type: 'ok', text: `${score}/${qs.length} — nice! Quick check ticked off.` }
    : { type: 'error', text: `${score}/${qs.length}. Have a look at the green answers and try again.` };
  send(res, skillPage(req, { skill, progress: progressFor(req.user.id), step: 'check', quizResult: result, passPct: passPct() }));
});

function complete(userId, skillId, { teacherId = null, comment = null, levelUp } = {}) {
  db.prepare(`UPDATE progress SET status = 'complete', completed_at = datetime('now'), signed_off_by = ?,
    teacher_comment = COALESCE(?, teacher_comment), level_up = COALESCE(?, level_up) WHERE user_id = ? AND skill_id = ?`)
    .run(teacherId, comment || null, levelUp ?? null, userId, skillId);
  const fresh = syncBadges(userId);
  const unlocked = newlyUnlocked(doneSet(progressFor(userId)), skillId);
  return { fresh, unlocked };
}

app.post('/skill/:id/submit', student, (req, res) => {
  const skill = loadSkill(req, res); if (!skill) return;
  const p = progressFor(req.user.id)[skill.id];
  if (!p || p.status !== 'started') return res.redirect(`/skill/${skill.id}?step=show`);
  if (readiness(skill, p, passPct()).missing.length) return res.redirect(`/skill/${skill.id}?step=show`);
  const levelUp = req.body.level_up ? 1 : 0;
  db.prepare(`UPDATE progress SET status = 'submitted', submitted_at = datetime('now'), reflection = ?, level_up = ?,
    steps = ? WHERE user_id = ? AND skill_id = ?`)
    .run(String(req.body.reflection || '').slice(0, 2000), levelUp, JSON.stringify([...new Set([...p.steps, 'show'])]), req.user.id, skill.id);
  if (getSetting('require_signoff') !== '1') {
    const { unlocked } = complete(req.user.id, skill.id, { levelUp });
    if (unlocked.length) setCookie(res, 'lu_unlocked', unlocked.map((s) => s.id).join(','), 300);
    res.flash('ok', `Skill complete: ${skill.title}!`);
    return res.redirect('/map');
  }
  res.flash('ok', 'Sent to your teacher. Pick another skill while you wait!');
  res.redirect(`/skill/${skill.id}?step=show`);
});

app.get('/badges', student, (req, res) => {
  const rows = db.prepare('SELECT * FROM badges WHERE user_id = ?').all(req.user.id);
  const earned = new Map(rows.map((r) => [r.badge_id, r]));
  send(res, badgesPage(req, { earned }));
  db.prepare('UPDATE badges SET seen = 1 WHERE user_id = ?').run(req.user.id);
});

app.get('/my-curriculum', student, (req, res) => send(res, myCurriculumPage(req, { progress: progressFor(req.user.id), level: levelOf(req), program: programOf(req) })));

// ---------- Workbooks (any logged-in user) ----------
app.get('/workbook/:id', requireRole(), async (req, res) => {
  const skill = loadSkill(req, res); if (!skill) return;
  if (!skill.course) return res.status(404).send('This workbook hasn’t been written yet.');
  const answers = req.query.answers === '1' && req.user.role !== 'student';
  // Staff can print for one student (?student=ID) or for a level (?level=).
  let level = levelOf(req);
  if (req.user.role !== 'student' && req.query.student && canSee(req.user, req.query.student)) {
    level = db.prepare('SELECT reading_level FROM users WHERE id = ?').get(Number(req.query.student))?.reading_level || level;
  }
  send(res, await workbookPage(req, withLevel(skill, level), { answers, baseUrl: baseUrl(req) }));
});

// ---------- Teacher ----------
const teacher = requireRole('teacher', 'admin');

function teacherClasses(user) {
  return user.role === 'admin'
    ? db.prepare('SELECT * FROM classes ORDER BY name').all()
    : db.prepare('SELECT c.* FROM classes c JOIN class_teachers t ON t.class_id = c.id WHERE t.user_id = ? ORDER BY c.name').all(user.id);
}

function studentsFor(user, classId, program = null) {
  const classes = teacherClasses(user);
  const ids = classId ? classes.filter((c) => String(c.id) === String(classId)).map((c) => c.id) : classes.map((c) => c.id);
  let rows;
  if (user.role === 'admin' && !classId) rows = db.prepare("SELECT * FROM users WHERE role = 'student' ORDER BY name").all();
  else if (!ids.length) rows = [];
  else rows = db.prepare(`SELECT * FROM users WHERE role = 'student' AND class_id IN (${ids.map(() => '?').join(',')}) ORDER BY name`).all(...ids);
  return program ? rows.filter((s) => s.program === program) : rows;
}

function canSee(user, studentId) {
  return studentsFor(user).some((s) => s.id === Number(studentId));
}

app.get('/teacher', teacher, (req, res) => {
  const classes = teacherClasses(req.user);
  const program = programOf(req);
  const students = studentsFor(req.user, req.query.class, program);
  const ids = students.map((s) => s.id);
  const progressByUser = Object.fromEntries(ids.map((id) => [id, progressFor(id)]));
  const queue = ids.length ? db.prepare(`SELECT p.*, u.name, u.program FROM progress p JOIN users u ON u.id = p.user_id
    WHERE p.status = 'submitted' AND p.user_id IN (${ids.map(() => '?').join(',')}) ORDER BY p.submitted_at`).all(...ids) : [];
  const weekCount = ids.length ? db.prepare(`SELECT COUNT(*) n FROM progress WHERE status = 'complete' AND completed_at > datetime('now', '-7 days')
    AND user_id IN (${ids.map(() => '?').join(',')})`).get(...ids).n : 0;
  const counts = Object.fromEntries(PROGRAM_IDS.map((p) => [p, studentsFor(req.user, req.query.class, p).length]));
  send(res, dashboardPage(req, { students, queue, classes, classId: req.query.class, progressByUser, weekCount, program, counts }));
});

app.post('/teacher/signoff', teacher, (req, res) => {
  const { user_id, skill_id, action, comment = '', paper } = req.body;
  const skill = getSkill(skill_id);
  if (!skill || !canSee(req.user, user_id)) return res.status(403).send('Not allowed');
  const levelUp = req.body.level_up ? 1 : 0;
  if (action === 'approve') {
    if (paper) db.prepare('INSERT OR IGNORE INTO progress (user_id, skill_id, steps) VALUES (?, ?, ?)').run(Number(user_id), skill_id, JSON.stringify(STEPS.map((s) => s.id)));
    complete(Number(user_id), skill_id, { teacherId: req.user.id, comment, levelUp: paper ? null : levelUp });
    res.flash('ok', `Signed off ${skill.title}.`);
  } else {
    db.prepare(`UPDATE progress SET status = 'started', teacher_comment = ? WHERE user_id = ? AND skill_id = ?`)
      .run(comment || 'Have another look and send it back in.', Number(user_id), skill_id);
    res.flash('ok', 'Sent back with your comment.');
  }
  res.redirect(req.get('referer') || '/teacher');
});

app.post('/teacher/reopen', teacher, (req, res) => {
  const { user_id, skill_id } = req.body;
  if (!canSee(req.user, user_id)) return res.status(403).send('Not allowed');
  db.prepare(`UPDATE progress SET status = 'started', completed_at = NULL WHERE user_id = ? AND skill_id = ?`).run(Number(user_id), skill_id);
  db.prepare('DELETE FROM badges WHERE user_id = ?').run(Number(user_id));
  syncBadges(Number(user_id));
  res.redirect(req.get('referer') || '/teacher');
});

app.get('/teacher/student/:id', teacher, (req, res) => {
  if (!canSee(req.user, req.params.id)) return res.status(403).send('Not allowed');
  const s = db.prepare('SELECT u.*, c.name class_name FROM users u LEFT JOIN classes c ON c.id = u.class_id WHERE u.id = ?').get(Number(req.params.id));
  const badges = db.prepare('SELECT * FROM badges WHERE user_id = ?').all(s.id);
  send(res, studentDetailPage(req, { student: s, progress: progressFor(s.id), badges }));
});

app.get('/teacher/skills', teacher, (req, res) => send(res, skillsIndexPage(req, programOf(req))));
app.get('/teacher/curriculum', teacher, (req, res) => send(res, curriculumMapPage(req, programOf(req))));
// Where one curriculum point is taught and assessed. The curriculum map loads it into a pop-up.
app.get('/teacher/where', teacher, (req, res) => {
  const c = content(programOf(req));
  const id = String(req.query.id || '');
  if (req.get('X-Fragment')) return send(res, whereContent(c, id));
  send(res, wherePage(req, c, id));
});
app.get('/teacher/skill/:id', teacher, (req, res) => {
  const skill = loadSkill(req, res); if (!skill) return;
  if (!skill.course) return res.redirect('/teacher/skills');
  send(res, teacherGuidePage(req, skill));
});
app.get('/teacher/skill/:id/explainer', requireRole(), (req, res) => {
  const skill = loadSkill(req, res); if (!skill?.course) return;
  const z = skill.zoneObj;
  send(res, html`${head(skill.title, ['/css/shared.css', '/css/app.css'])}<body class="board prog-${skill.program} fam-${familyOf(skill.program)}" style="--zone:${z.color};--zone-ink:${z.ink}" data-voice="${getSetting('voice_gender') || 'any'}">
    <main class="board-main">${explainer(withLevel(skill, levelOf(req)).course.explainer, audioFor(skill.id))}</main><script src="${asset('/js/app.js')}" defer></script></body></html>`);
});

// ---------- Admin ----------
const admin = requireRole('admin');

app.get('/admin', admin, (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY role, name').all();
  const classes = db.prepare('SELECT c.*, (SELECT COUNT(*) FROM users u WHERE u.class_id = c.id) students FROM classes c ORDER BY name').all()
    .map((c) => ({ ...c, teacherIds: db.prepare('SELECT user_id FROM class_teachers WHERE class_id = ?').all(c.id).map((r) => r.user_id) }));
  const settings = { require_signoff: getSetting('require_signoff'), quiz_pass_percent: getSetting('quiz_pass_percent'), skip_unwritten: getSetting('skip_unwritten'), voice_gender: getSetting('voice_gender') || 'any' };
  send(res, adminPage(req, { users, classes, settings, roleFilter: req.query.role }));
});

function addUser({ name, username, password, role = 'student', class_id = null, reading_level = 'core', program = 'f10' }) {
  db.prepare('INSERT INTO users (name, username, password_hash, role, class_id, must_change_pw, reading_level, program) VALUES (?, ?, ?, ?, ?, 1, ?, ?)')
    .run(name.trim(), username.trim().toLowerCase(), hashPassword(password), role, class_id || null, reading_level, program);
}

app.post('/admin/users', admin, (req, res) => {
  const { name, username, password, role, class_id } = req.body;
  if (!['student', 'teacher', 'admin'].includes(role)) return res.status(400).send('Bad role');
  const reading_level = normalizeLevel(req.body.reading_level) || 'core';
  const program = normalizeProgram(req.body.program) || 'f10';
  try { addUser({ name, username, password, role, class_id: class_id ? Number(class_id) : null, reading_level, program }); res.flash('ok', `Added ${name}.`); }
  catch { res.flash('error', `Username “${username}” is already taken.`); }
  res.redirect('/admin');
});

app.post('/admin/bulk', admin, (req, res) => {
  let added = 0; const problems = [];
  for (const line of String(req.body.csv || '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [name, username, password, className, levelText, programText] = line.split(',').map((x) => (x || '').trim());
    const reading_level = normalizeLevel(levelText);
    const program = normalizeProgram(programText);
    if (!name || !username || !password || !reading_level || !program) { problems.push(line); continue; }
    let classId = null;
    if (className) {
      db.prepare('INSERT OR IGNORE INTO classes (name) VALUES (?)').run(className);
      classId = db.prepare('SELECT id FROM classes WHERE name = ?').get(className).id;
    }
    try { addUser({ name, username, password, class_id: classId, reading_level, program }); added++; } catch { problems.push(line); }
  }
  res.flash(problems.length ? 'error' : 'ok', `Added ${added} student${added === 1 ? '' : 's'}.${problems.length ? ` Skipped ${problems.length} line(s): ${problems.map((l) => `“${l}”`).join(', ')} (missing info, unknown reading level or program, or username taken).` : ''}`);
  res.redirect('/admin');
});

app.post('/admin/classes', admin, (req, res) => {
  try { db.prepare('INSERT INTO classes (name) VALUES (?)').run(String(req.body.name).trim()); } catch { res.flash('error', 'That class already exists.'); }
  res.redirect('/admin');
});

app.post('/admin/classes/:id/teachers', admin, (req, res) => {
  const ids = [].concat(req.body.user_id || []).map(Number);
  db.prepare('DELETE FROM class_teachers WHERE class_id = ?').run(Number(req.params.id));
  for (const id of ids) db.prepare('INSERT INTO class_teachers (class_id, user_id) VALUES (?, ?)').run(Number(req.params.id), id);
  res.flash('ok', 'Teachers saved.');
  res.redirect('/admin');
});

app.post('/admin/users/:id/class', admin, (req, res) => {
  db.prepare('UPDATE users SET class_id = ? WHERE id = ?').run(req.body.class_id ? Number(req.body.class_id) : null, Number(req.params.id));
  res.redirect(req.get('referer') || '/admin');
});

app.post('/admin/users/:id/program', admin, (req, res) => {
  const program = normalizeProgram(req.body.program);
  if (program) db.prepare('UPDATE users SET program = ? WHERE id = ?').run(program, Number(req.params.id));
  res.redirect(req.get('referer') || '/admin');
});

app.post('/admin/users/:id/level', admin, (req, res) => {
  const level = normalizeLevel(req.body.reading_level);
  if (level) db.prepare('UPDATE users SET reading_level = ? WHERE id = ?').run(level, Number(req.params.id));
  res.redirect(req.get('referer') || '/admin');
});

app.post('/admin/users/:id/password', admin, (req, res) => {
  db.prepare('UPDATE users SET password_hash = ?, must_change_pw = 1 WHERE id = ?').run(hashPassword(req.body.password), Number(req.params.id));
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(Number(req.params.id));
  res.flash('ok', 'Password reset. They’ll choose a new one when they log in.');
  res.redirect('/admin');
});

app.post('/admin/users/:id/delete', admin, (req, res) => {
  if (Number(req.params.id) !== req.user.id) db.prepare('DELETE FROM users WHERE id = ?').run(Number(req.params.id));
  res.redirect('/admin');
});

app.post('/admin/settings', admin, (req, res) => {
  setSetting('require_signoff', req.body.require_signoff ? '1' : '0');
  setSetting('skip_unwritten', req.body.skip_unwritten ? '1' : '0');
  if (['any', 'female', 'male'].includes(req.body.voice_gender)) setSetting('voice_gender', req.body.voice_gender);
  setSetting('quiz_pass_percent', Math.max(0, Math.min(100, Number(req.body.quiz_pass_percent) || 60)));
  res.flash('ok', 'Settings saved.');
  res.redirect('/admin');
});

app.use((req, res) => res.status(404).type('html').send(`<p style="font-family:sans-serif;padding:2rem">Page not found. <a href="/">Go home</a></p>`));

// First run: make sure there's an admin.
if (!db.prepare("SELECT 1 FROM users WHERE role = 'admin'").get()) {
  addUser({ name: 'Admin', username: 'admin', password: process.env.ADMIN_PASSWORD || 'changeme', role: 'admin' });
  console.log('Created admin account: admin / ' + (process.env.ADMIN_PASSWORD ? '(ADMIN_PASSWORD)' : 'changeme'));
}
PROGRAM_IDS.forEach((p) => content(p)); // fail fast on bad content

const port = Number(process.env.PORT || 3000);
const { version } = JSON.parse(readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
app.listen(port, (err) => {
  if (err?.code === 'EADDRINUSE') {
    console.error(`\nCan't start: port ${port} is already in use. Another copy of Level Up (maybe an older version)`);
    console.error('is probably still running in another PowerShell/Terminal window. Press Ctrl + C in that window');
    console.error(`(or close it), then run "npm start" here again. Or use a different port: $env:PORT=${port + 1}; npm start\n`);
    process.exit(1);
  }
  if (err) { console.error(err); process.exit(1); }
  console.log(`Level Up v${version} running on http://localhost:${port}  (programs: ${PROGRAM_IDS.map((p) => PROGRAMS[p].short).join(', ')})`);
  console.log('Leave this window open while you use the app. Press Ctrl + C to stop it.');
});
