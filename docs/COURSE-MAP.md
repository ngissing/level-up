# Level Up Literacy — course map

_Generated from `content/` by `npm run map-doc`. Edit the JSON, not this file._

## The idea

Every skill is a **mini course** that links a part of the Victorian Curriculum F–10 (Version 2.0) English to a real thing a teenager needs to do: spot a scam, read a payslip, pass the L-plate test, write a complaint that gets results. Students read at around Year 3–7 level, so the texts are short and plain, but the topics are pitched at 14–17 year olds.

## How the map works

```
                 BASE CAMP  (3 core skills, all open)
                      │  finish any 2
    ┌─────────┬───────┴──┬──────────┬──────────┐
  MONEY     WORK      DIGITAL    GET SORTED   YOUR VOICE      ← 5 zones, pick any
  2 starters → 2 level-2 skills → 1 boss skill   (in each zone)
    └─────────┴────┬─────┴──────────┴──────────┘
                CROSSROADS  (4 capstones that need 2 skills in each of two zones)
```

- **Hybrid tree, not a straight line.** A small core (Base Camp) gives everyone the same toolkit: reading for purpose, choosing the right tone, finding information fast. After that it is a choose-your-own-adventure: students open any zone and move through it at their own pace.
- **Unlock rules** (set in `content/map.json` → `unlocks`):
  - Starter skills: finish 2 Base Camp skills.
  - Level-2 skills: finish **both** starters in that zone.
  - Boss skill: finish both starters **and** a level-2 skill in that zone.
  - Crossroads: finish 2 skills in each of the two named zones.
  - Unwritten skills block the way like any other. An admin can turn on *preview mode* to skip them while courses are being built.
- **Badges:** one per skill, an *Explorer* and a *Master* badge per zone, *Base Camp Cleared*, and milestones at 1, 5, 10 and 20 skills.
- **Reading levels.** An admin sets each student’s reading level (▲ Foundation, Years 3–4 · ■ Core, Years 5–6 · ● Extended, Year 7+). Each mini course is written at all three levels, and students never see theirs.
- **Curriculum evidence follows the level.** Foundation readers evidence the Level 3–4 content descriptions; everyone else evidences the Core (Level 5–6) codes. *Level Up* tasks (★ in workbooks) evidence the Level 6–8 codes once the teacher confirms that work.
- **Official curriculum.** All codes and wording come word for word from the VCAA website (`npm run import-vcaa`).

## What is inside every mini course

| Step | Student sees | Built from |
|---|---|---|
| 1. Mission brief | Hook, why it matters, “I can” goals, key words (each read aloud) | `brief` |
| 2. Watch | A 2-minute animated explainer that narrates itself, with captions; optional real video | `explainer` |
| 3. Read | A short article plus real, sourced case studies with “think about it” prompts | `read` |
| 4. See it | Diagrams (annotated examples, flow charts) | `diagrams` |
| 5. Workbook | Printable A4 workbook — the main way students show learning | `workbook` |
| 6. Quick check | 5 auto-marked questions with feedback (pass mark set by admin) | `quiz` |
| 7. Show it | Final task checklist, reflection, Level Up claim → teacher sign-off | `show` |
| Teacher guide | Lesson sequence, explicit teaching points, look-fors mapped to VC, answers | `teacher` |

## Status

1 of 32 mini courses built. Planned skills are already mapped to the curriculum and appear on the map as “coming soon”.

**Suggested build order:** Say It Right → Find It Fast (finish Base Camp), then one starter per zone (Read Your Payslip, Crack the Job Ad, Fact or Fake?, Form Filler, Tell Your Story), then level-2 skills where students are heading.

## Base Camp

_Three core skills everyone uses every day. Finish any two to open the map._

