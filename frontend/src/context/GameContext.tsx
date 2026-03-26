import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';
import Constants from 'expo-constants';
import { simulateMatchEngine, MatchResult, MatchStats, simulateMatchLite, MatchInjury } from '../utils/matchEngine';
import { getBackendUrl } from '../utils/api';
import { calculateSponsors, getMonthlySponsorship } from '../utils/sponsors';
import { initializeFFP, updateFFPState, processSeasonEndFFP, getFFPWarningMessage } from '../utils/ffp';
import { getRandomNationality, generatePlayerName } from '../utils/nationalities';

const BACKEND_URL = getBackendUrl();
const LOCAL_SAVE_KEY = 'retro_ct_local_save';

export interface Player {
  id: string;
  name: string;
  age: number;
  nationality: string;
  nationalityFlag?: string;  // Emoji flag for display
  position: string;  // GK, CB, LB, RB, DM, CM, AM, LW, RW, ST
  preferred_positions: string[];
  // Physical attributes
  pace: number;
  strength: number;
  stamina: number;
  agility: number;
  // Mental attributes
  work_rate: number;
  concentration: number;
  decision_making: number;
  composure: number;
  // Technical - GK
  reflexes: number;
  handling: number;
  communication: number;
  // Technical - Defenders
  tackling: number;
  marking: number;
  positioning: number;
  crossing: number;
  // Technical - Midfielders
  passing: number;
  vision: number;
  dribbling: number;
  control: number;
  // Technical - Forwards
  finishing: number;
  off_the_ball: number;
  flair: number;
  heading: number;
  // Overall
  current_ability: number;
  potential_ability: number;
  value: number;
  wage: number;
  contract_end: string;  // Now a date string (YYYY-MM-DD)
  morale: number;
  fitness: number;
  form: number;
  last_contract_renewal?: number;
  // Phase 3: Injury data
  injury?: {
    type: string;       // 'Knock' | 'Muscle Strain' | 'Sprain' | 'Torn Ligament' | 'Broken Bone'
    severity: string;   // 'Minor' | 'Moderate' | 'Serious' | 'Severe' | 'Critical'
    recoveryWeeks: number;
    injuredDate: string; // YYYY-MM-DD
  };
}

export interface Team {
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
  squad: Player[];
  tactics: Record<string, any>;
  // ============================================
  // CLUB PROFILE — Foundation for Financial System
  // ============================================
  // Dynamic (auto-evolve based on performance)
  reputation: number;               // 1-20
  fan_base: number;                 // Total active supporter pool, grows with success
  fan_loyalty: number;              // 1-20
  sponsorship_monthly: number;      // Monthly sponsor income (total of all sponsors)
  // User-defined
  ticket_price: number;             // £ per match ticket
  ticket_price_base: number;        // Reference base for fan_loyalty calculation
  // Upgradeable (spend money to improve)
  stadium_capacity: number;         // Max fans per home match
  youth_facilities: number;         // 1-20
  training_facilities: number;      // 1-20
  // Derived
  staff_costs_weekly: number;       // Weekly overhead
  // ============================================
  // SPONSORSHIP BREAKDOWN
  // ============================================
  sponsors?: {
    kit_manufacturer: { name: string; annual: number; tier: string };
    main_shirt: { name: string; annual: number; tier: string };
    sleeve?: { name: string; annual: number; tier: string };        // Rep 8+ only
    stadium_naming?: { name: string; annual: number; tier: string }; // Rep 12+ only
    training_ground?: { name: string; annual: number; tier: string }; // Rep 6+ only
    official_partners?: { name: string; annual: number; tier: string; count: number }; // Rep 10+ only
    total_annual: number;
  };
  // ============================================
  // FINANCIAL TRACKING — Season P&L
  // ============================================
  finances?: {
    season_income: number;          // Total income this season
    season_expenses: number;        // Total expenses this season
    season_match_revenue: number;   // Match day income
    season_sponsorship: number;     // Sponsorship income
    season_wages: number;           // Wage expenses
    season_staff_costs: number;     // Staff costs
    last_match_attendance?: number; // Last home match attendance
    last_match_revenue?: number;    // Last home match revenue
  };
  // ============================================
  // FINANCIAL FAIR PLAY (FFP)
  // ============================================
  ffp?: {
    status: 'healthy' | 'warning' | 'caution' | 'crisis' | 'insolvency';
    wage_ratio: number;             // Current wage-to-revenue percentage
    consecutive_deficit_seasons: number;  // Seasons with negative budget
    transfer_restriction: number;   // 0 = none, 0.5 = 50% cap, 1 = full embargo
    warnings_issued: number;        // Number of warnings this season
    last_warning_date?: string;     // When last warning was issued
  };
}

