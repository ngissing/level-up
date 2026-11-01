// Printable A4 workbook. Each mini course lists typed "blocks" in
// course.workbook.pages; a block with `pagebreak: true` starts a new sheet.
import QRCode from 'qrcode';
import { html, icon, md, mdInline, raw } from '../html.js';
import { head, sticker } from './layout.js';
import { phone, flow, documentCard } from './diagrams.js';
import { content, workbookSheets } from '../content.js';
import { LEVELS } from '../levels.js';
import { PROGRAMS, familyOf } from '../programs.js';

const lines = (n, cls = '') => html`<div class="lines ${cls}">${Array.from({ length: n }, () => html`<span></span>`)}</div>`;
const lvl = () => html`<span class="wb-lvl">${icon('lucide:star')} Level Up</span>`;

// Deterministic shuffle so the vocab match is the same every print.
function shuffle(arr, seed = 7) {
  const a = arr.map((v, i) => ({ v, k: Math.sin(seed * (i + 1)) * 10000 % 1 }));
  return a.sort((x, y) => x.k - y.k).map((x) => x.v);
}

function blockTitle(b, ic) {
  return html`<h2 class="wb-h">${ic ? html`<span class="wb-h-ico">${icon(ic)}</span>` : ''}${b.title}</h2>
  ${b.instructions ? html`<p class="wb-instr">${icon('lucide:pencil')}<span>${mdInline(b.instructions)}</span></p>` : ''}`;
}

function qList(items, start = 1) {
  return html`<ol class="wb-qs" start="${start}">${items.map((q) => html`<li class="${q.levelUp ? 'is-lvl' : ''}">
    <p>${mdInline(q.q)} ${q.levelUp ? lvl() : ''}</p>
    ${q.boxes ? html`<div class="wb-boxes">${q.boxes.map((b) => html`<div><b>${b}</b></div>`)}</div>` : ''}
    ${q.lines ? lines(q.lines) : ''}
  </li>`)}</ol>`;
}

