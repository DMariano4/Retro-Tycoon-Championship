/**
 * Shared Constants for Retro Championship Tycoon
 * 
 * This file contains constants used across multiple components
 * to maintain consistency and reduce duplication.
 */

// ============================================
// FORMATIONS
// ============================================

/**
 * Available formations in the game
 */
export const FORMATIONS = ['4-4-2', '4-3-3', '3-5-2', '4-5-1', '5-3-2', '4-2-3-1', '3-4-3', '5-4-1'] as const;
export type Formation = typeof FORMATIONS[number];

/**
 * Formation requirements - what positions each formation needs
 */
export const FORMATION_REQUIREMENTS: Record<Formation, Record<string, number>> = {
  '4-4-2': { GK: 1, CB: 2, LB: 1, RB: 1, LM: 1, CM: 2, RM: 1, ST: 2 },
  '4-3-3': { GK: 1, CB: 2, LB: 1, RB: 1, CM: 3, LW: 1, ST: 1, RW: 1 },
  '3-5-2': { GK: 1, CB: 3, LM: 1, CM: 3, RM: 1, ST: 2 },
  '4-5-1': { GK: 1, CB: 2, LB: 1, RB: 1, LM: 1, CM: 2, RM: 1, AM: 1, ST: 1 },
  '5-3-2': { GK: 1, CB: 3, LB: 1, RB: 1, CM: 3, ST: 2 },
  '4-2-3-1': { GK: 1, CB: 2, LB: 1, RB: 1, DM: 2, LW: 1, AM: 1, RW: 1, ST: 1 },
  '3-4-3': { GK: 1, CB: 3, LM: 1, CM: 2, RM: 1, LW: 1, ST: 1, RW: 1 },
  '5-4-1': { GK: 1, CB: 3, LB: 1, RB: 1, LM: 1, CM: 2, RM: 1, ST: 1 },
};

/**
 * Visual positions for each formation on the pitch
 * x: 0-100 horizontal (left to right)
 * y: 0-100 vertical (from goal line, 0 = goalkeeper)
 */
