/**
 * Offline Game Generator
 * Generates teams, players, and fixtures entirely client-side
 */

import { getRandomNationality, generatePlayerName } from './nationalities';

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
  { id: 'team_brentford_bees', name: 'West London Bees', short_name: 'WLB', stadium: 'Tech Stadium', primary_color: '#e30613', secondary_color: '#ffffff', reputation: 10, budget: 35000000, wage_budget: 900000, stadium_capacity: 17000, fan_base: 120000 },
  { id: 'team_fulham_cottagers', name: 'Riverside Cottagers', short_name: 'RCO', stadium: 'Craven Cottage', primary_color: '#000000', secondary_color: '#ffffff', reputation: 9, budget: 35000000, wage_budget: 900000, stadium_capacity: 25000, fan_base: 140000 },
  { id: 'team_forest_reds', name: 'Forest Reds', short_name: 'FOR', stadium: 'City Ground', primary_color: '#dd0000', secondary_color: '#ffffff', reputation: 9, budget: 40000000, wage_budget: 950000, stadium_capacity: 30000, fan_base: 180000 },
  
  // Lower Mid-table (Rep 6-8)
  { id: 'team_bournemouth_cherries', name: 'South Coast Cherries', short_name: 'SCC', stadium: 'Vitality Stadium', primary_color: '#da291c', secondary_color: '#000000', reputation: 8, budget: 30000000, wage_budget: 800000, stadium_capacity: 11000, fan_base: 100000 },
  { id: 'team_everton_toffees', name: 'Blue Toffees', short_name: 'BTF', stadium: 'Goodison Park', primary_color: '#003399', secondary_color: '#ffffff', reputation: 8, budget: 35000000, wage_budget: 850000, stadium_capacity: 40000, fan_base: 220000 },
  
  // Relegation Battle (Rep 4-5)
  { id: 'team_leicester_foxes', name: 'East Midlands Foxes', short_name: 'EMF', stadium: 'King Power Arena', primary_color: '#003090', secondary_color: '#fdbe11', reputation: 7, budget: 25000000, wage_budget: 700000, stadium_capacity: 32000, fan_base: 150000 },
  { id: 'team_southampton_saints', name: 'South Coast Saints', short_name: 'SSA', stadium: "St Mary's Stadium", primary_color: '#d71920', secondary_color: '#ffffff', reputation: 6, budget: 20000000, wage_budget: 600000, stadium_capacity: 32000, fan_base: 130000 },
  { id: 'team_ipswich_tractors', name: 'East Anglia Tractors', short_name: 'EAT', stadium: 'Portman Road', primary_color: '#0033a0', secondary_color: '#ffffff', reputation: 5, budget: 15000000, wage_budget: 500000, stadium_capacity: 30000, fan_base: 100000 },
];

// ============================================
// PLAYER GENERATION
// ============================================

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];

// Squad structure: How many of each position per team
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
  // Physical
  pace: number;
  strength: number;
  stamina: number;
  agility: number;
  // Mental
  work_rate: number;
  concentration: number;
  decision_making: number;
  composure: number;
  // GK
  reflexes: number;
  handling: number;
  communication: number;
  // Defenders
  tackling: number;
  marking: number;
  positioning: number;
  crossing: number;
  // Midfielders
  passing: number;
  vision: number;
  dribbling: number;
  control: number;
  // Forwards
  finishing: number;
  off_the_ball: number;
  flair: number;
  heading: number;
  // Overall
  current_ability: number;
  potential_ability: number;
  value: number;
  wage: number;
  contract_end: string;
  morale: number;
  fitness: number;
  form: number;
}

/**
 * Generate a random attribute value within a range
 */
function randAttr(base: number, variance: number = 3): number {
  const value = base + Math.floor(Math.random() * variance * 2) - variance;
  return Math.max(1, Math.min(20, value));
}

/**
 * Generate a single player for a given position and team reputation
 */