const BLOCKS = {
  goals(b, { skill, c }) {
    const br = skill.course.brief;
    return html`${blockTitle({ title: 'Your mission' }, 'lucide:flag')}
    <div class="wb-hook">${md(br.why)}</div>
    <div class="wb-two">
      <div class="wb-card"><h3>${icon('lucide:circle-check')} By the end I can…</h3>
        <ul class="wb-tick">${br.canDo.map((x) => html`<li><span class="tickbox"></span><span>${mdInline(x)}</span></li>`)}</ul></div>
      <div class="wb-card wb-card-zone"><h3>${icon('lucide:target')} How I’ll show it</h3><p>${br.showIt}</p>
        <h3>${icon('lucide:graduation-cap')} ${PROGRAMS[skill.program].curriculumShort}</h3>
        <ul class="wb-vc">${[...new Set(skill.vcNow.core.map((id) => c.vc[id].substrand))].map((sub) => html`<li>${sub}</li>`)}</ul>
        <p class="wb-small">${icon('lucide:star')} Level Up tasks stretch you further.</p>
      </div>
    </div>`;
  },

  'vocab-match'(b, { skill }) {
    const v = skill.course.brief.vocab;
    const meanings = shuffle(v.map((x, i) => ({ m: x.meaning, i })));
    return html`${blockTitle(b, 'lucide:book-a')}
    <div class="wb-match${v.length > 8 ? ' wb-match-tight' : ''}">
      <ul>${v.map((x) => html`<li><b>${x.word}</b><span class="dot"></span></li>`)}</ul>
      <ul>${meanings.map((x) => html`<li><span class="dot"></span>${x.m}</li>`)}</ul>
    </div>
`;
  },

  reading(b, { skill }) {
    const a = skill.course.read.articles[b.article || 0];
    return html`${blockTitle(b, 'lucide:book-open')}
    <article class="wb-article">${md(a.body)}</article>`;
  },

  questions(b) { return html`${blockTitle(b, 'lucide:circle-help')}${qList(b.items)}`; },
  scenarios(b) { return html`${blockTitle(b, 'lucide:messages-square')}${qList(b.items)}`; },

  'phone-annotate'(b, { skill }) {
    const d = skill.course.diagrams[b.diagram || 0];
    return html`${blockTitle(b, 'lucide:search')}
    <div class="wb-annotate">
      <div class="wb-labels">${['Rush', 'Reaction'].map((f) => html`<div class="label-slot"><span class="flag-tag flag-${f.toLowerCase()}">${f}</span>${lines(3)}</div>`)}</div>
      ${phone({ sender: d.sender, text: d.text, big: true })}
      <div class="wb-labels">${['Request', 'Random'].map((f) => html`<div class="label-slot"><span class="flag-tag flag-${f.toLowerCase()}">${f}</span>${lines(3)}</div>`)}</div>
    </div>
    <p class="wb-q">Pick one red flag. Why would it work on someone?</p>${lines(5)}`;
  },

  // A document with numbered markers and a table to explain each one.
  'doc-annotate'(b, { skill, answers }) {
    const d = skill.course.diagrams[b.diagram || 0];
    return html`${blockTitle(b, 'lucide:search')}
    <div class="wb-doc">${documentCard(d)}</div>
    ${b.wordBank?.length ? html`<p class="wb-starters"><b>${icon('lucide:sparkles')} Word bank</b>${b.wordBank.map((w) => html`<span>${w}</span>`)}</p>` : ''}
    <table class="wb-table wb-doc-table"><thead><tr><th>No.</th>${(b.columns || ['What is it?', 'What does it tell you?']).map((c) => html`<th>${c}</th>`)}</tr></thead>
      <tbody>${d.callouts.map((c) => html`<tr><td class="eg">${c.n}</td>${answers ? html`<td>${c.label}</td><td>${c.note}</td>` : html`<td class="blank"></td><td class="blank"></td>`}</tr>`)}</tbody></table>`;
  },

  sort(b, { answers }) {
    return html`${blockTitle(b, 'lucide:shuffle')}
    <div class="wb-sort">${b.cards.map((card, i) => html`<div class="sort-card">
      <div class="sort-top"><span class="sort-n">${i + 1}</span><span class="sort-from">${icon('lucide:message-circle')} ${card.from}</span></div>
      <p class="sort-msg">${card.text}</p>
      <div class="sort-ticks">${(b.choices || ['Scam', 'Legit', 'Not sure']).map((t) => html`<span class="${answers && card.answer === t ? 'ans' : ''}"><i class="tickbox"></i>${t}</span>`)}</div>
      <div class="sort-flags"><b>${b.reasonLabel || 'Red flags:'}</b>${answers ? html`<em class="ans-text">${card.flags}</em>` : html`<span class="line"></span>`}</div>
    </div>`)}</div>`;
  },

  'case-study'(b, { skill }) {
    const cs = skill.course.read.caseStudies[b.caseStudy || 0];
    return html`${blockTitle(b, 'lucide:newspaper')}
    <article class="wb-case">${md(cs.body)}<p class="wb-source">Source: ${cs.source.name}</p></article>
    ${qList(b.items)}`;
  },

  table(b) {
    return html`${blockTitle(b, 'lucide:table')}
    <table class="wb-table" ${b.rowHeight ? raw(`style="--row-h:${Number(b.rowHeight)}mm"`) : ''}><thead><tr>${b.columns.map((col) => html`<th>${col}</th>`)}</tr></thead>
    <tbody>${b.rows.map((row) => (Array.isArray(row) ? row : row.cells)).map((r, i) => html`<tr>${r.map((cell) => html`<td class="${cell ? (i === 0 ? 'eg' : '') : 'blank'}">${cell ? mdInline(cell) : ''}</td>`)}</tr>`)}</tbody></table>`;
  },

  equation(b) {
    return html`<div class="wb-eq">${b.parts.map((p, i) => html`${i ? html`<span class="eq-op">${i === b.parts.length - 1 ? '=' : '+'}</span>` : ''}<div class="eq-box eq-${i}">${icon(p.icon)}<b>${p.title}</b><small>${p.text}</small></div>`)}</div>`;
  },

  flow(b, { skill }) {
    const d = skill.course.diagrams[b.diagram || 0];
    return html`${blockTitle(b, 'lucide:route')}${flow(d)}`;
  },

  write(b) {
    return html`${blockTitle(b, 'lucide:pen-line')}
    <p class="wb-prompt">${mdInline(b.prompt)}</p>
    <div class="wb-plan">${(b.plan || []).map((p) => html`<div class="wb-card"><h3>${p.label}</h3>${lines(p.lines)}</div>`)}</div>
    <div class="wb-starters"><b>${icon('lucide:sparkles')} Sentence starters</b>${b.starters.map((s) => html`<span>${s}</span>`)}</div>
    <div class="wb-write">${lines(b.lines || 8, 'lines-tall')}</div>
    ${b.check ? html`<p class="wb-check">${icon('lucide:list-checks')} <b>Check:</b> ${b.check.map((x) => html`<span><i class="tickbox"></i>${x}</span>`)}</p>` : ''}`;
  },

  // Hands-on task done in the real world (VPC courses end with one). Steps tick off,
  // with an optional photo/sketch box, notes and how the student is showing it.
  'do-it'(b, { answers }) {
    const ev = b.evidence || ['Photo or screenshot', 'Recording', 'Teacher saw it'];
    return html`<div class="wb-doit">
      <div class="doit-banner">${icon('lucide:hammer')} HANDS-ON${b.where ? html` · ${b.where}` : ''}</div>
      ${blockTitle(b, 'lucide:hand-metal')}
      ${b.need?.length ? html`<p class="doit-need"><b>${icon('lucide:package')} You need:</b>${b.need.map((x) => html`<span>${mdInline(x)}</span>`)}</p>` : ''}
      <ol class="doit-steps">${b.steps.map((s, i) => html`<li><span class="doit-n">${i + 1}</span><span>${mdInline(s)}</span><i class="tickbox"></i></li>`)}</ol>
      ${b.photo ? html`<div class="doit-photo" style="height:${Number(b.photo)}mm"><span>${icon('lucide:camera')} ${b.photoLabel || 'Stick a photo here, or sketch what you made'}</span></div>` : ''}
      ${(b.notes || []).map((n) => html`<p class="wb-q">${mdInline(n.label)}</p>${answers && n.answer ? html`<p class="ans-text">${n.answer}</p>` : lines(n.lines ?? 2)}`)}
      <div class="doit-evidence"><b>How I’m showing it:</b>${ev.map((e) => html`<span><i class="tickbox"></i>${e}</span>`)}<span class="doit-init">Teacher initials <i class="line"></i></span></div>
    </div>`;
  },

  // Storyboard frames to sketch a video or ad: a box per shot, then what we see and hear.
  storyboard(b) {
    const n = b.frames || 6;
    return html`${blockTitle(b, 'lucide:clapperboard')}
    <div class="wb-story" style="--cols:${b.columns || 3}">${Array.from({ length: n }, (_, i) => html`<div class="story-frame">
      <div class="story-box" style="height:${Number(b.boxHeight || 32)}mm"><span class="story-n">${i + 1}</span>${b.hints?.[i] ? html`<small>${b.hints[i]}</small>` : ''}</div>
      ${(b.rows || ['We see', 'We hear']).map((r) => html`<div class="story-row"><b>${r}:</b><i class="line"></i></div>`)}
    </div>`)}</div>`;
  },

  'levelup-draw'(b) {
    return html`<div class="wb-levelup">
      <div class="lvl-banner">${icon('lucide:star')} LEVEL UP CHALLENGE ${icon('lucide:star')}</div>
      <h2 class="wb-h">${b.title}</h2>
      <p class="wb-prompt">${mdInline(b.prompt)}</p>
      <div class="wb-annotate">
        <div class="wb-labels">${['Rush', 'Reaction'].map((f) => html`<div class="label-slot"><span class="flag-tag flag-${f.toLowerCase()}">${f}</span>${lines(3)}</div>`)}</div>
        ${phone({ sender: 'Unknown', blank: true, big: true })}
        <div class="wb-labels">${['Request', 'Random'].map((f) => html`<div class="label-slot"><span class="flag-tag flag-${f.toLowerCase()}">${f}</span>${lines(3)}</div>`)}</div>
      </div>
      <p class="wb-q">Which red flag did you make strongest? Why would it work?</p>${lines(4)}
    </div>`;
  },

  reflect(b) {
    const faces = [['lucide:frown', 'Not yet'], ['lucide:meh', 'Getting there'], ['lucide:smile', 'Got it'], ['lucide:laugh', 'Could teach it']];
    return html`${blockTitle(b, 'lucide:sparkles')}
    <table class="wb-rate"><thead><tr><th></th>${faces.map(([ic, t]) => html`<th>${icon(ic)}<span>${t}</span></th>`)}</tr></thead>
    <tbody>${b.rate.map((r) => html`<tr><td>${r}</td>${faces.map(() => html`<td><i class="tickbox"></i></td>`)}</tr>`)}</tbody></table>
    ${b.questions.map((q) => html`<p class="wb-q">${q}</p>${lines(2)}`)}`;
  },

  signoff(b, { skill }) {
    const handsOn = skill.course.workbook.pages.some((p) => p.type === 'do-it');
    return html`<div class="wb-signoff">
      <h3>${icon('lucide:badge-check')} Teacher check</h3>
      <div class="so-grid">
        <span><i class="tickbox"></i> Workbook complete</span>
        <span><i class="tickbox"></i> ${handsOn ? 'Hands-on task done' : 'Final mission done'}</span>
        <span><i class="tickbox"></i> Level Up done ★</span>
      </div>
      <div class="so-row"><span>Comment:</span><span class="line"></span></div>
      <div class="so-row"><span>Signed:</span><span class="line"></span><span>Date:</span><span class="line short"></span></div>
    </div>`;
  },
};

