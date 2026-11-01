import { html, icon, md, mdInline, raw } from '../html.js';
import { page, sticker, vcChip, empty, initials, levelTag } from './layout.js';
import { LEVELS, LEVEL_IDS, levelInfo } from '../levels.js';
import { content, skillList, getSkill, skillState, doneSet, coverage, STEPS, courseFor, vcFor, evidenceFor } from '../content.js';
import { PROGRAMS, PROGRAM_IDS, familyOf } from '../programs.js';
import { curriculumGrid } from './student.js';
import { diagram } from './diagrams.js';

const DOT = { complete: 'Done', submitted: 'Waiting for sign-off', started: 'In progress', open: 'Unlocked', soon: 'Unlocked (course not built yet)', locked: 'Locked' };

// Tabs to switch program, and a big banner saying which curriculum you're looking at.
export function programSwitch(program, pathname, { query = {}, counts = null } = {}) {
  const qs = (p) => new URLSearchParams({ ...query, program: p }).toString();
  const P = PROGRAMS[program];
  return html`<nav class="prog-switch" aria-label="Program">
    ${PROGRAM_IDS.map((p) => html`<a href="${pathname}?${qs(p)}" class="prog-tab fam-${familyOf(p)} ${p === program ? 'on' : ''}" ${p === program ? raw('aria-current="page"') : ''} title="${PROGRAMS[p].name}${counts ? ` · ${counts[p]} student${counts[p] === 1 ? '' : 's'}` : ''}">
      ${icon(PROGRAMS[p].icon)} <span>${PROGRAMS[p].tab}</span>${counts ? html`<small class="prog-count" aria-label="${counts[p]} students">${icon('lucide:users')}${counts[p]}</small>` : ''}</a>`)}
  </nav>
  <div class="prog-banner fam-${familyOf(program)}" role="note">
    ${icon(P.icon, 'prog-banner-ico')}
    <div><span class="kicker">You’re looking at</span><strong>${P.name}</strong><small>${P.curriculumName}</small></div>
  </div>`;
}

function classFilter(classes, current, action, program) {
  if (!classes.length) return '';
  return html`<form class="filter" method="get" action="${action}">
    <input type="hidden" name="program" value="${program || 'f10'}">
    <label>${icon('lucide:users')} Class
      <select name="class" onchange="this.form.submit()">
        <option value="">All my students</option>
        ${classes.map((c) => html`<option value="${c.id}" ${String(current) === String(c.id) ? raw('selected') : ''}>${c.name}</option>`)}
      </select></label></form>`;
}

export function dashboardPage(req, { students, queue, classes, classId, progressByUser, weekCount, program = 'f10', counts }) {
  const skills = skillList(program);
  const body = html`<section class="page-head row">
    <div><p class="eyebrow">Teacher dashboard</p><h1>G’day, ${req.user.name.split(' ')[0]}</h1></div>
    ${classFilter(classes, classId, '/teacher', program)}
  </section>
  ${programSwitch(program, '/teacher', { query: classId ? { class: classId } : {}, counts })}

  <div class="tiles">
    <div class="tile">${icon('lucide:users')}<b>${students.length}</b><span>students</span></div>
    <div class="tile hot">${icon('lucide:hourglass')}<b>${queue.length}</b><span>waiting for sign-off</span></div>
    <div class="tile">${icon('lucide:circle-check-big')}<b>${weekCount}</b><span>skills finished this week</span></div>
    <div class="tile">${icon('lucide:library')}<b>${skills.filter((s) => s.ready).length}/${skills.length}</b><span>mini courses built</span></div>
  </div>

  <h2 class="section-title">${icon('lucide:inbox')} Sign-off queue</h2>
  ${queue.length ? html`<div class="queue">${queue.map((q) => {
    const s = getSkill(q.skill_id);
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
      return html`<tr><th><a href="/teacher/student/${st.id}"><span class="avatar sm">${initials(st.name)}</span>${st.name}${levelTag(st.reading_level, { short: true, program: st.program })}</a></th>
        ${skills.map((s) => { const state = skillState(s, prog, done); return html`<td><span class="dot dot-${state}" title="${s.title}: ${DOT[state]}" style="--zone:${s.zoneObj.color}"></span></td>`; })}
        <td><b>${done.size}</b></td></tr>`;
    })}</tbody></table></div>
    <p class="legend">${['complete', 'submitted', 'started', 'open', 'locked'].map((k) => html`<span><span class="dot dot-${k}" style="--zone:#4D7CFE"></span>${DOT[k]}</span>`)}
      <span>Reading level: ${LEVEL_IDS.map((l) => html`${LEVELS[l].symbol} ${LEVELS[l].label} `)}</span></p>`
    : empty(`No ${PROGRAMS[program].name} students yet. An admin can add accounts, or move a student into this program, under Accounts.`, 'lucide:user-plus')}`;
  return page(req, { title: 'Dashboard', body, active: '/teacher', wide: true, program });
}

