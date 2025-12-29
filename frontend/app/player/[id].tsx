import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame, Player } from '../../src/context/GameContext';

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentSave, getManagedTeam } = useGame();

  // Find the player across all teams
  const findPlayer = (): { player: Player | null; teamName: string } => {
    if (!currentSave) return { player: null, teamName: '' };
    
    for (const team of currentSave.teams) {
      const player = team.squad.find(p => p.id === id);
      if (player) {
        return { player, teamName: team.name };
      }
    }
    return { player: null, teamName: '' };
  };

  const { player, teamName } = findPlayer();
  const managedTeam = getManagedTeam();
  const isOurPlayer = managedTeam?.squad.some(p => p.id === id);

  if (!player) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#00ff88" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PLAYER NOT FOUND</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.notFound}>
          <Ionicons name="person-outline" size={64} color="#4a6a8a" />
          <Text style={styles.notFoundText}>Player not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatValue = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}K`;
    return `£${value}`;
  };

  const formatWage = (wage: number) => {
    if (wage >= 1000) return `£${(wage / 1000).toFixed(0)}K/week`;
    return `£${wage}/week`;
  };

  const getAbilityColor = (value: number) => {
    if (value >= 80) return '#00ff88';
    if (value >= 65) return '#4a9eff';
    if (value >= 50) return '#ffcc00';
    if (value >= 35) return '#ff9f43';
    return '#ff6b6b';
  };

  const getMoraleText = (morale: number) => {
    if (morale >= 80) return 'Excellent';
    if (morale >= 60) return 'Good';
    if (morale >= 40) return 'Average';
    if (morale >= 20) return 'Poor';
    return 'Very Poor';
  };

  const getFormText = (form: number) => {
    if (form >= 80) return 'Outstanding';
    if (form >= 60) return 'Good';
    if (form >= 40) return 'Average';
    if (form >= 20) return 'Poor';
    return 'Terrible';
  };

  const StatBar = ({ label, value }: { label: string; value: number }) => (
    <View style={styles.statBarContainer}>
      <View style={styles.statBarLabel}>
        <Text style={styles.statBarLabelText}>{label}</Text>
        <Text style={[styles.statBarValue, { color: getAbilityColor(value) }]}>{value}</Text>
      </View>
      <View style={styles.statBarTrack}>
        <View 
          style={[
            styles.statBarFill, 
            { width: `${value}%`, backgroundColor: getAbilityColor(value) }
          ]} 
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#00ff88" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PLAYER PROFILE</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Player Header */}
        <View style={styles.playerHeader}>
          <View style={styles.playerAvatar}>
            <Ionicons name="person" size={48} color="#4a9eff" />
          </View>
          <View style={styles.playerBasicInfo}>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerTeam}>{teamName}</Text>
            <View style={styles.playerTags}>
              <View style={styles.positionTag}>
                <Text style={styles.positionTagText}>{player.position}</Text>
              </View>
              <Text style={styles.playerNationality}>{player.nationality}</Text>
            </View>
          </View>
          <View style={styles.overallRating}>
            <Text style={styles.overallRatingValue}>{player.current_ability}</Text>
            <Text style={styles.overallRatingLabel}>OVR</Text>
          </View>
        </View>

        {/* Quick Info */}
        <View style={styles.quickInfoGrid}>
          <View style={styles.quickInfoItem}>
            <Text style={styles.quickInfoValue}>{player.age}</Text>
            <Text style={styles.quickInfoLabel}>Age</Text>
          </View>
          <View style={styles.quickInfoItem}>
            <Text style={styles.quickInfoValue}>{player.potential_ability}</Text>
            <Text style={styles.quickInfoLabel}>Potential</Text>
          </View>
          <View style={styles.quickInfoItem}>
            <Text style={styles.quickInfoValue}>{player.fitness}%</Text>
            <Text style={styles.quickInfoLabel}>Fitness</Text>
          </View>
          <View style={styles.quickInfoItem}>
            <Text style={styles.quickInfoValue}>{getMoraleText(player.morale)}</Text>
            <Text style={styles.quickInfoLabel}>Morale</Text>
          </View>
        </View>

        {/* Base Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BASE STATS</Text>
          <View style={styles.statsCard}>
            <StatBar label="Pace" value={player.pace} />
            <StatBar label="Shooting" value={player.shooting} />
            <StatBar label="Passing" value={player.passing} />
            <StatBar label="Tackling" value={player.tackling} />
            <StatBar label="Heading" value={player.heading} />
            <StatBar label="Stamina" value={player.stamina} />
            {player.position === 'GK' && (
              <StatBar label="Handling" value={player.handling} />
            )}
          </View>
        </View>

        {/* Transfer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TRANSFER INFO</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Market Value</Text>
              <Text style={styles.infoValue}>{formatValue(player.value)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Transfer Status</Text>
              <Text style={[styles.infoValue, { color: '#4a9eff' }]}>
                {currentSave?.transfer_market.some(l => l.player.id === player.id) 
                  ? 'Listed for Sale' 
                  : 'Not Listed'}
              </Text>
            </View>
          </View>
        </View>

        {/* Contract Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTRACT INFO</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Weekly Wage</Text>
              <Text style={styles.infoValue}>{formatWage(player.wage)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contract Expires</Text>
              <Text style={styles.infoValue}>{player.contract_end}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Years Remaining</Text>
              <Text style={styles.infoValue}>
                {Math.max(0, player.contract_end - (currentSave?.season || 2024))} years
              </Text>
            </View>
          </View>
        </View>

        {/* Form & Condition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONDITION</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Current Form</Text>
              <Text style={[styles.infoValue, { color: getAbilityColor(player.form) }]}>
                {getFormText(player.form)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Morale</Text>
              <Text style={[styles.infoValue, { color: getAbilityColor(player.morale) }]}>
                {getMoraleText(player.morale)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fitness Level</Text>
              <Text style={[styles.infoValue, { color: getAbilityColor(player.fitness) }]}>
                {player.fitness}%
              </Text>
            </View>
          </View>
        </View>

        {/* Career Stats (placeholder - would need tracking) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CAREER STATS</Text>
          <View style={styles.careerStatsGrid}>
            <View style={styles.careerStatItem}>
              <Text style={styles.careerStatValue}>-</Text>
              <Text style={styles.careerStatLabel}>Apps</Text>
            </View>
            <View style={styles.careerStatItem}>
              <Text style={styles.careerStatValue}>-</Text>
              <Text style={styles.careerStatLabel}>Goals</Text>
            </View>
            <View style={styles.careerStatItem}>
              <Text style={styles.careerStatValue}>-</Text>
              <Text style={styles.careerStatLabel}>Assists</Text>
            </View>
            <View style={styles.careerStatItem}>
              <Text style={styles.careerStatValue}>-</Text>
              <Text style={styles.careerStatLabel}>Clean Sheets</Text>
            </View>
          </View>
          <Text style={styles.careerNote}>Stats tracking coming in future update</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
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
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  notFoundText: {
    color: '#6a8aaa',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    marginBottom: 16,
  },
  playerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1a3a5c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerBasicInfo: {
    flex: 1,
    marginLeft: 16,
  },
  playerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  playerTeam: {
    fontSize: 13,
    color: '#4a9eff',
    marginTop: 2,
  },
  playerTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  positionTag: {
    backgroundColor: '#1a4a3c',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  positionTagText: {
    color: '#00ff88',
    fontSize: 12,
    fontWeight: '700',
  },
  playerNationality: {
    color: '#6a8aaa',
    fontSize: 12,
  },
  overallRating: {
    alignItems: 'center',
    backgroundColor: '#1a4a3c',
    padding: 12,
    borderRadius: 8,
  },
  overallRatingValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#00ff88',
  },
  overallRatingLabel: {
    fontSize: 10,
    color: '#00ff88',
    fontWeight: '600',
  },
  quickInfoGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  quickInfoItem: {
    flex: 1,
    backgroundColor: '#0d2137',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  quickInfoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  quickInfoLabel: {
    fontSize: 10,
    color: '#6a8aaa',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6a8aaa',
    letterSpacing: 1,
    marginBottom: 10,
  },
  statsCard: {
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    gap: 12,
  },
  statBarContainer: {
    gap: 4,
  },
  statBarLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBarLabelText: {
    fontSize: 13,
    color: '#9ab8d8',
  },
  statBarValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  statBarTrack: {
    height: 6,
    backgroundColor: '#1a3a5c',
    borderRadius: 3,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  infoCard: {
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#6a8aaa',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  careerStatsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  careerStatItem: {
    flex: 1,
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  careerStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4a6a8a',
  },
  careerStatLabel: {
    fontSize: 10,
    color: '#6a8aaa',
    marginTop: 4,
  },
  careerNote: {
    fontSize: 11,
    color: '#4a6a8a',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});
