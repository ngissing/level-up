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
- **Unlock rules** (in `src/content.js`):
  - Starter skills: finish 2 Base Camp skills.
  - Level-2 skills: finish 1 starter in the same zone.
  - Boss skill: finish 1 level-2 skill in the same zone.
  - Crossroads: finish 2 skills in each of the two named zones.
  - While courses are still being written, a rule never asks for more skills than are actually built, so students are never stuck behind an unwritten course.
- **Badges:** one per skill, an *Explorer* and a *Master* badge per zone, *Base Camp Cleared*, and milestones at 1, 5, 10 and 20 skills.
- **Two levels inside every skill.** Core tasks target about Level 4–6. *Level Up* tasks (marked ★ in workbooks) stretch to Level 7–8. Core VC links count as soon as a skill is signed off; Level Up links count only when the teacher confirms the extension work.

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

| Skill | Tier | Real-life skill | Literacy focus | VC core | VC Level Up | Unlocks after | Badge | Status |
|---|---|---|---|---|---|---|---|---|
| **Spot the Scam** | Base Camp | Recognise scam messages and know what to do before you click, pay or reply. | Reading for purpose and audience; spotting persuasive tricks; reading between the lines (inference). | L5 Analysing, interpreting and evaluating<br>L5 Texts in context<br>L5 Language for interacting with others | L7 Analysing, interpreting and evaluating<br>L8 Analysing, interpreting and evaluating<br>L7 Texts in context | — | Scam Buster | ✅ built |
| **Say It Right** | Base Camp | Choose the right tone and words for who you’re talking to — friends, teachers, bosses, services. | Formal and informal language (register); writing short messages for a purpose and audience. | L5 Language for interacting with others<br>L5 Creating texts<br>L4 Language for interacting with others | L7 Language for interacting with others<br>L8 Language for interacting with others<br>L7 Creating texts | — | Tone Tuner | planned |
| **Find It Fast** | Base Camp | Skim and scan websites, menus, timetables and signs to find what you need quickly. | Skimming and scanning; using headings, tables and links to navigate texts. | L5 Analysing, interpreting and evaluating<br>L4 Text structure and organisation<br>L5 Text structure and organisation | L6 Analysing, interpreting and evaluating<br>L7 Text structure and organisation | — | Speed Finder | planned |

## Money Moves

_Payslips, phone plans, budgets and the fine print. Keep more of your cash._

| Skill | Tier | Real-life skill | Literacy focus | VC core | VC Level Up | Unlocks after | Badge | Status |
|---|---|---|---|---|---|---|---|---|
| **Read Your Payslip** | Starter | Read a payslip: hours, pay rate, gross and net pay, tax and super. Spot mistakes. | Reading information in tables; technical vocabulary; checking literal details. | L5 Analysing, interpreting and evaluating<br>L4 Language for expressing and developing ideas | L6 Analysing, interpreting and evaluating<br>L6 Text structure and organisation | Finish 2 Base Camp skills | Pay Checker | planned |
| **Phone Plan Showdown** | Starter | Compare phone plans and spot what the ads don’t tell you. | Comparing information across texts; persuasive language in ads; reading the small print. | L5 Analysing, interpreting and evaluating<br>L5 Texts in context | L6 Analysing, interpreting and evaluating<br>L8 Analysing, interpreting and evaluating | Finish 2 Base Camp skills | Deal Detective | planned |
| **Budget Builder** | Level 2 | Make a simple weekly budget and a savings goal you can actually stick to. | Reading charts and tables; writing a clear plan with steps (procedural text). | L5 Creating texts<br>L5 Text structure and organisation<br>L5 Analysing, interpreting and evaluating | L6 Creating texts<br>L7 Text structure and organisation | Finish 1 starter skill in Money Moves | Budget Boss | planned |
| **Buy Smart Online** | Level 2 | Check if a seller is legit, read reviews critically and know your refund rights. | Evaluating reliability of sources; fact versus opinion; persuasive language. | L6 Analysing, interpreting and evaluating<br>L5 Texts in context<br>L6 Language for interacting with others | L8 Analysing, interpreting and evaluating<br>L7 Language for interacting with others | Finish 1 starter skill in Money Moves | Smart Shopper | planned |
| **Beat the Fine Print** | Boss | Read a contract or terms and conditions and work out what you’re really agreeing to. | Reading complex texts; technical vocabulary; summarising key points; inference. | L6 Analysing, interpreting and evaluating<br>L6 Language for expressing and developing ideas<br>L6 Text structure and organisation | L8 Analysing, interpreting and evaluating<br>L8 Text structure and organisation<br>L7 Language for expressing and developing ideas | Finish a level-2 skill in Money Moves | Fine Print Pro | planned |

