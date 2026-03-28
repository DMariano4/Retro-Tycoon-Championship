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
// PORTUGAL - TAÇA DE PORTUGAL
// ============================================

export const TACA_DE_PORTUGAL_TEMPLATE: CupTemplate = {
  id: 'taca_de_portugal',
  name: 'Taça de Portugal',
  shortName: 'TDP',
  nation: 'POR',
  icon: '🇵🇹',
  color: '#006600',
  
  entryRound: 'R4',
  lowerLeagueEntryRound: 'R1',
  
  rounds: [
    { id: 'R1', name: 'Primeira Eliminatória', shortName: 'R1', teamCount: 70, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R2', name: 'Segunda Eliminatória', shortName: 'R2', teamCount: 48, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R3', name: 'Terceira Eliminatória', shortName: 'R3', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R4', name: 'Quarta Eliminatória', shortName: 'R4', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R16', name: 'Oitavos de Final', shortName: 'R16', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Quartos de Final', shortName: 'QF', teamCount: 8, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Meias-Finais', shortName: 'SF', teamCount: 4, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Final', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R1': { month: 9, week: 2 },
    'R2': { month: 10, week: 2 },
    'R3': { month: 11, week: 2 },
    'R4': { month: 12, week: 2 },
    'R16': { month: 1, week: 2 },
    'QF': { month: 2, week: 2 },
    'SF': { month: 3, week: 2 },
    'F': { month: 5, week: 4 },
  },
  
  hasSeeding: true,
  allowsReplays: false,
  hasNeutralVenueFinal: true,
  neutralVenue: 'Estádio Nacional',
};

// ============================================
// NETHERLANDS - KNVB BEKER
// ============================================

export const KNVB_BEKER_TEMPLATE: CupTemplate = {
  id: 'knvb_beker',
  name: 'KNVB Beker',
  shortName: 'KNVB',
  nation: 'NED',
  icon: '🧡',
  color: '#FF6600',
  
  entryRound: 'R2',
  lowerLeagueEntryRound: 'R1',
  
  rounds: [
    { id: 'R1', name: 'Eerste Ronde', shortName: 'R1', teamCount: 64, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R2', name: 'Tweede Ronde', shortName: 'R2', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R16', name: 'Achtste Finale', shortName: 'R16', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Kwartfinale', shortName: 'QF', teamCount: 8, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Halve Finale', shortName: 'SF', teamCount: 4, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Finale', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R1': { month: 10, week: 4 },
    'R2': { month: 12, week: 3 },
    'R16': { month: 1, week: 3 },
    'QF': { month: 2, week: 1 },
    'SF': { month: 3, week: 3 },
    'F': { month: 4, week: 3 },
  },
  
  hasSeeding: false,
  allowsReplays: false,
  hasNeutralVenueFinal: true,
  neutralVenue: 'De Kuip',
};

// ============================================
// BELGIUM - BEKER VAN BELGIË
// ============================================

export const BEKER_VAN_BELGIE_TEMPLATE: CupTemplate = {
  id: 'beker_van_belgie',
  name: 'Beker van België',
  shortName: 'BVB',
  nation: 'BEL',
  icon: '🍫',
  color: '#ED2939',
  
  entryRound: 'R16',
  lowerLeagueEntryRound: 'R1',
  
  rounds: [
    { id: 'R1', name: 'Eerste Ronde', shortName: 'R1', teamCount: 64, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R2', name: 'Tweede Ronde', shortName: 'R2', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R16', name: 'Achtste Finale', shortName: 'R16', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Kwartfinale', shortName: 'QF', teamCount: 8, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Halve Finale', shortName: 'SF', teamCount: 4, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Finale', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R1': { month: 9, week: 3 },
    'R2': { month: 11, week: 1 },
    'R16': { month: 12, week: 3 },
    'QF': { month: 1, week: 4 },
    'SF': { month: 2, week: 4 },
    'F': { month: 4, week: 4 },
  },
  
  hasSeeding: true,
  allowsReplays: false,
  hasNeutralVenueFinal: true,
  neutralVenue: 'Koning Boudewijnstadion',
};

// ============================================
// TURKEY - TÜRKİYE KUPASI
// ============================================

export const TURKIYE_KUPASI_TEMPLATE: CupTemplate = {
  id: 'turkiye_kupasi',
  name: 'Türkiye Kupası',
  shortName: 'TK',
  nation: 'TUR',
  icon: '🌙',
  color: '#E30A17',
  
  entryRound: 'R5',
  lowerLeagueEntryRound: 'R1',
  
  rounds: [
    { id: 'R1', name: 'Birinci Tur', shortName: 'R1', teamCount: 78, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R2', name: 'İkinci Tur', shortName: 'R2', teamCount: 52, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R3', name: 'Üçüncü Tur', shortName: 'R3', teamCount: 44, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R4', name: 'Dördüncü Tur', shortName: 'R4', teamCount: 40, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R5', name: 'Beşinci Tur', shortName: 'R5', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R16', name: 'Son 16', shortName: 'R16', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Çeyrek Final', shortName: 'QF', teamCount: 8, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Yarı Final', shortName: 'SF', teamCount: 4, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Final', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R1': { month: 9, week: 2 },
    'R2': { month: 10, week: 1 },
    'R3': { month: 10, week: 4 },
    'R4': { month: 11, week: 3 },
    'R5': { month: 12, week: 2 },
    'R16': { month: 1, week: 2 },
    'QF': { month: 2, week: 2 },
    'SF': { month: 3, week: 3 },
    'F': { month: 5, week: 2 },
  },
  
  hasSeeding: true,
  allowsReplays: false,
  hasNeutralVenueFinal: true,
  neutralVenue: 'Atatürk Olimpiyat Stadı',
};

// ============================================
// AUSTRIA - ÖFB-CUP
// ============================================

export const OFB_CUP_TEMPLATE: CupTemplate = {
  id: 'ofb_cup',
  name: 'ÖFB-Cup',
  shortName: 'ÖFB',
  nation: 'AUT',
  icon: '🏔️',
  color: '#ED2939',
  
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
    'R1': { month: 7, week: 3 },
    'R2': { month: 10, week: 4 },
    'R16': { month: 2, week: 2 },
    'QF': { month: 3, week: 3 },
    'SF': { month: 4, week: 2 },
    'F': { month: 5, week: 1 },
  },
  
  hasSeeding: true,
  allowsReplays: false,
  hasNeutralVenueFinal: true,
  neutralVenue: 'Wörthersee Stadion',
};

// ============================================
// SWITZERLAND - SCHWEIZER CUP
// ============================================

export const SCHWEIZER_CUP_TEMPLATE: CupTemplate = {
  id: 'schweizer_cup',
  name: 'Schweizer Cup',
  shortName: 'SCH',
  nation: 'SUI',
  icon: '🏔️',
  color: '#FF0000',
  
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
    'R1': { month: 9, week: 2 },
    'R2': { month: 10, week: 3 },
    'R16': { month: 2, week: 4 },
    'QF': { month: 3, week: 4 },
    'SF': { month: 4, week: 2 },
    'F': { month: 5, week: 4 },
  },
  
  hasSeeding: true,
  allowsReplays: false,
  hasNeutralVenueFinal: true,
  neutralVenue: 'Stade de Suisse',
};

// ============================================
// SCOTLAND - SCOTTISH CUP
// ============================================

export const SCOTTISH_CUP_TEMPLATE: CupTemplate = {
  id: 'scottish_cup',
  name: 'Scottish Cup',
  shortName: 'SFC',
  nation: 'SCO',
  icon: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  color: '#0065BF',
  
  entryRound: 'R4',
  lowerLeagueEntryRound: 'R1',
  
  rounds: [
    { id: 'R1', name: 'First Round', shortName: 'R1', teamCount: 32, twoLegged: false, hasReplay: true, hasExtraTime: false, hasPenalties: false },
    { id: 'R2', name: 'Second Round', shortName: 'R2', teamCount: 32, twoLegged: false, hasReplay: true, hasExtraTime: false, hasPenalties: false },
    { id: 'R3', name: 'Third Round', shortName: 'R3', teamCount: 32, twoLegged: false, hasReplay: true, hasExtraTime: false, hasPenalties: false },
    { id: 'R4', name: 'Fourth Round', shortName: 'R4', teamCount: 32, twoLegged: false, hasReplay: true, hasExtraTime: false, hasPenalties: false },
    { id: 'R5', name: 'Fifth Round', shortName: 'R5', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Quarter-Final', shortName: 'QF', teamCount: 8, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Semi-Final', shortName: 'SF', teamCount: 4, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Final', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R1': { month: 9, week: 2 },
    'R2': { month: 10, week: 2 },
    'R3': { month: 11, week: 4 },
    'R4': { month: 1, week: 3 },
    'R5': { month: 2, week: 2 },
    'QF': { month: 3, week: 2 },
    'SF': { month: 4, week: 2 },
    'F': { month: 5, week: 3 },
  },
  
  hasSeeding: false,
  allowsReplays: true,
  hasNeutralVenueFinal: true,
  neutralVenue: 'Hampden Park',
};

// ============================================
// UKRAINE - KUBOK UKRAINY
// ============================================

export const KUBOK_UKRAINY_TEMPLATE: CupTemplate = {
  id: 'kubok_ukrainy',
  name: 'Kubok Ukrainy',
  shortName: 'KUK',
  nation: 'UKR',
  icon: '🌻',
  color: '#005BBB',
  
  entryRound: 'R16',
  lowerLeagueEntryRound: 'R1',
  
  rounds: [
    { id: 'R1', name: 'Pershyi Raund', shortName: 'R1', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R2', name: 'Druhyi Raund', shortName: 'R2', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R16', name: '1/8 Finalu', shortName: 'R16', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Chvert-Final', shortName: 'QF', teamCount: 8, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Piv-Final', shortName: 'SF', teamCount: 4, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Final', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R1': { month: 8, week: 2 },
    'R2': { month: 9, week: 4 },
    'R16': { month: 10, week: 4 },
    'QF': { month: 3, week: 3 },
    'SF': { month: 4, week: 2 },
    'F': { month: 5, week: 3 },
  },
  
  hasSeeding: true,
  allowsReplays: false,
  hasNeutralVenueFinal: true,
  neutralVenue: 'Olimpiyskiy Stadium',
};

// ============================================
// DENMARK - DBU POKALEN
// ============================================

export const DBU_POKALEN_TEMPLATE: CupTemplate = {
  id: 'dbu_pokalen',
  name: 'DBU Pokalen',
  shortName: 'DBU',
  nation: 'DEN',
  icon: '🇩🇰',
  color: '#C60C30',
  
  entryRound: 'R4',
  lowerLeagueEntryRound: 'R1',
  
  rounds: [
    { id: 'R1', name: 'Første Runde', shortName: 'R1', teamCount: 64, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R2', name: 'Anden Runde', shortName: 'R2', teamCount: 48, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R3', name: 'Tredje Runde', shortName: 'R3', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R4', name: 'Fjerde Runde', shortName: 'R4', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Kvartfinale', shortName: 'QF', teamCount: 8, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Semifinale', shortName: 'SF', teamCount: 4, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Finale', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R1': { month: 8, week: 2 },
    'R2': { month: 9, week: 2 },
    'R3': { month: 10, week: 4 },
    'R4': { month: 2, week: 4 },
    'QF': { month: 3, week: 4 },
    'SF': { month: 4, week: 2 },
    'F': { month: 5, week: 2 },
  },
  
  hasSeeding: true,
  allowsReplays: false,
  hasNeutralVenueFinal: true,
  neutralVenue: 'Parken Stadium',
};

// ============================================
// GREECE - KYPELLO ELLADAS
// ============================================

export const KYPELLO_ELLADAS_TEMPLATE: CupTemplate = {
  id: 'kypello_elladas',
  name: 'Kypello Elladas',
  shortName: 'KEL',
  nation: 'GRE',
  icon: '🏛️',
  color: '#0D5EAF',
  
  entryRound: 'R4',
  lowerLeagueEntryRound: 'R1',
  
  rounds: [
    { id: 'R1', name: 'Protos Gyros', shortName: 'R1', teamCount: 48, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R2', name: 'Defteros Gyros', shortName: 'R2', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R3', name: 'Tritos Gyros', shortName: 'R3', teamCount: 24, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R4', name: 'Tetartos Gyros', shortName: 'R4', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Proimitelikos', shortName: 'QF', teamCount: 8, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Imitelikos', shortName: 'SF', teamCount: 4, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Telikos', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R1': { month: 9, week: 3 },
    'R2': { month: 10, week: 3 },
    'R3': { month: 11, week: 3 },
    'R4': { month: 12, week: 3 },
    'QF': { month: 2, week: 1 },
    'SF': { month: 3, week: 2 },
    'F': { month: 5, week: 2 },
  },
  
  hasSeeding: true,
  allowsReplays: false,
  hasNeutralVenueFinal: true,
  neutralVenue: 'OAKA Stadium',
};

// ============================================
// CZECH REPUBLIC - MOL CUP
// ============================================

export const MOL_CUP_TEMPLATE: CupTemplate = {
  id: 'mol_cup',
  name: 'MOL Cup',
  shortName: 'MOL',
  nation: 'CZE',
  icon: '🦁',
  color: '#11457E',
  
  entryRound: 'R3',
  lowerLeagueEntryRound: 'R1',
  
  rounds: [
    { id: 'R1', name: 'První Kolo', shortName: 'R1', teamCount: 64, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R2', name: 'Druhé Kolo', shortName: 'R2', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R3', name: 'Třetí Kolo', shortName: 'R3', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Čtvrtfinále', shortName: 'QF', teamCount: 8, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Semifinále', shortName: 'SF', teamCount: 4, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Finále', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R1': { month: 8, week: 3 },
    'R2': { month: 9, week: 4 },
    'R3': { month: 10, week: 4 },
    'QF': { month: 4, week: 1 },
    'SF': { month: 4, week: 3 },
    'F': { month: 5, week: 2 },
  },
  
  hasSeeding: true,
  allowsReplays: false,
  hasNeutralVenueFinal: false,
};

// ============================================
// CROATIA - HRVATSKI NOGOMETNI KUP
// ============================================

export const HNK_CUP_TEMPLATE: CupTemplate = {
  id: 'hnk_cup',
  name: 'Hrvatski Nogometni Kup',
  shortName: 'HNK',
  nation: 'CRO',
  icon: '🇭🇷',
  color: '#FF0000',
  
  entryRound: 'R16',
  lowerLeagueEntryRound: 'R1',
  
  rounds: [
    { id: 'R1', name: 'Prvo Kolo', shortName: 'R1', teamCount: 64, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R2', name: 'Drugo Kolo', shortName: 'R2', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R16', name: 'Osmina Finala', shortName: 'R16', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Četvrtfinale', shortName: 'QF', teamCount: 8, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Polufinale', shortName: 'SF', teamCount: 4, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Finale', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R1': { month: 9, week: 1 },
    'R2': { month: 10, week: 4 },
    'R16': { month: 2, week: 4 },
    'QF': { month: 3, week: 3 },
    'SF': { month: 4, week: 2 },
    'F': { month: 5, week: 3 },
  },
  
  hasSeeding: true,
  allowsReplays: false,
  hasNeutralVenueFinal: false,
};

// ============================================
// SERBIA - KUP SRBIJE
// ============================================

export const KUP_SRBIJE_TEMPLATE: CupTemplate = {
  id: 'kup_srbije',
  name: 'Kup Srbije',
  shortName: 'KSR',
  nation: 'SRB',
  icon: '🦅',
  color: '#C6363C',
  
  entryRound: 'R16',
  lowerLeagueEntryRound: 'R1',
  
  rounds: [
    { id: 'R1', name: 'Šesnaestina Finala', shortName: 'R1', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R16', name: 'Osmina Finala', shortName: 'R16', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Četvrtfinale', shortName: 'QF', teamCount: 8, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Polufinale', shortName: 'SF', teamCount: 4, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Finale', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R1': { month: 9, week: 4 },
    'R16': { month: 10, week: 4 },
    'QF': { month: 3, week: 2 },
    'SF': { month: 4, week: 3 },
    'F': { month: 5, week: 4 },
  },
  
  hasSeeding: true,
  allowsReplays: false,
  hasNeutralVenueFinal: true,
  neutralVenue: 'Stadion Rajko Mitić',
};

// ============================================
// POLAND - PUCHAR POLSKI
// ============================================

export const PUCHAR_POLSKI_TEMPLATE: CupTemplate = {
  id: 'puchar_polski',
  name: 'Puchar Polski',
  shortName: 'PP',
  nation: 'POL',
  icon: '🦅',
  color: '#DC143C',
  
  entryRound: 'R32',
  lowerLeagueEntryRound: 'R1',
  
  rounds: [
    { id: 'R1', name: 'I Runda', shortName: 'R1', teamCount: 64, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R32', name: '1/32 Finału', shortName: 'R32', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R16', name: '1/16 Finału', shortName: 'R16', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Ćwierćfinał', shortName: 'QF', teamCount: 8, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Półfinał', shortName: 'SF', teamCount: 4, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Finał', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R1': { month: 8, week: 1 },
    'R32': { month: 9, week: 4 },
    'R16': { month: 10, week: 4 },
    'QF': { month: 3, week: 4 },
    'SF': { month: 4, week: 2 },
    'F': { month: 5, week: 1 },
  },
  
  hasSeeding: true,
  allowsReplays: false,
  hasNeutralVenueFinal: true,
  neutralVenue: 'Stadion Narodowy',
};

// ============================================
// ROMANIA - CUPA ROMÂNIEI
// ============================================

export const CUPA_ROMANIEI_TEMPLATE: CupTemplate = {
  id: 'cupa_romaniei',
  name: 'Cupa României',
  shortName: 'CRO',
  nation: 'ROU',
  icon: '🇷🇴',
  color: '#002B7F',
  
  entryRound: 'R16',
  lowerLeagueEntryRound: 'R1',
  
  rounds: [
    { id: 'R1', name: 'Turul I', shortName: 'R1', teamCount: 64, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R2', name: 'Turul II', shortName: 'R2', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R16', name: 'Optimi de Finală', shortName: 'R16', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Sferturi de Finală', shortName: 'QF', teamCount: 8, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Semifinale', shortName: 'SF', teamCount: 4, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Finala', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R1': { month: 9, week: 2 },
    'R2': { month: 10, week: 3 },
    'R16': { month: 3, week: 1 },
    'QF': { month: 4, week: 1 },
    'SF': { month: 4, week: 4 },
    'F': { month: 5, week: 4 },
  },
  
  hasSeeding: true,
  allowsReplays: false,
  hasNeutralVenueFinal: true,
  neutralVenue: 'Arena Națională',
};

// ============================================
// RUSSIA - KUBOK ROSSII (for completeness)
// ============================================

export const KUBOK_ROSSII_TEMPLATE: CupTemplate = {
  id: 'kubok_rossii',
  name: 'Kubok Rossii',
  shortName: 'KRU',
  nation: 'RUS',
  icon: '🐻',
  color: '#0039A6',
  
  entryRound: 'R32',
  lowerLeagueEntryRound: 'R1',
  
  rounds: [
    { id: 'R1', name: '1/128', shortName: 'R1', teamCount: 128, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R64', name: '1/64', shortName: 'R64', teamCount: 64, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R32', name: '1/32', shortName: 'R32', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'R16', name: '1/16', shortName: 'R16', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'QF', name: 'Chetvertfinal', shortName: 'QF', teamCount: 8, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'SF', name: 'Polufinal', shortName: 'SF', teamCount: 4, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
    { id: 'F', name: 'Final', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  ],
  
  schedule: {
    'R1': { month: 7, week: 3 },
    'R64': { month: 8, week: 1 },
    'R32': { month: 9, week: 4 },
    'R16': { month: 10, week: 4 },
    'QF': { month: 3, week: 2 },
    'SF': { month: 4, week: 2 },
    'F': { month: 5, week: 3 },
  },
  
  hasSeeding: true,
  allowsReplays: false,
  hasNeutralVenueFinal: false,
};

// ============================================
// TEMPLATE REGISTRY
// ============================================

export const CUP_TEMPLATES: Record<string, CupTemplate> = {
  // England
  'fa_cup': FA_CUP_TEMPLATE,
  'league_cup': EFL_CUP_TEMPLATE,
  // Spain
  'copa_del_rey': COPA_DEL_REY_TEMPLATE,
  // Germany
  'dfb_pokal': DFB_POKAL_TEMPLATE,
  // Italy
  'coppa_italia': COPPA_ITALIA_TEMPLATE,
  // France
  'coupe_de_france': COUPE_DE_FRANCE_TEMPLATE,
  // Portugal
  'taca_de_portugal': TACA_DE_PORTUGAL_TEMPLATE,
  // Netherlands
  'knvb_beker': KNVB_BEKER_TEMPLATE,
  // Belgium
  'beker_van_belgie': BEKER_VAN_BELGIE_TEMPLATE,
  // Turkey
  'turkiye_kupasi': TURKIYE_KUPASI_TEMPLATE,
  // Austria
  'ofb_cup': OFB_CUP_TEMPLATE,
  // Switzerland
  'schweizer_cup': SCHWEIZER_CUP_TEMPLATE,
  // Scotland
  'scottish_cup': SCOTTISH_CUP_TEMPLATE,
  // Ukraine
  'kubok_ukrainy': KUBOK_UKRAINY_TEMPLATE,
  // Denmark
  'dbu_pokalen': DBU_POKALEN_TEMPLATE,
  // Greece
  'kypello_elladas': KYPELLO_ELLADAS_TEMPLATE,
  // Czech Republic
  'mol_cup': MOL_CUP_TEMPLATE,
  // Croatia
  'hnk_cup': HNK_CUP_TEMPLATE,
  // Serbia
  'kup_srbije': KUP_SRBIJE_TEMPLATE,
  // Poland
  'puchar_polski': PUCHAR_POLSKI_TEMPLATE,
  // Romania
  'cupa_romaniei': CUPA_ROMANIEI_TEMPLATE,
  // Russia
  'kubok_rossii': KUBOK_ROSSII_TEMPLATE,
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