| Skill | Tier | Real-life skill | Literacy focus | VC ▲ Foundation | VC Core | VC ★ Level Up | Unlocks after | Badge | Status |
|---|---|---|---|---|---|---|---|---|---|
| **Spot the Scam** | Base Camp | Recognise scam messages and know what to do before you click, pay or reply. | Reading for purpose and audience; spotting persuasive tricks; reading between the lines (inference). | VC2E3LY09 (Analysing, interpreting and evaluating)<br>VC2E4LY09 (Analysing, interpreting and evaluating)<br>VC2E4LA02 (Language for interacting with others)<br>VC2E4LA01 (Language for interacting with others) | VC2E5LY08 (Analysing, interpreting and evaluating)<br>VC2E5LY09 (Analysing, interpreting and evaluating)<br>VC2E5LA01 (Language for interacting with others)<br>VC2E5LY10 (Creating texts) | VC2E6LY07 (Analysing, interpreting and evaluating)<br>VC2E7LY05 (Analysing, interpreting and evaluating)<br>VC2E7LY07 (Analysing, interpreting and evaluating)<br>VC2E7LY08 (Creating texts) | — | Scam Buster | ✅ built |
| **Say It Right** | Base Camp | Choose the right tone and words for who you’re talking to — friends, teachers, bosses, services. | Formal and informal language (register); writing short messages for a purpose and audience. | VC2E3LA01 (Language for interacting with others)<br>VC2E4LA01 (Language for interacting with others)<br>VC2E4LY10 (Creating texts) | VC2E5LA01 (Language for interacting with others)<br>VC2E6LA01 (Language for interacting with others)<br>VC2E5LY10 (Creating texts)<br>VC2E5LY11 (Creating texts) | VC2E7LA01 (Language for interacting with others)<br>VC2E8LA01 (Language for interacting with others)<br>VC2E7LY09 (Creating texts) | — | Tone Tuner | planned |
| **Find It Fast** | Base Camp | Skim and scan websites, menus, timetables and signs to find what you need quickly. | Skimming and scanning; using headings, tables and links to navigate texts. | VC2E3LA05 (Text structure and organisation)<br>VC2E4LA05 (Text structure and organisation)<br>VC2E4LY09 (Analysing, interpreting and evaluating) | VC2E5LY09 (Analysing, interpreting and evaluating)<br>VC2E5LA03 (Text structure and organisation)<br>VC2E6LY08 (Analysing, interpreting and evaluating) | VC2E7LY07 (Analysing, interpreting and evaluating)<br>VC2E7LA03 (Text structure and organisation)<br>VC2E7LY04 (Texts in context) | — | Speed Finder | planned |

## Money Moves

_Payslips, phone plans, budgets and the fine print. Keep more of your cash._

| Skill | Tier | Real-life skill | Literacy focus | VC ▲ Foundation | VC Core | VC ★ Level Up | Unlocks after | Badge | Status |
|---|---|---|---|---|---|---|---|---|---|
| **Read Your Payslip** | Starter | Read a payslip: hours, pay rate, gross and net pay, tax and super. Spot mistakes. | Reading information in tables; technical vocabulary; checking literal details. | VC2E3LA11 (Language for expressing and developing ideas)<br>VC2E4LY09 (Analysing, interpreting and evaluating) | VC2E5LA08 (Language for expressing and developing ideas)<br>VC2E5LY09 (Analysing, interpreting and evaluating) | VC2E7LA08 (Language for expressing and developing ideas)<br>VC2E7LY07 (Analysing, interpreting and evaluating) | Finish 2 Base Camp skills | Pay Checker | planned |
| **Phone Plan Showdown** | Starter | Compare phone plans and spot what the ads don’t tell you. | Comparing information across texts; persuasive language in ads; reading the small print. | VC2E4LA02 (Language for interacting with others)<br>VC2E4LY08 (Analysing, interpreting and evaluating) | VC2E5LY08 (Analysing, interpreting and evaluating)<br>VC2E6LA02 (Language for interacting with others)<br>VC2E6LY08 (Analysing, interpreting and evaluating) | VC2E7LY05 (Analysing, interpreting and evaluating)<br>VC2E8LY07 (Analysing, interpreting and evaluating) | Finish 2 Base Camp skills | Deal Detective | planned |
| **Budget Builder** | Level 2 | Make a simple weekly budget and a savings goal you can actually stick to. | Reading charts and tables; writing a clear plan with steps (procedural text). | VC2E4LA03 (Text structure and organisation)<br>VC2E4LY10 (Creating texts) | VC2E5LY10 (Creating texts)<br>VC2E5LA03 (Text structure and organisation)<br>VC2E5LA04 (Text structure and organisation) | VC2E7LY08 (Creating texts)<br>VC2E7LA04 (Text structure and organisation)<br>VC2E7LY06 (Analysing, interpreting and evaluating) | Finish both starters in Money Moves | Budget Boss | planned |
| **Buy Smart Online** | Level 2 | Check if a seller is legit, read reviews critically and know your refund rights. | Evaluating reliability of sources; fact versus opinion; persuasive language. | VC2E4LA02 (Language for interacting with others)<br>VC2E4LY09 (Analysing, interpreting and evaluating) | VC2E6LA02 (Language for interacting with others)<br>VC2E5LA02 (Language for interacting with others)<br>VC2E6LY08 (Analysing, interpreting and evaluating) | VC2E8LY05 (Analysing, interpreting and evaluating)<br>VC2E7LA02 (Language for interacting with others) | Finish both starters in Money Moves | Smart Shopper | planned |
| **Beat the Fine Print** | Boss | Read a contract or terms and conditions and work out what you’re really agreeing to. | Reading complex texts; technical vocabulary; summarising key points; inference. | VC2E3LA09 (Language for expressing and developing ideas)<br>VC2E4LY09 (Analysing, interpreting and evaluating) | VC2E6LY08 (Analysing, interpreting and evaluating)<br>VC2E5LA08 (Language for expressing and developing ideas)<br>VC2E6LA03 (Text structure and organisation) | VC2E7LY07 (Analysing, interpreting and evaluating)<br>VC2E8LA06 (Language for expressing and developing ideas)<br>VC2E7LA08 (Language for expressing and developing ideas) | Finish both starters in Money Moves; Finish 1 level-2 skill in Money Moves | Fine Print Pro | planned |

