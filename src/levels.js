// Reading levels. Set per student by an admin; never shown to students.
// Mini-course text can vary by level (see docs/AUTHORING.md, "Reading levels").
// The three levels are the same everywhere, but a program can aim them at different
// school years (VPC: Years 5, 7 and 9). Use levelInfo(id, program) to get the right one.
import { PROGRAMS } from './programs.js';

export const LEVELS = {
  support: { id: 'support', label: 'Foundation', years: 'reads at about Years 3–4', symbol: '▲', target: 4.5 },
  core: { id: 'core', label: 'Core', years: 'reads at about Years 5–6', symbol: '■', target: 6.5 },
  extend: { id: 'extend', label: 'Extended', years: 'reads at about Year 7 and up', symbol: '●', target: 8.5 },
};
// A level as it applies in one program: `years` (for staff) and `target` (rough
// Flesch–Kincaid ceiling used by npm run check).
export const levelInfo = (id, program) => ({ ...(LEVELS[id] || LEVELS.core), ...(PROGRAMS[program]?.levels?.[id] || {}) });
export const LEVEL_IDS = Object.keys(LEVELS);
export const DEFAULT_LEVEL = 'core';

// Accepts the many ways people write a level in a CSV.
export function normalizeLevel(v) {
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return DEFAULT_LEVEL;
  if (['support', 'foundation', 'f', '3', '4', '3-4', 'years 3-4', 'yr 3-4'].includes(s)) return 'support';
  if (['extend', 'extended', 'e', '7', '7+', '8', 'year 7+', 'yr 7+'].includes(s)) return 'extend';
  if (['core', 'c', '5', '6', '5-6', 'years 5-6', 'yr 5-6'].includes(s)) return 'core';
  return LEVEL_IDS.includes(s) ? s : null;
}
