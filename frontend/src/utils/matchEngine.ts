/**
 * CM01/02-Inspired Match Engine
 * 
 * Phase 1 Features:
 * - Tactics Influence (mentality, passing, tempo, defensive settings)
 * - Realistic Scorelines (Poisson distribution)
 * - Position-Based Strength (Attack/Midfield/Defense ratings)
 * - Home Advantage
 * - Starting XI consideration
 * 
 * Phase 2 Features:
 * - Enhanced Player Match Ratings (position-based, event-driven)
 * - Match Momentum System (goals shift momentum)
 * - Tactical Matchups (formation counters)
 * - Key Player Moments (star player clutch bonus)
 * - Substitution Impact (fresh legs boost)
 */

import { Player, Team } from '../context/GameContext';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface TeamTactics {
  formation: string;
  mentality: number;        // 1-5 (very defensive to very attacking)
  passingStyle: string;     // 'direct' | 'mixed' | 'short'
  tempo: string;            // 'slow' | 'normal' | 'fast'
  tackling: string;         // 'easy' | 'normal' | 'hard'
  closingDown: string;      // 'never' | 'sometimes' | 'always'
  offsideTrap: boolean;
  counterAttack: boolean;
}

export interface TeamRatings {
  attack: number;
  midfield: number;
  defense: number;
  goalkeeper: number;
  overall: number;
}

export interface MatchEvent {
  type: 'GOAL' | 'CHANCE' | 'SAVE' | 'YELLOW_CARD' | 'RED_CARD' | 'FOUL' | 'CORNER' | 'OFFSIDE' | 'INJURY';
  minute: number;
  team: string;
  player: string;
  assistPlayer?: string;
  description: string;
}

export interface MatchResult {
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  stats: MatchStats;
  playerRatings: { [playerId: string]: number };
  momentum: MomentumHistory;
}

export interface MatchStats {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
  yellowCards: { home: number; away: number };
  offsides: { home: number; away: number };
}

// Phase 2: New interfaces
export interface MomentumHistory {
  timeline: { minute: number; homeValue: number; awayValue: number }[];
  finalHome: number;
  finalAway: number;
}

export interface PlayerMatchPerformance {
  playerId: string;
  playerName: string;
  position: string;
  goals: number;
  assists: number;
  shotsOnTarget: number;
  shotsMissed: number;
  tackles: number;
  fouls: number;
  yellowCards: number;
  saves: number;
  rating: number;
}

// ============================================
// CONSTANTS
// ============================================

// Mentality modifiers (index 0-4 for mentality 1-5)
const MENTALITY_ATTACK_MOD = [-0.25, -0.12, 0, 0.12, 0.25];
const MENTALITY_DEFENSE_MOD = [0.20, 0.10, 0, -0.08, -0.18];

// Passing style modifiers
const PASSING_MODIFIERS: Record<string, { chanceCreation: number; conversion: number }> = {
  'direct': { chanceCreation: 1.20, conversion: 0.85 },
  'mixed': { chanceCreation: 1.00, conversion: 1.00 },
  'short': { chanceCreation: 0.85, conversion: 1.15 },
};

// Tempo modifiers
const TEMPO_MODIFIERS: Record<string, { chanceCreation: number; defensiveStability: number }> = {
  'slow': { chanceCreation: 0.85, defensiveStability: 1.10 },
  'normal': { chanceCreation: 1.00, defensiveStability: 1.00 },
  'fast': { chanceCreation: 1.15, defensiveStability: 0.90 },
};

// Defensive modifiers
const TACKLING_MODIFIERS: Record<string, { fouls: number; ballRecovery: number }> = {
  'easy': { fouls: 0.70, ballRecovery: 0.90 },
  'normal': { fouls: 1.00, ballRecovery: 1.00 },
  'hard': { fouls: 1.40, ballRecovery: 1.15 },
};

const CLOSING_DOWN_MODIFIERS: Record<string, { pressing: number; spaceAllowed: number }> = {
  'never': { pressing: 0.70, spaceAllowed: 1.20 },
  'sometimes': { pressing: 1.00, spaceAllowed: 1.00 },
  'always': { pressing: 1.35, spaceAllowed: 0.80 },
};

// ============================================
// PHASE 2: NEW CONSTANTS
// ============================================

// Tactical matchup bonuses - formation counters
const FORMATION_MATCHUPS: Record<string, { counters: string[]; bonus: number }> = {
  '4-4-2': { counters: ['4-3-3', '3-4-3'], bonus: 0.10 },      // Solid vs wide formations
  '4-3-3': { counters: ['4-5-1', '5-4-1'], bonus: 0.12 },      // Width beats defensive
  '3-5-2': { counters: ['4-4-2', '4-2-3-1'], bonus: 0.10 },    // Midfield overload
  '4-5-1': { counters: ['3-5-2', '3-4-3'], bonus: 0.08 },      // Compact vs risky
  '5-3-2': { counters: ['4-3-3', '4-2-3-1'], bonus: 0.08 },    // Defensive solidity
  '4-2-3-1': { counters: ['4-4-2', '5-3-2'], bonus: 0.12 },    // Creativity vs rigid
  '3-4-3': { counters: ['5-3-2', '5-4-1'], bonus: 0.15 },      // All-out attack
  '5-4-1': { counters: ['3-4-3', '4-3-3'], bonus: 0.10 },      // Ultra defensive counter
};

// Mentality matchup bonuses
const MENTALITY_MATCHUPS = {
  // Counter-attacking (defensive) vs Very Attacking gets bonus
  counterBonus: 0.15,
  // Pressing (attacking) vs Very Defensive gets bonus  
  pressingBonus: 0.10,
};

