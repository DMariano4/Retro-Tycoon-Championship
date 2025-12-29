import React, { createContext, useContext, useState, ReactNode, Platform } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import Constants from 'expo-constants';

const getBackendUrl = () => {
  const envUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 
                 process.env.EXPO_PUBLIC_BACKEND_URL || '';
  if (typeof window !== 'undefined' && !envUrl) {
    return '';
  }
  return envUrl;
};

const BACKEND_URL = getBackendUrl();
const LOCAL_SAVE_KEY = 'retro_ct_local_save';

export interface Player {
  id: string;
  name: string;
  age: number;
  nationality: string;
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
  contract_end: number;
  morale: number;
  fitness: number;
  form: number;
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
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  played: boolean;
  events: any[];
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
}

interface GameContextType {
  currentSave: GameSave | null;
  isLoading: boolean;
  error: string | null;
  createNewGame: (teamId: string, saveName: string) => Promise<boolean>;
  saveGame: (isCloud?: boolean) => Promise<boolean>;
  loadFromLocal: () => Promise<boolean>;
  loadFromCloud: (saveId: string) => Promise<boolean>;
  getCloudSaves: () => Promise<any[]>;
  getManagedTeam: () => Team | null;
  getLeague: () => League | null;
  updateFormation: (formation: string, positions: Record<string, string>) => void;
  advanceWeek: () => void;
  simulateMatch: (fixtureId: string, speed: number) => Promise<any>;
  makeTransferOffer: (listingId: string, offerAmount: number) => Promise<boolean>;
  listPlayerForSale: (playerId: string, askingPrice: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentSave, setCurrentSave] = useState<GameSave | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sessionToken } = useAuth();

  const createNewGame = async (teamId: string, saveName: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${BACKEND_URL}/api/game/new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {})
        },
        body: JSON.stringify({ team_id: teamId, save_name: saveName })
      });

      if (!response.ok) throw new Error('Failed to create game');

      const gameData = await response.json();
      setCurrentSave(gameData);
      
      // Save locally
      await AsyncStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(gameData));
      
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
    return currentSave.leagues[0];
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

    // Simple match simulation
    const homeStrength = homeTeam.squad.reduce((sum, p) => sum + p.current_ability, 0) / homeTeam.squad.length;
    const awayStrength = awayTeam.squad.reduce((sum, p) => sum + p.current_ability, 0) / awayTeam.squad.length;

    // Add home advantage
    const homeAdvantage = 5;
    const adjustedHome = homeStrength + homeAdvantage;

    // Generate scores based on relative strengths
    const homeGoals = Math.floor(Math.random() * 4 * (adjustedHome / 70));
    const awayGoals = Math.floor(Math.random() * 4 * (awayStrength / 70));

    // Generate match events
    const events = generateMatchEvents(homeTeam, awayTeam, homeGoals, awayGoals);

    // Update fixture
    const updatedLeagues = currentSave.leagues.map(l => {
      if (l.id !== league.id) return l;

      const updatedFixtures = l.fixtures.map(f => {
        if (f.id !== fixtureId) return f;
        return {
          ...f,
          home_score: homeGoals,
          away_score: awayGoals,
          played: true,
          events
        };
      });

      // Update table
      const updatedTable = updateLeagueTable(l.table, fixture.home_team_id, fixture.away_team_id, homeGoals, awayGoals);

      return { ...l, fixtures: updatedFixtures, table: updatedTable };
    });

    setCurrentSave({ ...currentSave, leagues: updatedLeagues });

    return {
      homeScore: homeGoals,
      awayScore: awayGoals,
      events
    };
  };

  const generateMatchEvents = (homeTeam: Team, awayTeam: Team, homeGoals: number, awayGoals: number): any[] => {
    const events: any[] = [];
    const allMinutes = Array.from({ length: 90 }, (_, i) => i + 1);
    
    // Shuffle and pick random minutes for goals
    const shuffled = allMinutes.sort(() => Math.random() - 0.5);
    const goalMinutes = shuffled.slice(0, homeGoals + awayGoals).sort((a, b) => a - b);

    let homeScored = 0;
    let awayScored = 0;

    goalMinutes.forEach(minute => {
      const isHome = homeScored < homeGoals && (awayScored >= awayGoals || Math.random() > 0.5);
      const team = isHome ? homeTeam : awayTeam;
      const attackers = team.squad.filter(p => p.position === 'FWD' || p.position === 'MID');
      const scorer = attackers[Math.floor(Math.random() * attackers.length)];

      events.push({
        type: 'GOAL',
        minute,
        team: team.short_name,
        player: scorer?.name || 'Unknown',
        description: getGoalDescription(scorer?.name || 'Unknown', minute)
      });

      if (isHome) homeScored++;
      else awayScored++;
    });

    // Add some other events (yellow cards, saves, chances)
    const otherEventCount = Math.floor(Math.random() * 8) + 3;
    for (let i = 0; i < otherEventCount; i++) {
      const minute = Math.floor(Math.random() * 90) + 1;
      const isHome = Math.random() > 0.5;
      const team = isHome ? homeTeam : awayTeam;
      const player = team.squad[Math.floor(Math.random() * team.squad.length)];
      
      const eventTypes = ['CHANCE', 'SAVE', 'YELLOW_CARD', 'FOUL'];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      events.push({
        type: eventType,
        minute,
        team: team.short_name,
        player: player?.name || 'Unknown',
        description: getEventDescription(eventType, player?.name || 'Unknown')
      });
    }

    return events.sort((a, b) => a.minute - b.minute);
  };

  const getGoalDescription = (playerName: string, minute: number): string => {
    const descriptions = [
      `${playerName} scores! What a finish!`,
      `GOAL! ${playerName} finds the back of the net!`,
      `${playerName} with a brilliant strike!`,
      `The keeper can only watch as ${playerName} scores!`,
      `${playerName} makes no mistake from close range!`
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  };

  const getEventDescription = (eventType: string, playerName: string): string => {
    switch (eventType) {
      case 'CHANCE':
        return `${playerName} with a good chance but it goes wide!`;
      case 'SAVE':
        return `Great save to deny ${playerName}!`;
      case 'YELLOW_CARD':
        return `Yellow card shown to ${playerName} for a reckless challenge.`;
      case 'FOUL':
        return `Free kick awarded after a foul on ${playerName}.`;
      default:
        return '';
    }
  };

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

  const makeTransferOffer = async (listingId: string, offerAmount: number): Promise<boolean> => {
    if (!currentSave) return false;

    const listing = currentSave.transfer_market.find(l => l.id === listingId);
    if (!listing) return false;

    // Check if we can afford it
    if (offerAmount > currentSave.budget) return false;

    // Simple acceptance logic - if offer is >= 90% of asking price, it's accepted
    const accepted = offerAmount >= listing.asking_price * 0.9;

    if (accepted) {
      // Add player to our team
      const managedTeam = getManagedTeam();
      if (!managedTeam) return false;

      const updatedTeams = currentSave.teams.map(team => {
        if (team.id === currentSave.managed_team_id) {
          return {
            ...team,
            squad: [...team.squad, listing.player]
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
        makeTransferOffer,
        listPlayerForSale
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
