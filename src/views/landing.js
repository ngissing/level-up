// The public front page (what you see at "/" before you log in).
// Everything on it is real: the scam message, the story, the question and the counts all come
// from the course content, so the page never drifts from the app.
import { html, icon, md, mdInline, raw, mdLines } from '../html.js';
import { head, asset, logo } from './layout.js';
import { allPrograms, getSkill, courseFor, STEPS, plainText } from '../content.js';
import { PROGRAMS } from '../programs.js';

// The opening message of "Spot the Scam", cut into the four red flags the course teaches.
const SCAM = [
  ['Reaction', 'Hi Mum, I dropped my phone 😩'],
  ['Random', 'this is my new number.'],
  ['Request', 'Can u help me pay a bill'],
  ['Rush', 'today? Need it urgent x'],
];

// Real texts students work with. The "specimen" is a line of the kind they learn to read.
const TEXTS = [
  ['read-your-payslip', 'GROSS $312.40 · TAX $18.00 · SUPER $37.49 · NET ?'],
  ['crack-the-job-ad', '“Must thrive in a fast-paced environment.”'],
  ['beat-the-fine-print', '*Min. term 12 months. Early exit fee applies.'],
  ['vpc-read-the-label', 'Sugars 28.0 g per 100 g · Serving size 30 g'],
  ['vm-handle-with-care', 'DANGER. Causes severe skin burns and eye damage.'],
  ['l-plate-ready', 'Q14. Who must give way at this intersection?'],
  ['complain-like-a-pro', 'Dear Customer Service, On 2 June I bought…'],
  ['vpc-get-on-the-roll', 'Are you 16 or older?  ☐ Yes   ☐ No'],
];

const STEP_NOTES = {
  brief: 'Why it matters, what you’ll be able to do, the words you’ll need. And you pick your own topic.',
  watch: 'A two-minute explainer, read aloud, that works on a phone or the classroom board.',
  read: 'A short article and a true story with its source. Written three ways, so everyone can read it.',
  see: 'Diagrams that show how the text is built: where to look and what to ignore.',
  workbook: 'A printed workbook. Pen on paper, scaffolded, with a model of what good looks like.',
  check: 'A quick quiz with instant feedback. Miss one? See why, and try again.',
  show: 'Do it for real: send the email, make the call, check the payslip. A teacher signs it off.',
};

const LEVEL_TABS = [['support', 'Lighter'], ['core', 'Middle'], ['extend', 'Fuller']];

