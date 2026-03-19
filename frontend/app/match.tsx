import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame, Player, Team } from '../src/context/GameContext';

const { width } = Dimensions.get('window');

type MatchState = 'pre' | 'live' | 'paused' | 'post';
type MatchTab = 'pitch' | 'commentary' | 'stats';

// Formation requirements - what positions each formation needs
const FORMATION_REQUIREMENTS: Record<string, Record<string, number>> = {
  '4-4-2': { GK: 1, CB: 2, LB: 1, RB: 1, LM: 1, CM: 2, RM: 1, ST: 2 },
  '4-3-3': { GK: 1, CB: 2, LB: 1, RB: 1, CM: 3, LW: 1, ST: 1, RW: 1 },
  '3-5-2': { GK: 1, CB: 3, LM: 1, CM: 3, RM: 1, ST: 2 },
  '4-5-1': { GK: 1, CB: 2, LB: 1, RB: 1, LM: 1, CM: 2, RM: 1, AM: 1, ST: 1 },
  '5-3-2': { GK: 1, CB: 3, LB: 1, RB: 1, CM: 3, ST: 2 },
  '4-2-3-1': { GK: 1, CB: 2, LB: 1, RB: 1, DM: 2, LW: 1, AM: 1, RW: 1, ST: 1 },
  '3-4-3': { GK: 1, CB: 3, LM: 1, CM: 2, RM: 1, LW: 1, ST: 1, RW: 1 },
  '5-4-1': { GK: 1, CB: 3, LB: 1, RB: 1, LM: 1, CM: 2, RM: 1, ST: 1 },
};

// Position compatibility - which positions can fill which slots
const POSITION_COMPATIBILITY: Record<string, string[]> = {
  GK: ['GK'],
  CB: ['CB'],
  LB: ['LB', 'LWB', 'CB'],
  RB: ['RB', 'RWB', 'CB'],
  LWB: ['LWB', 'LB', 'LM'],
  RWB: ['RWB', 'RB', 'RM'],
  DM: ['DM', 'CM'],
  CM: ['CM', 'DM', 'AM'],
  LM: ['LM', 'LW', 'LB'],
  RM: ['RM', 'RW', 'RB'],
  AM: ['AM', 'CM', 'LW', 'RW'],
  LW: ['LW', 'LM', 'AM', 'ST'],
  RW: ['RW', 'RM', 'AM', 'ST'],
  ST: ['ST', 'AM', 'LW', 'RW'],
};

/**
 * Select best starting XI based on formation requirements
 * Prioritizes natural positions before using backup options
 */
function selectStartingXI(squad: Player[], formation: string): Player[] {
  const requirements = FORMATION_REQUIREMENTS[formation] || FORMATION_REQUIREMENTS['4-4-2'];
  const selected: Player[] = [];
  const usedPlayerIds = new Set<string>();
  
  // Sort squad by ability (best players first for each selection)
  const sortedSquad = [...squad].sort((a, b) => b.current_ability - a.current_ability);
  
  // Two-pass approach: First fill with natural positions, then with backups
  const positionsToFill: { position: string; count: number }[] = [];
  for (const [pos, count] of Object.entries(requirements)) {
    positionsToFill.push({ position: pos, count });
  }
  
  // Pass 1: Try to fill each position with natural fit only
  for (const { position: requiredPosition, count } of positionsToFill) {
    const naturalPositions = [requiredPosition]; // Only the exact position
    
    for (let i = 0; i < count; i++) {
      const bestPlayer = sortedSquad.find(player => 
        !usedPlayerIds.has(player.id) && 
        naturalPositions.includes(player.position)
      );
      
      if (bestPlayer) {
        selected.push(bestPlayer);
        usedPlayerIds.add(bestPlayer.id);
      }
    }
  }
  
  // Pass 2: Fill remaining slots with compatible positions
  const remainingSlots = 11 - selected.length;
  if (remainingSlots > 0) {
    // Calculate which positions still need filling
    const filledCounts: Record<string, number> = {};
    selected.forEach(p => {
      // Map player position to formation slot
      for (const { position } of positionsToFill) {
        const compat = POSITION_COMPATIBILITY[position] || [position];
        if (compat.includes(p.position) && (filledCounts[position] || 0) < (requirements[position] || 0)) {
          filledCounts[position] = (filledCounts[position] || 0) + 1;
          break;
        }
      }
    });
    
    // Fill missing positions with compatible players
    for (const { position: requiredPosition, count } of positionsToFill) {
      const currentCount = filledCounts[requiredPosition] || 0;
      const needed = count - currentCount;
      
      if (needed > 0) {
        const compatiblePositions = POSITION_COMPATIBILITY[requiredPosition] || [requiredPosition];
        
        for (let i = 0; i < needed && selected.length < 11; i++) {
          const bestPlayer = sortedSquad.find(player => 
            !usedPlayerIds.has(player.id) && 
            compatiblePositions.includes(player.position)
          );
          
          if (bestPlayer) {
            selected.push(bestPlayer);
            usedPlayerIds.add(bestPlayer.id);
          }
        }
      }
    }
  }
  
  // Pass 3: If still under 11, fill with any remaining players
  while (selected.length < 11) {
    const anyPlayer = sortedSquad.find(player => !usedPlayerIds.has(player.id));
    if (anyPlayer) {
      selected.push(anyPlayer);
      usedPlayerIds.add(anyPlayer.id);
    } else {
      break;
    }
  }
  
  // Sort final selection by position for display (GK -> DEF -> MID -> FWD)
  const positionOrder: Record<string, number> = {
    'GK': 0, 'CB': 1, 'LB': 2, 'RB': 3, 'LWB': 2, 'RWB': 3,
    'DM': 4, 'CM': 5, 'LM': 6, 'RM': 7, 'AM': 8,
    'LW': 9, 'RW': 10, 'ST': 11
  };
  
  selected.sort((a, b) => {
    const orderA = positionOrder[a.position] ?? 6;
    const orderB = positionOrder[b.position] ?? 6;
    return orderA - orderB;
  });
  
  return selected;
}

