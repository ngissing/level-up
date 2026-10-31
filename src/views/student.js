import { html, icon, md, mdInline, raw } from '../html.js';
import { page, sticker, vcChip, readAloud, sayButton, empty } from './layout.js';
import { PROGRAMS } from '../programs.js';
import { LEVELS, LEVEL_IDS } from '../levels.js';
import { diagram, phone } from './diagrams.js';
import {
  content, skillList, zoneSkills, skillState, doneSet, requirements, allBadges, coverage, STEPS, audioFor, readUnits,
} from '../content.js';

const STATE_LABEL = {
  locked: 'Locked', soon: 'Coming soon', open: 'Ready', started: 'In progress', submitted: 'With teacher', complete: 'Done',
};
const STATE_ICON = {
  locked: 'lucide:lock', soon: 'lucide:hammer', open: 'lucide:play', started: 'lucide:loader', submitted: 'lucide:hourglass', complete: 'lucide:check',
};

function node(skill, progress, done) {
  const st = skillState(skill, progress, done);
  const p = progress[skill.id];
  const reqs = st === 'locked' ? requirements(skill).filter((r) => r.ids.filter((id) => done.has(id)).length < r.min) : [];
  const stepsDone = p ? p.steps.length : 0;
  const z = skill.zoneObj;
  const clickable = st !== 'locked';
  const Tag = clickable ? 'a' : 'div';
  const inner = html`
    ${sticker(st === 'locked' ? 'lucide:lock' : skill.icon, { color: st === 'locked' ? '#d9d4ca' : z.color, ink: st === 'locked' ? '#6b665e' : z.ink })}
    <span class="node-text">
      <strong>${skill.title}</strong>
      <small>${st === 'locked' ? reqs[0]?.text : skill.tagline}</small>
    </span>
    <span class="node-state">${icon(STATE_ICON[st])}${st === 'started' ? `${stepsDone} of ${STEPS.length} steps` : STATE_LABEL[st]}</span>`;
  return clickable
    ? html`<a class="node state-${st}" href="/skill/${skill.id}" style="--zone:${z.color};--zone-ink:${z.ink}">${inner}</a>`
    : html`<div class="node state-${st}" style="--zone:${z.color};--zone-ink:${z.ink}" aria-disabled="true">${inner}</div>`;
}