## Work Ready

_Job ads, resumes, workplace talk and interviews. Get the job, keep the job._

| Skill | Tier | Real-life skill | Literacy focus | VC core | VC Level Up | Unlocks after | Badge | Status |
|---|---|---|---|---|---|---|---|---|
| **Crack the Job Ad** | Starter | Read job ads, decode the jargon and decide if a job is right for you. | Finding key information; technical and workplace vocabulary; inference. | L5 Analysing, interpreting and evaluating<br>L5 Texts in context<br>L5 Language for expressing and developing ideas | L7 Analysing, interpreting and evaluating<br>L7 Language for expressing and developing ideas | Finish 2 Base Camp skills | Job Hunter | planned |
| **Safety First at Work** | Starter | Read workplace safety signs, instructions and procedures, and ask when unsure. | Reading procedural texts; symbols and images in texts; following and writing instructions. | L4 Text structure and organisation<br>L5 Analysing, interpreting and evaluating<br>L5 Language for expressing and developing ideas | L6 Text structure and organisation<br>L7 Creating texts | Finish 2 Base Camp skills | Safety Legend | planned |
| **Build Your Resume** | Level 2 | Write a one-page resume that shows your skills, even with no work experience. | Text structure and layout; concise, precise vocabulary; editing for audience. | L5 Creating texts<br>L5 Text structure and organisation<br>L5 Language for expressing and developing ideas | L7 Creating texts<br>L7 Text structure and organisation | Finish 1 starter skill in Work Ready | Resume Ready | planned |
| **Talk the Talk at Work** | Level 2 | Handle everyday work talk: shift swaps, calling in sick, asking for help, workplace emails. | Formal language and tone; spoken interaction skills; short workplace messages. | L5 Interacting with others<br>L5 Language for interacting with others<br>L5 Creating texts | L7 Interacting with others<br>L8 Language for interacting with others | Finish 1 starter skill in Work Ready | Workplace Pro | planned |
| **Nail the Interview** | Boss | Prepare for and answer common interview questions using real examples from your life. | Planning and delivering spoken answers; listening; structuring examples (STAR). | L6 Interacting with others<br>L6 Creating texts<br>L6 Language for interacting with others | L8 Interacting with others<br>L8 Language for interacting with others | Finish a level-2 skill in Work Ready | Interview Ace | planned |

## Digital Life

_Fakes, feeds, influencers and comment sections. Run your phone, don’t let it run you._

| Skill | Tier | Real-life skill | Literacy focus | VC core | VC Level Up | Unlocks after | Badge | Status |
|---|---|---|---|---|---|---|---|---|
| **Fact or Fake?** | Starter | Check whether a post, video or news story is real before you believe or share it. | Evaluating reliability of sources; comparing information across texts. | L6 Analysing, interpreting and evaluating<br>L6 Texts in context | L8 Analysing, interpreting and evaluating<br>L8 Texts in context | Finish 2 Base Camp skills | Fact Checker | planned |
| **Your Digital Footprint** | Starter | Think about who sees your posts and write a profile/bio you’d be happy for a boss to read. | Audience and purpose; writing short texts for a public audience. | L5 Texts in context<br>L5 Creating texts<br>L5 Language for interacting with others | L7 Texts in context<br>L7 Creating texts | Finish 2 Base Camp skills | Footprint Fixer | planned |
| **Influencer Unboxed** | Level 2 | Spot sponsored content and the tricks influencers use to sell to you. | Persuasive techniques in multimodal texts; how images and words position viewers. | L6 Texts in context<br>L6 Language for expressing and developing ideas<br>L6 Analysing, interpreting and evaluating | L8 Analysing, interpreting and evaluating<br>L8 Texts in context<br>L7 Language for expressing and developing ideas | Finish 1 starter skill in Digital Life | Ad Spotter | planned |
| **Comment Section Survival** | Level 2 | Respond to online conflict, stand up for someone, and know when and how to report. | Language for respectful disagreement; tone; evaluative language. | L6 Language for interacting with others<br>L6 Interacting with others | L8 Language for interacting with others<br>L8 Interacting with others | Finish 1 starter skill in Digital Life | Cool Head | planned |
| **Make Content That Counts** | Boss | Plan, script and storyboard a short video or post that says something useful. | Creating multimodal texts; scripting; choosing images, words and sound for an audience. | L6 Creating texts<br>L6 Language for expressing and developing ideas<br>L6 Interacting with others | L7 Creating texts<br>L8 Creating texts | Finish a level-2 skill in Digital Life | Creator | planned |

