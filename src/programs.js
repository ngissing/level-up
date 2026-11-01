// Programs: each has its own map, curriculum and mini courses in content/<id>/,
// and a colour scheme from its family. A student is enrolled in one program (set by an admin).
// VCE VM Literacy is two programs: Units 1 & 2 and Units 3 & 4 are taken in different years.
// VPC Literacy is one program: its four units are standalone and can be done in any order.
//
// Study designs (VM, VPC) describe how their curriculum is organised (`part`, `kinds`), and a
// program can aim its reading levels at different school years (`levels`: see src/levels.js).
const VM_KINDS = [
  { kind: 'Key knowledge', plural: 'Key knowledge', abbr: 'KK', help: 'KK3 = 3rd key knowledge point' },
  { kind: 'Key skill', plural: 'Key skills', abbr: 'KS', help: 'KS2 = 2nd key skill' },
];
const VPC_KINDS = [
  { kind: 'Learning goal', plural: 'Learning goals', abbr: 'LG', help: 'LG2 = 2nd learning goal' },
  { kind: 'Application', plural: 'Applications', abbr: 'AP', help: 'AP3 = 3rd application' },
];

export const PROGRAMS = {
  f10: {
    id: 'f10', family: 'f10', name: 'Victorian Curriculum F–10', short: 'F–10', tab: 'F–10 English', curriculumShort: 'Victorian Curriculum',
    curriculumName: 'Victorian Curriculum F–10 Version 2.0 — English', icon: 'lucide:book-open-check',
  },
  vm12: {
    id: 'vm12', family: 'vm', units: [1, 2], name: 'VCE VM Literacy Units 1 & 2', short: 'VM Literacy 1 & 2', tab: 'VM Units 1 & 2', curriculumShort: 'VCE VM Literacy',
    curriculumName: 'VCE Vocational Major Literacy Study Design (2023–2027) — Units 1 and 2', icon: 'lucide:hard-hat',
    part: 'Outcome', partAbbr: 'O', kinds: VM_KINDS,
  },
  vm34: {
    id: 'vm34', family: 'vm', units: [3, 4], name: 'VCE VM Literacy Units 3 & 4', short: 'VM Literacy 3 & 4', tab: 'VM Units 3 & 4', curriculumShort: 'VCE VM Literacy',
    curriculumName: 'VCE Vocational Major Literacy Study Design (2023–2027) — Units 3 and 4', icon: 'lucide:hard-hat',
    part: 'Outcome', partAbbr: 'O', kinds: VM_KINDS,
  },
  vpc: {
    id: 'vpc', family: 'vpc', units: [1, 2, 3, 4], name: 'VPC Literacy', short: 'VPC Literacy', tab: 'VPC Literacy', curriculumShort: 'VPC Literacy',
    curriculumName: 'Victorian Pathways Certificate Literacy Curriculum Design (2023–2027) — Units 1 to 4', icon: 'lucide:wrench',
    part: 'Module', partAbbr: 'M', kinds: VPC_KINDS,
    levels: {
      support: { years: 'reads at about Year 5', target: 5.5 },
      core: { years: 'reads at about Year 7', target: 7.5 },
      extend: { years: 'reads at about Year 9', target: 9.5 },
    },
  },
};
export const PROGRAM_IDS = Object.keys(PROGRAMS);
export const DEFAULT_PROGRAM = 'f10';
export const familyOf = (program) => PROGRAMS[program]?.family || 'f10';

// Accepts the ways people might write a program in a CSV.
export function normalizeProgram(v) {
  const s = String(v ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!s) return DEFAULT_PROGRAM;
  if (PROGRAMS[s]) return s;
  if (/^(vce)?(vm|vocationalmajor)(literacy)?(units?)?(12|1and2|1n2)$/.test(s) || ['vm', 'vcevm', 'vmliteracy', 'units12', 'unit12'].includes(s)) return 'vm12';
  if (/^(vce)?(vm|vocationalmajor)(literacy)?(units?)?(34|3and4|3n4)$/.test(s) || ['units34', 'unit34'].includes(s)) return 'vm34';
  if (/^(vpc|victorianpathways(certificate)?|pathways)(literacy)?$/.test(s)) return 'vpc';
  if (['f10', 'vc', 'victoriancurriculum', 'vicurric', 'viccurric', 'english', 'f10english'].includes(s)) return 'f10';
  return null;
}
