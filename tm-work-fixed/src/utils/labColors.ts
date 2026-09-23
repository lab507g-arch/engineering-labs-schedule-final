const LAB_COLOR_PALETTE = [
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#ef4444', // red
  '#14b8a6', // teal
  '#f97316', // orange
  '#84cc16', // lime
];

const KNOWN_COLORS: Record<string, string> = {
  'Lab 328 ME': '#3b82f6',
  'Lab 312 ME': '#06b6d4',
  'Lab 330 ME': '#8b5cf6',
  'Lab G507': '#10b981',
  'Lab G408': '#f59e0b',
  'Lab 339 ME': '#ec4899',
};

/**
 * Deterministic color for any lab name.
 * Known labs use a fixed palette; unknown labs get a color
 * derived from a hash of their name so it's stable across renders.
 */
export function getLabColor(lab: string): string {
  if (KNOWN_COLORS[lab]) return KNOWN_COLORS[lab];

  let hash = 0;
  for (let i = 0; i < lab.length; i++) {
    hash = (hash << 5) - hash + lab.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % LAB_COLOR_PALETTE.length;
  return LAB_COLOR_PALETTE[index];
}

/**
 * Extract unique, sorted lab names from a list of sessions.
 */
export function extractUniqueLabs(sessions: { lab: string }[]): string[] {
  const set = new Set<string>();
  for (const s of sessions) {
    const lab = s.lab.trim();
    if (lab) set.add(lab);
  }
  return Array.from(set).sort();
}
