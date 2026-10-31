# Level Up Literacy — notes for Claude

Self-paced literacy mini courses for disengaged 14–17 year olds who read at about Year 3–7 level. There are three **programs**, each with its own content folder and pathway:
  - **Victorian Curriculum F–10 v2.0 English** (`content/f10/`)
  - **VCE VM Literacy Units 1 & 2** (`content/vm12/`)
  - **VCE VM Literacy Units 3 & 4** (`content/vm34/`)

  The two VM programs are separate courses (taken in different years) that share the VM "hi-vis" colour family. An admin sets each student's program. The app is Node 22 + Express + built-in `node:sqlite`, with server-rendered HTML (tagged templates in `src/views`). There is no front-end framework or build step.

- **Content, not code:** mini courses are JSON in `content/<program>/skills/<id>.json`. The map, zones, unlocks and badges live in `content/<program>/map.json`, and the curriculum in `content/<program>/curriculum.json`. Skill, zone and milestone ids must be unique across programs (VM ids start with `vm-`). Follow `docs/AUTHORING.md` when writing a course and copy the shape of `spot-the-scam.json`.
- After changing content, run `npm run check`, `npm run pdf -- <id>` (watch for overflow warnings) and `npm run map-doc`.
- Student-facing text: short sentences, everyday words, grown-up tone, Australian context. Real case studies only, with a source URL. Never invent statistics.
- Curriculum: both curriculum files are **official** and imported word for word. Never edit or paraphrase them by hand.
  - F–10: `npm run import-vcaa` (from the VCAA site). Skills reference codes like `VC2E5LY09` in `vc.support` / `vc.core` / `vc.extend`.
  - VM: `npm run import-vm` (VCE VM Literacy Study Design 2023–2027) writes Units 1–2 to `vm12` and Units 3–4 to `vm34`. Ids look like `VM-U1O1-KK3`; use `vc.core` / `vc.extend` only, from the course's own units.
- Views use the `html` tag from `src/html.js`: interpolations are escaped, and `raw()`/`md()` mark trusted HTML. Icons come from `icon('lucide:name')`.
- Styling: tokens in `public/css/shared.css` (also used by workbooks), app styles in `app.css`, print styles in `workbook.css`. The look is neo-brutalist: ink outlines, hard shadows, zone colours.
- Reading levels (`src/levels.js`): support / core / extend, set per student by an admin and **never shown to students**. Course values can be split by level, and list items can carry `levels: [...]` (see AUTHORING.md). Student pages must not show level names or curriculum level numbers.
- Programs (`src/programs.js`): pages pick their colour scheme with `page(req, { program })` (students always get their own). Staff pages take `?program=`. Colour schemes are per family (`fam-f10`, `fam-vm`) in `app.css` / `workbook.css`. CSS/JS URLs carry a content hash (`asset()` in `layout.js`) so updates are never hidden by the browser cache.