## Work Ready

_Job ads, resumes, workplace talk and interviews. Get the job, keep the job._

| Skill | Tier | Real-life skill | Literacy focus | VC ▲ Foundation | VC Core | VC ★ Level Up | Unlocks after | Badge | Status |
|---|---|---|---|---|---|---|---|---|---|
| **Crack the Job Ad** | Starter | Read job ads, decode the jargon and decide if a job is right for you. | Finding key information; technical and workplace vocabulary; inference. | VC2E4LY08 (Analysing, interpreting and evaluating)<br>VC2E3LA11 (Language for expressing and developing ideas) | VC2E5LY08 (Analysing, interpreting and evaluating)<br>VC2E5LY09 (Analysing, interpreting and evaluating)<br>VC2E5LA08 (Language for expressing and developing ideas) | VC2E7LY07 (Analysing, interpreting and evaluating)<br>VC2E7LA08 (Language for expressing and developing ideas) | Finish 2 Base Camp skills | Job Hunter | planned |
| **Safety First at Work** | Starter | Read workplace safety signs, instructions and procedures, and ask when unsure. | Reading procedural texts; symbols and images in texts; following and writing instructions. | VC2E3LA10 (Language for expressing and developing ideas)<br>VC2E4LA03 (Text structure and organisation)<br>VC2E4LA04 (Text structure and organisation) | VC2E5LA03 (Text structure and organisation)<br>VC2E5LA04 (Text structure and organisation)<br>VC2E5LY10 (Creating texts) | VC2E7LA03 (Text structure and organisation)<br>VC2E7LY08 (Creating texts) | Finish 2 Base Camp skills | Safety Legend | planned |
| **Build Your Resume** | Level 2 | Write a one-page resume that shows your skills, even with no work experience. | Text structure and layout; concise, precise vocabulary; editing for audience. | VC2E4LY10 (Creating texts)<br>VC2E4LY11 (Creating texts) | VC2E5LY10 (Creating texts)<br>VC2E5LY11 (Creating texts)<br>VC2E5LA08 (Language for expressing and developing ideas)<br>VC2E6LA03 (Text structure and organisation) | VC2E7LY08 (Creating texts)<br>VC2E7LY09 (Creating texts) | Finish both starters in Work Ready | Resume Ready | planned |
| **Talk the Talk at Work** | Level 2 | Handle everyday work talk: shift swaps, calling in sick, asking for help, workplace emails. | Formal language and tone; spoken interaction skills; short workplace messages. | VC2E4LY01 (Interacting with others)<br>VC2E4LA01 (Language for interacting with others) | VC2E5LY01 (Interacting with others)<br>VC2E6LA01 (Language for interacting with others)<br>VC2E6LY01 (Interacting with others) | VC2E8LA01 (Language for interacting with others)<br>VC2E7LY02 (Interacting with others) | Finish both starters in Work Ready | Workplace Pro | planned |
| **Nail the Interview** | Boss | Prepare for and answer common interview questions using real examples from your life. | Planning and delivering spoken answers; listening; structuring examples (STAR). | VC2E4LY02 (Interacting with others)<br>VC2E4LY01 (Interacting with others) | VC2E6LY02 (Interacting with others)<br>VC2E6LY01 (Interacting with others) | VC2E7LY02 (Interacting with others)<br>VC2E7LA02 (Language for interacting with others)<br>VC2E8LY02 (Interacting with others) | Finish both starters in Work Ready; Finish 1 level-2 skill in Work Ready | Interview Ace | planned |