export function mapPage(req, { progress, newBadges, unlocked }) {
  const c = content(req.user.program);
  const done = doneSet(progress);
  const all = skillList(c.program);
  const base = c.zones[c.baseZone], cross = c.zones[c.crossZone];
  const nextUp = all.filter((s) => ['started', 'open'].includes(skillState(s, progress, done)))
    .sort((a, b) => (progress[b.id] ? 1 : 0) - (progress[a.id] ? 1 : 0)).slice(0, 4);
  const badgeCount = req.badgeCount || 0;
  const first = req.user.name.split(' ')[0];
  const zones = c.map.zones.filter((z) => ![c.baseZone, c.crossZone].includes(z.id));
  const tierLabel = ['', 'Starters', 'Level 2', 'Boss level'];

  const body = html`
  <section class="map-hero">
    <div>
      <p class="eyebrow">Your map</p>
      <h1>Hey ${first}. <span class="hl">Pick your next move.</span></h1>
      <p class="lede">Every skill here is something you’ll actually use. Go in any order you like — finish skills to unlock new ones and earn badges.</p>
    </div>
    <div class="hero-stats">
      <div class="stat"><b>${done.size}</b><span>of ${all.length} skills</span></div>
      <div class="stat"><b>${badgeCount}</b><span>badges</span></div>
      <div class="meter" role="img" aria-label="${Math.round((done.size / all.length) * 100)}% of the map done"><span style="width:${(done.size / all.length) * 100}%"></span></div>
    </div>
  </section>

  ${newBadges?.length || unlocked?.length ? html`<section class="celebrate" data-confetti>
    ${icon('lucide:party-popper', 'celebrate-ico')}
    <div>
      ${newBadges?.length ? html`<h2>New badge${newBadges.length > 1 ? 's' : ''}! ${newBadges.map((b) => b.name).join(', ')}</h2>` : ''}
      ${unlocked?.length ? html`<p>You unlocked: <b>${unlocked.map((s) => s.title).join(', ')}</b></p>` : ''}
    </div>
    <a class="btn btn-ink" href="/badges">See badges</a>
  </section>` : ''}

  ${nextUp.length ? html`<section class="next-up">
    <h2 class="section-title">${icon('lucide:sparkles')} Up next — your choice</h2>
    <div class="next-grid">${nextUp.map((s) => node(s, progress, done))}</div>
  </section>` : ''}

  <section class="zone-band" style="--zone:${base.color};--zone-ink:${base.ink}">
    <header class="zone-head">
      ${sticker(base.icon, { color: base.color, ink: base.ink, size: 'lg' })}
      <div><h2>${base.name}</h2><p>${base.pitch}</p></div>
    </header>
    <div class="band-nodes">${zoneSkills(c.baseZone).map((s) => node(s, progress, done))}</div>
  </section>

  <div class="trail-arrow" aria-hidden="true">${icon('lucide:arrow-down')}<span>then choose your zone</span>${icon('lucide:arrow-down')}</div>

  <section class="zones" style="--zones:${zones.length}">
    ${zones.map((z) => {
      const zs = zoneSkills(z.id);
      const n = zs.filter((s) => done.has(s.id)).length;
      return html`<article class="zone" style="--zone:${z.color};--zone-ink:${z.ink}">
        <header class="zone-top">
          ${sticker(z.icon, { color: z.color, ink: z.ink, size: 'lg' })}
          <h2>${z.name}</h2>
          <p>${z.pitch}</p>
          <div class="zone-meter"><span style="width:${(n / zs.length) * 100}%"></span></div>
          <small>${n}/${zs.length} done</small>
        </header>
        <div class="trail">
          ${[1, 2, 3].map((t) => html`<div class="tier tier-${t}">
            <span class="tier-label">${tierLabel[t]}</span>
            ${zs.filter((s) => s.tier === t).map((s) => node(s, progress, done))}
          </div>`)}
        </div>
      </article>`;
    })}
  </section>

  <section class="zone-band crossroads" style="--zone:${cross.color};--zone-ink:${cross.ink}">
    <header class="zone-head">
      ${sticker(cross.icon, { color: cross.color, ink: cross.ink, size: 'lg' })}
      <div><h2>${cross.name}</h2><p>${cross.pitch}</p></div>
    </header>
    <div class="band-nodes four">${zoneSkills(c.crossZone).map((s) => node(s, progress, done))}</div>
  </section>`;
  return page(req, { title: 'Map', body, active: '/map', wide: true });
}

// ---------------- Skill (mini course) ----------------

function stepNav(skill, p, step) {
  const doneSteps = new Set(p?.steps || []);
  return html`<nav class="steps" aria-label="Mission steps">
    <ol>${STEPS.map((s, i) => html`<li>
      <a href="/skill/${skill.id}?step=${s.id}" class="${s.id === step ? 'on' : ''} ${doneSteps.has(s.id) ? 'done' : ''}" ${s.id === step ? raw('aria-current="step"') : ''}>
        <span class="step-n">${doneSteps.has(s.id) ? icon('lucide:check') : i + 1}</span>
        ${icon(s.icon, 'step-ico')}<span>${s.label}</span>
      </a></li>`)}
    </ol>
  </nav>`;
}

function doneButton(skill, step, label = 'Done — next step') {
  return html`<form method="post" action="/skill/${skill.id}/step" class="done-form">
    <input type="hidden" name="step" value="${step}">
    <button class="btn btn-zone btn-lg">${icon('lucide:check')} ${label}</button>
  </form>`;
}

