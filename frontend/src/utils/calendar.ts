/**
 * Calendar & Event System
 * 
 * Core date-based progression system for managing multiple competitions.
 * Replaces the week-based system with actual calendar dates.
 */

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse YYYY-MM-DD to Date
 */
export function parseDate(dateStr: string): Date {
  // Defensive check for invalid input
  if (!dateStr || typeof dateStr !== 'string') {
    console.warn('parseDate: Invalid dateStr received:', dateStr);
    return new Date(); // Return current date as fallback
  }
  
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    console.warn('parseDate: Invalid date format:', dateStr);
    return new Date();
  }
  
  const [year, month, day] = parts.map(Number);
  
  // Validate the numbers
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    console.warn('parseDate: Invalid date numbers:', { year, month, day, dateStr });
    return new Date();
  }
  
  // Validate ranges
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    console.warn('parseDate: Date values out of range:', { year, month, day, dateStr });
    return new Date();
  }
  
  return new Date(year, month - 1, day);
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * Get next occurrence of a specific day of week
 */
export function getNextDayOfWeek(fromDate: Date, targetDay: number): Date {
  const result = new Date(fromDate);
  const currentDay = result.getDay();
  const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
  result.setDate(result.getDate() + daysUntil);
  return result;
}

/**
 * Format date for display (e.g., "Sat, Aug 17")
 */