// Formation positions mapping (reusing from tactics-advanced)
const FORMATION_POSITIONS: Record<string, { position: string; x: number; y: number }[]> = {
  '4-4-2': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 25 },
    { position: 'CB', x: 38, y: 22 },
    { position: 'CB', x: 62, y: 22 },
    { position: 'RB', x: 85, y: 25 },
    { position: 'LM', x: 15, y: 50 },
    { position: 'CM', x: 38, y: 48 },
    { position: 'CM', x: 62, y: 48 },
    { position: 'RM', x: 85, y: 50 },
    { position: 'ST', x: 38, y: 75 },
    { position: 'ST', x: 62, y: 75 },
  ],
  '4-3-3': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 25 },
    { position: 'CB', x: 38, y: 22 },
    { position: 'CB', x: 62, y: 22 },
    { position: 'RB', x: 85, y: 25 },
    { position: 'CM', x: 30, y: 48 },
    { position: 'CM', x: 50, y: 45 },
    { position: 'CM', x: 70, y: 48 },
    { position: 'LW', x: 15, y: 75 },
    { position: 'ST', x: 50, y: 78 },
    { position: 'RW', x: 85, y: 75 },
  ],
  '3-5-2': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'CB', x: 25, y: 22 },
    { position: 'CB', x: 50, y: 20 },
    { position: 'CB', x: 75, y: 22 },
    { position: 'LM', x: 10, y: 48 },
    { position: 'CM', x: 30, y: 45 },
    { position: 'CM', x: 50, y: 48 },
    { position: 'CM', x: 70, y: 45 },
    { position: 'RM', x: 90, y: 48 },
    { position: 'ST', x: 38, y: 75 },
    { position: 'ST', x: 62, y: 75 },
  ],
  '4-5-1': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 25 },
    { position: 'CB', x: 38, y: 22 },
    { position: 'CB', x: 62, y: 22 },
    { position: 'RB', x: 85, y: 25 },
    { position: 'LM', x: 15, y: 50 },
    { position: 'CM', x: 32, y: 48 },
    { position: 'CM', x: 50, y: 45 },
    { position: 'CM', x: 68, y: 48 },
    { position: 'RM', x: 85, y: 50 },
    { position: 'ST', x: 50, y: 78 },
  ],
  '5-3-2': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LWB', x: 10, y: 28 },
    { position: 'CB', x: 28, y: 22 },
    { position: 'CB', x: 50, y: 20 },
    { position: 'CB', x: 72, y: 22 },
    { position: 'RWB', x: 90, y: 28 },
    { position: 'CM', x: 30, y: 48 },
    { position: 'CM', x: 50, y: 45 },
    { position: 'CM', x: 70, y: 48 },
    { position: 'ST', x: 38, y: 75 },
    { position: 'ST', x: 62, y: 75 },
  ],
  '4-2-3-1': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LB', x: 15, y: 25 },
    { position: 'CB', x: 38, y: 22 },
    { position: 'CB', x: 62, y: 22 },
    { position: 'RB', x: 85, y: 25 },
    { position: 'DM', x: 38, y: 40 },
    { position: 'DM', x: 62, y: 40 },
    { position: 'LM', x: 15, y: 58 },
    { position: 'AM', x: 50, y: 60 },
    { position: 'RM', x: 85, y: 58 },
    { position: 'ST', x: 50, y: 78 },
  ],
  '3-4-3': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'CB', x: 25, y: 22 },
    { position: 'CB', x: 50, y: 20 },
    { position: 'CB', x: 75, y: 22 },
    { position: 'LM', x: 15, y: 48 },
    { position: 'CM', x: 38, y: 45 },
    { position: 'CM', x: 62, y: 45 },
    { position: 'RM', x: 85, y: 48 },
    { position: 'LW', x: 20, y: 75 },
    { position: 'ST', x: 50, y: 78 },
    { position: 'RW', x: 80, y: 75 },
  ],
  '5-4-1': [
    { position: 'GK', x: 50, y: 5 },
    { position: 'LWB', x: 10, y: 28 },
    { position: 'CB', x: 28, y: 22 },
    { position: 'CB', x: 50, y: 20 },
    { position: 'CB', x: 72, y: 22 },
    { position: 'RWB', x: 90, y: 28 },
    { position: 'LM', x: 20, y: 50 },
    { position: 'CM', x: 40, y: 48 },
    { position: 'CM', x: 60, y: 48 },
    { position: 'RM', x: 80, y: 50 },
    { position: 'ST', x: 50, y: 78 },
  ],
};

// Pitch visualization component
function MiniPitch({ formation, homeTeam, awayTeam, lastEvent }: any) {
  const homePositions = FORMATION_POSITIONS[homeTeam?.formation || '4-4-2'] || FORMATION_POSITIONS['4-4-2'];
  const awayPositions = FORMATION_POSITIONS[awayTeam?.formation || '4-4-2'] || FORMATION_POSITIONS['4-4-2'];
  
  const pitchWidth = Math.min(width - 32, 380);
  const pitchHeight = pitchWidth * 0.65; // Wider pitch for side-by-side view

  // Map positions to pitch sections to avoid overlap
  // Home team uses bottom 45% (0-45% from bottom)
  // Away team uses top 45% (55-100% from bottom) 
  const homeAdjusted = homePositions.map(pos => ({
    ...pos,
    y: pos.y * 0.45 // Scale to bottom 45%
  }));

  const awayAdjusted = awayPositions.map(pos => ({
    ...pos,
    y: 55 + ((100 - pos.y) * 0.45) // Flip and scale to top 45%
  }));

  return (
    <View style={[styles.miniPitchContainer, { width: pitchWidth, height: pitchHeight }]}>
      {/* Pitch background */}
      <View style={styles.miniPitch}>
        {/* Center line */}
        <View style={[styles.centerLine, { top: pitchHeight / 2 }]} />
        
        {/* Center circle */}
        <View style={[styles.centerCircle, { 
          top: pitchHeight / 2 - 25, 
          left: pitchWidth / 2 - 25,
          width: 50,
          height: 50,
          borderRadius: 25,
        }]} />
        
        {/* Penalty boxes */}
        <View style={[styles.penaltyBox, styles.penaltyBoxTop, {
          width: pitchWidth * 0.5,
          left: pitchWidth * 0.25,
          height: 50,
        }]} />
        <View style={[styles.penaltyBox, styles.penaltyBoxBottom, {
          width: pitchWidth * 0.5,
          left: pitchWidth * 0.25,
          height: 50,
        }]} />
      </View>

      {/* Home team players (bottom) */}
      {homeAdjusted.map((pos, index) => (
        <View
          key={`home-${index}`}
          style={[
            styles.miniPlayerDot,
            styles.homePlayerDot,
            {
              left: (pos.x / 100) * pitchWidth - 12,
              bottom: (pos.y / 100) * pitchHeight - 12,
            },
          ]}
        >
          <Text style={[styles.miniPlayerLabel, styles.homePlayerLabel]}>{pos.position}</Text>
        </View>
      ))}

      {/* Away team players (top) */}
      {awayAdjusted.map((pos, index) => (
        <View
          key={`away-${index}`}
          style={[
            styles.miniPlayerDot,
            styles.awayPlayerDot,
            {
              left: (pos.x / 100) * pitchWidth - 12,
              bottom: (pos.y / 100) * pitchHeight - 12,
            },
          ]}
        >
          <Text style={[styles.miniPlayerLabel, styles.awayPlayerLabel]}>{pos.position}</Text>
        </View>
      ))}

      {/* Ball position indicator (based on last event) */}
      {lastEvent && (
        <View style={[styles.ballIndicator, {
          left: pitchWidth / 2 - 6,
          top: lastEvent.team === homeTeam?.short_name ? pitchHeight * 0.7 : pitchHeight * 0.3,
        }]}>
          <Ionicons name="football" size={12} color="#fff" />
        </View>
      )}
    </View>
  );
}