function briefStep(skill) {
  const b = skill.course.brief;
  const u = readUnits(skill.course), audio = audioFor(skill.id);
  return html`<div class="panel" id="read-brief">
    <div class="panel-tools">${readAloud(u.brief, audio(u.brief))}</div>
    <div class="hook">${icon('lucide:smartphone', 'hook-ico')}<div>${md(b.hook)}</div></div>
    <h2>Why this matters</h2>
    ${md(b.why)}
    <h2>By the end you can…</h2>
    <ul class="can-do">${b.canDo.map((x) => html`<li>${icon('lucide:circle-check')}<span>${mdInline(x)}</span></li>`)}</ul>
    <h2>Words you’ll need</h2>
    <div class="vocab-grid">${b.vocab.map((v) => html`<div class="vocab-card">
      ${sayButton(u.vocab[v.word], audio(u.vocab[v.word]), `Say ${v.word}`)}
      <strong>${v.word}</strong><p>${v.meaning}</p><em>${v.example}</em>
    </div>`)}</div>
    <div class="callout-box">${icon('lucide:target')}<div><strong>How you’ll show it</strong><p>${b.showIt}</p><small>Time: about ${skill.course.duration}</small></div></div>
  </div>`;
}

function scene(s) {
  switch (s.kind) {
    case 'title': return html`<div class="sc sc-title">${sticker(s.icon, { size: 'xl' })}<h3>${s.title}</h3><p>${s.sub}</p></div>`;
    case 'message': return html`<div class="sc sc-message"><h3>${s.title}</h3>${phone({ sender: s.sender, text: s.text })}</div>`;
    case 'stat': return html`<div class="sc sc-stat"><b>${s.big}</b><h3>${s.title}</h3><p>${s.sub}</p></div>`;
    case 'big': return html`<div class="sc sc-big">${icon(s.icon, 'sc-ico')}<h3>${s.title}</h3><p>${mdInline(s.text)}</p></div>`;
    case 'flag': return html`<div class="sc sc-flag"><span class="flag-letter">${s.letter}</span><div><span class="flag-pill">${icon(s.pillIcon || 'lucide:flag')} ${s.pill || 'Red flag'}</span><h3>${s.title}</h3><p>${s.text}</p></div>${icon(s.icon, 'sc-ico')}</div>`;
    case 'steps': return html`<div class="sc sc-steps"><h3>${s.title}</h3><ol>${s.steps.map((x) => html`<li>${x}</li>`)}</ol></div>`;
    case 'end': return html`<div class="sc sc-end">${icon(s.icon, 'sc-ico')}<h3>${s.title}</h3><p>${s.text}</p></div>`;
    default: return html`<div class="sc"><h3>${s.title}</h3></div>`;
  }
}

// audio: narration text -> recorded audio URL (from audioFor); falls back to the browser's voice.
export function explainer(ex, audio = () => null) {
  return html`<div class="explainer" data-explainer ${audio.voice ? raw(`data-recorded-voice="${audio.voice}"`) : ''}>
    <div class="ex-stage">
      ${ex.scenes.map((s, i) => { const a = audio(s.say); return html`<section class="ex-scene ${i === 0 ? 'active' : ''}" data-say="${s.say}" ${a ? raw(`data-audio="${a}"`) : ''}>${scene(s)}</section>`; })}
      <button class="ex-big-play" type="button" data-ex-play aria-label="Play">${icon('lucide:play')}</button>
    </div>
    <div class="ex-caption" aria-live="polite"></div>
    <div class="ex-controls">
      <button type="button" data-ex-prev aria-label="Previous">${icon('lucide:skip-back')}</button>
      <button type="button" data-ex-toggle aria-label="Play or pause">${icon('lucide:play', 'i-play')}${icon('lucide:pause', 'i-pause')}</button>
      <button type="button" data-ex-next aria-label="Next">${icon('lucide:skip-forward')}</button>
      <div class="ex-progress">${ex.scenes.map(() => html`<span><i></i></span>`)}</div>
      <button type="button" data-ex-cc aria-pressed="true" title="Captions">${icon('lucide:captions')}</button>
      <button type="button" data-ex-voice aria-pressed="true" title="Voice">${icon('lucide:volume-2')}</button>
    </div>
    <p class="ex-voice" data-ex-voice-label aria-live="polite"></p>
  </div>`;
}