## Digital Life

_Fakes, feeds, influencers and comment sections. Run your phone, don’t let it run you._

| Skill | Tier | Real-life skill | Literacy focus | VC ▲ Foundation | VC Core | VC ★ Level Up | Unlocks after | Badge | Status |
|---|---|---|---|---|---|---|---|---|---|
| **Fact or Fake?** | Starter | Check whether a post, video or news story is real before you believe or share it. | Evaluating reliability of sources; comparing information across texts. | VC2E4LA02 (Language for interacting with others)<br>VC2E4LY09 (Analysing, interpreting and evaluating) | VC2E6LY08 (Analysing, interpreting and evaluating)<br>VC2E6LA02 (Language for interacting with others)<br>VC2E6LY06 (Texts in context) | VC2E8LY05 (Analysing, interpreting and evaluating)<br>VC2E7LY04 (Texts in context)<br>VC2E8LY07 (Analysing, interpreting and evaluating) | Finish 2 Base Camp skills | Fact Checker | planned |
| **Your Digital Footprint** | Starter | Think about who sees your posts and write a profile/bio you’d be happy for a boss to read. | Audience and purpose; writing short texts for a public audience. | VC2E3LY08 (Texts in context)<br>VC2E4LY10 (Creating texts) | VC2E5LA01 (Language for interacting with others)<br>VC2E5LY10 (Creating texts)<br>VC2E6LY09 (Creating texts) | VC2E7LA01 (Language for interacting with others)<br>VC2E7LY04 (Texts in context) | Finish 2 Base Camp skills | Footprint Fixer | planned |
| **Influencer Unboxed** | Level 2 | Spot sponsored content and the tricks influencers use to sell to you. | Persuasive techniques in multimodal texts; how images and words position viewers. | VC2E3LA10 (Language for expressing and developing ideas)<br>VC2E3LY09 (Analysing, interpreting and evaluating) | VC2E6LY07 (Analysing, interpreting and evaluating)<br>VC2E6LA07 (Language for expressing and developing ideas)<br>VC2E6LA02 (Language for interacting with others) | VC2E7LA07 (Language for expressing and developing ideas)<br>VC2E7LY05 (Analysing, interpreting and evaluating)<br>VC2E8LY05 (Analysing, interpreting and evaluating) | Finish both starters in Digital Life | Ad Spotter | planned |
| **Comment Section Survival** | Level 2 | Respond to online conflict, stand up for someone, and know when and how to report. | Language for respectful disagreement; tone; evaluative language. | VC2E3LA02 (Language for interacting with others)<br>VC2E4LY01 (Interacting with others) | VC2E6LY01 (Interacting with others)<br>VC2E5LA02 (Language for interacting with others)<br>VC2E6LA02 (Language for interacting with others) | VC2E8LY01 (Interacting with others)<br>VC2E7LA02 (Language for interacting with others)<br>VC2E8LA01 (Language for interacting with others) | Finish both starters in Digital Life | Cool Head | planned |
| **Make Content That Counts** | Boss | Plan, script and storyboard a short video or post that says something useful. | Creating multimodal texts; scripting; choosing images, words and sound for an audience. | VC2E4LY10 (Creating texts)<br>VC2E4LA09 (Language for expressing and developing ideas) | VC2E6LY09 (Creating texts)<br>VC2E5LA07 (Language for expressing and developing ideas)<br>VC2E6LY02 (Interacting with others) | VC2E7LY08 (Creating texts)<br>VC2E7LA07 (Language for expressing and developing ideas)<br>VC2E8LY08 (Creating texts) | Finish both starters in Digital Life; Finish 1 level-2 skill in Digital Life | Creator | planned |

## Get Sorted

_Forms, transport, L-plates, health and your rights. Adulting, sorted._

