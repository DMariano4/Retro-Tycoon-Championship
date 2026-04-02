import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Alert, ActivityIndicator, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame, Player } from '../src/context/GameContext';
import { getSeverityColor } from '../src/utils/formatters';
import { 
  matchStyles as styles,
  selectStartingXI, 
  FORMATION_POSITIONS, 
  FORMATION_REQUIREMENTS, 
  POSITION_COMPATIBILITY, 
  POSITION_GROUPS,
  getEventIcon,
  getEventColor,
  getRatingColor,
  getRatingBgColor,
  MiniPitch,
  WeekSimulationModal,
  TacticsModal,
  SubstitutionModal,
  LineupModal,
} from '../src/components/match';
import { PitchLineupSelector } from '../src/components/match/PitchLineupSelector';

const { width } = Dimensions.get('window');

type MatchState = 'pre' | 'live' | 'paused' | 'post';
type MatchTab = 'pitch' | 'commentary' | 'stats';

// Formations available
const formations = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '5-3-2', '4-5-1', '4-1-4-1', '3-4-3'];

export default function MatchScreen() {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const { currentSave, getManagedTeam, getLeague, simulateMatch, simulateOtherWeekMatches, finalizeWeekSimulation, saveGame, updateFormation, advanceWeek, isSeasonComplete, getNextEvent, processCupMatchResult } = useGame();
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
  const [isSimulatingWeek, setIsSimulatingWeek] = useState(false);
  const [simProgress, setSimProgress] = useState({ current: 0, total: 0, leagueName: '' });
  const [matchInjuries, setMatchInjuries] = useState<any[]>([]);
  const [currentGameEvent, setCurrentGameEvent] = useState<any>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [isReady, setIsReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isStartingMatch, setIsStartingMatch] = useState(false); // Prevent double-click
  const [matchResultState, setMatchResultState] = useState<{ updatedLeagues: any[]; updatedTeams: any[] } | null>(null);

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
    redCards: { home: 0, away: 0 },
  });

  const managedTeam = getManagedTeam();
  const league = getLeague();

  // Get fixture from event system or fallback to legacy league fixtures
  const getFixture = useCallback(() => {
    // If we have an eventId, find the event and get fixture from event data
    if (eventId && currentSave?.events) {
      const event = currentSave.events.find(e => e.id === eventId);
      if (event?.type === 'match' && event.data) {
        return event.data;
      }
    }
    
    // Fallback: Get next event from event system
    const nextEvent = getNextEvent();
    if (nextEvent?.type === 'match' && nextEvent.data) {
      return nextEvent.data;
    }
    
    // Legacy fallback: find fixture from league
    return league?.fixtures.find(
      f => !f.played && (f.home_team_id === managedTeam?.id || f.away_team_id === managedTeam?.id)
    );
  }, [eventId, currentSave, getNextEvent, league, managedTeam]);

  const fixture = getFixture();
  
  // Track current game event for completion
  useEffect(() => {
    if (eventId && currentSave?.events) {
      const event = currentSave.events.find(e => e.id === eventId);
      setCurrentGameEvent(event);
    } else {
      const nextEvent = getNextEvent();
      if (nextEvent?.type === 'match') {
        setCurrentGameEvent(nextEvent);
      }
    }
  }, [eventId, currentSave, getNextEvent]);

  useEffect(() => {
    if (managedTeam) {
      setSelectedFormation(managedTeam.formation);
      // Initialize current squad with proper starting XI based on formation
      const startingXI = selectStartingXI(managedTeam.squad as any, managedTeam.formation || '4-4-2');
      const startingIds = new Set(startingXI.map(p => p.id));
      const bench = managedTeam.squad.filter(p => !startingIds.has(p.id));
      setCurrentSquad(startingXI as Player[]);
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
        
        // Update scores - handle all goal types
        const isGoalEvent = ['GOAL', 'PENALTY_GOAL', 'OWN_GOAL'].includes(nextEvent.type);
        if (isGoalEvent) {
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
          
          if (isGoalEvent || nextEvent.type === 'CHANCE') {
            newStats.shots = {
              home: isHome ? prev.shots.home + 1 : prev.shots.home,
              away: !isHome ? prev.shots.away + 1 : prev.shots.away,
            };
          }
          
          if (isGoalEvent || nextEvent.type === 'SAVE') {
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
          
          if (nextEvent.type === 'RED_CARD' || nextEvent.type === 'SECOND_YELLOW') {
            newStats.redCards = {
              home: isHome ? prev.redCards.home + 1 : prev.redCards.home,
              away: !isHome ? prev.redCards.away + 1 : prev.redCards.away,
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
    // Prevent double-clicking
    if (isStartingMatch) {
      console.log('Match already starting, ignoring click');
      return;
    }
    
    if (!fixture) {
      console.log('No fixture found!');
      Alert.alert('Error', 'No match fixture found. Please go back and try again.');
      return;
    }
    
    // Get the fixture ID - handle both 'id' and other potential field names
    const fixtureId = fixture.id || fixture.fixture_id;
    if (!fixtureId) {
      console.log('No fixture ID found!', fixture);
      Alert.alert('Error', 'Match fixture is missing ID. Please go back and try again.');
      return;
    }
    
    // Check if fixture is already played
    if (fixture.played) {
      console.log('Fixture already played!');
      Alert.alert('Match Played', 'This match has already been played.');
      return;
    }
    
    setIsStartingMatch(true);
    
    // Always start with speed 1 - user can change it during the match
    setSpeed(1);
    
    console.log('Starting match with fixture:', fixtureId, 'speed: 1 (default)');
    
    try {
      const result = await simulateMatch(fixtureId, 1); // Always use speed 1 for simulation
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

        // Phase 3: Store injuries from match result
        if (result.injuries && result.injuries.length > 0) {
          setMatchInjuries(result.injuries);
        }
        
        // Store the updated leagues/teams for simulateOtherWeekMatches
        if (result.updatedLeagues && result.updatedTeams) {
          setMatchResultState({
            updatedLeagues: result.updatedLeagues,
            updatedTeams: result.updatedTeams,
          });
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
          redCards: result.stats.redCards || { home: 0, away: 0 },
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
          redCards: { home: 0, away: 0 },
        });
      }
    } else {
      // Match simulation failed
      console.log('Match simulation returned null');
      Alert.alert('Error', 'Failed to start match. The fixture may have already been played.');
      setIsStartingMatch(false);
    }
    } catch (error) {
      console.error('Error starting match:', error);
      Alert.alert('Error', 'An error occurred while starting the match.');
      setIsStartingMatch(false);
    }
  };

  const handlePause = () => {
    setMatchState('paused');
  };

  const handleResume = () => {
    setMatchState('live');
  };

  const handleFinish = async () => {
    // Show loading screen first
    const league = getLeague();
    const totalLeagues = currentSave?.leagues.length || 1;
    // Each league has ~9-10 AI matches per week
    const estimatedMatches = totalLeagues * 9;
    setSimProgress({ current: 0, total: estimatedMatches, leagueName: league?.name || 'League' });
    setIsSimulatingWeek(true);

    // Defer simulation to next tick so loading screen renders
    setTimeout(async () => {
      try {
        // P1: Process cup match result if this is a cup match
        if (fixture?.match_type === 'cup' && fixture?.cupId) {
          processCupMatchResult(fixture.cupId, fixture.id, homeScore, awayScore);
        }
        
        // Simulate all other matches and get the result
        // Pass the already-updated state from simulateMatch to avoid timing issues
        let simResult;
        if (matchResultState) {
          simResult = simulateOtherWeekMatches(matchResultState.updatedLeagues, matchResultState.updatedTeams);
        } else {
          // Fallback - call without parameters (may have timing issues)
          console.warn('matchResultState not available, calling simulateOtherWeekMatches without state');
          simResult = simulateOtherWeekMatches();
        }
        
        // Apply the simulation results and save
        // Also mark the current game event as completed
        if (simResult) {
          const eventIdToComplete = currentGameEvent?.id;
          finalizeWeekSimulation(simResult.leagues, simResult.teams, simResult.gameDate, eventIdToComplete);
        } else {
          console.error('simulateOtherWeekMatches returned null');
        }
      } catch (e) {
        console.error('Error simulating week:', e);
      }
      // Brief delay so the user sees the completion state
      setTimeout(() => {
        setIsSimulatingWeek(false);
        // Check if season is complete after simulating this week
        if (isSeasonComplete()) {
          router.replace('/season-end');
        } else {
          router.replace('/game');
        }
      }, 800);
    }, 300);
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
    console.log('handleConfirmLineup called', { squadLength: currentSquad.length, benchLength: benchPlayers.length });
    if (currentSquad.length !== 11) {
      Alert.alert('Invalid Lineup', `You must select exactly 11 players. Current: ${currentSquad.length}`);
      return;
    }
    // Allow any number of bench players - squads typically have 24+ players
    console.log('Setting lineup confirmed and closing modal');
    setLineupConfirmed(true);
    setShowLineupModal(false);
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

      {/* Live Match Controls Bar - Always visible during play */}
      {matchState === 'live' && (
        <View style={styles.liveControlBar}>
          {/* Left side - Pause button */}
          <TouchableOpacity 
            style={styles.liveControlButton}
            onPress={handlePause}
          >
            <Ionicons name="pause" size={16} color="#fff" />
            <Text style={styles.liveControlText}>PAUSE</Text>
          </TouchableOpacity>
          
          {/* Center - Tactics & Subs (auto-pause when pressed) */}
          <View style={styles.liveQuickActions}>
            <TouchableOpacity 
              style={styles.liveQuickButton}
              onPress={() => {
                handlePause();
                setShowTacticsModal(true);
              }}
            >
              <Ionicons name="clipboard-outline" size={16} color="#4a9eff" />
              <Text style={[styles.liveControlText, { color: '#4a9eff' }]}>TACTICS</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.liveQuickButton}
              onPress={() => {
                handlePause();
                setShowSubstitutionModal(true);
              }}
            >
              <Ionicons name="swap-horizontal" size={16} color="#00ff88" />
              <Text style={[styles.liveControlText, { color: '#00ff88' }]}>SUBS</Text>
            </TouchableOpacity>
          </View>
          
          {/* Right side - Speed control */}
          <View style={styles.liveSpeedControl}>
            {[1, 2, 4, 10].map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.liveSpeedButton, speed === s && styles.liveSpeedButtonActive]}
                onPress={() => setSpeed(s)}
              >
                <Text style={[styles.liveSpeedText, speed === s && styles.liveSpeedTextActive]}>
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
          <ScrollView 
            style={styles.preMatchScrollView} 
            contentContainerStyle={styles.preMatchScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.preMatchHeader}>
              <Text style={styles.preMatchInstructions}>Select your formation and starting eleven</Text>
            </View>

            {/* Visual Pitch Lineup Selector */}
            <View style={styles.lineupSelectorContainer}>
              <PitchLineupSelector
                team={managedTeam}
                formation={selectedFormation}
                selectedLineup={currentSquad}
                onLineupChange={(lineup) => {
                  setCurrentSquad(lineup);
                  // Update bench with remaining players
                  const selectedIds = new Set(lineup.filter(p => p).map(p => p.id));
                  const newBench = managedTeam.squad.filter(p => !selectedIds.has(p.id));
                  setBenchPlayers(newBench);
                  // Auto-confirm when 11 players selected
                  if (lineup.filter(p => p).length === 11) {
                    setLineupConfirmed(true);
                  } else {
                    setLineupConfirmed(false);
                  }
                }}
                onFormationChange={(formation) => {
                  setSelectedFormation(formation);
                  updateFormation(formation, {});
                }}
              />
            </View>

            {/* Opponent Info */}
            <View style={styles.opponentInfoCard}>
              <View>
                <Text style={styles.opponentLabel}>VS</Text>
                <Text style={styles.opponentName}>
                  {isHome ? awayTeam?.name : homeTeam?.name}
                </Text>
              </View>
              <View style={styles.opponentStats}>
                <Ionicons name="grid-outline" size={12} color="#4a9eff" />
                <Text style={styles.opponentStatText}>
                  {isHome ? awayTeam?.formation : homeTeam?.formation || '4-4-2'}
                </Text>
              </View>
            </View>

            {/* Kick Off Button */}
            <View style={styles.kickOffContainer}>
              {lineupConfirmed ? (
                <Pressable 
                  style={[styles.startButton, isStartingMatch && { opacity: 0.6 }]} 
                  onPress={handleStartMatch}
                  disabled={isStartingMatch}
                  {...(Platform.OS === 'web' ? { onClick: isStartingMatch ? undefined : handleStartMatch } : {})}
                  accessibilityRole="button"
                >
                  {isStartingMatch ? (
                    <ActivityIndicator size="small" color="#0a1628" />
                  ) : (
                    <Ionicons name="play" size={20} color="#0a1628" />
                  )}
                  <Text style={styles.startButtonText}>
                    {isStartingMatch ? 'STARTING...' : 'KICK OFF'}
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.selectLineupHint}>
                  <Ionicons name="information-circle-outline" size={16} color="#6a8aaa" />
                  <Text style={styles.selectLineupHintText}>
                    Select 11 players or tap AUTO to fill lineup
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        ) : (
          <>
            {/* Pitch View */}
            {activeTab === 'pitch' && (
              <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
                <View style={styles.pitchViewContainer}>
                  {/* Container to match pitch and commentary width */}
                  <View style={{ width: Math.min(width - 32, 360) * 0.75, alignSelf: 'center' }}>
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
                            size={16} 
                            color={getEventColor(lastEvent.type)} 
                          />
                        </View>
                        <View style={styles.latestEventContent}>
                          <Text style={styles.latestEventMinute}>{lastEvent.minute}'</Text>
                          <Text style={styles.latestEventTeam}>{lastEvent.team}</Text>
                          <Text style={styles.latestEventDescription} numberOfLines={2}>{lastEvent.description}</Text>
                        </View>
                      </View>
                    )}
                  </View>
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
                <View style={styles.statsContainerCompact}>
                  {/* Possession */}
                  <View style={styles.statItemCompact}>
                    <View style={styles.statHeader}>
                      <Text style={styles.statValueCompact}>{matchStats.possession.home}%</Text>
                      <Text style={styles.statLabelCompact}>POSSESSION</Text>
                      <Text style={styles.statValueCompact}>{matchStats.possession.away}%</Text>
                    </View>
                    <View style={styles.statBarContainer}>
                      <View style={[styles.statBar, styles.homeStatBar, { width: `${matchStats.possession.home}%` }]} />
                      <View style={[styles.statBar, styles.awayStatBar, { width: `${matchStats.possession.away}%` }]} />
                    </View>
                  </View>

                  {/* Shots */}
                  <View style={styles.statItemCompact}>
                    <View style={styles.statHeader}>
                      <Text style={styles.statValueCompact}>{matchStats.shots.home}</Text>
                      <Text style={styles.statLabelCompact}>SHOTS</Text>
                      <Text style={styles.statValueCompact}>{matchStats.shots.away}</Text>
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
                  <View style={styles.statItemCompact}>
                    <View style={styles.statHeader}>
                      <Text style={styles.statValueCompact}>{matchStats.shotsOnTarget.home}</Text>
                      <Text style={styles.statLabelCompact}>ON TARGET</Text>
                      <Text style={styles.statValueCompact}>{matchStats.shotsOnTarget.away}</Text>
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
                  <View style={styles.statItemCompact}>
                    <View style={styles.statHeader}>
                      <Text style={styles.statValueCompact}>{matchStats.corners.home}</Text>
                      <Text style={styles.statLabelCompact}>CORNERS</Text>
                      <Text style={styles.statValueCompact}>{matchStats.corners.away}</Text>
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
                  <View style={styles.statItemCompact}>
                    <View style={styles.statHeader}>
                      <Text style={styles.statValueCompact}>{matchStats.fouls.home}</Text>
                      <Text style={styles.statLabelCompact}>FOULS</Text>
                      <Text style={styles.statValueCompact}>{matchStats.fouls.away}</Text>
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
                  <View style={styles.statItemCompact}>
                    <View style={styles.statHeader}>
                      <Text style={styles.statValueCompact}>{matchStats.yellowCards.home}</Text>
                      <Text style={styles.statLabelCompact}>YELLOW CARDS</Text>
                      <Text style={styles.statValueCompact}>{matchStats.yellowCards.away}</Text>
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

                  {/* Red Cards */}
                  <View style={styles.statItemCompact}>
                    <View style={styles.statHeader}>
                      <Text style={styles.statValueCompact}>{matchStats.redCards.home}</Text>
                      <Text style={styles.statLabelCompact}>RED CARDS</Text>
                      <Text style={styles.statValueCompact}>{matchStats.redCards.away}</Text>
                    </View>
                    <View style={styles.statBarContainer}>
                      <View style={[styles.statBar, { backgroundColor: '#ff3b30' }, { 
                        width: `${(matchStats.redCards.home / Math.max(matchStats.redCards.home + matchStats.redCards.away, 1)) * 100}%` 
                      }]} />
                      <View style={[styles.statBar, { backgroundColor: '#cc0000' }, { 
                        width: `${(matchStats.redCards.away / Math.max(matchStats.redCards.home + matchStats.redCards.away, 1)) * 100}%` 
                      }]} />
                    </View>
                  </View>

                  {matchState === 'post' && Object.keys(playerRatings).length > 0 && (
                    <View style={styles.ratingsSectionCompact}>
                      <Text style={styles.sectionTitleCompact}>PLAYER RATINGS</Text>
                      
                      {/* Home Team Ratings */}
                      <Text style={styles.ratingsTeamNameCompact}>{homeTeam?.name}</Text>
                      {homeTeam?.squad
                        .filter(player => playerRatings[player.id] !== undefined)
                        .sort((a, b) => {
                          const posOrder: Record<string, number> = { 'GK': 0, 'CB': 1, 'LB': 2, 'RB': 3, 'LWB': 2, 'RWB': 3, 'DM': 4, 'CM': 5, 'LM': 6, 'RM': 7, 'AM': 8, 'LW': 9, 'RW': 10, 'ST': 11 };
                          return (posOrder[a.position] ?? 6) - (posOrder[b.position] ?? 6);
                        })
                        .map(player => {
                        const rating = playerRatings[player.id];
                        // Count goals and assists from match events
                        const playerGoals = events.filter(e => 
                          (e.type === 'GOAL' || e.type === 'PENALTY_GOAL') && 
                          e.player === player.name && 
                          e.team === homeTeam?.short_name
                        ).length;
                        const playerAssists = events.filter(e => 
                          (e.type === 'GOAL' || e.type === 'PENALTY_GOAL') && 
                          e.assistPlayer === player.name && 
                          e.team === homeTeam?.short_name
                        ).length;
                        return (
                          <View key={player.id} style={styles.ratingRowCompact}>
                            <Text style={styles.ratingPositionCompact}>{player.position}</Text>
                            <Text style={styles.ratingPlayerNameCompact} numberOfLines={1}>{player.name}</Text>
                            <View style={styles.ratingRightSection}>
                              {playerGoals > 0 && (
                                <View style={styles.goalAssistBadge}>
                                  <Ionicons name="football" size={10} color="#00ff88" />
                                  {playerGoals > 1 && <Text style={styles.goalAssistCount}>{playerGoals}</Text>}
                                </View>
                              )}
                              {playerAssists > 0 && (
                                <View style={styles.goalAssistBadge}>
                                  <Ionicons name="footsteps" size={10} color="#4a9eff" />
                                  {playerAssists > 1 && <Text style={styles.goalAssistCount}>{playerAssists}</Text>}
                                </View>
                              )}
                              <View style={[styles.ratingBadgeCompact, { 
                                backgroundColor: rating >= 7.5 ? '#00ff88' : rating >= 6.5 ? '#ffcc00' : rating >= 5.5 ? '#ff9f43' : '#ff6b6b'
                              }]}>
                                <Text style={[styles.ratingValueCompact, {
                                  color: rating >= 7.5 ? '#0a1628' : rating >= 6.5 ? '#0a1628' : '#fff'
                                }]}>{rating.toFixed(1)}</Text>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                      
                      {/* Away Team Ratings */}
                      <Text style={[styles.ratingsTeamNameCompact, { marginTop: 10 }]}>{awayTeam?.name}</Text>
                      {awayTeam?.squad
                        .filter(player => playerRatings[player.id] !== undefined)
                        .sort((a, b) => {
                          const posOrder: Record<string, number> = { 'GK': 0, 'CB': 1, 'LB': 2, 'RB': 3, 'LWB': 2, 'RWB': 3, 'DM': 4, 'CM': 5, 'LM': 6, 'RM': 7, 'AM': 8, 'LW': 9, 'RW': 10, 'ST': 11 };
                          return (posOrder[a.position] ?? 6) - (posOrder[b.position] ?? 6);
                        })
                        .map(player => {
                        const rating = playerRatings[player.id];
                        // Count goals and assists from match events
                        const playerGoals = events.filter(e => 
                          (e.type === 'GOAL' || e.type === 'PENALTY_GOAL') && 
                          e.player === player.name && 
                          e.team === awayTeam?.short_name
                        ).length;
                        const playerAssists = events.filter(e => 
                          (e.type === 'GOAL' || e.type === 'PENALTY_GOAL') && 
                          e.assistPlayer === player.name && 
                          e.team === awayTeam?.short_name
                        ).length;
                        return (
                          <View key={player.id} style={styles.ratingRowCompact}>
                            <Text style={styles.ratingPositionCompact}>{player.position}</Text>
                            <Text style={styles.ratingPlayerNameCompact} numberOfLines={1}>{player.name}</Text>
                            <View style={styles.ratingRightSection}>
                              {playerGoals > 0 && (
                                <View style={styles.goalAssistBadge}>
                                  <Ionicons name="football" size={10} color="#00ff88" />
                                  {playerGoals > 1 && <Text style={styles.goalAssistCount}>{playerGoals}</Text>}
                                </View>
                              )}
                              {playerAssists > 0 && (
                                <View style={styles.goalAssistBadge}>
                                  <Ionicons name="footsteps" size={10} color="#4a9eff" />
                                  {playerAssists > 1 && <Text style={styles.goalAssistCount}>{playerAssists}</Text>}
                                </View>
                              )}
                              <View style={[styles.ratingBadgeCompact, { 
                                backgroundColor: rating >= 7.5 ? '#00ff88' : rating >= 6.5 ? '#ffcc00' : rating >= 5.5 ? '#ff9f43' : '#ff6b6b'
                              }]}>
                                <Text style={[styles.ratingValueCompact, {
                                  color: rating >= 7.5 ? '#0a1628' : rating >= 6.5 ? '#0a1628' : '#fff'
                                }]}>{rating.toFixed(1)}</Text>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Phase 3: Injury Report */}
                  {matchState === 'post' && matchInjuries.length > 0 && (
                    <View style={styles.ratingsSection}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Ionicons name="medkit" size={18} color="#ff3b30" style={{ marginRight: 8 }} />
                        <Text style={[styles.sectionTitle, { color: '#ff3b30', marginBottom: 0 }]}>INJURY REPORT</Text>
                      </View>
                      {matchInjuries.map((injury: any, index: number) => {
                        const isUserTeam = injury.teamId === managedTeam?.id;
                        const severityColor = injury.severity === 'Minor' ? '#ffd700' :
                          injury.severity === 'Moderate' ? '#ff9500' :
                          injury.severity === 'Serious' ? '#ff6b35' :
                          injury.severity === 'Severe' ? '#ff3b30' : '#cc0000';
                        return (
                          <View key={`injury_${index}`} style={[styles.ratingRow, { borderLeftWidth: 3, borderLeftColor: severityColor }]}>
                            <Ionicons name="medkit" size={14} color={severityColor} style={{ marginRight: 6 }} />
                            <Text style={[styles.ratingPlayerName, { color: isUserTeam ? '#ff6b6b' : '#6a8aaa' }]} numberOfLines={1}>
                              {injury.playerName}
                            </Text>
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                              <Text style={{ color: severityColor, fontSize: 11, fontWeight: '700' }}>{injury.type}</Text>
                              <Text style={{ color: '#6a8aaa', fontSize: 10 }}>
                                {injury.recoveryWeeks === 0 ? 'Day-to-day' : injury.recoveryWeeks === 1 ? '1 week out' : `${injury.recoveryWeeks} weeks out`}
                              </Text>
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

      {/* Footer - Progress bar only (controls are at top) */}
      {matchState === 'live' && (
        <View style={styles.liveFooter}>
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

      {/* Week Simulation Loading Screen */}
      <WeekSimulationModal
        visible={isSimulatingWeek}
        currentWeek={getLeague()?.current_week || 0}
        leagueCount={currentSave?.leagues.length || 1}
      />

      {/* Tactics Modal */}
      <TacticsModal
        visible={showTacticsModal}
        selectedFormation={selectedFormation}
        onClose={() => setShowTacticsModal(false)}
        onFormationChange={handleFormationChange}
      />

      {/* Substitution Modal */}
      <SubstitutionModal
        visible={showSubstitutionModal}
        currentSquad={currentSquad}
        benchPlayers={benchPlayers}
        substitutions={substitutions}
        selectedPlayerOut={selectedPlayerOut}
        onClose={() => setShowSubstitutionModal(false)}
        onSelectPlayerOut={handleSelectPlayerOut}
        onMakeSubstitution={handleMakeSubstitution}
      />

      {/* LineupModal no longer used - replaced by inline PitchLineupSelector */}
    </SafeAreaView>
  );
}