// Key moment minutes (when star players shine)
const KEY_MOMENTS = {
  firstHalfEnd: { start: 40, end: 45, bonus: 0.15 },
  secondHalfStart: { start: 46, end: 55, bonus: 0.10 },
  finalPush: { start: 80, end: 90, bonus: 0.20 },
};

// Substitution impact by minute
const SUBSTITUTION_IMPACT = {
  early: { maxMinute: 60, fitnessBoost: 0.05, performanceBoost: 0.08 },
  normal: { maxMinute: 75, fitnessBoost: 0.08, performanceBoost: 0.12 },
  late: { maxMinute: 90, fitnessBoost: 0.10, performanceBoost: 0.15 },
};

// Momentum constants
const MOMENTUM = {
  baseValue: 50,              // Starting momentum (neutral)
  goalSwing: 15,              // Momentum shift on goal
  chanceSwing: 3,             // Small shift on chance
  saveSwing: 5,               // Shift on good save
  cardSwing: -5,              // Negative shift on card received
  maxValue: 85,               // Maximum momentum
  minValue: 15,               // Minimum momentum
  decayRate: 0.02,            // Momentum decay per minute toward neutral
  effectOnXG: 0.15,           // How much momentum affects expected goals
};

// Position weights for different ratings
const POSITION_WEIGHTS = {
  attack: {
    'ST': 1.0, 'LW': 0.85, 'RW': 0.85, 'AM': 0.70, 'CM': 0.30, 'LM': 0.50, 'RM': 0.50,
  },
  midfield: {
    'CM': 1.0, 'DM': 0.90, 'AM': 0.80, 'LM': 0.85, 'RM': 0.85, 'LW': 0.40, 'RW': 0.40,
  },
  defense: {
    'CB': 1.0, 'LB': 0.85, 'RB': 0.85, 'LWB': 0.80, 'RWB': 0.80, 'DM': 0.60,
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Poisson distribution for realistic goal generation
 * Most real football matches: 0-0, 1-0, 1-1, 2-1, 2-0
 */
function poissonRandom(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  
  return k - 1;
}

/**
 * Get default tactics if none set
 */
function getTeamTactics(team: Team): TeamTactics {
  const tactics = team.tactics || {};
  return {
    formation: team.formation || '4-4-2',
    mentality: tactics.mentality ?? 3,
    passingStyle: tactics.passingStyle || 'mixed',
    tempo: tactics.tempo || 'normal',
    tackling: tactics.tackling || 'normal',
    closingDown: tactics.closingDown || 'sometimes',
    offsideTrap: tactics.offsideTrap || false,
    counterAttack: tactics.counterAttack || false,
  };
}

/**
 * Get starting XI (first 11 players, ideally sorted by position)
 */
function getStartingXI(team: Team): Player[] {
  // Sort by position priority: GK first, then DEF, MID, FWD
  const positionOrder: Record<string, number> = {
    'GK': 0, 'CB': 1, 'LB': 2, 'RB': 3, 'LWB': 2, 'RWB': 3,
    'DM': 4, 'CM': 5, 'LM': 6, 'RM': 7, 'AM': 8,
    'LW': 9, 'RW': 10, 'ST': 11
  };
  
  const sorted = [...team.squad].sort((a, b) => {
    const orderA = positionOrder[a.position] ?? 6;
    const orderB = positionOrder[b.position] ?? 6;
    if (orderA !== orderB) return orderA - orderB;
    return b.current_ability - a.current_ability; // Higher ability first within position
  });
  
  return sorted.slice(0, 11);
}

/**
 * Calculate weighted average of player attributes
 */
function weightedAverage(players: Player[], getAttribute: (p: Player) => number, getWeight: (p: Player) => number): number {
  if (players.length === 0) return 10; // Default to average
  
  let totalWeight = 0;
  let weightedSum = 0;
  
  players.forEach(p => {
    const weight = getWeight(p);
    weightedSum += getAttribute(p) * weight;
    totalWeight += weight;
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 10;
}

// ============================================
// CORE RATING CALCULATIONS
// ============================================

/**
 * Calculate team ratings based on starting XI and positions
 */
export function calculateTeamRatings(team: Team): TeamRatings {
  const startingXI = getStartingXI(team);
  
  // Goalkeeper rating
  const goalkeepers = startingXI.filter(p => p.position === 'GK');
  const goalkeeper = goalkeepers.length > 0
    ? (goalkeepers[0].reflexes + goalkeepers[0].handling + goalkeepers[0].positioning + goalkeepers[0].communication) / 4
    : 10;
  
  // Attack rating - weighted by position and relevant attributes
  const attackers = startingXI.filter(p => 
    ['ST', 'LW', 'RW', 'AM', 'CM', 'LM', 'RM'].includes(p.position)
  );
  const attack = weightedAverage(
    attackers,
    p => (p.finishing * 0.35 + p.off_the_ball * 0.25 + p.pace * 0.15 + p.dribbling * 0.15 + p.composure * 0.10),
    p => (POSITION_WEIGHTS.attack[p.position as keyof typeof POSITION_WEIGHTS.attack] || 0.3)
  );
  
  // Midfield rating - weighted by position and relevant attributes
  const midfielders = startingXI.filter(p => 
    ['CM', 'DM', 'AM', 'LM', 'RM', 'LW', 'RW'].includes(p.position)
  );
  const midfield = weightedAverage(
    midfielders,
    p => (p.passing * 0.30 + p.vision * 0.20 + p.work_rate * 0.15 + p.stamina * 0.15 + p.control * 0.10 + p.decision_making * 0.10),
    p => (POSITION_WEIGHTS.midfield[p.position as keyof typeof POSITION_WEIGHTS.midfield] || 0.3)
  );
  
  // Defense rating - weighted by position and relevant attributes
  const defenders = startingXI.filter(p => 
    ['CB', 'LB', 'RB', 'LWB', 'RWB', 'DM'].includes(p.position)
  );
  const defense = weightedAverage(
    defenders,
    p => (p.tackling * 0.30 + p.marking * 0.25 + p.positioning * 0.20 + p.strength * 0.15 + p.concentration * 0.10),
    p => (POSITION_WEIGHTS.defense[p.position as keyof typeof POSITION_WEIGHTS.defense] || 0.3)
  );
  
  // Overall is weighted average
  const overall = (attack * 0.30 + midfield * 0.35 + defense * 0.25 + goalkeeper * 0.10);
  
  return { attack, midfield, defense, goalkeeper, overall };
}

/**
 * Apply form and fitness modifiers to team ratings
 */
function applyFormAndFitness(ratings: TeamRatings, team: Team): TeamRatings {
  const startingXI = getStartingXI(team);
  
  // Calculate average form and fitness (1-20 scale)
  const avgForm = startingXI.reduce((sum, p) => sum + p.form, 0) / startingXI.length;
  const avgFitness = startingXI.reduce((sum, p) => sum + p.fitness, 0) / startingXI.length;
  
  // Form modifier: form of 10 = no change, 20 = +10%, 1 = -10%
  const formModifier = 1 + ((avgForm - 10) / 100);
  
  // Fitness modifier: fitness of 20 = no change, 10 = -5%, 1 = -15%
  const fitnessModifier = 1 - ((20 - avgFitness) / 133);
  
  const combinedModifier = formModifier * fitnessModifier;
  
  return {
    attack: ratings.attack * combinedModifier,
    midfield: ratings.midfield * combinedModifier,
    defense: ratings.defense * combinedModifier,
    goalkeeper: ratings.goalkeeper * combinedModifier,
    overall: ratings.overall * combinedModifier,
  };
}

// ============================================
// TACTICAL CALCULATIONS
// ============================================

/**
 * Calculate expected goals based on team ratings and tactics
 */
function calculateExpectedGoals(
  attackingTeam: Team,
  defendingTeam: Team,
  attackingRatings: TeamRatings,
  defendingRatings: TeamRatings,
  isHome: boolean
): number {
  const attackTactics = getTeamTactics(attackingTeam);
  const defenseTactics = getTeamTactics(defendingTeam);
  
  // Base expected goals (Premier League average: ~1.4 home, ~1.1 away)
  let baseXG = isHome ? 1.45 : 1.15;
  
  // Attack vs Defense calculation
  // If attack rating > defense rating, increase xG
  const attackDefenseDiff = (attackingRatings.attack - defendingRatings.defense) / 20;
  baseXG *= (1 + attackDefenseDiff * 0.5);
  
  // Midfield influence on chance creation
  const midfieldDiff = (attackingRatings.midfield - defendingRatings.midfield) / 20;
  baseXG *= (1 + midfieldDiff * 0.3);
  
  // Goalkeeper influence
  const gkPenalty = (15 - defendingRatings.goalkeeper) / 50; // Good GK reduces xG
  baseXG *= (1 + gkPenalty);
  
  // Apply attacking team's tactics
  const mentalityMod = MENTALITY_ATTACK_MOD[attackTactics.mentality - 1] || 0;
  baseXG *= (1 + mentalityMod);
  
  const passingMod = PASSING_MODIFIERS[attackTactics.passingStyle] || PASSING_MODIFIERS['mixed'];
  baseXG *= passingMod.chanceCreation * passingMod.conversion;
  
  const tempoMod = TEMPO_MODIFIERS[attackTactics.tempo] || TEMPO_MODIFIERS['normal'];
  baseXG *= tempoMod.chanceCreation;
  
  // Apply defending team's tactics
  const defMentalityMod = MENTALITY_DEFENSE_MOD[defenseTactics.mentality - 1] || 0;
  baseXG *= (1 - defMentalityMod);
  
  const defTempoMod = TEMPO_MODIFIERS[defenseTactics.tempo] || TEMPO_MODIFIERS['normal'];
  baseXG *= (2 - defTempoMod.defensiveStability); // Inverse - their stability hurts our xG
  
  // Pressing impact
  const closingDownMod = CLOSING_DOWN_MODIFIERS[defenseTactics.closingDown] || CLOSING_DOWN_MODIFIERS['sometimes'];
  baseXG *= closingDownMod.spaceAllowed;
  
  // Counter-attack bonus when opponent is attacking
  if (attackTactics.counterAttack && defenseTactics.mentality >= 4) {
    baseXG *= 1.15; // 15% bonus on counter
  }
  
  // Offside trap risk/reward
  if (defenseTactics.offsideTrap) {
    // Can catch attackers offside but risky if beaten
    if (Math.random() > 0.7) {
      baseXG *= 1.20; // Trap failed, more space
    } else {
      baseXG *= 0.90; // Trap worked
    }
  }
  
  // Ensure reasonable bounds (0.3 to 3.5 xG per team)
  return Math.max(0.3, Math.min(3.5, baseXG));
}

// ============================================
// EVENT GENERATION
// ============================================

/**
 * Select a player to score based on position and attributes
 */
function selectScorer(team: Team): Player {
  const startingXI = getStartingXI(team);
  
  // Weight by position and finishing ability
  const scorerWeights: { player: Player; weight: number }[] = startingXI.map(p => {
    let positionWeight = 0;
    switch (p.position) {
      case 'ST': positionWeight = 40; break;
      case 'LW': case 'RW': positionWeight = 20; break;
      case 'AM': positionWeight = 15; break;
      case 'CM': case 'LM': case 'RM': positionWeight = 8; break;
      case 'DM': positionWeight = 3; break;
      case 'CB': case 'LB': case 'RB': positionWeight = 2; break;
      default: positionWeight = 1;
    }
    
    // Modify by finishing ability
    const abilityWeight = p.finishing / 10;
    const formWeight = p.form / 15;
    
    return { player: p, weight: positionWeight * abilityWeight * formWeight };
  });
  
  // Weighted random selection
  const totalWeight = scorerWeights.reduce((sum, sw) => sum + sw.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const sw of scorerWeights) {
    random -= sw.weight;
    if (random <= 0) return sw.player;
  }
  
  return scorerWeights[0]?.player || startingXI[0];
}

/**
 * Select a player to assist based on position and attributes
 */
function selectAssister(team: Team, scorer: Player): Player | null {
  const startingXI = getStartingXI(team).filter(p => p.id !== scorer.id);
  
  // 20% chance of no assist (solo goal)
  if (Math.random() < 0.20) return null;
  
  const assisterWeights: { player: Player; weight: number }[] = startingXI.map(p => {
    let positionWeight = 0;
    switch (p.position) {
      case 'AM': positionWeight = 25; break;
      case 'LW': case 'RW': positionWeight = 20; break;
      case 'CM': case 'LM': case 'RM': positionWeight = 18; break;
      case 'ST': positionWeight = 12; break;
      case 'LB': case 'RB': positionWeight = 8; break;
      case 'DM': positionWeight = 5; break;
      default: positionWeight = 2;
    }
    
    const abilityWeight = (p.vision + p.passing + p.crossing) / 30;
    
    return { player: p, weight: positionWeight * abilityWeight };
  });
  
  const totalWeight = assisterWeights.reduce((sum, sw) => sum + sw.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const sw of assisterWeights) {
    random -= sw.weight;
    if (random <= 0) return sw.player;
  }
  
  return assisterWeights[0]?.player || null;
}

/**
 * Generate goal description based on context
 */
function generateGoalDescription(scorer: Player, assister: Player | null, minute: number): string {
  const soloDescriptions = [
    `${scorer.name} scores! Brilliant individual effort!`,
    `GOAL! ${scorer.name} finds the back of the net with a stunning strike!`,
    `${scorer.name} beats the keeper! What a finish!`,
    `Incredible solo goal from ${scorer.name}!`,
    `${scorer.name} with an unstoppable shot into the corner!`,
  ];
  
  const assistedDescriptions = [
    `${scorer.name} scores! Great assist from ${assister?.name}!`,
    `GOAL! ${assister?.name} sets up ${scorer.name} perfectly!`,
    `${assister?.name} with the pass, ${scorer.name} with the finish!`,
    `Lovely team play! ${assister?.name} to ${scorer.name}, GOAL!`,
    `${scorer.name} taps in from ${assister?.name}'s cross!`,
  ];
  
  const lateDescriptions = [
    `LATE DRAMA! ${scorer.name} scores in the ${minute}th minute!`,
    `${scorer.name} with a crucial late goal!`,
  ];
  
  const lateAssistedDescriptions = [
    `LATE DRAMA! ${assister?.name} sets up ${scorer.name} in the ${minute}th minute!`,
    `${scorer.name} with a crucial late goal! Assist by ${assister?.name}!`,
  ];
  
  if (minute >= 85) {
    if (assister) {
      return lateAssistedDescriptions[Math.floor(Math.random() * lateAssistedDescriptions.length)];
    }
    return lateDescriptions[Math.floor(Math.random() * lateDescriptions.length)];
  }
  
  if (assister) {
    return assistedDescriptions[Math.floor(Math.random() * assistedDescriptions.length)];
  }
  
  return soloDescriptions[Math.floor(Math.random() * soloDescriptions.length)];
}

/**
 * Generate other match events (chances, saves, fouls, cards)
 */
function generateOtherEvents(
  homeTeam: Team,
  awayTeam: Team,
  homeTactics: TeamTactics,
  awayTactics: TeamTactics,
  homeShots: number,
  awayShots: number
): MatchEvent[] {
  const events: MatchEvent[] = [];
  
  // Generate chances (shots that didn't result in goals)
  const homeChances = Math.max(0, homeShots - Math.floor(Math.random() * 3));
  const awayChances = Math.max(0, awayShots - Math.floor(Math.random() * 3));
  
  const chanceDescriptions = [
    (name: string) => `${name} with a good chance but it goes wide!`,
    (name: string) => `${name} fires over the bar!`,
    (name: string) => `Close! ${name}'s shot just misses the target!`,
    (name: string) => `${name} couldn't keep his shot down!`,
  ];
  
  const saveDescriptions = [
    (name: string) => `Great save to deny ${name}!`,
    (name: string) => `The keeper pulls off a stunning save from ${name}!`,
    (name: string) => `${name}'s effort is well saved!`,
    (name: string) => `Fantastic reflexes to keep out ${name}'s shot!`,
  ];
  
  // Add home chances
  for (let i = 0; i < homeChances; i++) {
    const minute = Math.floor(Math.random() * 90) + 1;
    const player = selectScorer(homeTeam);
    const isSave = Math.random() > 0.5;
    
    events.push({
      type: isSave ? 'SAVE' : 'CHANCE',
      minute,
      team: homeTeam.short_name,
      player: player.name,
      description: isSave 
        ? saveDescriptions[Math.floor(Math.random() * saveDescriptions.length)](player.name)
        : chanceDescriptions[Math.floor(Math.random() * chanceDescriptions.length)](player.name),
    });
  }
  
  // Add away chances
  for (let i = 0; i < awayChances; i++) {
    const minute = Math.floor(Math.random() * 90) + 1;
    const player = selectScorer(awayTeam);
    const isSave = Math.random() > 0.5;
    
    events.push({
      type: isSave ? 'SAVE' : 'CHANCE',
      minute,
      team: awayTeam.short_name,
      player: player.name,
      description: isSave 
        ? saveDescriptions[Math.floor(Math.random() * saveDescriptions.length)](player.name)
        : chanceDescriptions[Math.floor(Math.random() * chanceDescriptions.length)](player.name),
    });
  }
  
  // Generate fouls based on tackling intensity
  const homeTacklingMod = TACKLING_MODIFIERS[homeTactics.tackling] || TACKLING_MODIFIERS['normal'];
  const awayTacklingMod = TACKLING_MODIFIERS[awayTactics.tackling] || TACKLING_MODIFIERS['normal'];
  
  const homeFouls = Math.floor((4 + Math.random() * 8) * homeTacklingMod.fouls);
  const awayFouls = Math.floor((4 + Math.random() * 8) * awayTacklingMod.fouls);
  
  const foulDescriptions = [
    (name: string) => `Free kick awarded after a foul by ${name}.`,
    (name: string) => `${name} brings down his opponent. Free kick.`,
    (name: string) => `${name} commits a tactical foul.`,
  ];
  
  // Add fouls (shown as events) - weighted by tackling intensity
  const totalFouls = Math.floor((homeFouls + awayFouls) * 0.4); // Show ~40% as events
  const homeFoulWeight = homeFouls / (homeFouls + awayFouls || 1);
  for (let i = 0; i < totalFouls; i++) {
    const isHome = Math.random() < homeFoulWeight;
    const team = isHome ? homeTeam : awayTeam;
    const startingXI = getStartingXI(team);
    const player = startingXI[Math.floor(Math.random() * startingXI.length)];
    
    events.push({
      type: 'FOUL',
      minute: Math.floor(Math.random() * 90) + 1,
      team: team.short_name,
      player: player.name,
      description: foulDescriptions[Math.floor(Math.random() * foulDescriptions.length)](player.name),
    });
  }
  
  // Generate yellow cards based on fouls and tackling style
  const homeYellows = Math.floor(homeFouls / 6 * homeTacklingMod.fouls);
  const awayYellows = Math.floor(awayFouls / 6 * awayTacklingMod.fouls);
  
  const cardDescriptions = [
    (name: string) => `Yellow card shown to ${name} for a reckless challenge.`,
    (name: string) => `${name} is booked for persistent fouling.`,
    (name: string) => `The referee shows ${name} a yellow card.`,
    (name: string) => `${name} goes into the book for a late tackle.`,
  ];
  
  for (let i = 0; i < homeYellows; i++) {
    const startingXI = getStartingXI(homeTeam);
    const player = startingXI[Math.floor(Math.random() * startingXI.length)];
    events.push({
      type: 'YELLOW_CARD',
      minute: Math.floor(Math.random() * 90) + 1,
      team: homeTeam.short_name,
      player: player.name,
      description: cardDescriptions[Math.floor(Math.random() * cardDescriptions.length)](player.name),
    });
  }
  
  for (let i = 0; i < awayYellows; i++) {
    const startingXI = getStartingXI(awayTeam);
    const player = startingXI[Math.floor(Math.random() * startingXI.length)];
    events.push({
      type: 'YELLOW_CARD',
      minute: Math.floor(Math.random() * 90) + 1,
      team: awayTeam.short_name,
      player: player.name,
      description: cardDescriptions[Math.floor(Math.random() * cardDescriptions.length)](player.name),
    });
  }
  
  return events;
}

// ============================================
// PHASE 2: NEW HELPER FUNCTIONS
// ============================================

/**
 * Calculate tactical matchup bonus based on formations
 */
function calculateTacticalMatchup(
  attackingFormation: string,
  defendingFormation: string
): number {
  const matchup = FORMATION_MATCHUPS[attackingFormation];
  if (matchup && matchup.counters.includes(defendingFormation)) {
    return matchup.bonus;
  }
  return 0;
}

/**
 * Calculate mentality matchup bonus
 */
function calculateMentalityMatchup(
  attackingMentality: number,
  defendingMentality: number,
  isCounterAttack: boolean
): number {
  // Counter-attacking team vs very attacking opponent
  if (isCounterAttack && defendingMentality >= 4) {
    return MENTALITY_MATCHUPS.counterBonus;
  }
  // High pressing team vs very defensive opponent
  if (attackingMentality >= 4 && defendingMentality <= 2) {
    return MENTALITY_MATCHUPS.pressingBonus;
  }
  return 0;
}

/**
 * Check if current minute is a key moment
 */
function isKeyMoment(minute: number): { isKey: boolean; bonus: number } {
  for (const [, period] of Object.entries(KEY_MOMENTS)) {
    if (minute >= period.start && minute <= period.end) {
      return { isKey: true, bonus: period.bonus };
    }
  }
  return { isKey: false, bonus: 0 };
}

/**
 * Get star player (highest ability in starting XI)
 */
function getStarPlayer(team: Team): Player {
  const startingXI = getStartingXI(team);
  return startingXI.reduce((best, player) => 
    player.current_ability > best.current_ability ? player : best
  , startingXI[0]);
}

/**
 * Calculate momentum at a given minute
 */
function calculateMomentum(
  events: MatchEvent[],
  minute: number,
  homeTeamName: string
): { home: number; away: number } {
  let homeMomentum = MOMENTUM.baseValue;
  let awayMomentum = MOMENTUM.baseValue;
  
  // Process events up to current minute
  const relevantEvents = events.filter(e => e.minute <= minute);
  
  for (const event of relevantEvents) {
    const isHome = event.team === homeTeamName;
    
    switch (event.type) {
      case 'GOAL':
        if (isHome) {
          homeMomentum += MOMENTUM.goalSwing;
          awayMomentum -= MOMENTUM.goalSwing * 0.5;
        } else {
          awayMomentum += MOMENTUM.goalSwing;
          homeMomentum -= MOMENTUM.goalSwing * 0.5;
        }
        break;
      case 'CHANCE':
        if (isHome) {
          homeMomentum += MOMENTUM.chanceSwing;
        } else {
          awayMomentum += MOMENTUM.chanceSwing;
        }
        break;
      case 'SAVE':
        // Save gives momentum to the team that made the save (opposite of shooter)
        if (isHome) {
          awayMomentum += MOMENTUM.saveSwing;
        } else {
          homeMomentum += MOMENTUM.saveSwing;
        }
        break;
      case 'YELLOW_CARD':
        if (isHome) {
          homeMomentum += MOMENTUM.cardSwing;
        } else {
          awayMomentum += MOMENTUM.cardSwing;
        }
        break;
    }
  }
  
  // Apply decay toward neutral for time passed
  const decayFactor = 1 - (minute * MOMENTUM.decayRate * 0.1);
  homeMomentum = MOMENTUM.baseValue + (homeMomentum - MOMENTUM.baseValue) * decayFactor;
  awayMomentum = MOMENTUM.baseValue + (awayMomentum - MOMENTUM.baseValue) * decayFactor;
  
  // Clamp values
  homeMomentum = Math.max(MOMENTUM.minValue, Math.min(MOMENTUM.maxValue, homeMomentum));
  awayMomentum = Math.max(MOMENTUM.minValue, Math.min(MOMENTUM.maxValue, awayMomentum));
  
  return { home: homeMomentum, away: awayMomentum };
}

/**
 * Generate comprehensive player ratings based on match events and position
 */
function generateDetailedPlayerRatings(
  homeTeam: Team,
  awayTeam: Team,
  events: MatchEvent[],
  stats: MatchStats,
  homeWon: boolean,
  awayWon: boolean,
  isDraw: boolean
): { [playerId: string]: number } {
  const ratings: { [playerId: string]: number } = {};
  const startingXIHome = getStartingXI(homeTeam);
  const startingXIAway = getStartingXI(awayTeam);
  
  const allPlayers = [
    ...startingXIHome.map(p => ({ ...p, isHome: true })),
    ...startingXIAway.map(p => ({ ...p, isHome: false })),
  ];
  
  for (const player of allPlayers) {
    // Base rating by position and team result
    let baseRating = 6.0;
    
    // Team result bonus
    const teamWon = player.isHome ? homeWon : awayWon;
    const teamLost = player.isHome ? awayWon : homeWon;
    if (teamWon) baseRating += 0.5;
    if (teamLost) baseRating -= 0.3;
    if (isDraw) baseRating += 0.1;
    
    // Form influence (subtle)
    baseRating += (player.form - 10) / 20;
    
    // Fitness influence
    baseRating += (player.fitness - 15) / 30;
    
    // Event-based bonuses
    const playerEvents = events.filter(e => e.player === player.name || e.assistPlayer === player.name);
    
    for (const event of playerEvents) {
      if (event.type === 'GOAL' && event.player === player.name) {
        baseRating += 1.0; // Goal scored
      }
      if (event.type === 'GOAL' && event.assistPlayer === player.name) {
        baseRating += 0.5; // Assist
      }
      if (event.type === 'SAVE' && event.player === player.name) {
        baseRating += 0.3; // Save (for GK)
      }
      if (event.type === 'YELLOW_CARD' && event.player === player.name) {
        baseRating -= 0.5; // Booked
      }
      if (event.type === 'FOUL' && event.player === player.name) {
        baseRating -= 0.1; // Foul committed
      }
    }
    
    // Position-specific bonuses based on team stats
    const teamStats = player.isHome ? 
      { shots: stats.shots.home, possession: stats.possession.home } :
      { shots: stats.shots.away, possession: stats.possession.away };
    
    switch (player.position) {
      case 'GK':
        // GK rating based on goals conceded vs expected
        const goalsConceded = player.isHome ? 
          events.filter(e => e.type === 'GOAL' && e.team !== homeTeam.short_name).length :
          events.filter(e => e.type === 'GOAL' && e.team !== awayTeam.short_name).length;
        if (goalsConceded === 0) baseRating += 1.0;
        else if (goalsConceded === 1) baseRating += 0.3;
        else if (goalsConceded >= 3) baseRating -= 0.5;
        break;
      case 'CB':
      case 'LB':
      case 'RB':
      case 'LWB':
      case 'RWB':
        // Defenders bonus for clean sheet
        const cleanSheet = player.isHome ? 
          events.filter(e => e.type === 'GOAL' && e.team !== homeTeam.short_name).length === 0 :
          events.filter(e => e.type === 'GOAL' && e.team !== awayTeam.short_name).length === 0;
        if (cleanSheet) baseRating += 0.8;
        break;
      case 'CM':
      case 'DM':
      case 'AM':
      case 'LM':
      case 'RM':
        // Midfielders bonus for possession
        if (teamStats.possession > 55) baseRating += 0.3;
        if (teamStats.possession > 60) baseRating += 0.2;
        break;
      case 'ST':
      case 'LW':
      case 'RW':
        // Attackers bonus for shots
        if (teamStats.shots >= 10) baseRating += 0.2;
        if (teamStats.shots >= 15) baseRating += 0.2;
        break;
    }
    
    // Random variance (small)
    baseRating += (Math.random() - 0.5) * 0.4;
    
    // Clamp to 1-10 scale with one decimal
    ratings[player.id] = Math.max(1, Math.min(10, Math.round(baseRating * 10) / 10));
  }
  
  return ratings;
}

/**
 * Calculate substitution impact for second half
 */
function applySubstitutionImpact(
  ratings: TeamRatings,
  substitutionMinute: number | null
): TeamRatings {
  if (!substitutionMinute || substitutionMinute > 90) return ratings;
  
  let boost = 0;
  if (substitutionMinute <= SUBSTITUTION_IMPACT.early.maxMinute) {
    boost = SUBSTITUTION_IMPACT.early.performanceBoost;
  } else if (substitutionMinute <= SUBSTITUTION_IMPACT.normal.maxMinute) {
    boost = SUBSTITUTION_IMPACT.normal.performanceBoost;
  } else {
    boost = SUBSTITUTION_IMPACT.late.performanceBoost;
  }
  
  return {
    attack: ratings.attack * (1 + boost),
    midfield: ratings.midfield * (1 + boost * 0.8),
    defense: ratings.defense * (1 + boost * 0.6),
    goalkeeper: ratings.goalkeeper,
    overall: ratings.overall * (1 + boost * 0.8),
  };
}

// ============================================
// MAIN SIMULATION FUNCTION
// ============================================

/**
 * Simulate a full match with CM01/02-inspired logic
 * Phase 2: Enhanced with momentum, tactical matchups, key moments, and detailed ratings
 */
export function simulateMatchEngine(
  homeTeam: Team,
  awayTeam: Team,
  homeSubstitutionMinute?: number,
  awaySubstitutionMinute?: number
): MatchResult {
  // Get tactics
  const homeTactics = getTeamTactics(homeTeam);
  const awayTactics = getTeamTactics(awayTeam);
  
  // Calculate base ratings
  let homeRatings = calculateTeamRatings(homeTeam);
  let awayRatings = calculateTeamRatings(awayTeam);
  
  // Apply form and fitness
  homeRatings = applyFormAndFitness(homeRatings, homeTeam);
  awayRatings = applyFormAndFitness(awayRatings, awayTeam);
  
  // Phase 2: Apply tactical matchup bonuses
  const homeTacticalBonus = calculateTacticalMatchup(homeTactics.formation, awayTactics.formation);
  const awayTacticalBonus = calculateTacticalMatchup(awayTactics.formation, homeTactics.formation);
  
  homeRatings.attack *= (1 + homeTacticalBonus);
  homeRatings.midfield *= (1 + homeTacticalBonus * 0.5);
  awayRatings.attack *= (1 + awayTacticalBonus);
  awayRatings.midfield *= (1 + awayTacticalBonus * 0.5);
  
  // Phase 2: Apply mentality matchup bonuses
  const homeMentalityBonus = calculateMentalityMatchup(
    homeTactics.mentality, 
    awayTactics.mentality, 
    homeTactics.counterAttack
  );
  const awayMentalityBonus = calculateMentalityMatchup(
    awayTactics.mentality, 
    homeTactics.mentality, 
    awayTactics.counterAttack
  );
  
  homeRatings.attack *= (1 + homeMentalityBonus);
  awayRatings.attack *= (1 + awayMentalityBonus);
  
  // Phase 2: Apply substitution impact (simulated as if made around minute 60-75)
  if (homeSubstitutionMinute) {
    homeRatings = applySubstitutionImpact(homeRatings, homeSubstitutionMinute);
  }
  if (awaySubstitutionMinute) {
    awayRatings = applySubstitutionImpact(awayRatings, awaySubstitutionMinute);
  }
  
  // Calculate base expected goals
  let homeXG = calculateExpectedGoals(homeTeam, awayTeam, homeRatings, awayRatings, true);
  let awayXG = calculateExpectedGoals(awayTeam, homeTeam, awayRatings, homeRatings, false);
  
  // Generate goal events with Phase 2 enhancements
  const events: MatchEvent[] = [];
  const usedMinutes = new Set<number>();
  const momentumTimeline: { minute: number; homeValue: number; awayValue: number }[] = [];
  
  // Helper to get unique minute
  const getUniqueMinute = (): number => {
    let minute: number;
    let attempts = 0;
    do {
      minute = Math.floor(Math.random() * 90) + 1;
      attempts++;
    } while (usedMinutes.has(minute) && attempts < 100);
    usedMinutes.add(minute);
    return minute;
  };
  
  // Phase 2: Get star players for key moments
  const homeStarPlayer = getStarPlayer(homeTeam);
  const awayStarPlayer = getStarPlayer(awayTeam);
  
  // Generate actual goals using Poisson distribution
  // Phase 2: Adjust for momentum throughout match
  const homeGoals = poissonRandom(homeXG);
  const awayGoals = poissonRandom(awayXG);
  
  // Generate goal minutes first, then assign to teams
  const allGoalMinutes: { minute: number; isHome: boolean }[] = [];
  let homeGoalsAssigned = 0;
  let awayGoalsAssigned = 0;
  
  for (let i = 0; i < homeGoals + awayGoals; i++) {
    const minute = getUniqueMinute();
    // Distribute goals based on total counts
    const isHome = homeGoalsAssigned < homeGoals && 
      (awayGoalsAssigned >= awayGoals || Math.random() < 0.5);
    
    allGoalMinutes.push({ minute, isHome });
    if (isHome) homeGoalsAssigned++;
    else awayGoalsAssigned++;
  }
  
  // Sort by minute
  allGoalMinutes.sort((a, b) => a.minute - b.minute);
  
  // Generate goal events with key moment bonuses
  for (const goalInfo of allGoalMinutes) {
    const team = goalInfo.isHome ? homeTeam : awayTeam;
    const starPlayer = goalInfo.isHome ? homeStarPlayer : awayStarPlayer;
    
    // Phase 2: Key moment check - star player more likely to score
    const keyMoment = isKeyMoment(goalInfo.minute);
    let scorer: Player;
    
    if (keyMoment.isKey && Math.random() < 0.3 + keyMoment.bonus) {
      // Star player scores in key moment
      scorer = starPlayer;
    } else {
      scorer = selectScorer(team);
    }
    
    const assister = selectAssister(team, scorer);
    
    // Enhanced goal description for key moments
    let description = generateGoalDescription(scorer, assister, goalInfo.minute);
    if (keyMoment.isKey && scorer.id === starPlayer.id) {
      description = `⭐ KEY MOMENT! ${description}`;
    }
    
    events.push({
      type: 'GOAL',
      minute: goalInfo.minute,
      team: team.short_name,
      player: scorer.name,
      assistPlayer: assister?.name,
      description,
    });
  }
  
  // Calculate match stats
  const homeTacklingMod = TACKLING_MODIFIERS[homeTactics.tackling] || TACKLING_MODIFIERS['normal'];
  const awayTacklingMod = TACKLING_MODIFIERS[awayTactics.tackling] || TACKLING_MODIFIERS['normal'];
  
  // Possession based on midfield battle and tactics
  const midfieldDiff = homeRatings.midfield - awayRatings.midfield;
  const basePossession = 50 + (midfieldDiff * 2);
  const homePossession = Math.max(30, Math.min(70, basePossession));
  
  // Shots based on xG and possession (ensure shots >= goals)
  const homeShots = Math.max(homeGoals + 1, Math.floor(homeXG * 4 + Math.random() * 4));
  const awayShots = Math.max(awayGoals + 1, Math.floor(awayXG * 4 + Math.random() * 4));
  
  const homeShotsOnTarget = Math.max(homeGoals, homeGoals + Math.floor((homeShots - homeGoals) * 0.35));
  const awayShotsOnTarget = Math.max(awayGoals, awayGoals + Math.floor((awayShots - awayGoals) * 0.35));
  
  // Corners based on attacking play
  const homeCorners = Math.floor(2 + Math.random() * 4 + (homeTactics.mentality - 3));
  const awayCorners = Math.floor(2 + Math.random() * 4 + (awayTactics.mentality - 3));
  
  // Fouls
  const homeFouls = Math.floor((6 + Math.random() * 6) * homeTacklingMod.fouls);
  const awayFouls = Math.floor((6 + Math.random() * 6) * awayTacklingMod.fouls);
  
  // Generate other events (chances, saves, fouls, cards)
  const otherEvents = generateOtherEvents(
    homeTeam, awayTeam, 
    homeTactics, awayTactics,
    homeShots, awayShots
  );
  
  events.push(...otherEvents);
  
  // Sort all events by minute
  events.sort((a, b) => a.minute - b.minute);
  
  // Yellow cards count
  const homeYellows = events.filter(e => e.type === 'YELLOW_CARD' && e.team === homeTeam.short_name).length;
  const awayYellows = events.filter(e => e.type === 'YELLOW_CARD' && e.team === awayTeam.short_name).length;
  
  const stats: MatchStats = {
    possession: { home: Math.round(homePossession), away: Math.round(100 - homePossession) },
    shots: { home: homeShots, away: awayShots },
    shotsOnTarget: { home: homeShotsOnTarget, away: awayShotsOnTarget },
    corners: { home: homeCorners, away: awayCorners },
    fouls: { home: homeFouls, away: awayFouls },
    yellowCards: { home: homeYellows, away: awayYellows },
    offsides: { 
      home: Math.floor(Math.random() * 4), 
      away: Math.floor(Math.random() * 4) 
    },
  };
  
  // Phase 2: Generate momentum timeline
  for (let minute = 0; minute <= 90; minute += 5) {
    const momentum = calculateMomentum(events, minute, homeTeam.short_name);
    momentumTimeline.push({
      minute,
      homeValue: momentum.home,
      awayValue: momentum.away,
    });
  }
  
  const finalMomentum = calculateMomentum(events, 90, homeTeam.short_name);
  
  // Phase 2: Generate detailed player ratings
  const homeWon = homeGoals > awayGoals;
  const awayWon = awayGoals > homeGoals;
  const isDraw = homeGoals === awayGoals;
  
  const playerRatings = generateDetailedPlayerRatings(
    homeTeam,
    awayTeam,
    events,
    stats,
    homeWon,
    awayWon,
    isDraw
  );
  
  return {
    homeScore: homeGoals,
    awayScore: awayGoals,
    events,
    stats,
    playerRatings,
    momentum: {
      timeline: momentumTimeline,
      finalHome: finalMomentum.home,
      finalAway: finalMomentum.away,
    },
  };
}

// Types are already exported at their definitions above