function watchStep(skill) {
  const ex = skill.course.explainer;
  return html`<div class="panel">
    <h2>${ex.title}</h2>
    <p class="muted">Press play. It reads itself out loud — turn captions on or off with ${icon('lucide:captions')}.</p>
    ${explainer(ex, audioFor(skill.id))}
    ${ex.videoUrl ? html`<h3>Bonus video</h3><div class="video-wrap"><iframe src="${ex.videoUrl}" title="Video" allowfullscreen loading="lazy"></iframe></div>` : ''}
    <details class="transcript"><summary>${icon('lucide:file-text')} Read the script</summary>
      <ol>${ex.scenes.map((s) => html`<li>${s.say}</li>`)}</ol>
    </details>
  </div>`;
}

function readStep(skill) {
  const r = skill.course.read;
  const u = readUnits(skill.course), audio = audioFor(skill.id);
  return html`<div class="panel">
    ${r.articles.map((a, i) => html`<article class="reading" id="article-${i}">
      <header><span class="kicker">${icon('lucide:book-open')} Reading · ${a.minutes} min</span>${readAloud(u.articles[i], audio(u.articles[i]))}</header>
      <h2>${a.title}</h2>
      <div class="prose">${md(a.body)}</div>
    </article>`)}
    <h2 class="section-title">${icon('lucide:newspaper')} Real cases</h2>
    <div class="case-grid">
    ${r.caseStudies.map((cs, i) => html`<article class="case" id="case-${i}">
      <header>${sticker(cs.icon, { size: 'sm' })}<span class="kicker">Case study</span>${readAloud(u.cases[i], audio(u.cases[i]), 'Read')}</header>
      <h3>${cs.title}</h3>
      <div class="prose">${md(cs.body)}</div>
      <div class="think"><strong>${icon('lucide:lightbulb')} Think about it</strong><ul>${cs.think.map((t) => html`<li>${t}</li>`)}</ul></div>
      <p class="source">Source: <a href="${cs.source.url}" target="_blank" rel="noopener">${cs.source.name}</a></p>
    </article>`)}
    </div>
  </div>`;
}

function seeStep(skill) {
  return html`<div class="panel">
    ${skill.course.diagrams.map((d) => html`<section class="diagram-wrap"><h2>${d.title}</h2>${diagram(d)}</section>`)}
  </div>`;
}

function workbookStep(skill) {
  const pages = skill.course.workbook.pages.filter((p) => p.type !== 'signoff' && p.type !== 'cover');
  return html`<div class="panel">
    <div class="workbook-hero">
      <div class="wb-thumb" aria-hidden="true"><span>${icon(skill.icon)}</span><b>${skill.title}</b><i>Workbook</i></div>
      <div>
        <h2>Your workbook</h2>
        <p>The workbook is where you <b>show what you know</b>. Your teacher will give you a printed copy — or open it here.</p>
        <p class="btn-row"><a class="btn btn-zone" href="/workbook/${skill.id}" target="_blank">${icon('lucide:printer')} Open workbook</a></p>
      </div>
    </div>
    <h3>What’s inside</h3>
    <ol class="wb-list">${pages.map((p) => html`<li>${p.title || p.type}${p.items?.some((i) => i.levelUp) || p.type.startsWith('levelup') ? html` <span class="lvl-chip">${icon('lucide:star')} Level Up</span>` : ''}</li>`)}</ol>
  </div>`;
}