export interface TeamStanding {
  team_id: string;
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export interface Fixture {
  id: string;
  week: number;
  match_date: string;  // YYYY-MM-DD
  match_type: string;  // league, friendly, cup
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  played: boolean;
  events: any[];
}

export interface SeasonCalendar {
  season_year: number;
  pre_season_start: string;
  pre_season_end: string;
  season_start: string;
  season_end: string;
  transfer_window_summer_start: string;
  transfer_window_summer_end: string;
  transfer_window_winter_start: string;
  transfer_window_winter_end: string;
  contract_expiry_date: string;
}

export interface League {
  id: string;
  name: string;
  division: number;
  season: number;
  current_week: number;
  teams: string[];
  table: TeamStanding[];
  fixtures: Fixture[];
}

export interface TransferListing {
  id: string;
  player: Player;
  team_id: string;
  team_name: string;
  asking_price: number;
  listed_date: string;
}

export interface GameSave {
  id: string;
  user_id?: string;
  name: string;
  created_at: string;
  updated_at: string;
  game_date: string;
  managed_team_id: string;
  managed_team_name: string;
  season: number;
  leagues: League[];
  teams: Team[];
  transfer_market: TransferListing[];
  budget: number;
  is_cloud: boolean;
  // Season management fields
  calendar?: SeasonCalendar;
  transfer_window_open?: boolean;
  is_pre_season?: boolean;
  // Currency display
  currency_symbol: string;  // £, $ or €
}

interface GameContextType {
  currentSave: GameSave | null;
  isLoading: boolean;
  error: string | null;
  createNewGame: (teamId: string, saveName: string, currencySymbol?: string) => Promise<boolean>;
  saveGame: (isCloud?: boolean) => Promise<boolean>;
  loadFromLocal: () => Promise<boolean>;
  loadFromCloud: (saveId: string) => Promise<boolean>;
  getCloudSaves: () => Promise<any[]>;
  getManagedTeam: () => Team | null;
  getLeague: () => League | null;
  updateFormation: (formation: string, positions: Record<string, any>) => void;
  advanceWeek: () => void;
  simulateMatch: (fixtureId: string, speed: number) => Promise<any>;
  simulateOtherWeekMatches: () => void;
  makeTransferOffer: (listingId: string, offerAmount: number, proposedWage?: number) => Promise<boolean>;
  listPlayerForSale: (playerId: string, askingPrice: number) => void;
  // Season progression
  isSeasonComplete: () => boolean;
  startNewSeason: () => void;
  applyAgeProgression: () => void;
  renewContract: (playerId: string, newWage: number, years: number) => void;
  releasePlayer: (playerId: string) => void;
  retirePlayer: (playerId: string) => void;
  getExpiringContracts: () => Player[];
  getRetirementCandidates: () => { mustRetire: Player[]; userChoice: Player[] };
  // Phase 3: Injuries
  getInjuredPlayers: () => Player[];
  // Financial System
  updateTicketPrice: (newPrice: number) => void;
  upgradeStadium: () => boolean;
  upgradeYouthFacilities: () => boolean;
  upgradeTrainingFacilities: () => boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentSave, setCurrentSave] = useState<GameSave | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sessionToken } = useAuth();

  const createNewGame = async (teamId: string, saveName: string, currencySymbol: string = '£'): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${BACKEND_URL}/api/game/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {})
        },
        body: JSON.stringify({ team_id: teamId, save_name: saveName, currency_symbol: currencySymbol })
      });

      if (!response.ok) throw new Error('Failed to create game');

      const gameData = await response.json();
      
      // Calculate sponsors and initialize FFP for all teams based on their reputation
      const teamsWithSponsors = gameData.teams.map((team: any) => {
        const sponsors = calculateSponsors(team.reputation);
        return {
          ...team,
          sponsors,
          sponsorship_monthly: getMonthlySponsorship(sponsors),
          ffp: initializeFFP(), // Initialize FFP state for all teams
        };
      });
      
      const enrichedGameData = { ...gameData, teams: teamsWithSponsors };
      setCurrentSave(enrichedGameData);
      
      // Save locally
      await AsyncStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(enrichedGameData));
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const saveGame = async (isCloud: boolean = false): Promise<boolean> => {
    if (!currentSave) return false;

    try {
      setIsLoading(true);
      
      // Always save locally first
      const updatedSave = { ...currentSave, updated_at: new Date().toISOString() };
      await AsyncStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(updatedSave));
      setCurrentSave(updatedSave);

      // Save to cloud if requested and authenticated
      if (isCloud && sessionToken) {
        const response = await fetch(`${BACKEND_URL}/api/game/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({ save_data: updatedSave, is_cloud: true })
        });

        if (!response.ok) throw new Error('Cloud save failed');
      }

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromLocal = async (): Promise<boolean> => {
    try {
      const savedData = await AsyncStorage.getItem(LOCAL_SAVE_KEY);
      if (savedData) {
        setCurrentSave(JSON.parse(savedData));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to load local save:', err);
      return false;
    }
  };

  const loadFromCloud = async (saveId: string): Promise<boolean> => {
    if (!sessionToken) return false;

    try {
      setIsLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/game/load/${saveId}`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });

      if (!response.ok) throw new Error('Failed to load save');

      const gameData = await response.json();
      setCurrentSave(gameData);
      await AsyncStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(gameData));
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getCloudSaves = async (): Promise<any[]> => {
    if (!sessionToken) return [];

    try {
      const response = await fetch(`${BACKEND_URL}/api/game/saves`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  };

  const getManagedTeam = (): Team | null => {
    if (!currentSave) return null;
    return currentSave.teams.find(t => t.id === currentSave.managed_team_id) || null;
  };

  const getLeague = (): League | null => {
    if (!currentSave || currentSave.leagues.length === 0) return null;
    // Find the league that contains the managed team (future-proof for multi-division)
    const managedTeamId = currentSave.managed_team_id;
    const teamLeague = currentSave.leagues.find(l => 
      l.table.some((entry: any) => entry.team_id === managedTeamId)
    );
    return teamLeague || currentSave.leagues[0];
  };

  const updateFormation = (formation: string, positions: Record<string, string>) => {
    if (!currentSave) return;

    const updatedTeams = currentSave.teams.map(team => {
      if (team.id === currentSave.managed_team_id) {
        return { ...team, formation, tactics: { ...team.tactics, positions } };
      }
      return team;
    });

    setCurrentSave({ ...currentSave, teams: updatedTeams });
  };

  const advanceWeek = () => {
    if (!currentSave) return;

    const updatedLeagues = currentSave.leagues.map(league => ({
      ...league,
      current_week: league.current_week + 1
    }));

    // Advance game date by 7 days
    const currentDate = new Date(currentSave.game_date);
    currentDate.setDate(currentDate.getDate() + 7);

    setCurrentSave({
      ...currentSave,
      leagues: updatedLeagues,
      game_date: currentDate.toISOString().split('T')[0]
    });
  };

  const simulateMatch = async (fixtureId: string, speed: number): Promise<any> => {
    if (!currentSave) return null;

    const league = getLeague();
    if (!league) return null;

    const fixture = league.fixtures.find(f => f.id === fixtureId);
    if (!fixture || fixture.played) return null;

    const homeTeam = currentSave.teams.find(t => t.id === fixture.home_team_id);
    const awayTeam = currentSave.teams.find(t => t.id === fixture.away_team_id);

    if (!homeTeam || !awayTeam) return null;

    // Use the new CM01/02-inspired match engine
    const matchResult: MatchResult = simulateMatchEngine(homeTeam, awayTeam);

    // Update fixture with match result
    const updatedLeagues = currentSave.leagues.map(l => {
      if (l.id !== league.id) return l;

      const updatedFixtures = l.fixtures.map(f => {
        if (f.id !== fixtureId) return f;
        return {
          ...f,
          home_score: matchResult.homeScore,
          away_score: matchResult.awayScore,
          played: true,
          events: matchResult.events
        };
      });

      // Update table only for league matches (not friendlies)
      const isFriendly = fixture.match_type === 'friendly';
      const updatedTable = isFriendly ? l.table : updateLeagueTable(
        l.table, 
        fixture.home_team_id, 
        fixture.away_team_id, 
        matchResult.homeScore, 
        matchResult.awayScore
      );

      return { ...l, fixtures: updatedFixtures, table: updatedTable };
    });

    // Update player form based on match performance
    let updatedTeams = currentSave.teams.map(team => {
      if (team.id !== homeTeam.id && team.id !== awayTeam.id) return team;
      
      const updatedSquad = team.squad.map(player => {
        const rating = matchResult.playerRatings[player.id];
        if (rating === undefined) return player;
        
        // Adjust form based on match rating (rating 7+ improves form, <6 decreases)
        const formChange = (rating - 6.5) * 0.5;
        const newForm = Math.max(1, Math.min(20, player.form + formChange));
        
        // Fitness decrease after match (1-3) - more realistic fatigue
        const fitnessLoss = 1 + Math.random() * 2;
        const newFitness = Math.max(1, player.fitness - fitnessLoss);

        // Phase 3: Check if player was injured in this match
        const playerInjury = matchResult.injuries?.find(
          (inj: MatchInjury) => inj.playerId === player.id
        );
        
        return {
          ...player,
          form: Math.round(newForm * 10) / 10,
          fitness: Math.round(newFitness * 10) / 10,
          // Apply injury if one occurred
          ...(playerInjury ? {
            injury: {
              type: playerInjury.type,
              severity: playerInjury.severity,
              recoveryWeeks: playerInjury.recoveryWeeks,
              injuredDate: currentSave.game_date,
            }
          } : {}),
        };
      });
      
      return { ...team, squad: updatedSquad };
    });

    // ============================================
    // FAN BASE CHANGE based on match result (only for managed team)
    // Win: +1-2%, Draw: 0%, Loss: -1%
    // ============================================
    const managedTeamId = currentSave.managed_team_id;
    const managedTeamPlayed = homeTeam.id === managedTeamId || awayTeam.id === managedTeamId;
    
    if (managedTeamPlayed) {
      const isHome = homeTeam.id === managedTeamId;
      const managedGoals = isHome ? matchResult.homeScore : matchResult.awayScore;
      const opponentGoals = isHome ? matchResult.awayScore : matchResult.homeScore;
      
      let fanBaseChange = 0;
      if (managedGoals > opponentGoals) {
        // Win: +1-2% fans
        fanBaseChange = 0.01 + Math.random() * 0.01;
      } else if (managedGoals < opponentGoals) {
        // Loss: -1% fans
        fanBaseChange = -0.01;
      }
      // Draw: no change
      
      if (fanBaseChange !== 0) {
        updatedTeams = updatedTeams.map(team => {
          if (team.id !== managedTeamId) return team;
          const newFanBase = Math.max(5000, Math.round(team.fan_base * (1 + fanBaseChange)));
          return { ...team, fan_base: newFanBase };
        });
      }
    }

    setCurrentSave({ ...currentSave, leagues: updatedLeagues, teams: updatedTeams });

    return {
      homeScore: matchResult.homeScore,
      awayScore: matchResult.awayScore,
      events: matchResult.events,
      stats: matchResult.stats,
      playerRatings: matchResult.playerRatings,
      momentum: matchResult.momentum,
      injuries: matchResult.injuries || [],
    };
  };

  // ============================================
  // FINANCIAL SYSTEM - Helper Functions
  // ============================================

  /**
   * Calculate match attendance based on ticket price, fan base, and team form
   * Higher prices = lower attendance, lower prices = higher attendance
   */
  const calculateAttendance = (team: Team, isHomeMatch: boolean): number => {
    if (!isHomeMatch) return 0; // No revenue from away matches
    
    const baseAttendance = Math.min(team.fan_base, team.stadium_capacity);
    
    // Price factor: ticket_price of 40 = 1.0, higher = lower attendance
    // Formula: 1 / (1 + (price - 40) / 100)
    // price 40 = 1.0, price 140 = 0.5, price 1 = 1.39
    const priceFactor = 1 / (1 + (team.ticket_price - 40) / 100);
    
    // Form factor: form 10 = 1.0, form 20 = 1.2, form 1 = 0.82
    const avgForm = team.squad.reduce((sum, p) => sum + p.form, 0) / Math.max(1, team.squad.length);
    const formFactor = 0.8 + (avgForm / 50);
    
    // Random variance ±10%
    const variance = 0.9 + Math.random() * 0.2;
    
    const attendance = Math.floor(baseAttendance * priceFactor * formFactor * variance);
    return Math.max(0, Math.min(attendance, team.stadium_capacity));
  };

  /**
   * Calculate weekly finances for a team
   * Returns income and expenses breakdown
   */
  const calculateWeeklyFinances = (team: Team, hadHomeMatch: boolean, attendance: number): {
    matchRevenue: number;
    sponsorshipIncome: number;
    totalIncome: number;
    wageExpenses: number;
    staffExpenses: number;
    totalExpenses: number;
    netChange: number;
  } => {
    // Income
    const matchRevenue = hadHomeMatch ? attendance * team.ticket_price : 0;
    const sponsorshipIncome = team.sponsorship_monthly / 4; // Weekly portion
    const totalIncome = matchRevenue + sponsorshipIncome;
    
    // Expenses
    const wageExpenses = team.squad.reduce((sum, player) => sum + player.wage, 0);
    const staffExpenses = team.staff_costs_weekly;
    const totalExpenses = wageExpenses + staffExpenses;
    
    return {
      matchRevenue,
      sponsorshipIncome,
      totalIncome,
      wageExpenses,
      staffExpenses,
      totalExpenses,
      netChange: totalIncome - totalExpenses,
    };
  };

  /**
   * Apply weekly financial changes to a team
   */
  const applyWeeklyFinances = (
    team: Team, 
    hadHomeMatch: boolean, 
    attendance: number
  ): Team => {
    const finances = calculateWeeklyFinances(team, hadHomeMatch, attendance);
    
    // Initialize finances if not present
    const currentFinances = team.finances || {
      season_income: 0,
      season_expenses: 0,
      season_match_revenue: 0,
      season_sponsorship: 0,
      season_wages: 0,
      season_staff_costs: 0,
    };
    
    return {
      ...team,
      budget: team.budget + finances.netChange,
      finances: {
        season_income: currentFinances.season_income + finances.totalIncome,
        season_expenses: currentFinances.season_expenses + finances.totalExpenses,
        season_match_revenue: currentFinances.season_match_revenue + finances.matchRevenue,
        season_sponsorship: currentFinances.season_sponsorship + finances.sponsorshipIncome,
        season_wages: currentFinances.season_wages + finances.wageExpenses,
        season_staff_costs: currentFinances.season_staff_costs + finances.staffExpenses,
        last_match_attendance: hadHomeMatch ? attendance : currentFinances.last_match_attendance,
        last_match_revenue: hadHomeMatch ? finances.matchRevenue : currentFinances.last_match_revenue,
      },
    };
  };

  // Simulate all other matches for the current week (AI vs AI) and advance the week
  // Handles ALL leagues, not just the managed team's league
  const simulateOtherWeekMatches = () => {
    if (!currentSave) return;
    if (currentSave.leagues.length === 0) return;

    const managedTeamId = currentSave.managed_team_id;

    let updatedLeagues = [...currentSave.leagues];
    let updatedTeams = [...currentSave.teams];

    // Process every league in the game
    for (const league of currentSave.leagues) {
      // Find all unplayed fixtures for the current week
      // For the managed team's league: skip the managed team's fixture (already played)
      // For other leagues: simulate ALL fixtures
      const otherFixtures = league.fixtures.filter(
        f => f.week === league.current_week && !f.played && 
             f.home_team_id !== managedTeamId && f.away_team_id !== managedTeamId
      );

      for (const fixture of otherFixtures) {
        const homeTeam = updatedTeams.find(t => t.id === fixture.home_team_id);
        const awayTeam = updatedTeams.find(t => t.id === fixture.away_team_id);

        if (!homeTeam || !awayTeam) continue;

        // Use lightweight engine for AI vs AI (no commentary, no momentum, no events)
        const liteResult = simulateMatchLite(homeTeam, awayTeam);

        // Update fixture and table within this league
        updatedLeagues = updatedLeagues.map(l => {
          if (l.id !== league.id) return l;

          const updatedFixtures = l.fixtures.map(f => {
            if (f.id !== fixture.id) return f;
            return {
              ...f,
              home_score: liteResult.homeScore,
              away_score: liteResult.awayScore,
              played: true,
              // Store minimal scorer data instead of full event array
              scorers: liteResult.scorers,
            };
          });

          // Only update league table for league matches, not friendlies
          const isFriendly = fixture.match_type === 'friendly';
          const updatedTable = isFriendly ? l.table : updateLeagueTable(
            l.table,
            fixture.home_team_id,
            fixture.away_team_id,
            liteResult.homeScore,
            liteResult.awayScore
          );

          return { ...l, fixtures: updatedFixtures, table: updatedTable };
        });

        // Update AI team form/fitness + apply injuries
        updatedTeams = updatedTeams.map(team => {
          if (team.id !== homeTeam.id && team.id !== awayTeam.id) return team;

          const updatedSquad = team.squad.map(player => {
            const rating = liteResult.playerRatings[player.id];
            if (rating === undefined) return player;

            const formChange = (rating - 6.5) * 0.5;
            const newForm = Math.max(1, Math.min(20, player.form + formChange));
            // Fitness decrease after match (1-3) - more realistic fatigue
            const fitnessLoss = 1 + Math.random() * 2;
            const newFitness = Math.max(1, player.fitness - fitnessLoss);

            // Phase 3: Check for injuries from lite match
            const playerInjury = liteResult.injuries?.find(
              (inj: MatchInjury) => inj.playerId === player.id
            );

            return {
              ...player,
              form: Math.round(newForm * 10) / 10,
              fitness: Math.round(newFitness * 10) / 10,
              ...(playerInjury ? {
                injury: {
                  type: playerInjury.type,
                  severity: playerInjury.severity,
                  recoveryWeeks: playerInjury.recoveryWeeks,
                  injuredDate: currentSave.game_date,
                }
              } : {}),
            };
          });

          return { ...team, squad: updatedSquad };
        });
      }
    }

    // Phase 3: Weekly fitness recovery + injury recovery for ALL teams
    updatedTeams = updatedTeams.map(team => ({
      ...team,
      squad: team.squad.map(player => {
        let updatedPlayer = { ...player };

        // Fitness recovery - balanced to create meaningful squad rotation
        if (updatedPlayer.injury) {
          // Injured: minimal fitness recovery (0.5-1 per week)
          updatedPlayer.fitness = Math.min(20, updatedPlayer.fitness + 0.5 + Math.random() * 0.5);

          // Decrease recovery weeks
          const newRecoveryWeeks = updatedPlayer.injury.recoveryWeeks - 1;
          if (newRecoveryWeeks <= 0) {
            // Fully recovered
            updatedPlayer.injury = undefined;
            // Boost fitness slightly on recovery
            updatedPlayer.fitness = Math.min(20, updatedPlayer.fitness + 1.5);
          } else {
            updatedPlayer.injury = { ...updatedPlayer.injury, recoveryWeeks: newRecoveryWeeks };
          }
        } else {
          // Healthy: moderate fitness recovery (1.5-3 per week)
          const recovery = 1.5 + Math.random() * 1.5;
          updatedPlayer.fitness = Math.min(20, updatedPlayer.fitness + recovery);
        }

        updatedPlayer.fitness = Math.round(updatedPlayer.fitness * 10) / 10;
        return updatedPlayer;
      })
    }));

    // ============================================
    // WEEKLY FINANCIAL PROCESSING for ALL teams
    // ============================================
    updatedTeams = updatedTeams.map(team => {
      // Find if this team had a home match this week (already played)
      const homeFixture = currentSave.leagues
        .flatMap(l => l.fixtures)
        .find(f => 
          f.home_team_id === team.id && 
          f.played &&
          f.week === currentSave.leagues[0]?.current_week
        );
      
      const hadHomeMatch = !!homeFixture;
      const attendance = hadHomeMatch ? calculateAttendance(team, true) : 0;
      
      return applyWeeklyFinances(team, hadHomeMatch, attendance);
    });

    // ============================================
    // FFP CHECK for managed team only
    // ============================================
    const gameDate = currentSave.game_date;
    updatedTeams = updatedTeams.map(team => {
      if (team.id !== currentSave.managed_team_id) return team;
      
      // Calculate current financials
      const weeklyWages = team.squad.reduce((sum, p) => sum + (p.wage || 0), 0);
      const weeklySponsorship = (team.sponsorship_monthly || 0) / 4;
      const avgMatchRevenue = team.finances?.season_match_revenue 
        ? team.finances.season_match_revenue / Math.max(1, currentSave.leagues[0]?.current_week || 1)
        : 0;
      const weeklyRevenue = weeklySponsorship + avgMatchRevenue;
      
      // Update FFP state
      const previousStatus = team.ffp?.status;
      const updatedFFP = updateFFPState(
        team.ffp,
        weeklyWages,
        weeklyRevenue,
        team.budget,
        gameDate
      );
      
      // Check if FFP status worsened and log warning
      if (updatedFFP.status !== previousStatus && updatedFFP.status !== 'healthy') {
        const warningMsg = getFFPWarningMessage(updatedFFP.status, previousStatus, team.name);
        if (warningMsg) {
          console.log(warningMsg);
          // Could show Alert here, but for now just log
        }
      }
      
      return { ...team, ffp: updatedFFP };
    });

    // Advance week counter only for leagues that still have remaining fixtures
    updatedLeagues = updatedLeagues.map(l => {
      const hasRemainingFixtures = l.fixtures.some(f => !f.played);
      if (!hasRemainingFixtures) return l; // Season complete, don't advance
      return { ...l, current_week: l.current_week + 1 };
    });

    // Advance game date by 7 days
    const currentDate = new Date(currentSave.game_date);
    currentDate.setDate(currentDate.getDate() + 7);

    setCurrentSave({ 
      ...currentSave, 
      leagues: updatedLeagues, 
      teams: updatedTeams,
      game_date: currentDate.toISOString().split('T')[0]
    });
  };

  // Old helper functions removed - now handled by matchEngine.ts

  const updateLeagueTable = (
    table: TeamStanding[],
    homeId: string,
    awayId: string,
    homeGoals: number,
    awayGoals: number
  ): TeamStanding[] => {
    return table.map(standing => {
      if (standing.team_id === homeId) {
        const won = homeGoals > awayGoals ? 1 : 0;
        const drawn = homeGoals === awayGoals ? 1 : 0;
        const lost = homeGoals < awayGoals ? 1 : 0;
        return {
          ...standing,
          played: standing.played + 1,
          won: standing.won + won,
          drawn: standing.drawn + drawn,
          lost: standing.lost + lost,
          goals_for: standing.goals_for + homeGoals,
          goals_against: standing.goals_against + awayGoals,
          goal_difference: standing.goal_difference + homeGoals - awayGoals,
          points: standing.points + (won * 3) + drawn
        };
      }
      if (standing.team_id === awayId) {
        const won = awayGoals > homeGoals ? 1 : 0;
        const drawn = awayGoals === homeGoals ? 1 : 0;
        const lost = awayGoals < homeGoals ? 1 : 0;
        return {
          ...standing,
          played: standing.played + 1,
          won: standing.won + won,
          drawn: standing.drawn + drawn,
          lost: standing.lost + lost,
          goals_for: standing.goals_for + awayGoals,
          goals_against: standing.goals_against + homeGoals,
          goal_difference: standing.goal_difference + awayGoals - homeGoals,
          points: standing.points + (won * 3) + drawn
        };
      }
      return standing;
    }).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
      return b.goals_for - a.goals_for;
    });
  };

  const makeTransferOffer = async (listingId: string, offerAmount: number, proposedWage?: number): Promise<boolean> => {
    if (!currentSave) return false;

    const listing = currentSave.transfer_market.find(l => l.id === listingId);
    if (!listing) return false;

    // Check if we can afford it
    if (offerAmount > currentSave.budget) return false;

    // Simple acceptance logic - if offer is >= 90% of asking price, it's accepted
    const accepted = offerAmount >= listing.asking_price * 0.9;

    if (accepted) {
      // Add player to our team with new wage if provided
      const managedTeam = getManagedTeam();
      if (!managedTeam) return false;

      // Create player with updated wage if a new wage was negotiated
      const transferredPlayer = proposedWage 
        ? { ...listing.player, wage: proposedWage }
        : listing.player;

      const updatedTeams = currentSave.teams.map(team => {
        if (team.id === currentSave.managed_team_id) {
          return {
            ...team,
            squad: [...team.squad, transferredPlayer]
          };
        }
        // Remove from selling team
        if (team.id === listing.team_id) {
          return {
            ...team,
            squad: team.squad.filter(p => p.id !== listing.player.id)
          };
        }
        return team;
      });

      // Update transfer market
      const updatedMarket = currentSave.transfer_market.filter(l => l.id !== listingId);

      setCurrentSave({
        ...currentSave,
        teams: updatedTeams,
        transfer_market: updatedMarket,
        budget: currentSave.budget - offerAmount
      });
    }

    return accepted;
  };

  const listPlayerForSale = (playerId: string, askingPrice: number) => {
    if (!currentSave) return;

    const managedTeam = getManagedTeam();
    if (!managedTeam) return;

    const player = managedTeam.squad.find(p => p.id === playerId);
    if (!player) return;

    const newListing: TransferListing = {
      id: `listing_${Date.now()}`,
      player,
      team_id: managedTeam.id,
      team_name: managedTeam.name,
      asking_price: askingPrice,
      listed_date: currentSave.game_date
    };

    setCurrentSave({
      ...currentSave,
      transfer_market: [...currentSave.transfer_market, newListing]
    });
  };

  // ============================================
  // PHASE 3: INJURY FUNCTIONS
  // ============================================

  /** Get all injured players from managed team */
  const getInjuredPlayers = (): Player[] => {
    if (!currentSave) return [];
    const managedTeam = getManagedTeam();
    if (!managedTeam) return [];
    return managedTeam.squad.filter(p => p.injury && p.injury.recoveryWeeks > 0);
  };

  // ============================================
  // FINANCIAL SYSTEM - User Controls
  // ============================================

  // Upgrade costs
  const STADIUM_UPGRADE_COST = 500000;    // £500k per 1,000 seats
  const STADIUM_UPGRADE_AMOUNT = 1000;    // +1,000 seats per upgrade
  const STADIUM_MAX_CAPACITY = 120000;    // Max 120k capacity
  
  const FACILITY_UPGRADE_COST = 500000;   // £500k per level
  const FACILITY_UPGRADE_AMOUNT = 1;      // +1 rating per upgrade
  const FACILITY_MAX_LEVEL = 20;          // Max 20 rating

  /** Update ticket price (range: 1-999) */
  const updateTicketPrice = (newPrice: number) => {
    if (!currentSave) return;
    
    // Clamp price between 1 and 999
    const clampedPrice = Math.max(1, Math.min(999, Math.round(newPrice)));
    
    const updatedTeams = currentSave.teams.map(team => {
      if (team.id !== currentSave.managed_team_id) return team;
      return { ...team, ticket_price: clampedPrice };
    });
    
    setCurrentSave({ ...currentSave, teams: updatedTeams });
  };

  /** Upgrade stadium capacity (+1,000 seats for £500k) */
  const upgradeStadium = (): boolean => {
    if (!currentSave) return false;
    const managedTeam = getManagedTeam();
    if (!managedTeam) return false;
    
    // Check if already at max capacity
    if (managedTeam.stadium_capacity >= STADIUM_MAX_CAPACITY) return false;
    
    // Check if enough budget
    if (managedTeam.budget < STADIUM_UPGRADE_COST) return false;
    
    const updatedTeams = currentSave.teams.map(team => {
      if (team.id !== currentSave.managed_team_id) return team;
      return {
        ...team,
        budget: team.budget - STADIUM_UPGRADE_COST,
        stadium_capacity: Math.min(STADIUM_MAX_CAPACITY, team.stadium_capacity + STADIUM_UPGRADE_AMOUNT),
      };
    });
    
    // Also update the save's budget field
    const newBudget = managedTeam.budget - STADIUM_UPGRADE_COST;
    setCurrentSave({ ...currentSave, teams: updatedTeams, budget: newBudget });
    return true;
  };

  /** Upgrade youth facilities (+1 rating for £500k) */
  const upgradeYouthFacilities = (): boolean => {
    if (!currentSave) return false;
    const managedTeam = getManagedTeam();
    if (!managedTeam) return false;
    
    // Check if already at max level
    if (managedTeam.youth_facilities >= FACILITY_MAX_LEVEL) return false;
    
    // Check if enough budget
    if (managedTeam.budget < FACILITY_UPGRADE_COST) return false;
    
    const updatedTeams = currentSave.teams.map(team => {
      if (team.id !== currentSave.managed_team_id) return team;
      
      // Recalculate staff costs with new facilities
      const newYouthFacilities = Math.min(FACILITY_MAX_LEVEL, team.youth_facilities + FACILITY_UPGRADE_AMOUNT);
      const newStaffCosts = Math.round(
        ((newYouthFacilities + team.training_facilities) * 5000 + team.squad.length * 8000) / 2
      );
      
      return {
        ...team,
        budget: team.budget - FACILITY_UPGRADE_COST,
        youth_facilities: newYouthFacilities,
        staff_costs_weekly: newStaffCosts,
      };
    });
    
    const newBudget = managedTeam.budget - FACILITY_UPGRADE_COST;
    setCurrentSave({ ...currentSave, teams: updatedTeams, budget: newBudget });
    return true;
  };

  /** Upgrade training facilities (+1 rating for £500k) */
  const upgradeTrainingFacilities = (): boolean => {
    if (!currentSave) return false;
    const managedTeam = getManagedTeam();
    if (!managedTeam) return false;
    
    // Check if already at max level
    if (managedTeam.training_facilities >= FACILITY_MAX_LEVEL) return false;
    
    // Check if enough budget
    if (managedTeam.budget < FACILITY_UPGRADE_COST) return false;
    
    const updatedTeams = currentSave.teams.map(team => {
      if (team.id !== currentSave.managed_team_id) return team;
      
      // Recalculate staff costs with new facilities
      const newTrainingFacilities = Math.min(FACILITY_MAX_LEVEL, team.training_facilities + FACILITY_UPGRADE_AMOUNT);
      const newStaffCosts = Math.round(
        ((team.youth_facilities + newTrainingFacilities) * 5000 + team.squad.length * 8000) / 2
      );
      
      return {
        ...team,
        budget: team.budget - FACILITY_UPGRADE_COST,
        training_facilities: newTrainingFacilities,
        staff_costs_weekly: newStaffCosts,
      };
    });
    
    const newBudget = managedTeam.budget - FACILITY_UPGRADE_COST;
    setCurrentSave({ ...currentSave, teams: updatedTeams, budget: newBudget });
    return true;
  };

  // ============================================
  // SEASON PROGRESSION FUNCTIONS
  // ============================================

  /** Check if the managed team's league season is complete */
  const isSeasonComplete = (): boolean => {
    if (!currentSave) return false;
    const league = getLeague();
    if (!league) return false;
    // Season is complete when all league fixtures are played
    // Handle old fixtures without match_type (default to 'league')
    const leagueFixtures = league.fixtures.filter(f => !f.match_type || f.match_type === 'league');
    return leagueFixtures.length > 0 && leagueFixtures.every(f => f.played);
  };

  /** Get players with expiring contracts (end date <= current season end) */
  const getExpiringContracts = (): Player[] => {
    if (!currentSave) return [];
    const managedTeam = getManagedTeam();
    if (!managedTeam) return [];
    const seasonEnd = `${currentSave.season + 1}-06-30`;
    return managedTeam.squad.filter(p => p.contract_end <= seasonEnd);
  };

  /** Get retirement candidates: AI auto-retire at 40, user choice at 35+ */
  const getRetirementCandidates = (): { mustRetire: Player[]; userChoice: Player[] } => {
    if (!currentSave) return { mustRetire: [], userChoice: [] };
    const managedTeam = getManagedTeam();
    if (!managedTeam) return { mustRetire: [], userChoice: [] };
    
    // For managed team: 35+ is user choice, none auto-retire from user team
    const userChoice = managedTeam.squad.filter(p => p.age >= 35);
    return { mustRetire: [], userChoice };
  };

  /** Renew a player's contract */
  const renewContract = (playerId: string, newWage: number, years: number) => {
    if (!currentSave) return;
    const newEndYear = currentSave.season + 1 + years;
    const newContractEnd = `${newEndYear}-06-30`;

    const updatedTeams = currentSave.teams.map(team => {
      if (team.id !== currentSave.managed_team_id) return team;
      return {
        ...team,
        squad: team.squad.map(p => {
          if (p.id !== playerId) return p;
          return { ...p, wage: newWage, contract_end: newContractEnd, morale: Math.min(20, p.morale + 2), last_contract_renewal: currentSave.season };
        })
      };
    });

    setCurrentSave({ ...currentSave, teams: updatedTeams });
  };

  /** Release a player (becomes free agent) */
  const releasePlayer = (playerId: string) => {
    if (!currentSave) return;
    const managedTeam = getManagedTeam();
    if (!managedTeam) return;
    const player = managedTeam.squad.find(p => p.id === playerId);
    if (!player) return;

    // Remove from squad
    const updatedTeams = currentSave.teams.map(team => {
      if (team.id !== currentSave.managed_team_id) return team;
      return { ...team, squad: team.squad.filter(p => p.id !== playerId) };
    });

    // Add to transfer market as free agent
    const freeAgentListing: TransferListing = {
      id: `free_${playerId}_${Date.now()}`,
      player: { ...player, contract_end: currentSave.game_date },
      team_id: 'free_agent',
      team_name: 'Free Agent',
      asking_price: 0,
      listed_date: currentSave.game_date
    };

    setCurrentSave({
      ...currentSave,
      teams: updatedTeams,
      transfer_market: [...currentSave.transfer_market, freeAgentListing]
    });
  };

  /** Retire a player (removed, replaced by generated regen) */
  const retirePlayer = (playerId: string) => {
    if (!currentSave) return;

    const updatedTeams = currentSave.teams.map(team => {
      const playerIdx = team.squad.findIndex(p => p.id === playerId);
      if (playerIdx === -1) return team;

      const retiringPlayer = team.squad[playerIdx];
      // Generate a young regen for the same position
      const regen = generateRegenPlayer(retiringPlayer.position, team.id);
      const newSquad = [...team.squad];
      newSquad[playerIdx] = regen;

      return { ...team, squad: newSquad };
    });

    setCurrentSave({ ...currentSave, teams: updatedTeams });
  };

  /** Generate a young replacement player with nationality */
  const generateRegenPlayer = (position: string, teamId: string): Player => {
    // Get random nationality from weighted system
    const nationality = getRandomNationality();
    const name = generatePlayerName(nationality);
    
    const age = 17 + Math.floor(Math.random() * 3); // 17-19 years old
    const baseAbility = 6 + Math.floor(Math.random() * 5); // 6-10 (young, low ability)
    const potential = 12 + Math.floor(Math.random() * 8); // 12-19 (high potential)
    
    const randAttr = () => Math.max(1, baseAbility + Math.floor(Math.random() * 4) - 2);
    
    return {
      id: `regen_${teamId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name, 
      age, 
      nationality: nationality.name,
      nationalityFlag: nationality.flag,
      position,
      preferred_positions: [position],
      pace: randAttr(), strength: randAttr(), stamina: randAttr(), agility: randAttr(),
      work_rate: randAttr(), concentration: randAttr(), decision_making: randAttr(), composure: randAttr(),
      reflexes: randAttr(), handling: randAttr(), communication: randAttr(),
      tackling: randAttr(), marking: randAttr(), positioning: randAttr(), crossing: randAttr(),
      passing: randAttr(), vision: randAttr(), dribbling: randAttr(), control: randAttr(),
      finishing: randAttr(), off_the_ball: randAttr(), flair: randAttr(), heading: randAttr(),
      current_ability: baseAbility, potential_ability: potential,
      value: 100000 + Math.floor(Math.random() * 400000),
      wage: 1000 + Math.floor(Math.random() * 3000),
      contract_end: `${(currentSave?.season || 2025) + 4}-06-30`,
      morale: 14, fitness: 18, form: 12,
    };
  };

  /** Apply age-based attribute progression/regression to ALL players */
  const applyAgeProgression = () => {
    if (!currentSave) return;

    const physicalAttrs: (keyof Player)[] = ['pace', 'strength', 'stamina', 'agility'];
    const mentalAttrs: (keyof Player)[] = ['work_rate', 'concentration', 'decision_making', 'composure', 'vision'];
    const technicalAttrs: (keyof Player)[] = ['passing', 'dribbling', 'control', 'finishing', 'off_the_ball', 'flair', 'crossing', 'tackling', 'marking', 'positioning', 'heading', 'reflexes', 'handling', 'communication'];

    const getProgressionRange = (age: number, isPhysical: boolean, isMental: boolean): [number, number] => {
      if (age < 20) return [1, 3];           // High improvement
      if (age <= 24) return [0.5, 2];         // Moderate improvement
      if (age <= 28) return [-0.5, 0.5];      // Peak stability
      if (age <= 31) {
        if (isPhysical) return [-1.5, -0.5];  // Physical starts declining
        if (isMental) return [-0.5, 0.5];     // Mental holds steady
        return [-1, 0];                        // Technical slight decline
      }
      if (age <= 35) {
        if (isPhysical) return [-2.5, -1];    // Noticeable physical decline
        if (isMental) return [-1, 0];          // Mental starts declining
        return [-2, -0.5];                     // Technical decline
      }
      // 36+
      if (isPhysical) return [-3, -1.5];       // Significant physical decline
      if (isMental) return [-1.5, -0.5];       // Mental decline
      return [-2.5, -1];                        // Significant technical decline
    };

    const applyChange = (value: number, range: [number, number]): number => {
      const change = range[0] + Math.random() * (range[1] - range[0]);
      return Math.max(1, Math.min(20, Math.round((value + change) * 10) / 10));
    };

    const updatedTeams = currentSave.teams.map(team => ({
      ...team,
      squad: team.squad.map(player => {
        const newAge = player.age + 1;
        const updated = { ...player, age: newAge };

        // Apply progression based on new age
        for (const attr of physicalAttrs) {
          const range = getProgressionRange(newAge, true, false);
          (updated as any)[attr] = applyChange(player[attr] as number, range);
        }
        for (const attr of mentalAttrs) {
          const range = getProgressionRange(newAge, false, true);
          (updated as any)[attr] = applyChange(player[attr] as number, range);
        }
        for (const attr of technicalAttrs) {
          const range = getProgressionRange(newAge, false, false);
          (updated as any)[attr] = applyChange(player[attr] as number, range);
        }

        // Recalculate current_ability as weighted average
        const allAttrs = [...physicalAttrs, ...mentalAttrs, ...technicalAttrs];
        const avgAttr = allAttrs.reduce((sum, a) => sum + ((updated as any)[a] as number), 0) / allAttrs.length;
        updated.current_ability = Math.round(avgAttr * 10) / 10;

        // Cap by potential (young players can grow to potential, older players are capped)
        if (newAge < 28) {
          updated.current_ability = Math.min(updated.current_ability, updated.potential_ability);
        }

        // Update value based on age and ability
        const ageMultiplier = newAge < 24 ? 1.3 : newAge < 28 ? 1.0 : newAge < 32 ? 0.7 : 0.3;
        updated.value = Math.max(50000, Math.round(updated.current_ability * 500000 * ageMultiplier));

        return updated;
      })
    }));

    setCurrentSave({ ...currentSave, teams: updatedTeams });
  };

  /** Start a new season: generate fixtures, reset table, handle AI retirements/contracts */
  const startNewSeason = () => {
    if (!currentSave) return;

    const newSeason = currentSave.season + 1;
    const managedTeamId = currentSave.managed_team_id;
    let updatedTeams = [...currentSave.teams];

    // 1. AI team retirements (age 40+) and contract expiry
    const seasonEnd = `${newSeason}-06-30`;
    updatedTeams = updatedTeams.map(team => {
      if (team.id === managedTeamId) return team; // User handles their own

      let newSquad = team.squad.map(player => {
        // Auto-retire at 40
        if (player.age >= 40) {
          return generateRegenPlayer(player.position, team.id);
        }
        // Auto-renew if contract expiring and ability > 8
        if (player.contract_end <= seasonEnd) {
          if (player.current_ability >= 8) {
            return { ...player, contract_end: `${newSeason + 2}-06-30`, wage: Math.round(player.wage * 1.1) };
          } else {
            // Release low-ability players, replace with regen
            return generateRegenPlayer(player.position, team.id);
          }
        }
        return player;
      });

      return { ...team, squad: newSquad };
    });

    // ============================================
    // 1.5 REPUTATION & FAN BASE EVOLUTION
    // Based on end-of-season league position
    // ============================================
    updatedTeams = updatedTeams.map(team => {
      // Find the team's final league position
      const teamLeague = currentSave.leagues.find(l => l.teams.includes(team.id));
      if (!teamLeague) return team;
      
      const sortedTable = [...teamLeague.table].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
        return b.goals_for - a.goals_for;
      });
      
      const position = sortedTable.findIndex(s => s.team_id === team.id) + 1;
      const totalTeams = sortedTable.length;
      
      // Calculate reputation change based on position
      let reputationChange = 0;
      if (position === 1) {
        // Won the league (title)
        reputationChange = 1.0;
      } else if (position <= 4) {
        // Top 4 finish
        reputationChange = 0.5;
      } else if (position <= Math.floor(totalTeams * 0.75)) {
        // Mid-table (5th to 75% of teams)
        // Interpolate from +0.4 (5th) to -0.4 (15th in 20-team league)
        const midStart = 5;
        const midEnd = Math.floor(totalTeams * 0.75);
        const midRange = midEnd - midStart;
        const posInMid = position - midStart;
        reputationChange = 0.4 - (posInMid / midRange) * 0.8;
      } else if (position <= totalTeams - 3) {
        // Relegation zone (but not relegated)
        reputationChange = -0.5;
      } else {
        // Relegated (bottom 3)
        reputationChange = -1.0;
      }
      
      // Calculate fan base change
      let fanBaseMultiplier = 1.0;
      if (position === 1) {
        // Won the league - +10% fans
        fanBaseMultiplier = 1.10;
      } else if (position <= 4) {
        // Top 4 - +5% fans
        fanBaseMultiplier = 1.05;
      } else if (position <= Math.floor(totalTeams * 0.5)) {
        // Upper mid-table - +2% fans
        fanBaseMultiplier = 1.02;
      } else if (position <= Math.floor(totalTeams * 0.75)) {
        // Lower mid-table - no change
        fanBaseMultiplier = 1.0;
      } else if (position <= totalTeams - 3) {
        // Relegation battle - -3% fans
        fanBaseMultiplier = 0.97;
      } else {
        // Relegated - -5% fans
        fanBaseMultiplier = 0.95;
      }
      
      // Apply changes
      const newReputation = Math.max(1, Math.min(20, 
        Math.round((team.reputation + reputationChange) * 10) / 10
      ));
      const newFanBase = Math.max(5000, Math.round(team.fan_base * fanBaseMultiplier));
      
      // Recalculate sponsors based on new reputation
      const newSponsors = calculateSponsors(newReputation);
      const newSponsorship = getMonthlySponsorship(newSponsors);
      
      // Reset season finances
      const resetFinances = {
        season_income: 0,
        season_expenses: 0,
        season_match_revenue: 0,
        season_sponsorship: 0,
        season_wages: 0,
        season_staff_costs: 0,
        last_match_attendance: undefined,
        last_match_revenue: undefined,
      };
      
      // Process end-of-season FFP
      const updatedFFP = processSeasonEndFFP(team.ffp, team.budget);
      
      return {
        ...team,
        reputation: newReputation,
        fan_base: newFanBase,
        sponsors: newSponsors,
        sponsorship_monthly: newSponsorship,
        finances: resetFinances,
        ffp: updatedFFP,
      };
    });

    // 2. Generate new fixtures for each league
    const updatedLeagues = currentSave.leagues.map(league => {
      const leagueTeamIds = league.teams;
      const teamNames: Record<string, string> = {};
      updatedTeams.forEach(t => { teamNames[t.id] = t.name; });

      // Generate new round-robin fixtures
      const n = leagueTeamIds.length;
      const teamsList = [...leagueTeamIds];
      if (n % 2 !== 0) teamsList.push('BYE');
      const totalTeams = teamsList.length;

      const newFixtures: Fixture[] = [];
      let week = 1;
      const workingList = [...teamsList];

      for (let round = 0; round < (totalTeams - 1) * 2; round++) {
        const isReturn = round >= (totalTeams - 1);
        const matchDate = new Date(newSeason, 7, 10 + (week - 1) * 7); // Aug 10 + weeks
        const dateStr = matchDate.toISOString().split('T')[0];

        for (let i = 0; i < totalTeams / 2; i++) {
          let home = workingList[i];
          let away = workingList[totalTeams - 1 - i];
          if (home === 'BYE' || away === 'BYE') continue;
          if (isReturn) { [home, away] = [away, home]; }

          newFixtures.push({
            id: `fix_s${newSeason}_${week}_${i}`,
            week,
            match_date: dateStr,
            match_type: 'league',
            home_team_id: home,
            away_team_id: away,
            home_team_name: teamNames[home] || home,
            away_team_name: teamNames[away] || away,
            home_score: null,
            away_score: null,
            played: false,
            events: []
          });
        }
        // Rotate (keep first fixed)
        const last = workingList.pop()!;
        workingList.splice(1, 0, last);
        week++;
      }

      // Generate pre-season friendlies for managed team
      const managedTeam = updatedTeams.find(t => t.id === managedTeamId);
      const friendlies: Fixture[] = [];
      if (managedTeam && league.teams.includes(managedTeamId)) {
        const opponents = updatedTeams.filter(t => t.id !== managedTeamId && league.teams.includes(t.id));
        const shuffled = [...opponents].sort(() => Math.random() - 0.5);
        const dates = [`${newSeason}-07-12`, `${newSeason}-07-19`, `${newSeason}-07-26`, `${newSeason}-08-02`];
        
        for (let i = 0; i < Math.min(4, shuffled.length); i++) {
          const isHome = Math.random() > 0.5;
          friendlies.push({
            id: `friendly_s${newSeason}_${managedTeamId}_${i}`,
            week: 0,
            match_date: dates[i],
            match_type: 'friendly',
            home_team_id: isHome ? managedTeamId : shuffled[i].id,
            away_team_id: isHome ? shuffled[i].id : managedTeamId,
            home_team_name: isHome ? managedTeam.name : shuffled[i].name,
            away_team_name: isHome ? shuffled[i].name : managedTeam.name,
            home_score: null,
            away_score: null,
            played: false,
            events: []
          });
        }
      }

      // Reset table
      const newTable: TeamStanding[] = league.teams.map(teamId => ({
        team_id: teamId,
        team_name: teamNames[teamId] || teamId,
        played: 0, won: 0, drawn: 0, lost: 0,
        goals_for: 0, goals_against: 0, goal_difference: 0, points: 0
      }));

      return {
        ...league,
        season: newSeason,
        current_week: 0, // 0 = pre-season (friendlies)
        table: newTable,
        fixtures: [...friendlies, ...newFixtures]
      };
    });

    // 3. Reset all players' fitness, form, and handle injuries
    // Minor/Moderate/Serious injuries heal during off-season
    // Severe/Critical injuries persist (reduced by ~6 weeks of off-season recovery)
    const OFF_SEASON_RECOVERY_WEEKS = 6;
    updatedTeams = updatedTeams.map(team => ({
      ...team,
      squad: team.squad.map(player => {
        let newInjury = undefined;
        if (player.injury && (player.injury.severity === 'Severe' || player.injury.severity === 'Critical')) {
          const remainingWeeks = player.injury.recoveryWeeks - OFF_SEASON_RECOVERY_WEEKS;
          if (remainingWeeks > 0) {
            newInjury = { ...player.injury, recoveryWeeks: remainingWeeks };
          }
        }
        return {
          ...player,
          fitness: newInjury ? Math.min(12, 8 + Math.random() * 4) : 16 + Math.random() * 4,  // Injured players start less fit
          form: 10 + Math.random() * 4,     // 10-14 (neutral start)
          morale: Math.max(10, player.morale), // Minimum 10 morale
          injury: newInjury,
        };
      })
    }));

    // 4. Refresh transfer market
    const newTransferMarket: TransferListing[] = [];
    updatedTeams.forEach(team => {
      const listableCount = Math.floor(Math.random() * 3);
      const candidates = team.squad.filter(p => p.current_ability < 12).sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(listableCount, candidates.length); i++) {
        newTransferMarket.push({
          id: `listing_s${newSeason}_${candidates[i].id}`,
          player: candidates[i],
          team_id: team.id,
          team_name: team.name,
          asking_price: Math.round(candidates[i].value * (1.1 + Math.random() * 0.4)),
          listed_date: `${newSeason}-07-01`
        });
      }
    });

    setCurrentSave({
      ...currentSave,
      season: newSeason,
      game_date: `${newSeason}-07-01`,
      leagues: updatedLeagues,
      teams: updatedTeams,
      transfer_market: newTransferMarket,
      is_pre_season: true,
      transfer_window_open: true,
    });
  };

  return (
    <GameContext.Provider
      value={{
        currentSave,
        isLoading,
        error,
        createNewGame,
        saveGame,
        loadFromLocal,
        loadFromCloud,
        getCloudSaves,
        getManagedTeam,
        getLeague,
        updateFormation,
        advanceWeek,
        simulateMatch,
        simulateOtherWeekMatches,
        makeTransferOffer,
        listPlayerForSale,
        isSeasonComplete,
        startNewSeason,
        applyAgeProgression,
        renewContract,
        releasePlayer,
        retirePlayer,
        getExpiringContracts,
        getRetirementCandidates,
        getInjuredPlayers,
        // Financial System
        updateTicketPrice,
        upgradeStadium,
        upgradeYouthFacilities,
        upgradeTrainingFacilities,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