export function generatePlayer(
  position: string,
  teamReputation: number,
  teamId: string,
  season: number = 2025
): GeneratedPlayer {
  // Get nationality
  const nationality = getRandomNationality();
  const name = generatePlayerName(nationality);
  
  // Age distribution: younger teams for higher rep (more investment)
  const ageBase = teamReputation >= 15 ? 22 : teamReputation >= 10 ? 24 : 26;
  const age = ageBase + Math.floor(Math.random() * 12) - 4; // ±4 years
  const clampedAge = Math.max(17, Math.min(38, age));
  
  // Base ability scales with team reputation (1-20 scale)
  // Rep 20 = base 14-17, Rep 10 = base 10-13, Rep 5 = base 7-10
  const abilityBase = Math.floor(teamReputation * 0.7) + 3 + Math.floor(Math.random() * 4);
  const baseAbility = Math.max(5, Math.min(18, abilityBase));
  
  // Potential: young players have higher ceiling
  const ageFactor = clampedAge < 23 ? 4 : clampedAge < 27 ? 2 : 0;
  const potential = Math.min(20, baseAbility + ageFactor + Math.floor(Math.random() * 3));
  
  // Generate position-specific attributes
  const isGK = position === 'GK';
  const isDef = ['CB', 'LB', 'RB'].includes(position);
  const isMid = ['DM', 'CM', 'AM'].includes(position);
  const isAtt = ['LW', 'RW', 'ST'].includes(position);
  
  // Physical attributes
  const pace = isGK ? randAttr(baseAbility - 3) : randAttr(baseAbility);
  const strength = isDef ? randAttr(baseAbility + 1) : randAttr(baseAbility - 1);
  const stamina = isMid ? randAttr(baseAbility + 1) : randAttr(baseAbility);
  const agility = isAtt ? randAttr(baseAbility + 1) : randAttr(baseAbility);
  
  // Mental attributes
  const work_rate = isMid ? randAttr(baseAbility + 1) : randAttr(baseAbility);
  const concentration = isDef ? randAttr(baseAbility + 1) : randAttr(baseAbility);
  const decision_making = randAttr(baseAbility);
  const composure = randAttr(baseAbility);
  
  // GK attributes
  const reflexes = isGK ? randAttr(baseAbility + 2) : randAttr(baseAbility - 4);
  const handling = isGK ? randAttr(baseAbility + 2) : randAttr(baseAbility - 5);
  const communication = isGK ? randAttr(baseAbility + 1) : randAttr(baseAbility - 3);
  
  // Defensive attributes
  const tackling = isDef ? randAttr(baseAbility + 2) : isMid ? randAttr(baseAbility) : randAttr(baseAbility - 3);
  const marking = isDef ? randAttr(baseAbility + 2) : randAttr(baseAbility - 2);
  const positioning_attr = isDef || isGK ? randAttr(baseAbility + 1) : randAttr(baseAbility - 1);
  const crossing = ['LB', 'RB', 'LW', 'RW'].includes(position) ? randAttr(baseAbility + 2) : randAttr(baseAbility - 2);
  
  // Midfield attributes
  const passing = isMid ? randAttr(baseAbility + 2) : randAttr(baseAbility);
  const vision = ['AM', 'CM'].includes(position) ? randAttr(baseAbility + 2) : randAttr(baseAbility - 1);
  const dribbling = isAtt || position === 'AM' ? randAttr(baseAbility + 2) : randAttr(baseAbility - 1);
  const control = isMid || isAtt ? randAttr(baseAbility + 1) : randAttr(baseAbility - 1);
  
  // Forward attributes
  const finishing = isAtt ? randAttr(baseAbility + 3) : isMid ? randAttr(baseAbility - 1) : randAttr(baseAbility - 4);
  const off_the_ball = isAtt ? randAttr(baseAbility + 2) : randAttr(baseAbility - 2);
  const flair_attr = isAtt || position === 'AM' ? randAttr(baseAbility + 1) : randAttr(baseAbility - 2);
  const heading = ['CB', 'ST'].includes(position) ? randAttr(baseAbility + 2) : randAttr(baseAbility - 1);
  
  // Calculate value based on ability and age
  const ageMultiplier = clampedAge < 24 ? 1.5 : clampedAge < 28 ? 1.2 : clampedAge < 32 ? 0.8 : 0.4;
  const value = Math.round(baseAbility * 800000 * ageMultiplier * (0.8 + Math.random() * 0.4));
  
  // Calculate wage based on ability
  const wage = Math.round(baseAbility * 2000 * (0.8 + Math.random() * 0.4));
  
  // Contract end: 1-5 years
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
    pace, strength, stamina, agility,
    work_rate, concentration, decision_making, composure,
    reflexes, handling, communication,
    tackling, marking, positioning: positioning_attr, crossing,
    passing, vision, dribbling, control,
    finishing, off_the_ball, flair: flair_attr, heading,
    current_ability: baseAbility,
    potential_ability: potential,
    value,
    wage,
    contract_end,
    morale: 12 + Math.floor(Math.random() * 6), // 12-17
    fitness: 16 + Math.floor(Math.random() * 5), // 16-20
    form: 10 + Math.floor(Math.random() * 6),    // 10-15
  };
}

/**
 * Generate a full squad for a team
 */
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
// FIXTURE GENERATION
// ============================================

export interface GeneratedFixture {
  id: string;
  week: number;
  match_date: string;
  match_type: 'league' | 'friendly';
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  played: boolean;
  events: any[];
}

/**
 * Generate round-robin fixtures for a league season
 */