## Get Sorted

_Forms, transport, L-plates, health and your rights. Adulting, sorted._

| Skill | Tier | Real-life skill | Literacy focus | VC core | VC Level Up | Unlocks after | Badge | Status |
|---|---|---|---|---|---|---|---|---|
| **Form Filler** | Starter | Fill in official forms accurately: bank account, Tax File Number, Medicare. | Reading instructions closely; form vocabulary; accurate, legible responses. | L4 Analysing, interpreting and evaluating<br>L4 Text structure and organisation<br>L4 Language for expressing and developing ideas | L6 Analysing, interpreting and evaluating<br>L6 Text structure and organisation | Finish 2 Base Camp skills | Form Master | planned |
| **Getting Around** | Starter | Plan a trip using maps, timetables and journey-planner apps. | Reading tables, maps and symbols; following and giving directions. | L4 Analysing, interpreting and evaluating<br>L5 Text structure and organisation<br>L4 Interacting with others | L6 Analysing, interpreting and evaluating<br>L6 Text structure and organisation | Finish 2 Base Camp skills | Navigator | planned |
| **L-Plate Ready** | Level 2 | Read and understand road rules so you’re ready for the learner permit knowledge test. | Reading information texts; technical vocabulary; diagrams and signs; answering test questions. | L5 Analysing, interpreting and evaluating<br>L5 Language for expressing and developing ideas<br>L5 Text structure and organisation | L7 Analysing, interpreting and evaluating<br>L7 Language for expressing and developing ideas | Finish 1 starter skill in Get Sorted | Road Ready | planned |
| **Health Smart** | Level 2 | Read medicine labels, book an appointment and find health info you can trust. | Reading labels and instructions; evaluating sources; asking clear questions. | L5 Analysing, interpreting and evaluating<br>L5 Interacting with others<br>L6 Analysing, interpreting and evaluating | L7 Analysing, interpreting and evaluating<br>L7 Interacting with others | Finish 1 starter skill in Get Sorted | Health Hero | planned |
| **Know Your Rights** | Boss | Find and understand your rights as a young person at work and when renting, and ask for help. | Reading legal-style information; summarising; writing a formal request. | L6 Analysing, interpreting and evaluating<br>L6 Creating texts<br>L6 Texts in context | L8 Analysing, interpreting and evaluating<br>L8 Creating texts | Finish a level-2 skill in Get Sorted | Rights Ranger | planned |

## Your Voice

_Stories, reviews, lyrics, complaints and speeches. Say what you mean and be heard._

| Skill | Tier | Real-life skill | Literacy focus | VC core | VC Level Up | Unlocks after | Badge | Status |
|---|---|---|---|---|---|---|---|---|
| **Tell Your Story** | Starter | Tell a true story from your life in a way that grabs people. | Personal recount and narrative; descriptive language; structure (hook, build, ending). | L5 Creating literature<br>L5 Creating texts<br>L5 Language for expressing and developing ideas | L7 Creating literature<br>L7 Language for expressing and developing ideas | Finish 2 Base Camp skills | Storyteller | planned |
| **Review It** | Starter | Write an honest review that helps other people decide. | Opinions with reasons; evaluative language; persuasive structure. | L5 Engaging with and responding to literature<br>L5 Language for interacting with others<br>L5 Creating texts | L7 Engaging with and responding to literature<br>L7 Language for interacting with others | Finish 2 Base Camp skills | Critic | planned |
| **Lyrics Decoded** | Level 2 | Unpack the meaning in songs you love and write some lines of your own. | Figurative language, imagery, rhythm and rhyme in song lyrics and poetry. | L6 Examining literature<br>L6 Engaging with and responding to literature<br>L6 Creating literature | L7 Examining literature<br>L8 Examining literature | Finish 1 starter skill in Your Voice | Lyricist | planned |
| **Complain Like a Pro** | Level 2 | Write a complaint email or make a call that actually gets results. | Persuasive and formal writing; structure (problem, evidence, request); tone. | L6 Creating texts<br>L6 Language for interacting with others<br>L5 Text structure and organisation | L8 Creating texts<br>L8 Language for interacting with others | Finish 1 starter skill in Your Voice | Fixer | planned |
| **Speak Up** | Boss | Plan and give a short speech about an issue you care about. | Persuasive speaking; structure; persuasive techniques; delivery. | L6 Interacting with others<br>L6 Creating texts<br>L6 Language for expressing and developing ideas | L8 Interacting with others<br>L8 Creating texts | Finish a level-2 skill in Your Voice | Voice of the People | planned |

