# Level Up Literacy — notes for Claude

Self-paced literacy mini courses for disengaged 14–17 year olds who read at about Year 3–7 level, mapped to the Victorian Curriculum F–10 v2.0 English. The app is Node 22 + Express + built-in `node:sqlite`, with server-rendered HTML (tagged templates in `src/views`). There is no front-end framework or build step.

- **Content, not code:** mini courses are JSON in `content/skills/<id>.json`. The map, zones, unlocks and badges live in `content/map.json`, and the curriculum reference in `content/curriculum.json`. Follow `docs/AUTHORING.md` when writing a course and copy the shape of `spot-the-scam.json`.
- After changing content, run `npm run check`, `npm run pdf -- <id>` (watch for overflow warnings) and `npm run map-doc`.
- Student-facing text: short sentences, everyday words, grown-up tone, Australian context. Real case studies only, with a source URL. Never invent statistics.
- Curriculum entries are **paraphrased and unverified** (`verified: false`). Don't present codes as official. If the VCAA site is reachable, verify them and update `scripts/build-curriculum.mjs`, then run `npm run build-curriculum`.
- Views use the `html` tag from `src/html.js`: interpolations are escaped, and `raw()`/`md()` mark trusted HTML. Icons come from `icon('lucide:name')`.
- Styling: tokens in `public/css/shared.css` (also used by workbooks), app styles in `app.css`, print styles in `workbook.css`. The look is neo-brutalist: ink outlines, hard shadows, zone colours.
- Reading levels (`src/levels.js`): support / core / extend, set per student by an admin and **never shown to students**. Course values can be split by level, and list items can carry `levels: [...]` (see AUTHORING.md). Student pages must not show level names or curriculum level numbers.
- Official curriculum: `npm run import-vcaa -- <VCAA .docx>` writes `content/vcaa-english.json` and `docs/CURRICULUM-CHECK.md`. Use these, not memory, when mapping skills to codes.