function checkStep(skill, p, result) {
  const qs = skill.course.quiz.questions;
  const u = readUnits(skill.course), audio = audioFor(skill.id);
  return html`<div class="panel">
    <h2>Quick check</h2>
    <p class="muted">${qs.length} questions. Get most of them right to tick this off. You can try again as many times as you like.</p>
    ${p?.quiz_best != null ? html`<p class="best">${icon('lucide:trophy')} Best score: <b>${p.quiz_best}/${p.quiz_total}</b></p>` : ''}
    <form method="post" action="/skill/${skill.id}/quiz" class="quiz">
      ${qs.map((q, i) => {
        const r = result?.[i];
        return html`<fieldset class="q ${r ? (r.correct ? 'q-right' : 'q-wrong') : ''}">
          <legend><span class="q-n">${i + 1}</span>${mdInline(q.q)} ${sayButton(u.quiz[i], audio(u.quiz[i]), 'Read question and answers')}</legend>
          ${q.options.map((o, j) => html`<label class="opt ${r && j === q.answer ? 'opt-answer' : ''}">
            <input type="radio" name="q${i}" value="${j}" required ${r && r.chosen === j ? raw('checked') : ''}><span>${o}</span></label>`)}
          ${r ? html`<p class="explain">${icon(r.correct ? 'lucide:circle-check' : 'lucide:info')} ${q.explain}</p>` : ''}
        </fieldset>`;
      })}
      <button class="btn btn-zone btn-lg">${icon('lucide:send')} Check my answers</button>
    </form>
  </div>`;
}

function showStep(skill, p, ready) {
  const s = skill.course.show;
  if (p?.status === 'submitted') {
    return html`<div class="panel center-panel">${icon('lucide:hourglass', 'big-ico')}<h2>Sent to your teacher</h2><p>Your teacher will check your workbook and sign it off. Pick another skill from the map while you wait!</p><a class="btn btn-ink" href="/map">${icon('lucide:map')} Back to the map</a></div>`;
  }
  if (p?.status === 'complete') {
    return html`<div class="panel center-panel">${sticker(skill.badge.icon, { color: skill.zoneObj.color, ink: skill.zoneObj.ink, size: 'xl' })}<h2>Done! You earned “${skill.badge.name}”</h2>${p.teacher_comment ? html`<blockquote class="t-comment">${icon('lucide:message-circle')} ${p.teacher_comment}</blockquote>` : ''}<a class="btn btn-ink" href="/map">${icon('lucide:map')} Choose your next skill</a></div>`;
  }
  return html`<div class="panel">
    ${p?.teacher_comment ? html`<div class="callout-box warn">${icon('lucide:message-circle')}<div><strong>Your teacher says</strong><p>${p.teacher_comment}</p></div></div>` : ''}
    <h2>Show it</h2>
    <div class="callout-box">${icon('lucide:target')}<div><strong>Your final task</strong><p>${s.task}</p><small>Do this in your workbook (page “Final mission”).</small></div></div>
    ${ready.missing.length ? html`<div class="callout-box warn">${icon('lucide:list-todo')}<div><strong>Before you send it in, finish:</strong><ul>${ready.missing.map((m) => html`<li>${m}</li>`)}</ul></div></div>` : ''}
    <form method="post" action="/skill/${skill.id}/submit" class="show-form">
      <fieldset><legend>Tick each one</legend>
        ${s.checklist.map((c, i) => html`<label class="check"><input type="checkbox" required name="c${i}"><span>${c}</span></label>`)}
      </fieldset>
      <label class="check levelup"><input type="checkbox" name="level_up" value="1"><span>${icon('lucide:star')} I did the Level Up challenge: ${s.levelUp}</span></label>
      <label class="field"><span>One thing I learned (you can use voice typing)</span><textarea name="reflection" rows="3" required></textarea></label>
      <button class="btn btn-zone btn-lg" ${ready.missing.length ? raw('disabled') : ''}>${icon('lucide:send')} Send to my teacher</button>
    </form>
  </div>`;
}

export function readiness(skill, p, passPct) {
  const missing = [];
  const steps = new Set(p?.steps || []);
  for (const s of STEPS.slice(0, 5)) if (!steps.has(s.id)) missing.push(s.label);
  const passed = p?.quiz_best != null && p.quiz_best / p.quiz_total * 100 >= passPct;
  if (!passed) missing.push('Quick check (pass it)');
  return { missing };
}

