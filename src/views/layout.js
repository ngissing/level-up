import { html, icon, raw } from '../html.js';
import { LEVELS } from '../levels.js';

const FONTS = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Lexend:wght@300;400;500;600;700&display=swap';

const NAV = {
  student: [['/map', 'Map', 'lucide:map'], ['/badges', 'Badges', 'lucide:award'], ['/my-curriculum', 'My Curriculum', 'lucide:graduation-cap']],
  teacher: [['/teacher', 'Dashboard', 'lucide:layout-dashboard'], ['/teacher/skills', 'Mini courses', 'lucide:library'], ['/teacher/curriculum', 'Curriculum map', 'lucide:network']],
  admin: [['/teacher', 'Dashboard', 'lucide:layout-dashboard'], ['/teacher/skills', 'Mini courses', 'lucide:library'], ['/teacher/curriculum', 'Curriculum map', 'lucide:network'], ['/admin', 'Accounts', 'lucide:users']],
};

export function head(title, extraCss = []) {
  return html`<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Level Up</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${extraCss.map((c) => html`<link rel="stylesheet" href="${c}">`)}
</head>`;
}

export function logo() {
  return html`<a class="logo" href="/" aria-label="Level Up home">
    <span class="logo-mark">${icon('lucide:chevrons-up')}</span>
    <span class="logo-word">Level&nbsp;Up</span>
  </a>`;
}

export function page(req, { title, body, active = '', theme = null, wide = false }) {
  const u = req.user;
  const nav = u ? NAV[u.role] : [];
  const style = theme ? `--zone:${theme.color};--zone-ink:${theme.ink}` : '';
  return html`${head(title, ['/css/shared.css', '/css/app.css'])}
<body class="role-${u?.role || 'guest'}" style="${style}" ${u?.role === 'student' ? raw(`data-rl="${u.reading_level}"`) : ''}>
<a class="skip" href="#main">Skip to content</a>
<header class="topbar">
  ${logo()}
  ${u ? html`<nav class="mainnav" aria-label="Main">
    ${nav.map(([href, label, ic]) => html`<a href="${href}" class="${active === href ? 'on' : ''}">${icon(ic)}<span>${label}</span></a>`)}
  </nav>
  <div class="me">
    <button class="tool-btn" type="button" data-textsize title="Change text size" aria-label="Change text size">${icon('lucide:a-large-small')}</button>
    <details class="me-menu">
      <summary><span class="avatar" aria-hidden="true">${initials(u.name)}</span><span class="me-name">${u.name.split(' ')[0]}</span></summary>
      <div class="me-pop">
        <p class="me-role">${u.role === 'student' ? 'Student' : u.role === 'teacher' ? 'Teacher' : 'Admin'} · ${u.username}</p>
        <a href="/account/password">${icon('lucide:key-round')} Change password</a>
        <form method="post" action="/logout"><button>${icon('lucide:log-out')} Log out</button></form>
      </div>
    </details>
  </div>` : ''}
</header>
${req.flash ? html`<div class="flash flash-${req.flash.type}" role="status">${icon(req.flash.type === 'error' ? 'lucide:circle-alert' : 'lucide:party-popper')}<span>${req.flash.text}</span></div>` : ''}
<main id="main" class="${wide ? 'wide' : ''}">${body}</main>
<script src="/js/app.js" defer></script>
</body></html>`;
}

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

// A coloured "sticker" chip used for zones, badges and skill icons.
export function sticker(ic, { color = '#C6F432', ink = '#111', size = 'md', cls = '' } = {}) {
  return html`<span class="sticker sticker-${size} ${cls}" style="--s-bg:${color};--s-ink:${ink}">${icon(ic)}</span>`;
}

// hideLevel: students never see curriculum level numbers (they would reveal reading level).
export function vcChip(entry, { extend = false, hideLevel = false } = {}) {
  if (!entry) return '';
  return hideLevel
    ? html`<span class="vc-chip ${extend ? 'vc-ext' : ''}">${entry.strand} › ${entry.substrand}${extend ? html` <em>Level Up</em>` : ''}</span>`
    : html`<span class="vc-chip ${extend ? 'vc-ext' : ''}" title="${entry.code}: ${entry.text}"><b>${entry.code}</b> ${entry.substrand}${extend ? html` <em>Level Up</em>` : ''}</span>`;
}

export function readAloud(targetSelector, label = 'Read to me') {
  return html`<button class="read-btn" type="button" data-read="${targetSelector}">${icon('lucide:volume-2')}<span>${label}</span></button>`;
}

export const empty = (text, ic = 'lucide:inbox') => html`<div class="empty">${icon(ic)}<p>${text}</p></div>`;
export { raw };

// Staff-only reading level tag.
export function levelTag(id, { short = false } = {}) {
  const l = LEVELS[id] || LEVELS.core;
  return short
    ? html`<span class="rl-sym" title="Reading level: ${l.label} (${l.years})">${l.symbol}</span>`
    : html`<span class="rl rl-${l.id}" title="${l.years}">${l.symbol} ${l.label}</span>`;
}