function shapes(color) {
  // Decorative shapes for the cover (drawn inline so they always print).
  return html`<svg class="cover-shapes" viewBox="0 0 600 840" aria-hidden="true">
    <circle cx="520" cy="110" r="150" fill="${color}" opacity=".9"/>
    <circle cx="520" cy="110" r="150" fill="none" stroke="#111" stroke-width="5"/>
    <path d="M-20 700 C 80 640, 160 760, 260 700 S 440 640, 620 720 L 620 860 L -20 860 Z" fill="${color}" stroke="#111" stroke-width="5"/>
    <g fill="#111"><path d="M90 150 l10 25 l25 10 l-25 10 l-10 25 l-10 -25 l-25 -10 l25 -10z"/>
    <path d="M480 250 l7 17 l17 7 l-17 7 l-7 17 l-7 -17 l-17 -7 l17 -7z"/></g>
    <g fill="none" stroke="#111" stroke-width="5" stroke-linecap="round"><path d="M250 70 q 20 -20 40 0 t 40 0 t 40 0"/>
    <path d="M540 560 l30 30 M570 560 l-30 30"/></g>
    <g fill="#111">${Array.from({ length: 30 }, (_, i) => html`<circle cx="${380 + (i % 6) * 22}" cy="${330 + Math.floor(i / 6) * 22}" r="3.5"/>`)}</g>
  </svg>`;
}

