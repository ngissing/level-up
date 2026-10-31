# Building a mini course

Each mini course is **one JSON file** in its program's folder:

- **Victorian Curriculum F–10:** `content/f10/skills/<skill-id>.json`. Worked example: `spot-the-scam.json`.
- **VCE VM Literacy:** `content/vm/skills/<skill-id>.json`. Worked example: `vm-first-payslip.json`.

The app turns it into the student pages, the explainer, the quiz, the teacher guide and the printable workbook. No code changes are needed. Copy the worked example's shape for the program you're writing for.

## Workflow (with Claude)

1. Pick the next skill from `docs/COURSE-MAP.md` (F–10) or `docs/COURSE-MAP-VM.md` (VM). Its title, zone, real-life skill and curriculum links already live in that program's `map.json`.
2. Ask Claude (in this repo) something like:
   > Build the **Say It Right** mini course. Follow `docs/AUTHORING.md` and use `content/f10/skills/spot-the-scam.json` as the model. Keep student text at about Year 4–6 reading level but make it feel grown-up. Use real Australian examples and cite sources.
3. Check it: `npm run check` (structure, curriculum links, reading level).
4. Print it: `npm run pdf -- say-it-right`. The exporter warns if any workbook page overflows. Fix overflows by adding `"pagebreak": true` or reducing `lines`.
5. Set `"status": "ready"` for that skill in the program's `map.json`. It goes live on the map straight away; no restart is needed.
6. Record the narration: `npm run voices -- <skill-id>` (see `docs/VOICES.md`).
7. Regenerate the map document: `npm run map-doc`.

## House rules

- **Reading level:** students are 14–17 but read at about Year 3–7 level. Use short sentences, everyday words, and teach **at most 8 key words** per skill (in `brief.vocab`). `npm run check` estimates reading level and flags anything above about Year 8.
- **Relevance first.** Hook with a situation a teen will actually meet this year: a text message, a payslip, a job ad, a group chat.
- **Real cases only.** Every case study needs a `source` with a URL. Don't make up statistics. If you can't verify a number, leave it out.
- **Workbook = evidence.** The workbook is the main way students show learning. Include a final task that gives evidence for each **core** VC link, and at least one ★ Level Up task for the **extend** links.
- **Teacher still teaches.** `teacher.lessons` should include explicit teaching (model → guided → independent), not just “students complete the workbook”.
- **Respectful tone.** No baby talk, no slang overload, no shaming. Students are the experts and protectors, not victims.

## File shape

```jsonc
{
  "id": "spot-the-scam",              // must match the id in content/map.json
  "version": 1,
  "duration": "3–4 lessons (about 3 hours)",

  "brief": {
    "hook": "markdown — a 2–3 sentence real-life moment",
    "why": "markdown — why this matters to them",
    "canDo": ["I can … (markdown)", "…"],  // 3–4 student-friendly learning intentions
    "showIt": "one sentence: how they'll show it",
    "vocab": [{ "word": "", "meaning": "", "example": "" }]  // max 8
  },

  "explainer": {                       // plays like a ~2 min video, narrated by the browser
    "title": "",
    "videoUrl": null,                  // optional: an embeddable video URL (e.g. YouTube /embed/...)
    "scenes": [ /* see scene kinds below; each needs "say" = narration */ ]
  },

  "read": {
    "articles": [{ "title": "", "minutes": 4, "body": "markdown, ~250–350 words" }],
    "caseStudies": [{ "title": "", "icon": "lucide:…", "body": "markdown",
                      "source": { "name": "", "url": "" }, "think": ["question", "…"] }]
  },

  "diagrams": [ /* phone-anatomy | flow — see below */ ],

  "quiz": { "questions": [{ "q": "markdown", "options": ["", "", "", ""], "answer": 0, "explain": "" }] },

  "show": { "task": "", "checklist": ["", ""], "levelUp": "" },

  "workbook": { "pages": [ /* blocks — see below */ ] },

  "teacher": {
    "overview": "markdown", "prep": [""], "keyPoints": [""],
    "lessons": [{ "title": "", "minutes": 50, "steps": ["markdown"] }],
    "differentiation": { "support": [""], "extend": [""] },
    "lookFors": [{ "vc": "VC2E5LY09", "evidence": "what you'd see in the workbook" }],
    "answers": "markdown — printed on the teacher answer copy",
    "resources": [{ "label": "", "url": "" }]
  }
}
```

**F–10 curriculum links** use the **official content description codes** from the VCAA, such as `VC2E5LY09`. They're stored in `content/f10/curriculum.json`, imported word for word with `npm run import-vcaa`. In `content/f10/map.json` each skill lists three sets of codes:

- `vc.support`: Level 3–4 codes for Foundation readers
- `vc.core`: Level 5–6 codes for everyone else
- `vc.extend`: Level 6–8 codes for Level Up work

**VM curriculum links** use the key knowledge and key skills of the **VCE VM Literacy Study Design**. They're stored in `content/vm/curriculum.json`, imported word for word with `npm run import-vm`. The ids look like `VM-U1O1-KK3`, meaning Unit 1, Outcome 1, the 3rd key knowledge point (`KS` for key skills), in study-design order. VM has no curriculum levels, so each skill lists:

- `vc.core`: points every student evidences
- `vc.extend`: points evidenced by Level Up work

Leave out `vc.support`. Reading levels still change the wording and scaffolds.

Read the exact wording (the teacher **Curriculum map** page lists everything for both programs) and choose items the workbook genuinely gives evidence for.

### Reading levels

An admin sets each student's reading level, and students never see it:

- **▲ Foundation** (`support`): reads at about Years 3–4
- **■ Core** (`core`): reads at about Years 5–6
- **● Extended** (`extend`): reads at about Year 7 and up

