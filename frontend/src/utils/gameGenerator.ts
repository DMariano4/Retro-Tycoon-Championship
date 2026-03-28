/**
 * Offline Game Generator v2
 * Event-based calendar system with multiple competitions.
 * Generates teams, players, fixtures, and cup draws entirely client-side.
 */

import { getRandomNationality, generatePlayerName } from './nationalities';
import {
  GameEvent,
  CompetitionType,
  SeasonCalendarTemplate,
  ENGLISH_CALENDAR,
  formatDate,
  parseDate,
  addDays,
  getNextMatchDate,
  generateSeasonDates,
  createMatchEvent,
  createCupDrawEvent,
  createTransferWindowEvent,
  sortEvents,
} from './calendar';
import {
  Competition,
  CupFixture,
  CupRound,
  LeagueStanding,
  FA_CUP_ROUNDS,
  FA_CUP_SCHEDULE,
  LEAGUE_CUP_ROUNDS,
  LEAGUE_CUP_SCHEDULE,
  createLeagueCompetition,
  createCupCompetition,
  generateCupDraw,
  getCupRoundDate,
  getCompetitionIcon,
  getCompetitionColor,
} from './competitions';

// ============================================
// TEAM TEMPLATES (20 Premier League-style teams)
// ============================================

export interface TeamTemplate {
  id: string;
  name: string;
  short_name: string;
  stadium: string;
  primary_color: string;
  secondary_color: string;
  reputation: number;  // 1-20
  budget: number;
  wage_budget: number;
  stadium_capacity: number;
  fan_base: number;
}

