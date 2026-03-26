/**
 * Competitions System
 * 
 * Manages all competition types: Leagues, Cups, and Continental competitions.
 * Flexible structure to support different national football systems.
 */

import {
  GameEvent,
  CompetitionType,
  SeasonCalendarTemplate,
  ENGLISH_CALENDAR,
  formatDate,
  parseDate,
  addDays,
  getNextMatchDate,
  createMatchEvent,
  createCupDrawEvent,
  sortEvents,
} from './calendar';

// ============================================
// COMPETITION STRUCTURES
// ============================================

export type CompetitionFormat = 'league' | 'knockout' | 'group_knockout';

export interface CupRound {
  id: string;
  name: string;
  shortName: string;       // "R3", "QF", "SF", "F"
  teamCount: number;       // Number of teams entering this round
  twoLegged: boolean;      // Home & Away
  hasReplay: boolean;      // If draw, replay midweek (FA Cup style)
  hasExtraTime: boolean;
  hasPenalties: boolean;
}

export interface Competition {
  id: string;
  name: string;
  shortName: string;
  type: CompetitionType;
  format: CompetitionFormat;
  nation: string;
  tier?: number;                    // League tier (1 = top division)
  teamCount: number;
  
  // For knockout competitions
  rounds?: CupRound[];
  currentRound?: string;
  
  // Scheduling
  matchDays: number[];              // Days of week for fixtures
  
  // Status
  isActive: boolean;
  fixtures: CupFixture[];
  standings?: LeagueStanding[];
}

export interface LeagueStanding {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];                   // Last 5 results: ['W', 'W', 'D', 'L', 'W']
}

export interface CupFixture {
  id: string;
  competitionId: string;
  round: string;
  matchDate: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  extraTime?: { home: number; away: number };
  penalties?: { home: number; away: number };
  played: boolean;
  isReplay: boolean;
  winnerId?: string;
}

// ============================================
// FA CUP CONFIGURATION
// ============================================

