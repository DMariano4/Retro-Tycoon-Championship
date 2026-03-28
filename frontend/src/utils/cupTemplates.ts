/**
 * Cup Templates - International Cup Competition Configurations
 * 
 * Flexible system supporting any nation's domestic cup structure.
 * Each template defines rounds, scheduling, and rules.
 */

import { CupRound } from './competitions';

// ============================================
// CUP TEMPLATE INTERFACE
// ============================================

export interface CupTemplate {
  id: string;
  name: string;
  shortName: string;
  nation: string;
  icon: string;
  color: string;
  
  // Entry rules
  entryRound: string;              // When Premier League teams enter (e.g., 'R3')
  lowerLeagueEntryRound?: string;  // When lower league teams enter
  
  // Rounds configuration
  rounds: CupRound[];
  
  // Schedule (month/week for each round)
  schedule: Record<string, { month: number; week: number }>;
  
  // Rules
  hasSeeding: boolean;             // Are draws seeded?
  allowsReplays: boolean;          // Are replays allowed for draws?
  hasNeutralVenueFinal: boolean;   // Is final at neutral venue?
  neutralVenue?: string;           // Name of final venue (e.g., "Wembley")
  
  // Prize money (optional, indexed by round reached)
  prizeMoney?: Record<string, number>;
}

// ============================================
// ENGLAND - FA CUP
// ============================================