// Without level numbers, two links to the same sub-strand look identical: show each once.
function dedupe(ids, c) {
  const seen = new Set();
  return ids.map((id) => c.vc[id]).filter((e) => e && !seen.has(e.substrand) && seen.add(e.substrand));
}

export function skillPage(req, { skill, progress, step, quizResult, passPct }) {
  const student = req.user.role === 'student';
  const doneBtn = (stepId, label) => (student ? doneButton(skill, stepId, label) : '');
  const z = skill.zoneObj;
  const c = content(skill.program);
  const p = progress[skill.id];
  const done = doneSet(progress);
  const st = skillState(skill, progress, done);
  const hero = html`<section class="skill-hero ${p && st !== 'locked' && st !== 'soon' ? 'compact' : ''}">
    <a class="crumb" href="/map">${icon('lucide:arrow-left')} Map · ${z.name}</a>
    <div class="skill-hero-grid">
      <div>
        ${sticker(skill.icon, { color: '#fff', ink: z.ink, size: 'xl', cls: 'hero-sticker' })}
        <h1>${skill.title}</h1>
        <p class="tagline">${skill.tagline}</p>
      </div>
      <aside class="hero-card">
        <p><span class="kicker">${icon('lucide:hand-heart')} Real-life skill</span>${skill.realLife}</p>
        <p><span class="kicker">${icon('lucide:graduation-cap')} ${PROGRAMS[skill.program].name}</span></p>
        <div class="vc-list">${(student ? dedupe(skill.vcNow.core, c) : skill.vcNow.core.map((id) => c.vc[id])).map((e) => vcChip(e, { hideLevel: student }))}${(student ? dedupe(skill.vcNow.extend, c).filter((e) => !dedupe(skill.vcNow.core, c).some((x) => x.substrand === e.substrand)) : skill.vcNow.extend.map((id) => c.vc[id])).map((e) => vcChip(e, { extend: true, hideLevel: student }))}</div>
      </aside>
    </div>
  </section>`;

  let body;
  // Staff can preview any written course, whatever its lock state.
  if ((st === 'locked' || st === 'soon') && (student || !skill.course)) {
    const reqs = requirements(skill);
    body = html`${hero}<div class="panel center-panel">
      ${icon(st === 'locked' ? 'lucide:lock' : 'lucide:hammer', 'big-ico')}
      <h2>${st === 'locked' ? 'Locked for now' : 'Coming soon'}</h2>
      ${st === 'locked' ? html`<p>To unlock this skill:</p><ul>${reqs.map((r) => html`<li>${r.text}</li>`)}</ul>` : html`<p>This mini course is still being built. It will cover: ${skill.literacy}</p>`}
      <a class="btn btn-ink" href="/map">${icon('lucide:map')} Back to the map</a></div>`;
  } else if (!p && student) {
    body = html`${hero}<div class="panel start-panel">
      <div>
        <h2>Ready?</h2>
        <p>${skill.realLife}</p>
        <ul class="start-steps">${STEPS.map((s) => html`<li>${icon(s.icon)}${s.label}</li>`)}</ul>
      </div>
      <form method="post" action="/skill/${skill.id}/start"><button class="btn btn-zone btn-xl">${icon('lucide:rocket')} Start this skill</button></form>
    </div>`;
  } else {
    const stepBody = {
      brief: () => html`${briefStep(skill)}${doneBtn('brief', 'Got it — next')}`,
      watch: () => html`${watchStep(skill)}${doneBtn('watch')}`,
      read: () => html`${readStep(skill)}${doneBtn('read')}`,
      see: () => html`${seeStep(skill)}${doneBtn('see')}`,
      workbook: () => html`${workbookStep(skill)}${doneBtn('workbook', 'I’ve done my workbook pages')}`,
      check: () => checkStep(skill, p, quizResult),
      show: () => (student ? showStep(skill, p, readiness(skill, p, passPct))
        : html`<div class="panel"><h2>Show it</h2><div class="callout-box">${icon('lucide:target')}<div><strong>Final task</strong><p>${skill.course.show.task}</p></div></div><ul>${skill.course.show.checklist.map((x) => html`<li>${x}</li>`)}</ul><p><b>Level Up:</b> ${skill.course.show.levelUp}</p></div>`),
    }[step] || (() => '');
    // Staff see a preview: no progress is saved, and they can switch reading-level version.
    const previewBar = student ? '' : html`<div class="preview-bar">${icon('lucide:eye')} <span>Teacher preview of the <b>${LEVELS[skill.level].symbol} ${LEVELS[skill.level].label}</b> version. Nothing is saved. Switch: ${LEVEL_IDS.map((l) => html`<a href="/skill/${skill.id}?step=${step}&level=${l}">${LEVELS[l].symbol} ${LEVELS[l].label}</a> `)}</span></div>`;
    body = html`${hero}${previewBar}<div class="skill-layout">${stepNav(skill, p, step)}<div class="step-body">${stepBody()}</div></div>`;
  }
  return page(req, { title: skill.title, body, theme: z, active: '/map', program: skill.program });
}

