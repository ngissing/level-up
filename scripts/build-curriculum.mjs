// Builds content/curriculum.json from a compact table.
// NOTE: wording is PARAPHRASED from the Victorian Curriculum F–10 Version 2.0 English
// and codes are best-effort. Every entry is marked verified:false until checked
// against https://f10.vcaa.vic.edu.au (blocked from the build environment).
import { writeFileSync } from 'node:fs';

const SUB = {
  TIC: ['Literacy', 'Texts in context', 'LY'],
  IWO: ['Literacy', 'Interacting with others', 'LY'],
  AIE: ['Literacy', 'Analysing, interpreting and evaluating', 'LY'],
  CT:  ['Literacy', 'Creating texts', 'LY'],
  LIO: ['Language', 'Language for interacting with others', 'LA'],
  TSO: ['Language', 'Text structure and organisation', 'LA'],
  EDI: ['Language', 'Language for expressing and developing ideas', 'LA'],
  ER:  ['Literature', 'Engaging with and responding to literature', 'LE'],
  EX:  ['Literature', 'Examining literature', 'LE'],
  CL:  ['Literature', 'Creating literature', 'LE'],
};

const T = {
  TIC: {
    3: 'Identify how texts are shaped by the purpose and audience they are made for.',
    4: 'Explain how texts reflect the contexts, purposes and audiences they are made for.',
    5: 'Explain how texts present ideas, people and issues differently depending on purpose and audience.',
    6: 'Examine how texts, including digital texts, present information and viewpoints for different purposes and audiences.',
    7: 'Analyse how representations of people, places, events and ideas reflect the contexts in which texts are created.',
    8: 'Analyse how texts are shaped by context and how they position audiences to accept particular viewpoints.',
  },
  IWO: {
    3: 'Use interaction skills (listening, turn-taking, asking questions) to share ideas; plan and deliver short presentations.',
    4: 'Use interaction skills to contribute to and clarify discussions; plan and deliver short spoken and multimodal presentations.',
    5: 'Use interaction skills, including active listening and clear speaking, to develop ideas; deliver presentations that suit purpose and audience.',
    6: 'Use interaction skills to present and support opinions and respond to others; deliver logically structured presentations with multimodal elements.',
    7: 'Use interaction skills to discuss and present ideas, evaluating features of texts; plan and deliver presentations suited to the audience.',
    8: 'Use interaction skills to discuss, debate and present viewpoints, varying language and delivery for effect.',
  },
  AIE: {
    3: 'Use comprehension strategies (predicting, questioning, monitoring, summarising) to build literal and inferred meaning; use text features and images to help meaning.',
    4: 'Use comprehension strategies to build literal and inferred meaning, find the main idea and supporting details, and connect ideas across texts.',
    5: 'Use comprehension strategies to build literal and inferred meaning and evaluate ideas; navigate print and digital texts using features such as headings, links and tables.',
    6: 'Use comprehension strategies to interpret and analyse information, compare information across texts and evaluate the reliability of sources.',
    7: 'Analyse and evaluate how language, structure and multimodal features shape meaning; analyse implicit and explicit ideas.',
    8: 'Evaluate how texts use language and visual techniques to persuade and position readers; analyse and synthesise information from several sources.',
  },
  CT: {
    3: 'Plan, draft and publish imaginative, informative and persuasive texts with a clear sequence and topic vocabulary.',
    4: 'Plan, draft and publish texts with ideas grouped into paragraphs and suitable vocabulary; re-read and edit for meaning.',
    5: 'Plan, create, edit and publish texts that suit purpose and audience, using paragraphs, precise vocabulary and multimodal features.',
    6: 'Plan, create, edit and publish texts with a logical structure, supporting evidence and language that suits purpose, audience and form.',
    7: 'Plan, create, edit and publish imaginative, informative and persuasive texts, choosing structure, language and multimodal features for the audience.',
    8: 'Plan, create, edit and publish texts that develop and justify a point of view using evidence and persuasive techniques.',
  },
  LIO: {
    4: 'Understand that language choices (formal or informal, tone) change depending on who we are communicating with and why.',
    5: 'Understand how to move between formal and informal language to suit context and relationship; use language to express opinions.',
    6: 'Understand how language choices, including evaluative and emotive language, show relationships and express viewpoints.',
    7: 'Understand how language choices, including modality and evaluative language, are used to persuade, express opinions and build relationships.',
    8: 'Understand how to adjust register, tone and modality for an audience, and how language can include or exclude people.',
  },
  TSO: {
    3: 'Understand how different types of texts are organised (e.g. procedures, recounts) and how headings and layout help readers.',
    4: 'Understand how texts are organised by purpose, and how paragraphs, headings and navigation features help readers find information.',
    5: 'Understand how informative and persuasive texts use different structures and features, and how cohesive words link ideas.',
    6: 'Understand how text structures and features (tables, captions, sections) are used for different purposes, including in digital texts.',
    7: 'Understand how structures and features such as headings, cohesive links and layout support purpose in print, digital and multimodal texts.',
    8: 'Analyse how text structures and conventions are adapted for purpose and audience, including combining text types.',
  },
  EDI: {
    3: 'Use topic-specific vocabulary and understand how images and words work together to create meaning.',
    4: 'Use precise and technical vocabulary; understand how complex sentences link ideas.',
    5: 'Use noun groups, verbs and adverbials to add precise detail; explore how word choice and images create meaning.',
    6: 'Use a range of sentence types and vocabulary for clarity and effect; understand how visual elements add meaning.',
    7: 'Understand how vocabulary (including technical and figurative language) and sentence structures shape meaning; analyse how images and layout create meaning.',
    8: 'Analyse and use language features such as emotive vocabulary, nominalisation and figurative language for effect.',
  },
  ER: {
    5: 'Present a personal response to literary texts, explaining likes and dislikes with reasons.',
    6: 'Compare personal responses to literary texts and explain how texts connect to their own experiences.',
    7: 'Explain personal responses to literary texts, including how texts connect to their own and others’ experiences and values.',
    8: 'Explain and justify responses to literary texts, considering different viewpoints and values.',
  },
  EX: {
    5: 'Identify how authors use language features, including imagery and sound, to create effects.',
    6: 'Identify and explain how figurative language, imagery and sound devices create meaning and effect.',
    7: 'Analyse how language features such as figurative language, rhythm and rhyme shape meaning in literary texts, including poetry and song lyrics.',
    8: 'Analyse how authors use language, structure and voice to create tone, mood and meaning.',
  },
  CL: {
    5: 'Create narratives and poems drawing on personal experience, using descriptive language and dialogue.',
    6: 'Create literary texts that experiment with structure, voice and language for effect.',
    7: 'Create literary texts drawing on personal experience, using language and structure for effect.',
    8: 'Create literary texts that use voice, point of view and language features to engage an audience.',
  },
};

const counters = {};
const entries = [];
for (const level of [3, 4, 5, 6, 7, 8]) {
  for (const [key, [strand, substrand, abbr]] of Object.entries(SUB)) {
    const text = T[key][level];
    if (!text) continue;
    const ck = level + abbr;
    counters[ck] = (counters[ck] || 0) + 1;
    entries.push({
      id: `L${level}-${key}`,
      code: `VC2E${level}${abbr}${String(counters[ck]).padStart(2, '0')}`,
      level, strand, substrand, focus: key, text, verified: false,
    });
  }
}

writeFileSync(new URL('../content/curriculum.json', import.meta.url), JSON.stringify({
  source: 'Victorian Curriculum F–10 Version 2.0 — English (paraphrased)',
  note: 'Wording is paraphrased and codes are provisional. Check each entry against the VCAA site, then set verified:true and correct the code/text.',
  focusAreas: Object.fromEntries(Object.entries(SUB).map(([k, [strand, substrand]]) => [k, { strand, substrand }])),
  entries,
}, null, 2));
console.log(entries.length, 'entries');
