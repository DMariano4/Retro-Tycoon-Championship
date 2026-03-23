/**
 * Match screen helper functions and constants.
 * Extracted from match.tsx for Phase 7 refactoring.
 */
import { FORMATION_REQUIREMENTS as FORMATION_REQS, POSITION_COMPATIBILITY, POSITION_GROUPS } from '../../constants';
import { getEventIcon, getEventColor } from '../../utils/formatters';

export { POSITION_COMPATIBILITY, POSITION_GROUPS };
export { getEventIcon, getEventColor };

// Re-export with proper string indexing
export const FORMATION_REQUIREMENTS: Record<string, Record<string, number>> = FORMATION_REQS as Record<string, Record<string, number>>;

// Player type reference (imported from GameContext in match.tsx)
type Player = {
  id: string;
  name: string;
  position: string;
  current_ability: number;
  fitness: number;
  form: number;
  age: number;
  injury?: {
    type: string;
    severity: string;
    recoveryWeeks: number;
    injuredDate: string;
  };
  [key: string]: any;
};

// Formation positions for pitch visualization
export const FORMATION_POSITIONS: Record<string, { position: string; x: number; y: number }[]> = {
  '4-4-2': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 25 }, { position: 'CB', x: 38, y: 22 },
    { position: 'CB', x: 62, y: 22 }, { position: 'RB', x: 85, y: 25 },
    { position: 'LM', x: 15, y: 50 }, { position: 'CM', x: 38, y: 48 },
    { position: 'CM', x: 62, y: 48 }, { position: 'RM', x: 85, y: 50 },
    { position: 'ST', x: 38, y: 75 }, { position: 'ST', x: 62, y: 75 },
  ],
  '4-3-3': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 25 }, { position: 'CB', x: 38, y: 22 },
    { position: 'CB', x: 62, y: 22 }, { position: 'RB', x: 85, y: 25 },
    { position: 'CM', x: 30, y: 48 }, { position: 'CM', x: 50, y: 45 },
    { position: 'CM', x: 70, y: 48 },
    { position: 'LW', x: 20, y: 75 }, { position: 'ST', x: 50, y: 78 },
    { position: 'RW', x: 80, y: 75 },
  ],
  '3-5-2': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'CB', x: 30, y: 22 }, { position: 'CB', x: 50, y: 20 },
    { position: 'CB', x: 70, y: 22 },
    { position: 'LM', x: 10, y: 48 }, { position: 'CM', x: 30, y: 45 },
    { position: 'CM', x: 50, y: 42 }, { position: 'CM', x: 70, y: 45 },
    { position: 'RM', x: 90, y: 48 },
    { position: 'ST', x: 38, y: 75 }, { position: 'ST', x: 62, y: 75 },
  ],
  '4-5-1': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 25 }, { position: 'CB', x: 38, y: 22 },
    { position: 'CB', x: 62, y: 22 }, { position: 'RB', x: 85, y: 25 },
    { position: 'LM', x: 10, y: 48 }, { position: 'CM', x: 35, y: 45 },
    { position: 'AM', x: 50, y: 55 }, { position: 'CM', x: 65, y: 45 },
    { position: 'RM', x: 90, y: 48 },
    { position: 'ST', x: 50, y: 78 },
  ],
  '5-3-2': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 10, y: 28 }, { position: 'CB', x: 30, y: 22 },
    { position: 'CB', x: 50, y: 20 }, { position: 'CB', x: 70, y: 22 },
    { position: 'RB', x: 90, y: 28 },
    { position: 'CM', x: 30, y: 48 }, { position: 'CM', x: 50, y: 45 },
    { position: 'CM', x: 70, y: 48 },
    { position: 'ST', x: 38, y: 75 }, { position: 'ST', x: 62, y: 75 },
  ],
  '4-2-3-1': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 25 }, { position: 'CB', x: 38, y: 22 },
    { position: 'CB', x: 62, y: 22 }, { position: 'RB', x: 85, y: 25 },
    { position: 'DM', x: 38, y: 40 }, { position: 'DM', x: 62, y: 40 },
    { position: 'LW', x: 20, y: 58 }, { position: 'AM', x: 50, y: 60 },
    { position: 'RW', x: 80, y: 58 },
    { position: 'ST', x: 50, y: 78 },
  ],
  '3-4-3': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'CB', x: 30, y: 22 }, { position: 'CB', x: 50, y: 20 },
    { position: 'CB', x: 70, y: 22 },
    { position: 'LM', x: 15, y: 48 }, { position: 'CM', x: 38, y: 45 },
    { position: 'CM', x: 62, y: 45 }, { position: 'RM', x: 85, y: 48 },
    { position: 'LW', x: 20, y: 75 }, { position: 'ST', x: 50, y: 78 },
    { position: 'RW', x: 80, y: 75 },
  ],
  '5-4-1': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 10, y: 28 }, { position: 'CB', x: 30, y: 22 },
    { position: 'CB', x: 50, y: 20 }, { position: 'CB', x: 70, y: 22 },
    { position: 'RB', x: 90, y: 28 },
    { position: 'LM', x: 15, y: 50 }, { position: 'CM', x: 38, y: 48 },
    { position: 'CM', x: 62, y: 48 }, { position: 'RM', x: 85, y: 50 },
    { position: 'ST', x: 50, y: 78 },
  ],
};

