import { html, icon, md, mdInline, raw } from '../html.js';
import { page, sticker, vcChip, empty, initials, levelTag } from './layout.js';
import { LEVELS, LEVEL_IDS } from '../levels.js';
import { content, skillList, skillState, doneSet, coverage, STEPS, courseFor, vcFor } from '../content.js';
import { curriculumGrid } from './student.js';
import { diagram } from './diagrams.js';

const DOT = { complete: 'Done', submitted: 'Waiting for sign-off', started: 'In progress', open: 'Unlocked', soon: 'Unlocked (course not built yet)', locked: 'Locked' };

function classFilter(classes, current, action) {
  if (!classes.length) return '';
  return html`<form class="filter" method="get" action="${action}">
    <label>${icon('lucide:users')} Class
      <select name="class" onchange="this.form.submit()">
        <option value="">All my students</option>
        ${classes.map((c) => html`<option value="${c.id}" ${String(current) === String(c.id) ? raw('selected') : ''}>${c.name}</option>`)}
      </select></label></form>`;
}

export function dashboardPage(req, { students, queue, classes, classId, progressByUser, weekCount }) {
  const skills = skillList();
  const c = content();
  const body = html`<section class="page-head row">
    <div><p class="eyebrow">Teacher dashboard</p><h1>G’day, ${req.user.name.split(' ')[0]}</h1></div>
    ${classFilter(classes, classId, '/teacher')}
  </section>

  <div class="tiles">
    <div class="tile">${icon('lucide:users')}<b>${students.length}</b><span>students</span></div>
    <div class="tile hot">${icon('lucide:hourglass')}<b>${queue.length}</b><span>waiting for sign-off</span></div>
    <div class="tile">${icon('lucide:circle-check-big')}<b>${weekCount}</b><span>skills finished this week</span></div>
    <div class="tile">${icon('lucide:library')}<b>${skills.filter((s) => s.ready).length}/${skills.length}</b><span>mini courses built</span></div>
  </div>

  <h2 class="section-title">${icon('lucide:inbox')} Sign-off queue</h2>
  ${queue.length ? html`<div class="queue">${queue.map((q) => {
    const s = c.skills[q.skill_id];
    return html`<article class="q-card" style="--zone:${s.zoneObj.color};--zone-ink:${s.zoneObj.ink}">
      <header>${sticker(s.icon, { color: s.zoneObj.color, ink: s.zoneObj.ink, size: 'sm' })}
        <div><b><a href="/teacher/student/${q.user_id}">${q.name}</a></b><span>${s.title}</span></div>
        <small>${q.submitted_at?.slice(0, 16).replace('T', ' ')}</small></header>
      <p class="q-meta">${icon('lucide:circle-help')} Quick check: <b>${q.quiz_best}/${q.quiz_total}</b> ${q.level_up ? html`<span class="lvl-chip">${icon('lucide:star')} says Level Up done</span>` : ''}</p>
      <blockquote>${q.reflection || '—'}</blockquote>
      <form method="post" action="/teacher/signoff">
        <input type="hidden" name="user_id" value="${q.user_id}"><input type="hidden" name="skill_id" value="${q.skill_id}">
        <label class="check"><input type="checkbox" name="level_up" value="1" ${q.level_up ? raw('checked') : ''}><span>Level Up work confirmed (counts extension VC)</span></label>
        <textarea name="comment" rows="2" placeholder="Comment for the student (optional)"></textarea>
        <div class="btn-row">
          <button class="btn btn-zone" name="action" value="approve">${icon('lucide:badge-check')} Sign off</button>
          <button class="btn btn-ghost" name="action" value="return">${icon('lucide:undo-2')} Send back</button>
        </div>
      </form>
    </article>`;
  })}</div>` : empty('Nothing waiting. Nice.', 'lucide:coffee')}

  <h2 class="section-title">${icon('lucide:grid-3x3')} Class progress</h2>
  ${students.length ? html`<div class="grid-wrap"><table class="progress-grid">
    <thead><tr><th>Student</th>${skills.map((s) => html`<th title="${s.title}" style="--zone:${s.zoneObj.color};--zone-ink:${s.zoneObj.ink}"><span>${icon(s.icon)}</span></th>`)}<th>Done</th></tr></thead>
    <tbody>${students.map((st) => {
      const prog = progressByUser[st.id] || {};
      const done = doneSet(prog);
      return html`<tr><th><a href="/teacher/student/${st.id}"><span class="avatar sm">${initials(st.name)}</span>${st.name}${levelTag(st.reading_level, { short: true })}</a></th>
        ${skills.map((s) => { const state = skillState(s, prog, done); return html`<td><span class="dot dot-${state}" title="${s.title}: ${DOT[state]}" style="--zone:${s.zoneObj.color}"></span></td>`; })}
        <td><b>${done.size}</b></td></tr>`;
    })}</tbody></table></div>
    <p class="legend">${['complete', 'submitted', 'started', 'open', 'locked'].map((k) => html`<span><span class="dot dot-${k}" style="--zone:#4D7CFE"></span>${DOT[k]}</span>`)}
      <span>Reading level: ${LEVEL_IDS.map((l) => html`${LEVELS[l].symbol} ${LEVELS[l].label} `)}</span></p>`
    : empty('No students yet. An admin can add accounts under Accounts.', 'lucide:user-plus')}`;
  return page(req, { title: 'Dashboard', body, active: '/teacher', wide: true });
}