export const TEAM_TEMPLATES: TeamTemplate[] = [
  // Top 6 (Rep 16-20)
  { id: 'team_london_royals', name: 'London Royals', short_name: 'LRO', stadium: 'Royal Stadium', primary_color: '#ff0000', secondary_color: '#ffffff', reputation: 19, budget: 150000000, wage_budget: 3000000, stadium_capacity: 60000, fan_base: 500000 },
  { id: 'team_manchester_reds', name: 'Manchester Reds', short_name: 'MRE', stadium: 'Old Mill Stadium', primary_color: '#c70101', secondary_color: '#ffd700', reputation: 18, budget: 140000000, wage_budget: 2800000, stadium_capacity: 75000, fan_base: 550000 },
  { id: 'team_merseyside_fc', name: 'Merseyside FC', short_name: 'MFC', stadium: 'Anfield Road', primary_color: '#c8102e', secondary_color: '#00a398', reputation: 18, budget: 130000000, wage_budget: 2600000, stadium_capacity: 54000, fan_base: 480000 },
  { id: 'team_sky_blues', name: 'Sky Blues City', short_name: 'SBC', stadium: 'Etihad Arena', primary_color: '#6caddf', secondary_color: '#ffffff', reputation: 20, budget: 200000000, wage_budget: 3500000, stadium_capacity: 55000, fan_base: 400000 },
  { id: 'team_north_london', name: 'North London FC', short_name: 'NLF', stadium: 'Emirates Park', primary_color: '#ef0107', secondary_color: '#ffffff', reputation: 17, budget: 100000000, wage_budget: 2200000, stadium_capacity: 60000, fan_base: 420000 },
  { id: 'team_chelsea_blues', name: 'West London Blues', short_name: 'WLB', stadium: 'Stamford Ground', primary_color: '#034694', secondary_color: '#ffffff', reputation: 17, budget: 120000000, wage_budget: 2400000, stadium_capacity: 42000, fan_base: 380000 },
  
  // Upper Mid-table (Rep 12-15)
  { id: 'team_tyne_united', name: 'Tyne United', short_name: 'TUN', stadium: 'St James Arena', primary_color: '#241f20', secondary_color: '#ffffff', reputation: 15, budget: 80000000, wage_budget: 1800000, stadium_capacity: 52000, fan_base: 350000 },
  { id: 'team_villa_park', name: 'Villa Park FC', short_name: 'VPF', stadium: 'Villa Ground', primary_color: '#670e36', secondary_color: '#95bfe5', reputation: 14, budget: 70000000, wage_budget: 1600000, stadium_capacity: 42000, fan_base: 280000 },
  { id: 'team_hammers_united', name: 'East London Hammers', short_name: 'ELH', stadium: 'Olympic Stadium', primary_color: '#7a263a', secondary_color: '#1bb1e7', reputation: 13, budget: 60000000, wage_budget: 1400000, stadium_capacity: 60000, fan_base: 260000 },
  { id: 'team_brighton_seagulls', name: 'South Coast Seagulls', short_name: 'SCS', stadium: 'Amex Arena', primary_color: '#0057b8', secondary_color: '#ffffff', reputation: 12, budget: 50000000, wage_budget: 1200000, stadium_capacity: 31000, fan_base: 180000 },
  
  // Mid-table (Rep 9-11)
  { id: 'team_wolves_fc', name: 'Midlands Wolves', short_name: 'MWO', stadium: 'Molineux Stadium', primary_color: '#fdb913', secondary_color: '#231f20', reputation: 11, budget: 45000000, wage_budget: 1100000, stadium_capacity: 32000, fan_base: 200000 },
  { id: 'team_palace_eagles', name: 'Crystal Palace Eagles', short_name: 'CPE', stadium: 'Selhurst Park', primary_color: '#1b458f', secondary_color: '#c4122e', reputation: 10, budget: 40000000, wage_budget: 1000000, stadium_capacity: 26000, fan_base: 160000 },
  { id: 'team_brentford_bees', name: 'West London Bees', short_name: 'WLB2', stadium: 'Tech Stadium', primary_color: '#e30613', secondary_color: '#ffffff', reputation: 10, budget: 35000000, wage_budget: 900000, stadium_capacity: 17000, fan_base: 120000 },
  { id: 'team_fulham_cottagers', name: 'Riverside Cottagers', short_name: 'RCO', stadium: 'Craven Cottage', primary_color: '#000000', secondary_color: '#ffffff', reputation: 9, budget: 35000000, wage_budget: 900000, stadium_capacity: 25000, fan_base: 140000 },
  { id: 'team_forest_reds', name: 'Forest Reds', short_name: 'FOR', stadium: 'City Ground', primary_color: '#dd0000', secondary_color: '#ffffff', reputation: 9, budget: 40000000, wage_budget: 950000, stadium_capacity: 30000, fan_base: 180000 },
  
  // Lower Mid-table (Rep 6-8)
  { id: 'team_bournemouth_cherries', name: 'South Coast Cherries', short_name: 'SCC', stadium: 'Vitality Stadium', primary_color: '#da291c', secondary_color: '#000000', reputation: 8, budget: 30000000, wage_budget: 800000, stadium_capacity: 11000, fan_base: 100000 },
  { id: 'team_everton_toffees', name: 'Blue Toffees', short_name: 'BTF', stadium: 'Goodison Park', primary_color: '#003399', secondary_color: '#ffffff', reputation: 8, budget: 35000000, wage_budget: 850000, stadium_capacity: 40000, fan_base: 220000 },
  
  // Relegation Battle (Rep 4-7)
  { id: 'team_leicester_foxes', name: 'East Midlands Foxes', short_name: 'EMF', stadium: 'King Power Arena', primary_color: '#003090', secondary_color: '#fdbe11', reputation: 7, budget: 25000000, wage_budget: 700000, stadium_capacity: 32000, fan_base: 150000 },
  { id: 'team_southampton_saints', name: 'South Coast Saints', short_name: 'SSA', stadium: "St Mary's Stadium", primary_color: '#d71920', secondary_color: '#ffffff', reputation: 6, budget: 20000000, wage_budget: 600000, stadium_capacity: 32000, fan_base: 130000 },
  { id: 'team_ipswich_tractors', name: 'East Anglia Tractors', short_name: 'EAT', stadium: 'Portman Road', primary_color: '#0033a0', secondary_color: '#ffffff', reputation: 5, budget: 15000000, wage_budget: 500000, stadium_capacity: 30000, fan_base: 100000 },
];

// ============================================
// PLAYER GENERATION
// ============================================

const SQUAD_STRUCTURE = {
  GK: 3,
  CB: 5,
  LB: 2,
  RB: 2,
  DM: 3,
  CM: 4,
  AM: 2,
  LW: 2,
  RW: 2,
  ST: 3,
};

