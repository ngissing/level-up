// Warm-ups (spaced review) and the Reading Room.
import { html, icon, md, mdInline, raw } from '../html.js';
import { page, sticker, readAloud, sayButton, empty } from './layout.js';
import { plainText, readUnits, audioFor } from '../content.js';
import { readsConfig } from '../reads.js';

const zoneStyle = (skill) => `--zone:${skill.zoneObj.color};--zone-ink:${skill.zoneObj.ink}`;
const fromChip = (skill) => html`<span class="from-chip" style="${zoneStyle(skill)}">${icon(skill.icon)} ${skill.title}</span>`;
const sayText = (q) => `${plainText(q.prompt)} Is it: ${q.options.map(plainText).join('? Or ')}?`;

// ---------------- Warm-up ----------------

export function warmupPage(req, { questions }) {
  const n = questions.length;
  const body = html`<section class="page-head">
    <p class="eyebrow">${icon('lucide:flame')} Warm-up</p>
    <h1>Remember <span class="hl">these?</span></h1>
    <p class="lede">${n} quick question${n === 1 ? '' : 's'} from skills you’ve already finished. Pulling an answer back out of your head is what makes it stick, so have a real go. Getting some wrong is fine.</p>
  </section>
  <form method="post" action="/warmup" class="warmup" data-warmup>
    <div class="wu-dots" aria-hidden="true">${questions.map(() => html`<span></span>`)}</div>
    ${questions.map((q, i) => html`<fieldset class="wu-q" data-item="${q.id}">
      <legend><span class="wu-count">${i + 1} of ${n}</span>${fromChip(q.skill)}
        <span class="wu-prompt">${mdInline(q.prompt)} ${sayButton(sayText(q), null, 'Read question and answers')}</span></legend>
      <input type="hidden" name="item${i}" value="${q.id}">
      <div class="wu-opts">${q.options.map((o, j) => html`<label class="opt"><input type="radio" name="a${i}" value="${j}" required><span>${mdInline(o)}</span></label>`)}</div>
      <div class="wu-fb" aria-live="polite"></div>
      <div class="wu-nav"><button type="button" class="btn btn-ink" data-wu-next hidden>${i === n - 1 ? html`See how I went ${icon('lucide:arrow-right')}` : html`Next ${icon('lucide:arrow-right')}`}</button></div>
    </fieldset>`)}
    <div class="wu-submit"><button class="btn btn-zone btn-lg">${icon('lucide:send')} Check my answers</button></div>
  </form>
  <p class="wu-skip"><a href="/warmup/skip">Not now — take me to the map</a></p>`;
  return page(req, { title: 'Warm-up', body, active: '/map' });
}

const dayWord = (day, today) => {
  const n = Math.round((new Date(`${day}T00:00:00Z`) - new Date(`${today}T00:00:00Z`)) / 86400000);
  return n <= 1 ? 'tomorrow' : n < 7 ? `in ${n} days` : n < 14 ? 'in a week' : n < 28 ? `in ${Math.round(n / 7)} weeks` : n < 50 ? 'in a month' : 'in two months';
};

export function warmupResultPage(req, { results, day }) {
  const right = results.filter((r) => r.right).length;
  const all = right === results.length;
  const body = html`<section class="page-head">
    <p class="eyebrow">${icon('lucide:flame')} Warm-up done</p>
    <h1>${right} of ${results.length} <span class="hl">${all ? 'remembered' : 'remembered'}</span></h1>
    <p class="lede">${all ? 'All of them. Those will come back less often now.' : 'The ones you missed will come back tomorrow. The ones you got will come back later, with a bigger gap each time.'}</p>
  </section>
  <div class="wu-results">${results.map(({ q, chosen, right: ok, next }) => html`<article class="wu-r ${ok ? 'ok' : 'miss'}">
    <header>${icon(ok ? 'lucide:circle-check' : 'lucide:rotate-ccw')}<span class="wu-prompt">${mdInline(q.prompt)}</span></header>
    ${ok ? '' : html`<p class="wu-yours">You said: ${mdInline(q.options[chosen] ?? '—')}</p>`}
    <p class="wu-answer"><b>Answer:</b> ${mdInline(q.options[q.answer])}</p>
    <p class="wu-explain">${mdInline(q.explain || '')}</p>
    <footer>${fromChip(q.skill)}<span class="wu-next">${icon('lucide:calendar-clock')} Back ${dayWord(next, day)}</span></footer>
  </article>`)}</div>
  <p class="btn-row center"><a class="btn btn-zone btn-lg" href="/map">${icon('lucide:map')} On to the map</a></p>`;
  return page(req, { title: 'Warm-up done', body, active: '/map' });
}