| Skill | Tier | Real-life skill | Literacy focus | VC ▲ Foundation | VC Core | VC ★ Level Up | Unlocks after | Badge | Status |
|---|---|---|---|---|---|---|---|---|---|
| **Form Filler** | Starter | Fill in official forms accurately: bank account, Tax File Number, Medicare. | Reading instructions closely; form vocabulary; accurate, legible responses. | VC2E3LA05 (Text structure and organisation)<br>VC2E4LY06 (Building fluency and making meaning)<br>VC2E4LY04 (Phonic and word knowledge) | VC2E5LY06 (Building fluency and making meaning)<br>VC2E5LA08 (Language for expressing and developing ideas)<br>VC2E5LA03 (Text structure and organisation) | VC2E7LA08 (Language for expressing and developing ideas)<br>VC2E7LY07 (Analysing, interpreting and evaluating) | Finish 2 Base Camp skills | Form Master | planned |
| **Getting Around** | Starter | Plan a trip using maps, timetables and journey-planner apps. | Reading tables, maps and symbols; following and giving directions. | VC2E4LA05 (Text structure and organisation)<br>VC2E4LY01 (Interacting with others)<br>VC2E4LY09 (Analysing, interpreting and evaluating) | VC2E6LA07 (Language for expressing and developing ideas)<br>VC2E5LY09 (Analysing, interpreting and evaluating)<br>VC2E5LY01 (Interacting with others) | VC2E7LY07 (Analysing, interpreting and evaluating)<br>VC2E7LY04 (Texts in context) | Finish 2 Base Camp skills | Navigator | planned |
| **L-Plate Ready** | Level 2 | Read and understand road rules so you’re ready for the learner permit knowledge test. | Reading information texts; technical vocabulary; diagrams and signs; answering test questions. | VC2E3LA09 (Language for expressing and developing ideas)<br>VC2E3LA11 (Language for expressing and developing ideas)<br>VC2E4LY09 (Analysing, interpreting and evaluating) | VC2E5LY09 (Analysing, interpreting and evaluating)<br>VC2E5LA08 (Language for expressing and developing ideas)<br>VC2E5LY06 (Building fluency and making meaning) | VC2E7LY07 (Analysing, interpreting and evaluating)<br>VC2E7LA08 (Language for expressing and developing ideas)<br>VC2E7LY06 (Analysing, interpreting and evaluating) | Finish both starters in Get Sorted | Road Ready | planned |
| **Health Smart** | Level 2 | Read medicine labels, book an appointment and find health info you can trust. | Reading labels and instructions; evaluating sources; asking clear questions. | VC2E3LA09 (Language for expressing and developing ideas)<br>VC2E4LY01 (Interacting with others)<br>VC2E4LY09 (Analysing, interpreting and evaluating) | VC2E5LY01 (Interacting with others)<br>VC2E5LA02 (Language for interacting with others)<br>VC2E6LY08 (Analysing, interpreting and evaluating) | VC2E8LY05 (Analysing, interpreting and evaluating)<br>VC2E8LY07 (Analysing, interpreting and evaluating) | Finish both starters in Get Sorted | Health Hero | planned |
| **Know Your Rights** | Boss | Find and understand your rights as a young person at work and when renting, and ask for help. | Reading legal-style information; summarising; writing a formal request. | VC2E4LY09 (Analysing, interpreting and evaluating)<br>VC2E4LY10 (Creating texts) | VC2E6LY08 (Analysing, interpreting and evaluating)<br>VC2E6LY09 (Creating texts)<br>VC2E6LA01 (Language for interacting with others) | VC2E8LY07 (Analysing, interpreting and evaluating)<br>VC2E8LY08 (Creating texts)<br>VC2E8LA06 (Language for expressing and developing ideas) | Finish both starters in Get Sorted; Finish 1 level-2 skill in Get Sorted | Rights Ranger | planned |

## Your Voice

_Stories, reviews, lyrics, complaints and speeches. Say what you mean and be heard._

