import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { POSITION_GROUPS } from '../../constants';
import { formatValue, getSeverityColor } from '../../utils/formatters';
import { gameStyles } from './gameStyles';

export function SquadTab({ team, currency }: any) {
  if (!team) return null;

  // Position order for sorting within groups
  const positionOrder: Record<string, number> = {
    'GK': 1,
    'LB': 2, 'CB': 3, 'RB': 4, 'LWB': 5, 'RWB': 6,
    'DM': 7, 'CM': 8, 'LM': 9, 'RM': 10, 'AM': 11,
    'LW': 12, 'RW': 13, 'ST': 14, 'CF': 15,
  };

  const groupByPosition = () => {
    const groups: Record<string, any[]> = {};
    for (const [groupName, positions] of Object.entries(POSITION_GROUPS)) {
      groups[groupName] = team.squad
        .filter((p: any) => positions.includes(p.position))
        .sort((a: any, b: any) => (positionOrder[a.position] || 99) - (positionOrder[b.position] || 99));
    }
    return groups;
  };

  const positionGroups = groupByPosition();
  const injuredPlayers = team.squad.filter((p: any) => p.injury && p.injury.recoveryWeeks > 0);

  const handlePlayerPress = (playerId: string) => {
    router.push(`/player/${playerId}`);
  };

  // Get fitness color
  const getFitnessColor = (fitness: number) => {
    if (fitness >= 16) return '#00ff88';
    if (fitness >= 10) return '#ffaa00';
    return '#ff6b6b';
  };

  // Get ability color
  const getAbilityColor = (ability: number) => {
    if (ability >= 17) return '#00ff88';
    if (ability >= 13) return '#4a9eff';
    if (ability >= 9) return '#ffaa00';
    return '#ff6b6b';
  };

  // Get form color
  const getFormColor = (form: number) => {
    if (form >= 7.5) return '#00ff88';
    if (form >= 6) return '#4a9eff';
    if (form >= 5) return '#ffaa00';
    return '#ff6b6b';
  };

  // Table header component
  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerText}>PLAYER</Text>
      </View>
      <View style={styles.headerStats}>
        <Text style={[styles.headerStatText, { width: 28 }]}>FIT</Text>
        <Text style={[styles.headerStatText, { width: 28 }]}>ABL</Text>
        <Text style={[styles.headerStatText, { width: 28 }]}>FRM</Text>
        <Text style={[styles.headerStatText, { width: 24 }]}>G</Text>
        <Text style={[styles.headerStatText, { width: 24 }]}>A</Text>
        <Text style={[styles.headerStatText, { width: 24 }]}>AP</Text>
      </View>
    </View>
  );

  // Player row component
  const PlayerRow = ({ player, isInjured }: { player: any; isInjured: boolean }) => (
    <TouchableOpacity 
      style={[styles.playerRow, isInjured && styles.playerRowInjured]}
      onPress={() => handlePlayerPress(player.id)}
      activeOpacity={0.7}
    >
      <View style={styles.playerLeft}>
        <View style={styles.positionBadge}>
          <Text style={styles.positionText}>{player.position}</Text>
        </View>
        <View style={styles.playerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
            {isInjured && <Ionicons name="medkit" size={10} color="#ff3b30" style={{ marginLeft: 4 }} />}
          </View>
          <Text style={styles.playerMeta}>{player.age}y • {player.nationality}</Text>
        </View>
      </View>
      <View style={styles.playerStats}>
        <Text style={[styles.statValue, { width: 28, color: getFitnessColor(player.fitness || 15) }]}>
          {Math.round(player.fitness || 15)}
        </Text>
        <Text style={[styles.statValue, { width: 28, color: getAbilityColor(player.current_ability || 10) }]}>
          {Math.round(player.current_ability || 10)}
        </Text>
        <Text style={[styles.statValue, { width: 28, color: getFormColor(player.form || 6) }]}>
          {(player.form || 6).toFixed(1)}
        </Text>
        <Text style={[styles.statValue, { width: 24 }]}>{player.stats?.goals || 0}</Text>
        <Text style={[styles.statValue, { width: 24 }]}>{player.stats?.assists || 0}</Text>
        <Text style={[styles.statValue, { width: 24 }]}>{player.stats?.appearances || 0}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={gameStyles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Medical Bay - Injury Report */}
      {injuredPlayers.length > 0 && (
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { borderBottomColor: '#ff3b30' }]}>
            <Ionicons name="medkit" size={14} color="#ff3b30" style={{ marginRight: 6 }} />
            <Text style={[styles.sectionTitle, { color: '#ff3b30' }]}>MEDICAL BAY</Text>
            <View style={styles.countBadgeRed}>
              <Text style={styles.countText}>{injuredPlayers.length}</Text>
            </View>
          </View>
          {injuredPlayers.map((player: any) => (
            <TouchableOpacity 
              key={`inj_${player.id}`} 
              style={[styles.injuryRow]}
              onPress={() => handlePlayerPress(player.id)}
              activeOpacity={0.7}
            >
              <View style={styles.positionBadge}>
                <Text style={styles.positionText}>{player.position}</Text>
              </View>
              <View style={styles.injuryInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.injuryMeta}>
                  <Text style={{ color: getSeverityColor(player.injury.severity) }}>{player.injury.type}</Text>
                  {' • '}{player.injury.recoveryWeeks} weeks
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Position Groups with Table */}
      {Object.entries(positionGroups).map(([groupName, players]) => (
        <View key={groupName} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{groupName}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{players.length}</Text>
            </View>
          </View>
          
          <TableHeader />
          
          {players.map((player: any) => {
            const isInjured = player.injury && player.injury.recoveryWeeks > 0;
            return <PlayerRow key={player.id} player={player} isInjured={isInjured} />;
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#1a3a5c',
    backgroundColor: '#0d2137',
  },
  sectionTitle: {
    color: '#4a9eff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  countBadge: {
    backgroundColor: '#1a3a5c',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  countBadgeRed: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  countText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0a1628',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  headerLeft: {
    flex: 1,
  },
  headerText: {
    color: '#4a6a8a',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerStatText: {
    color: '#4a6a8a',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0d2137',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  playerRowInjured: {
    opacity: 0.6,
    borderLeftWidth: 3,
    borderLeftColor: '#ff6b6b',
  },
  playerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  positionBadge: {
    width: 32,
    height: 24,
    backgroundColor: '#1a3a5c',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  positionText: {
    color: '#4a9eff',
    fontSize: 10,
    fontWeight: '700',
  },
  playerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 140,
  },
  playerMeta: {
    color: '#6a8aaa',
    fontSize: 10,
    marginTop: 1,
  },
  playerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  injuryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0d2137',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
    borderLeftWidth: 3,
    borderLeftColor: '#ff6b6b',
  },
  injuryInfo: {
    flex: 1,
  },
  injuryMeta: {
    color: '#6a8aaa',
    fontSize: 10,
    marginTop: 1,
  },
});
