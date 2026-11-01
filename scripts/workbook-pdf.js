// Export print-ready A4 PDFs of workbooks.
//   npm run pdf                      -> every ready skill
//   npm run pdf -- spot-the-scam     -> one skill
//   npm run pdf -- spot-the-scam --answers
//   npm run pdf -- spot-the-scam --level=support   (default: all three reading levels)
// Set BASE_URL so the cover QR code points at your live site.
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT_DIR } from '../src/html.js';
import { skillList, getSkill, withLevel } from '../src/content.js';
import { LEVEL_IDS } from '../src/levels.js';
import { workbookPage } from '../src/views/workbook.js';

const args = process.argv.slice(2);
const answers = args.includes('--answers');
const ids = args.filter((a) => !a.startsWith('--'));
const levelArg = args.find((a) => a.startsWith('--level='))?.split('=')[1];
const levels = levelArg ? [levelArg] : LEVEL_IDS;
const skills = ids.length ? ids.map(getSkill) : skillList().filter((s) => s.ready);
const outDir = path.join(ROOT_DIR, 'exports');
mkdirSync(outDir, { recursive: true });

const FONT_DIRS = { lexend: '@fontsource-variable/lexend/files', bricolage: '@fontsource-variable/bricolage-grotesque/files' };
const embedFonts = (css) => css.replace(/url\(\/fonts\/(\w+)\/([\w.-]+)\)/g, (_, dir, f) =>
  `url(data:font/woff2;base64,${readFileSync(path.join(ROOT_DIR, 'node_modules', FONT_DIRS[dir], f)).toString('base64')})`);
const inlineCss = (htmlStr) => htmlStr
  .replace(/<link rel="preload"[^>]*>/g, '')
  .replace(/<link rel="stylesheet" href="\/css\/([\w-]+\.css)(?:\?v=\w+)?">/g,
    (_, f) => `<style>${embedFonts(readFileSync(path.join(ROOT_DIR, 'public', 'css', f), 'utf8'))}</style>`);

// Runs in the page: tests each decorative shape's real outline (not its bounding box) against the
// cover's text lines and boxes. The wave is meant to sit behind the bottom boxes, so it only counts for text.
function coverClashes() {
  const sheet = document.querySelector('.sheet.cover'); if (!sheet) return [];
  const targets = [];
  const walk = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT);
  for (let n; (n = walk.nextNode());) {
    const el = n.parentElement;
    if (!n.textContent.trim() || el.closest('svg, .cover-real, .cover-contents, .cover-qr, .cover-zone')) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    for (const q of r.getClientRects()) targets.push({ rect: q, what: `"${n.textContent.trim().slice(0, 30)}"`, text: true });
  }
  for (const el of sheet.querySelectorAll('.cover-fields span, .cover-real, .cover-contents, .cover-qr, .cover-sticker, .cover-zone, .logo-mark')) {
    targets.push({ rect: el.getBoundingClientRect(), what: `the ${el.className.split(' ')[0] || 'name field'} box`, text: false });
  }
  const found = new Set();
  for (const svg of sheet.querySelectorAll('.cover-shapes, .cover-marks')) {
    const inv = svg.getScreenCTM().inverse(); const pt = svg.createSVGPoint();
    const shapes = [...svg.querySelectorAll('circle, path')].map((el) => ({ el, cs: getComputedStyle(el), name: el.closest('[data-mark]')?.dataset.mark || 'shape' }));
    for (const t of targets) for (let x = t.rect.left; x <= t.rect.right; x += 3) for (let y = t.rect.top; y <= t.rect.bottom; y += 3) {
      const p = new DOMPoint(x, y).matrixTransform(inv); pt.x = p.x; pt.y = p.y;
      for (const { el, cs, name } of shapes) {
        if (name === 'wave' && !t.text) continue;
        if ((cs.fill !== 'none' && el.isPointInFill(pt)) || (cs.stroke !== 'none' && el.isPointInStroke(pt))) found.add(`${name} → ${t.what}`);
      }
    }
  }
  return [...found];
}

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); }
catch { console.error('PDF export needs Playwright: run  npm i -D playwright && npx playwright install chromium'); process.exit(1); }
const browser = await chromium.launch();
const page = await browser.newPage();
let overflowed = 0;
for (const base of skills) for (const level of levels) {
  if (!base?.course) { console.warn('skip (not written):', base?.id); break; }
  const skill = withLevel(base, level);
  const doc = inlineCss(String(await workbookPage(null, skill, { answers, baseUrl: process.env.BASE_URL || 'http://localhost:3000' })));
  await page.setContent(doc, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // Flag any sheet whose content spills past the page — fix by adding a
  // pagebreak or trimming lines in the course JSON.
  const over = await page.evaluate(() => [...document.querySelectorAll('.sheet-body')]
    .map((b, i) => (b.scrollHeight > b.clientHeight + 2 ? i + 2 : null)).filter(Boolean));
  if (over.length) { overflowed++; console.warn(`  ! ${skill.id} (${level}): page(s) ${over.join(', ')} overflow — content will be cut off`); }
  // Flag cover decorations (dots, stars, cross, squiggle, circle) that sit behind text or touch a box.
  const clash = await page.evaluate(coverClashes);
  if (clash.length) { overflowed++; console.warn(`  ! ${skill.id} (${level}): cover decoration overlaps ${clash.join('; ')}`); }
  const file = path.join(outDir, `${skill.id}-${level}${answers ? '-answers' : ''}.pdf`);
  await page.pdf({ path: file, format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log('wrote', path.relative(ROOT_DIR, file));
}
await browser.close();
if (overflowed) process.exitCode = 1;