export default function MatchScreen() {
  const { currentSave, getManagedTeam, getLeague, simulateMatch, saveGame, updateFormation } = useGame();
  const [matchState, setMatchState] = useState<MatchState>('pre');
  const [activeTab, setActiveTab] = useState<MatchTab>('pitch');
  const [events, setEvents] = useState<any[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [showTacticsModal, setShowTacticsModal] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState('4-4-2');
  const [substitutions, setSubstitutions] = useState<{ out: string; in: string }[]>([]);
  const [currentSquad, setCurrentSquad] = useState<Player[]>([]);
  const [benchPlayers, setBenchPlayers] = useState<Player[]>([]);
  const [selectedPlayerOut, setSelectedPlayerOut] = useState<string | null>(null);
  const [showLineupModal, setShowLineupModal] = useState(false);
  const [lineupConfirmed, setLineupConfirmed] = useState(false);
  const [selectedForSwap, setSelectedForSwap] = useState<string | null>(null);
  const [swapMode, setSwapMode] = useState<'starting' | 'bench' | null>(null);
  const [playerRatings, setPlayerRatings] = useState<{ [playerId: string]: number }>({});
  const [momentumData, setMomentumData] = useState<{ timeline: { minute: number; homeValue: number; awayValue: number }[]; finalHome: number; finalAway: number } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [isReady, setIsReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Guard: redirect if no game context
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        if (!currentSave) {
          router.replace('/');
        } else {
          setIsReady(true);
        }
        setIsChecking(false);
      }, 100);

      return () => clearTimeout(timer);
    }, [currentSave])
  );

  // Match statistics
  const [matchStats, setMatchStats] = useState({
    possession: { home: 50, away: 50 },
    shots: { home: 0, away: 0 },
    shotsOnTarget: { home: 0, away: 0 },
    corners: { home: 0, away: 0 },
    fouls: { home: 0, away: 0 },
    yellowCards: { home: 0, away: 0 },
  });

  const managedTeam = getManagedTeam();
  const league = getLeague();

  const fixture = league?.fixtures.find(
    f => !f.played && (f.home_team_id === managedTeam?.id || f.away_team_id === managedTeam?.id)
  );

  useEffect(() => {
    if (managedTeam) {
      setSelectedFormation(managedTeam.formation);
      // Initialize current squad with proper starting XI based on formation
      const startingXI = selectStartingXI(managedTeam.squad, managedTeam.formation || '4-4-2');
      const startingIds = new Set(startingXI.map(p => p.id));
      const bench = managedTeam.squad.filter(p => !startingIds.has(p.id));
      setCurrentSquad(startingXI);
      setBenchPlayers(bench);
    }
  }, [managedTeam]);

  useEffect(() => {
    if (matchState === 'live' && events.length > 0) {
      const interval = setInterval(() => {
        setCurrentMinute(prev => {
          if (prev >= 90) {
            setMatchState('post');
            clearInterval(interval);
            return 90;
          }
          return prev + 1;
        });
      }, 1000 / speed);

      return () => clearInterval(interval);
    }
  }, [matchState, speed, events]);

  useEffect(() => {
    if (events.length > 0 && currentEventIndex < events.length) {
      const nextEvent = events[currentEventIndex];
      if (currentMinute >= nextEvent.minute) {
        const homeTeam = currentSave?.teams.find(t => t.id === fixture?.home_team_id);
        
        // Update scores
        if (nextEvent.type === 'GOAL') {
          if (nextEvent.team === homeTeam?.short_name) {
            setHomeScore(prev => prev + 1);
          } else {
            setAwayScore(prev => prev + 1);
          }
        }

        // Update stats
        setMatchStats(prev => {
          const isHome = nextEvent.team === homeTeam?.short_name;
          const newStats = { ...prev };
          
          if (nextEvent.type === 'GOAL' || nextEvent.type === 'CHANCE') {
            newStats.shots = {
              home: isHome ? prev.shots.home + 1 : prev.shots.home,
              away: !isHome ? prev.shots.away + 1 : prev.shots.away,
            };
          }
          
          if (nextEvent.type === 'GOAL' || nextEvent.type === 'SAVE') {
            newStats.shotsOnTarget = {
              home: isHome ? prev.shotsOnTarget.home + 1 : prev.shotsOnTarget.home,
              away: !isHome ? prev.shotsOnTarget.away + 1 : prev.shotsOnTarget.away,
            };
          }
          
          if (nextEvent.type === 'YELLOW_CARD') {
            newStats.yellowCards = {
              home: isHome ? prev.yellowCards.home + 1 : prev.yellowCards.home,
              away: !isHome ? prev.yellowCards.away + 1 : prev.yellowCards.away,
            };
          }
          
          if (nextEvent.type === 'FOUL') {
            newStats.fouls = {
              home: isHome ? prev.fouls.home + 1 : prev.fouls.home,
              away: !isHome ? prev.fouls.away + 1 : prev.fouls.away,
            };
          }

          // Update possession based on events
          const totalEvents = currentEventIndex + 1;
          const homeEvents = events.slice(0, currentEventIndex + 1).filter(e => e.team === homeTeam?.short_name).length;
          newStats.possession = {
            home: Math.round((homeEvents / totalEvents) * 100),
            away: Math.round(((totalEvents - homeEvents) / totalEvents) * 100),
          };
          
          return newStats;
        });

        setCurrentEventIndex(prev => prev + 1);
        if (activeTab === 'commentary') {
          setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    }
  }, [currentMinute, events, currentEventIndex]);

  // Show loading screen while checking (after all hooks)
  if (isChecking || !currentSave || !isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff88" />
          <Text style={styles.loadingText}>Loading match...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleStartMatch = async () => {
    if (!fixture) return;
    const result = await simulateMatch(fixture.id, speed);
    if (result) {
      setEvents(result.events);
      setMatchState('live');
      setActiveTab('pitch'); // Start with pitch view
      
      // Phase 2: Store player ratings and momentum data
      if (result.playerRatings) {
        setPlayerRatings(result.playerRatings);
      }
      if (result.momentum) {
        setMomentumData(result.momentum);
      }
      
      // Use real stats from the match engine
      if (result.stats) {
        setMatchStats({
          possession: result.stats.possession,
          shots: result.stats.shots,
          shotsOnTarget: result.stats.shotsOnTarget,
          corners: result.stats.corners,
          fouls: result.stats.fouls,
          yellowCards: result.stats.yellowCards,
        });
      } else {
        // Fallback to calculated stats if not provided
        setMatchStats({
          possession: { home: 50, away: 50 },
          shots: { home: 0, away: 0 },
          shotsOnTarget: { home: 0, away: 0 },
          corners: { home: 0, away: 0 },
          fouls: { home: 0, away: 0 },
          yellowCards: { home: 0, away: 0 },
        });
      }
    }
  };

  const handlePause = () => {
    setMatchState('paused');
  };

  const handleResume = () => {
    setMatchState('live');
  };

  const handleFinish = async () => {
    await saveGame(false);
    router.replace('/game');
  };

  const handleFormationChange = (formation: string) => {
    setSelectedFormation(formation);
    updateFormation(formation, {});
    
    // Add tactical change event to commentary if match is live
    if (matchState === 'live' || matchState === 'paused') {
      const newEvent = {
        type: 'TACTICAL_CHANGE',
        minute: currentMinute,
        team: managedTeam?.short_name || '',
        player: '',
        description: `Tactical change: Formation changed to ${formation}`
      };
      setEvents(prev => [...prev, newEvent].sort((a, b) => a.minute - b.minute));
      setCurrentEventIndex(prev => prev + 1);
    }
    
    setShowTacticsModal(false);
    Alert.alert('Formation Changed', `Your team will now play in a ${formation} formation.`);
  };

  const handleSelectPlayerOut = (playerId: string) => {
    setSelectedPlayerOut(playerId);
  };

  const handleMakeSubstitution = (playerInId: string) => {
    if (!selectedPlayerOut) {
      Alert.alert('Select Player', 'Please select a player to substitute off first.');
      return;
    }

    if (substitutions.length >= 3) {
      Alert.alert('Limit Reached', 'You have already made 3 substitutions.');
      return;
    }

    const playerOut = currentSquad.find(p => p.id === selectedPlayerOut);
    const playerIn = benchPlayers.find(p => p.id === playerInId);

    if (!playerOut || !playerIn) return;

    // Update squad and bench
    const newSquad = currentSquad.map(p => p.id === selectedPlayerOut ? playerIn : p);
    const newBench = benchPlayers.map(p => p.id === playerInId ? playerOut : p);
    
    setCurrentSquad(newSquad);
    setBenchPlayers(newBench);
    setSubstitutions(prev => [...prev, { out: playerOut.name, in: playerIn.name }]);
    setSelectedPlayerOut(null);

    // Add substitution event to commentary
    if (matchState === 'live' || matchState === 'paused') {
      const newEvent = {
        type: 'SUBSTITUTION',
        minute: currentMinute,
        team: managedTeam?.short_name || '',
        player: playerIn.name,
        description: `Substitution: ${playerOut.name} OFF, ${playerIn.name} ON`
      };
      setEvents(prev => [...prev, newEvent].sort((a, b) => a.minute - b.minute));
      setCurrentEventIndex(prev => prev + 1);
    }

    Alert.alert(
      'Substitution Made',
      `${playerOut.name} has been replaced by ${playerIn.name}`,
      [{ text: 'OK', onPress: () => setShowSubstitutionModal(false) }]
    );
  };

  // Handle player selection for swap
  const handlePlayerSelect = (playerId: string, isFromStarting: boolean) => {
    if (selectedForSwap === null) {
      // First selection - mark this player
      setSelectedForSwap(playerId);
      setSwapMode(isFromStarting ? 'starting' : 'bench');
    } else if (selectedForSwap === playerId) {
      // Deselect if tapping same player
      setSelectedForSwap(null);
      setSwapMode(null);
    } else {
      // Second selection - perform swap
      const fromStarting = swapMode === 'starting';
      const toStarting = isFromStarting;
      
      if (fromStarting && toStarting) {
        // Swap positions within starting XI
        const idx1 = currentSquad.findIndex(p => p.id === selectedForSwap);
        const idx2 = currentSquad.findIndex(p => p.id === playerId);
        if (idx1 !== -1 && idx2 !== -1) {
          const newSquad = [...currentSquad];
          [newSquad[idx1], newSquad[idx2]] = [newSquad[idx2], newSquad[idx1]];
          setCurrentSquad(newSquad);
        }
      } else if (!fromStarting && !toStarting) {
        // Swap within bench
        const idx1 = benchPlayers.findIndex(p => p.id === selectedForSwap);
        const idx2 = benchPlayers.findIndex(p => p.id === playerId);
        if (idx1 !== -1 && idx2 !== -1) {
          const newBench = [...benchPlayers];
          [newBench[idx1], newBench[idx2]] = [newBench[idx2], newBench[idx1]];
          setBenchPlayers(newBench);
        }
      } else {
        // Swap between starting and bench
        const startingPlayer = fromStarting 
          ? currentSquad.find(p => p.id === selectedForSwap)
          : currentSquad.find(p => p.id === playerId);
        const benchPlayer = fromStarting 
          ? benchPlayers.find(p => p.id === playerId)
          : benchPlayers.find(p => p.id === selectedForSwap);
          
        if (startingPlayer && benchPlayer) {
          setCurrentSquad(prev => prev.map(p => 
            p.id === startingPlayer.id ? benchPlayer : p
          ));
          setBenchPlayers(prev => prev.map(p => 
            p.id === benchPlayer.id ? startingPlayer : p
          ));
        }
      }
      
      // Reset selection
      setSelectedForSwap(null);
      setSwapMode(null);
    }
  };

  // Legacy function for backwards compatibility
  const handleLineupPlayerToggle = (playerId: string) => {
    const isInSquad = currentSquad.some(p => p.id === playerId);
    handlePlayerSelect(playerId, isInSquad);
  };

  const handleConfirmLineup = () => {
    if (currentSquad.length !== 11) {
      Alert.alert('Invalid Lineup', `You must select exactly 11 players. Current: ${currentSquad.length}`);
      return;
    }
    if (benchPlayers.length > 9) {
      Alert.alert('Too Many Subs', 'You can have maximum 9 substitutes on the bench.');
      return;
    }
    setLineupConfirmed(true);
    setShowLineupModal(false);
    Alert.alert('Team Selected', 'Your lineup is ready. You can now start the match!');
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'GOAL': return 'football';
      case 'YELLOW_CARD': return 'card';
      case 'SAVE': return 'hand-left';
      case 'CHANCE': return 'flash';
      case 'FOUL': return 'warning';
      case 'SUBSTITUTION': return 'swap-horizontal';
      case 'TACTICAL_CHANGE': return 'grid-outline';
      default: return 'ellipse';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'GOAL': return '#00ff88';
      case 'YELLOW_CARD': return '#ffcc00';
      case 'SAVE': return '#4a9eff';
      case 'CHANCE': return '#ff9f43';
      case 'FOUL': return '#ff6b6b';
      case 'SUBSTITUTION': return '#9b59b6';
      case 'TACTICAL_CHANGE': return '#3498db';
      default: return '#6a8aaa';
    }
  };

  if (!fixture || !managedTeam) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noMatchContainer}>
          <Ionicons name="football-outline" size={64} color="#4a6a8a" />
          <Text style={styles.noMatchText}>No match scheduled</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isHome = fixture.home_team_id === managedTeam.id;
  const homeTeam = currentSave?.teams.find(t => t.id === fixture.home_team_id);
  const awayTeam = currentSave?.teams.find(t => t.id === fixture.away_team_id);
  const formations = ['4-4-2', '4-3-3', '3-5-2', '4-5-1', '5-3-2', '4-2-3-1'];
  const lastEvent = events[currentEventIndex - 1];

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Scoreboard */}
      <View style={styles.scoreboard}>
        <View style={styles.scoreboardTeam}>
          <Text style={[
            styles.scoreboardTeamName,
            isHome && styles.scoreboardTeamHighlight
          ]} numberOfLines={1}>
            {fixture.home_team_name}
          </Text>
          <Text style={styles.scoreboardScore}>{homeScore}</Text>
        </View>
        
        <View style={styles.scoreboardCenter}>
          {matchState === 'live' || matchState === 'paused' ? (
            <View style={styles.minuteContainer}>
              <Text style={styles.minuteText}>{currentMinute}'</Text>
              {matchState === 'paused' && (
                <Text style={styles.pausedText}>PAUSED</Text>
              )}
            </View>
          ) : matchState === 'post' ? (
            <Text style={styles.fullTimeLabel}>FT</Text>
          ) : (
            <Text style={styles.vsText}>vs</Text>
          )}
        </View>
        
        <View style={styles.scoreboardTeam}>
          <Text style={styles.scoreboardScore}>{awayScore}</Text>
          <Text style={[
            styles.scoreboardTeamName,
            !isHome && styles.scoreboardTeamHighlight
          ]} numberOfLines={1}>
            {fixture.away_team_name}
          </Text>
        </View>
      </View>

      {/* Formation Comparison Bar */}
      {(matchState === 'live' || matchState === 'paused' || matchState === 'post') && (
        <View style={styles.formationBar}>
          <View style={styles.formationTeam}>
            <Ionicons name="grid-outline" size={14} color="#4a9eff" />
            <Text style={styles.formationText}>{homeTeam?.formation || '4-4-2'}</Text>
          </View>
          <Text style={styles.formationVs}>FORMATIONS</Text>
          <View style={styles.formationTeam}>
            <Text style={styles.formationText}>{awayTeam?.formation || '4-4-2'}</Text>
            <Ionicons name="grid-outline" size={14} color="#ff9f43" />
          </View>
        </View>
      )}

      {/* Match Tabs */}
      {(matchState === 'live' || matchState === 'paused' || matchState === 'post') && (
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'pitch' && styles.tabActive]}
            onPress={() => setActiveTab('pitch')}
          >
            <Ionicons name="analytics-outline" size={18} color={activeTab === 'pitch' ? '#00ff88' : '#6a8aaa'} />
            <Text style={[styles.tabText, activeTab === 'pitch' && styles.tabTextActive]}>Pitch</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'commentary' && styles.tabActive]}
            onPress={() => setActiveTab('commentary')}
          >
            <Ionicons name="list-outline" size={18} color={activeTab === 'commentary' ? '#00ff88' : '#6a8aaa'} />
            <Text style={[styles.tabText, activeTab === 'commentary' && styles.tabTextActive]}>Commentary</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
            onPress={() => setActiveTab('stats')}
          >
            <Ionicons name="stats-chart-outline" size={18} color={activeTab === 'stats' ? '#00ff88' : '#6a8aaa'} />
            <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>Stats</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Match Controls (when paused) */}
      {matchState === 'paused' && (
        <View style={styles.pauseControls}>
          <TouchableOpacity 
            style={styles.pauseControlButton}
            onPress={() => setShowTacticsModal(true)}
          >
            <Ionicons name="grid-outline" size={20} color="#4a9eff" />
            <Text style={styles.pauseControlText}>Tactics</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.pauseControlButton}
            onPress={() => setShowSubstitutionModal(true)}
          >
            <Ionicons name="swap-horizontal" size={20} color="#00ff88" />
            <Text style={styles.pauseControlText}>Subs</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.pauseControlButton, styles.resumeButton]}
            onPress={handleResume}
          >
            <Ionicons name="play" size={20} color="#0a1628" />
            <Text style={[styles.pauseControlText, { color: '#0a1628' }]}>Resume</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Speed Controls (pre-match) */}
      {matchState === 'pre' && (
        <View style={styles.speedControls}>
          <Text style={styles.speedLabel}>Commentary Speed:</Text>
          <View style={styles.speedButtons}>
            {[1, 2, 4].map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.speedButton, speed === s && styles.speedButtonActive]}
                onPress={() => setSpeed(s)}
              >
                <Text style={[styles.speedButtonText, speed === s && styles.speedButtonTextActive]}>
                  {s}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Main Content Area */}
      <View style={styles.contentContainer}>
        {matchState === 'pre' ? (
          <View style={styles.preMatchContainer}>
            <Ionicons name="football" size={48} color="#00ff88" />
            <Text style={styles.preMatchTitle}>MATCH DAY</Text>
            <Text style={styles.preMatchSubtitle}>Week {fixture.week}</Text>
            <Text style={styles.preMatchInfo}>
              {isHome ? 'Home' : 'Away'} match at {isHome ? managedTeam.stadium : 'Away Stadium'}
            </Text>
            <View style={styles.preMatchFormations}>
              <View style={styles.preMatchFormationItem}>
                <Text style={styles.preMatchFormationTeam}>{homeTeam?.short_name}</Text>
                <Text style={styles.preMatchFormationValue}>{homeTeam?.formation || '4-4-2'}</Text>
              </View>
              <Text style={styles.preMatchFormationVs}>vs</Text>
              <View style={styles.preMatchFormationItem}>
                <Text style={styles.preMatchFormationTeam}>{awayTeam?.short_name}</Text>
                <Text style={styles.preMatchFormationValue}>{awayTeam?.formation || '4-4-2'}</Text>
              </View>
            </View>

            {!lineupConfirmed ? (
              <TouchableOpacity 
                style={styles.selectTeamButton} 
                onPress={() => setShowLineupModal(true)}
              >
                <Ionicons name="people-outline" size={20} color="#0a1628" />
                <Text style={styles.selectTeamButtonText}>SELECT TEAM</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.lineupConfirmedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#00ff88" />
                  <Text style={styles.lineupConfirmedText}>Team Selected</Text>
                </View>
                <TouchableOpacity style={styles.startButton} onPress={handleStartMatch}>
                  <Ionicons name="play" size={20} color="#0a1628" />
                  <Text style={styles.startButtonText}>KICK OFF</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <>
            {/* Pitch View */}
            {activeTab === 'pitch' && (
              <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
                <View style={styles.pitchViewContainer}>
                  <MiniPitch 
                    formation={selectedFormation}
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    lastEvent={lastEvent}
                  />
                  
                  {/* Latest Event Display */}
                  {lastEvent && (
                    <View style={styles.latestEventCard}>
                      <View style={[
                        styles.latestEventIcon,
                        { backgroundColor: `${getEventColor(lastEvent.type)}20` }
                      ]}>
                        <Ionicons 
                          name={getEventIcon(lastEvent.type) as any} 
                          size={20} 
                          color={getEventColor(lastEvent.type)} 
                        />
                      </View>
                      <View style={styles.latestEventContent}>
                        <Text style={styles.latestEventMinute}>{lastEvent.minute}'</Text>
                        <Text style={styles.latestEventTeam}>{lastEvent.team}</Text>
                        <Text style={styles.latestEventDescription}>{lastEvent.description}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}

            {/* Commentary View */}
            {activeTab === 'commentary' && (
              <ScrollView 
                ref={scrollRef}
                style={styles.tabContent}
                contentContainerStyle={styles.commentaryContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.kickoffEvent}>
                  <Text style={styles.kickoffText}>KICK OFF!</Text>
                </View>
                
                {events.slice(0, currentEventIndex).map((event, index) => (
                  <View key={index} style={[
                    styles.eventItem,
                    { borderLeftColor: getEventColor(event.type) }
                  ]}>
                    <View style={styles.eventMinute}>
                      <Text style={styles.eventMinuteText}>{event.minute}'</Text>
                    </View>
                    <View style={[
                      styles.eventIcon,
                      { backgroundColor: `${getEventColor(event.type)}20` }
                    ]}>
                      <Ionicons 
                        name={getEventIcon(event.type) as any} 
                        size={16} 
                        color={getEventColor(event.type)} 
                      />
                    </View>
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTeam}>{event.team}</Text>
                      <Text style={styles.eventDescription}>{event.description}</Text>
                    </View>
                  </View>
                ))}

                {matchState === 'post' && (
                  <View style={styles.fullTimeEvent}>
                    <Text style={styles.fullTimeText}>FULL TIME</Text>
                    <Text style={styles.finalScore}>{homeScore} - {awayScore}</Text>
                  </View>
                )}
              </ScrollView>
            )}

            {/* Stats View */}
            {activeTab === 'stats' && (
              <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
                <View style={styles.statsContainer}>
                  {/* Possession */}
                  <View style={styles.statItem}>
                    <View style={styles.statHeader}>
                      <Text style={styles.statValue}>{matchStats.possession.home}%</Text>
                      <Text style={styles.statLabel}>POSSESSION</Text>
                      <Text style={styles.statValue}>{matchStats.possession.away}%</Text>
                    </View>
                    <View style={styles.statBarContainer}>
                      <View style={[styles.statBar, styles.homeStatBar, { width: `${matchStats.possession.home}%` }]} />
                      <View style={[styles.statBar, styles.awayStatBar, { width: `${matchStats.possession.away}%` }]} />
                    </View>
                  </View>

                  {/* Shots */}
                  <View style={styles.statItem}>
                    <View style={styles.statHeader}>
                      <Text style={styles.statValue}>{matchStats.shots.home}</Text>
                      <Text style={styles.statLabel}>SHOTS</Text>
                      <Text style={styles.statValue}>{matchStats.shots.away}</Text>
                    </View>
                    <View style={styles.statBarContainer}>
                      <View style={[styles.statBar, styles.homeStatBar, { 
                        width: `${(matchStats.shots.home / Math.max(matchStats.shots.home + matchStats.shots.away, 1)) * 100}%` 
                      }]} />
                      <View style={[styles.statBar, styles.awayStatBar, { 
                        width: `${(matchStats.shots.away / Math.max(matchStats.shots.home + matchStats.shots.away, 1)) * 100}%` 
                      }]} />
                    </View>
                  </View>

                  {/* Shots on Target */}
                  <View style={styles.statItem}>
                    <View style={styles.statHeader}>
                      <Text style={styles.statValue}>{matchStats.shotsOnTarget.home}</Text>
                      <Text style={styles.statLabel}>SHOTS ON TARGET</Text>
                      <Text style={styles.statValue}>{matchStats.shotsOnTarget.away}</Text>
                    </View>
                    <View style={styles.statBarContainer}>
                      <View style={[styles.statBar, styles.homeStatBar, { 
                        width: `${(matchStats.shotsOnTarget.home / Math.max(matchStats.shotsOnTarget.home + matchStats.shotsOnTarget.away, 1)) * 100}%` 
                      }]} />
                      <View style={[styles.statBar, styles.awayStatBar, { 
                        width: `${(matchStats.shotsOnTarget.away / Math.max(matchStats.shotsOnTarget.home + matchStats.shotsOnTarget.away, 1)) * 100}%` 
                      }]} />
                    </View>
                  </View>

                  {/* Corners */}
                  <View style={styles.statItem}>
                    <View style={styles.statHeader}>
                      <Text style={styles.statValue}>{matchStats.corners.home}</Text>
                      <Text style={styles.statLabel}>CORNERS</Text>
                      <Text style={styles.statValue}>{matchStats.corners.away}</Text>
                    </View>
                    <View style={styles.statBarContainer}>
                      <View style={[styles.statBar, styles.homeStatBar, { 
                        width: `${(matchStats.corners.home / Math.max(matchStats.corners.home + matchStats.corners.away, 1)) * 100}%` 
                      }]} />
                      <View style={[styles.statBar, styles.awayStatBar, { 
                        width: `${(matchStats.corners.away / Math.max(matchStats.corners.home + matchStats.corners.away, 1)) * 100}%` 
                      }]} />
                    </View>
                  </View>

                  {/* Fouls */}
                  <View style={styles.statItem}>
                    <View style={styles.statHeader}>
                      <Text style={styles.statValue}>{matchStats.fouls.home}</Text>
                      <Text style={styles.statLabel}>FOULS</Text>
                      <Text style={styles.statValue}>{matchStats.fouls.away}</Text>
                    </View>
                    <View style={styles.statBarContainer}>
                      <View style={[styles.statBar, styles.homeStatBar, { 
                        width: `${(matchStats.fouls.home / Math.max(matchStats.fouls.home + matchStats.fouls.away, 1)) * 100}%` 
                      }]} />
                      <View style={[styles.statBar, styles.awayStatBar, { 
                        width: `${(matchStats.fouls.away / Math.max(matchStats.fouls.home + matchStats.fouls.away, 1)) * 100}%` 
                      }]} />
                    </View>
                  </View>

                  {/* Yellow Cards */}
                  <View style={styles.statItem}>
                    <View style={styles.statHeader}>
                      <Text style={styles.statValue}>{matchStats.yellowCards.home}</Text>
                      <Text style={styles.statLabel}>YELLOW CARDS</Text>
                      <Text style={styles.statValue}>{matchStats.yellowCards.away}</Text>
                    </View>
                    <View style={styles.statBarContainer}>
                      <View style={[styles.statBar, styles.homeStatBar, { 
                        width: `${(matchStats.yellowCards.home / Math.max(matchStats.yellowCards.home + matchStats.yellowCards.away, 1)) * 100}%` 
                      }]} />
                      <View style={[styles.statBar, styles.awayStatBar, { 
                        width: `${(matchStats.yellowCards.away / Math.max(matchStats.yellowCards.home + matchStats.yellowCards.away, 1)) * 100}%` 
                      }]} />
                    </View>
                  </View>

                  {/* Phase 2: Momentum Display */}
                  {momentumData && matchState === 'post' && (
                    <View style={styles.momentumSection}>
                      <Text style={styles.sectionTitle}>MATCH MOMENTUM</Text>
                      <View style={styles.momentumBar}>
                        <View style={styles.momentumLabels}>
                          <Text style={styles.momentumLabelHome}>{homeTeam?.short_name}</Text>
                          <Text style={styles.momentumLabelAway}>{awayTeam?.short_name}</Text>
                        </View>
                        <View style={styles.momentumBarTrack}>
                          <View style={[styles.momentumBarFill, { 
                            width: `${momentumData.finalHome}%`,
                            backgroundColor: '#4a9eff' 
                          }]} />
                        </View>
                        <View style={styles.momentumBarTrack}>
                          <View style={[styles.momentumBarFill, { 
                            width: `${momentumData.finalAway}%`,
                            backgroundColor: '#ff6b6b' 
                          }]} />
                        </View>
                      </View>
                      {/* Mini momentum timeline */}
                      <View style={styles.momentumTimeline}>
                        {momentumData.timeline.filter((_, i) => i % 2 === 0).map((point, idx) => (
                          <View key={idx} style={styles.momentumPoint}>
                            <View style={[styles.momentumDotHome, { 
                              height: Math.max(2, (point.homeValue / 85) * 20),
                            }]} />
                            <Text style={styles.momentumMinute}>{point.minute}'</Text>
                            <View style={[styles.momentumDotAway, { 
                              height: Math.max(2, (point.awayValue / 85) * 20),
                            }]} />
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Phase 2: Player Ratings */}
                  {matchState === 'post' && Object.keys(playerRatings).length > 0 && (
                    <View style={styles.ratingsSection}>
                      <Text style={styles.sectionTitle}>PLAYER RATINGS</Text>
                      
                      {/* Home Team Ratings */}
                      <Text style={styles.ratingsTeamName}>{homeTeam?.name}</Text>
                      {homeTeam?.squad.slice(0, 11).map(player => {
                        const rating = playerRatings[player.id];
                        if (rating === undefined) return null;
                        return (
                          <View key={player.id} style={styles.ratingRow}>
                            <Text style={styles.ratingPosition}>{player.position}</Text>
                            <Text style={styles.ratingPlayerName} numberOfLines={1}>{player.name}</Text>
                            <View style={[styles.ratingBadge, { 
                              backgroundColor: rating >= 7.5 ? '#00ff88' : rating >= 6.5 ? '#ffcc00' : rating >= 5.5 ? '#ff9f43' : '#ff6b6b'
                            }]}>
                              <Text style={[styles.ratingValue, {
                                color: rating >= 7.5 ? '#0a1628' : rating >= 6.5 ? '#0a1628' : '#fff'
                              }]}>{rating.toFixed(1)}</Text>
                            </View>
                          </View>
                        );
                      })}
                      
                      {/* Away Team Ratings */}
                      <Text style={[styles.ratingsTeamName, { marginTop: 16 }]}>{awayTeam?.name}</Text>
                      {awayTeam?.squad.slice(0, 11).map(player => {
                        const rating = playerRatings[player.id];
                        if (rating === undefined) return null;
                        return (
                          <View key={player.id} style={styles.ratingRow}>
                            <Text style={styles.ratingPosition}>{player.position}</Text>
                            <Text style={styles.ratingPlayerName} numberOfLines={1}>{player.name}</Text>
                            <View style={[styles.ratingBadge, { 
                              backgroundColor: rating >= 7.5 ? '#00ff88' : rating >= 6.5 ? '#ffcc00' : rating >= 5.5 ? '#ff9f43' : '#ff6b6b'
                            }]}>
                              <Text style={[styles.ratingValue, {
                                color: rating >= 7.5 ? '#0a1628' : rating >= 6.5 ? '#0a1628' : '#fff'
                              }]}>{rating.toFixed(1)}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </>
        )}
      </View>

      {/* Footer */}
      {matchState === 'live' && (
        <View style={styles.liveFooter}>
          <View style={styles.liveControls}>
            <View style={styles.speedButtons}>
              {[1, 2, 4].map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.speedButton, speed === s && styles.speedButtonActive]}
                  onPress={() => setSpeed(s)}
                >
                  <Text style={[styles.speedButtonText, speed === s && styles.speedButtonTextActive]}>
                    {s}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
              <Ionicons name="pause" size={20} color="#fff" />
              <Text style={styles.pauseButtonText}>PAUSE</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentMinute / 90) * 100}%` }]} />
          </View>
        </View>
      )}

      {matchState === 'post' && (
        <View style={styles.postFooter}>
          <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
            <Text style={styles.finishButtonText}>CONTINUE</Text>
            <Ionicons name="arrow-forward" size={20} color="#0a1628" />
          </TouchableOpacity>
        </View>
      )}

      {/* Tactics Modal */}
      <Modal
        visible={showTacticsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTacticsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>TACTICS</Text>
              <TouchableOpacity onPress={() => setShowTacticsModal(false)}>
                <Ionicons name="close" size={24} color="#6a8aaa" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSectionTitle}>Formation</Text>
            <View style={styles.formationGrid}>
              {formations.map(formation => (
                <TouchableOpacity
                  key={formation}
                  style={[
                    styles.formationOption,
                    selectedFormation === formation && styles.formationOptionActive
                  ]}
                  onPress={() => handleFormationChange(formation)}
                >
                  <Text style={[
                    styles.formationOptionText,
                    selectedFormation === formation && styles.formationOptionTextActive
                  ]}>
                    {formation}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowTacticsModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>APPLY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Substitution Modal */}
      <Modal
        visible={showSubstitutionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubstitutionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SUBSTITUTIONS</Text>
              <TouchableOpacity onPress={() => setShowSubstitutionModal(false)}>
                <Ionicons name="close" size={24} color="#6a8aaa" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSectionTitle}>
              {substitutions.length}/3 substitutions made
            </Text>
            
            <ScrollView style={styles.subsList} showsVerticalScrollIndicator={false}>
              <Text style={styles.subsListTitle}>ON PITCH</Text>
              {currentSquad.map(player => (
                <TouchableOpacity 
                  key={player.id} 
                  style={[
                    styles.subPlayerRow,
                    selectedPlayerOut === player.id && styles.subPlayerRowSelected
                  ]}
                  onPress={() => handleSelectPlayerOut(player.id)}
                >
                  <View style={styles.subPlayerInfo}>
                    <Text style={styles.subPlayerPosition}>{player.position}</Text>
                    <Text style={styles.subPlayerName}>{player.name}</Text>
                    <Text style={styles.subPlayerAbility}>{player.current_ability}</Text>
                  </View>
                  {selectedPlayerOut === player.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#ff6b6b" />
                  )}
                </TouchableOpacity>
              ))}
              
              <Text style={[styles.subsListTitle, { marginTop: 16 }]}>BENCH</Text>
              {benchPlayers.map(player => (
                <TouchableOpacity 
                  key={player.id} 
                  style={styles.subPlayerRow}
                  onPress={() => handleMakeSubstitution(player.id)}
                  disabled={!selectedPlayerOut}
                >
                  <View style={styles.subPlayerInfo}>
                    <Text style={styles.subPlayerPosition}>{player.position}</Text>
                    <Text style={styles.subPlayerName}>{player.name}</Text>
                    <View style={styles.subAbility}>
                      <Text style={styles.subAbilityText}>{player.current_ability}</Text>
                    </View>
                  </View>
                  {selectedPlayerOut && (
                    <Ionicons name="arrow-up-circle" size={20} color="#00ff88" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.subsNote}>
              {selectedPlayerOut 
                ? 'Tap a bench player to bring them on'
                : 'Tap a player on the pitch to substitute them off'}
            </Text>

            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowSubstitutionModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Lineup Selection Modal - Enhanced with swap functionality */}
      <Modal
        visible={showLineupModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowLineupModal(false);
          setSelectedForSwap(null);
          setSwapMode(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SELECT LINEUP</Text>
              <TouchableOpacity onPress={() => {
                setShowLineupModal(false);
                setSelectedForSwap(null);
                setSwapMode(null);
              }}>
                <Ionicons name="close" size={24} color="#6a8aaa" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSectionTitle}>
              Starting XI: {currentSquad.length}/11 | Bench: {benchPlayers.length}
            </Text>
            
            {selectedForSwap && (
              <View style={styles.swapIndicator}>
                <Ionicons name="swap-horizontal" size={16} color="#00ff88" />
                <Text style={styles.swapIndicatorText}>
                  Tap another player to swap
                </Text>
              </View>
            )}
            
            <ScrollView style={styles.subsList} showsVerticalScrollIndicator={false}>
              <Text style={styles.subsListTitle}>STARTING XI</Text>
              {currentSquad.map((player, index) => (
                <TouchableOpacity 
                  key={player.id} 
                  style={[
                    styles.subPlayerRow,
                    selectedForSwap === player.id && styles.subPlayerRowSelected
                  ]}
                  onPress={() => handlePlayerSelect(player.id, true)}
                >
                  <View style={styles.lineupNumber}>
                    <Text style={styles.lineupNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.subPlayerInfo}>
                    <Text style={[
                      styles.subPlayerPosition,
                      selectedForSwap === player.id && { color: '#00ff88' }
                    ]}>{player.position}</Text>
                    <Text style={[
                      styles.subPlayerName,
                      selectedForSwap === player.id && { color: '#00ff88' }
                    ]}>{player.name}</Text>
                    <View style={[
                      styles.subAbility,
                      selectedForSwap === player.id && { backgroundColor: '#00ff8840' }
                    ]}>
                      <Text style={styles.subAbilityText}>{player.current_ability}</Text>
                    </View>
                  </View>
                  {selectedForSwap === player.id ? (
                    <Ionicons name="checkmark-circle" size={20} color="#00ff88" />
                  ) : selectedForSwap ? (
                    <Ionicons name="swap-horizontal" size={20} color="#4a9eff" />
                  ) : (
                    <Ionicons name="ellipsis-horizontal" size={20} color="#6a8aaa" />
                  )}
                </TouchableOpacity>
              ))}
              
              <Text style={[styles.subsListTitle, { marginTop: 16 }]}>BENCH</Text>
              {benchPlayers.map(player => (
                <TouchableOpacity 
                  key={player.id} 
                  style={[
                    styles.subPlayerRow,
                    selectedForSwap === player.id && styles.subPlayerRowSelected
                  ]}
                  onPress={() => handlePlayerSelect(player.id, false)}
                >
                  <View style={styles.subPlayerInfo}>
                    <Text style={[
                      styles.subPlayerPosition,
                      selectedForSwap === player.id && { color: '#00ff88' }
                    ]}>{player.position}</Text>
                    <Text style={[
                      styles.subPlayerName,
                      selectedForSwap === player.id && { color: '#00ff88' }
                    ]}>{player.name}</Text>
                    <View style={[
                      styles.subAbility,
                      selectedForSwap === player.id && { backgroundColor: '#00ff8840' }
                    ]}>
                      <Text style={styles.subAbilityText}>{player.current_ability}</Text>
                    </View>
                  </View>
                  {selectedForSwap === player.id ? (
                    <Ionicons name="checkmark-circle" size={20} color="#00ff88" />
                  ) : selectedForSwap && swapMode === 'starting' ? (
                    <Ionicons name="arrow-up-circle" size={20} color="#00ff88" />
                  ) : (
                    <Ionicons name="ellipsis-horizontal" size={20} color="#6a8aaa" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.subsNote}>
              {selectedForSwap 
                ? 'Tap another player to swap (any player can play any position)'
                : 'Tap a player to select, then tap another to swap'}
            </Text>

            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={handleConfirmLineup}
            >
              <Text style={styles.modalCloseButtonText}>CONFIRM LINEUP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
  },
  noMatchContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  noMatchText: {
    fontSize: 18,
    color: '#6a8aaa',
  },
  backButton: {
    backgroundColor: '#1a4a6c',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  // Scoreboard
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#0d2137',
    borderBottomWidth: 2,
    borderBottomColor: '#1a4a6c',
  },
  scoreboardTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  scoreboardTeamName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9ab8d8',
    flex: 1,
  },
  scoreboardTeamHighlight: {
    color: '#00ff88',
  },
  scoreboardScore: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    minWidth: 40,
    textAlign: 'center',
  },
  scoreboardCenter: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  minuteContainer: {
    alignItems: 'center',
  },
  minuteText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00ff88',
  },
  pausedText: {
    fontSize: 10,
    color: '#ff6b6b',
    fontWeight: '700',
    marginTop: 2,
  },
  fullTimeLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4a9eff',
  },
  vsText: {
    fontSize: 14,
    color: '#4a6a8a',
    fontWeight: '600',
  },
  // Formation comparison bar
  formationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0d1a28',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  formationTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  formationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ab8d8',
  },
  formationVs: {
    fontSize: 10,
    color: '#4a6a8a',
    fontWeight: '600',
  },
  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0d2137',
    borderBottomWidth: 2,
    borderBottomColor: '#1a4a6c',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#00ff88',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6a8aaa',
  },
  tabTextActive: {
    color: '#00ff88',
  },
  // Pause controls
  pauseControls: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#0d1a28',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  pauseControlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d2137',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  resumeButton: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  pauseControlText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  speedControls: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  speedLabel: {
    fontSize: 12,
    color: '#6a8aaa',
    marginBottom: 12,
  },
  speedButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  speedButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    backgroundColor: '#0d2137',
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  speedButtonActive: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  speedButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6a8aaa',
  },
  speedButtonTextActive: {
    color: '#0a1628',
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  // Pre-match
  preMatchContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  preMatchTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
  },
  preMatchSubtitle: {
    fontSize: 14,
    color: '#4a9eff',
  },
  preMatchInfo: {
    fontSize: 12,
    color: '#6a8aaa',
    marginTop: 8,
  },
  preMatchFormations: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 16,
  },
  preMatchFormationItem: {
    alignItems: 'center',
  },
  preMatchFormationTeam: {
    fontSize: 12,
    color: '#6a8aaa',
    marginBottom: 4,
  },
  preMatchFormationValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4a9eff',
  },
  preMatchFormationVs: {
    fontSize: 16,
    color: '#4a6a8a',
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ff88',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 8,
    gap: 12,
    marginTop: 24,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0a1628',
    letterSpacing: 2,
  },
  // Pitch view
  pitchViewContainer: {
    alignItems: 'center',
    padding: 16,
  },
  miniPitchContainer: {
    position: 'relative',
    backgroundColor: '#0d2137',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a4a6c',
    overflow: 'hidden',
    marginBottom: 20,
  },
  miniPitch: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a5a3f',
    position: 'relative',
  },
  centerLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#ffffff',
    opacity: 0.4,
  },
  centerCircle: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ffffff',
    opacity: 0.4,
  },
  penaltyBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ffffff',
    opacity: 0.4,
  },
  penaltyBoxTop: {
    top: 0,
  },
  penaltyBoxBottom: {
    bottom: 0,
  },
  miniPlayerDot: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  homePlayerDot: {
    backgroundColor: '#4a9eff',
  },
  awayPlayerDot: {
    backgroundColor: '#ff9f43',
  },
  miniPlayerLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: '#fff',
  },
  homePlayerLabel: {
    color: '#fff',
  },
  awayPlayerLabel: {
    color: '#fff',
  },
  ballIndicator: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffcc00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  latestEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a4a6c',
    width: '100%',
  },
  latestEventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  latestEventContent: {
    flex: 1,
  },
  latestEventMinute: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4a9eff',
    marginBottom: 2,
  },
  latestEventTeam: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6a8aaa',
    marginBottom: 4,
  },
  latestEventDescription: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  // Commentary view
  commentaryContent: {
    padding: 16,
    paddingBottom: 100,
  },
  kickoffEvent: {
    backgroundColor: '#1a4a3c',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  kickoffText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00ff88',
    letterSpacing: 2,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#0d2137',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  eventMinute: {
    width: 36,
  },
  eventMinuteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4a9eff',
  },
  eventIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTeam: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6a8aaa',
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: 13,
    color: '#fff',
    lineHeight: 18,
  },
  fullTimeEvent: {
    backgroundColor: '#1a3a5c',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  fullTimeText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
  },
  finalScore: {
    fontSize: 32,
    fontWeight: '900',
    color: '#00ff88',
    marginTop: 8,
  },
  // Stats view
  statsContainer: {
    padding: 16,
  },
  statItem: {
    marginBottom: 24,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6a8aaa',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  statBarContainer: {
    flexDirection: 'row',
    height: 8,
    backgroundColor: '#1a3a5c',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBar: {
    height: '100%',
  },
  homeStatBar: {
    backgroundColor: '#4a9eff',
  },
  awayStatBar: {
    backgroundColor: '#ff9f43',
  },
  // Footer
  liveFooter: {
    padding: 16,
    backgroundColor: '#0d2137',
    borderTopWidth: 1,
    borderTopColor: '#1a4a6c',
    gap: 12,
  },
  liveControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    gap: 6,
  },
  pauseButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#1a3a5c',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ff88',
  },
  postFooter: {
    padding: 16,
    backgroundColor: '#0d2137',
    borderTopWidth: 1,
    borderTopColor: '#1a4a6c',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ff88',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a1628',
    letterSpacing: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0d2137',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6a8aaa',
    marginBottom: 12,
  },
  formationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  formationOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#0a1628',
    borderWidth: 2,
    borderColor: '#1a4a6c',
  },
  formationOptionActive: {
    borderColor: '#00ff88',
    backgroundColor: '#1a4a3c',
  },
  formationOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6a8aaa',
  },
  formationOptionTextActive: {
    color: '#00ff88',
  },
  subsList: {
    maxHeight: 300,
  },
  subsListTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4a9eff',
    marginBottom: 8,
  },
  subPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a1628',
    padding: 12,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  subPlayerRowSelected: {
    borderColor: '#ff6b6b',
    backgroundColor: '#2a1628',
  },
  subPlayerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subPlayerPosition: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4a9eff',
    width: 30,
  },
  subPlayerName: {
    fontSize: 13,
    color: '#fff',
    flex: 1,
  },
  subPlayerAbility: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6a8aaa',
  },
  subButton: {
    padding: 8,
  },
  subAbility: {
    backgroundColor: '#1a4a3c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  subAbilityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00ff88',
  },
  subsNote: {
    fontSize: 11,
    color: '#4a6a8a',
    textAlign: 'center',
    marginVertical: 12,
    fontStyle: 'italic',
  },
  modalCloseButton: {
    backgroundColor: '#00ff88',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0a1628',
    letterSpacing: 1,
  },
  selectTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a9eff',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 8,
    gap: 12,
    marginTop: 24,
  },
  selectTeamButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0a1628',
    letterSpacing: 2,
  },
  lineupConfirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a4a3c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
  },
  lineupConfirmedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00ff88',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6a8aaa',
    fontWeight: '600',
  },
  // Swap indicator styles
  swapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a4a3c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  swapIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00ff88',
  },
  lineupNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1a3a5c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  lineupNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6a8aaa',
  },
  // Phase 2 Styles
  momentumSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a3a5c',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00ff88',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  momentumBar: {
    marginBottom: 12,
  },
  momentumLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  momentumLabelHome: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4a9eff',
  },
  momentumLabelAway: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  momentumBarTrack: {
    height: 6,
    backgroundColor: '#0d2137',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  momentumBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  momentumTimeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 8,
  },
  momentumPoint: {
    alignItems: 'center',
    gap: 2,
  },
  momentumDotHome: {
    width: 4,
    backgroundColor: '#4a9eff',
    borderRadius: 2,
  },
  momentumMinute: {
    fontSize: 8,
    color: '#4a6a8a',
  },
  momentumDotAway: {
    width: 4,
    backgroundColor: '#ff6b6b',
    borderRadius: 2,
  },
  ratingsSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a3a5c',
  },
  ratingsTeamName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8ab4d8',
    marginBottom: 8,
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0d213720',
  },
  ratingPosition: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6a8aaa',
    width: 28,
    textAlign: 'center',
  },
  ratingPlayerName: {
    flex: 1,
    fontSize: 12,
    color: '#d0e8ff',
    marginLeft: 8,
  },
  ratingBadge: {
    width: 36,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '800',
  },
});