// ---------------- Badges & curriculum ----------------

export function badgesPage(req, { earned }) {
  const all = allBadges(req.user.program);
  const groups = [['skill', 'Skill badges'], ['zone', 'Zone badges'], ['milestone', 'Milestones']];
  const body = html`<section class="page-head"><p class="eyebrow">Trophy cabinet</p><h1>Badges <span class="hl">${earned.size} / ${all.length}</span></h1></section>
  ${groups.map(([k, label]) => html`<h2 class="section-title">${label}</h2>
    <div class="badge-grid">${all.filter((b) => b.kind === k).map((b) => {
      const e = earned.get(b.id);
      return html`<div class="badge ${e ? 'earned' : 'unearned'} ${e && !e.seen ? 'new' : ''}">
        ${sticker(e ? b.icon : 'lucide:lock', { color: e ? b.color : '#e7e2d8', ink: e ? b.ink : '#9a948a', size: 'lg' })}
        <strong>${b.name}</strong><small>${e ? `Earned ${e.awarded_at.slice(0, 10)}` : b.desc}</small>
        ${e && !e.seen ? html`<span class="new-tag">NEW</span>` : ''}
      </div>`;
    })}</div>`)}`;
  return page(req, { title: 'Badges', body, active: '/badges' });
}

export const GRID_LEVELS = [3, 4, 5, 6, 7, 8, 9, 10];

// Staff view: sub-strands × levels. Each cell holds every official content description
// at that level; a cell lights up when the student has evidence for any of them.
export function curriculumGrid(cov, { levels = GRID_LEVELS, program = 'f10' } = {}) {
  const c = content(program);
  if (c.curriculum.kind === 'study-design') return outcomeGrid(cov, c);
  return html`<div class="vc-grid-wrap"><table class="vc-grid">
    <thead><tr><th scope="col">Strand › sub-strand</th>${levels.map((l) => html`<th scope="col">Level ${l}</th>`)}</tr></thead>
    <tbody>${Object.entries(c.curriculum.focusAreas).map(([key, fa]) => {
      const row = levels.map((l) => c.curriculum.entries.filter((e) => e.level === l && e.focus === key));
      if (row.every((x) => !x.length)) return '';
      return html`<tr>
      <th scope="row"><small>${fa.strand}</small>${fa.substrand}</th>
      ${row.map((es) => {
        if (!es.length) return html`<td class="na"></td>`;
        const hit = es.filter((e) => cov[e.id]);
        const tip = es.map((e) => `${cov[e.id] ? '✓' : '·'} ${e.code}: ${e.text}${cov[e.id] ? ' — ' + cov[e.id].map((h) => h.skill.title).join(', ') : ''}`).join('\n');
        return html`<td class="${hit.length ? 'hit' : ''}" title="${tip}">${hit.length ? html`${icon('lucide:check')}<span>${hit.length}/${es.length}</span>` : html`<span class="cd-n">${es.length}</span>`}</td>`;
      })}
    </tr>`;
    })}</tbody>
  </table></div>`;
}

