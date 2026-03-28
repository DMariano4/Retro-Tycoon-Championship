/**
 * useSquadManagement Hook
 * Handles squad-related operations: formations, injuries, player management
 */

import { Player, Team } from '../context/GameContext';

export interface InjuryInfo {
  type: string;
  recoveryWeeks: number;
}

/**
 * Get all injured players from a squad
 */
export function getInjuredPlayers(squad: Player[]): Player[] {
  return squad.filter(p => p.injury && p.injury.recoveryWeeks > 0);
}

/**
 * Process injury recovery for all players (decrements recovery weeks)
 */
export function processInjuryRecovery(squad: Player[]): Player[] {
  return squad.map(player => {
    if (!player.injury || player.injury.recoveryWeeks <= 0) {
      return player;
    }
    
    const newRecoveryWeeks = player.injury.recoveryWeeks - 1;
    
    if (newRecoveryWeeks <= 0) {
      // Player recovered - clear injury and boost fitness gradually
      return {
        ...player,
        injury: undefined,
        fitness: Math.min(100, player.fitness + 10),
      };
    }
    
    return {
      ...player,
      injury: {
        ...player.injury,
        recoveryWeeks: newRecoveryWeeks,
      },
    };
  });
}

/**
 * Apply a new injury to a player
 */
export function applyInjury(player: Player, injuryType: string, recoveryWeeks: number): Player {
  return {
    ...player,
    injury: {
      type: injuryType,
      recoveryWeeks,
    },
    fitness: Math.max(0, player.fitness - 20),
  };
}

/**
 * Get players with expiring contracts
 */
export function getExpiringContracts(squad: Player[], seasonEndDate: string): Player[] {
  return squad.filter(p => p.contract_end <= seasonEndDate);
}

/**
 * Get retirement candidates
 */
export function getRetirementCandidates(squad: Player[]): { 
  mustRetire: Player[]; 
  userChoice: Player[] 
} {
  // For managed team: 35+ is user choice, none auto-retire
  const userChoice = squad.filter(p => p.age >= 35);
  return { mustRetire: [], userChoice };
}

/**
 * Age all players by 1 year (for season end)
 */
export function ageSquad(squad: Player[]): Player[] {
  return squad.map(player => ({
    ...player,
    age: player.age + 1,
  }));
}

/**
 * Update player form based on match performance
 */
export function updatePlayerForm(
  player: Player, 
  rating: number, 
  wasWin: boolean, 
  wasDraw: boolean
): Player {
  // Form changes based on rating and result
  let formChange = 0;
  
  if (rating >= 8) formChange += 2;
  else if (rating >= 7) formChange += 1;
  else if (rating < 5) formChange -= 2;
  else if (rating < 6) formChange -= 1;
  
  if (wasWin) formChange += 1;
  else if (!wasDraw) formChange -= 1;
  
  const newForm = Math.max(1, Math.min(20, player.form + formChange));
  
  return {
    ...player,
    form: newForm,
  };
}

/**
 * Update player fitness after match
 */
export function updatePlayerFitness(player: Player, minutesPlayed: number): Player {
  // Fitness drops based on minutes played
  const fitnessLoss = Math.floor(minutesPlayed / 10);
  const newFitness = Math.max(0, player.fitness - fitnessLoss);
  
  return {
    ...player,
    fitness: newFitness,
  };
}

/**
 * Recover fitness for rest day
 */
export function recoverFitness(squad: Player[]): Player[] {
  return squad.map(player => ({
    ...player,
    fitness: Math.min(100, player.fitness + 5),
  }));
}

/**
 * Calculate team average rating
 */
export function calculateTeamRating(squad: Player[]): number {
  if (squad.length === 0) return 0;
  const total = squad.reduce((sum, p) => sum + p.current_ability, 0);
  return Math.round(total / squad.length);
}

/**
 * Select best starting XI based on formation
 */
export function selectBestXI(
  squad: Player[], 
  formation: string
): { startingXI: Player[]; bench: Player[] } {
  // Simple implementation - sort by ability and pick top 11
  const sortedSquad = [...squad]
    .filter(p => !p.injury || p.injury.recoveryWeeks <= 0)
    .sort((a, b) => b.current_ability - a.current_ability);
  
  const startingXI = sortedSquad.slice(0, 11);
  const bench = sortedSquad.slice(11);
  
  return { startingXI, bench };
}

/**
 * Check if a player can play in a position
 */
export function canPlayPosition(player: Player, position: string): boolean {
  if (player.position === position) return true;
  if (player.preferred_positions?.includes(position)) return true;
  return false;
}

/**
 * Get squad depth by position
 */
export function getSquadDepth(squad: Player[]): Record<string, number> {
  const depth: Record<string, number> = {};
  
  for (const player of squad) {
    const pos = player.position;
    depth[pos] = (depth[pos] || 0) + 1;
    
    // Also count preferred positions
    for (const prefPos of player.preferred_positions || []) {
      if (prefPos !== pos) {
        depth[prefPos] = (depth[prefPos] || 0) + 0.5; // Half weight for secondary positions
      }
    }
  }
  
  return depth;
}
