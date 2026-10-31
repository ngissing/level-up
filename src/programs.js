// Programs: each has its own map, curriculum and mini courses in content/<id>/,
// and a colour scheme from its family. A student is enrolled in one program (set by an admin).
// VCE VM Literacy is two programs: Units 1 & 2 and Units 3 & 4 are taken in different years.
export const PROGRAMS = {
  f10: {
    id: 'f10', family: 'f10', name: 'Victorian Curriculum F–10', short: 'F–10',
    curriculumName: 'Victorian Curriculum F–10 Version 2.0 — English', icon: 'lucide:book-open-check',
  },
  vm12: {
    id: 'vm12', family: 'vm', units: [1, 2], name: 'VCE VM Literacy Units 1 & 2', short: 'VM Literacy 1 & 2',
    curriculumName: 'VCE Vocational Major Literacy Study Design (2023–2027) — Units 1 and 2', icon: 'lucide:hard-hat',
  },
  vm34: {
    id: 'vm34', family: 'vm', units: [3, 4], name: 'VCE VM Literacy Units 3 & 4', short: 'VM Literacy 3 & 4',
    curriculumName: 'VCE Vocational Major Literacy Study Design (2023–2027) — Units 3 and 4', icon: 'lucide:hard-hat',
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
  if (['f10', 'vc', 'victoriancurriculum', 'vicurric', 'viccurric', 'english', 'f10english'].includes(s)) return 'f10';
  return null;
}
