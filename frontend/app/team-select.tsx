import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/context/GameContext';
import { useSaveSlots } from '../src/context/SaveSlotsContext';
import { TEAM_TEMPLATES, generateNewGame, TeamTemplate } from '../src/utils/gameGenerator';

export default function TeamSelectScreen() {
  const { slotId } = useLocalSearchParams<{ slotId: string }>();
  const { setCurrentSave } = useGame();
  const { saveToSlot, setActiveSlot } = useSaveSlots();
  
  const [state, setState] = useState<{
    selectedTeam: TeamTemplate | null;
    saveName: string;
    currency: string;
    isCreating: boolean;
  }>({
    selectedTeam: null,
    saveName: '',
    currency: '£',
    isCreating: false,
  });

  const { selectedTeam, saveName, currency, isCreating } = state;
  const targetSlotId = slotId ? parseInt(slotId, 10) : 1;

  const setSelectedTeam = (team: TeamTemplate | null) => {
    setState(prev => ({ ...prev, selectedTeam: team }));
  };

  const setSaveName = (name: string) => {
    setState(prev => ({ ...prev, saveName: name }));
  };

  const setCurrency = (sym: string) => {
    setState(prev => ({ ...prev, currency: sym }));
  };

  const handleStartGame = async () => {
    if (!selectedTeam) {
      Alert.alert('Select Team', 'Please select a team to manage');
      return;
    }

    setState(prev => ({ ...prev, isCreating: true }));

    try {
      const name = saveName.trim() || `${selectedTeam.name} Career`;
      const season = 2025;
      
      // Generate game data locally (100% offline)
      const gameData = generateNewGame(selectedTeam.id, name, currency, season);
      
      // Find the managed team
      const managedTeam = gameData.teams.find(t => t.id === selectedTeam.id);
      if (!managedTeam) {
        throw new Error('Failed to generate team data');
      }
      
      // Create the save object structure (v2 - event-based)
      const saveData = {
        id: `save_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        managed_team_id: selectedTeam.id,
        managed_team_name: selectedTeam.name,
        season,
        currency_symbol: currency,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        
        // Budget is the managed team's budget
        budget: managedTeam.budget,
        
        // Teams data
        teams: gameData.teams.map(team => ({
          ...team,
          squad: team.squad.map(player => ({
            ...player,
            nationalityFlag: player.nationalityFlag,
          })),
        })),
        
        // Competitions (v2 structure)
        competitions: gameData.competitions,
        
        // Event-based calendar (v2)
        events: gameData.events,
        calendarV2: gameData.calendar,
        
        // Pre-season friendly system
        friendlySlots: gameData.friendlySlots,
        aiFriendlySchedules: gameData.aiFriendlySchedules,
        
        // Legacy league format for backward compatibility
        leagues: [{
          id: gameData.competitions.league.id,
          name: gameData.competitions.league.name,
          division: 1,
          season,
          current_week: 0,
          teams: gameData.teams.map(t => t.id),
          table: gameData.competitions.league.standings.map(s => ({
            team_id: s.teamId,
            team_name: s.teamName,
            played: s.played,
            won: s.won,
            drawn: s.drawn,
            lost: s.lost,
            goals_for: s.goalsFor,
            goals_against: s.goalsAgainst,
            goal_difference: s.goalDifference,
            points: s.points,
          })),
          fixtures: gameData.competitions.league.fixtures.map(f => ({
            id: f.id,
            week: parseInt(f.round.replace('Week ', '')) || 0,
            match_date: f.matchDate,
            match_type: f.competitionType,
            home_team_id: f.homeTeamId,
            away_team_id: f.awayTeamId,
            home_team_name: f.homeTeamName,
            away_team_name: f.awayTeamName,
            home_score: f.homeScore,
            away_score: f.awayScore,
            played: f.played,
            events: f.events,
          })),
        }],
        
        // Transfer market
        transfer_market: gameData.transferMarket,
        
        // Financial tracking
        finances: {
          weekly_income: 0,
          weekly_expenses: 0,
          season_profit_loss: 0,
          season_revenue: 0,
          season_expenses: 0,
          last_match_revenue: 0,
          ffp_status: 'green',
          ffp_tier: 1,
        },
        
        // Sponsor tracking
        sponsors: [],
        
        // FFP state
        ffp: {
          tier: 1,
          status: 'green',
          consecutive_losses: 0,
          transfer_embargo: false,
          wage_cap_reduction: 0,
        },
      };
      
      // Save to slot
      const saved = await saveToSlot(targetSlotId, saveData);
      
      if (saved) {
        // Set as current save and navigate
        setActiveSlot(targetSlotId);
        setCurrentSave(saveData);
        router.replace('/game');
      } else {
        throw new Error('Failed to save game');
      }
    } catch (error) {
      console.error('Game creation error:', error);
      Alert.alert('Error', 'Failed to create game. Please try again.');
    } finally {
      setState(prev => ({ ...prev, isCreating: false }));
    }
  };

  // Sort teams by reputation (best first)
  const sortedTeams = [...TEAM_TEMPLATES].sort((a, b) => b.reputation - a.reputation);

  // Group teams by tier
  const topTeams = sortedTeams.filter(t => t.reputation >= 17);
  const midTeams = sortedTeams.filter(t => t.reputation >= 10 && t.reputation < 17);
  const lowerTeams = sortedTeams.filter(t => t.reputation < 10);

  const renderTeamSection = (title: string, teams: TeamTemplate[], difficulty: string) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionDifficulty}>{difficulty}</Text>
      </View>
      {teams.map(team => (
        <TouchableOpacity
          key={team.id}
          style={[
            styles.teamCard,
            selectedTeam?.id === team.id && styles.teamCardSelected
          ]}
          onPress={() => setSelectedTeam(team)}
        >
          <View style={[styles.teamColor, { backgroundColor: team.primary_color }]} />
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{team.name}</Text>
            <Text style={styles.teamStadium}>{team.stadium}</Text>
          </View>
          <View style={styles.teamStats}>
            <Text style={styles.teamRep}>⭐ {team.reputation}</Text>
          </View>
          {selectedTeam?.id === team.id && (
            <Ionicons name="checkmark-circle" size={24} color="#00ff88" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#00ff88" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SELECT YOUR TEAM</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.slotIndicator}>
          <Ionicons name="save-outline" size={14} color="#4a9eff" />
          <Text style={styles.slotText}>Saving to Slot {targetSlotId}</Text>
        </View>

        <ScrollView 
          style={styles.teamList}
          contentContainerStyle={styles.teamListContent}
          showsVerticalScrollIndicator={false}
        >
          {renderTeamSection('TOP CLUBS', topTeams, 'Easy')}
          {renderTeamSection('MID-TABLE', midTeams, 'Medium')}
          {renderTeamSection('UNDERDOGS', lowerTeams, 'Hard')}
        </ScrollView>

        {selectedTeam && (
          <View style={styles.footer}>
            <View style={styles.saveNameContainer}>
              <Text style={styles.inputLabel}>Save Name:</Text>
              <TextInput
                style={styles.saveNameInput}
                value={saveName}
                onChangeText={setSaveName}
                placeholder={`${selectedTeam.name} Career`}
                placeholderTextColor="#4a6a8a"
                maxLength={30}
              />
            </View>

            <View style={styles.currencySection}>
              <Text style={styles.inputLabel}>Currency:</Text>
              <View style={styles.currencyRow}>
                {['£', '$', '€'].map((sym) => (
                  <TouchableOpacity
                    key={sym}
                    style={[
                      styles.currencyButton,
                      currency === sym && styles.currencyButtonActive,
                    ]}
                    onPress={() => setCurrency(sym)}
                  >
                    <Text style={[
                      styles.currencyText,
                      currency === sym && styles.currencyTextActive,
                    ]}>{sym}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.startButton, isCreating && styles.startButtonDisabled]}
              onPress={handleStartGame}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color="#0a1628" />
              ) : (
                <>
                  <Ionicons name="play" size={20} color="#0a1628" />
                  <Text style={styles.startButtonText}>START CAREER</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  slotIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#0d2137',
  },
  slotText: {
    color: '#4a9eff',
    fontSize: 12,
    fontWeight: '600',
  },
  teamList: {
    flex: 1,
  },
  teamListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#6a8aaa',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionDifficulty: {
    color: '#4a6a8a',
    fontSize: 10,
    fontWeight: '600',
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1a4a6c',
    marginBottom: 8,
    gap: 12,
  },
  teamCardSelected: {
    borderColor: '#00ff88',
    backgroundColor: '#0d2a3f',
  },
  teamColor: {
    width: 6,
    height: 40,
    borderRadius: 3,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  teamStadium: {
    fontSize: 11,
    color: '#6a8aaa',
    marginTop: 2,
  },
  teamStats: {
    alignItems: 'flex-end',
  },
  teamRep: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a3a5c',
    backgroundColor: '#0d2137',
  },
  saveNameContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#6a8aaa',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  saveNameInput: {
    backgroundColor: '#0a1628',
    borderWidth: 1,
    borderColor: '#1a4a6c',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  currencySection: {
    marginBottom: 12,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  currencyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1a4a6c',
    backgroundColor: '#0a1628',
    alignItems: 'center',
  },
  currencyButtonActive: {
    borderColor: '#00ff88',
    backgroundColor: '#1a4a3c',
  },
  currencyText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6a8aaa',
  },
  currencyTextActive: {
    color: '#00ff88',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ff88',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  startButtonDisabled: {
    opacity: 0.7,
  },
  startButtonText: {
    color: '#0a1628',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
