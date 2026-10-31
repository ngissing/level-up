// Programs: each has its own map, curriculum and mini courses in content/<id>/,
// and its own colour scheme. A student is enrolled in one program (set by an admin).
export const PROGRAMS = {
  f10: {
    id: 'f10', name: 'Victorian Curriculum F–10', short: 'F–10',
    curriculumName: 'Victorian Curriculum F–10 Version 2.0 — English', icon: 'lucide:book-open-check',
  },
  vm: {
    id: 'vm', name: 'VCE VM Literacy', short: 'VM Literacy',
    curriculumName: 'VCE Vocational Major Literacy Study Design (2023–2027)', icon: 'lucide:hard-hat',
  },
};
export const PROGRAM_IDS = Object.keys(PROGRAMS);
export const DEFAULT_PROGRAM = 'f10';

// Accepts the ways people might write a program in a CSV.
export function normalizeProgram(v) {
  const s = String(v ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!s) return DEFAULT_PROGRAM;
  if (['vm', 'vcevm', 'vmliteracy', 'vcevmliteracy', 'vocationalmajor', 'vcevocationalmajor'].includes(s)) return 'vm';
  if (['f10', 'vc', 'victoriancurriculum', 'vicurric', 'viccurric', 'english', 'f10english'].includes(s)) return 'f10';
  return null;
}
