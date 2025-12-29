import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/context/GameContext';

const { width } = Dimensions.get('window');

type MatchState = 'pre' | 'live' | 'post';

export default function MatchScreen() {
  const { currentSave, getManagedTeam, getLeague, simulateMatch, saveGame } = useGame();
  const [matchState, setMatchState] = useState<MatchState>('pre');
  const [events, setEvents] = useState<any[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 4x
  const [currentMinute, setCurrentMinute] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const managedTeam = getManagedTeam();
  const league = getLeague();

  // Get current fixture
  const fixture = league?.fixtures.find(
    f => !f.played && (f.home_team_id === managedTeam?.id || f.away_team_id === managedTeam?.id)
  );

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
    // Reveal events as time passes
    if (events.length > 0 && currentEventIndex < events.length) {
      const nextEvent = events[currentEventIndex];
      if (currentMinute >= nextEvent.minute) {
        // Update scores for goals
        if (nextEvent.type === 'GOAL') {
          if (nextEvent.team === fixture?.home_team_name.slice(0, 3).toUpperCase() || 
              (managedTeam && fixture?.home_team_id === managedTeam.id && nextEvent.team === managedTeam.short_name)) {
            setHomeScore(prev => prev + 1);
          } else {
            setAwayScore(prev => prev + 1);
          }
        }
        setCurrentEventIndex(prev => prev + 1);
        // Auto scroll to bottom
        setTimeout(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }
  }, [currentMinute, events, currentEventIndex]);

  const handleStartMatch = async () => {
    if (!fixture) return;

    const result = await simulateMatch(fixture.id, speed);
    if (result) {
      setEvents(result.events);
      setMatchState('live');
    }
  };

  const handleFinish = async () => {
    await saveGame(false);
    router.replace('/game');
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'GOAL': return 'football';
      case 'YELLOW_CARD': return 'card';
      case 'SAVE': return 'hand-left';
      case 'CHANCE': return 'flash';
      case 'FOUL': return 'warning';
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Match Header */}
      <View style={styles.matchHeader}>
        <View style={styles.teamContainer}>
          <Text style={[
            styles.teamName,
            isHome && styles.teamNameHighlight
          ]} numberOfLines={2}>
            {fixture.home_team_name}
          </Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>{homeScore}</Text>
          <Text style={styles.scoreSeparator}>-</Text>
          <Text style={styles.score}>{awayScore}</Text>
          {matchState === 'live' && (
            <Text style={styles.minute}>{currentMinute}'</Text>
          )}
        </View>
        
        <View style={styles.teamContainer}>
          <Text style={[
            styles.teamName,
            !isHome && styles.teamNameHighlight
          ]} numberOfLines={2}>
            {fixture.away_team_name}
          </Text>
        </View>
      </View>

      {/* Speed Controls */}
      {matchState === 'pre' && (
        <View style={styles.speedControls}>
          <Text style={styles.speedLabel}>Commentary Speed:</Text>
          <View style={styles.speedButtons}>
            {[1, 2, 4].map(s => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.speedButton,
                  speed === s && styles.speedButtonActive
                ]}
                onPress={() => setSpeed(s)}
              >
                <Text style={[
                  styles.speedButtonText,
                  speed === s && styles.speedButtonTextActive
                ]}>{s}x</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Commentary Area */}
      <View style={styles.commentaryContainer}>
        {matchState === 'pre' ? (
          <View style={styles.preMatchContainer}>
            <Ionicons name="football" size={48} color="#00ff88" />
            <Text style={styles.preMatchTitle}>MATCH DAY</Text>
            <Text style={styles.preMatchSubtitle}>Week {fixture.week}</Text>
            <Text style={styles.preMatchInfo}>
              {isHome ? 'Home' : 'Away'} match at {isHome ? managedTeam.stadium : 'Away Stadium'}
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={handleStartMatch}>
              <Ionicons name="play" size={20} color="#0a1628" />
              <Text style={styles.startButtonText}>KICK OFF</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView 
            ref={scrollRef}
            style={styles.commentaryScroll}
            contentContainerStyle={styles.commentaryContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.kickoffEvent}>
              <Text style={styles.kickoffText}>KICK OFF!</Text>
            </View>
            
            {events.slice(0, currentEventIndex).map((event, index) => (
              <View key={index} style={styles.eventItem}>
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
      </View>

      {/* Footer */}
      {matchState === 'live' && (
        <View style={styles.liveFooter}>
          <View style={styles.speedButtons}>
            {[1, 2, 4].map(s => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.speedButton,
                  speed === s && styles.speedButtonActive
                ]}
                onPress={() => setSpeed(s)}
              >
                <Text style={[
                  styles.speedButtonText,
                  speed === s && styles.speedButtonTextActive
                ]}>{s}x</Text>
              </TouchableOpacity>
            ))}
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
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#0d2137',
    borderBottomWidth: 2,
    borderBottomColor: '#1a4a6c',
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9ab8d8',
    textAlign: 'center',
  },
  teamNameHighlight: {
    color: '#00ff88',
  },
  scoreContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  score: {
    fontSize: 40,
    fontWeight: '900',
    color: '#fff',
  },
  scoreSeparator: {
    fontSize: 24,
    color: '#4a6a8a',
    marginHorizontal: 8,
  },
  minute: {
    fontSize: 14,
    color: '#00ff88',
    marginTop: 4,
    fontWeight: '700',
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
  commentaryContainer: {
    flex: 1,
  },
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
  commentaryScroll: {
    flex: 1,
  },
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
    borderLeftWidth: 3,
    borderLeftColor: '#1a4a6c',
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
  liveFooter: {
    padding: 16,
    backgroundColor: '#0d2137',
    borderTopWidth: 1,
    borderTopColor: '#1a4a6c',
    alignItems: 'center',
    gap: 12,
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
});
