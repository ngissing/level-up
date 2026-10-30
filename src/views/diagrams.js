// Diagrams shared by the app and the printable workbook.
import { html, icon, mdInline } from '../html.js';

export function phone({ sender, text, time = '9:41', blank = false, big = false }) {
  return html`<div class="phone ${big ? 'phone-big' : ''}">
    <div class="phone-notch"></div>
    <div class="phone-head">${icon('lucide:chevron-left')}<span class="phone-avatar">${icon('lucide:user-round')}</span><span class="phone-sender">${sender || ''}</span></div>
    <div class="phone-body">
      ${blank ? html`<div class="bubble bubble-blank"></div>` : html`<div class="bubble">${text}</div><div class="phone-time">${time}</div>`}
    </div>
  </div>`;
}

export function phoneAnatomy(d, { showAnswers = true } = {}) {
  return html`<figure class="diagram anatomy">
    ${phone({ sender: d.sender, text: d.text, big: true })}
    ${showAnswers ? html`<ol class="callouts">
      ${d.callouts.map((c, i) => html`<li class="callout flag-${c.flag.toLowerCase()}">
        <span class="callout-n">${i + 1}</span>
        <div><b class="flag-tag">${c.flag}</b> <strong>${c.label}</strong><p>${c.note}</p></div>
      </li>`)}
    </ol>` : ''}
  </figure>`;
}

export function flow(d) {
  return html`<figure class="diagram flow">
    ${d.steps.map((s, i) => html`
      <div class="flow-step">
        <span class="flow-icon">${icon(s.icon)}</span>
        <strong>${s.title}</strong>
        <p>${mdInline(s.text)}</p>
      </div>
      ${i < d.steps.length - 1 ? html`<span class="flow-arrow" aria-hidden="true">${icon('lucide:arrow-right')}</span>` : ''}`)}
  </figure>`;
}

export function diagram(d, opts) {
  if (d.type === 'phone-anatomy') return phoneAnatomy(d, opts);
  if (d.type === 'flow') return flow(d);
  return html`<p>Unknown diagram type: ${d.type}</p>`;
}