| Skill | Tier | Real-life skill | Literacy focus | VC ▲ Foundation | VC Core | VC ★ Level Up | Unlocks after | Badge | Status |
|---|---|---|---|---|---|---|---|---|---|
| **Tell Your Story** | Starter | Tell a true story from your life in a way that grabs people. | Personal recount and narrative; descriptive language; structure (hook, build, ending). | VC2E4LE05 (Creating literature)<br>VC2E4LY10 (Creating texts)<br>VC2E4LY11 (Creating texts) | VC2E5LE05 (Creating literature)<br>VC2E5LA06 (Language for expressing and developing ideas)<br>VC2E5LY10 (Creating texts) | VC2E7LE06 (Creating literature)<br>VC2E7LY09 (Creating texts)<br>VC2E8LE05 (Examining literature) | Finish 2 Base Camp skills | Storyteller | planned |
| **Review It** | Starter | Write an honest review that helps other people decide. | Opinions with reasons; evaluative language; persuasive structure. | VC2E3LE02 (Engaging with and responding to literature)<br>VC2E4LA02 (Language for interacting with others)<br>VC2E4LE02 (Engaging with and responding to literature) | VC2E5LE02 (Engaging with and responding to literature)<br>VC2E5LA02 (Language for interacting with others)<br>VC2E5LY10 (Creating texts) | VC2E7LE02 (Engaging with and responding to literature)<br>VC2E7LA02 (Language for interacting with others)<br>VC2E8LE02 (Engaging with and responding to literature) | Finish 2 Base Camp skills | Critic | planned |
| **Lyrics Decoded** | Level 2 | Unpack the meaning in songs you love and write some lines of your own. | Figurative language, imagery, rhythm and rhyme in song lyrics and poetry. | VC2E3LE04 (Examining literature)<br>VC2E4LE04 (Examining literature) | VC2E5LE04 (Examining literature)<br>VC2E6LE04 (Examining literature)<br>VC2E6LA08 (Language for expressing and developing ideas)<br>VC2E6LE05 (Creating literature) | VC2E7LE05 (Examining literature)<br>VC2E8LE05 (Examining literature)<br>VC2E7LE06 (Creating literature) | Finish both starters in Your Voice | Lyricist | planned |
| **Complain Like a Pro** | Level 2 | Write a complaint email or make a call that actually gets results. | Persuasive and formal writing; structure (problem, evidence, request); tone. | VC2E4LA01 (Language for interacting with others)<br>VC2E4LA04 (Text structure and organisation)<br>VC2E4LY10 (Creating texts) | VC2E6LA01 (Language for interacting with others)<br>VC2E5LA02 (Language for interacting with others)<br>VC2E6LY09 (Creating texts)<br>VC2E5LY11 (Creating texts) | VC2E8LA04 (Text structure and organisation)<br>VC2E8LY08 (Creating texts)<br>VC2E7LA02 (Language for interacting with others) | Finish both starters in Your Voice | Fixer | planned |
| **Speak Up** | Boss | Plan and give a short speech about an issue you care about. | Persuasive speaking; structure; persuasive techniques; delivery. | VC2E4LY02 (Interacting with others)<br>VC2E3LA02 (Language for interacting with others) | VC2E6LY02 (Interacting with others)<br>VC2E6LY01 (Interacting with others)<br>VC2E6LA04 (Text structure and organisation) | VC2E8LY02 (Interacting with others)<br>VC2E8LY08 (Creating texts)<br>VC2E8LA02 (Language for interacting with others) | Finish both starters in Your Voice; Finish 1 level-2 skill in Your Voice | Voice of the People | planned |

## Crossroads

_Big real-world missions that mix two zones. Unlock by going deep in both._

