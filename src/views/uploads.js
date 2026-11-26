// Views for students' uploaded work (photos, PDFs, Word files, links).
import { html, raw, icon } from '../html.js';
import { MAX_FILES } from '../uploads.js';

const KIND_ICON = { image: 'lucide:image', pdf: 'lucide:file-text', doc: 'lucide:file-type', link: 'lucide:link' };
const kb = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

// One item: a thumbnail for photos, an icon card for everything else.
export function uploadItem(u, { canDelete = false } = {}) {
  const href = u.kind === 'link' ? u.url : `/uploads/${u.id}`;
  const ext = u.kind === 'link' || u.kind === 'doc';
  const thumb = u.kind === 'image'
    ? html`<img src="/uploads/${u.id}" alt="${u.name}" loading="lazy">`
    : html`<span class="up-ico">${icon(KIND_ICON[u.kind])}</span>`;
  return html`<li class="up-item up-${u.kind}" data-id="${u.id}">
    <a href="${href}" target="_blank" rel="noopener noreferrer" ${u.kind === 'doc' ? raw('download') : ''} class="up-open">${thumb}
      <span class="up-name">${u.name}${ext ? html` ${icon('lucide:external-link')}` : ''}</span>
      ${u.size ? html`<small>${kb(u.size)}</small>` : ''}</a>
    ${canDelete ? html`<form method="post" action="/uploads/${u.id}/delete" class="up-del" data-up-delete><button class="btn btn-sm btn-ghost" aria-label="Remove ${u.name}">${icon('lucide:x')}</button></form>` : ''}
  </li>`;
}

export function uploadList(list, opts = {}) {
  return html`<ul class="up-list" data-up-list>${list.map((u) => uploadItem(u, opts))}</ul>`;
}

// The student's "Add your work" box on the Show it step.
export function uploadBox(skill, list) {
  const full = list.length >= MAX_FILES;
  return html`<section class="up-box" id="work" data-uploads="${skill.id}" data-max="${MAX_FILES}">
    <h3>${icon('lucide:upload')} Add your work</h3>
    <p class="muted small">Take a photo of your workbook pages or your work, or add a file. Up to ${MAX_FILES} things. Only you and your teacher can see them.</p>
    ${uploadList(list, { canDelete: true })}
    <div class="up-actions" ${full ? raw('hidden') : ''}>
      <label class="btn btn-zone up-btn">${icon('lucide:camera')} Take a photo
        <input type="file" accept="image/*" capture="environment" data-up-input hidden></label>
      <label class="btn btn-ghost up-btn">${icon('lucide:paperclip')} Choose a file
        <input type="file" accept="image/*,.pdf,application/pdf,.docx,.doc" multiple data-up-input hidden></label>
    </div>
    <p class="up-status" data-up-status role="status" aria-live="polite"></p>
    <details class="up-link" ${full ? raw('hidden') : ''}>
      <summary>${icon('lucide:video')} Made a video? Add a link instead</summary>
      <form method="post" action="/skill/${skill.id}/uploads/link" class="up-link-form">
        <p class="muted small">Upload your video to your school OneDrive or Google Drive, set it so your teacher can view it, then paste the share link here.</p>
        <label class="field"><span>Link</span><input type="url" name="url" required placeholder="https://" inputmode="url"></label>
        <label class="field"><span>What is it? (optional)</span><input name="label" maxlength="80" placeholder="My toolbox talk video"></label>
        <button class="btn btn-sm btn-ink">${icon('lucide:plus')} Add link</button>
      </form>
    </details>
    <p class="up-consent small">${icon('lucide:shield-check')} Only include other people if they’ve said yes. Don’t include addresses, phone numbers or bank details.</p>
  </section>`;
}