export function studentDetailPage(req, { student, progress, badges }) {
  const c = content();
  const done = doneSet(progress);
  const rows = skillList().map((s) => ({ s, st: skillState(s, progress, done), p: progress[s.id] }));
  const body = html`<section class="page-head row">
    <div><p class="eyebrow"><a href="/teacher">${icon('lucide:arrow-left')} Dashboard</a></p>
    <h1><span class="avatar lg">${initials(student.name)}</span> ${student.name}</h1>
    <p class="muted">${student.username} · ${student.class_name || 'No class'} · last login ${student.last_login?.slice(0, 10) || 'never'}</p>
    <p>${levelTag(student.reading_level)} <span class="muted small">Reading level — students don’t see this. ${req.user.role === 'admin' ? html`Change it under <a href="/admin?role=student">Accounts</a>.` : 'An admin can change it.'}</span></p></div>
    <div class="tiles mini"><div class="tile">${icon('lucide:circle-check-big')}<b>${done.size}</b><span>skills</span></div><div class="tile">${icon('lucide:award')}<b>${badges.length}</b><span>badges</span></div></div>
  </section>

  <h2 class="section-title">${icon('lucide:graduation-cap')} Victorian Curriculum evidence</h2>
  ${curriculumGrid(coverage(progress, student.reading_level))}

  <h2 class="section-title">${icon('lucide:list')} Skills</h2>
  <table class="table">
    <thead><tr><th>Skill</th><th>Status</th><th>Steps</th><th>Quick check</th><th>Notes</th><th>Workbook</th><th></th></tr></thead>
    <tbody>${rows.filter((r) => r.st !== 'locked').map(({ s, st, p }) => html`<tr>
      <td><span class="mini-skill" style="--zone:${s.zoneObj.color};--zone-ink:${s.zoneObj.ink}">${icon(s.icon)} ${s.title}</span></td>
      <td><span class="status status-${st}">${DOT[st]}</span>${p?.level_up ? html` <span class="lvl-chip">${icon('lucide:star')}</span>` : ''}</td>
      <td>${p ? `${p.steps.length}/${STEPS.length}` : '—'}</td>
      <td>${p?.quiz_best != null ? `${p.quiz_best}/${p.quiz_total}` : '—'}</td>
      <td class="notes">${p?.reflection ? html`<em>“${p.reflection}”</em>` : ''}${p?.teacher_comment ? html`<br><small>You: ${p.teacher_comment}</small>` : ''}</td>
      <td>${s.ready ? html`<a class="btn btn-sm btn-ghost" href="/workbook/${s.id}?student=${student.id}" target="_blank" title="Printed at ${student.name.split(' ')[0]}’s reading level">${icon('lucide:printer')} Print</a>` : ''}</td>
      <td>${st !== 'complete' && st !== 'soon' ? html`<form method="post" action="/teacher/signoff">
          <input type="hidden" name="user_id" value="${student.id}"><input type="hidden" name="skill_id" value="${s.id}">
          <input type="hidden" name="paper" value="1">
          <button class="btn btn-sm btn-ghost" name="action" value="approve" title="Mark complete from the paper workbook">${icon('lucide:badge-check')} Sign off on paper</button></form>`
        : st === 'complete' ? html`<form method="post" action="/teacher/reopen" onsubmit="return confirm('Re-open this skill for the student?')">
          <input type="hidden" name="user_id" value="${student.id}"><input type="hidden" name="skill_id" value="${s.id}">
          <button class="btn btn-sm btn-ghost">${icon('lucide:rotate-ccw')} Re-open</button></form>` : ''}</td>
    </tr>`)}</tbody>
  </table>`;
  return page(req, { title: student.name, body, active: '/teacher', wide: true });
}

