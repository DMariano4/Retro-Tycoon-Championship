/**
 * Game Hooks Index
 * Export all extracted utility hooks
 */

// Financial operations
export {
  calculateAttendance,
  calculateWeeklyFinances,
  applyWeeklyFinances,
  calculateTotalWages,
  canUpgradeStadium,
  canUpgradeFacilities,
  STADIUM_UPGRADE_COST,
  STADIUM_UPGRADE_AMOUNT,
  STADIUM_MAX_CAPACITY,
  FACILITY_UPGRADE_COST,
  FACILITY_UPGRADE_AMOUNT,
  FACILITY_MAX_LEVEL,
} from './useFinances';
export type { WeeklyFinances } from './useFinances';

// Squad management
export {
  getInjuredPlayers,
  processInjuryRecovery,
  applyInjury,
  getExpiringContracts,
  getRetirementCandidates,
  ageSquad,
  updatePlayerForm,
  updatePlayerFitness,
  recoverFitness,
  calculateTeamRating,
  selectBestXI,
  canPlayPosition,
  getSquadDepth,
} from './useSquadManagement';

// Season progression
export {
  isSeasonComplete,
  calculateStandings,
  getPrizeMoney,
  generateRegen,
  resetLeagueForNewSeason,
  applySeasonDevelopment,
  resetPlayerStats,
  PRIZE_MONEY,
} from './useSeasonProgression';
