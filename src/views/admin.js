import { html, icon, raw } from '../html.js';
import { page } from './layout.js';
import { LEVELS, LEVEL_IDS } from '../levels.js';
import { PROGRAMS, PROGRAM_IDS } from '../programs.js';

export function adminPage(req, { users, classes, settings, roleFilter }) {
  const teachers = users.filter((u) => u.role !== 'student');
  const shown = roleFilter ? users.filter((u) => u.role === roleFilter) : users;
  const levelOpts = (sel, long = true) => LEVEL_IDS.map((l) => html`<option value="${l}" ${sel === l ? raw('selected') : ''}>${LEVELS[l].symbol} ${LEVELS[l].label}${long ? ` — ${LEVELS[l].years}` : ''}</option>`);
  const programOpts = (sel) => PROGRAM_IDS.map((p) => html`<option value="${p}" ${sel === p ? raw('selected') : ''}>${PROGRAMS[p].name}</option>`);
  const classOpts = (sel) => html`<option value="">—</option>${classes.map((c) => html`<option value="${c.id}" ${String(sel) === String(c.id) ? raw('selected') : ''}>${c.name}</option>`)}`;
  const body = html`<section class="page-head"><p class="eyebrow">Admin</p><h1>Accounts & classes</h1>
    <p class="lede">Students can’t sign themselves up — add them here. Give each student a simple password; they’ll be asked to change it the first time they log in.</p>
    <div class="callout-box">${icon('lucide:layers')}<div><strong>Reading levels</strong><p>Each student has a reading level. It changes the wording, the length and the scaffolds of every mini course: the brief, the readings, the quiz, the explainer voice speed and the printed workbook. Students never see their level. ${LEVEL_IDS.map((l) => html`<b>${LEVELS[l].symbol} ${LEVELS[l].label}</b> ${LEVELS[l].years}. `)}</p></div></div></section>

  <nav class="jump" aria-label="On this page">
    <a href="#add">${icon('lucide:user-plus')} Add people</a>
    <a href="#classes">${icon('lucide:school')} Classes</a>
    <a href="#settings">${icon('lucide:settings')} Settings <small>(narrator voice, sign-off, preview mode)</small></a>
    <a href="#people">${icon('lucide:users')} Everyone</a>
  </nav>

  <div class="admin-grid">
    <section class="panel" id="add">
      <h2>${icon('lucide:user-plus')} Add one person</h2>
      <form method="post" action="/admin/users" class="form-grid">
        <label class="field"><span>Full name</span><input name="name" required></label>
        <label class="field"><span>Username</span><input name="username" required pattern="[A-Za-z0-9._-]+" autocomplete="off"></label>
        <label class="field"><span>Starting password</span><input name="password" required minlength="4" autocomplete="off"></label>
        <label class="field"><span>Role</span><select name="role"><option>student</option><option>teacher</option><option>admin</option></select></label>
        <label class="field"><span>Class</span><select name="class_id">${classOpts('')}</select></label>
        <label class="field"><span>Program (students only)</span><select name="program">${programOpts('f10')}</select></label>
        <label class="field"><span>Reading level (students only — they never see it)</span><select name="reading_level">${levelOpts('core')}</select></label>
        <button class="btn btn-ink">${icon('lucide:plus')} Add</button>
      </form>
    </section>

    <section class="panel">
      <h2>${icon('lucide:sheet')} Add a whole class</h2>
      <form method="post" action="/admin/bulk">
        <label class="field"><span>One per line: <code>name, username, password, class, reading level, program</code></span>
          <textarea name="csv" rows="6" placeholder="Jordan Smith, jsmith, tiger42, 10 Literacy, foundation&#10;Ari Nguyen, anguyen, comet77, 11 VM, core, vm"></textarea></label>
        <p class="muted small">Classes that don’t exist yet are created. Everyone added here is a student. Reading level can be <code>foundation</code> (Years 3–4), <code>core</code> (Years 5–6) or <code>extended</code> (Year 7+); leave it blank for core. Program can be <code>vm</code> (VCE VM Literacy) or <code>f10</code> (Victorian Curriculum); leave it blank for F–10.</p>
        <button class="btn btn-ink">${icon('lucide:upload')} Add students</button>
      </form>
    </section>

    <section class="panel" id="classes">
      <h2>${icon('lucide:school')} Classes</h2>
      <form method="post" action="/admin/classes" class="inline-form">
        <input name="name" placeholder="New class name" required><button class="btn btn-ink btn-sm">${icon('lucide:plus')} Create</button>
      </form>
      <ul class="class-list">${classes.map((c) => html`<li>
        <b>${c.name}</b><span class="muted">${c.students} students</span>
        <form method="post" action="/admin/classes/${c.id}/teachers" class="inline-form">
          <select name="user_id" multiple size="2" aria-label="Teachers for ${c.name}">${teachers.map((t) => html`<option value="${t.id}" ${c.teacherIds.includes(t.id) ? raw('selected') : ''}>${t.name}</option>`)}</select>
          <button class="btn btn-sm btn-ghost">Save teachers</button>
        </form>
      </li>`)}</ul>
    </section>

    <section class="panel" id="settings">
      <h2>${icon('lucide:settings')} Settings</h2>
      <form method="post" action="/admin/settings" class="form-grid">
        <label class="check"><input type="checkbox" name="require_signoff" value="1" ${settings.require_signoff === '1' ? raw('checked') : ''}><span>Teacher must sign off a skill before it counts (recommended)</span></label>
        <label class="check"><input type="checkbox" name="skip_unwritten" value="1" ${settings.skip_unwritten === '1' ? raw('checked') : ''}><span><b>Preview mode:</b> skills that aren’t written yet don’t block the way. Use this to look around the map while courses are still being built; turn it off for real classes.</span></label>
        <label class="field"><span>Narrator voice</span><select name="voice_gender">${[['any', 'No preference'], ['male', 'Male'], ['female', 'Female']].map(([v, l]) => html`<option value="${v}" ${settings.voice_gender === v ? raw('selected') : ''}>${l}</option>`)}</select>
          <small class="muted">Used for read-aloud and for explainers that haven’t been recorded. Also the default when you run <code>npm run voices</code> (re-record with <code>npm run voices -- --force</code> after changing it).</small></label>
        <label class="field"><span>Quick check pass mark (%)</span><input type="number" name="quiz_pass_percent" min="0" max="100" value="${settings.quiz_pass_percent}"></label>
        <button class="btn btn-ink">${icon('lucide:save')} Save settings</button>
      </form>
    </section>
  </div>

  <section class="panel" id="people">
    <div class="row"><h2>${icon('lucide:users')} People (${shown.length})</h2>
      <nav class="pills">${[['', 'All'], ['student', 'Students'], ['teacher', 'Teachers'], ['admin', 'Admins']].map(([r, l]) => html`<a href="/admin${r ? '?role=' + r : ''}" class="${(roleFilter || '') === r ? 'on' : ''}">${l}</a>`)}</nav></div>
    <table class="table">
      <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Class</th><th>Program</th><th>Reading level</th><th>Last login</th><th>Reset password</th><th></th></tr></thead>
      <tbody>${shown.map((u) => html`<tr>
        <td>${u.name}</td><td><code>${u.username}</code></td><td>${u.role}</td>
        <td><form method="post" action="/admin/users/${u.id}/class" class="inline-form"><select name="class_id" onchange="this.form.submit()">${classOpts(u.class_id)}</select></form></td>
        <td>${u.role === 'student' ? html`<form method="post" action="/admin/users/${u.id}/program" class="inline-form"><select name="program" onchange="this.form.submit()" aria-label="Program for ${u.name}" class="prog-select prog-select-${u.program}">${programOpts(u.program)}</select></form>` : html`<span class="muted">—</span>`}</td>
        <td>${u.role === 'student' ? html`<form method="post" action="/admin/users/${u.id}/level" class="inline-form"><select name="reading_level" onchange="this.form.submit()" aria-label="Reading level for ${u.name}">${levelOpts(u.reading_level, false)}</select></form>` : html`<span class="muted">—</span>`}</td>
        <td>${u.last_login?.slice(0, 10) || '—'}</td>
        <td><form method="post" action="/admin/users/${u.id}/password" class="inline-form"><input name="password" placeholder="new password" minlength="4" required size="10"><button class="btn btn-sm btn-ghost">Set</button></form></td>
        <td>${u.id !== req.user.id ? html`<form method="post" action="/admin/users/${u.id}/delete" onsubmit="return confirm('Delete ${u.name} and all their progress?')"><button class="btn btn-sm btn-danger" aria-label="Delete ${u.name}">${icon('lucide:trash-2')}</button></form>` : ''}</td>
      </tr>`)}</tbody>
    </table>
  </section>`;
  return page(req, { title: 'Accounts', body, active: '/admin', wide: true });
}

