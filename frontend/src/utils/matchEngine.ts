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
 * 
 * Phase 3 Features:
 * - Injury System with recovery time
 * 
 * Phase 4 Features (NEW):
 * - Stamina/Fatigue System (players tire, subs matter)
 * - Red Cards & Second Yellows (playing with 10 men)
 * - Penalty Kicks (fouls in box)
 * - Half-Time AI Adjustments (AI reacts to scoreline)
 * - Injury Time (stoppage time at end of halves)
 * - Weather Effects (rain, wind affect play)
 * - Own Goals (rare defensive mishaps)
 * - In-Match Morale (confidence shifts)
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
  type: 'GOAL' | 'PENALTY_GOAL' | 'PENALTY_MISS' | 'OWN_GOAL' | 'CHANCE' | 'SAVE' | 'YELLOW_CARD' | 'RED_CARD' | 'SECOND_YELLOW' | 'FOUL' | 'CORNER' | 'OFFSIDE' | 'INJURY' | 'HALF_TIME' | 'FULL_TIME' | 'SUBSTITUTION';
  minute: number;
  team: string;
  player: string;
  assistPlayer?: string;
  description: string;
  isStoppageTime?: boolean;
}

export interface MatchInjury {
  playerId: string;
  playerName: string;
  teamId: string;
  type: string;        // 'Knock' | 'Muscle Strain' | 'Sprain' | 'Torn Ligament' | 'Broken Bone'
  severity: string;    // 'Minor' | 'Moderate' | 'Serious' | 'Severe' | 'Critical'
  recoveryWeeks: number;
  minute: number;
}

// Phase 4: Weather type
export type WeatherCondition = 'clear' | 'cloudy' | 'rainy' | 'windy' | 'stormy';

export interface MatchWeather {
  condition: WeatherCondition;
  passingModifier: number;    // Affects passing accuracy
  longBallModifier: number;   // Affects long passes/crosses
  description: string;
}

export interface MatchResult {
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  stats: MatchStats;
  playerRatings: { [playerId: string]: number };
  momentum: MomentumHistory;
  injuries: MatchInjury[];
  weather: MatchWeather;
  redCards: { home: string[]; away: string[] };
  stoppageTime: { firstHalf: number; secondHalf: number };
}

