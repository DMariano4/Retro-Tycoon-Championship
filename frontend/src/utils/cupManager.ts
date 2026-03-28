/**
 * Cup Manager - Handles cup competition state and operations
 * 
 * This module manages the lifecycle of cup competitions:
 * - Initializing cups for a new season
 * - Executing draws
 * - Processing match results
 * - Advancing rounds
 */

import { CupTemplate, getCupTemplate } from './cupTemplates';
import { CupRound, CupFixture, generateCupDraw, determineCupWinner, getCupRoundWinners } from './competitions';
import { GameEvent, createMatchEvent, createCupDrawEvent, sortEvents } from './calendar';

// ============================================
// CUP STATE INTERFACE
// ============================================

export interface CupState {
  cupId: string;
  templateId: string;
  nation: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  
  // Current state
  currentRound: string;
  isActive: boolean;
  isEliminated: boolean;        // Has managed team been eliminated?
  eliminatedRound?: string;     // When were they eliminated?
  
  // Fixtures by round
  fixturesByRound: Record<string, CupFixture[]>;
  
  // Teams remaining in competition
  remainingTeams: { id: string; name: string }[];
  
  // Draw history
  drawsCompleted: string[];     // Rounds where draws have been made
  
  // Winners/Results
  winner?: { id: string; name: string };
  runnerUp?: { id: string; name: string };
}

/**
 * Initialize a cup competition for a new season
 */
export function initializeCup(
  templateId: string,
  teams: { id: string; name: string; leagueTier: number }[],
  managedTeamId: string,
  season: number
): CupState | null {
  const template = getCupTemplate(templateId);
  if (!template) return null;
  
  // Determine which teams enter and at which round
  const entryRound = template.entryRound;
  const entryRoundIndex = template.rounds.findIndex(r => r.id === entryRound);
  
  if (entryRoundIndex < 0) return null;
  
  // For now, all teams enter at the entry round
  // In future, could filter by league tier
  const enteringTeams = teams.map(t => ({ id: t.id, name: t.name }));
  
  return {
    cupId: `${templateId}_${season}`,
    templateId,
    nation: template.nation,
    name: template.name,
    shortName: template.shortName,
    icon: template.icon,
    color: template.color,
    currentRound: entryRound,
    isActive: true,
    isEliminated: false,
    fixturesByRound: {},
    remainingTeams: enteringTeams,
    drawsCompleted: [],
  };
}

/**
 * Execute a cup draw for the current round
 */
export function executeCupDraw(
  cupState: CupState,
  matchDate: string,
  managedTeamId: string
): { cupState: CupState; fixtures: CupFixture[]; managedTeamFixture?: CupFixture } {
  const template = getCupTemplate(cupState.templateId);
  if (!template) {
    return { cupState, fixtures: [] };
  }
  
  const currentRound = template.rounds.find(r => r.id === cupState.currentRound);
  if (!currentRound) {
    return { cupState, fixtures: [] };
  }
  
  // Check if draw already done
  if (cupState.drawsCompleted.includes(cupState.currentRound)) {
    return { 
      cupState, 
      fixtures: cupState.fixturesByRound[cupState.currentRound] || [] 
    };
  }
  
  // Generate draw
  const fixtures = generateCupDraw(
    cupState.cupId,
    cupState.currentRound,
    cupState.remainingTeams,
    matchDate,
    template.hasSeeding
  );
  
  // Find managed team's fixture
  const managedTeamFixture = fixtures.find(
    f => f.homeTeamId === managedTeamId || f.awayTeamId === managedTeamId
  );
  
  // Update state
  const updatedState: CupState = {
    ...cupState,
    fixturesByRound: {
      ...cupState.fixturesByRound,
      [cupState.currentRound]: fixtures,
    },
    drawsCompleted: [...cupState.drawsCompleted, cupState.currentRound],
  };
  
  return { 
    cupState: updatedState, 
    fixtures, 
    managedTeamFixture 
  };
}

/**
 * Record a cup match result
 */
export function recordCupResult(
  cupState: CupState,
  fixtureId: string,
  homeScore: number,
  awayScore: number,
  extraTime?: { home: number; away: number },
  penalties?: { home: number; away: number }
): CupState {
  const fixtures = cupState.fixturesByRound[cupState.currentRound] || [];
  const fixtureIndex = fixtures.findIndex(f => f.id === fixtureId);
  
  if (fixtureIndex < 0) return cupState;
  
  const fixture = fixtures[fixtureIndex];
  const updatedFixture: CupFixture = {
    ...fixture,
    homeScore,
    awayScore,
    extraTime,
    penalties,
    played: true,
  };
  
  // Determine winner
  updatedFixture.winnerId = determineCupWinner(updatedFixture) || undefined;
  
  // Update fixtures array
  const updatedFixtures = [...fixtures];
  updatedFixtures[fixtureIndex] = updatedFixture;
  
  return {
    ...cupState,
    fixturesByRound: {
      ...cupState.fixturesByRound,
      [cupState.currentRound]: updatedFixtures,
    },
  };
}

