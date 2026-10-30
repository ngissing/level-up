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
| `kai`, `mia`, `jay`, `tia` | `student123` | Students at different stages |

Change the admin password straight away, or set `ADMIN_PASSWORD` before the first run.

## What's in it

**Students**
- **Skill map:** Base Camp (3 core skills) → 5 zones (Money Moves, Work Ready, Digital Life, Get Sorted, Your Voice) → Crossroads capstones. Students choose the order.
- **Mini course steps:** Mission brief → Watch (self-narrating animated explainer with captions) → Read (article and real case studies) → See it (diagrams) → Workbook → Quick check → Show it.
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
- Add people one at a time or paste a whole class (`name, username, password, class`).
- Students set their own password at first login.
- Classes, teacher assignment, password resets.
- Settings: require teacher sign-off, and the quiz pass mark.

## Commands

| | |
|---|---|
| `npm start` / `npm run dev` | Run the app (dev restarts on code changes; content changes are picked up live) |
| `npm run seed` | Demo data |
| `npm run check` | Validate all content and estimate reading levels |
| `npm run pdf [-- <skill-id>] [-- --answers]` | Export A4 workbook PDFs to `exports/` (needs Playwright). Warns on page overflow. |
| `npm run map-doc` | Regenerate `docs/COURSE-MAP.md` from the content |
| `npm run build-curriculum` | Rebuild `content/curriculum.json` |

## Project layout

```
content/
  map.json              zones, 32 skills, VC links, badges, milestones
  curriculum.json       VC 2.0 English reference (Levels 3–8, paraphrased; verify!)
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

- **Verify the curriculum links.** `content/curriculum.json` was written without access to the VCAA site. The wording is paraphrased and the codes are provisional. Check each entry against <https://f10.vcaa.vic.edu.au>, then correct it in `scripts/build-curriculum.mjs`.
- **Hosting and privacy.** The app stores student names, usernames and progress in `data/levelup.db`. Host it somewhere your school approves, behind HTTPS. Set `NODE_ENV=production` for secure cookies, and set `BASE_URL` (e.g. `https://levelup.yourschool.vic.edu.au`) so workbook QR codes point to the right place. Back up `data/`.
- Run `npm run check` and print a workbook before each new course goes live.