export const FORMATION_POSITIONS: Record<Formation, { position: string; x: number; y: number }[]> = {
  '4-4-2': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 25 },
    { position: 'CB', x: 38, y: 22 },
    { position: 'CB', x: 62, y: 22 },
    { position: 'RB', x: 85, y: 25 },
    { position: 'LM', x: 15, y: 50 },
    { position: 'CM', x: 38, y: 48 },
    { position: 'CM', x: 62, y: 48 },
    { position: 'RM', x: 85, y: 50 },
    { position: 'ST', x: 38, y: 75 },
    { position: 'ST', x: 62, y: 75 },
  ],
  '4-3-3': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 25 },
    { position: 'CB', x: 38, y: 22 },
    { position: 'CB', x: 62, y: 22 },
    { position: 'RB', x: 85, y: 25 },
    { position: 'CM', x: 30, y: 48 },
    { position: 'CM', x: 50, y: 45 },
    { position: 'CM', x: 70, y: 48 },
    { position: 'LW', x: 15, y: 75 },
    { position: 'ST', x: 50, y: 78 },
    { position: 'RW', x: 85, y: 75 },
  ],
  '3-5-2': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'CB', x: 25, y: 22 },
    { position: 'CB', x: 50, y: 20 },
    { position: 'CB', x: 75, y: 22 },
    { position: 'LM', x: 10, y: 48 },
    { position: 'CM', x: 30, y: 45 },
    { position: 'CM', x: 50, y: 48 },
    { position: 'CM', x: 70, y: 45 },
    { position: 'RM', x: 90, y: 48 },
    { position: 'ST', x: 38, y: 75 },
    { position: 'ST', x: 62, y: 75 },
  ],
  '4-5-1': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 25 },
    { position: 'CB', x: 38, y: 22 },
    { position: 'CB', x: 62, y: 22 },
    { position: 'RB', x: 85, y: 25 },
    { position: 'LM', x: 15, y: 50 },
    { position: 'CM', x: 32, y: 48 },
    { position: 'CM', x: 50, y: 45 },
    { position: 'CM', x: 68, y: 48 },
    { position: 'RM', x: 85, y: 50 },
    { position: 'ST', x: 50, y: 78 },
  ],
  '5-3-2': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LWB', x: 10, y: 28 },
    { position: 'CB', x: 28, y: 22 },
    { position: 'CB', x: 50, y: 20 },
    { position: 'CB', x: 72, y: 22 },
    { position: 'RWB', x: 90, y: 28 },
    { position: 'CM', x: 30, y: 48 },
    { position: 'CM', x: 50, y: 45 },
    { position: 'CM', x: 70, y: 48 },
    { position: 'ST', x: 38, y: 75 },
    { position: 'ST', x: 62, y: 75 },
  ],
  '4-2-3-1': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 25 },
    { position: 'CB', x: 38, y: 22 },
    { position: 'CB', x: 62, y: 22 },
    { position: 'RB', x: 85, y: 25 },
    { position: 'DM', x: 38, y: 40 },
    { position: 'DM', x: 62, y: 40 },
    { position: 'LW', x: 15, y: 60 },
    { position: 'AM', x: 50, y: 62 },
    { position: 'RW', x: 85, y: 60 },
    { position: 'ST', x: 50, y: 80 },
  ],
  '3-4-3': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'CB', x: 25, y: 22 },
    { position: 'CB', x: 50, y: 20 },
    { position: 'CB', x: 75, y: 22 },
    { position: 'LM', x: 15, y: 48 },
    { position: 'CM', x: 38, y: 45 },
    { position: 'CM', x: 62, y: 45 },
    { position: 'RM', x: 85, y: 48 },
    { position: 'LW', x: 20, y: 75 },
    { position: 'ST', x: 50, y: 78 },
    { position: 'RW', x: 80, y: 75 },
  ],
  '5-4-1': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LWB', x: 10, y: 28 },
    { position: 'CB', x: 28, y: 22 },
    { position: 'CB', x: 50, y: 20 },
    { position: 'CB', x: 72, y: 22 },
    { position: 'RWB', x: 90, y: 28 },
    { position: 'LM', x: 15, y: 50 },
    { position: 'CM', x: 38, y: 48 },
    { position: 'CM', x: 62, y: 48 },
    { position: 'RM', x: 85, y: 50 },
    { position: 'ST', x: 50, y: 78 },
  ],
};

// ============================================
// POSITIONS
// ============================================

/**
 * All available player positions
 */
export const ALL_POSITIONS = ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'DM', 'CM', 'LM', 'RM', 'AM', 'LW', 'RW', 'ST'] as const;
export type Position = typeof ALL_POSITIONS[number];

/**
 * Position ordering for display (GK -> DEF -> MID -> FWD)
 */
export const POSITION_ORDER: Record<Position, number> = {
  GK: 0,
  CB: 1,
  LB: 2,
  RB: 3,
  LWB: 2,
  RWB: 3,
  DM: 4,
  CM: 5,
  LM: 6,
  RM: 7,
  AM: 8,
  LW: 9,
  RW: 10,
  ST: 11,
};

/**
 * Position compatibility - which positions can fill which slots
 * First position in array is preferred
 */
export const POSITION_COMPATIBILITY: Record<string, string[]> = {
  GK: ['GK'],
  CB: ['CB'],
  LB: ['LB', 'LWB', 'CB'],
  RB: ['RB', 'RWB', 'CB'],
  LWB: ['LWB', 'LB', 'LM'],
  RWB: ['RWB', 'RB', 'RM'],
  DM: ['DM', 'CM'],
  CM: ['CM', 'DM', 'AM'],
  LM: ['LM', 'LW', 'LB'],
  RM: ['RM', 'RW', 'RB'],
  AM: ['AM', 'CM', 'LW', 'RW'],
  LW: ['LW', 'LM', 'AM', 'ST'],
  RW: ['RW', 'RM', 'AM', 'ST'],
  ST: ['ST', 'AM', 'LW', 'RW'],
};

