import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { POSITION_GROUPS } from '../../constants';
import { formatValue, getSeverityColor } from '../../utils/formatters';
import { gameStyles as styles } from './gameStyles';

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
      // Filter and sort by position order (positional sorting)
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

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Medical Bay - Injury Report */}
      {injuredPlayers.length > 0 && (
        <View style={styles.positionGroup}>
          <View style={[styles.positionHeader, { borderBottomColor: '#ff3b30' }]}>
            <Text style={[styles.positionTitle, { color: '#ff3b30' }]}>MEDICAL BAY</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="medkit" size={14} color="#ff3b30" style={{ marginRight: 4 }} />
              <Text style={[styles.positionCount, { color: '#ff3b30', backgroundColor: 'rgba(255, 59, 48, 0.2)' }]}>{injuredPlayers.length}</Text>
            </View>
          </View>
          {injuredPlayers.map((player: any) => (
            <TouchableOpacity 
              key={`inj_${player.id}`} 
              style={[styles.playerCard, { borderLeftWidth: 3, borderLeftColor: getSeverityColor(player.injury.severity) }]}
              onPress={() => handlePlayerPress(player.id)}
              activeOpacity={0.7}
            >
              <View style={styles.playerInfo}>
                <View style={styles.playerNameRow}>
                  <View style={styles.positionBadge}>
                    <Text style={styles.positionBadgeText}>{player.position}</Text>
                  </View>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Ionicons name="medkit" size={12} color="#ff3b30" style={{ marginLeft: 6 }} />
                </View>
                <View style={styles.playerMeta}>
                  <Text style={[styles.playerAge, { color: getSeverityColor(player.injury.severity) }]}>
                    {player.injury.type}
                  </Text>
                  <Text style={[styles.playerNat, { color: '#ff6b6b' }]}>
                    {player.injury.recoveryWeeks === 1 ? '1 week' : `${player.injury.recoveryWeeks} weeks`}
                  </Text>
                </View>
              </View>
              <View style={styles.playerStats}>
                <View style={[styles.abilityBadge, { backgroundColor: 'rgba(255, 59, 48, 0.2)' }]}>
                  <Text style={[styles.abilityText, { color: '#ff6b6b' }]}>INJ</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#4a6a8a" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {Object.entries(positionGroups).map(([groupName, players]: [string, any[]]) => (
        <View key={groupName} style={styles.positionGroup}>
          <View style={styles.positionHeader}>
            <Text style={styles.positionTitle}>{groupName}</Text>
            <Text style={styles.positionCount}>{players.length}</Text>
          </View>
          {players.map((player: any) => {
            const isInjured = player.injury && player.injury.recoveryWeeks > 0;
            return (
              <TouchableOpacity 
                key={player.id} 
                style={[styles.playerCard, isInjured && { opacity: 0.6, borderLeftWidth: 3, borderLeftColor: getSeverityColor(player.injury?.severity || '') }]}
                onPress={() => handlePlayerPress(player.id)}
                activeOpacity={0.7}
              >
                <View style={styles.playerInfo}>
                  <View style={styles.playerNameRow}>
                    <View style={styles.positionBadge}>
                      <Text style={styles.positionBadgeText}>{player.position}</Text>
                    </View>
                    <Text style={styles.playerName}>{player.name}</Text>
                    {isInjured && <Ionicons name="medkit" size={12} color="#ff3b30" style={{ marginLeft: 6 }} />}
                  </View>
                  <View style={styles.playerMeta}>
                    <Text style={styles.playerAge}>{player.age} yrs</Text>
                    {isInjured ? (
                      <Text style={[styles.playerNat, { color: '#ff6b6b' }]}>
                        {player.injury.type} ({player.injury.recoveryWeeks}w)
                      </Text>
                    ) : (
                      <Text style={styles.playerNat}>
                        {player.nationalityFlag ? `${player.nationalityFlag} ` : ''}{player.nationality}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.playerStats}>
                  {/* Fitness indicator */}
                  <View style={{
                    backgroundColor: player.fitness >= 80 ? '#1a4a3c' : player.fitness >= 50 ? '#4a4a1c' : '#4a1c1c',
                    paddingHorizontal: 5,
                    paddingVertical: 2,
                    borderRadius: 3,
                    marginRight: 4,
                  }}>
                    <Text style={{
                      fontSize: 9,
                      fontWeight: '700',
                      color: player.fitness >= 80 ? '#00ff88' : player.fitness >= 50 ? '#ffaa00' : '#ff6b6b',
                    }}>
                      {Math.round(player.fitness)}%
                    </Text>
                  </View>
                  <View style={styles.abilityBadge}>
                    <Text style={styles.abilityText}>{Math.round(player.current_ability)}</Text>
                  </View>
                  <Text style={styles.playerValue}>{formatValue(player.value, currency || '£')}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#4a6a8a" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}