export function skillsIndexPage(req) {
  const c = content();
  const body = html`<section class="page-head"><p class="eyebrow">Mini courses</p><h1>All skills <span class="hl">${skillList().filter((s) => s.ready).length} built · ${skillList().length} mapped</span></h1>
  <p class="lede">Each skill is a mini course: mission brief, explainer, readings and real cases, diagrams, a quick check and a printable workbook. Planned skills are mapped to the curriculum and waiting to be written.</p></section>
  ${c.map.zones.map((z) => html`<section class="ti-zone" style="--zone:${z.color};--zone-ink:${z.ink}">
    <h2 class="section-title">${sticker(z.icon, { color: z.color, ink: z.ink, size: 'sm' })} ${z.name}</h2>
    <div class="ti-grid">${skillList().filter((s) => s.zone === z.id).map((s) => html`<article class="ti-card ${s.ready ? 'ready' : 'planned'}">
      <header>${sticker(s.icon, { color: s.ready ? z.color : '#eee', ink: z.ink, size: 'sm' })}<div><b>${s.title}</b><small>${s.ready ? 'Ready' : 'Planned'} · tier ${s.tier === 0 ? 'Base Camp' : s.tier === 4 ? 'Crossroads' : s.tier}</small></div></header>
      <p>${s.literacy}</p>
      <div class="vc-list">${s.vc.core.map((id) => vcChip(c.vc[id]))}</div>
      ${s.ready ? html`<div class="btn-row">
        <a class="btn btn-sm btn-ink" href="/teacher/skill/${s.id}">${icon('lucide:presentation')} Teacher guide</a>
        <a class="btn btn-sm btn-ghost" href="/workbook/${s.id}" target="_blank">${icon('lucide:printer')} Workbook</a>
        <a class="btn btn-sm btn-ghost" href="/workbook/${s.id}?answers=1" target="_blank">${icon('lucide:key-round')} Answers</a>
      </div>` : ''}
    </article>`)}</div>
  </section>`)}`;
  return page(req, { title: 'Mini courses', body, active: '/teacher/skills', wide: true });
}

const printButtons = (skill, answers = false) => html`${LEVEL_IDS.map((l) => html`<a class="btn btn-sm ${answers ? 'btn-ghost' : 'btn-ink'}" href="/workbook/${skill.id}?level=${l}${answers ? '&answers=1' : ''}" target="_blank" title="${LEVELS[l].years}">${icon(answers ? 'lucide:key-round' : 'lucide:printer')} ${LEVELS[l].symbol} ${LEVELS[l].label}</a>`)}`;