export const FA_CUP_ROUNDS: CupRound[] = [
  { id: 'R1', name: 'First Round', shortName: 'R1', teamCount: 80, twoLegged: false, hasReplay: true, hasExtraTime: false, hasPenalties: false },
  { id: 'R2', name: 'Second Round', shortName: 'R2', teamCount: 40, twoLegged: false, hasReplay: true, hasExtraTime: false, hasPenalties: false },
  { id: 'R3', name: 'Third Round', shortName: 'R3', teamCount: 64, twoLegged: false, hasReplay: true, hasExtraTime: false, hasPenalties: false },  // PL teams enter
  { id: 'R4', name: 'Fourth Round', shortName: 'R4', teamCount: 32, twoLegged: false, hasReplay: true, hasExtraTime: false, hasPenalties: false },
  { id: 'R5', name: 'Fifth Round', shortName: 'R5', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  { id: 'QF', name: 'Quarter-Final', shortName: 'QF', teamCount: 8, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  { id: 'SF', name: 'Semi-Final', shortName: 'SF', teamCount: 4, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  { id: 'F', name: 'Final', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
];

// Dates when each FA Cup round typically occurs (month, approximate week)
export const FA_CUP_SCHEDULE: Record<string, { month: number; week: number }> = {
  'R1': { month: 11, week: 1 },    // Early November
  'R2': { month: 12, week: 1 },    // Early December
  'R3': { month: 1, week: 1 },     // First week of January (3rd Round weekend)
  'R4': { month: 1, week: 4 },     // Late January
  'R5': { month: 2, week: 2 },     // Mid February
  'QF': { month: 3, week: 2 },     // Mid March
  'SF': { month: 4, week: 3 },     // Mid-Late April (Wembley)
  'F': { month: 5, week: 3 },      // Mid-Late May (Wembley)
};

// ============================================
// LEAGUE CUP (EFL CUP) CONFIGURATION
// ============================================

export const LEAGUE_CUP_ROUNDS: CupRound[] = [
  { id: 'R1', name: 'First Round', shortName: 'R1', teamCount: 70, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  { id: 'R2', name: 'Second Round', shortName: 'R2', teamCount: 50, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },  // Championship teams enter
  { id: 'R3', name: 'Third Round', shortName: 'R3', teamCount: 32, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },  // PL teams enter
  { id: 'R4', name: 'Fourth Round', shortName: 'R4', teamCount: 16, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  { id: 'QF', name: 'Quarter-Final', shortName: 'QF', teamCount: 8, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  { id: 'SF', name: 'Semi-Final', shortName: 'SF', teamCount: 4, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  { id: 'F', name: 'Final', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
];

export const LEAGUE_CUP_SCHEDULE: Record<string, { month: number; week: number }> = {
  'R1': { month: 8, week: 2 },     // Mid August
  'R2': { month: 8, week: 4 },     // Late August
  'R3': { month: 9, week: 3 },     // Late September
  'R4': { month: 10, week: 4 },    // Late October
  'QF': { month: 12, week: 3 },    // Mid December
  'SF': { month: 1, week: 2 },     // Early-Mid January (2 legs)
  'F': { month: 2, week: 4 },      // Late February (Wembley)
};

// ============================================
// CHAMPIONS LEAGUE CONFIGURATION (Simplified)
// ============================================

export const CHAMPIONS_LEAGUE_ROUNDS: CupRound[] = [
  { id: 'GS', name: 'Group Stage', shortName: 'GS', teamCount: 32, twoLegged: true, hasReplay: false, hasExtraTime: false, hasPenalties: false },
  { id: 'R16', name: 'Round of 16', shortName: 'R16', teamCount: 16, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  { id: 'QF', name: 'Quarter-Final', shortName: 'QF', teamCount: 8, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  { id: 'SF', name: 'Semi-Final', shortName: 'SF', teamCount: 4, twoLegged: true, hasReplay: false, hasExtraTime: true, hasPenalties: true },
  { id: 'F', name: 'Final', shortName: 'F', teamCount: 2, twoLegged: false, hasReplay: false, hasExtraTime: true, hasPenalties: true },
];

// ============================================
// CUP DRAW SYSTEM
// ============================================

export interface CupDraw {
  competitionId: string;
  round: string;
  drawDate: string;
  pots?: string[][];              // For seeded draws
  fixtures: CupFixture[];
  isSeeded: boolean;
}

/**
 * Generate a random cup draw
 */
export function generateCupDraw(
  competitionId: string,
  round: string,
  teams: { id: string; name: string }[],
  matchDate: string,
  isSeeded: boolean = false,
  pots?: string[][]
): CupFixture[] {
  const fixtures: CupFixture[] = [];
  let availableTeams = [...teams];
  
  // Shuffle for random draw
  if (!isSeeded) {
    availableTeams = availableTeams.sort(() => Math.random() - 0.5);
  }
  
  // Create fixtures (pair teams)
  while (availableTeams.length >= 2) {
    const homeTeam = availableTeams.shift()!;
    
    // For seeded draws, try to match from different pots
    let awayTeam: { id: string; name: string };
    if (isSeeded && pots) {
      // Find team from different pot
      const homeTeamPotIndex = pots.findIndex(pot => pot.includes(homeTeam.id));
      const otherPotTeams = availableTeams.filter(t => {
        const teamPotIndex = pots.findIndex(pot => pot.includes(t.id));
        return teamPotIndex !== homeTeamPotIndex;
      });
      
      if (otherPotTeams.length > 0) {
        const randomIndex = Math.floor(Math.random() * otherPotTeams.length);
        awayTeam = otherPotTeams[randomIndex];
        availableTeams = availableTeams.filter(t => t.id !== awayTeam.id);
      } else {
        awayTeam = availableTeams.shift()!;
      }
    } else {
      awayTeam = availableTeams.shift()!;
    }
    
    fixtures.push({
      id: `cup_${competitionId}_${round}_${fixtures.length}`,
      competitionId,
      round,
      matchDate,
      homeTeamId: homeTeam.id,
      homeTeamName: homeTeam.name,
      awayTeamId: awayTeam.id,
      awayTeamName: awayTeam.name,
      homeScore: null,
      awayScore: null,
      played: false,
      isReplay: false,
    });
  }
  
  return fixtures;
}

/**
 * Get winners from a cup round
 */
export function getCupRoundWinners(fixtures: CupFixture[]): { id: string; name: string }[] {
  return fixtures
    .filter(f => f.played && f.winnerId)
    .map(f => {
      const isHomeWinner = f.winnerId === f.homeTeamId;
      return {
        id: f.winnerId!,
        name: isHomeWinner ? f.homeTeamName : f.awayTeamName,
      };
    });
}

/**
 * Determine winner of a cup fixture (handles extra time and penalties)
 */
export function determineCupWinner(fixture: CupFixture): string | null {
  if (!fixture.played) return null;
  
  let homeTotal = fixture.homeScore || 0;
  let awayTotal = fixture.awayScore || 0;
  
  // Add extra time if exists
  if (fixture.extraTime) {
    homeTotal += fixture.extraTime.home;
    awayTotal += fixture.extraTime.away;
  }
  
  if (homeTotal > awayTotal) return fixture.homeTeamId;
  if (awayTotal > homeTotal) return fixture.awayTeamId;
  
  // Still tied? Check penalties
  if (fixture.penalties) {
    if (fixture.penalties.home > fixture.penalties.away) return fixture.homeTeamId;
    if (fixture.penalties.away > fixture.penalties.home) return fixture.awayTeamId;
  }
  
  // Draw (for rounds with replays)
  return null;
}

// ============================================
// COMPETITION FACTORY
// ============================================

/**
 * Create a new league competition
 */
export function createLeagueCompetition(
  id: string,
  name: string,
  shortName: string,
  nation: string,
  tier: number,
  teams: { id: string; name: string }[],
  matchDays: number[] = [6, 0]
): Competition {
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
  
  return {
    id,
    name,
    shortName,
    type: 'league',
    format: 'league',
    nation,
    tier,
    teamCount: teams.length,
    matchDays,
    isActive: true,
    fixtures: [],
    standings,
  };
}

/**
 * Create a new cup competition
 */
export function createCupCompetition(
  id: string,
  name: string,
  shortName: string,
  type: CompetitionType,
  nation: string,
  rounds: CupRound[],
  matchDays: number[]
): Competition {
  return {
    id,
    name,
    shortName,
    type,
    format: 'knockout',
    nation,
    teamCount: rounds[0]?.teamCount || 0,
    rounds,
    currentRound: rounds[0]?.id,
    matchDays,
    isActive: true,
    fixtures: [],
  };
}

// ============================================
// FIXTURE GENERATION
// ============================================

/**
 * Generate round-robin league fixtures with actual dates
 */
export function generateLeagueFixtures(
  competition: Competition,
  teams: { id: string; name: string }[],
  seasonStartDate: string,
  template: SeasonCalendarTemplate,
  existingEventDates: string[] = []
): CupFixture[] {
  const fixtures: CupFixture[] = [];
  const teamsList = [...teams];
  
  // Ensure even number of teams
  if (teamsList.length % 2 !== 0) {
    teamsList.push({ id: 'BYE', name: 'BYE' });
  }
  
  const totalTeams = teamsList.length;
  const totalRounds = (totalTeams - 1) * 2; // Home and away
  const matchesPerRound = totalTeams / 2;
  
  let currentDate = parseDate(seasonStartDate);
  const usedDates: string[] = [...existingEventDates];
  
  for (let round = 0; round < totalRounds; round++) {
    const isReturn = round >= (totalTeams - 1);
    
    // Find next available match day
    currentDate = getNextMatchDate(currentDate, template.leagueMatchDays, usedDates);
    const dateStr = formatDate(currentDate);
    
    // Generate matches for this round
    for (let i = 0; i < matchesPerRound; i++) {
      const homeIdx = i;
      const awayIdx = totalTeams - 1 - i;
      
      let home = teamsList[homeIdx];
      let away = teamsList[awayIdx];
      
      // Skip BYE matches
      if (home.id === 'BYE' || away.id === 'BYE') continue;
      
      // Swap for return leg
      if (isReturn) [home, away] = [away, home];
      
      fixtures.push({
        id: `league_${competition.id}_r${round + 1}_m${i}`,
        competitionId: competition.id,
        round: `Week ${round + 1}`,
        matchDate: dateStr,
        homeTeamId: home.id,
        homeTeamName: home.name,
        awayTeamId: away.id,
        awayTeamName: away.name,
        homeScore: null,
        awayScore: null,
        played: false,
        isReplay: false,
      });
    }
    
    usedDates.push(dateStr);
    
    // Rotate teams (keep first fixed)
    const last = teamsList.pop()!;
    teamsList.splice(1, 0, last);
    
    // Add gap for international breaks, Christmas, etc.
    // Skip a week every 6-8 rounds for realism
    if (round > 0 && round % 7 === 0) {
      currentDate = addDays(currentDate, 7);
    }
  }
  
  return fixtures;
}

/**
 * Get the approximate date for a cup round
 */
export function getCupRoundDate(
  round: string,
  schedule: Record<string, { month: number; week: number }>,
  season: number
): string {
  const roundSchedule = schedule[round];
  if (!roundSchedule) return `${season}-01-01`; // Fallback
  
  // Calculate year (rounds in Jan+ are next year)
  const year = roundSchedule.month >= 8 ? season : season + 1;
  
  // Calculate approximate day
  const day = Math.min(28, roundSchedule.week * 7);
  
  return `${year}-${String(roundSchedule.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ============================================
// EVENT GENERATION FROM COMPETITIONS
// ============================================

/**
 * Generate all events for a season from competitions
 */
export function generateSeasonEvents(
  competitions: Competition[],
  managedTeamId: string,
  season: number,
  template: SeasonCalendarTemplate
): GameEvent[] {
  const events: GameEvent[] = [];
  
  for (const comp of competitions) {
    // Generate match events
    for (const fixture of comp.fixtures) {
      // For cups, only include managed team's matches
      if (comp.format === 'knockout') {
        if (fixture.homeTeamId !== managedTeamId && fixture.awayTeamId !== managedTeamId) {
          continue;
        }
      }
      
      events.push(createMatchEvent(
        {
          ...fixture,
          id: fixture.id,
          match_date: fixture.matchDate,
          home_team_id: fixture.homeTeamId,
          home_team_name: fixture.homeTeamName,
          away_team_id: fixture.awayTeamId,
          away_team_name: fixture.awayTeamName,
          home_score: fixture.homeScore,
          away_score: fixture.awayScore,
          played: fixture.played,
        },
        comp.type,
        fixture.round
      ));
    }
  }
  
  return sortEvents(events);
}

// ============================================
// COMPETITION HELPERS
// ============================================

/**
 * Get competition icon
 */
export function getCompetitionIcon(type: CompetitionType): string {
  switch (type) {
    case 'league': return '⚽';
    case 'fa_cup': return '🏆';
    case 'league_cup': return '🏅';
    case 'champions_league': return '🌟';
    case 'europa_league': return '🔶';
    case 'conference_league': return '🔷';
    case 'friendly': return '🤝';
    default: return '⚽';
  }
}

/**
 * Get competition color
 */
export function getCompetitionColor(type: CompetitionType): string {
  switch (type) {
    case 'league': return '#00ff88';
    case 'fa_cup': return '#ff6b6b';
    case 'league_cup': return '#4ecdc4';
    case 'champions_league': return '#ffd700';
    case 'europa_league': return '#ff8c00';
    case 'conference_league': return '#32cd32';
    case 'friendly': return '#6a8aaa';
    default: return '#ffffff';
  }
}

/**
 * Get round display name
 */
export function getRoundDisplayName(round: string, competition: Competition): string {
  if (competition.format === 'league') {
    return round; // "Week 1", "Week 2", etc.
  }
  
  // Find round in competition rounds
  const roundInfo = competition.rounds?.find(r => r.id === round || r.shortName === round);
  return roundInfo?.name || round;
}
