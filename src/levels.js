// Reading levels. Set per student by an admin; never shown to students.
// Mini-course text can vary by level (see docs/AUTHORING.md, "Reading levels").
export const LEVELS = {
  support: { id: 'support', label: 'Foundation', years: 'reads at about Years 3–4', symbol: '▲' },
  core: { id: 'core', label: 'Core', years: 'reads at about Years 5–6', symbol: '■' },
  extend: { id: 'extend', label: 'Extended', years: 'reads at about Year 7 and up', symbol: '●' },
};
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