function cover(skill, c, qr) {
  const z = skill.zoneObj;
  const pages = skill.course.workbook.pages.filter((p) => p.title && p.type !== 'cover');
  return html`<section class="sheet cover" id="page-1">
    ${shapes(z.color)}
    <div class="cover-inner">
      <div class="cover-brand"><span class="logo-mark">${icon('lucide:chevrons-up')}</span> ${brand(skill)} <span class="cover-zone">${icon(z.icon)} ${z.name}</span></div>
      ${sticker(skill.icon, { color: z.color, ink: z.ink, size: 'xxl', cls: 'cover-sticker' })}
      <h1>${skill.title}</h1>
      <p class="cover-tag">${skill.tagline}</p>
      <p class="cover-real">${icon('lucide:hand-heart')} <span><b>Real-life skill:</b> ${skill.realLife}</span></p>
      <div class="cover-fields"><label>Name<span></span></label><label>Class<span></span></label><label>Started<span></span></label></div>
      <div class="cover-bottom">
        <div class="cover-contents"><b>Inside</b><ol>${pages.map((p) => html`<li>${p.title}</li>`)}</ol></div>
        ${qr ? html`<div class="cover-qr">${raw(qr)}<span>${icon('lucide:play')} Scan to watch the explainer</span></div>` : ''}
      </div>
    </div>
  </section>`;
}