export function landingPage(req) {
  const programs = allPrograms();
  const ready = programs.flatMap((c) => Object.values(c.skills).filter((s) => s.ready));
  const total = programs.reduce((n, c) => n + Object.keys(c.skills).length, 0);
  const stories = ready.reduce((n, s) => n + (courseFor(s, 'core').read?.caseStudies?.length || 0), 0);

  const scam = getSkill('spot-the-scam');
  const scamCourse = courseFor(scam, 'core');
  const flags = Object.fromEntries(scamCourse.explainer.scenes.filter((s) => s.kind === 'flag').map((s) => [s.title, s]));
  const stat = scamCourse.explainer.scenes.find((s) => s.kind === 'stat');
  const sender = scamCourse.explainer.scenes.find((s) => s.kind === 'message')?.sender || 'Unknown number';
  const scamSource = scamCourse.read.caseStudies[0].source;
  const question = scamCourse.quiz.questions.find((q) => /red flag/i.test(q.q)) || scamCourse.quiz.questions[0];

  const storySkill = getSkill('read-your-payslip');
  const storyAt = (l) => courseFor(storySkill, l).read.caseStudies[0];
  const words = (t) => plainText(t).split(/\s+/).filter(Boolean).length;

  // Two rows of course names, in zone colours, for the tape.
  const chip = (s) => html`<span class="tape-chip" style="--c:${s.zoneObj.color}">${icon(s.icon)} ${s.title}</span>`;
  const half = Math.ceil(ready.length / 2);
  const rows = [ready.slice(0, half), ready.slice(half)];

  const body = html`
<header class="lp-top">
  ${logo()}
  <nav aria-label="Page"><a href="#inside">What’s inside</a><a href="#how">How it works</a><a href="#teachers">For teachers</a></nav>
  <a class="btn btn-zone" href="/login">${icon('lucide:log-in')} Log in</a>
</header>

<main id="main" class="lp">
  <section class="lp-hero">
    <div class="lp-hero-copy">
      <p class="lp-kicker">Literacy for 14 to 17 year olds who are over school English</p>
      <h1>Read this text. <span class="lp-swipe">Would you&nbsp;pay?</span></h1>
      <p class="lp-lede">That’s lesson one. Level Up teaches reading, writing and speaking through the things that actually land on a young person’s phone, bench or doormat: scam texts, payslips, job ads and fine print.</p>
      <p class="btn-row">
        <a class="btn btn-ink btn-lg" href="/login">${icon('lucide:log-in')} Log in</a>
        <a class="btn btn-ghost btn-lg" href="#inside">See what’s inside ${icon('lucide:arrow-down')}</a>
      </p>
    </div>

    <div class="lp-phone-wrap" data-hunt>
      <p class="lp-nudge" data-nudge>${icon('lucide:mouse-pointer-click')}<span>Try it: tap the four red flags.</span></p>
      <div class="lp-phone">
        <div class="lp-phone-bar"><span>${sender}</span><small>Text message · now</small></div>
        <p class="lp-bubble">${SCAM.map(([flag, text], i) => html`<button type="button" class="lp-flag" data-flag="${flag}" aria-pressed="false" aria-label="${text} (tap if this is a red flag)">${text}</button>${i < SCAM.length - 1 ? ' ' : ''}`)}</p>
        <span class="lp-stamp" aria-hidden="true">Scam</span>
      </div>
      <ul class="lp-flags" aria-label="The four red flags">
        ${SCAM.map(([flag]) => html`<li data-for="${flag}">${icon(flags[flag]?.icon || 'lucide:flag')}<span><b>${flag}</b><em>${flags[flag]?.text || ''}</em></span></li>`)}
      </ul>
      <p class="lp-hunt-status" role="status" aria-live="polite" data-status>0 of 4 found</p>
      <p class="lp-hunt-done" data-done hidden>That was the first two minutes of <b>${scam.title}</b>, one of ${ready.length} mini courses.</p>
    </div>
  </section>

  ${stat ? html`<aside class="lp-fact">
    <b>${stat.big}</b>
    <span>${stat.title}. ${String(stat.sub || '').replace(/\s*Source:.*$/, '')}</span>
    <a href="${scamSource.url}" target="_blank" rel="noopener">Source: ACCC ${icon('lucide:external-link')}</a>
  </aside>` : ''}

  <div class="lp-tape" aria-hidden="true">
    ${rows.map((r, i) => html`<div class="tape-row ${i ? 'rev' : ''}"><div class="tape-track">${r.map(chip)}${r.map(chip)}</div></div>`)}
  </div>
  <p class="sr-only">${ready.length} mini courses, including ${ready.slice(0, 12).map((s) => s.title).join(', ')} and more.</p>

  <section class="lp-sec" id="inside">
    <header class="lp-sec-head"><span class="lp-num">01</span>
      <div><h2>Not novels. <span class="hl">These.</span></h2>
      <p>Every mini course is built around a real text that a young person will have to deal with, probably this year. ${ready.length} courses are ready now, with ${stories} true stories. Each story has its source.</p></div>
    </header>
    <div class="lp-texts">
      ${TEXTS.map(([id, specimen], i) => { const s = getSkill(id); if (!s) return ''; return html`<article class="lp-text" style="--c:${s.zoneObj.color};--tilt:${[-1.6, 1.2, -0.8, 1.8, -1.2, 0.9, -1.9, 1.4][i % 8]}deg">
        <p class="lp-specimen">${specimen}</p>
        <h3>${icon(s.icon)} ${s.title}</h3>
        <p>${s.tagline}</p>
        <small>${PROGRAMS[s.program].curriculumShort}</small>
      </article>`; })}
    </div>
  </section>

  <section class="lp-sec lp-levels" id="levels">
    <header class="lp-sec-head"><span class="lp-num">02</span>
      <div><h2>One true story. <span class="hl">Three ways in.</span></h2>
      <p>Every article, story and question is written three times. A teacher quietly sets which one each student gets. Nobody is labelled, and nobody gets the “easy sheet” in front of their mates.</p></div>
    </header>
    <div class="lp-reader" data-reader>
      <div class="lp-dial" role="tablist" aria-label="How much reading">
        ${LEVEL_TABS.map(([l, label], i) => html`<button type="button" role="tab" id="tab-${l}" aria-controls="read-${l}" aria-selected="${i === 0 ? 'true' : 'false'}" ${i === 0 ? '' : raw('tabindex="-1"')}>${label}<small>${words(storyAt(l).body)} words</small></button>`)}
      </div>
      ${LEVEL_TABS.map(([l], i) => { const cs = storyAt(l); return html`<article class="lp-read" role="tabpanel" id="read-${l}" aria-labelledby="tab-${l}" ${i === 0 ? '' : raw('hidden')}>
        <h3>${cs.title}</h3>
        <div class="prose">${md(cs.body)}</div>
        <p class="source">Source: <a href="${cs.source.url}" target="_blank" rel="noopener">${cs.source.name}</a></p>
      </article>`; })}
      <p class="lp-aside">${icon('lucide:corner-left-up')} Same facts. Same source. Same grown-up topic. Only the reading load changes. This one is from <b>${storySkill.title}</b>.</p>
    </div>
  </section>

  <section class="lp-sec" id="how">
    <header class="lp-sec-head"><span class="lp-num">03</span>
      <div><h2>Seven steps. <span class="hl">Same every time.</span></h2>
      <p>Students always know where they are and what’s next. Each course is a few lessons long. Students work at their own pace and choose their own order.</p></div>
    </header>
    <ol class="lp-steps">
      ${STEPS.map((s, i) => html`<li><span class="lp-step-n">${i + 1}</span>${icon(s.icon)}<h3>${s.label}</h3><p>${STEP_NOTES[s.id] || ''}</p></li>`)}
    </ol>
  </section>

  <section class="lp-sec lp-sticks" id="sticks">
    <header class="lp-sec-head"><span class="lp-num">04</span>
      <div><h2>Built so it <span class="hl">sticks.</span></h2>
      <p>Four things good teachers already do, built into every course.</p></div>
    </header>
    <div class="lp-grid">
      <article class="lp-card c-sun">
        <h3>${icon('lucide:flame')} Warm-ups</h3>
        <p>Finished skills come back as five quick questions: a day later, then three days, then a week, then longer. Get one wrong and it’s back tomorrow.</p>
        <div class="lp-try" data-try>
          <p class="lp-try-q"><small>Try one from ${scam.title}</small>${mdInline(question.q)}</p>
          <div class="lp-try-opts">${question.options.map((o, i) => html`<button type="button" data-right="${i === question.answer ? '1' : '0'}">${mdInline(o)}</button>`)}</div>
          <p class="lp-try-fb" role="status" aria-live="polite" data-explain="${plainText(question.explain)}"></p>
        </div>
      </article>
      <article class="lp-card c-lime">
        <h3>${icon('lucide:medal')} What good looks like</h3>
        <p>Before the final task, students read a finished example, three notes on why it works, and the rubric their teacher will use. No guessing what “good” means.</p>
        ${scamCourse.show.model ? html`<figure class="lp-model"><figcaption>${scamCourse.show.model.kind}</figcaption>${mdLines(scamCourse.show.model.text.split('\n\n').slice(0, 2).join('\n\n'))}</figure>` : ''}
        <table class="lp-rubric" aria-label="Part of a rubric"><thead><tr><th>Getting started</th><th>Got it</th><th>Nailed it</th></tr></thead>
          <tbody><tr>${['start', 'good', 'great'].map((k, i) => html`<td class="${i === 1 ? 'on' : ''}">${scamCourse.show.rubric?.[1]?.[k] || ''}</td>`)}</tr></tbody></table>
      </article>
      <article class="lp-card c-violet">
        <h3>${icon('lucide:hand')} Make it yours</h3>
        <p>Students choose what their final task is about, or bring their own idea. The skill is set. The topic is theirs.</p>
        <ul class="lp-picks">${(scamCourse.show.choices?.options || []).map((o, i) => html`<li class="${i === 1 ? 'on' : ''}">${mdInline(o)}</li>`)}<li>My own idea…</li></ul>
      </article>
      <article class="lp-card c-teal">
        <h3>${icon('lucide:book-open-text')} Reading Room</h3>
        <p>${stories} short true stories to read for interest, sorted by topic. No questions and no marks. Students log anything else they read too: a manga, a manual, the footy news.</p>
        <p class="lp-shelf">${['Money & rip-offs', 'Work', 'Online & AI', 'Courts & rules', 'Music, film & media', 'People power'].map((t) => html`<span>${t}</span>`)}</p>
      </article>
    </div>
  </section>

  <section class="lp-sec lp-teach" id="teachers">
    <header class="lp-sec-head"><span class="lp-num">05</span>
      <div><h2>For teachers: <span class="hl">the boring bits, done.</span></h2>
      <p>Mapped to the official curriculum, word for word. Printable. Trackable. Yours to run.</p></div>
    </header>
    <div class="lp-progs">
      ${programs.map((c) => { const p = PROGRAMS[c.program]; const all = Object.values(c.skills); const n = all.filter((s) => s.ready).length; return html`<article class="lp-prog fam-${p.family}">
        <h3>${icon(p.icon)} ${p.name}</h3>
        <p class="lp-prog-n"><b>${n}</b> of ${all.length} mini courses ready</p>
        <div class="lp-meter" role="img" aria-label="${n} of ${all.length} ready"><span style="width:${(n / all.length) * 100}%"></span></div>
        <p class="lp-prog-src">${p.curriculumName}</p>
      </article>`; })}
    </div>
    <ul class="lp-ticks">
      ${[
        ['lucide:network', 'A curriculum map that shows exactly where each point is taught and assessed.'],
        ['lucide:printer', 'A printable workbook for every course, at each student’s reading level, plus an answer copy.'],
        ['lucide:badge-check', 'A sign-off queue with one-tap rubric marking. Students see what you marked.'],
        ['lucide:clipboard-list', 'A teacher guide for each course: lesson sequence, prep, what tends to go wrong.'],
        ['lucide:volume-2', 'Read-aloud on every page, and a text-size button. Works on a phone.'],
        ['lucide:user', 'A solo option for every group task, so nobody is stuck when a partner is away.'],
        ['lucide:shield-check', 'No ads and no tracking. Nothing on a page loads from outside the app.'],
      ].map(([ic, t]) => html`<li>${icon(ic)}<span>${t}</span></li>`)}
    </ul>
  </section>

  <section class="lp-cta">
    <h2>Ready when you are.</h2>
    <p>Students and teachers log in with the account their school gave them.</p>
    <p class="btn-row"><a class="btn btn-zone btn-xl" href="/login">${icon('lucide:log-in')} Log in</a></p>
    <p class="lp-small">No account? Ask your teacher.</p>
  </section>
</main>

<footer class="lp-foot">
  <p>${logo()}</p>
  <p>Real case studies only, each with a source. The figure at the top of this page is from the <a href="${scamSource.url}" target="_blank" rel="noopener">ACCC</a>. Curriculum points are the official VCAA wording.</p>
</footer>
<script src="${asset('/js/landing.js')}" defer></script>`;

  return html`${head('Literacy for real life', ['/css/shared.css', '/css/app.css', '/css/landing.css'], raw('<meta name="description" content="Self-paced literacy mini courses for teenagers, built around real texts: scam messages, payslips, job ads and fine print. Mapped to the Victorian Curriculum, VCE VM and VPC Literacy.">'))}
<body class="landing role-guest fam-f10">
<a class="skip" href="#main">Skip to content</a>
${body}
</body></html>`;
}