## Crossroads

_Big real-world missions that mix two zones. Unlock by going deep in both._

| Skill | Tier | Real-life skill | Literacy focus | VC core | VC Level Up | Unlocks after | Badge | Status |
|---|---|---|---|---|---|---|---|---|
| **Get the Job** | Crossroads | Apply for a real (or realistic) local job: tailored resume, cover email and mock interview. | Synthesising skills: reading the ad, writing for an audience, speaking with confidence. | L7 Creating texts<br>L7 Interacting with others<br>L7 Analysing, interpreting and evaluating | L8 Creating texts<br>L8 Interacting with others | Finish 2 skills in Work Ready; Finish 2 skills in Your Voice | Hired | planned |
| **Move Out Ready** | Crossroads | Find a rental, read a lease, budget for bills and write a rental application. | Reading complex documents; comparing options; writing formal applications. | L7 Analysing, interpreting and evaluating<br>L7 Creating texts<br>L7 Text structure and organisation | L8 Analysing, interpreting and evaluating<br>L8 Creating texts | Finish 2 skills in Money Moves; Finish 2 skills in Get Sorted | Keys in Hand | planned |
| **Side Hustle** | Crossroads | Plan a small side hustle: pitch it, price it and promote it online. | Persuasive multimodal texts; pitching; writing for customers. | L7 Creating texts<br>L7 Interacting with others<br>L7 Language for interacting with others | L8 Creating texts<br>L8 Texts in context | Finish 2 skills in Money Moves; Finish 2 skills in Digital Life | Hustler | planned |
| **Change Maker** | Crossroads | Run a mini campaign: a petition, a social post and a short speech for a cause. | Persuasive texts across modes; positioning an audience; evaluating impact. | L7 Creating texts<br>L7 Texts in context<br>L7 Interacting with others | L8 Creating texts<br>L8 Texts in context<br>L8 Interacting with others | Finish 2 skills in Digital Life; Finish 2 skills in Your Voice | Change Maker | planned |

## Curriculum coverage (Levels 3–8)

Each cell lists how many skills address that sub-strand at that level (core + Level Up).

| Strand › sub-strand | L3 | L4 | L5 | L6 | L7 | L8 |
|---|---|---|---|---|---|---|
| Literacy › Texts in context | 0 | 0 | 5 | 3 | 3 | 4 |
| Literacy › Interacting with others | 0 | 1 | 2 | 4 | 5 | 5 |
| Literacy › Analysing, interpreting and evaluating | 0 | 2 | 9 | 11 | 6 | 8 |
| Literacy › Creating texts | 0 | 0 | 7 | 6 | 9 | 8 |
| Language › Language for interacting with others | · | 1 | 5 | 4 | 4 | 5 |
| Language › Text structure and organisation | 0 | 3 | 6 | 5 | 4 | 1 |
| Language › Language for expressing and developing ideas | 0 | 2 | 5 | 4 | 5 | 0 |
| Literature › Engaging with and responding to literature | · | · | 1 | 1 | 1 | 0 |
| Literature › Examining literature | · | · | 0 | 1 | 1 | 1 |
| Literature › Creating literature | · | · | 1 | 1 | 1 | 0 |

> ⚠️ Wording is paraphrased and codes are provisional. Check each entry against the VCAA site, then set verified:true and correct the code/text.