export function warmupEmptyPage(req, { done }) {
  const body = html`<div class="panel center-panel">${icon(done ? 'lucide:circle-check' : 'lucide:flame', 'big-ico')}
    <h2>${done ? 'Warm-up done for today' : 'Nothing to warm up yet'}</h2>
    <p>${done ? 'Come back tomorrow for the next one.' : 'Finish a skill and it comes back here as a few quick questions, a day or two later.'}</p>
    <a class="btn btn-ink" href="/map">${icon('lucide:map')} Back to the map</a></div>`;
  return page(req, { title: 'Warm-up', body, active: '/map' });
}

// ---------------- Reading Room ----------------

const RATINGS = [[3, 'lucide:thumbs-up', 'Loved it'], [2, 'lucide:meh', 'It was OK'], [1, 'lucide:thumbs-down', 'Not for me']];
const ratingIcon = (r) => (RATINGS.find(([n]) => n === r) || [])[1];
const ratingPicker = () => html`<div class="rate" role="radiogroup" aria-label="What did you think?">${RATINGS.map(([n, ic, label]) => html`<label class="rate-opt"><input type="radio" name="rating" value="${n}"><span>${icon(ic)} ${label}</span></label>`)}</div>`;

export function readsPage(req, { stories, log, stats, interest }) {
  const cfg = readsConfig();
  const readRefs = new Set(log.filter((l) => l.kind === 'story').map((l) => l.ref));
  const isStudent = req.user.role === 'student';
  const shown = interest ? cfg.interests.filter((i) => i.id === interest) : cfg.interests;
  const body = html`<section class="page-head reads-head">
    <div>
      <p class="eyebrow">${icon('lucide:book-open-text')} Reading Room</p>
      <h1>Read what <span class="hl">you</span> want.</h1>
      <p class="lede">Short, true stories from real life. Pick anything that looks interesting. No questions, no marks. Reading a bit, often, is how reading gets easier.</p>
    </div>
    ${isStudent ? html`<div class="hero-stats">
      <div class="stat"><b>${stats.monthReads}</b><span>read${stats.monthReads === 1 ? '' : 's'} this month</span></div>
      <div class="stat"><b>${stats.monthMinutes}</b><span>minutes this month</span></div>
    </div>` : ''}
  </section>

  <nav class="interest-nav" aria-label="Pick a topic">
    <a href="/reads" class="${interest ? '' : 'on'}">Everything</a>
    ${cfg.interests.map((i) => html`<a href="/reads?interest=${i.id}" class="${interest === i.id ? 'on' : ''}" style="--zone:${i.color}">${icon(i.icon)} ${i.label}</a>`)}
  </nav>

  ${shown.map((i) => {
    const list = stories.filter((s) => s.interest === i.id);
    if (!list.length) return '';
    return html`<section class="shelf" style="--zone:${i.color}">
      <h2 class="section-title">${icon(i.icon)} ${i.label} <small>${list.length} stories</small></h2>
      <div class="shelf-grid">${list.map((s) => html`<a class="story-card ${readRefs.has(s.ref) ? 'read' : ''}" href="/reads/${s.ref}">
        ${sticker(s.icon || i.icon, { color: i.color, size: 'sm' })}
        <strong>${s.title}</strong>
        <small>${icon('lucide:clock')} ${s.minutes} min${readRefs.has(s.ref) ? html` · ${icon('lucide:check')} Read` : ''}</small>
      </a>`)}</div>
    </section>`;
  })}

  <section class="reads-own">
    <div class="panel">
      <h2>${icon('lucide:plus')} Read something else?</h2>
      <p>A book, a manga, a footy article, a car manual, a recipe. If you read it, it counts. Add it to your log.</p>
      ${isStudent ? html`<form method="post" action="/reads/log" class="own-form">
        <label class="field"><span>What did you read?</span><input type="text" name="title" maxlength="120" required placeholder="Title, or what it was about"></label>
        <div class="own-row">
          <label class="field"><span>What kind?</span><select name="kind">${cfg.kinds.map((k) => html`<option>${k}</option>`)}</select></label>
          <label class="field"><span>Minutes</span><input type="number" name="minutes" min="1" max="240" value="15" required></label>
        </div>
        ${ratingPicker()}
        <label class="field"><span>One thing that stuck with you (optional)</span><input type="text" name="note" maxlength="300"></label>
        <button class="btn btn-ink">${icon('lucide:plus')} Add to my log</button>
      </form>` : html`<p class="muted">Students can log their own reading here.</p>`}
    </div>
    <div class="panel">
      <h2>${icon('lucide:compass')} Find more to read</h2>
      <ul class="finds">${cfg.finds.map((f) => html`<li><a href="${f.url}" target="_blank" rel="noopener">${f.label} ${icon('lucide:external-link')}</a><span>${f.blurb}</span></li>`)}</ul>
      <p class="small muted">These open other websites. Some may be blocked at school.</p>
    </div>
  </section>

  ${isStudent ? html`<section>
    <h2 class="section-title">${icon('lucide:list')} My reading log <small>${stats.reads} read${stats.reads === 1 ? '' : 's'} · ${stats.minutes} minutes in total</small></h2>
    ${log.length ? readingLogList(log.slice(0, 12)) : empty('Nothing yet. Pick a story above, or add something you’ve read.', 'lucide:book-open')}
  </section>` : ''}`;
  return page(req, { title: 'Reading Room', body, active: '/reads', wide: true });
}