export const FA_CUP_TEMPLATE: CupTemplate = {
  id: 'fa_cup',
  name: 'FA Cup',
  shortName: 'FAC',
  nation: 'ENG',
  icon: '🏆',
  color: '#e41b23',
  
  entryRound: 'R3',
  lowerLeagueEntryRound: 'R1',
  
  rounds: [
    { id: 'R1', name: 'First Round', shortName: 'R1', teamCount: 80, twoLegged: false, hasReplay: true, hasExtraTime: false, hasPenalties: false },
    { id: 'R2', name: 'Second Round', shortName: 'R2', teamCount: 40, twoLegged: false, hasReplay: true, hasExtraTime: false, hasPenalties: false },
    { id: 'R3', name: 'Third Round', shortName: 'R3', teamCount: 64, twoLegged: false, hasReplay: true, hasExtraTime: false, hasPenalties: false },
    { id: 'R4', name: 'Fourth Round', shortName: 'R4', teamCount: 32, twoLegged: false, hasReplay: true, hasExtraTime: false, hasPenalties: false },
    { id: 'R5', name: 'Fifth Round', shortName: 'R5', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Quarter-Final', shortName: 'QF', teamCount: 8, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Semi-Final', shortName: 'SF', teamCount: 4, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Final', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R1': { month: 11, week: 1 },
    'R2': { month: 12, week: 1 },
    'R3': { month: 1, week: 1 },
    'R4': { month: 1, week: 4 },
    'R5': { month: 2, week: 2 },
    'QF': { month: 3, week: 2 },
    'SF': { month: 4, week: 3 },
    'F': { month: 5, week: 3 },
  },
  
  hasSeeding: false,
  allowsReplays: true,
  hasNeutralVenueFinal: true,
  neutralVenue: 'Wembley Stadium',
  
  prizeMoney: {
    'R3': 100000,
    'R4': 180000,
    'R5': 360000,
    'QF': 720000,
    'SF': 1800000,
    'F_WINNER': 3600000,
    'F_RUNNERUP': 1800000,
  },
};

// ============================================
// ENGLAND - EFL CUP (LEAGUE CUP)
// ============================================

export const EFL_CUP_TEMPLATE: CupTemplate = {
  id: 'league_cup',
  name: 'EFL Cup',
  shortName: 'EFL',
  nation: 'ENG',
  icon: '🏅',
  color: '#00a650',
  
  entryRound: 'R3',
  lowerLeagueEntryRound: 'R1',
  
  rounds: [
    { id: 'R1', name: 'First Round', shortName: 'R1', teamCount: 70, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R2', name: 'Second Round', shortName: 'R2', teamCount: 50, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R3', name: 'Third Round', shortName: 'R3', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R4', name: 'Fourth Round', shortName: 'R4', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Quarter-Final', shortName: 'QF', teamCount: 8, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Semi-Final', shortName: 'SF', teamCount: 4, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Final', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R1': { month: 8, week: 2 },
    'R2': { month: 8, week: 4 },
    'R3': { month: 9, week: 3 },
    'R4': { month: 10, week: 4 },
    'QF': { month: 12, week: 3 },
    'SF': { month: 1, week: 2 },
    'F': { month: 2, week: 4 },
  },
  
  hasSeeding: false,
  allowsReplays: false,
  hasNeutralVenueFinal: true,
  neutralVenue: 'Wembley Stadium',
  
  prizeMoney: {
    'R1': 20000,
    'R2': 40000,
    'R3': 100000,
    'R4': 200000,
    'QF': 400000,
    'SF': 750000,
    'F_WINNER': 2500000,
    'F_RUNNERUP': 1000000,
  },
};

// ============================================
// SPAIN - COPA DEL REY
// ============================================

export const COPA_DEL_REY_TEMPLATE: CupTemplate = {
  id: 'copa_del_rey',
  name: 'Copa del Rey',
  shortName: 'CDR',
  nation: 'ESP',
  icon: '👑',
  color: '#aa151b',
  
  entryRound: 'R32',
  lowerLeagueEntryRound: 'R1',
  
  rounds: [
    { id: 'R1', name: 'Primera Eliminatoria', shortName: 'R1', teamCount: 56, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R2', name: 'Segunda Eliminatoria', shortName: 'R2', teamCount: 40, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R32', name: 'Round of 32', shortName: 'R32', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R16', name: 'Round of 16', shortName: 'R16', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Cuartos de Final', shortName: 'QF', teamCount: 8, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Semifinal', shortName: 'SF', teamCount: 4, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Final', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R1': { month: 11, week: 1 },
    'R2': { month: 12, week: 1 },
    'R32': { month: 1, week: 1 },
    'R16': { month: 1, week: 3 },
    'QF': { month: 2, week: 1 },
    'SF': { month: 2, week: 3 },
    'F': { month: 4, week: 3 },
  },
  
  hasSeeding: true,  // Lower division teams get home advantage
  allowsReplays: false,
  hasNeutralVenueFinal: true,
  neutralVenue: 'Estadio de La Cartuja',
  
  prizeMoney: {
    'R32': 150000,
    'R16': 300000,
    'QF': 600000,
    'SF': 1200000,
    'F_WINNER': 5000000,
    'F_RUNNERUP': 2500000,
  },
};

// ============================================
// GERMANY - DFB-POKAL
// ============================================

export const DFB_POKAL_TEMPLATE: CupTemplate = {
  id: 'dfb_pokal',
  name: 'DFB-Pokal',
  shortName: 'DFB',
  nation: 'GER',
  icon: '🍺',
  color: '#000000',
  
  entryRound: 'R1',
  
  rounds: [
    { id: 'R1', name: 'Erste Runde', shortName: 'R1', teamCount: 64, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R2', name: 'Zweite Runde', shortName: 'R2', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R16', name: 'Achtelfinale', shortName: 'R16', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Viertelfinale', shortName: 'QF', teamCount: 8, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Halbfinale', shortName: 'SF', teamCount: 4, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Finale', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R1': { month: 8, week: 2 },
    'R2': { month: 10, week: 4 },
    'R16': { month: 1, week: 4 },
    'QF': { month: 3, week: 1 },
    'SF': { month: 4, week: 3 },
    'F': { month: 5, week: 4 },
  },
  
  hasSeeding: true,  // Lower division teams always get home
  allowsReplays: false,
  hasNeutralVenueFinal: true,
  neutralVenue: 'Olympiastadion Berlin',
};

// ============================================
// ITALY - COPPA ITALIA
// ============================================

export const COPPA_ITALIA_TEMPLATE: CupTemplate = {
  id: 'coppa_italia',
  name: 'Coppa Italia',
  shortName: 'CIT',
  nation: 'ITA',
  icon: '🇮🇹',
  color: '#009246',
  
  entryRound: 'R16',
  lowerLeagueEntryRound: 'R1',
  
  rounds: [
    { id: 'R1', name: 'Primo Turno', shortName: 'R1', teamCount: 40, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R2', name: 'Secondo Turno', shortName: 'R2', teamCount: 40, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R3', name: 'Terzo Turno', shortName: 'R3', teamCount: 20, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R16', name: 'Ottavi di Finale', shortName: 'R16', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Quarti di Finale', shortName: 'QF', teamCount: 8, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Semifinale', shortName: 'SF', teamCount: 4, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Finale', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R1': { month: 8, week: 1 },
    'R2': { month: 8, week: 2 },
    'R3': { month: 10, week: 4 },
    'R16': { month: 1, week: 2 },
    'QF': { month: 2, week: 1 },
    'SF': { month: 2, week: 4 },
    'F': { month: 5, week: 2 },
  },
  
  hasSeeding: true,
  allowsReplays: false,
  hasNeutralVenueFinal: true,
  neutralVenue: 'Stadio Olimpico',
};

// ============================================
// FRANCE - COUPE DE FRANCE
// ============================================

export const COUPE_DE_FRANCE_TEMPLATE: CupTemplate = {
  id: 'coupe_de_france',
  name: 'Coupe de France',
  shortName: 'CDF',
  nation: 'FRA',
  icon: '🐓',
  color: '#002395',
  
  entryRound: 'R32',
  lowerLeagueEntryRound: 'R7',
  
  rounds: [
    { id: 'R7', name: 'Seventh Round', shortName: 'R7', teamCount: 64, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R32', name: 'Round of 32', shortName: 'R32', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R16', name: 'Round of 16', shortName: 'R16', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Quart de Finale', shortName: 'QF', teamCount: 8, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Demi-Finale', shortName: 'SF', teamCount: 4, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Finale', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R7': { month: 12, week: 2 },
    'R32': { month: 1, week: 1 },
    'R16': { month: 1, week: 4 },
    'QF': { month: 2, week: 2 },
    'SF': { month: 3, week: 2 },
    'F': { month: 5, week: 2 },
  },
  
  hasSeeding: true,  // Lower teams get home advantage
  allowsReplays: false,
  hasNeutralVenueFinal: true,
  neutralVenue: 'Stade de France',
};

// ============================================
// TEMPLATE REGISTRY
// ============================================

export const CUP_TEMPLATES: Record<string, CupTemplate> = {
  'fa_cup': FA_CUP_TEMPLATE,
  'league_cup': EFL_CUP_TEMPLATE,
  'copa_del_rey': COPA_DEL_REY_TEMPLATE,
  'dfb_pokal': DFB_POKAL_TEMPLATE,
  'coppa_italia': COPPA_ITALIA_TEMPLATE,
  'coupe_de_france': COUPE_DE_FRANCE_TEMPLATE,
};

/**
 * Get cup templates for a specific nation
 */
export function getCupTemplatesForNation(nation: string): CupTemplate[] {
  return Object.values(CUP_TEMPLATES).filter(t => t.nation === nation);
}

/**
 * Get all available cup templates
 */
export function getAllCupTemplates(): CupTemplate[] {
  return Object.values(CUP_TEMPLATES);
}

/**
 * Get cup template by ID
 */
export function getCupTemplate(cupId: string): CupTemplate | undefined {
  return CUP_TEMPLATES[cupId];
}
