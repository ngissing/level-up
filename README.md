# Level Up Literacy

Self-paced literacy **mini courses** for teenagers, each linking curriculum to a real-life skill: spot a scam, read a payslip, pass the L-plate test, nail an interview. There are three kinds of program, each with its own pathway and colour scheme:

- **Victorian Curriculum F–10 (v2.0) English**
- **VCE VM Literacy Units 1 & 2**, and separately **VCE VM Literacy Units 3 & 4**, built on the VCE Vocational Major Literacy Study Design 2023–2027. They're separate courses because students take them in different years.
- **VPC Literacy** (Units 1–4), built on the Victorian Pathways Certificate Literacy Curriculum Design 2023–2027. It's one course because the units are standalone and can be done in any order. VPC courses are hands-on: each ends with a real-world **Do it** task. Reading levels aim at Years 5, 7 and 9.

An admin enrols each student in one program.

Built for disengaged 14–17 year olds who read at about Year 3–7 level. Students pick their own path through a skill map, earn badges and unlock new skills. Every skill comes with a printable workbook (the main evidence of learning) and a teacher guide.

## Try it in GitHub Codespaces (nothing to install)

1. On the repository page, click **Code → Codespaces → Create codespace on main**.
2. Wait a minute or two. Level Up installs and starts itself, then opens in a new tab. If the tab doesn't open, go to the **Ports** tab and click the globe icon next to port 3000.
3. Each time you reopen the codespace, it fetches the latest version first. If it's already open when an update arrives, press **Ctrl + C** in its terminal and run `npm run live`.

Your test accounts and progress stay in that codespace until you delete it.

## Host it for real classes

See [docs/RAILWAY.md](docs/RAILWAY.md) to put Level Up on the internet with Railway.

## Quick start (on your own computer)

```bash
npm install
npm run seed      # optional demo accounts + progress
npm start         # http://localhost:3000
```

You need Node.js 22.13 or later (it uses the built-in `node:sqlite`).

| Login | Password | Role |
|---|---|---|
| `admin` | `changeme` | Admin: accounts, classes, settings |
| `teacher` | `teacher123` | Teacher of “10 Literacy”, “11 VM Literacy”, “12 VM Literacy” and “VPC Literacy” (after `npm run seed`) |
| `kai`, `mia`, `jay`, `tia` | `student123` | F–10 students at different stages (Kai is Foundation, Jay is Extended, Mia and Tia are Core) |
| `zara`, `ben` | `student123` | VM Literacy Units 1 & 2 students (Zara is Foundation, Ben is Core and partway through Your First Payslip) |
| `ella` | `student123` | VM Literacy Units 3 & 4 student (Core) |
| `noah`, `lia` | `student123` | VPC Literacy students (Noah is Foundation, Lia is Core) |
| `ruby`, `liam`, `amira`, `cooper` | `student123` | Have finished their program's starting zone, so the next zones are open: Ruby (F–10 Base Camp), Liam (VM 1 & 2 Induction), Amira (VM 3 & 4 Site Induction), Cooper (VPC The Workshop). All Core. |
| `ava`, `hamish`, `isla`, `jayden`, `khadija`, `lachlan`, `maya`, `nikau`, `olivia`, `patrick`, `sienna`, `tyler`, `will`, `zoe` | `student123` | Sample F–10 class **10B Literacy (sample)**, taught by `teacher`. Fourteen students at very different stages: well ahead (Ava, Khadija, Will), waiting for sign-off (Isla, Olivia, Ava), work sent back with a comment (Nikau), stuck on a quick check (Jayden, Sienna), stalled for three weeks (Patrick), slow and steady (Maya, Tyler) and not started (Lachlan has never logged in; Zoe logged in but hasn't started). |

Change the admin password straight away, or set `ADMIN_PASSWORD` before the first run.

## What's in it

**Students**
- **Skill map:** Base Camp (3 core skills) → 5 zones (Money Moves, Work Ready, Digital Life, Get Sorted, Your Voice) → Crossroads capstones. VM Units 1 & 2 students get Induction → Text Toolkit, Digital Life, Issues & Voices, Have Your Say → Capstones. VM Units 3 & 4 students get Site Induction → Real-World Docs, On the Job, Advocate, Speak Up → Capstones. Both VM courses use a "hi-vis" colour scheme. VPC students get The Workshop → Everyday Texts, Online & Safe, Issues & Voices, Speak Up, Out & About, Next Steps (one zone per module) → Your Project (Unit 4), in a teal "workshop" colour scheme. Students choose the order.
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
| `npm run live` | Fetch the latest version, install anything new, and start (what Codespaces runs automatically) |
| `npm run seed` | Demo data |
| `npm run check` | Validate all content and estimate reading levels |
| `npm run pdf [-- <skill-id>] [-- --answers]` | Export A4 workbook PDFs to `exports/` (needs Playwright). Warns on page overflow. |
| `npm run map-doc` | Regenerate `docs/COURSE-MAP.md` (F–10), `docs/COURSE-MAP-VM12.md` and `docs/COURSE-MAP-VM34.md` (VM) and `docs/COURSE-MAP-VPC.md` (VPC) from the content |
| `npm run voices` | Record explainer narration with Google’s natural Australian voices (one-time setup: `docs/VOICES.md`) |
| `npm run import-vcaa` | Re-import the official VC 2.0 English curriculum from the VCAA website (or from a saved copy of the page) |
| `npm run import-vm` | Re-import the VCE VM Literacy Study Design from the VCAA website (or from a downloaded .docx) |
| `npm run import-vpc` | Re-import the VPC Literacy Curriculum Design from the VCAA website (or from a downloaded .docx) |

## Project layout

```
content/
  f10/                  Victorian Curriculum F–10 program
    map.json            zones, 32 skills, VC links, badges, milestones
    curriculum.json     official VC 2.0 English F–10 (imported from the VCAA site)
    skills/<id>.json    one file per mini course (spot-the-scam is the worked example)
  vm12/                 VCE VM Literacy Units 1 & 2 (same layout; vm-first-payslip is the worked example)
  vm34/                 VCE VM Literacy Units 3 & 4 (same layout)
  vpc/                  VPC Literacy Units 1–4 (same layout; vpc-read-the-label is the worked example)
src/
  content.js            loading, unlock rules, badges, curriculum coverage
  views/                server-rendered pages (student, teacher, admin, workbook)
public/css, public/js   styles (shared tokens, app, print) and small client script
scripts/                seed, content check, PDF export, map doc
docs/
  COURSE-MAP.md         the F–10 map (generated)
  COURSE-MAP-VM12.md    the VM Units 1 & 2 map (generated)
  COURSE-MAP-VM34.md    the VM Units 3 & 4 map (generated)
  COURSE-MAP-VPC.md     the VPC Literacy map (generated)
  AUTHORING.md          how to build the next mini course (with Claude)
```

## Before using with real students

- **Curriculum:** both curricula are copied word for word from the VCAA (the dates are in `content/<program>/curriculum.json`). If the VCAA updates them, run `npm run import-vcaa` or `npm run import-vm`, then `npm run check`. The VM study design is accredited until 31 December 2027.
- **Hosting and privacy.** The app stores student names, usernames and progress in `data/levelup.db`. Host it somewhere your school approves, behind HTTPS. Set `NODE_ENV=production` for secure cookies, and set `BASE_URL` (e.g. `https://levelup.yourschool.vic.edu.au`) so workbook QR codes point to the right place. Back up `data/`.
- Run `npm run check` and print a workbook before each new course goes live.
