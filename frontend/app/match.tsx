import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame, Player, Team } from '../src/context/GameContext';

const { width } = Dimensions.get('window');

type MatchState = 'pre' | 'live' | 'paused' | 'post';

export default function MatchScreen() {
  const { currentSave, getManagedTeam, getLeague, simulateMatch, saveGame, updateFormation } = useGame();
  const [matchState, setMatchState] = useState<MatchState>('pre');
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
  const scrollRef = useRef<ScrollView>(null);

  const managedTeam = getManagedTeam();
  const league = getLeague();

  const fixture = league?.fixtures.find(
    f => !f.played && (f.home_team_id === managedTeam?.id || f.away_team_id === managedTeam?.id)
  );

  useEffect(() => {
    if (managedTeam) {
      setSelectedFormation(managedTeam.formation);
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
        if (nextEvent.type === 'GOAL') {
          const homeTeam = currentSave?.teams.find(t => t.id === fixture?.home_team_id);
          if (nextEvent.team === homeTeam?.short_name) {
            setHomeScore(prev => prev + 1);
          } else {
            setAwayScore(prev => prev + 1);
          }
        }
        setCurrentEventIndex(prev => prev + 1);
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
  const homeTeam = currentSave?.teams.find(t => t.id === fixture.home_team_id);
  const awayTeam = currentSave?.teams.find(t => t.id === fixture.away_team_id);
  const formations = ['4-4-2', '4-3-3', '3-5-2', '4-5-1', '5-3-2', '4-2-3-1'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Improved Scoreboard - Horizontal layout */}
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
              {managedTeam.squad.slice(0, 11).map(player => (
                <View key={player.id} style={styles.subPlayerRow}>
                  <View style={styles.subPlayerInfo}>
                    <Text style={styles.subPlayerPosition}>{player.position}</Text>
                    <Text style={styles.subPlayerName}>{player.name}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.subButton}
                    disabled={substitutions.length >= 3}
                  >
                    <Ionicons name="swap-horizontal" size={16} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              ))}
              
              <Text style={[styles.subsListTitle, { marginTop: 16 }]}>BENCH</Text>
              {managedTeam.squad.slice(11).map(player => (
                <View key={player.id} style={styles.subPlayerRow}>
                  <View style={styles.subPlayerInfo}>
                    <Text style={styles.subPlayerPosition}>{player.position}</Text>
                    <Text style={styles.subPlayerName}>{player.name}</Text>
                  </View>
                  <View style={styles.subAbility}>
                    <Text style={styles.subAbilityText}>{player.current_ability}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <Text style={styles.subsNote}>
              Tap a player on pitch, then a bench player to substitute
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
  // New horizontal scoreboard
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
});
