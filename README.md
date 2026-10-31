# Level Up Literacy

Self-paced literacy **mini courses** for teenagers, each linking part of the **Victorian Curriculum F–10 (v2.0) English** to a real-life skill: spot a scam, read a payslip, pass the L-plate test, nail an interview.

Built for disengaged 14–17 year olds who read at about Year 3–7 level. Students pick their own path through a skill map, earn badges and unlock new skills. Every skill comes with a printable workbook (the main evidence of learning) and a teacher guide.

## Quick start

```bash
npm install
npm run seed      # optional demo accounts + progress
npm start         # http://localhost:3000
```

You need Node.js 22.13 or later (it uses the built-in `node:sqlite`).

| Login | Password | Role |
|---|---|---|
| `admin` | `changeme` | Admin: accounts, classes, settings |
| `teacher` | `teacher123` | Teacher of class “10 Literacy” (after `npm run seed`) |
| `kai`, `mia`, `jay`, `tia` | `student123` | Students at different stages (Kai is Foundation, Jay is Extended, Mia and Tia are Core) |

Change the admin password straight away, or set `ADMIN_PASSWORD` before the first run.

## What's in it

**Students**
- **Skill map:** Base Camp (3 core skills) → 5 zones (Money Moves, Work Ready, Digital Life, Get Sorted, Your Voice) → Crossroads capstones. Students choose the order.
- **Mini course steps:** Mission brief → Watch (narrated animated explainer with captions, recorded with Google’s natural voices) → Read (article and real case studies) → See it (diagrams) → Workbook → Quick check → Show it.
- **Read-aloud** on every text, a text-size toggle, and key words that read themselves out.
- **Badges** for each skill, zone and milestone.
- **My Curriculum** shows which parts of the VC they've shown.

**Teachers**
- Sign-off queue (approve, or send back with a comment, and confirm Level Up work).
- Class progress grid, and per-student VC evidence.
- “Sign off on paper” for students who worked from the booklet only.
- A teacher guide for each skill: lesson sequence, explicit teaching points, differentiation, look-fors mapped to the VC, and answers.
- Printable workbook plus an answer copy. There's also an “Explainer on the board” mode for whole-class teaching.
- Curriculum map: every VC focus point and the skills that cover it.

**Admins**
- Add people one at a time or paste a whole class (`name, username, password, class, reading level`).
- Set each student's **reading level** (▲ Foundation, Years 3–4 · ■ Core, Years 5–6 · ● Extended, Year 7+). It changes the wording, length and scaffolds of every part of a mini course, and which curriculum level the work evidences. Students never see their level.
- Students set their own password at first login.
- Classes, teacher assignment, password resets.
- Settings: require teacher sign-off, the quiz pass mark, and **preview mode** (lets unwritten skills be skipped while you build the course; keep it off for real classes).

## Commands

| | |
|---|---|
| `npm start` / `npm run dev` | Run the app (dev restarts on code changes; content changes are picked up live) |
| `npm run seed` | Demo data |
| `npm run check` | Validate all content and estimate reading levels |
| `npm run pdf [-- <skill-id>] [-- --answers]` | Export A4 workbook PDFs to `exports/` (needs Playwright). Warns on page overflow. |
| `npm run map-doc` | Regenerate `docs/COURSE-MAP.md` from the content |
| `npm run voices` | Record explainer narration with Google’s natural Australian voices (one-time setup: `docs/VOICES.md`) |
| `npm run import-vcaa` | Re-import the official VC 2.0 English curriculum from the VCAA website (or from a saved copy of the page) |

## Project layout

```
content/
  map.json              zones, 32 skills, VC links, badges, milestones
  curriculum.json       official VC 2.0 English F–10 (imported from the VCAA site)
  skills/<id>.json      one file per mini course (spot-the-scam is the worked example)
src/
  content.js            loading, unlock rules, badges, curriculum coverage
  views/                server-rendered pages (student, teacher, admin, workbook)
public/css, public/js   styles (shared tokens, app, print) and small client script
scripts/                seed, content check, PDF export, map doc
docs/
  COURSE-MAP.md         the full map (generated)
  AUTHORING.md          how to build the next mini course (with Claude)
```

## Before using with real students

- **Curriculum:** every code and description is copied word for word from the VCAA website (see `content/curriculum.json` for the date). If the VCAA updates the curriculum, run `npm run import-vcaa`, then `npm run check`.
- **Hosting and privacy.** The app stores student names, usernames and progress in `data/levelup.db`. Host it somewhere your school approves, behind HTTPS. Set `NODE_ENV=production` for secure cookies, and set `BASE_URL` (e.g. `https://levelup.yourschool.vic.edu.au`) so workbook QR codes point to the right place. Back up `data/`.
- Run `npm run check` and print a workbook before each new course goes live.
