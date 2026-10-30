# Building a mini course

Each mini course is **one JSON file**: `content/skills/<skill-id>.json`. The app turns it into the student pages, the explainer, the quiz, the teacher guide and the printable workbook. No code changes are needed.

`content/skills/spot-the-scam.json` is the worked example. Copy its shape.

## Workflow (with Claude)

1. Pick the next skill from `docs/COURSE-MAP.md`. Its title, zone, real-life skill and curriculum links already live in `content/map.json`.
2. Ask Claude (in this repo) something like:
   > Build the **Say It Right** mini course. Follow `docs/AUTHORING.md` and use `content/skills/spot-the-scam.json` as the model. Keep student text at about Year 4–6 reading level but make it feel grown-up. Use real Australian examples and cite sources.
3. Check it: `npm run check` (structure, curriculum links, reading level).
4. Print it: `npm run pdf -- say-it-right`. The exporter warns if any workbook page overflows. Fix overflows by adding `"pagebreak": true` or reducing `lines`.
5. Set `"status": "ready"` for that skill in `content/map.json`. It goes live on the map straight away; no restart is needed.
6. Regenerate the map document: `npm run map-doc`.

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
    "lookFors": [{ "vc": "L5-AIE", "evidence": "what you'd see in the workbook" }],
    "answers": "markdown — printed on the teacher answer copy",
    "resources": [{ "label": "", "url": "" }]
  }
}
```

Curriculum ids look like `L5-AIE` = Level 5, Literacy › Analysing, interpreting and evaluating. The full list is in `content/curriculum.json`. Focus keys: `TIC` Texts in context · `IWO` Interacting with others · `AIE` Analysing, interpreting and evaluating · `CT` Creating texts · `LIO` Language for interacting with others · `TSO` Text structure and organisation · `EDI` Language for expressing and developing ideas · `ER` Engaging with and responding to literature · `EX` Examining literature · `CL` Creating literature.

### Explainer scene kinds

| kind | fields | use for |
|---|---|---|
| `title` | `title`, `sub`, `icon` | opening card |
| `message` | `title`, `sender`, `text` | showing a phone message |
| `stat` | `big`, `title`, `sub` | one striking real number (cite in `sub`) |
| `big` | `title`, `text`, `icon` | a key idea |
| `flag` | `letter`, `title`, `text`, `icon` | one item of a list / mnemonic |
| `steps` | `title`, `steps[]` | a short procedure |
| `end` | `title`, `text`, `icon` | “your mission” call to action |

Every scene needs `say`: the narration, written to be **heard**. Keep it to 1–3 short sentences.

### Diagram types

- `phone-anatomy`: `title`, `sender`, `text`, `callouts[{ flag, label, note }]`. Flags are coloured: Rush, Reaction, Request, Random. Add more colours in `public/css/shared.css` if a new skill needs other labels.
- `flow`: `title`, `steps[{ title, text, icon }]` (3 steps works best).

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
| `sort` | `title`, `instructions`, `cards[{ from, text, answer, flags }]` | Message cards to classify; answers show on the teacher copy |
| `case-study` | `title`, `caseStudy` (index), `items[]` | The case study plus questions |
| `table` | `title`, `instructions`, `columns[]`, `rows[[…]]` | Fill-in table; empty strings become ruled cells; row 1 is the worked example |
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