/**
 * Select best starting XI based on formation requirements
 * Prioritizes natural positions before using backup options
 * Phase 3: Excludes injured players from selection
 */
export function selectStartingXI(squad: Player[], formation: string): Player[] {
  const requirements = FORMATION_REQUIREMENTS[formation] || FORMATION_REQUIREMENTS['4-4-2'];
  const selected: Player[] = [];
  const usedPlayerIds = new Set<string>();
  
  // Phase 3: Filter out injured players
  const availableSquad = squad.filter(p => !p.injury || p.injury.recoveryWeeks <= 0);
  
  // Sort squad by ability (best players first for each selection)
  const sortedSquad = [...availableSquad].sort((a, b) => b.current_ability - a.current_ability);

  // First pass: exact position matches
  for (const [position, count] of Object.entries(requirements)) {
    let filled = 0;
    const numCount = count as number;
    for (const player of sortedSquad) {
      if (filled >= numCount) break;
      if (usedPlayerIds.has(player.id)) continue;
      if (player.position === position) {
        selected.push(player);
        usedPlayerIds.add(player.id);
        filled++;
      }
    }
  }

  // Second pass: compatible positions
  for (const [position, count] of Object.entries(requirements)) {
    const numCount = count as number;
    let needed = numCount - selected.filter(p => p.position === position).length;
    if (needed <= 0) continue;

    const compatiblePositions = POSITION_COMPATIBILITY[position] || [];
    for (const player of sortedSquad) {
      if (needed <= 0) break;
      if (usedPlayerIds.has(player.id)) continue;
      if (compatiblePositions.includes(player.position)) {
        selected.push(player);
        usedPlayerIds.add(player.id);
        needed--;
      }
    }
  }

  // Final pass: fill remaining spots with best available
  while (selected.length < 11) {
    const remaining = sortedSquad.find(p => !usedPlayerIds.has(p.id));
    if (!remaining) break;
    selected.push(remaining);
    usedPlayerIds.add(remaining.id);
  }

  return selected;
}

/**
 * Get rating badge color based on rating value
 */
export function getRatingColor(rating: number): string {
  if (rating >= 8) return '#00ff88';
  if (rating >= 7) return '#4aff88';
  if (rating >= 6) return '#ffcc00';
  if (rating >= 5) return '#ff9f43';
  return '#ff6b6b';
}

/**
 * Get rating badge background color
 */
export function getRatingBgColor(rating: number): string {
  if (rating >= 8) return '#1a4a3c';
  if (rating >= 7) return '#1a4a3c';
  if (rating >= 6) return '#3a3a1c';
  if (rating >= 5) return '#3a2a1c';
  return '#3a1a1c';
}