// Staff view for a study design (VCE VM): one row per outcome, key knowledge and key skills.
function outcomeGrid(cov, c) {
  const cell = (es) => {
    const hit = es.filter((e) => cov[e.id]);
    const tip = es.map((e) => `${cov[e.id] ? '✓' : '·'} ${e.code}: ${e.text}${cov[e.id] ? ' — ' + cov[e.id].map((h) => h.skill.title).join(', ') : ''}`).join('\n');
    return html`<td class="${hit.length ? 'hit' : ''}" title="${tip}">${hit.length ? icon('lucide:check') : ''}<span class="${hit.length ? '' : 'cd-n'}">${hit.length}/${es.length}</span></td>`;
  };
  return html`<div class="vc-grid-wrap"><table class="vc-grid outcome-grid">
    <thead><tr><th scope="col">Unit › outcome</th><th scope="col">Key knowledge</th><th scope="col">Key skills</th></tr></thead>
    <tbody>${c.curriculum.outcomes.map((o) => {
      const es = c.curriculum.entries.filter((e) => e.focus === o.id);
      return html`<tr><th scope="row"><small>Unit ${o.unit} · Outcome ${o.outcome}</small>${o.title}</th>
        ${cell(es.filter((e) => e.kind === 'Key knowledge'))}${cell(es.filter((e) => e.kind === 'Key skill'))}</tr>`;
    })}</tbody>
  </table></div>`;
}

export function myCurriculumPage(req, { progress, level, program = 'f10' }) {
  const c = content(program);
  const cov = coverage(progress, level, program);
  const sd = c.curriculum.kind === 'study-design';
  // Students see sub-strands, not curriculum levels (levels would reveal their reading level).
  const bySub = {};
  for (const [id, hits] of Object.entries(cov)) {
    const e = c.vc[id];
    const key = e.focus;
    bySub[key] ||= new Map();
    for (const h of hits) bySub[key].set(h.skill.id, h);
  }
  const areas = Object.entries(c.curriculum.focusAreas);
  const body = html`<section class="page-head"><p class="eyebrow">My Curriculum</p>
    <h1>What you’ve <span class="hl">shown you can do</span></h1>
    <p class="lede">${sd ? 'Every skill links to the outcomes in VCE VM Literacy. Here’s what your finished skills count towards.' : 'Every skill links to the Victorian Curriculum for English. Here’s what your finished skills count towards.'}</p></section>
  ${Object.keys(bySub).length ? '' : empty('Finish your first skill and it will show up here.', 'lucide:graduation-cap')}
  ${(sd ? [...new Set(Object.values(c.curriculum.focusAreas).map((fa) => fa.strand))] : ['Literacy', 'Language', 'Literature']).map((strand) => html`
    <h2 class="section-title">${icon(sd ? 'lucide:layers' : strand === 'Literacy' ? 'lucide:book-open' : strand === 'Language' ? 'lucide:message-square-quote' : 'lucide:feather')} ${strand}</h2>
    <div class="mc-grid">${areas.filter(([, fa]) => fa.strand === strand).map(([key, fa]) => {
      const hits = [...(bySub[key]?.values() || [])];
      return html`<div class="mc-card ${hits.length ? 'hit' : ''}">
        <span class="mc-tick">${icon(hits.length ? 'lucide:check' : 'lucide:circle-dashed')}</span>
        <strong>${fa.substrand}</strong>
        <div class="vc-from">${hits.length ? hits.map((h) => html`<a href="/skill/${h.skill.id}" class="mini-skill" style="--zone:${h.skill.zoneObj.color};--zone-ink:${h.skill.zoneObj.ink}">${icon(h.skill.icon)} ${h.skill.title}${h.extend ? ' ★' : ''}</a>`) : html`<small class="muted">Not yet — keep going!</small>`}</div>
      </div>`;
    })}</div>`)}`;
  return page(req, { title: 'My Curriculum', body, active: '/my-curriculum', wide: true });
}