export function formatDateDisplay(dateStr: string): string {
  // Defensive check
  if (!dateStr || typeof dateStr !== 'string') {
    return 'TBD';
  }
  
  const date = parseDate(dateStr);
  
  // Check for invalid date
  if (isNaN(date.getTime())) {
    return 'TBD';
  }
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Format date for full display (e.g., "Saturday, August 17, 2025")
 */
export function formatDateFull(dateStr: string): string {
  const date = parseDate(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// ============================================
// EVENT TYPES
// ============================================

export type EventType = 
  | 'match'
  | 'cup_draw'
  | 'transfer_window_open'
  | 'transfer_window_close'
  | 'season_end'
  | 'season_start'
  | 'contract_expiry';

export type CompetitionType = 
  | 'league'
  | 'fa_cup'
  | 'league_cup'
  | 'champions_league'
  | 'europa_league'
  | 'conference_league'
  | 'friendly';

// ============================================
// GAME EVENT
// ============================================

export interface GameEvent {
  id: string;
  date: string;                    // YYYY-MM-DD
  type: EventType;
  competition?: CompetitionType;
  competitionRound?: string;       // "R3", "QF", "SF", "F" for cups
  priority: number;                // Lower = processed first on same day
  title: string;                   // Display title
  description?: string;            // Additional info
  data?: any;                      // Match fixture, draw info, etc.
  completed: boolean;
  result?: any;                    // Match result, draw result, etc.
}

// ============================================
// SEASON CALENDAR TEMPLATE
// ============================================

export interface SeasonCalendarTemplate {
  nation: string;                  // 'ENG', 'ESP', 'GER', etc.
  
  // Season boundaries
  seasonStart: { month: number; day: number };    // e.g., { month: 8, day: 1 } for August 1
  seasonEnd: { month: number; day: number };      // e.g., { month: 5, day: 31 } for May 31
  
  // League match days (0 = Sunday, 6 = Saturday)
  leagueMatchDays: number[];       // [6, 0] for Sat/Sun
  
  // Cup match days
  faCupMatchDays: number[];        // [6] for Saturday
  leagueCupMatchDays: number[];    // [2, 3] for Tue/Wed
  europeanMatchDays: number[];     // [2, 3] for Tue/Wed
  
  // Special dates (month, day)
  specialFixtures?: {
    boxingDay?: boolean;           // Dec 26
    newYearsDay?: boolean;         // Jan 1
  };
  
  // Transfer windows
  summerWindowStart: { month: number; day: number };
  summerWindowEnd: { month: number; day: number };
  winterWindowStart: { month: number; day: number };
  winterWindowEnd: { month: number; day: number };
}

// ============================================
// ENGLISH CALENDAR TEMPLATE
// ============================================

export const ENGLISH_CALENDAR: SeasonCalendarTemplate = {
  nation: 'ENG',
  seasonStart: { month: 8, day: 10 },      // August 10
  seasonEnd: { month: 5, day: 25 },        // May 25
  leagueMatchDays: [6, 0],                  // Saturday, Sunday
  faCupMatchDays: [6],                      // Saturday
  leagueCupMatchDays: [2, 3],               // Tuesday, Wednesday
  europeanMatchDays: [2, 3],                // Tuesday, Wednesday
  specialFixtures: {
    boxingDay: true,
    newYearsDay: true,
  },
  summerWindowStart: { month: 6, day: 14 },
  summerWindowEnd: { month: 8, day: 30 },
  winterWindowStart: { month: 1, day: 1 },
  winterWindowEnd: { month: 2, day: 1 },
};

// ============================================
// OTHER NATION TEMPLATES (Future)
// ============================================

export const SPANISH_CALENDAR: SeasonCalendarTemplate = {
  nation: 'ESP',
  seasonStart: { month: 8, day: 15 },
  seasonEnd: { month: 5, day: 30 },
  leagueMatchDays: [6, 0],
  faCupMatchDays: [3],                      // Copa del Rey midweek
  leagueCupMatchDays: [],                   // No League Cup in Spain
  europeanMatchDays: [2, 3],
  summerWindowStart: { month: 7, day: 1 },
  summerWindowEnd: { month: 8, day: 31 },
  winterWindowStart: { month: 1, day: 1 },
  winterWindowEnd: { month: 1, day: 31 },
};

export const GERMAN_CALENDAR: SeasonCalendarTemplate = {
  nation: 'GER',
  seasonStart: { month: 8, day: 18 },
  seasonEnd: { month: 5, day: 18 },
  leagueMatchDays: [5, 6, 0],               // Friday, Saturday, Sunday
  faCupMatchDays: [2, 3],                   // DFB-Pokal midweek
  leagueCupMatchDays: [],                   // No League Cup in Germany
  europeanMatchDays: [2, 3],
  summerWindowStart: { month: 7, day: 1 },
  summerWindowEnd: { month: 8, day: 31 },
  winterWindowStart: { month: 1, day: 1 },
  winterWindowEnd: { month: 1, day: 31 },
};

// ============================================
// CALENDAR MANAGER
// ============================================

/**
 * Generate season dates based on template
 */
export function generateSeasonDates(
  season: number,
  template: SeasonCalendarTemplate
): {
  seasonStart: string;
  seasonEnd: string;
  summerWindowStart: string;
  summerWindowEnd: string;
  winterWindowStart: string;
  winterWindowEnd: string;
} {
  return {
    seasonStart: `${season}-${String(template.seasonStart.month).padStart(2, '0')}-${String(template.seasonStart.day).padStart(2, '0')}`,
    seasonEnd: `${season + 1}-${String(template.seasonEnd.month).padStart(2, '0')}-${String(template.seasonEnd.day).padStart(2, '0')}`,
    summerWindowStart: `${season}-${String(template.summerWindowStart.month).padStart(2, '0')}-${String(template.summerWindowStart.day).padStart(2, '0')}`,
    summerWindowEnd: `${season}-${String(template.summerWindowEnd.month).padStart(2, '0')}-${String(template.summerWindowEnd.day).padStart(2, '0')}`,
    winterWindowStart: `${season + 1}-${String(template.winterWindowStart.month).padStart(2, '0')}-${String(template.winterWindowStart.day).padStart(2, '0')}`,
    winterWindowEnd: `${season + 1}-${String(template.winterWindowEnd.month).padStart(2, '0')}-${String(template.winterWindowEnd.day).padStart(2, '0')}`,
  };
}

/**
 * Get the next available match date for a competition
 */
export function getNextMatchDate(
  fromDate: Date,
  matchDays: number[],
  avoidDates: string[] = []
): Date {
  let candidate = addDays(fromDate, 1);
  let attempts = 0;
  const maxAttempts = 60; // Prevent infinite loop
  
  while (attempts < maxAttempts) {
    const dayOfWeek = getDayOfWeek(candidate);
    const dateStr = formatDate(candidate);
    
    if (matchDays.includes(dayOfWeek) && !avoidDates.includes(dateStr)) {
      return candidate;
    }
    
    candidate = addDays(candidate, 1);
    attempts++;
  }
  
  // Fallback: just return next day if no valid day found
  return addDays(fromDate, 1);
}

/**
 * Check if two dates conflict (same day or within X days)
 */
export function datesConflict(date1: string, date2: string, minDaysBetween: number = 2): boolean {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays < minDaysBetween;
}

/**
 * Sort events by date and priority
 */
export function sortEvents(events: GameEvent[]): GameEvent[] {
  return [...events].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.priority - b.priority;
  });
}

/**
 * Get the next uncompleted event
 */
export function getNextEvent(events: GameEvent[]): GameEvent | null {
  const sorted = sortEvents(events);
  return sorted.find(e => !e.completed) || null;
}

/**
 * Get all events for a specific date
 */
export function getEventsForDate(events: GameEvent[], date: string): GameEvent[] {
  return sortEvents(events.filter(e => e.date === date));
}

/**
 * Get upcoming events (next N uncompleted events)
 */
export function getUpcomingEvents(events: GameEvent[], count: number = 5): GameEvent[] {
  const sorted = sortEvents(events);
  return sorted.filter(e => !e.completed).slice(0, count);
}

/**
 * Get events for managed team only
 */
export function getTeamEvents(events: GameEvent[], teamId: string): GameEvent[] {
  return events.filter(e => {
    if (e.type === 'match' && e.data) {
      return e.data.home_team_id === teamId || e.data.away_team_id === teamId;
    }
    // Non-match events are always relevant
    return e.type !== 'match';
  });
}

/**
 * Create a match event
 */
export function createMatchEvent(
  fixture: any,
  competition: CompetitionType,
  round?: string
): GameEvent {
  const isLeague = competition === 'league';
  const competitionNames: Record<CompetitionType, string> = {
    league: 'League',
    fa_cup: 'FA Cup',
    league_cup: 'League Cup',
    champions_league: 'Champions League',
    europa_league: 'Europa League',
    conference_league: 'Conference League',
    friendly: 'Friendly',
  };
  
  const roundDisplay = round ? ` ${round}` : '';
  
  return {
    id: `event_match_${fixture.id}`,
    date: fixture.match_date,
    type: 'match',
    competition,
    competitionRound: round,
    priority: isLeague ? 10 : 5, // Cups have higher priority on same day
    title: `${competitionNames[competition]}${roundDisplay}`,
    description: `${fixture.home_team_name} vs ${fixture.away_team_name}`,
    data: fixture,
    completed: fixture.played || false,
    result: fixture.played ? { home: fixture.home_score, away: fixture.away_score } : undefined,
  };
}

/**
 * Create a cup draw event
 */
export function createCupDrawEvent(
  date: string,
  competition: CompetitionType,
  round: string
): GameEvent {
  const competitionNames: Record<CompetitionType, string> = {
    league: 'League',
    fa_cup: 'FA Cup',
    league_cup: 'League Cup',
    champions_league: 'Champions League',
    europa_league: 'Europa League',
    conference_league: 'Conference League',
    friendly: 'Friendly',
  };
  
  return {
    id: `event_draw_${competition}_${round}_${date}`,
    date,
    type: 'cup_draw',
    competition,
    competitionRound: round,
    priority: 1, // Draws happen before matches
    title: `${competitionNames[competition]} Draw`,
    description: `${round} Draw`,
    completed: false,
  };
}

/**
 * Create a transfer window event
 */
export function createTransferWindowEvent(
  date: string,
  isOpening: boolean
): GameEvent {
  return {
    id: `event_transfer_${isOpening ? 'open' : 'close'}_${date}`,
    date,
    type: isOpening ? 'transfer_window_open' : 'transfer_window_close',
    priority: 0, // System events have highest priority
    title: isOpening ? 'Transfer Window Opens' : 'Transfer Window Closes',
    description: isOpening ? 'You can now buy and sell players' : 'Transfer deadline day!',
    completed: false,
  };
}
