// Tiny tagged-template HTML helper: interpolations are escaped unless they are
// already-rendered HTML (raw()) or arrays of rendered HTML.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { marked } from 'marked';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export class Raw {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}
export const raw = (s) => new Raw(String(s ?? ''));

export function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function part(v) {
  if (v === null || v === undefined || v === false) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(part).join('');
  return esc(v);
}

export function html(strings, ...vals) {
  let out = strings[0];
  vals.forEach((v, i) => { out += part(v) + strings[i + 1]; });
  return new Raw(out);
}

// Markdown for authored content (trusted: written by teachers/Claude, not students).
marked.setOptions({ gfm: true, breaks: false });
export const md = (s) => raw(marked.parse(String(s ?? '')));
export const mdInline = (s) => raw(marked.parseInline(String(s ?? '')));

// Icons from three open-source sets, inlined so they print and work offline.
//   lucide:name   -> lucide-static (ISC)
//   tabler:name   -> @tabler/icons outline (MIT)
//   ph:name       -> Phosphor fill (MIT), e.g. ph:lightning
const ICON_SOURCES = {
  lucide: (n) => `node_modules/lucide-static/icons/${n}.svg`,
  tabler: (n) => `node_modules/@tabler/icons/icons/outline/${n}.svg`,
  ph: (n) => `node_modules/@phosphor-icons/core/assets/fill/${n}-fill.svg`,
};
const iconCache = new Map();

export function icon(spec, cls = '') {
  if (!spec) return raw('');
  const key = spec + '|' + cls;
  if (iconCache.has(key)) return iconCache.get(key);
  const [set, name] = spec.includes(':') ? spec.split(':') : ['lucide', spec];
  const file = ICON_SOURCES[set] && path.join(ROOT, ICON_SOURCES[set](name));
  let svg = '';
  if (file && existsSync(file)) {
    svg = readFileSync(file, 'utf8')
      .replace(/<!--[\s\S]*?-->/g, '')
      // Only strip sizing from the root <svg>, not from <rect> etc.
      .replace(/<svg[^>]*>/, (tag) => tag.replace(/\s(width|height|class)="[^"]*"/g, ''))
      .replace('<svg', `<svg class="ico ${esc(cls)}" aria-hidden="true" focusable="false"`)
      .replace(/\s*\n\s*/g, ' ')
      .trim();
  } else {
    svg = `<span class="ico ico-missing" title="missing icon ${esc(spec)}"></span>`;
  }
  const r = raw(svg);
  iconCache.set(key, r);
  return r;
}

export const ROOT_DIR = ROOT;