export function loginPage(req, { error, next }) {
  return page(req, {
    title: 'Log in',
    body: html`<section class="login">
      <div class="login-art" aria-hidden="true">
        <span class="la la1">${icon('lucide:message-circle-warning')}</span><span class="la la2">${icon('lucide:wallet')}</span>
        <span class="la la3">${icon('lucide:megaphone')}</span><span class="la la4">${icon('lucide:briefcase-business')}</span>
        <span class="la la5">${icon('lucide:smartphone')}</span><span class="la la6">${icon('lucide:map-pinned')}</span>
        <h1>Skills you’ll <span class="hl">actually use.</span></h1>
        <p>Scams, jobs, money, phones, rights and having your say. Your pace. Your choice.</p>
      </div>
      <form method="post" action="/login" class="login-card">
        <h2>Log in</h2>
        ${error ? html`<p class="form-error">${icon('lucide:circle-alert')} ${error}</p>` : ''}
        <input type="hidden" name="next" value="${next || ''}">
        <label class="field"><span>Username</span><input name="username" autocomplete="username" required autofocus></label>
        <label class="field"><span>Password</span><input name="password" type="password" autocomplete="current-password" required></label>
        <button class="btn btn-zone btn-lg">${icon('lucide:log-in')} Let’s go</button>
        <p class="muted small">No account? Ask your teacher.</p>
        <p class="muted small version">v${process.env.npm_package_version || ''}</p>
      </form>
    </section>`,
  });
}

export function passwordPage(req, { error }) {
  return page(req, {
    title: 'Change password',
    body: html`<section class="login single"><form method="post" action="/account/password" class="login-card">
      <h2>${req.user.must_change_pw ? 'Pick your own password' : 'Change password'}</h2>
      ${req.user.must_change_pw ? html`<p class="muted">You’re using a starting password. Choose a new one you’ll remember.</p>` : ''}
      ${error ? html`<p class="form-error">${icon('lucide:circle-alert')} ${error}</p>` : ''}
      <label class="field"><span>New password (6+ characters)</span><input name="password" type="password" minlength="6" required autocomplete="new-password"></label>
      <label class="field"><span>Type it again</span><input name="confirm" type="password" minlength="6" required autocomplete="new-password"></label>
      <button class="btn btn-zone btn-lg">${icon('lucide:save')} Save</button>
    </form></section>`,
  });
}
