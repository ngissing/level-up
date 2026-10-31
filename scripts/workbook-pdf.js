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
  .replace(/<link rel="stylesheet" href="\/css\/([\w-]+\.css)">/g,
    (_, f) => `<style>${embedFonts(readFileSync(path.join(ROOT_DIR, 'public', 'css', f), 'utf8'))}</style>`);

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
  const file = path.join(outDir, `${skill.id}-${level}${answers ? '-answers' : ''}.pdf`);
  await page.pdf({ path: file, format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log('wrote', path.relative(ROOT_DIR, file));
}
await browser.close();
if (overflowed) process.exitCode = 1;