export interface GeneratedPlayer {
  id: string;
  name: string;
  age: number;
  nationality: string;
  nationalityFlag: string;
  position: string;
  preferred_positions: string[];
  pace: number;
  strength: number;
  stamina: number;
  agility: number;
  work_rate: number;
  concentration: number;
  decision_making: number;
  composure: number;
  reflexes: number;
  handling: number;
  communication: number;
  tackling: number;
  marking: number;
  positioning: number;
  crossing: number;
  passing: number;
  vision: number;
  dribbling: number;
  control: number;
  finishing: number;
  off_the_ball: number;
  flair: number;
  heading: number;
  current_ability: number;
  potential_ability: number;
  value: number;
  wage: number;
  contract_end: string;
  morale: number;
  fitness: number;
  form: number;
}

function randAttr(base: number, variance: number = 3): number {
  const value = base + Math.floor(Math.random() * variance * 2) - variance;
  return Math.max(1, Math.min(20, value));
}

export function generatePlayer(
  position: string,
  teamReputation: number,
  teamId: string,
  season: number = 2025
): GeneratedPlayer {
  const nationality = getRandomNationality();
  const name = generatePlayerName(nationality);
  
  const ageBase = teamReputation >= 15 ? 22 : teamReputation >= 10 ? 24 : 26;
  const age = ageBase + Math.floor(Math.random() * 12) - 4;
  const clampedAge = Math.max(17, Math.min(38, age));
  
  const abilityBase = Math.floor(teamReputation * 0.7) + 3 + Math.floor(Math.random() * 4);
  const baseAbility = Math.max(5, Math.min(18, abilityBase));
  
  const ageFactor = clampedAge < 23 ? 4 : clampedAge < 27 ? 2 : 0;
  const potential = Math.min(20, baseAbility + ageFactor + Math.floor(Math.random() * 3));
  
  const isGK = position === 'GK';
  const isDef = ['CB', 'LB', 'RB'].includes(position);
  const isMid = ['DM', 'CM', 'AM'].includes(position);
  const isAtt = ['LW', 'RW', 'ST'].includes(position);
  
  const ageMultiplier = clampedAge < 24 ? 1.5 : clampedAge < 28 ? 1.2 : clampedAge < 32 ? 0.8 : 0.4;
  const value = Math.round(baseAbility * 800000 * ageMultiplier * (0.8 + Math.random() * 0.4));
  const wage = Math.round(baseAbility * 2000 * (0.8 + Math.random() * 0.4));
  const contractYears = 1 + Math.floor(Math.random() * 5);
  const contract_end = `${season + contractYears}-06-30`;
  
  return {
    id: `player_${teamId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    age: clampedAge,
    nationality: nationality.name,
    nationalityFlag: nationality.flag,
    position,
    preferred_positions: [position],
    pace: isGK ? randAttr(baseAbility - 3) : randAttr(baseAbility),
    strength: isDef ? randAttr(baseAbility + 1) : randAttr(baseAbility - 1),
    stamina: isMid ? randAttr(baseAbility + 1) : randAttr(baseAbility),
    agility: isAtt ? randAttr(baseAbility + 1) : randAttr(baseAbility),
    work_rate: isMid ? randAttr(baseAbility + 1) : randAttr(baseAbility),
    concentration: isDef ? randAttr(baseAbility + 1) : randAttr(baseAbility),
    decision_making: randAttr(baseAbility),
    composure: randAttr(baseAbility),
    reflexes: isGK ? randAttr(baseAbility + 2) : randAttr(baseAbility - 4),
    handling: isGK ? randAttr(baseAbility + 2) : randAttr(baseAbility - 5),
    communication: isGK ? randAttr(baseAbility + 1) : randAttr(baseAbility - 3),
    tackling: isDef ? randAttr(baseAbility + 2) : isMid ? randAttr(baseAbility) : randAttr(baseAbility - 3),
    marking: isDef ? randAttr(baseAbility + 2) : randAttr(baseAbility - 2),
    positioning: isDef || isGK ? randAttr(baseAbility + 1) : randAttr(baseAbility - 1),
    crossing: ['LB', 'RB', 'LW', 'RW'].includes(position) ? randAttr(baseAbility + 2) : randAttr(baseAbility - 2),
    passing: isMid ? randAttr(baseAbility + 2) : randAttr(baseAbility),
    vision: ['AM', 'CM'].includes(position) ? randAttr(baseAbility + 2) : randAttr(baseAbility - 1),
    dribbling: isAtt || position === 'AM' ? randAttr(baseAbility + 2) : randAttr(baseAbility - 1),
    control: isMid || isAtt ? randAttr(baseAbility + 1) : randAttr(baseAbility - 1),
    finishing: isAtt ? randAttr(baseAbility + 3) : isMid ? randAttr(baseAbility - 1) : randAttr(baseAbility - 4),
    off_the_ball: isAtt ? randAttr(baseAbility + 2) : randAttr(baseAbility - 2),
    flair: isAtt || position === 'AM' ? randAttr(baseAbility + 1) : randAttr(baseAbility - 2),
    heading: ['CB', 'ST'].includes(position) ? randAttr(baseAbility + 2) : randAttr(baseAbility - 1),
    current_ability: baseAbility,
    potential_ability: potential,
    value,
    wage,
    contract_end,
    morale: 12 + Math.floor(Math.random() * 6),
    fitness: 16 + Math.floor(Math.random() * 5),
    form: 10 + Math.floor(Math.random() * 6),
  };
}

export function generateSquad(teamReputation: number, teamId: string, season: number = 2025): GeneratedPlayer[] {
  const squad: GeneratedPlayer[] = [];
  for (const [position, count] of Object.entries(SQUAD_STRUCTURE)) {
    for (let i = 0; i < count; i++) {
      squad.push(generatePlayer(position, teamReputation, teamId, season));
    }
  }
  return squad;
}

// ============================================
// GENERATED TEAM
// ============================================

export interface GeneratedTeam {
  id: string;
  name: string;
  short_name: string;
  stadium: string;
  division: number;
  budget: number;
  wage_budget: number;
  formation: string;
  primary_color: string;
  secondary_color: string;
  squad: GeneratedPlayer[];
  tactics: Record<string, any>;
  reputation: number;
  fan_base: number;
  fan_loyalty: number;
  sponsorship_monthly: number;
  ticket_price: number;
  ticket_price_base: number;
  stadium_capacity: number;
  youth_facilities: number;
  training_facilities: number;
  staff_costs_weekly: number;
}

// ============================================
// LEAGUE FIXTURE GENERATION (Date-based)
// ============================================

export interface GeneratedFixture {
  id: string;
  matchDate: string;           // YYYY-MM-DD
  competitionId: string;
  competitionType: CompetitionType;
  round: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  played: boolean;
  events: any[];
}

/**
 * Generate league fixtures with actual dates
 */
export function generateLeagueFixturesWithDates(
  teams: { id: string; name: string }[],
  season: number,
  leagueId: string,
  template: SeasonCalendarTemplate = ENGLISH_CALENDAR
): GeneratedFixture[] {
  const fixtures: GeneratedFixture[] = [];
  const teamsList = [...teams];
  
  if (teamsList.length % 2 !== 0) {
    teamsList.push({ id: 'BYE', name: 'BYE' });
  }
  
  const totalTeams = teamsList.length;
  const matchesPerRound = totalTeams / 2;
  const totalRounds = (totalTeams - 1) * 2;
  
  // Start date
  let currentDate = new Date(season, template.seasonStart.month - 1, template.seasonStart.day);
  const usedDates: string[] = [];
  
  // Create round-robin schedule
  const workingList = [...teamsList];
  
  for (let round = 0; round < totalRounds; round++) {
    const isReturn = round >= (totalTeams - 1);
    const weekNumber = round + 1;
    
    // Find next available Saturday/Sunday
    currentDate = getNextMatchDate(currentDate, template.leagueMatchDays, usedDates);
    const dateStr = formatDate(currentDate);
    usedDates.push(dateStr);
    
    for (let i = 0; i < matchesPerRound; i++) {
      let home = workingList[i];
      let away = workingList[totalTeams - 1 - i];
      
      if (home.id === 'BYE' || away.id === 'BYE') continue;
      if (isReturn) [home, away] = [away, home];
      
      fixtures.push({
        id: `league_${leagueId}_w${weekNumber}_m${i}`,
        matchDate: dateStr,
        competitionId: leagueId,
        competitionType: 'league',
        round: `Week ${weekNumber}`,
        homeTeamId: home.id,
        homeTeamName: home.name,
        awayTeamId: away.id,
        awayTeamName: away.name,
        homeScore: null,
        awayScore: null,
        played: false,
        events: [],
      });
    }
    
    // Rotate teams
    const last = workingList.pop()!;
    workingList.splice(1, 0, last);
    
    // Add gaps for international breaks and holidays
    if (round === 3 || round === 7 || round === 11) {
      currentDate = addDays(currentDate, 14); // 2 week break
    }
  }
  
  // Handle Boxing Day and New Year's Day (special fixtures)
  if (template.specialFixtures?.boxingDay) {
    // Find closest fixture to Dec 26 and adjust
    const boxingDay = `${season}-12-26`;
    const nearbyFixture = fixtures.find(f => {
      const fDate = parseDate(f.matchDate);
      const target = parseDate(boxingDay);
      const diff = Math.abs(fDate.getTime() - target.getTime()) / (1000 * 60 * 60 * 24);
      return diff < 5 && !f.played;
    });
    if (nearbyFixture) {
      nearbyFixture.matchDate = boxingDay;
    }
  }
  
  if (template.specialFixtures?.newYearsDay) {
    const newYearsDay = `${season + 1}-01-01`;
    const nearbyFixture = fixtures.find(f => {
      const fDate = parseDate(f.matchDate);
      const target = parseDate(newYearsDay);
      const diff = Math.abs(fDate.getTime() - target.getTime()) / (1000 * 60 * 60 * 24);
      return diff < 5 && !f.played;
    });
    if (nearbyFixture) {
      nearbyFixture.matchDate = newYearsDay;
    }
  }
  
  return fixtures;
}

/**
 * Generate pre-season friendlies
 */
export function generatePreSeasonFriendlies(
  managedTeamId: string,
  managedTeamName: string,
  allTeams: { id: string; name: string }[],
  season: number
): GeneratedFixture[] {
  const friendlies: GeneratedFixture[] = [];
  const opponents = allTeams.filter(t => t.id !== managedTeamId);
  const shuffled = [...opponents].sort(() => Math.random() - 0.5);
  
  // 4 friendlies in July - early August
  const dates = [
    `${season}-07-13`,  // Sat
    `${season}-07-20`,  // Sat
    `${season}-07-27`,  // Sat
    `${season}-08-03`,  // Sat
  ];
  
  for (let i = 0; i < Math.min(4, shuffled.length); i++) {
    const isHome = Math.random() > 0.5;
    friendlies.push({
      id: `friendly_${season}_${managedTeamId}_${i}`,
      matchDate: dates[i],
      competitionId: 'friendly',
      competitionType: 'friendly',
      round: `Pre-Season ${i + 1}`,
      homeTeamId: isHome ? managedTeamId : shuffled[i].id,
      homeTeamName: isHome ? managedTeamName : shuffled[i].name,
      awayTeamId: isHome ? shuffled[i].id : managedTeamId,
      awayTeamName: isHome ? shuffled[i].name : managedTeamName,
      homeScore: null,
      awayScore: null,
      played: false,
      events: [],
    });
  }
  
  return friendlies;
}

// ============================================
// CUP COMPETITION STATE
// ============================================

export interface CupCompetitionState {
  id: string;
  name: string;
  shortName: string;
  type: CompetitionType;
  rounds: CupRound[];
  currentRound: string;
  fixtures: GeneratedFixture[];
  teams: { id: string; name: string; eliminated: boolean }[];
  drawCompleted: boolean;
  isActive: boolean;
}

// ============================================
// PRE-SEASON FRIENDLY SLOTS (User-Selected)
// ============================================

export interface FriendlySlot {
  id: string;
  date: string;           // YYYY-MM-DD
  isHome: boolean;        // true = home, false = away
  isScheduled: boolean;   // Has user selected opponent?
  opponent?: {
    id: string;
    name: string;
  };
  matchResult?: {
    homeScore: number;
    awayScore: number;
  };
}

export interface FriendlyAvailableTeam {
  id: string;
  name: string;
  reputation: number;
  unavailableDates: string[];  // Dates team is already busy
}

/**
 * Generate empty friendly slots for user to fill
 */
export function generateFriendlySlots(season: number): FriendlySlot[] {
  // 4 pre-season friendly slots in July - early August
  const dates = [
    `${season}-07-12`,  // Sat
    `${season}-07-19`,  // Sat
    `${season}-07-26`,  // Sat
    `${season}-08-02`,  // Sat
  ];
  
  return dates.map((date, index) => ({
    id: `friendly_slot_${season}_${index}`,
    date,
    isHome: index % 2 === 0,  // Alternate home/away
    isScheduled: false,
  }));
}

/**
 * Get available teams for a friendly on a specific date
 * AI teams can't play if they already have a fixture on that date
 */
export function getAvailableTeamsForFriendly(
  date: string,
  allTeams: { id: string; name: string; reputation: number }[],
  managedTeamId: string,
  existingFriendlies: FriendlySlot[],
  aiScheduledFriendlies: Record<string, string[]>,  // teamId -> dates they're busy
): FriendlyAvailableTeam[] {
  const availableTeams: FriendlyAvailableTeam[] = [];
  
  for (const team of allTeams) {
    // Skip managed team
    if (team.id === managedTeamId) continue;
    
    // Check if team is busy on this date
    const teamBusyDates = aiScheduledFriendlies[team.id] || [];
    const isAvailable = !teamBusyDates.includes(date);
    
    // Check if we already have a friendly with this team
    const alreadyScheduled = existingFriendlies.some(
      f => f.isScheduled && f.opponent?.id === team.id
    );
    
    if (isAvailable && !alreadyScheduled) {
      availableTeams.push({
        id: team.id,
        name: team.name,
        reputation: team.reputation,
        unavailableDates: teamBusyDates,
      });
    }
  }
  
  // Sort by reputation (higher first - more attractive opponents)
  return availableTeams.sort((a, b) => b.reputation - a.reputation);
}

/**
 * Generate AI teams' pre-season schedules (who they're playing against)
 * This creates realistic availability constraints
 */
export function generateAIFriendlySchedules(
  allTeams: { id: string; name: string }[],
  managedTeamId: string,
  season: number
): Record<string, string[]> {
  const aiSchedules: Record<string, string[]> = {};
  const friendlyDates = [
    `${season}-07-12`,
    `${season}-07-19`,
    `${season}-07-26`,
    `${season}-08-02`,
  ];
  
  // Each AI team plays 2-3 friendlies randomly
  for (const team of allTeams) {
    if (team.id === managedTeamId) continue;
    
    // Randomly select 2-3 dates this team is busy
    const busyCount = 2 + Math.floor(Math.random() * 2);
    const shuffledDates = [...friendlyDates].sort(() => Math.random() - 0.5);
    aiSchedules[team.id] = shuffledDates.slice(0, busyCount);
  }
  
  return aiSchedules;
}

/**
 * Initialize FA Cup state (PL teams enter at R3)
 */
export function initializeFACup(
  plTeams: { id: string; name: string }[],
  season: number
): CupCompetitionState {
  // Generate fictional lower league opponents for R1, R2
  // For simplicity, PL teams enter at R3 with 44 lower league teams
  const lowerLeagueTeams = generateLowerLeagueTeams(44);
  
  // All teams that will be in R3 (20 PL + 44 from earlier rounds)
  const allTeams = [
    ...plTeams.map(t => ({ ...t, eliminated: false })),
    ...lowerLeagueTeams.map(t => ({ ...t, eliminated: false })),
  ];
  
  return {
    id: `fa_cup_${season}`,
    name: 'FA Cup',
    shortName: 'FAC',
    type: 'fa_cup',
    rounds: FA_CUP_ROUNDS.slice(2), // Start from R3
    currentRound: 'R3',
    fixtures: [],
    teams: allTeams,
    drawCompleted: false,
    isActive: true,
  };
}

/**
 * Initialize League Cup state (PL teams enter at R3)
 */
export function initializeLeagueCup(
  plTeams: { id: string; name: string }[],
  season: number
): CupCompetitionState {
  // Lower league opponents for earlier rounds
  const lowerLeagueTeams = generateLowerLeagueTeams(12);
  
  const allTeams = [
    ...plTeams.map(t => ({ ...t, eliminated: false })),
    ...lowerLeagueTeams.map(t => ({ ...t, eliminated: false })),
  ];
  
  return {
    id: `league_cup_${season}`,
    name: 'League Cup',
    shortName: 'LC',
    type: 'league_cup',
    rounds: LEAGUE_CUP_ROUNDS.slice(2), // Start from R3
    currentRound: 'R3',
    fixtures: [],
    teams: allTeams,
    drawCompleted: false,
    isActive: true,
  };
}

/**
 * Generate fictional lower league team names
 */
function generateLowerLeagueTeams(count: number): { id: string; name: string }[] {
  const prefixes = ['AFC', 'FC', 'United', '', 'Town', 'City', 'Athletic', 'Rovers', 'Wanderers'];
  const towns = [
    'Barnet', 'Woking', 'Dorking', 'Aldershot', 'Maidstone', 'Ebbsfleet',
    'Bromley', 'Sutton', 'Halifax', 'Chesterfield', 'Stockport', 'Wrexham',
    'Notts County', 'Grimsby', 'Oldham', 'Rochdale', 'Hartlepool', 'Barrow',
    'Colchester', 'Stevenage', 'Wycombe', 'MK Dons', 'AFC Wimbledon', 'Crawley',
    'Accrington', 'Morecambe', 'Fleetwood', 'Burton', 'Shrewsbury', 'Cheltenham',
    'Northampton', 'Mansfield', 'Doncaster', 'Carlisle', 'Bradford', 'Newport',
    'Tranmere', 'Salford', 'Swindon', 'Port Vale', 'Crewe', 'Gillingham',
    'Lincoln', 'Cambridge', 'Oxford', 'Peterborough', 'Reading', 'Bristol Rovers',
  ];
  
  const shuffled = [...towns].sort(() => Math.random() - 0.5);
  const teams: { id: string; name: string }[] = [];
  
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const town = shuffled[i];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const name = prefix ? `${town} ${prefix}` : town;
    teams.push({
      id: `lower_${i}_${town.toLowerCase().replace(/\s+/g, '_')}`,
      name: name.trim(),
    });
  }
  
  return teams;
}

// ============================================
// FULL GAME GENERATION (v2)
// ============================================

export interface GeneratedGameData {
  teams: GeneratedTeam[];
  competitions: {
    league: {
      id: string;
      name: string;
      standings: LeagueStanding[];
      fixtures: GeneratedFixture[];
    };
    faCup: CupCompetitionState;
    leagueCup: CupCompetitionState;
  };
  events: GameEvent[];
  transferMarket: any[];
  calendar: {
    currentDate: string;
    seasonStart: string;
    seasonEnd: string;
    transferWindows: {
      summer: { start: string; end: string };
      winter: { start: string; end: string };
    };
  };
  // Pre-season friendly system
  friendlySlots: FriendlySlot[];
  aiFriendlySchedules: Record<string, string[]>;
}

/**
 * Generate a complete new game with event-based calendar
 */
export function generateNewGame(
  managedTeamId: string,
  saveName: string,
  currencySymbol: string = '£',
  season: number = 2025,
  calendarTemplate: SeasonCalendarTemplate = ENGLISH_CALENDAR
): GeneratedGameData {
  // Generate all teams with squads
  const teams: GeneratedTeam[] = TEAM_TEMPLATES.map(template => {
    const squad = generateSquad(template.reputation, template.id, season);
    const youthFacilities = Math.max(5, Math.floor(template.reputation * 0.8));
    const trainingFacilities = Math.max(5, Math.floor(template.reputation * 0.8));
    const staffCosts = Math.round(((youthFacilities + trainingFacilities) * 5000 + squad.length * 8000) / 2);
    const sponsorshipMonthly = Math.round(template.reputation * template.reputation * 10000);
    
    return {
      id: template.id,
      name: template.name,
      short_name: template.short_name,
      stadium: template.stadium,
      division: 1,
      budget: template.budget,
      wage_budget: template.wage_budget,
      formation: '4-4-2',
      primary_color: template.primary_color,
      secondary_color: template.secondary_color,
      squad,
      tactics: { positions: {} },
      reputation: template.reputation,
      fan_base: template.fan_base,
      fan_loyalty: 12 + Math.floor(Math.random() * 6),
      sponsorship_monthly: sponsorshipMonthly,
      ticket_price: 40,
      ticket_price_base: 40,
      stadium_capacity: template.stadium_capacity,
      youth_facilities: youthFacilities,
      training_facilities: trainingFacilities,
      staff_costs_weekly: staffCosts,
    };
  });
  
  const teamBasics = teams.map(t => ({ id: t.id, name: t.name }));
  
  // Generate league standings
  const standings: LeagueStanding[] = teams.map(team => ({
    teamId: team.id,
    teamName: team.name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    form: [],
  }));
  
  // Generate league fixtures with dates
  const leagueId = `premier_league_${season}`;
  const leagueFixtures = generateLeagueFixturesWithDates(teamBasics, season, leagueId, calendarTemplate);
  
  // Generate pre-season friendly slots (user will choose opponents)
  const friendlySlots = generateFriendlySlots(season);
  
  // Generate AI teams' friendly schedules (determines availability)
  const teamsWithRep = teams.map(t => ({ id: t.id, name: t.name, reputation: t.reputation }));
  const aiFriendlySchedules = generateAIFriendlySchedules(teamBasics, managedTeamId, season);
  
  // Initialize cups
  const faCup = initializeFACup(teamBasics, season);
  const leagueCup = initializeLeagueCup(teamBasics, season);
  
  // Generate calendar dates
  const seasonDates = generateSeasonDates(season, calendarTemplate);
  
  // Create events list
  const events: GameEvent[] = [];
  
  // Note: Friendly events are NOT added here - they'll be added when user schedules them
  
  // Add league fixtures as events (only managed team's matches)
  leagueFixtures
    .filter(f => f.homeTeamId === managedTeamId || f.awayTeamId === managedTeamId)
    .forEach(f => {
      events.push(createMatchEvent(
        {
          id: f.id,
          match_date: f.matchDate,
          home_team_id: f.homeTeamId,
          home_team_name: f.homeTeamName,
          away_team_id: f.awayTeamId,
          away_team_name: f.awayTeamName,
          home_score: f.homeScore,
          away_score: f.awayScore,
          played: f.played,
        },
        'league',
        f.round
      ));
    });
  
  // Add cup draw events
  const faCupR3DrawDate = getCupRoundDate('R3', FA_CUP_SCHEDULE, season);
  events.push(createCupDrawEvent(
    addDays(parseDate(faCupR3DrawDate), -7).toISOString().split('T')[0], // Draw 1 week before
    'fa_cup',
    'R3'
  ));
  
  const leagueCupR3DrawDate = getCupRoundDate('R3', LEAGUE_CUP_SCHEDULE, season);
  events.push(createCupDrawEvent(
    addDays(parseDate(leagueCupR3DrawDate), -7).toISOString().split('T')[0],
    'league_cup',
    'R3'
  ));
  
  // Add transfer window events
  events.push(createTransferWindowEvent(seasonDates.summerWindowStart, true));
  events.push(createTransferWindowEvent(seasonDates.summerWindowEnd, false));
  events.push(createTransferWindowEvent(seasonDates.winterWindowStart, true));
  events.push(createTransferWindowEvent(seasonDates.winterWindowEnd, false));
  
  // Generate initial transfer market
  const transferMarket: any[] = [];
  teams.forEach(team => {
    const listableCount = Math.floor(Math.random() * 2);
    const candidates = team.squad
      .filter(p => p.current_ability < 12)
      .sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(listableCount, candidates.length); i++) {
      transferMarket.push({
        id: `listing_s${season}_${candidates[i].id}`,
        player: candidates[i],
        team_id: team.id,
        team_name: team.name,
        asking_price: Math.round(candidates[i].value * (1.1 + Math.random() * 0.4)),
        listed_date: `${season}-07-01`,
      });
    }
  });
  
  return {
    teams,
    competitions: {
      league: {
        id: leagueId,
        name: 'Premier League',
        standings,
        fixtures: leagueFixtures,
      },
      faCup,
      leagueCup,
    },
    events: sortEvents(events),
    transferMarket,
    calendar: {
      currentDate: `${season}-06-14`, // Start at June 14 (transfer window opening)
      seasonStart: seasonDates.seasonStart,
      seasonEnd: seasonDates.seasonEnd,
      transferWindows: {
        summer: {
          start: seasonDates.summerWindowStart,
          end: seasonDates.summerWindowEnd,
        },
        winter: {
          start: seasonDates.winterWindowStart,
          end: seasonDates.winterWindowEnd,
        },
      },
    },
    friendlySlots,
    aiFriendlySchedules,
  };
}

// Export utilities
export { getCompetitionIcon, getCompetitionColor };