const brand = (skill) => (skill.program !== 'f10' ? `Level Up · ${PROGRAMS[skill.program].short}` : 'Level Up Literacy');

function sheet(skill, n, inner) {
  const z = skill.zoneObj;
  const mark = LEVELS[skill.level]?.symbol || '';
  return html`<section class="sheet" id="page-${n}">
    <header class="sheet-head"><span class="sh-ico">${icon(skill.icon)}</span><b>${skill.title}</b><span class="sh-zone">${z.name}</span><span class="sh-name">Name <i></i></span></header>
    <div class="sheet-body">${inner}</div>
    <footer class="sheet-foot"><span>${icon('lucide:chevrons-up')} ${brand(skill)} <i class="ver" title="Version">${mark}</i></span><span>${n}</span></footer>
  </section>`;
}

export async function workbookPage(req, skill, { answers = false, baseUrl = '' } = {}) {
  const c = content(skill.program);
  const z = skill.zoneObj;
  const qr = baseUrl ? await QRCode.toString(`${baseUrl}/skill/${skill.id}?step=watch`, { type: 'svg', margin: 0, color: { dark: '#111111', light: '#ffffff' } }) : null;
  const ctx = { skill, c, answers };

  const sheets = workbookSheets(skill.course);
  const body = sheets.map((blocks, i) => sheet(skill, i + 2, blocks.map((b) => html`<div class="wb-block blk-${b.type}">${BLOCKS[b.type] ? BLOCKS[b.type](b, ctx) : html`<p>Unknown block: ${b.type}</p>`}</div>`)));
  if (answers) {
    body.push(sheet(skill, sheets.length + 2, html`<h2 class="wb-h"><span class="wb-h-ico">${icon('lucide:key-round')}</span>Answers (teacher copy)</h2><div class="wb-article">${md(skill.course.teacher.answers)}</div>`));
  }

  return html`${head(`${skill.title} workbook`, ['/css/shared.css', '/css/workbook.css'])}
  <body style="--zone:${z.color};--zone-ink:${z.ink}" class="${answers ? 'answers' : ''} rl-${skill.level} prog-${skill.program} fam-${familyOf(skill.program)}">
    <div class="print-bar no-print">
      <span>${icon('lucide:notebook-pen')} <b>${skill.title}</b> workbook${answers ? ' — teacher answer copy' : ''} · ${sheets.length + 1 + (answers ? 1 : 0)} A4 pages${req?.user && req.user.role !== 'student' ? ` · ${LEVELS[skill.level].symbol} ${LEVELS[skill.level].label} version` : ''}</span>
      <button onclick="window.print()">${icon('lucide:printer')} Print / Save as PDF</button>
    </div>
    ${cover(skill, c, qr)}
    ${body}
  </body></html>`;
}