export interface MatchStats {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
  offsides: { home: number; away: number };
  penalties: { home: number; away: number };
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

// ============================================
// PHASE 3: INJURY CONSTANTS
// ============================================

const INJURY_TYPES = [
  { type: 'Knock', severity: 'Minor', minWeeks: 0, maxWeeks: 1, weight: 40 },
  { type: 'Muscle Strain', severity: 'Moderate', minWeeks: 1, maxWeeks: 3, weight: 30 },
  { type: 'Sprain', severity: 'Serious', minWeeks: 2, maxWeeks: 4, weight: 15 },
  { type: 'Torn Ligament', severity: 'Severe', minWeeks: 4, maxWeeks: 10, weight: 10 },
  { type: 'Broken Bone', severity: 'Critical', minWeeks: 8, maxWeeks: 16, weight: 5 },
];

// Base injury probability per player per match (~3% default)
const INJURY_BASE_PROBABILITY = 0.03;

const INJURY_DESCRIPTIONS = [
  (name: string, type: string) => `${name} goes down holding his leg! ${type} suspected.`,
  (name: string, type: string) => `${name} is stretchered off with a ${type.toLowerCase()}.`,
  (name: string, type: string) => `Bad news — ${name} limps off with a ${type.toLowerCase()}.`,
  (name: string, type: string) => `${name} pulls up injured. Looks like a ${type.toLowerCase()}.`,
  (name: string, type: string) => `Concern for ${name} who can't continue. ${type} confirmed.`,
];

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
// PHASE 4: NEW CONSTANTS
// ============================================

// Stamina/Fatigue System
const STAMINA_CONFIG = {
  decayRatePerMinute: 0.8,      // Stamina lost per minute (base)
  tempoMultiplier: {            // How tempo affects stamina drain
    'slow': 0.7,
    'normal': 1.0,
    'fast': 1.4,
  },
  closingDownMultiplier: {      // How pressing affects stamina
    'never': 0.7,
    'sometimes': 1.0,
    'always': 1.3,
  },
  fatigueThreshold: 50,         // Below this, performance drops
  severeThreshold: 25,          // Below this, major performance drop
  performancePenalty: {
    mild: 0.05,                 // 5% penalty when fatigued
    severe: 0.15,               // 15% penalty when severely fatigued
  },
  subBoost: 30,                 // Stamina boost for fresh sub
};

// Red Card System
const RED_CARD_CONFIG = {
  straightRedProb: 0.005,       // 0.5% chance of straight red per foul
  seriousFoulProb: 0.02,        // 2% chance foul is "serious" (higher red chance)
  seriousFoulRedProb: 0.25,     // 25% of serious fouls result in red
  manDownPenalty: {
    attack: 0.20,               // 20% reduction when down a man
    midfield: 0.15,
    defense: 0.10,
  },
  twoMenDownPenalty: {          // Rare but possible
    attack: 0.45,
    midfield: 0.35,
    defense: 0.25,
  },
};

// Penalty System
const PENALTY_CONFIG = {
  boxFoulProb: 0.08,            // 8% of fouls happen in box
  conversionRate: 0.76,         // 76% historical conversion rate
  gkSaveBonus: 0.015,           // Per GK attribute point above 10
  takerComposureBonus: 0.01,    // Per composure point above 10
  pressureMissBonus: 0.05,      // Extra miss chance in high-pressure moments
};

// Weather System
const WEATHER_CONFIG: Record<WeatherCondition, MatchWeather> = {
  'clear': {
    condition: 'clear',
    passingModifier: 1.0,
    longBallModifier: 1.0,
    description: 'Perfect conditions',
  },
  'cloudy': {
    condition: 'cloudy',
    passingModifier: 1.0,
    longBallModifier: 0.98,
    description: 'Overcast skies',
  },
  'rainy': {
    condition: 'rainy',
    passingModifier: 0.92,
    longBallModifier: 0.88,
    description: 'Rain affecting the pitch',
  },
  'windy': {
    condition: 'windy',
    passingModifier: 0.95,
    longBallModifier: 0.82,
    description: 'Strong winds swirling',
  },
  'stormy': {
    condition: 'stormy',
    passingModifier: 0.85,
    longBallModifier: 0.75,
    description: 'Heavy rain and wind',
  },
};

// Weather probability distribution
const WEATHER_PROBABILITIES: { condition: WeatherCondition; weight: number }[] = [
  { condition: 'clear', weight: 40 },
  { condition: 'cloudy', weight: 30 },
  { condition: 'rainy', weight: 15 },
  { condition: 'windy', weight: 10 },
  { condition: 'stormy', weight: 5 },
];

// Own Goal System
const OWN_GOAL_CONFIG = {
  baseProb: 0.015,              // 1.5% chance per defensive action under pressure
  pressureMultiplier: 1.5,      // Increases when team is under pressure
  weatherMultiplier: 1.3,       // Higher in bad weather
};

// In-Match Morale System
const MORALE_CONFIG = {
  baseValue: 50,
  goalBoost: 20,
  concededDrop: 15,
  redCardDrop: 10,
  penaltyMissedDrop: 12,
  maxValue: 100,
  minValue: 10,
  effectOnPerformance: 0.002,   // Per point deviation from 50
};

// Stoppage Time Config
const STOPPAGE_TIME_CONFIG = {
  baseFirstHalf: 1,
  baseSecondHalf: 2,
  perGoal: 0.5,
  perInjury: 1.5,
  perRedCard: 1.0,
  perSubstitution: 0.3,
  perPenalty: 1.0,
  maxFirstHalf: 5,
  maxSecondHalf: 8,
};

// Half-Time AI Adjustments
const HALFTIME_AI_CONFIG = {
  losingByOneOrMore: {
    mentalityChange: 1,         // Increase mentality by 1
    tempoChange: 'fast',
  },
  losingByThreeOrMore: {
    mentalityChange: 2,         // Go all-out attack
    tempoChange: 'fast',
  },
  winningByOne: {
    mentalityChange: -1,        // Slightly more defensive
    tempoChange: null,
  },
  winningByThreeOrMore: {
    mentalityChange: -2,        // Protect the lead
    tempoChange: 'slow',
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

// ============================================
// PHASE 4: HELPER FUNCTIONS
// ============================================

/**
 * Generate random weather for the match
 */
function generateWeather(): MatchWeather {
  const totalWeight = WEATHER_PROBABILITIES.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * totalWeight;
  
  for (const weatherProb of WEATHER_PROBABILITIES) {
    roll -= weatherProb.weight;
    if (roll <= 0) {
      return WEATHER_CONFIG[weatherProb.condition];
    }
  }
  return WEATHER_CONFIG['clear'];
}

/**
 * Calculate stamina drain for a player based on tactics and time played
 */
function calculateStaminaDrain(
  baseStamina: number,
  minutesPlayed: number,
  tempo: string,
  closingDown: string
): number {
  const tempoMult = STAMINA_CONFIG.tempoMultiplier[tempo as keyof typeof STAMINA_CONFIG.tempoMultiplier] || 1.0;
  const pressMult = STAMINA_CONFIG.closingDownMultiplier[closingDown as keyof typeof STAMINA_CONFIG.closingDownMultiplier] || 1.0;
  
  const drain = minutesPlayed * STAMINA_CONFIG.decayRatePerMinute * tempoMult * pressMult;
  // Higher base stamina = slower drain
  const staminaProtection = Math.max(0.5, baseStamina / 20);
  
  return Math.max(0, 100 - (drain / staminaProtection));
}

/**
 * Apply fatigue penalty to team ratings
 */
function applyFatiguePenalty(
  ratings: TeamRatings,
  averageStamina: number
): TeamRatings {
  let penalty = 0;
  
  if (averageStamina < STAMINA_CONFIG.severeThreshold) {
    penalty = STAMINA_CONFIG.performancePenalty.severe;
  } else if (averageStamina < STAMINA_CONFIG.fatigueThreshold) {
    penalty = STAMINA_CONFIG.performancePenalty.mild;
  }
  
  return {
    attack: ratings.attack * (1 - penalty),
    midfield: ratings.midfield * (1 - penalty),
    defense: ratings.defense * (1 - penalty),
    goalkeeper: ratings.goalkeeper, // GK doesn't fatigue as much
    overall: ratings.overall * (1 - penalty),
  };
}

/**
 * Apply red card penalty to team ratings
 */
function applyRedCardPenalty(
  ratings: TeamRatings,
  redCardsCount: number
): TeamRatings {
  if (redCardsCount === 0) return ratings;
  
  const penalty = redCardsCount === 1 
    ? RED_CARD_CONFIG.manDownPenalty 
    : RED_CARD_CONFIG.twoMenDownPenalty;
  
  return {
    attack: ratings.attack * (1 - penalty.attack),
    midfield: ratings.midfield * (1 - penalty.midfield),
    defense: ratings.defense * (1 - penalty.defense),
    goalkeeper: ratings.goalkeeper,
    overall: ratings.overall * (1 - (penalty.attack + penalty.midfield + penalty.defense) / 3),
  };
}

/**
 * Apply weather effects to team ratings
 */
function applyWeatherEffects(
  ratings: TeamRatings,
  weather: MatchWeather,
  passingStyle: string
): TeamRatings {
  // Direct passing affected more by bad weather
  const passingPenalty = passingStyle === 'direct' 
    ? (1 - weather.longBallModifier) * 1.5 
    : (1 - weather.passingModifier);
  
  return {
    attack: ratings.attack * (1 - passingPenalty * 0.5),
    midfield: ratings.midfield * weather.passingModifier,
    defense: ratings.defense, // Defense less affected
    goalkeeper: ratings.goalkeeper,
    overall: ratings.overall * (1 - passingPenalty * 0.3),
  };
}

/**
 * Apply morale effects to team ratings
 */
function applyMoraleEffects(
  ratings: TeamRatings,
  morale: number
): TeamRatings {
  const deviation = morale - MORALE_CONFIG.baseValue;
  const effect = deviation * MORALE_CONFIG.effectOnPerformance;
  
  return {
    attack: ratings.attack * (1 + effect),
    midfield: ratings.midfield * (1 + effect * 0.8),
    defense: ratings.defense * (1 + effect * 0.6),
    goalkeeper: ratings.goalkeeper * (1 + effect * 0.4),
    overall: ratings.overall * (1 + effect * 0.7),
  };
}

/**
 * Check if a penalty should be awarded
 */
function shouldAwardPenalty(foulMinute: number, isDefendingTeamPressing: boolean): boolean {
  // Higher chance of box foul when attacking aggressively
  const boxFoulChance = isDefendingTeamPressing 
    ? PENALTY_CONFIG.boxFoulProb * 1.3 
    : PENALTY_CONFIG.boxFoulProb;
  
  return Math.random() < boxFoulChance;
}

/**
 * Simulate penalty kick
 */
function simulatePenalty(
  taker: Player,
  goalkeeper: Player,
  isHighPressure: boolean
): { scored: boolean; description: string } {
  let conversionRate = PENALTY_CONFIG.conversionRate;
  
  // Taker composure bonus (if they have composure attribute)
  const composure = (taker as any).composure || taker.finishing || 12;
  conversionRate += (composure - 10) * PENALTY_CONFIG.takerComposureBonus;
  
  // GK save ability
  const gkAbility = goalkeeper.shot_stopping || 12;
  conversionRate -= (gkAbility - 10) * PENALTY_CONFIG.gkSaveBonus;
  
  // High pressure penalty (late goal, crucial moment)
  if (isHighPressure) {
    conversionRate -= PENALTY_CONFIG.pressureMissBonus;
  }
  
  const scored = Math.random() < conversionRate;
  
  const scoredDescriptions = [
    `${taker.name} sends the keeper the wrong way. GOAL!`,
    `${taker.name} coolly slots home the penalty!`,
    `No mistake from ${taker.name}! Clinical from the spot!`,
    `${taker.name} buries it into the corner! Penalty converted!`,
  ];
  
  const missedDescriptions = [
    `${taker.name} misses! The keeper guessed right!`,
    `${taker.name} blazes it over the bar! Penalty missed!`,
    `Brilliant save! ${goalkeeper.name} dives the right way!`,
    `${taker.name} hits the post! So close to scoring!`,
  ];
  
  return {
    scored,
    description: scored 
      ? scoredDescriptions[Math.floor(Math.random() * scoredDescriptions.length)]
      : missedDescriptions[Math.floor(Math.random() * missedDescriptions.length)],
  };
}

/**
 * Check for own goal on defensive action
 */
function checkOwnGoal(
  weather: MatchWeather,
  teamUnderPressure: boolean
): { ownGoal: boolean; description: string } {
  let probability = OWN_GOAL_CONFIG.baseProb;
  
  if (teamUnderPressure) {
    probability *= OWN_GOAL_CONFIG.pressureMultiplier;
  }
  
  if (weather.condition === 'rainy' || weather.condition === 'stormy') {
    probability *= OWN_GOAL_CONFIG.weatherMultiplier;
  }
  
  const ownGoal = Math.random() < probability;
  
  const descriptions = [
    (player: string) => `Disaster! ${player} turns the ball into his own net!`,
    (player: string) => `Own goal! ${player} can't believe it!`,
    (player: string) => `Calamity! ${player}'s clearance ends up in the goal!`,
    (player: string) => `${player} slices it past his own goalkeeper! Own goal!`,
  ];
  
  return {
    ownGoal,
    description: descriptions[Math.floor(Math.random() * descriptions.length)](''),
  };
}

/**
 * Calculate stoppage time for a half
 */
function calculateStoppageTime(
  halfEvents: MatchEvent[],
  isSecondHalf: boolean
): number {
  const base = isSecondHalf 
    ? STOPPAGE_TIME_CONFIG.baseSecondHalf 
    : STOPPAGE_TIME_CONFIG.baseFirstHalf;
  
  let additional = 0;
  
  for (const event of halfEvents) {
    switch (event.type) {
      case 'GOAL':
      case 'PENALTY_GOAL':
      case 'OWN_GOAL':
        additional += STOPPAGE_TIME_CONFIG.perGoal;
        break;
      case 'INJURY':
        additional += STOPPAGE_TIME_CONFIG.perInjury;
        break;
      case 'RED_CARD':
      case 'SECOND_YELLOW':
        additional += STOPPAGE_TIME_CONFIG.perRedCard;
        break;
      case 'PENALTY_MISS':
        additional += STOPPAGE_TIME_CONFIG.perPenalty;
        break;
      case 'SUBSTITUTION':
        additional += STOPPAGE_TIME_CONFIG.perSubstitution;
        break;
    }
  }
  
  const maxTime = isSecondHalf 
    ? STOPPAGE_TIME_CONFIG.maxSecondHalf 
    : STOPPAGE_TIME_CONFIG.maxFirstHalf;
  
  return Math.min(Math.floor(base + additional), maxTime);
}

/**
 * Apply half-time AI adjustments to tactics
 */
function applyHalftimeAdjustments(
  tactics: TeamTactics,
  goalDifference: number,
  isWinning: boolean
): TeamTactics {
  const adjusted = { ...tactics };
  
  if (isWinning) {
    if (goalDifference >= 3) {
      adjusted.mentality = Math.max(1, tactics.mentality + HALFTIME_AI_CONFIG.winningByThreeOrMore.mentalityChange);
      if (HALFTIME_AI_CONFIG.winningByThreeOrMore.tempoChange) {
        adjusted.tempo = HALFTIME_AI_CONFIG.winningByThreeOrMore.tempoChange;
      }
    } else if (goalDifference >= 1) {
      adjusted.mentality = Math.max(1, tactics.mentality + HALFTIME_AI_CONFIG.winningByOne.mentalityChange);
    }
  } else {
    if (goalDifference <= -3) {
      adjusted.mentality = Math.min(5, tactics.mentality - HALFTIME_AI_CONFIG.losingByThreeOrMore.mentalityChange);
      if (HALFTIME_AI_CONFIG.losingByThreeOrMore.tempoChange) {
        adjusted.tempo = HALFTIME_AI_CONFIG.losingByThreeOrMore.tempoChange;
      }
    } else if (goalDifference <= -1) {
      adjusted.mentality = Math.min(5, tactics.mentality - HALFTIME_AI_CONFIG.losingByOneOrMore.mentalityChange);
      if (HALFTIME_AI_CONFIG.losingByOneOrMore.tempoChange) {
        adjusted.tempo = HALFTIME_AI_CONFIG.losingByOneOrMore.tempoChange;
      }
    }
  }
  
  return adjusted;
}

/**
 * Select best penalty taker from team
 */
function selectPenaltyTaker(team: Team, excludedIds: string[] = []): Player {
  const startingXI = getStartingXI(team).filter(p => !excludedIds.includes(p.id));
  
  // Sort by finishing + composure-like attributes
  return startingXI.reduce((best, player) => {
    const score = player.finishing + (player.technique || 10) + ((player as any).composure || 12);
    const bestScore = best.finishing + (best.technique || 10) + ((best as any).composure || 12);
    return score > bestScore ? player : best;
  }, startingXI[0]);
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
  // Get formation or default to 4-4-2
  const formation = team.formation || '4-4-2';
  const formationParts = formation.split('-').map(Number);
  
  // Determine positional requirements from formation
  let defCount = 4, midCount = 4, fwdCount = 2;
  if (formationParts.length === 3) {
    [defCount, midCount, fwdCount] = formationParts;
  } else if (formationParts.length === 4) {
    // Formations like 4-2-3-1
    defCount = formationParts[0];
    midCount = formationParts[1] + formationParts[2];
    fwdCount = formationParts[3];
  }
  
  const squad = team.squad || [];
  
  // Helper to get best available players for a position group
  const getBestPlayers = (positions: string[], count: number, exclude: Set<string>): Player[] => {
    return squad
      .filter(p => positions.includes(p.position) && !exclude.has(p.id))
      .sort((a, b) => {
        // Sort by fitness * ability (prefer fit players)
        const scoreA = (a.current_ability || 10) * ((a.fitness || 15) / 20);
        const scoreB = (b.current_ability || 10) * ((b.fitness || 15) / 20);
        return scoreB - scoreA;
      })
      .slice(0, count);
  };
  
  const selectedIds = new Set<string>();
  const startingXI: Player[] = [];
  
  // 1. Select 1 GK
  const gks = getBestPlayers(['GK'], 1, selectedIds);
  gks.forEach(p => {
    startingXI.push(p);
    selectedIds.add(p.id);
  });
  
  // 2. Select defenders
  const defenders = getBestPlayers(['CB', 'LB', 'RB', 'LWB', 'RWB'], defCount, selectedIds);
  defenders.forEach(p => {
    startingXI.push(p);
    selectedIds.add(p.id);
  });
  
  // 3. Select midfielders
  const midfielders = getBestPlayers(['DM', 'CM', 'LM', 'RM', 'AM', 'LW', 'RW'], midCount, selectedIds);
  midfielders.forEach(p => {
    startingXI.push(p);
    selectedIds.add(p.id);
  });
  
  // 4. Select forwards
  const forwards = getBestPlayers(['ST', 'CF', 'LW', 'RW'], fwdCount, selectedIds);
  forwards.forEach(p => {
    startingXI.push(p);
    selectedIds.add(p.id);
  });
  
  // 5. If we still don't have 11, fill with best remaining players
  while (startingXI.length < 11 && startingXI.length < squad.length) {
    const remaining = squad
      .filter(p => !selectedIds.has(p.id))
      .sort((a, b) => (b.current_ability || 10) - (a.current_ability || 10));
    
    if (remaining.length > 0) {
      startingXI.push(remaining[0]);
      selectedIds.add(remaining[0].id);
    } else {
      break;
    }
  }
  
  return startingXI;
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
  
  // Defensive check for empty squad
  if (!startingXI || startingXI.length === 0) {
    console.warn('applyFormAndFitness: Empty starting XI for team:', team?.short_name);
    return ratings;
  }
  
  // Calculate average form (1-10 scale) and fitness (1-20 scale)
  // With defensive checks for undefined values
  const avgForm = startingXI.reduce((sum, p) => sum + (p.form ?? 6), 0) / startingXI.length;
  const avgFitness = startingXI.reduce((sum, p) => sum + (p.fitness ?? 15), 0) / startingXI.length;
  
  // Form modifier: form of 6 = no change (average), 10 = +8%, 1 = -10%
  // Form is now on 1-10 scale (average of last 5 match ratings)
  const formModifier = 1 + ((avgForm - 6) / 50);
  
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
    const formWeight = p.form / 7.5;  // Form now 1-10, so divide by 7.5 for similar scaling
    
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
 * Improved: More realistic event distribution throughout the match
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
  
  // Calculate realistic number of notable chances (not every shot is commentary-worthy)
  // Real matches have ~3-5 clear cut chances per team, not shots = chances
  const homeChances = Math.min(homeShots - 1, Math.floor(2 + Math.random() * 3));
  const awayChances = Math.min(awayShots - 1, Math.floor(2 + Math.random() * 3));
  
  const chanceDescriptions = [
    (name: string) => `${name} with a good chance but it goes wide!`,
    (name: string) => `${name} fires over the bar!`,
    (name: string) => `Close! ${name}'s shot just misses the target!`,
    (name: string) => `${name} couldn't keep his shot down!`,
    (name: string) => `${name} tests the keeper from distance!`,
    (name: string) => `Good position for ${name} but the shot is wayward!`,
  ];
  
  const saveDescriptions = [
    (name: string) => `Great save to deny ${name}!`,
    (name: string) => `The keeper pulls off a stunning save from ${name}!`,
    (name: string) => `${name}'s effort is well saved!`,
    (name: string) => `Fantastic reflexes to keep out ${name}'s shot!`,
    (name: string) => `Strong hands from the keeper to stop ${name}!`,
  ];
  
  // Distribute chances across match periods for realism
  // More action in 2nd half typically
  const getRealisticMinute = (preferredHalf: 'first' | 'second' | 'any'): number => {
    if (preferredHalf === 'first') {
      return Math.floor(5 + Math.random() * 40); // 5-45
    } else if (preferredHalf === 'second') {
      return Math.floor(50 + Math.random() * 40); // 50-90
    }
    return Math.floor(5 + Math.random() * 85); // 5-90
  };
  
  // Add home chances - distribute across the match
  for (let i = 0; i < homeChances; i++) {
    const preferredHalf = i < homeChances / 2 ? 'first' : 'second';
    const minute = getRealisticMinute(preferredHalf);
    const player = selectScorer(homeTeam);
    const isSave = Math.random() > 0.45; // Slightly favor saves (good goalkeeping)
    
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
    const preferredHalf = i < awayChances / 2 ? 'first' : 'second';
    const minute = getRealisticMinute(preferredHalf);
    const player = selectScorer(awayTeam);
    const isSave = Math.random() > 0.45;
    
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
  
  // Add fouls (shown as events) - only show ~20% of fouls as notable commentary
  // Most fouls don't need commentary
  const totalFoulEvents = Math.floor((homeFouls + awayFouls) * 0.2);
  const homeFoulWeight = homeFouls / (homeFouls + awayFouls || 1);
  for (let i = 0; i < totalFoulEvents; i++) {
    const isHome = Math.random() < homeFoulWeight;
    const team = isHome ? homeTeam : awayTeam;
    const startingXI = getStartingXI(team);
    const player = startingXI[Math.floor(Math.random() * startingXI.length)];
    
    events.push({
      type: 'FOUL',
      minute: Math.floor(5 + Math.random() * 85), // 5-90
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
    
    // Form influence (subtle) - Form now on 1-10 scale, 6 is average
    baseRating += (player.form - 6) / 10;
    
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
// PHASE 3: INJURY GENERATION
// ============================================

/**
 * Generate match injuries based on tackles, fitness, age, and tackling intensity.
 * Called during match simulation for both full and lite engines.
 */
function generateMatchInjuries(
  homeTeam: Team,
  awayTeam: Team,
  homeTactics: TeamTactics,
  awayTactics: TeamTactics,
  homeFouls: number,
  awayFouls: number
): { injuries: MatchInjury[]; injuryEvents: MatchEvent[] } {
  const injuries: MatchInjury[] = [];
  const injuryEvents: MatchEvent[] = [];

  const processTeam = (team: Team, opponentTactics: TeamTactics, opponentFouls: number) => {
    const startingXI = getStartingXI(team);
    const tacklingMod = opponentTactics.tackling === 'hard' ? 1.5 : opponentTactics.tackling === 'easy' ? 0.6 : 1.0;
    // More fouls from the opponent = higher chance of injury for our players
    const foulMod = Math.min(2.0, opponentFouls / 10);

    for (const player of startingXI) {
      let injuryProb = INJURY_BASE_PROBABILITY;

      // Fitness modifier: low fitness = more injury prone
      // fitness 20 = 0.6x, fitness 10 = 1.0x, fitness 1 = 1.8x
      injuryProb *= 0.6 + (20 - player.fitness) * 0.06;

      // Age modifier: 30+ = slightly more injury prone
      if (player.age >= 30) injuryProb *= 1.0 + (player.age - 30) * 0.08;
      if (player.age >= 35) injuryProb *= 1.3;

      // Opponent tackling intensity
      injuryProb *= tacklingMod;

      // Foul frequency modifier
      injuryProb *= foulMod;

      // Stamina provides some protection
      injuryProb *= Math.max(0.5, 1.2 - player.stamina / 20);

      // GK less likely to get injured from tackles
      if (player.position === 'GK') injuryProb *= 0.4;

      // Roll the dice
      if (Math.random() < injuryProb) {
        // Select injury type using weighted random
        const totalWeight = INJURY_TYPES.reduce((sum, t) => sum + t.weight, 0);
        let roll = Math.random() * totalWeight;
        let selectedInjury = INJURY_TYPES[0];
        for (const injType of INJURY_TYPES) {
          roll -= injType.weight;
          if (roll <= 0) { selectedInjury = injType; break; }
        }

        const recoveryWeeks = selectedInjury.minWeeks + Math.floor(Math.random() * (selectedInjury.maxWeeks - selectedInjury.minWeeks + 1));
        const minute = Math.floor(Math.random() * 90) + 1;
        const description = INJURY_DESCRIPTIONS[Math.floor(Math.random() * INJURY_DESCRIPTIONS.length)](player.name, selectedInjury.type);

        injuries.push({
          playerId: player.id,
          playerName: player.name,
          teamId: team.id,
          type: selectedInjury.type,
          severity: selectedInjury.severity,
          recoveryWeeks,
          minute,
        });

        injuryEvents.push({
          type: 'INJURY',
          minute,
          team: team.short_name,
          player: player.name,
          description,
        });
      }
    }
  };

  processTeam(homeTeam, awayTactics, awayFouls);
  processTeam(awayTeam, homeTactics, homeFouls);

  return { injuries, injuryEvents };
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
  let homeTactics = getTeamTactics(homeTeam);
  let awayTactics = getTeamTactics(awayTeam);
  
  // Phase 4: Generate weather
  const weather = generateWeather();
  
  // Phase 4: Initialize morale
  let homeMorale = MORALE_CONFIG.baseValue;
  let awayMorale = MORALE_CONFIG.baseValue;
  
  // Phase 4: Track red cards and player yellows
  const homeRedCards: string[] = [];
  const awayRedCards: string[] = [];
  const playerYellowCards: Map<string, number> = new Map();
  
  // Phase 4: Track penalties
  let homePenalties = 0;
  let awayPenalties = 0;
  
  // Calculate base ratings
  let homeRatings = calculateTeamRatings(homeTeam);
  let awayRatings = calculateTeamRatings(awayTeam);
  
  // Apply form and fitness
  homeRatings = applyFormAndFitness(homeRatings, homeTeam);
  awayRatings = applyFormAndFitness(awayRatings, awayTeam);
  
  // Phase 4: Apply weather effects
  homeRatings = applyWeatherEffects(homeRatings, weather, homeTactics.passingStyle);
  awayRatings = applyWeatherEffects(awayRatings, weather, awayTactics.passingStyle);
  
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
  
  // Calculate base expected goals for first half
  let homeXG = calculateExpectedGoals(homeTeam, awayTeam, homeRatings, awayRatings, true);
  let awayXG = calculateExpectedGoals(awayTeam, homeTeam, awayRatings, homeRatings, false);
  
  // Generate events
  const events: MatchEvent[] = [];
  const usedMinutes = new Set<number>();
  const momentumTimeline: { minute: number; homeValue: number; awayValue: number }[] = [];
  
  // Helper to get unique minute
  const getUniqueMinute = (minMinute: number = 1, maxMinute: number = 90): number => {
    let minute: number;
    let attempts = 0;
    do {
      minute = Math.floor(minMinute + Math.random() * (maxMinute - minMinute));
      attempts++;
    } while (usedMinutes.has(minute) && attempts < 100);
    usedMinutes.add(minute);
    return minute;
  };
  
  // Phase 2: Get star players for key moments
  const homeStarPlayer = getStarPlayer(homeTeam);
  const awayStarPlayer = getStarPlayer(awayTeam);
  
  // Get goalkeepers for penalty simulation
  const homeGK = getStartingXI(homeTeam).find(p => p.position === 'GK') || getStartingXI(homeTeam)[0];
  const awayGK = getStartingXI(awayTeam).find(p => p.position === 'GK') || getStartingXI(awayTeam)[0];
  
  // Generate first half goals using Poisson distribution
  const firstHalfHomeXG = homeXG * 0.45; // Slightly less action in first half
  const firstHalfAwayXG = awayXG * 0.45;
  
  let homeGoals = poissonRandom(firstHalfHomeXG);
  let awayGoals = poissonRandom(firstHalfAwayXG);
  
  // Generate first half goal events
  for (let i = 0; i < homeGoals; i++) {
    const minute = getUniqueMinute(1, 45);
    const scorer = Math.random() < 0.3 ? homeStarPlayer : selectScorer(homeTeam);
    const assister = selectAssister(homeTeam, scorer);
    
    events.push({
      type: 'GOAL',
      minute,
      team: homeTeam.short_name,
      player: scorer.name,
      assistPlayer: assister?.name,
      description: generateGoalDescription(scorer, assister, minute),
    });
    
    // Update morale
    homeMorale = Math.min(MORALE_CONFIG.maxValue, homeMorale + MORALE_CONFIG.goalBoost);
    awayMorale = Math.max(MORALE_CONFIG.minValue, awayMorale - MORALE_CONFIG.concededDrop);
  }
  
  for (let i = 0; i < awayGoals; i++) {
    const minute = getUniqueMinute(1, 45);
    const scorer = Math.random() < 0.3 ? awayStarPlayer : selectScorer(awayTeam);
    const assister = selectAssister(awayTeam, scorer);
    
    events.push({
      type: 'GOAL',
      minute,
      team: awayTeam.short_name,
      player: scorer.name,
      assistPlayer: assister?.name,
      description: generateGoalDescription(scorer, assister, minute),
    });
    
    awayMorale = Math.min(MORALE_CONFIG.maxValue, awayMorale + MORALE_CONFIG.goalBoost);
    homeMorale = Math.max(MORALE_CONFIG.minValue, homeMorale - MORALE_CONFIG.concededDrop);
  }
  
  // Phase 4: Check for own goal in first half (rare)
  if (Math.random() < OWN_GOAL_CONFIG.baseProb * (weather.condition === 'rainy' ? 1.3 : 1)) {
    const isHomeOwnGoal = Math.random() < 0.5;
    const team = isHomeOwnGoal ? homeTeam : awayTeam;
    const defenders = getStartingXI(team).filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position));
    const unluckyPlayer = defenders[Math.floor(Math.random() * defenders.length)] || getStartingXI(team)[1];
    
    const minute = getUniqueMinute(10, 45);
    events.push({
      type: 'OWN_GOAL',
      minute,
      team: isHomeOwnGoal ? awayTeam.short_name : homeTeam.short_name, // Team that benefits
      player: unluckyPlayer.name,
      description: `Own goal! ${unluckyPlayer.name} turns it into his own net!`,
    });
    
    if (isHomeOwnGoal) {
      awayGoals++;
      awayMorale += 10;
      homeMorale -= 15;
    } else {
      homeGoals++;
      homeMorale += 10;
      awayMorale -= 15;
    }
  }
  
  // Add half-time event
  events.push({
    type: 'HALF_TIME',
    minute: 45,
    team: '',
    player: '',
    description: `Half Time: ${homeTeam.short_name} ${homeGoals} - ${awayGoals} ${awayTeam.short_name}`,
  });
  
  // Phase 4: AI Half-time adjustments (for away team, simulating AI behavior)
  const awayGoalDiff = awayGoals - homeGoals;
  awayTactics = applyHalftimeAdjustments(awayTactics, awayGoalDiff, awayGoalDiff > 0);
  
  // Phase 4: Apply fatigue for second half (simplified - 45 mins played)
  const homeAvgStamina = calculateStaminaDrain(14, 45, homeTactics.tempo, homeTactics.closingDown);
  const awayAvgStamina = calculateStaminaDrain(14, 45, awayTactics.tempo, awayTactics.closingDown);
  
  homeRatings = applyFatiguePenalty(homeRatings, homeAvgStamina);
  awayRatings = applyFatiguePenalty(awayRatings, awayAvgStamina);
  
  // Phase 4: Apply morale effects
  homeRatings = applyMoraleEffects(homeRatings, homeMorale);
  awayRatings = applyMoraleEffects(awayRatings, awayMorale);
  
  // Recalculate xG for second half
  const secondHalfHomeXG = calculateExpectedGoals(homeTeam, awayTeam, homeRatings, awayRatings, true) * 0.55;
  const secondHalfAwayXG = calculateExpectedGoals(awayTeam, homeTeam, awayRatings, homeRatings, false) * 0.55;
  
  // Generate second half goals
  const secondHalfHomeGoals = poissonRandom(secondHalfHomeXG);
  const secondHalfAwayGoals = poissonRandom(secondHalfAwayXG);
  
  for (let i = 0; i < secondHalfHomeGoals; i++) {
    const minute = getUniqueMinute(46, 90);
    const keyMoment = isKeyMoment(minute);
    const scorer = keyMoment.isKey && Math.random() < 0.4 ? homeStarPlayer : selectScorer(homeTeam);
    const assister = selectAssister(homeTeam, scorer);
    
    let description = generateGoalDescription(scorer, assister, minute);
    if (keyMoment.isKey) description = `⭐ ${description}`;
    
    events.push({
      type: 'GOAL',
      minute,
      team: homeTeam.short_name,
      player: scorer.name,
      assistPlayer: assister?.name,
      description,
    });
    homeGoals++;
  }
  
  for (let i = 0; i < secondHalfAwayGoals; i++) {
    const minute = getUniqueMinute(46, 90);
    const keyMoment = isKeyMoment(minute);
    const scorer = keyMoment.isKey && Math.random() < 0.4 ? awayStarPlayer : selectScorer(awayTeam);
    const assister = selectAssister(awayTeam, scorer);
    
    let description = generateGoalDescription(scorer, assister, minute);
    if (keyMoment.isKey) description = `⭐ ${description}`;
    
    events.push({
      type: 'GOAL',
      minute,
      team: awayTeam.short_name,
      player: scorer.name,
      assistPlayer: assister?.name,
      description,
    });
    awayGoals++;
  }
  
  // Phase 4: Generate penalties (chance based on fouls and box activity)
  const homeTacklingMod = TACKLING_MODIFIERS[homeTactics.tackling] || TACKLING_MODIFIERS['normal'];
  const awayTacklingMod = TACKLING_MODIFIERS[awayTactics.tackling] || TACKLING_MODIFIERS['normal'];
  
  // Home team attacking, away defends - check for penalty
  if (shouldAwardPenalty(0, awayTactics.closingDown === 'always')) {
    const taker = selectPenaltyTaker(homeTeam);
    const penResult = simulatePenalty(taker, awayGK, homeGoals === awayGoals);
    const minute = getUniqueMinute(20, 88);
    
    events.push({
      type: penResult.scored ? 'PENALTY_GOAL' : 'PENALTY_MISS',
      minute,
      team: homeTeam.short_name,
      player: taker.name,
      description: `⚽ PENALTY! ${penResult.description}`,
    });
    
    if (penResult.scored) {
      homeGoals++;
      homePenalties++;
    } else {
      homeMorale = Math.max(MORALE_CONFIG.minValue, homeMorale - MORALE_CONFIG.penaltyMissedDrop);
    }
  }
  
  // Away team penalty chance
  if (shouldAwardPenalty(0, homeTactics.closingDown === 'always')) {
    const taker = selectPenaltyTaker(awayTeam);
    const penResult = simulatePenalty(taker, homeGK, homeGoals === awayGoals);
    const minute = getUniqueMinute(20, 88);
    
    events.push({
      type: penResult.scored ? 'PENALTY_GOAL' : 'PENALTY_MISS',
      minute,
      team: awayTeam.short_name,
      player: taker.name,
      description: `⚽ PENALTY! ${penResult.description}`,
    });
    
    if (penResult.scored) {
      awayGoals++;
      awayPenalties++;
    } else {
      awayMorale = Math.max(MORALE_CONFIG.minValue, awayMorale - MORALE_CONFIG.penaltyMissedDrop);
    }
  }
  
  // Calculate match stats
  const midfieldDiff = homeRatings.midfield - awayRatings.midfield;
  const basePossession = 50 + (midfieldDiff * 2);
  const homePossession = Math.max(30, Math.min(70, basePossession));
  
  const homeShots = Math.max(homeGoals + 1, Math.floor(homeXG * 4 + Math.random() * 4));
  const awayShots = Math.max(awayGoals + 1, Math.floor(awayXG * 4 + Math.random() * 4));
  
  const homeShotsOnTarget = Math.max(homeGoals, homeGoals + Math.floor((homeShots - homeGoals) * 0.35));
  const awayShotsOnTarget = Math.max(awayGoals, awayGoals + Math.floor((awayShots - awayGoals) * 0.35));
  
  const homeCorners = Math.floor(2 + Math.random() * 4 + (homeTactics.mentality - 3));
  const awayCorners = Math.floor(2 + Math.random() * 4 + (awayTactics.mentality - 3));
  
  const homeFouls = Math.floor((6 + Math.random() * 6) * homeTacklingMod.fouls);
  const awayFouls = Math.floor((6 + Math.random() * 6) * awayTacklingMod.fouls);
  
  // Generate other events (chances, saves, fouls, cards) with Phase 4 red card logic
  const otherEvents = generateOtherEvents(
    homeTeam, awayTeam, 
    homeTactics, awayTactics,
    homeShots, awayShots
  );
  
  // Phase 4: Process cards for red card logic
  for (const event of otherEvents) {
    if (event.type === 'YELLOW_CARD') {
      const cardCount = (playerYellowCards.get(event.player) || 0) + 1;
      playerYellowCards.set(event.player, cardCount);
      
      if (cardCount >= 2) {
        // Second yellow = red
        event.type = 'SECOND_YELLOW';
        event.description = `🟥 SECOND YELLOW! ${event.player} is sent off!`;
        
        if (event.team === homeTeam.short_name) {
          homeRedCards.push(event.player);
          homeMorale -= MORALE_CONFIG.redCardDrop;
        } else {
          awayRedCards.push(event.player);
          awayMorale -= MORALE_CONFIG.redCardDrop;
        }
      }
    }
    
    // Check for straight red on serious fouls
    if (event.type === 'FOUL' && Math.random() < RED_CARD_CONFIG.straightRedProb * (
      homeTactics.tackling === 'hard' || awayTactics.tackling === 'hard' ? 2 : 1
    )) {
      events.push({
        type: 'RED_CARD',
        minute: event.minute,
        team: event.team,
        player: event.player,
        description: `🟥 STRAIGHT RED! ${event.player} is sent off for a dangerous tackle!`,
      });
      
      if (event.team === homeTeam.short_name) {
        homeRedCards.push(event.player);
        homeMorale -= MORALE_CONFIG.redCardDrop;
      } else {
        awayRedCards.push(event.player);
        awayMorale -= MORALE_CONFIG.redCardDrop;
      }
    }
  }
  
  events.push(...otherEvents);

  // Phase 3: Generate injuries
  const { injuries: matchInjuries, injuryEvents } = generateMatchInjuries(
    homeTeam, awayTeam,
    homeTactics, awayTactics,
    homeFouls, awayFouls
  );
  events.push(...injuryEvents);
  
  // Phase 4: Calculate stoppage time
  const firstHalfEvents = events.filter(e => e.minute <= 45);
  const secondHalfEvents = events.filter(e => e.minute > 45 && e.minute <= 90);
  
  const firstHalfStoppage = calculateStoppageTime(firstHalfEvents, false);
  const secondHalfStoppage = calculateStoppageTime(secondHalfEvents, true);
  
  // Add stoppage time goals (rare but dramatic)
  if (firstHalfStoppage > 0 && Math.random() < 0.15) {
    const isHome = Math.random() < 0.5;
    const team = isHome ? homeTeam : awayTeam;
    const scorer = selectScorer(team);
    const minute = 45;
    
    events.push({
      type: 'GOAL',
      minute,
      team: team.short_name,
      player: scorer.name,
      description: `⏱️ STOPPAGE TIME! ${scorer.name} scores just before the break!`,
      isStoppageTime: true,
    });
    
    if (isHome) homeGoals++;
    else awayGoals++;
  }
  
  if (secondHalfStoppage > 0 && Math.random() < 0.20) {
    const isHome = Math.random() < 0.5;
    const team = isHome ? homeTeam : awayTeam;
    const scorer = isHome ? homeStarPlayer : awayStarPlayer; // Star player more likely in dying moments
    const minute = 90;
    
    events.push({
      type: 'GOAL',
      minute,
      team: team.short_name,
      player: scorer.name,
      description: `⏱️ LAST GASP! ${scorer.name} scores in the ${90 + Math.floor(Math.random() * secondHalfStoppage) + 1}th minute!`,
      isStoppageTime: true,
    });
    
    if (isHome) homeGoals++;
    else awayGoals++;
  }
  
  // Add full time event
  events.push({
    type: 'FULL_TIME',
    minute: 90,
    team: '',
    player: '',
    description: `Full Time: ${homeTeam.short_name} ${homeGoals} - ${awayGoals} ${awayTeam.short_name}`,
  });
  
  // Sort all events by minute
  events.sort((a, b) => a.minute - b.minute);
  
  // Count cards
  const homeYellows = events.filter(e => e.type === 'YELLOW_CARD' && e.team === homeTeam.short_name).length;
  const awayYellows = events.filter(e => e.type === 'YELLOW_CARD' && e.team === awayTeam.short_name).length;
  
  const stats: MatchStats = {
    possession: { home: Math.round(homePossession), away: Math.round(100 - homePossession) },
    shots: { home: homeShots, away: awayShots },
    shotsOnTarget: { home: homeShotsOnTarget, away: awayShotsOnTarget },
    corners: { home: homeCorners, away: awayCorners },
    fouls: { home: homeFouls, away: awayFouls },
    yellowCards: { home: homeYellows, away: awayYellows },
    redCards: { home: homeRedCards.length, away: awayRedCards.length },
    offsides: { 
      home: Math.floor(Math.random() * 4), 
      away: Math.floor(Math.random() * 4) 
    },
    penalties: { home: homePenalties, away: awayPenalties },
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
    stats: {
      ...stats,
      redCards: { home: homeRedCards.length, away: awayRedCards.length },
      penalties: { home: homePenalties, away: awayPenalties },
    },
    playerRatings,
    momentum: {
      timeline: momentumTimeline,
      finalHome: finalMomentum.home,
      finalAway: finalMomentum.away,
    },
    injuries: matchInjuries,
    weather,
    redCards: { home: homeRedCards, away: awayRedCards },
    stoppageTime: { firstHalf: firstHalfStoppage, secondHalf: secondHalfStoppage },
  };
}

// Types are already exported at their definitions above

// ============================================
// LIGHTWEIGHT ENGINE (AI vs AI)
// ============================================

/**
 * Lightweight result for AI vs AI matches.
 * No events, no commentary, no momentum — just the numbers.
 */
export interface LiteMatchResult {
  homeScore: number;
  awayScore: number;
  stats: MatchStats;
  playerRatings: { [playerId: string]: number };
  scorers: { playerId: string; playerName: string; team: 'home' | 'away'; minute: number }[];
  injuries: MatchInjury[];
}

/**
 * Fast AI vs AI match simulation.
 * Uses the same core model (xG, Poisson, tactical matchups, form/fitness)
 * but skips event generation, descriptions, momentum tracking.
 * ~5x faster than the full engine.
 */
export function simulateMatchLite(homeTeam: Team, awayTeam: Team): LiteMatchResult {
  // Defensive checks for invalid teams
  if (!homeTeam || !homeTeam.squad || homeTeam.squad.length === 0) {
    console.error('simulateMatchLite: Invalid home team', homeTeam?.short_name);
    return {
      homeScore: 0,
      awayScore: 1,
      stats: {
        possession: { home: 50, away: 50 },
        shots: { home: 0, away: 1 },
        shotsOnTarget: { home: 0, away: 1 },
        corners: { home: 0, away: 0 },
        fouls: { home: 0, away: 0 },
        yellowCards: { home: 0, away: 0 },
        offsides: { home: 0, away: 0 },
      },
      playerRatings: {},
      scorers: [],
      injuries: [],
    };
  }
  
  if (!awayTeam || !awayTeam.squad || awayTeam.squad.length === 0) {
    console.error('simulateMatchLite: Invalid away team', awayTeam?.short_name);
    return {
      homeScore: 1,
      awayScore: 0,
      stats: {
        possession: { home: 50, away: 50 },
        shots: { home: 1, away: 0 },
        shotsOnTarget: { home: 1, away: 0 },
        corners: { home: 0, away: 0 },
        fouls: { home: 0, away: 0 },
        yellowCards: { home: 0, away: 0 },
        offsides: { home: 0, away: 0 },
      },
      playerRatings: {},
      scorers: [],
      injuries: [],
    };
  }

  // --- Same core calculations as full engine ---
  const homeTactics = getTeamTactics(homeTeam);
  const awayTactics = getTeamTactics(awayTeam);

  let homeRatings = applyFormAndFitness(calculateTeamRatings(homeTeam), homeTeam);
  let awayRatings = applyFormAndFitness(calculateTeamRatings(awayTeam), awayTeam);

  // Tactical matchup bonuses
  const homeTacticalBonus = calculateTacticalMatchup(homeTactics.formation, awayTactics.formation);
  const awayTacticalBonus = calculateTacticalMatchup(awayTactics.formation, homeTactics.formation);
  homeRatings.attack *= (1 + homeTacticalBonus);
  homeRatings.midfield *= (1 + homeTacticalBonus * 0.5);
  awayRatings.attack *= (1 + awayTacticalBonus);
  awayRatings.midfield *= (1 + awayTacticalBonus * 0.5);

  // Mentality matchup bonuses
  const homeMentalityBonus = calculateMentalityMatchup(homeTactics.mentality, awayTactics.mentality, homeTactics.counterAttack);
  const awayMentalityBonus = calculateMentalityMatchup(awayTactics.mentality, homeTactics.mentality, awayTactics.counterAttack);
  homeRatings.attack *= (1 + homeMentalityBonus);
  awayRatings.attack *= (1 + awayMentalityBonus);

  // AI subs happen around minute 65
  homeRatings = applySubstitutionImpact(homeRatings, 65);
  awayRatings = applySubstitutionImpact(awayRatings, 65);

  // xG & score generation (identical to full engine)
  const homeXG = calculateExpectedGoals(homeTeam, awayTeam, homeRatings, awayRatings, true);
  const awayXG = calculateExpectedGoals(awayTeam, homeTeam, awayRatings, homeRatings, false);

  const homeGoals = poissonRandom(homeXG);
  const awayGoals = poissonRandom(awayXG);

  // --- Lightweight stats (no event loop) ---
  const homeShots = Math.max(homeGoals + 1, Math.floor(homeXG * 4 + Math.random() * 4));
  const awayShots = Math.max(awayGoals + 1, Math.floor(awayXG * 4 + Math.random() * 4));
  const homeShotsOnTarget = Math.max(homeGoals, homeGoals + Math.floor((homeShots - homeGoals) * 0.35));
  const awayShotsOnTarget = Math.max(awayGoals, awayGoals + Math.floor((awayShots - awayGoals) * 0.35));

  const homePoss = Math.round(45 + (homeRatings.midfield - awayRatings.midfield) * 2 + (Math.random() * 10 - 5));
  const awayPoss = 100 - homePoss;

  const homeTacklingMod = TACKLING_MODIFIERS[homeTactics.tackling] || TACKLING_MODIFIERS['normal'];
  const awayTacklingMod = TACKLING_MODIFIERS[awayTactics.tackling] || TACKLING_MODIFIERS['normal'];
  const homeFouls = Math.round((8 + Math.random() * 8) * homeTacklingMod.fouls);
  const awayFouls = Math.round((8 + Math.random() * 8) * awayTacklingMod.fouls);
  const homeYellows = Math.floor(homeFouls * 0.15 + Math.random());
  const awayYellows = Math.floor(awayFouls * 0.15 + Math.random());
  const homeCorners = Math.floor(homeShots * 0.4 + Math.random() * 3);
  const awayCorners = Math.floor(awayShots * 0.4 + Math.random() * 3);
  const homeOffsides = homeTactics.offsideTrap ? Math.floor(2 + Math.random() * 4) : Math.floor(Math.random() * 3);
  const awayOffsides = awayTactics.offsideTrap ? Math.floor(2 + Math.random() * 4) : Math.floor(Math.random() * 3);

  const stats: MatchStats = {
    possession: { home: Math.max(25, Math.min(75, homePoss)), away: Math.max(25, Math.min(75, awayPoss)) },
    shots: { home: homeShots, away: awayShots },
    shotsOnTarget: { home: homeShotsOnTarget, away: awayShotsOnTarget },
    corners: { home: homeCorners, away: awayCorners },
    fouls: { home: homeFouls, away: awayFouls },
    yellowCards: { home: homeYellows, away: awayYellows },
    offsides: { home: homeOffsides, away: awayOffsides },
  };

  // --- Lightweight scorers (just names + minutes, no descriptions) ---
  const scorers: LiteMatchResult['scorers'] = [];
  const usedMinutes = new Set<number>();
  const getMinute = (): number => {
    let m: number;
    do { m = 1 + Math.floor(Math.random() * 90); } while (usedMinutes.has(m));
    usedMinutes.add(m);
    return m;
  };

  for (let i = 0; i < homeGoals; i++) {
    const scorer = selectScorer(homeTeam);
    scorers.push({ playerId: scorer.id, playerName: scorer.name, team: 'home', minute: getMinute() });
  }
  for (let i = 0; i < awayGoals; i++) {
    const scorer = selectScorer(awayTeam);
    scorers.push({ playerId: scorer.id, playerName: scorer.name, team: 'away', minute: getMinute() });
  }
  scorers.sort((a, b) => a.minute - b.minute);

  // --- Lightweight player ratings (simplified, no event tracking) ---
  const playerRatings: { [playerId: string]: number } = {};
  const isDraw = homeGoals === awayGoals;
  const homeWon = homeGoals > awayGoals;

  const rateTeamPlayers = (team: Team, teamWon: boolean, goalsScored: number, goalsConceded: number) => {
    const startingXI = getStartingXI(team);
    const teamScorers = scorers.filter(s => startingXI.some(p => p.id === s.playerId));

    for (const player of startingXI) {
      // Base rating from ability relative to 10 (average)
      let rating = 5.5 + (player.current_ability - 10) * 0.15;

      // Form bonus - Form now on 1-10 scale, 6 is average
      rating += (player.form - 6) * 0.1;

      // Position-based adjustment
      if (player.position === 'GK') {
        rating += goalsConceded === 0 ? 1.0 : goalsConceded <= 1 ? 0.3 : -0.3 * Math.min(goalsConceded, 3);
      } else if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(player.position)) {
        rating += goalsConceded === 0 ? 0.6 : goalsConceded >= 3 ? -0.5 : 0;
      }

      // Goal/assist bonus
      const playerGoals = teamScorers.filter(s => s.playerId === player.id).length;
      rating += playerGoals * 1.0;

      // Result bonus
      if (teamWon) rating += 0.4;
      else if (isDraw) rating += 0.1;
      else rating -= 0.3;

      // Small random variance
      rating += (Math.random() - 0.5) * 0.6;

      playerRatings[player.id] = Math.max(1, Math.min(10, Math.round(rating * 10) / 10));
    }
  };

  rateTeamPlayers(homeTeam, homeWon, homeGoals, awayGoals);
  rateTeamPlayers(awayTeam, awayGoals > homeGoals, awayGoals, homeGoals);

  // Phase 3: Generate injuries for AI matches too
  const { injuries: liteInjuries } = generateMatchInjuries(
    homeTeam, awayTeam,
    homeTactics, awayTactics,
    homeFouls, awayFouls
  );

  return { homeScore: homeGoals, awayScore: awayGoals, stats, playerRatings, scorers, injuries: liteInjuries };
}

