import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame, Player } from '../../src/context/GameContext';

// Position groupings for display
const POSITION_GROUPS: Record<string, string> = {
  GK: 'Goalkeeper',
  CB: 'Centre Back',
  LB: 'Left Back',
  RB: 'Right Back',
  DM: 'Defensive Mid',
  CM: 'Central Mid',
  AM: 'Attacking Mid',
  LW: 'Left Winger',
  RW: 'Right Winger',
  ST: 'Striker'
};

const POSITION_CATEGORY: Record<string, string> = {
  GK: 'GK',
  CB: 'DEF', LB: 'DEF', RB: 'DEF',
  DM: 'MID', CM: 'MID', AM: 'MID',
  LW: 'FWD', RW: 'FWD', ST: 'FWD'
};

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentSave, getManagedTeam, listPlayerForSale } = useGame();
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showFormHistory, setShowFormHistory] = useState(false);

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

  const isOwnPlayer = managedTeam?.squad.some(p => p.id === player.id);

  const handleRenewContract = () => {
    if (!isOwnPlayer) {
      Alert.alert('Not Your Player', 'This player is not in your squad.');
      return;
    }
    setShowActionsMenu(false);
    Alert.alert(
      'Renew Contract',
      `Offer new contract to ${player.name}?\n\nCurrent wage: ${formatWage(player.wage)}\nExpires: ${player.contract_end}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Offer Contract',
          onPress: () => {
            Alert.alert('Success', 'Contract renewal negotiations will be implemented in future update.');
          }
        }
      ]
    );
  };

  const handleListForTransfer = () => {
    if (!isOwnPlayer) {
      Alert.alert('Not Your Player', 'You can only list your own players for transfer.');
      return;
    }
    setShowActionsMenu(false);
    Alert.alert(
      'List for Transfer',
      `List ${player.name} on the transfer market?\n\nSuggested price: ${formatValue(player.value * 1.2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'List Player',
          onPress: () => {
            listPlayerForSale(player.id, Math.floor(player.value * 1.2));
            Alert.alert('Listed', `${player.name} has been listed for transfer.`);
          }
        }
      ]
    );
  };

  // Generate mock form history (last 10 matches)
  const formHistory = Array.from({ length: 10 }, (_, i) => ({
    match: `Match ${10 - i}`,
    rating: (player.form + Math.random() * 20 - 10).toFixed(1),
    result: Math.random() > 0.5 ? 'W' : Math.random() > 0.5 ? 'D' : 'L'
  }));

  // Generate mock career stats by season
  const careerStatsBySeason = [
    { season: '2024/25', apps: Math.floor(Math.random() * 30), goals: Math.floor(Math.random() * 15), assists: Math.floor(Math.random() * 10) },
    { season: '2023/24', apps: Math.floor(Math.random() * 35), goals: Math.floor(Math.random() * 12), assists: Math.floor(Math.random() * 8) },
    { season: '2022/23', apps: Math.floor(Math.random() * 28), goals: Math.floor(Math.random() * 10), assists: Math.floor(Math.random() * 6) },
  ];

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

  // Get position-specific stats to show
  const getPositionStats = () => {
    const category = POSITION_CATEGORY[player.position] || 'MID';
    
    switch (category) {
      case 'GK':
        return {
          title: 'GOALKEEPER SKILLS',
          stats: [
            { label: 'Reflexes', value: player.reflexes },
            { label: 'Handling', value: player.handling },
            { label: 'Communication', value: player.communication },
            { label: 'Positioning', value: player.positioning },
          ]
        };
      case 'DEF':
        return {
          title: 'DEFENSIVE SKILLS',
          stats: [
            { label: 'Tackling', value: player.tackling },
            { label: 'Marking', value: player.marking },
            { label: 'Positioning', value: player.positioning },
            { label: 'Heading', value: player.heading },
            ...(player.position === 'LB' || player.position === 'RB' 
              ? [{ label: 'Crossing', value: player.crossing }] 
              : []),
          ]
        };
      case 'MID':
        return {
          title: 'MIDFIELD SKILLS',
          stats: [
            { label: 'Passing', value: player.passing },
            { label: 'Vision', value: player.vision },
            { label: 'Dribbling', value: player.dribbling },
            { label: 'Control', value: player.control },
            ...(player.position === 'DM' 
              ? [{ label: 'Tackling', value: player.tackling }]
              : [{ label: 'Flair', value: player.flair }]),
          ]
        };
      case 'FWD':
        return {
          title: 'ATTACKING SKILLS',
          stats: [
            { label: 'Finishing', value: player.finishing },
            { label: 'Off the Ball', value: player.off_the_ball },
            { label: 'Dribbling', value: player.dribbling },
            { label: 'Flair', value: player.flair },
            ...(player.position === 'ST' 
              ? [{ label: 'Heading', value: player.heading }]
              : [{ label: 'Crossing', value: player.crossing }]),
          ]
        };
      default:
        return { title: 'SKILLS', stats: [] };
    }
  };

  const positionStats = getPositionStats();

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
              <Text style={styles.positionFull}>{POSITION_GROUPS[player.position] || player.position}</Text>
            </View>
            <Text style={styles.playerNationality}>{player.nationality} | {player.age} yrs</Text>
          </View>
          <View style={styles.overallRating}>
            <Text style={styles.overallRatingValue}>{player.current_ability}</Text>
            <Text style={styles.overallRatingLabel}>OVR</Text>
          </View>
        </View>

        {/* Quick Info */}
        <View style={styles.quickInfoGrid}>
          <View style={styles.quickInfoItem}>
            <Text style={styles.quickInfoValue}>{player.potential_ability}</Text>
            <Text style={styles.quickInfoLabel}>Potential</Text>
          </View>
          <View style={styles.quickInfoItem}>
            <Text style={styles.quickInfoValue}>{player.fitness}%</Text>
            <Text style={styles.quickInfoLabel}>Fitness</Text>
          </View>
          <View style={styles.quickInfoItem}>
            <Text style={[styles.quickInfoValue, { color: getAbilityColor(player.form) }]}>
              {getFormText(player.form).substring(0, 4)}
            </Text>
            <Text style={styles.quickInfoLabel}>Form</Text>
          </View>
        </View>

        {/* Position-Specific Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{positionStats.title}</Text>
          <View style={styles.statsCard}>
            {positionStats.stats.map((stat, index) => (
              <StatBar key={index} label={stat.label} value={stat.value} />
            ))}
          </View>
        </View>

        {/* Physical Attributes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PHYSICAL</Text>
          <View style={styles.statsCard}>
            <StatBar label="Pace" value={player.pace} />
            <StatBar label="Strength" value={player.strength} />
            <StatBar label="Stamina" value={player.stamina} />
            <StatBar label="Agility" value={player.agility} />
          </View>
        </View>

        {/* Mental Attributes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MENTAL</Text>
          <View style={styles.statsCard}>
            <StatBar label="Work Rate" value={player.work_rate} />
            <StatBar label="Concentration" value={player.concentration} />
            <StatBar label="Decision Making" value={player.decision_making} />
            <StatBar label="Composure" value={player.composure} />
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

        {/* Condition */}
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

        {/* Career Stats */}
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
              <Text style={styles.careerStatLabel}>Rating</Text>
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
    fontSize: 18,
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
    marginTop: 6,
  },
  positionTag: {
    backgroundColor: '#1a4a3c',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  positionTagText: {
    color: '#00ff88',
    fontSize: 11,
    fontWeight: '700',
  },
  positionFull: {
    color: '#6a8aaa',
    fontSize: 11,
  },
  playerNationality: {
    color: '#6a8aaa',
    fontSize: 11,
    marginTop: 4,
  },
  overallRating: {
    alignItems: 'center',
    backgroundColor: '#1a4a3c',
    padding: 10,
    borderRadius: 8,
  },
  overallRatingValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#00ff88',
  },
  overallRatingLabel: {
    fontSize: 9,
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