export function readingLogList(log) {
  return html`<ul class="read-log">${log.map((l) => html`<li>
    <span class="rl-ico">${icon(ratingIcon(l.rating) || 'lucide:book-open')}</span>
    <span class="rl-main"><b>${l.kind === 'story' && l.ref ? html`<a href="/reads/${l.ref}">${l.title}</a>` : l.title}</b>
      <small>${l.kind === 'story' ? 'Reading Room story' : l.kind} · ${l.minutes} min · ${String(l.created_at).slice(0, 10)}</small>
      ${l.note ? html`<em>“${l.note}”</em>` : ''}</span>
  </li>`)}</ul>`;
}

export function storyPage(req, { story, logged }) {
  const cfg = readsConfig();
  const { cs, skill, course, i } = story;
  const interest = cfg.interests.find((x) => x.id === story.interest) || cfg.interests[0];
  const u = readUnits(course), audio = audioFor(skill.id);
  const isStudent = req.user.role === 'student';
  const sameProgram = !isStudent || skill.program === req.user.program;
  const body = html`<article class="story" style="--zone:${interest.color}">
    <a class="crumb" href="/reads?interest=${interest.id}">${icon('lucide:arrow-left')} Reading Room · ${interest.label}</a>
    <header class="story-head">
      ${sticker(cs.icon || interest.icon, { color: interest.color, size: 'lg' })}
      <div><h1>${cs.title}</h1>
        <p class="story-meta">${icon('lucide:clock')} ${story.minutes} min read · a true story ${readAloud(u.cases[i], audio(u.cases[i]), 'Read it to me')}</p></div>
    </header>
    <div class="prose story-body">${md(cs.body)}</div>
    <div class="think"><strong>${icon('lucide:lightbulb')} Something to think about</strong><ul>${cs.think.map((t) => html`<li>${t}</li>`)}</ul></div>
    <p class="source">Source: <a href="${cs.source.url}" target="_blank" rel="noopener">${cs.source.name}</a></p>
    ${sameProgram ? html`<p class="story-from">${icon('lucide:map-pin')} This story is from the skill <a href="/skill/${skill.id}">${skill.title}</a>.</p>` : ''}
    ${isStudent ? html`<form method="post" action="/reads/${story.ref}/done" class="story-done panel">
      <h2>${logged ? html`${icon('lucide:circle-check')} In your reading log` : 'Finished?'}</h2>
      <p>${logged ? 'Change your mind about it? Update it here.' : 'Add it to your reading log. What did you think?'}</p>
      ${ratingPicker()}
      <label class="field"><span>One thing that stuck with you (optional)</span><input type="text" name="note" maxlength="300" value="${logged?.note || ''}"></label>
      <div class="btn-row"><button class="btn btn-zone">${icon('lucide:plus')} ${logged ? 'Update my log' : 'Add to my reading log'}</button>
        <a class="btn btn-ghost" href="/reads">${icon('lucide:book-open-text')} Pick another story</a></div>
    </form>` : ''}
  </article>`;
  return page(req, { title: cs.title, body, active: '/reads' });
}
