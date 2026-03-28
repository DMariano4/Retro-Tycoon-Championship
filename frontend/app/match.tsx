import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Dimensions, Alert, ActivityIndicator, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame, Player, Team } from '../src/context/GameContext';
import { getSeverityColor } from '../src/utils/formatters';
import { matchStyles as styles } from '../src/components/match/matchStyles';
import { 
  selectStartingXI, 
  FORMATION_POSITIONS, 
  FORMATION_REQUIREMENTS, 
  POSITION_COMPATIBILITY, 
  POSITION_GROUPS,
  getEventIcon,
  getEventColor,
  getRatingColor,
  getRatingBgColor,
} from '../src/components/match/matchHelpers';

const { width } = Dimensions.get('window');

type MatchState = 'pre' | 'live' | 'paused' | 'post';
type MatchTab = 'pitch' | 'commentary' | 'stats';

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
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const { currentSave, getManagedTeam, getLeague, simulateMatch, simulateOtherWeekMatches, saveGame, updateFormation, advanceWeek, isSeasonComplete, getNextEvent, processEvent } = useGame();
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

      // Phase 3: Store injuries from match result
      if (result.injuries && result.injuries.length > 0) {
        setMatchInjuries(result.injuries);
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
        // Mark the current game event as completed (Event-Driven Calendar system)
        if (currentGameEvent) {
          processEvent(currentGameEvent);
        }
        
        // Simulate all other matches and advance week
        simulateOtherWeekMatches();
        // Save game
        await saveGame(false);
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
                <Pressable 
                  style={styles.startButton} 
                  onPress={handleStartMatch}
                  {...(Platform.OS === 'web' ? { onClick: handleStartMatch } : {})}
                  accessibilityRole="button"
                >
                  <Ionicons name="play" size={20} color="#0a1628" />
                  <Text style={styles.startButtonText}>KICK OFF</Text>
                </Pressable>
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

                  {matchState === 'post' && Object.keys(playerRatings).length > 0 && (
                    <View style={styles.ratingsSection}>
                      <Text style={styles.sectionTitle}>PLAYER RATINGS</Text>
                      
                      {/* Home Team Ratings */}
                      <Text style={styles.ratingsTeamName}>{homeTeam?.name}</Text>
                      {homeTeam?.squad
                        .filter(player => playerRatings[player.id] !== undefined)
                        .sort((a, b) => {
                          const posOrder: Record<string, number> = { 'GK': 0, 'CB': 1, 'LB': 2, 'RB': 3, 'LWB': 2, 'RWB': 3, 'DM': 4, 'CM': 5, 'LM': 6, 'RM': 7, 'AM': 8, 'LW': 9, 'RW': 10, 'ST': 11 };
                          return (posOrder[a.position] ?? 6) - (posOrder[b.position] ?? 6);
                        })
                        .map(player => {
                        const rating = playerRatings[player.id];
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
                      {awayTeam?.squad
                        .filter(player => playerRatings[player.id] !== undefined)
                        .sort((a, b) => {
                          const posOrder: Record<string, number> = { 'GK': 0, 'CB': 1, 'LB': 2, 'RB': 3, 'LWB': 2, 'RWB': 3, 'DM': 4, 'CM': 5, 'LM': 6, 'RM': 7, 'AM': 8, 'LW': 9, 'RW': 10, 'ST': 11 };
                          return (posOrder[a.position] ?? 6) - (posOrder[b.position] ?? 6);
                        })
                        .map(player => {
                        const rating = playerRatings[player.id];
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

      {/* Week Simulation Loading Screen */}
      <Modal
        visible={isSimulatingWeek}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.simLoadingOverlay}>
          <View style={styles.simLoadingContainer}>
            {/* Retro screen border */}
            <View style={styles.simLoadingScreen}>
              {/* Header */}
              <View style={styles.simLoadingHeader}>
                <Ionicons name="football" size={24} color="#00ff88" />
                <Text style={styles.simLoadingTitle}>SIMULATING MATCHES</Text>
                <Ionicons name="football" size={24} color="#00ff88" />
              </View>

              {/* Week info */}
              <Text style={styles.simLoadingWeek}>
                Week {getLeague()?.current_week || 0} Results
              </Text>

              {/* Animated dots */}
              <View style={styles.simLoadingDots}>
                <Text style={styles.simLoadingDotsText}>Processing league fixtures . . .</Text>
              </View>

              {/* Retro progress bar */}
              <View style={styles.simProgressContainer}>
                <View style={styles.simProgressTrack}>
                  <View style={[styles.simProgressFill, { width: '100%' }]} />
                </View>
                <Text style={styles.simProgressText}>
                  {currentSave?.leagues.length || 1} league{(currentSave?.leagues.length || 1) > 1 ? 's' : ''} · ~{(currentSave?.leagues.length || 1) * 9} matches
                </Text>
              </View>

              {/* Spinner */}
              <ActivityIndicator size="large" color="#00ff88" style={{ marginTop: 16 }} />

              {/* Retro footer */}
              <Text style={styles.simLoadingFooter}>Please wait...</Text>
            </View>
          </View>
        </View>
      </Modal>

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
              {benchPlayers.map(player => {
                const isInjured = player.injury && player.injury.recoveryWeeks > 0;
                return (
                <TouchableOpacity 
                  key={player.id} 
                  style={[
                    styles.subPlayerRow,
                    selectedForSwap === player.id && styles.subPlayerRowSelected,
                    isInjured && { opacity: 0.5, borderLeftWidth: 3, borderLeftColor: '#ff3b30' }
                  ]}
                  onPress={() => {
                    if (isInjured) {
                      Alert.alert('Player Injured', `${player.name} is injured (${player.injury?.type}) and unavailable for ${player.injury?.recoveryWeeks} week(s).`);
                      return;
                    }
                    handlePlayerSelect(player.id, false);
                  }}
                >
                  <View style={styles.subPlayerInfo}>
                    <Text style={[
                      styles.subPlayerPosition,
                      selectedForSwap === player.id && { color: '#00ff88' },
                      isInjured && { color: '#ff6b6b' }
                    ]}>{player.position}</Text>
                    <Text style={[
                      styles.subPlayerName,
                      selectedForSwap === player.id && { color: '#00ff88' },
                      isInjured && { color: '#ff6b6b' }
                    ]}>{player.name}</Text>
                    {isInjured && (
                      <Ionicons name="medkit" size={12} color="#ff3b30" style={{ marginLeft: 4, marginRight: 2 }} />
                    )}
                    <View style={[
                      styles.subAbility,
                      selectedForSwap === player.id && { backgroundColor: '#00ff8840' },
                      isInjured && { backgroundColor: 'rgba(255, 59, 48, 0.2)' }
                    ]}>
                      <Text style={[styles.subAbilityText, isInjured && { color: '#ff6b6b' }]}>
                        {isInjured ? 'INJ' : player.current_ability}
                      </Text>
                    </View>
                  </View>
                  {isInjured ? (
                    <Text style={{ color: '#ff6b6b', fontSize: 10 }}>{player.injury?.recoveryWeeks}w</Text>
                  ) : selectedForSwap === player.id ? (
                    <Ionicons name="checkmark-circle" size={20} color="#00ff88" />
                  ) : selectedForSwap && swapMode === 'starting' ? (
                    <Ionicons name="arrow-up-circle" size={20} color="#00ff88" />
                  ) : (
                    <Ionicons name="ellipsis-horizontal" size={20} color="#6a8aaa" />
                  )}
                </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.subsNote}>
              {selectedForSwap 
                ? 'Tap another player to swap (any player can play any position)'
                : 'Tap a player to select, then tap another to swap'}
            </Text>

            <Pressable 
              style={styles.modalCloseButton}
              onPress={handleConfirmLineup}
              {...(Platform.OS === 'web' ? { onClick: handleConfirmLineup } : {})}
              accessibilityRole="button"
            >
              <Text style={styles.modalCloseButtonText}>CONFIRM LINEUP</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