| Skill | Tier | Real-life skill | Literacy focus | VC ▲ Foundation | VC Core | VC ★ Level Up | Unlocks after | Badge | Status |
|---|---|---|---|---|---|---|---|---|---|
| **Get the Job** | Crossroads | Apply for a real (or realistic) local job: tailored resume, cover email and mock interview. | Synthesising skills: reading the ad, writing for an audience, speaking with confidence. | VC2E4LY02 (Interacting with others)<br>VC2E4LY10 (Creating texts) | VC2E6LY02 (Interacting with others)<br>VC2E6LY09 (Creating texts)<br>VC2E6LA01 (Language for interacting with others) | VC2E7LY02 (Interacting with others)<br>VC2E7LY08 (Creating texts)<br>VC2E8LA01 (Language for interacting with others) | Finish 2 skills in Work Ready; Finish 2 skills in Your Voice | Hired | planned |
| **Move Out Ready** | Crossroads | Find a rental, read a lease, budget for bills and write a rental application. | Reading complex documents; comparing options; writing formal applications. | VC2E4LY09 (Analysing, interpreting and evaluating)<br>VC2E4LY10 (Creating texts) | VC2E6LY08 (Analysing, interpreting and evaluating)<br>VC2E6LY09 (Creating texts)<br>VC2E5LA08 (Language for expressing and developing ideas) | VC2E7LY07 (Analysing, interpreting and evaluating)<br>VC2E8LA06 (Language for expressing and developing ideas)<br>VC2E7LY08 (Creating texts) | Finish 2 skills in Money Moves; Finish 2 skills in Get Sorted | Keys in Hand | planned |
| **Side Hustle** | Crossroads | Plan a small side hustle: pitch it, price it and promote it online. | Persuasive multimodal texts; pitching; writing for customers. | VC2E4LY10 (Creating texts)<br>VC2E4LY02 (Interacting with others) | VC2E6LY07 (Analysing, interpreting and evaluating)<br>VC2E6LY09 (Creating texts)<br>VC2E6LY02 (Interacting with others) | VC2E7LY08 (Creating texts)<br>VC2E7LA07 (Language for expressing and developing ideas)<br>VC2E8LY02 (Interacting with others) | Finish 2 skills in Money Moves; Finish 2 skills in Digital Life | Hustler | planned |
| **Change Maker** | Crossroads | Run a mini campaign: a petition, a social post and a short speech for a cause. | Persuasive texts across modes; positioning an audience; evaluating impact. | VC2E4LY10 (Creating texts)<br>VC2E4LY02 (Interacting with others) | VC2E6LY09 (Creating texts)<br>VC2E6LY07 (Analysing, interpreting and evaluating)<br>VC2E6LY02 (Interacting with others) | VC2E8LY08 (Creating texts)<br>VC2E8LY05 (Analysing, interpreting and evaluating)<br>VC2E8LY02 (Interacting with others) | Finish 2 skills in Digital Life; Finish 2 skills in Your Voice | Change Maker | planned |

## Curriculum coverage (Levels 3–10)

Each cell shows how many of the official content descriptions at that level and sub-strand are linked to at least one skill.

| Strand › sub-strand | L3 | L4 | L5 | L6 | L7 | L8 | L9 | L10 |
|---|---|---|---|---|---|---|---|---|
| Language › Language for interacting with others | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 | 2/2 | 0/2 | 0/2 |
| Language › Text structure and organisation | 1/3 | 3/3 | 2/2 | 2/2 | 2/2 | 1/2 | 0/2 | 0/2 |
| Language › Language for expressing and developing ideas | 3/7 | 1/7 | 3/5 | 2/5 | 2/5 | 1/5 | 0/5 | 0/5 |
| Literature › Literature and contexts | 0/1 | 0/1 | 0/1 | 0/1 | 0/1 | 0/1 | 0/1 | 0/1 |
| Literature › Engaging with and responding to literature | 1/1 | 1/1 | 1/1 | 0/1 | 1/2 | 1/2 | 0/2 | 0/2 |
| Literature › Examining literature | 1/2 | 1/2 | 1/2 | 1/2 | 1/2 | 1/2 | 0/2 | 0/2 |
| Literature › Creating literature | 0/1 | 1/1 | 1/1 | 1/1 | 1/1 | 0/1 | 0/1 | 0/1 |
| Literacy › Interacting with others | 0/2 | 2/2 | 1/2 | 2/2 | 1/2 | 2/2 | 0/2 | 0/2 |
| Literacy › Phonic and word knowledge | 0/4 | 1/3 | 0/3 | 0/2 | · | · | · | · |
| Literacy › Building fluency and making meaning | 0/1 | 1/1 | 1/1 | 0/1 | · | · | · | · |
| Literacy › Texts in context | 1/1 | 0/1 | 0/1 | 1/1 | 1/1 | 0/1 | 0/1 | 0/1 |
| Literacy › Analysing, interpreting and evaluating | 1/2 | 2/2 | 2/2 | 2/2 | 3/3 | 2/3 | 0/3 | 0/3 |
| Literacy › Creating texts | 0/3 | 2/3 | 2/3 | 1/3 | 2/2 | 1/2 | 0/2 | 0/2 |
| Literacy › Word knowledge | · | · | · | · | 0/1 | 0/1 | 0/1 | 0/1 |

Source: Victorian Curriculum F–10 Version 2.0 — English. © VCAA. Copied word for word from the VCAA website. Retrieved 2026-10-31 from https://f10.vcaa.vic.edu.au/learning-areas/english/english/curriculum.