/**
 * Position groups for filtering
 */
export const POSITION_GROUPS = {
  GOALKEEPERS: ['GK'],
  DEFENDERS: ['CB', 'LB', 'RB', 'LWB', 'RWB'],
  MIDFIELDERS: ['DM', 'CM', 'LM', 'RM', 'AM'],
  FORWARDS: ['LW', 'RW', 'ST'],
} as const;

// ============================================
// MATCH ENGINE CONSTANTS
// ============================================

/**
 * Base expected goals for home and away teams
 * Based on Premier League averages
 */
export const MATCH_ENGINE = {
  HOME_TEAM_BASE_XG: 1.45,
  AWAY_TEAM_BASE_XG: 1.15,
  ATTACK_DEFENSE_DIFF_WEIGHT: 0.5,
  MIDFIELD_DIFF_WEIGHT: 0.3,
  MAX_XG_PER_TEAM: 3.5,
  MIN_XG_PER_TEAM: 0.3,
} as const;

/**
 * Mentality modifiers for attack and defense
 * Index 0-4 corresponds to mentality 1-5
 */
export const MENTALITY_MODIFIERS = {
  ATTACK: [-0.25, -0.12, 0, 0.12, 0.25],
  DEFENSE: [0.20, 0.10, 0, -0.08, -0.18],
} as const;

/**
 * Passing style effects
 */
export const PASSING_MODIFIERS: Record<string, { chanceCreation: number; conversion: number }> = {
  direct: { chanceCreation: 1.20, conversion: 0.85 },
  mixed: { chanceCreation: 1.00, conversion: 1.00 },
  short: { chanceCreation: 0.85, conversion: 1.15 },
};

/**
 * Tempo effects
 */
export const TEMPO_MODIFIERS: Record<string, { chanceCreation: number; defensiveStability: number }> = {
  slow: { chanceCreation: 0.85, defensiveStability: 1.10 },
  normal: { chanceCreation: 1.00, defensiveStability: 1.00 },
  fast: { chanceCreation: 1.15, defensiveStability: 0.90 },
};

/**
 * Tackling effects
 */
export const TACKLING_MODIFIERS: Record<string, { fouls: number; ballRecovery: number }> = {
  easy: { fouls: 0.70, ballRecovery: 0.90 },
  normal: { fouls: 1.00, ballRecovery: 1.00 },
  hard: { fouls: 1.40, ballRecovery: 1.15 },
};

/**
 * Closing down effects
 */
export const CLOSING_DOWN_MODIFIERS: Record<string, { pressing: number; spaceAllowed: number }> = {
  never: { pressing: 0.70, spaceAllowed: 1.20 },
  sometimes: { pressing: 1.00, spaceAllowed: 1.00 },
  always: { pressing: 1.35, spaceAllowed: 0.80 },
};

// ============================================
// UI CONSTANTS
// ============================================

/**
 * Color palette
 */
export const COLORS = {
  PRIMARY: '#00ff88',
  PRIMARY_DARK: '#00cc6a',
  SECONDARY: '#4a9eff',
  BACKGROUND: '#0a1628',
  CARD_BACKGROUND: '#0f2744',
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#6a8aaa',
  ERROR: '#ff6b6b',
  WARNING: '#ffaa00',
  SUCCESS: '#00ff88',
} as const;

/**
 * Position colors for visual identification
 */
export const POSITION_COLORS: Record<string, string> = {
  GK: '#ffcc00',  // Yellow
  CB: '#4a9eff',  // Blue
  LB: '#4a9eff',
  RB: '#4a9eff',
  LWB: '#4a9eff',
  RWB: '#4a9eff',
  DM: '#00cc6a',  // Green
  CM: '#00cc6a',
  LM: '#00cc6a',
  RM: '#00cc6a',
  AM: '#00cc6a',
  LW: '#ff6b6b',  // Red
  RW: '#ff6b6b',
  ST: '#ff6b6b',
};