Write one course file. Any value can be split by level, and levels you leave out fall back to `core`:

```jsonc
"hook": {
  "support": "Short, simple version.",
  "core": "The standard version.",
  "extend": "A richer version."
}
```

Any item in a list (a vocab word, a quiz question, a workbook block or question, a sort card, a table row) can be limited to some levels:

```jsonc
{ "q": "Why does that small word choice matter?", "lines": 2, "levelUp": true, "levels": ["extend"] }
```

Table rows that need `levels` are written as `{ "cells": ["…", ""], "levels": ["core", "extend"] }`.

The app also makes some changes automatically:

- **Foundation:**
  - Quiz questions drop to 3 choices (add `"keepOptions": true` to a question to stop this).
  - App text and printed workbooks are larger, with taller writing lines.
  - The explainer voice is slower.
- **Curriculum:**
  - In `content/map.json`, a skill can list `vc.support`: the earlier-level curriculum links that Foundation students show. If it's missing, they evidence `vc.core`.
  - Extended students evidence `vc.extend` when the teacher confirms their Level Up work.
- **Teacher guide:**
  - Write `teacher.levels` as `{ "support": "…", "core": "…", "extend": "…" }` to describe what changes at each level. It appears in the teacher guide.
  - Add `"levels": [...]` to a `teacher.lookFors` item that only applies to one level.

Check all three versions:

- `npm run check` reports reading level for each version.
- `npm run pdf -- <id>` prints all three versions and warns about any page that overflows. A `pagebreak` can be set per level: `"pagebreak": { "core": false, "extend": true }`.

### Explainer scene kinds

| kind | fields | use for |
|---|---|---|
| `title` | `title`, `sub`, `icon` | opening card |
| `message` | `title`, `sender`, `text` | showing a phone message |
| `stat` | `big`, `title`, `sub` | one striking real number (cite in `sub`) |
| `big` | `title`, `text`, `icon` | a key idea |
| `flag` | `letter`, `title`, `text`, `icon`, optional `pill` (default “Red flag”) and `pillIcon` | one item of a list / mnemonic |
| `steps` | `title`, `steps[]` | a short procedure |
| `end` | `title`, `text`, `icon` | “your mission” call to action |

Every scene needs `say`: the narration, written to be **heard**. Keep it to 1–3 short sentences. After writing or changing narration, run `npm run voices` to record it with a natural Google voice (see `docs/VOICES.md`).

### Diagram types

- `phone-anatomy`: `title`, `sender`, `text`, `callouts[{ flag, label, note }]`. Flags are coloured: Rush, Reaction, Request, Random. Add more colours in `public/css/shared.css` if a new skill needs other labels.
- `flow`: `title`, `steps[{ title, text, icon }]` (3 steps works best).
- `document`: a workplace document such as a payslip or form. Fields: `title`, `docTitle`, `sections[]` (each `{ n?, label, value, strong?, rule? }` or `{ table: { n?, columns, rows } }`), `note`, `callouts[{ n, label, note }]`. Numbered markers line up with the callouts.

### Workbook blocks

Blocks flow onto A4 sheets. Add `"pagebreak": true` to start a new sheet. The cover and the teacher sign-off are added automatically.

| type | fields | what it prints |
|---|---|---|
| `cover` | — | Colour cover: title, real-life skill, name/class fields, contents, QR code to the explainer |
| `goals` | — | Mission, “I can” tick list, how I'll show it, VC links |
| `vocab-match` | `title`, `instructions` | Match words to meanings (from `brief.vocab`) |
| `reading` | `title`, `article` (index), `instructions` | The article in two columns |
| `questions` / `scenarios` | `title`, `instructions`, `items[{ q, lines, levelUp?, boxes? }]` | Numbered questions with writing lines; `levelUp` items get a ★ box |
| `phone-annotate` | `title`, `diagram` (index), `instructions` | Phone message with four labelled annotation slots |
| `sort` | `title`, `instructions`, `cards[{ from, text, answer, flags }]`, optional `choices` (default Scam/Legit/Not sure) and `reasonLabel` | Cards to classify; answers show on the teacher copy |
| `doc-annotate` | `title`, `diagram` (index of a `document` diagram), `instructions`, optional `wordBank[]` | A document (e.g. payslip) with numbered markers and a table to explain each one |
| `case-study` | `title`, `caseStudy` (index), `items[]` | The case study plus questions |
| `table` | `title`, `instructions`, `columns[]`, `rows[[…]]`, optional `rowHeight` (mm) | Fill-in table; empty strings become ruled cells; row 1 is the worked example |
| `equation` | `parts[{ icon, title, text }]` | Visual “A + B = C” (e.g. clues + what I know = inference) |
| `flow` | `title`, `diagram` (index) | The flow diagram |
| `write` | `title`, `prompt`, `plan[{ label, lines }]`, `starters[]`, `lines`, `check[]` | Extended writing with planning boxes, sentence starters and a self-check |
| `levelup-draw` | `title`, `prompt` | ★ Level Up challenge with a blank phone and annotation slots |
| `reflect` | `title`, `rate[]`, `questions[]` | Self-assessment faces + reflection lines |
| `signoff` | — | Teacher check box |

Need a new block (e.g. a resume template, a payslip to annotate, a map)? Add a renderer to `BLOCKS` in `src/views/workbook.js`, style it in `public/css/workbook.css`, and add its name to `BLOCKS` in `scripts/check-content.js`.

### Icons

Write icons as `set:name`:

- `lucide:` [Lucide](https://lucide.dev/icons) (the default set)
- `tabler:` [Tabler outline](https://tabler.io/icons)
- `ph:` [Phosphor fill](https://phosphoricons.com)

All three are open-source and inlined at render time, so they print and work offline.