export function studentDetailPage(req, { student, progress, badges }) {
  const program = student.program || 'f10';
  const done = doneSet(progress);
  const rows = skillList(program).map((s) => ({ s, st: skillState(s, progress, done), p: progress[s.id] }));
  const body = html`<section class="page-head row">
    <div><p class="eyebrow"><a href="/teacher">${icon('lucide:arrow-left')} Dashboard</a></p>
    <h1><span class="avatar lg">${initials(student.name)}</span> ${student.name}</h1>
    <p class="muted">${student.username} · ${student.class_name || 'No class'} · last login ${student.last_login?.slice(0, 10) || 'never'}</p>
    <p><span class="prog-tag fam-${familyOf(program)}">${icon(PROGRAMS[program].icon)} ${PROGRAMS[program].name}</span> ${levelTag(student.reading_level, { program })} <span class="muted small">Reading level — students don’t see this. ${req.user.role === 'admin' ? html`Change it under <a href="/admin?role=student">Accounts</a>.` : 'An admin can change it.'}</span></p></div>
    <div class="tiles mini"><div class="tile">${icon('lucide:circle-check-big')}<b>${done.size}</b><span>skills</span></div><div class="tile">${icon('lucide:award')}<b>${badges.length}</b><span>badges</span></div></div>
  </section>

  <h2 class="section-title">${icon('lucide:graduation-cap')} ${PROGRAMS[program].name} evidence</h2>
  ${curriculumGrid(coverage(progress, student.reading_level, program), { program })}

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
  return page(req, { title: student.name, body, active: '/teacher', wide: true, program });
}

export function skillsIndexPage(req, program = 'f10') {
  const c = content(program);
  const list = skillList(program);
  const tierName = (s) => (s.tier === 0 ? c.zones[c.baseZone].name : s.tier === 4 ? c.zones[c.crossZone].name : `tier ${s.tier}`);
  const body = html`<section class="page-head"><p class="eyebrow">Mini courses</p><h1>All skills <span class="hl">${list.filter((s) => s.ready).length} built · ${list.length} mapped</span></h1>
  <p class="lede">Each skill is a mini course: mission brief, explainer, readings and real cases, diagrams, a quick check and a printable workbook. Planned skills are mapped to the curriculum and waiting to be written.</p></section>
  ${programSwitch(program, '/teacher/skills')}
  ${c.map.zones.map((z) => html`<section class="ti-zone" style="--zone:${z.color};--zone-ink:${z.ink}">
    <h2 class="section-title">${sticker(z.icon, { color: z.color, ink: z.ink, size: 'sm' })} ${z.name}</h2>
    <div class="ti-grid">${list.filter((s) => s.zone === z.id).map((s) => html`<article class="ti-card ${s.ready ? 'ready' : 'planned'}">
      <header>${sticker(s.icon, { color: s.ready ? z.color : '#eee', ink: z.ink, size: 'sm' })}<div><b>${s.title}</b><small>${s.ready ? 'Ready' : 'Planned'} · ${tierName(s)}</small></div></header>
      <p>${s.literacy}</p>
      <div class="vc-list">${s.vc.core.map((id) => vcChip(c.vc[id]))}</div>
      ${s.ready ? html`<div class="btn-row">
        <a class="btn btn-sm btn-ink" href="/teacher/skill/${s.id}">${icon('lucide:presentation')} Teacher guide</a>
        <a class="btn btn-sm btn-ghost" href="/workbook/${s.id}" target="_blank">${icon('lucide:printer')} Workbook</a>
        <a class="btn btn-sm btn-ghost" href="/workbook/${s.id}?answers=1" target="_blank">${icon('lucide:key-round')} Answers</a>
      </div>` : ''}
    </article>`)}</div>
  </section>`)}`;
  return page(req, { title: 'Mini courses', body, active: '/teacher/skills', wide: true, program });
}

const printButtons = (skill, answers = false) => html`${LEVEL_IDS.map((l) => html`<a class="btn btn-sm ${answers ? 'btn-ghost' : 'btn-ink'}" href="/workbook/${skill.id}?level=${l}${answers ? '&answers=1' : ''}" target="_blank" title="${levelInfo(l, skill.program).years}">${icon(answers ? 'lucide:key-round' : 'lucide:printer')} ${LEVELS[l].symbol} ${LEVELS[l].label}</a>`)}`;

// Where a curriculum item sits: "Level 5 · Literacy › …" (F–10) or "Unit 1 · Outcome 1 · Key skill — …" (VM).
const vcWhere = (e) => (e.level != null ? `Level ${e.level} · ${e.strand} › ${e.substrand}` : `${e.strand} · ${e.kind} — ${e.substrand}`);

export function teacherGuidePage(req, skill) {
  const c = content(skill.program);
  const t = courseFor(skill, 'core').teacher;
  const lookFors = skill.course.teacher.lookFors; // unresolved: shows every level
  const levelNotes = skill.course.teacher.levels; // unresolved: one note per level
  const z = skill.zoneObj;
  const body = html`<section class="skill-hero">
    <a class="crumb" href="/teacher/skills?program=${skill.program}">${icon('lucide:arrow-left')} Mini courses · ${PROGRAMS[skill.program].short}</a>
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
      <p class="small muted">Official text: ${c.curriculum.source} <a href="${c.curriculum.url}" target="_blank" rel="noopener">Source</a>, copied ${c.curriculum.retrieved}.</p>
      <table class="table"><thead><tr><th>${PROGRAMS[skill.program].name}</th><th>Evidence to look for</th></tr></thead><tbody>
      ${lookFors.map((l) => { const e = c.vc[l.vc]; return html`<tr><td><b>${e.code}</b> <span class="muted small">${vcWhere(e)}</span><p class="small cd-text">${e.text}</p></td><td>${l.levels ? html`${l.levels.map((x) => levelTag(x, { program: skill.program }))} ` : html`<span class="lvl-chip">${icon('lucide:star')} Level Up</span> `}${l.evidence}</td></tr>`; })}
      </tbody></table>
      ${achievementLinks(skill, c)}</section>

    ${levelNotes ? html`<section class="panel"><h2>${icon('lucide:layers')} Reading levels</h2>
      <p>Each student gets the version that matches the reading level an admin has set for them. Students never see the level name.</p>
      <div class="levels-grid">${LEVEL_IDS.map((l) => { const v = vcFor(skill, l); return html`<div class="level-card rl-${l}">
        <h3>${LEVELS[l].symbol} ${LEVELS[l].label} <small>${levelInfo(l, skill.program).years}</small></h3>
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
  return page(req, { title: `${skill.title} — teacher guide`, body, theme: z, active: '/teacher/skills', program: skill.program });
}

// VPC modules state "the student should be able to:" followed by the learning goals.
const goalList = (c, o) => (o.statement.endsWith(':')
  ? html`<ul>${c.curriculum.entries.filter((e) => e.focus === o.id && e.kind === PROGRAMS[c.program].kinds[0].kind).map((e) => html`<li>${e.text}</li>`)}</ul>` : '');

// Sentences of the achievement standard that draw on this skill's content descriptions.
function achievementLinks(skill, c) {
  const codes = new Set([...(skill.vc.support || []), ...skill.vc.core, ...skill.vc.extend]);
  if (c.curriculum.kind === 'study-design') {
    const outs = c.curriculum.outcomes.filter((o) => [...codes].some((id) => c.vc[id]?.focus === o.id));
    const P = PROGRAMS[skill.program];
    return html`<details class="ach" open><summary>${icon('lucide:target')} ${P.part}s this skill gives evidence for</summary>
      <ul>${outs.map((o) => html`<li><b>Unit ${o.unit}, ${P.part} ${o.outcome} — ${o.title}:</b> ${o.statement}${goalList(c, o)}</li>`)}</ul>
      <p class="small muted">Satisfactory completion is a school judgement against the whole ${P.part.toLowerCase()}; this skill is one piece of evidence towards it.</p>
    </details>`;
  }
  const byLevel = {};
  for (const [lv, std] of Object.entries(c.curriculum.achievementStandards)) {
    for (const m of std.modes) for (const x of m.extracts) {
      const hit = x.codes.filter((k) => codes.has(k));
      if (hit.length) (byLevel[lv] ||= []).push({ mode: m.mode, text: x.text, hit });
    }
  }
  const levels = Object.keys(byLevel).sort((a, b) => Number(a) - Number(b));
  if (!levels.length) return '';
  return html`<details class="ach"><summary>${icon('lucide:target')} Achievement standard sentences this skill gives evidence for</summary>
    ${levels.map((lv) => html`<h4>Level ${lv}</h4><ul>${byLevel[lv].map((x) => html`<li><b>${x.mode}:</b> ${x.text} <span class="muted small">(${x.hit.join(', ')})</span></li>`)}</ul>`)}
  </details>`;
}

// ---------- Curriculum map ----------
// Calm, collapsible cards: one per outcome (VM) or sub-strand (F–10), with coverage
// meters in the header and each curriculum point listed with links to its mini courses.
function meter(n, total) {
  const pct = total ? Math.round((n / total) * 100) : 0;
  return html`<span class="cm-meter" title="${n} of ${total} linked"><i style="width:${pct}%"></i></span>`;
}

function chips(links) {
  return html`<div class="cm-chips">${links.map(({ s, kind }) => html`<a class="chip-skill chip-${kind}" href="/teacher/skill/${s.id}" style="--zone:${s.zoneObj.color};--zone-ink:${s.zoneObj.ink}" title="${kind === 'ext' ? 'Level Up work' : kind === 'sup' ? 'Foundation readers' : 'Every student'}">${icon(s.icon)} ${s.title}${kind === 'ext' ? ' ★' : ''}${kind === 'sup' ? ` ${LEVELS.support.symbol}` : ''}</a>`)}</div>`;
}

function cmItem(e, links, label, title = '', program = 'f10') {
  const url = `/teacher/where?program=${program}&id=${encodeURIComponent(e.id)}`;
  return html`<li class="cm-item ${links.length ? '' : 'gap'}">
    <span class="cm-code" title="${title}">${label}</span>
    <div><p>${e.text}</p>${links.length ? html`<div class="cm-links">${chips(links)}<a class="where-btn" href="${url}" data-where="${url}" title="Where exactly is this taught and assessed?">${icon('lucide:map-pin')} Where?</a></div>` : html`<span class="cm-none">Not linked yet</span>`}</div>
  </li>`;
}

const STEP_ICON = { watch: 'lucide:play', read: 'lucide:book-open', see: 'lucide:eye', check: 'lucide:circle-help', workbook: 'lucide:notebook-pen', show: 'lucide:send' };
const STEP_LABEL = { watch: 'Watch', read: 'Read', see: 'See it', check: 'Quick check', workbook: 'Workbook', show: 'Show it' };

// Where one curriculum point is taught and assessed, in every linked mini course (staff only).
export function whereContent(c, id) {
  const e = c.vc[id];
  if (!e) return html`<p>Unknown curriculum point.</p>`;
  const linked = skillList(c.program).flatMap((s) => (s.vc.core.includes(id) ? [{ s, kind: 'core' }]
    : (s.vc.support || []).includes(id) ? [{ s, kind: 'sup' }] : s.vc.extend.includes(id) ? [{ s, kind: 'ext' }] : []));
  const kindLabel = { core: 'Every student', sup: `${LEVELS.support.symbol} Foundation readers`, ext: '★ Level Up work' };
  const whereCell = (byLevel) => {
    const present = LEVEL_IDS.filter((l) => byLevel[l]);
    const same = present.length === LEVEL_IDS.length && present.every((l) => byLevel[l].where === byLevel[present[0]].where);
    if (same) return html`<span class="w-where">${byLevel[present[0]].where || '✓'}</span>`;
    return html`${present.map((l) => html`<span class="w-where" title="${LEVELS[l].label} version">${LEVELS[l].symbol} ${byLevel[l].where || '✓'}</span>`)}${present.length < LEVEL_IDS.length ? html`<small class="muted"> (not in ${LEVEL_IDS.filter((l) => !byLevel[l]).map((l) => LEVELS[l].symbol).join(' ')})</small>` : ''}`;
  };
  return html`<header class="w-head">
      <span class="w-code">${e.code}</span>
      <span class="muted small">${vcWhere(e)}</span>
      <p class="w-text">${e.text}</p>
    </header>
    ${linked.length ? linked.map(({ s, kind }) => {
      const ev = evidenceFor(s, id);
      const lvl = kind === 'sup' ? 'support' : 'core';
      return html`<section class="w-skill" style="--zone:${s.zoneObj.color};--zone-ink:${s.zoneObj.ink}">
        <h3>${sticker(s.icon, { color: s.zoneObj.color, ink: s.zoneObj.ink, size: 'sm' })} <span>${s.title}</span> <span class="chip-skill chip-${kind} chip-demo">${kindLabel[kind]}</span></h3>
        ${!s.ready ? html`<p class="muted small">This mini course hasn’t been written yet. It’s planned to give evidence for this point through: ${s.literacy}</p>` : html`
          ${ev.look.map((l) => html`<p class="w-look">${icon('lucide:eye')} <span><b>Look for:</b> ${l.evidence}</span></p>`)}
          ${ev.places.length ? html`<table class="w-table"><thead><tr><th>Step</th><th>What</th><th>Where (▲ ■ ● = reading-level versions)</th></tr></thead><tbody>
            ${ev.places.map((pl) => {
              const pageLevel = pl.byLevel[lvl] ? lvl : LEVEL_IDS.find((l) => pl.byLevel[l]);
              const href = pl.step === 'workbook' ? `/workbook/${s.id}?level=${pageLevel}#page-${pl.byLevel[pageLevel].page}` : `/skill/${s.id}?step=${pl.step}&level=${pageLevel}`;
              return html`<tr>
                <td><span class="w-step">${icon(STEP_ICON[pl.step])} ${STEP_LABEL[pl.step]}</span></td>
                <td><a href="${href}" target="_blank" rel="noopener"><b>${pl.title}</b></a>${pl.note ? html`<br><small class="muted">${pl.note}</small>` : ''}</td>
                <td>${whereCell(pl.byLevel)}</td></tr>`;
            })}</tbody></table>` : html`<p class="muted small">No specific parts of this course are tagged for this point yet.</p>`}`}
      </section>`;
    }) : html`<p class="muted">No mini course links to this point yet.</p>`}`;
}

export function wherePage(req, c, id) {
  const body = html`<p class="eyebrow"><a href="/teacher/curriculum?program=${c.program}">${icon('lucide:arrow-left')} Curriculum map</a></p>
    <section class="panel where-panel">${whereContent(c, id)}</section>`;
  return page(req, { title: 'Where it’s taught', body, active: '/teacher/curriculum', program: c.program });
}

function cmapHeader(c, { linked, total, noun, legend, jump }) {
  return html`${programSwitch(c.program, '/teacher/curriculum')}
  <section class="cmap-head">
    <div>
      <h1>Curriculum map</h1>
      <p class="muted small">${c.curriculum.source} <a href="${c.curriculum.url}" target="_blank" rel="noopener">Source</a> · copied ${c.curriculum.retrieved}</p>
    </div>
    <div class="cmap-stat"><b>${linked}<span>/${total}</span></b><small>${noun} linked to a mini course</small>${meter(linked, total)}</div>
  </section>
  <div class="cmap-tools">
    <p class="cmap-legend">${legend}</p>
    <div class="btn-row"><button type="button" class="btn btn-sm btn-ghost" data-cards="open">${icon('lucide:chevrons-down-up')} Open all</button><button type="button" class="btn btn-sm btn-ghost" data-cards="close">${icon('lucide:chevrons-up-down')} Close all</button></div>
  </div>
  ${jump ? html`<nav class="cmap-jump" aria-label="Jump to">${jump}</nav>` : ''}
  <dialog class="where-modal" id="where-modal" aria-label="Where it’s taught">
    <button type="button" class="where-close" data-where-close aria-label="Close">${icon('lucide:x')}</button>
    <div class="where-body" data-where-body></div>
  </dialog>`;
}

const legendChip = (kind, text) => html`<span class="chip-skill chip-${kind} chip-demo">${text}</span>`;

// Study designs, word for word. VCE VM: Unit → Outcome → key knowledge / key skills.
// VPC: Unit → Module → learning goals / applications (plus the suggested assessment tasks).
function studyDesignMapPage(req, c) {
  const P = PROGRAMS[c.program];
  const entries = c.curriculum.entries;
  const skills = skillList(c.program);
  const linksFor = (id) => skills.flatMap((s) => (s.vc.core.includes(id) ? [{ s, kind: 'core' }] : s.vc.extend.includes(id) ? [{ s, kind: 'ext' }] : []));
  const linked = entries.filter((e) => linksFor(e.id).length).length;
  const units = [...new Set(c.curriculum.outcomes.map((o) => o.unit))];
  const card = (o) => {
    const es = entries.filter((e) => e.focus === o.id);
    const groups = P.kinds.map((k) => ({ ...k, es: es.filter((e) => e.kind === k.kind) }));
    const n = (list) => list.filter((e) => linksFor(e.id).length).length;
    return html`<details class="cm-card" open id="${o.id}">
      <summary>
        <span class="cm-card-title"><small>Unit ${o.unit} · ${P.part} ${o.outcome}</small>${o.title}</span>
        <span class="cm-card-stats">${groups.map((g) => html`<span>${g.plural} <b>${n(g.es)}/${g.es.length}</b>${meter(n(g.es), g.es.length)}</span>`)}</span>
        ${icon('lucide:chevron-down', 'cm-chev')}
      </summary>
      <div class="cm-card-body">
        <p class="cm-outcome">${o.statement}</p>
        ${o.options.length ? html`<p class="cm-options">${o.options.filter((x) => /^Option/.test(x)).join(' · ')}</p>` : ''}
        <div class="cm-cols">
          ${groups.map((g) => html`<div><h4>${g.plural}</h4><ul class="cm-list">${g.es.map((e) => cmItem(e, linksFor(e.id), e.code.split(' ').pop(), e.code, c.program))}</ul></div>`)}
        </div>
        ${o.assessment?.length ? html`<details class="cm-assess"><summary>${icon('lucide:clipboard-list')} Suggested assessment tasks (from the curriculum design)</summary><ul>${o.assessment.map((t) => html`<li>${t}</li>`)}</ul></details>` : ''}
      </div>
    </details>`;
  };
  const body = html`${cmapHeader(c, {
    linked, total: entries.length, noun: P.kinds.map((k) => k.plural.toLowerCase()).join(' and '),
    legend: html`${legendChip('core', 'Every student')} ${legendChip('ext', 'Level Up work ★')} <span class="cm-none">Not linked yet</span> <span class="muted small">Codes: ${P.kinds.map((k) => k.help).join(', ')}, in curriculum order.</span>`,
    jump: html`${c.curriculum.outcomes.map((o) => html`<a href="#${o.id}">U${o.unit} · ${P.partAbbr}${o.outcome}</a>`)}`,
  })}
  ${units.map((u) => html`<section class="cm-unit"><h2 class="cm-unit-title">Unit ${u}</h2>${c.curriculum.outcomes.filter((o) => o.unit === u).map(card)}</section>`)}`;
  return page(req, { title: 'Curriculum map', body, active: '/teacher/curriculum', wide: true, program: c.program });
}

export function curriculumMapPage(req, program = 'f10') {
  const c = content(program);
  if (c.curriculum.kind === 'study-design') return studyDesignMapPage(req, c);
  const showAll = req.query.levels === 'all';
  const shown = c.curriculum.entries.filter((e) => showAll || (e.level >= 3 && e.level <= 10));
  const skills = skillList(program);
  const linksFor = (id) => skills.flatMap((s) => (s.vc.core.includes(id) ? [{ s, kind: 'core' }]
    : (s.vc.support || []).includes(id) ? [{ s, kind: 'sup' }] : s.vc.extend.includes(id) ? [{ s, kind: 'ext' }] : []));
  const linked = shown.filter((e) => linksFor(e.id).length).length;
  const strands = [...new Set(Object.values(c.curriculum.focusAreas).map((fa) => fa.strand))];
  const card = ([key, fa]) => {
    const es = shown.filter((e) => e.focus === key).sort((a, b) => a.level - b.level);
    if (!es.length) return '';
    const n = es.filter((e) => linksFor(e.id).length).length;
    return html`<details class="cm-card" id="${key}">
      <summary>
        <span class="cm-card-title">${fa.substrand}</span>
        <span class="cm-card-stats"><span>Linked <b>${n}/${es.length}</b>${meter(n, es.length)}</span></span>
        ${icon('lucide:chevron-down', 'cm-chev')}
      </summary>
      <div class="cm-card-body"><ul class="cm-list">${es.map((e) => cmItem(e, linksFor(e.id), html`<b>L${e.level || e.levelId}</b><small>${e.code}</small>`, e.code, program))}</ul></div>
    </details>`;
  };
  const body = html`${cmapHeader(c, {
    linked, total: shown.length, noun: showAll ? 'content descriptions (all levels)' : 'content descriptions (Levels 3–10)',
    legend: html`${legendChip('sup', `Foundation readers ${LEVELS.support.symbol}`)} ${legendChip('core', 'Every student')} ${legendChip('ext', 'Level Up work ★')} <span class="cm-none">Not linked yet</span> ${showAll ? html`<a class="small" href="/teacher/curriculum?program=f10">Show Levels 3–10 only</a>` : html`<a class="small" href="/teacher/curriculum?program=f10&amp;levels=all">Include Foundation to Level 2</a>`}`,
  })}
  ${strands.map((st) => html`<section class="cm-unit"><h2 class="cm-unit-title">${st}</h2>${Object.entries(c.curriculum.focusAreas).filter(([, fa]) => fa.strand === st).map(card)}</section>`)}`;
  return page(req, { title: 'Curriculum map', body, active: '/teacher/curriculum', wide: true, program: 'f10' });
}