export function generateLeagueFixtures(
  teams: { id: string; name: string }[],
  season: number
): GeneratedFixture[] {
  const fixtures: GeneratedFixture[] = [];
  const teamsList = [...teams];
  
  // Ensure even number of teams
  if (teamsList.length % 2 !== 0) {
    teamsList.push({ id: 'BYE', name: 'BYE' });
  }
  
  const totalTeams = teamsList.length;
  const totalRounds = (totalTeams - 1) * 2; // Home and away
  
  let week = 1;
  const workingList = [...teamsList];
  
  for (let round = 0; round < totalRounds; round++) {
    const isReturn = round >= (totalTeams - 1);
    const matchDate = new Date(season, 7, 10 + (week - 1) * 7); // Aug 10 + weeks
    const dateStr = matchDate.toISOString().split('T')[0];
    
    for (let i = 0; i < totalTeams / 2; i++) {
      let home = workingList[i];
      let away = workingList[totalTeams - 1 - i];
      
      if (home.id === 'BYE' || away.id === 'BYE') continue;
      if (isReturn) [home, away] = [away, home];
      
      fixtures.push({
        id: `fix_s${season}_w${week}_${i}`,
        week,
        match_date: dateStr,
        match_type: 'league',
        home_team_id: home.id,
        away_team_id: away.id,
        home_team_name: home.name,
        away_team_name: away.name,
        home_score: null,
        away_score: null,
        played: false,
        events: [],
      });
    }
    
    // Rotate teams (keep first fixed)
    const last = workingList.pop()!;
    workingList.splice(1, 0, last);
    week++;
  }
  
  return fixtures;
}

/**
 * Generate pre-season friendlies for the managed team
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
  const dates = [`${season}-07-12`, `${season}-07-19`, `${season}-07-26`, `${season}-08-02`];
  
  for (let i = 0; i < Math.min(4, shuffled.length); i++) {
    const isHome = Math.random() > 0.5;
    friendlies.push({
      id: `friendly_s${season}_${managedTeamId}_${i}`,
      week: 0,
      match_date: dates[i],
      match_type: 'friendly',
      home_team_id: isHome ? managedTeamId : shuffled[i].id,
      away_team_id: isHome ? shuffled[i].id : managedTeamId,
      home_team_name: isHome ? managedTeamName : shuffled[i].name,
      away_team_name: isHome ? shuffled[i].name : managedTeamName,
      home_score: null,
      away_score: null,
      played: false,
      events: [],
    });
  }
  
  return friendlies;
}

// ============================================
// FULL GAME GENERATION
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

/**
 * Generate a complete new game with all teams, players, and fixtures
 */
export function generateNewGame(
  managedTeamId: string,
  saveName: string,
  currencySymbol: string = '£',
  season: number = 2025
): {
  teams: GeneratedTeam[];
  league: {
    id: string;
    name: string;
    division: number;
    season: number;
    current_week: number;
    teams: string[];
    table: any[];
    fixtures: GeneratedFixture[];
  };
  transferMarket: any[];
} {
  // Generate all teams with squads
  const teams: GeneratedTeam[] = TEAM_TEMPLATES.map(template => {
    const squad = generateSquad(template.reputation, template.id, season);
    
    // Calculate staff costs
    const youthFacilities = Math.max(5, Math.floor(template.reputation * 0.8));
    const trainingFacilities = Math.max(5, Math.floor(template.reputation * 0.8));
    const staffCosts = Math.round(
      ((youthFacilities + trainingFacilities) * 5000 + squad.length * 8000) / 2
    );
    
    // Calculate sponsorship (simplified version)
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
  
  // Generate league table
  const table = teams.map(team => ({
    team_id: team.id,
    team_name: team.name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goals_for: 0,
    goals_against: 0,
    goal_difference: 0,
    points: 0,
  }));
  
  // Generate fixtures
  const teamBasics = teams.map(t => ({ id: t.id, name: t.name }));
  const leagueFixtures = generateLeagueFixtures(teamBasics, season);
  
  // Generate pre-season friendlies for managed team
  const managedTeam = teams.find(t => t.id === managedTeamId);
  const friendlies = managedTeam 
    ? generatePreSeasonFriendlies(managedTeamId, managedTeam.name, teamBasics, season)
    : [];
  
  // Generate initial transfer market (a few players from each team)
  const transferMarket: any[] = [];
  teams.forEach(team => {
    const listableCount = Math.floor(Math.random() * 2); // 0-1 players per team
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
    league: {
      id: `league_premier_${season}`,
      name: 'Premier League',
      division: 1,
      season,
      current_week: 0, // 0 = pre-season
      teams: teams.map(t => t.id),
      table,
      fixtures: [...friendlies, ...leagueFixtures],
    },
    transferMarket,
  };
}
