/**
 * useSeasonProgression Hook
 * Handles season-related operations: end of season, prize money, regens
 */

import { Player, Team, GameSave, League } from '../context/GameContext';
import { getRandomNationality, generatePlayerName } from '../utils/nationalities';

// Prize money based on league position (Premier League scale)
export const PRIZE_MONEY: Record<number, number> = {
  1: 100000000,   // £100M for 1st
  2: 85000000,    // £85M
  3: 70000000,    // £70M
  4: 60000000,    // £60M
  5: 50000000,    // £50M
  6: 45000000,    // £45M
  7: 40000000,    // £40M
  8: 35000000,    // £35M
  9: 32000000,    // £32M
  10: 30000000,   // £30M
  11: 28000000,   // £28M
  12: 26000000,   // £26M
  13: 24000000,   // £24M
  14: 22000000,   // £22M
  15: 20000000,   // £20M
  16: 18000000,   // £18M
  17: 15000000,   // £15M
  18: 12000000,   // £12M
  19: 10000000,   // £10M
  20: 8000000,    // £8M
};

/**
 * Check if the league season is complete
 */
export function isSeasonComplete(league: League): boolean {
  const leagueFixtures = league.fixtures.filter(f => !f.match_type || f.match_type === 'league');
  return leagueFixtures.length > 0 && leagueFixtures.every(f => f.played);
}

/**
 * Calculate final league standings
 */
export function calculateStandings(league: League): { teamId: string; position: number; points: number }[] {
  const standings = league.table
    .sort((a, b) => {
      // Sort by points, then goal difference, then goals for
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    })
    .map((entry, index) => ({
      teamId: entry.team_id,
      position: index + 1,
      points: entry.points,
    }));
  
  return standings;
}

/**
 * Get prize money for a league position
 */
export function getPrizeMoney(position: number): number {
  return PRIZE_MONEY[position] || 5000000; // Default £5M for positions beyond 20
}

/**
 * Generate a regen player to replace a retiring player
 */
export function generateRegen(retiringPlayer: Player, season: number): Player {
  const nationality = getRandomNationality();
  const name = generatePlayerName(nationality.code);
  
  // Regen starts at age 16-18 with potential based on retiring player
  const age = 16 + Math.floor(Math.random() * 3);
  
  // Potential is 70-90% of retiring player's ability
  const potentialFactor = 0.7 + Math.random() * 0.2;
  const potential = Math.round(retiringPlayer.current_ability * potentialFactor);
  
  // Current ability is 30-50% of potential
  const abilityFactor = 0.3 + Math.random() * 0.2;
  const currentAbility = Math.round(potential * abilityFactor);
  
  return {
    id: `regen_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    name,
    age,
    nationality: nationality.code,
    nationalityFlag: nationality.flag,
    position: retiringPlayer.position,
    preferred_positions: retiringPlayer.preferred_positions,
    // Physical attributes - random youth values
    pace: Math.floor(40 + Math.random() * 30),
    strength: Math.floor(30 + Math.random() * 25),
    stamina: Math.floor(40 + Math.random() * 30),
    // Technical attributes
    passing: Math.floor(35 + Math.random() * 30),
    shooting: Math.floor(30 + Math.random() * 35),
    dribbling: Math.floor(35 + Math.random() * 30),
    defending: Math.floor(25 + Math.random() * 30),
    heading: Math.floor(30 + Math.random() * 30),
    // Mental attributes
    vision: Math.floor(35 + Math.random() * 30),
    composure: Math.floor(30 + Math.random() * 30),
    // GK attributes
    handling: Math.floor(25 + Math.random() * 30),
    reflexes: Math.floor(30 + Math.random() * 30),
    positioning: Math.floor(30 + Math.random() * 30),
    // Overall
    current_ability: currentAbility,
    potential_ability: potential,
    // Contract
    value: currentAbility * 50000,
    wage: Math.round(currentAbility * 100),
    contract_end: `${season + 4}-06-30`,
    // Form & fitness
    form: 6.0,  // Form now on 1-10 scale, 6 = average
    fitness: 100,
    morale: 15,
    recentMatchRatings: [],  // No match history yet
    // Stats
    goals: 0,
    assists: 0,
    appearances: 0,
    yellow_cards: 0,
    red_cards: 0,
    clean_sheets: 0,
  };
}

/**
 * Reset league for new season
 */
export function resetLeagueForNewSeason(league: League): League {
  // Reset table
  const resetTable = league.table.map(entry => ({
    ...entry,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
    form: [],
  }));
  
  // Clear fixtures (will be regenerated)
  return {
    ...league,
    table: resetTable,
    fixtures: [],
    current_week: 1,
  };
}

/**
 * Apply end of season development to players
 */
export function applySeasonDevelopment(squad: Player[]): Player[] {
  return squad.map(player => {
    // Young players develop
    if (player.age < 24) {
      const developmentRate = (24 - player.age) * 0.5; // Younger = faster development
      const development = Math.floor(developmentRate * (0.5 + Math.random()));
      const newAbility = Math.min(player.potential_ability, player.current_ability + development);
      
      return {
        ...player,
        current_ability: newAbility,
        value: newAbility * 100000,
      };
    }
    
    // Peak age players maintain
    if (player.age >= 24 && player.age <= 29) {
      return player;
    }
    
    // Older players may decline
    if (player.age > 29) {
      const declineChance = (player.age - 29) * 0.15;
      if (Math.random() < declineChance) {
        const decline = Math.floor(1 + Math.random() * 2);
        const newAbility = Math.max(30, player.current_ability - decline);
        
        return {
          ...player,
          current_ability: newAbility,
          value: Math.round(newAbility * 80000),
        };
      }
    }
    
    return player;
  });
}

/**
 * Reset player stats for new season
 */
export function resetPlayerStats(squad: Player[]): Player[] {
  return squad.map(player => ({
    ...player,
    goals: 0,
    assists: 0,
    appearances: 0,
    yellow_cards: 0,
    red_cards: 0,
    clean_sheets: 0,
    form: 6.0,  // Form now on 1-10 scale, 6 = average
    fitness: 100,
    injury: undefined,
    recentMatchRatings: [],  // Clear match history for new season
  }));
}