export function teacherGuidePage(req, skill) {
  const c = content();
  const t = courseFor(skill, 'core').teacher;
  const lookFors = skill.course.teacher.lookFors; // unresolved: shows every level
  const levelNotes = skill.course.teacher.levels; // unresolved: one note per level
  const z = skill.zoneObj;
  const body = html`<section class="skill-hero">
    <a class="crumb" href="/teacher/skills">${icon('lucide:arrow-left')} Mini courses</a>
    <div class="skill-hero-grid">
      <div>${sticker(skill.icon, { color: '#fff', ink: z.ink, size: 'xl', cls: 'hero-sticker' })}<h1>${skill.title}</h1><p class="tagline">Teacher guide · ${skill.course.duration}</p></div>
      <aside class="hero-card">
        <p class="kicker">${icon('lucide:printer')} Workbook by reading level</p>
        <p class="btn-row">${printButtons(skill)}</p>
        <p class="kicker">${icon('lucide:key-round')} Answer copies</p>
        <p class="btn-row">${printButtons(skill, true)}</p>
        <p class="btn-row"><a class="btn btn-sm btn-ghost" href="/teacher/skill/${skill.id}/explainer" target="_blank">${icon('lucide:tv')} Explainer on the board</a></p>
        <p class="small muted">Tip: print a student’s own copy from their page on the dashboard. Workbooks show a small ${LEVELS.support.symbol} ${LEVELS.core.symbol} ${LEVELS.extend.symbol} in the footer so you can tell versions apart; it isn’t labelled for students.</p>
      </aside>
    </div>
  </section>
  <div class="guide">
    <section class="panel"><h2>Overview</h2>${md(t.overview)}
      <h3>Real-life skill</h3><p>${skill.realLife}</p>
      <h3>Literacy focus</h3><p>${skill.literacy}</p></section>

    <section class="panel"><h2>${icon('lucide:graduation-cap')} Curriculum links & what to look for</h2>
      <p class="verify">${icon('lucide:triangle-alert')} Codes and wording are paraphrased from VC 2.0 English and still need checking against the VCAA site.</p>
      <table class="table"><thead><tr><th>Victorian Curriculum</th><th>Evidence to look for</th></tr></thead><tbody>
      ${lookFors.map((l) => { const e = c.vc[l.vc]; return html`<tr><td>${vcChip(e, { extend: skill.vc.extend.includes(l.vc) })}<p class="small">${e.code} — ${e.text}</p></td><td>${l.levels ? html`${l.levels.map((x) => levelTag(x))} ` : ''}${l.evidence}</td></tr>`; })}
      </tbody></table></section>

    ${levelNotes ? html`<section class="panel"><h2>${icon('lucide:layers')} Reading levels</h2>
      <p>Each student gets the version that matches the reading level an admin has set for them. Students never see the level name.</p>
      <div class="levels-grid">${LEVEL_IDS.map((l) => { const v = vcFor(skill, l); return html`<div class="level-card rl-${l}">
        <h3>${LEVELS[l].symbol} ${LEVELS[l].label} <small>${LEVELS[l].years}</small></h3>
        ${md(levelNotes[l] || '')}
        <p class="small"><b>Curriculum evidenced:</b></p><div class="vc-list">${v.core.map((id) => vcChip(c.vc[id]))}${l === 'extend' ? v.extend.map((id) => vcChip(c.vc[id], { extend: true })) : ''}</div>
      </div>`; })}</div></section>` : ''}

    <section class="panel"><h2>${icon('lucide:package')} Prep</h2><ul>${t.prep.map((p) => html`<li>${mdInline(p)}</li>`)}</ul>
      <h2>${icon('lucide:key')} Key teaching points</h2><ul class="keypoints">${t.keyPoints.map((p) => html`<li>${p}</li>`)}</ul></section>

    <section class="panel"><h2>${icon('lucide:calendar-days')} Lesson sequence</h2>
      ${t.lessons.map((l) => html`<div class="lesson"><h3>${l.title} <small>${l.minutes} min</small></h3><ol>${l.steps.map((s) => html`<li>${mdInline(s)}</li>`)}</ol></div>`)}</section>

    <section class="panel two-col">
      <div><h2>${icon('lucide:life-buoy')} Support</h2><ul>${t.differentiation.support.map((x) => html`<li>${x}</li>`)}</ul></div>
      <div><h2>${icon('lucide:star')} Extend (Level Up)</h2><ul>${t.differentiation.extend.map((x) => html`<li>${x}</li>`)}</ul></div>
    </section>

    <section class="panel"><h2>${icon('lucide:eye')} Diagrams</h2>${skill.course.diagrams.map((d) => html`<h3>${d.title}</h3>${diagram(d)}`)}</section>

    <section class="panel"><h2>${icon('lucide:key-round')} Answers</h2>${md(t.answers)}</section>

    <section class="panel"><h2>${icon('lucide:link')} Resources</h2><ul>${t.resources.map((r) => html`<li><a href="${r.url}" target="_blank" rel="noopener">${r.label}</a></li>`)}</ul></section>
  </div>`;
  return page(req, { title: `${skill.title} — teacher guide`, body, theme: z, active: '/teacher/skills' });
}

export function curriculumMapPage(req) {
  const c = content();
  const bySub = {};
  for (const e of c.curriculum.entries) (bySub[e.focus] ||= []).push(e);
  const skillsFor = (id) => skillList().map((s) => ({ s, core: s.vc.core.includes(id) || (s.vc.support || []).includes(id), ext: s.vc.extend.includes(id) })).filter((x) => x.core || x.ext);
  const total = c.curriculum.entries.length;
  const covered = c.curriculum.entries.filter((e) => skillsFor(e.id).length).length;
  const body = html`<section class="page-head"><p class="eyebrow">Curriculum map</p>
    <h1>VC 2.0 English <span class="hl">${covered}/${total} focus points mapped</span></h1>
    <p class="lede">Every skill links to Victorian Curriculum F–10 Version 2.0 English content (Levels 3–8). <b>Core</b> links are what every student shows; <b>Level Up</b> links are evidenced by the extension tasks.</p>
    <p class="verify">${icon('lucide:triangle-alert')} ${c.curriculum.note}</p></section>
  ${Object.entries(c.curriculum.focusAreas).map(([key, fa]) => html`<section class="cm-sub">
    <h2 class="section-title"><small>${fa.strand}</small> ${fa.substrand}</h2>
    <div class="cm-rows">${(bySub[key] || []).map((e) => { const sk = skillsFor(e.id); return html`<div class="cm-row ${sk.length ? '' : 'gap'}">
      <div class="cm-level">L${e.level}<small>${e.code}${e.verified ? '' : '?'}</small></div>
      <p>${e.text}</p>
      <div class="cm-skills">${sk.length ? sk.map(({ s, ext }) => html`<a class="mini-skill ${ext ? 'ext' : ''}" href="/teacher/skill/${s.id}" style="--zone:${s.zoneObj.color};--zone-ink:${s.zoneObj.ink}">${icon(s.icon)} ${s.title}${ext ? ' ★' : ''}</a>`) : html`<span class="muted">Not yet covered</span>`}</div>
    </div>`; })}</div></section>`)}`;
  return page(req, { title: 'Curriculum map', body, active: '/teacher/curriculum', wide: true });
}