/**
 * Check if current round is complete and advance to next round
 */
export function advanceCupRound(
  cupState: CupState,
  managedTeamId: string
): CupState {
  const template = getCupTemplate(cupState.templateId);
  if (!template) return cupState;
  
  const currentFixtures = cupState.fixturesByRound[cupState.currentRound] || [];
  
  // Check if all fixtures are complete
  const allPlayed = currentFixtures.every(f => f.played);
  if (!allPlayed) return cupState;
  
  // Get winners
  const winners = getCupRoundWinners(currentFixtures);
  
  // Check if managed team is eliminated
  const managedTeamAdvanced = winners.some(w => w.id === managedTeamId);
  const managedTeamWasInRound = currentFixtures.some(
    f => f.homeTeamId === managedTeamId || f.awayTeamId === managedTeamId
  );
  
  const isEliminated = managedTeamWasInRound && !managedTeamAdvanced;
  
  // Find next round
  const currentRoundIndex = template.rounds.findIndex(r => r.id === cupState.currentRound);
  const nextRound = template.rounds[currentRoundIndex + 1];
  
  // If final is complete, determine winner
  if (cupState.currentRound === 'F' && winners.length === 1) {
    const loser = currentFixtures[0].winnerId === currentFixtures[0].homeTeamId
      ? { id: currentFixtures[0].awayTeamId, name: currentFixtures[0].awayTeamName }
      : { id: currentFixtures[0].homeTeamId, name: currentFixtures[0].homeTeamName };
    
    return {
      ...cupState,
      isActive: false,
      isEliminated,
      eliminatedRound: isEliminated ? cupState.currentRound : undefined,
      remainingTeams: winners,
      winner: winners[0],
      runnerUp: loser,
    };
  }
  
  // Advance to next round
  if (nextRound) {
    return {
      ...cupState,
      currentRound: nextRound.id,
      remainingTeams: winners,
      isEliminated,
      eliminatedRound: isEliminated ? cupState.currentRound : undefined,
    };
  }
  
  return cupState;
}

/**
 * Get managed team's cup fixture for current round
 */
export function getManagedTeamCupFixture(
  cupState: CupState,
  managedTeamId: string
): CupFixture | undefined {
  const fixtures = cupState.fixturesByRound[cupState.currentRound] || [];
  return fixtures.find(
    f => f.homeTeamId === managedTeamId || f.awayTeamId === managedTeamId
  );
}

/**
 * Generate cup events for the calendar
 */
export function generateCupEvents(
  cupState: CupState,
  managedTeamId: string,
  season: number
): GameEvent[] {
  const template = getCupTemplate(cupState.templateId);
  if (!template) return [];
  
  const events: GameEvent[] = [];
  
  // Generate draw events for upcoming rounds
  for (const round of template.rounds) {
    if (cupState.drawsCompleted.includes(round.id)) continue;
    
    // Only generate draw event for current round or earlier if not done
    const currentRoundIndex = template.rounds.findIndex(r => r.id === cupState.currentRound);
    const roundIndex = template.rounds.findIndex(r => r.id === round.id);
    
    if (roundIndex < currentRoundIndex) continue;
    if (roundIndex > currentRoundIndex + 1) continue; // Only show next draw
    
    const schedule = template.schedule[round.id];
    if (schedule) {
      const year = schedule.month >= 8 ? season : season + 1;
      const drawDate = `${year}-${String(schedule.month).padStart(2, '0')}-${String(Math.max(1, schedule.week * 7 - 3)).padStart(2, '0')}`;
      
      events.push(createCupDrawEvent(
        cupState.cupId,
        cupState.templateId as any,
        round.id,
        round.name,
        drawDate
      ));
    }
  }
  
  // Generate match events for drawn fixtures
  for (const [round, fixtures] of Object.entries(cupState.fixturesByRound)) {
    for (const fixture of fixtures) {
      // Only show managed team's matches
      if (fixture.homeTeamId !== managedTeamId && fixture.awayTeamId !== managedTeamId) {
        continue;
      }
      
      if (fixture.played) continue;
      
      events.push(createMatchEvent(
        {
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
        cupState.templateId as any,
        round
      ));
    }
  }
  
  return sortEvents(events);
}

/**
 * Get cup progress summary for UI display
 */
export function getCupProgressSummary(cupState: CupState): {
  status: 'active' | 'eliminated' | 'winner' | 'runnerUp';
  currentRound: string;
  nextOpponent?: string;
  teamsRemaining: number;
} {
  if (cupState.winner) {
    return {
      status: cupState.winner.id === cupState.cupId ? 'winner' : 'runnerUp',
      currentRound: 'Final',
      teamsRemaining: 0,
    };
  }
  
  if (cupState.isEliminated) {
    return {
      status: 'eliminated',
      currentRound: cupState.eliminatedRound || cupState.currentRound,
      teamsRemaining: cupState.remainingTeams.length,
    };
  }
  
  return {
    status: 'active',
    currentRound: cupState.currentRound,
    teamsRemaining: cupState.remainingTeams.length,
  };
}
