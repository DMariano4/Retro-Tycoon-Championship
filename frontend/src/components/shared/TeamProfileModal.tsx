/**
 * TeamProfileModal - Reusable modal to view any team's profile and squad
 * Can be opened from anywhere in the app (league table, fixtures, etc.)
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Player, Team, useGame } from '../../context/GameContext';
import { PlayerProfileModal } from './PlayerProfileModal';

interface TeamProfileModalProps {
  visible: boolean;
  team: Team | null;
  onClose: () => void;
}

export function TeamProfileModal({ visible, team, onClose }: TeamProfileModalProps) {
  const { currentSave } = useGame();
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);

  // Position group helper - defined outside useMemo so it can be used in filteredSquad
  const getPositionGroup = (position: string): string => {
    if (position === 'GK') return 'GK';
    if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(position)) return 'DEF';
    if (['CM', 'DM', 'AM', 'LM', 'RM'].includes(position)) return 'MID';
    return 'ATT';
  };

  // Get team's average rating - safe for null team
  const teamRating = useMemo(() => {
    if (!team?.squad || team.squad.length === 0) return 0;
    const validPlayers = team.squad.filter(p => p && typeof p.overall === 'number');
    if (validPlayers.length === 0) return 50;
    return Math.round(validPlayers.reduce((sum, p) => sum + p.overall, 0) / validPlayers.length);
  }, [team?.squad]);

  // Get league position - safe for null team
  const leaguePosition = useMemo(() => {
    if (!currentSave || !team) return null;
    for (const league of currentSave.leagues) {
      const position = league.table.findIndex(t => t.team_id === team.id);
      if (position >= 0) {
        return { position: position + 1, league: league.name };
      }
    }
    return null;
  }, [currentSave, team]);

  // Filter and sort squad - safe for null team
  const filteredSquad = useMemo(() => {
    if (!team?.squad) return [];
    return team.squad
      .filter(p => p && (filterPosition === 'all' || getPositionGroup(p.position) === filterPosition))
      .sort((a, b) => (b.overall || 0) - (a.overall || 0));
  }, [team?.squad, filterPosition]);

  // Position groups for filtering
  const positionGroups = ['all', 'GK', 'DEF', 'MID', 'ATT'];

  // Early return AFTER all hooks
  if (!team) return null;

  const isOwnTeam = team.id === currentSave?.managed_team_id;

  // Format currency
  const formatMoney = (amount: number): string => {
    if (amount >= 1000000) return `£${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `£${(amount / 1000).toFixed(0)}K`;
    return `£${amount}`;
  };

  // Get player value
  const getPlayerValue = (player: Player): number => {
    const overall = player.overall || 50;
    const baseValue = overall * 50000;
    const ageMultiplier = player.age < 24 ? 1.5 : player.age > 30 ? 0.6 : 1.0;
    const positionMultiplier = ['ST', 'LW', 'RW', 'AM'].includes(player.position) ? 1.3 : 1.0;
    return Math.round(baseValue * ageMultiplier * positionMultiplier);
  };

  const handlePlayerPress = (player: Player) => {
    setSelectedPlayer(player);
    setShowPlayerModal(true);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Team Profile</Text>
              <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Team Header */}
              <View style={styles.teamHeader}>
                <View style={styles.teamBadge}>
                  <Ionicons name="shield" size={40} color="#4a9eff" />
                </View>
                <View style={styles.teamInfo}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  <Text style={styles.teamShortName}>{team.short_name}</Text>
                  {leaguePosition && (
                    <Text style={styles.leaguePosition}>
                      {leaguePosition.position}{getOrdinalSuffix(leaguePosition.position)} in {leaguePosition.league}
                    </Text>
                  )}
                </View>
                {isOwnTeam && (
                  <View style={styles.ownTeamBadge}>
                    <Text style={styles.ownTeamText}>YOUR TEAM</Text>
                  </View>
                )}
              </View>

              {/* Quick Stats */}
              <View style={styles.quickStats}>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatLabel}>Squad</Text>
                  <Text style={styles.quickStatValue}>{team.squad?.length || 0}</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatLabel}>Rating</Text>
                  <Text style={[styles.quickStatValue, { color: '#00ff88' }]}>{teamRating}</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatLabel}>Formation</Text>
                  <Text style={styles.quickStatValue}>{team.formation || '4-4-2'}</Text>
                </View>
              </View>

              {/* Position Filter */}
              <View style={styles.positionFilter}>
                {positionGroups.map(pos => (
                  <TouchableOpacity
                    key={pos}
                    style={[styles.positionButton, filterPosition === pos && styles.positionButtonActive]}
                    onPress={() => setFilterPosition(pos)}
                  >
                    <Text style={[styles.positionButtonText, filterPosition === pos && styles.positionButtonTextActive]}>
                      {pos === 'all' ? 'ALL' : pos}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Squad Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>SQUAD ({filteredSquad.length})</Text>
                {filteredSquad.map(player => (
                  <TouchableOpacity
                    key={player.id}
                    style={styles.playerCard}
                    onPress={() => handlePlayerPress(player)}
                  >
                    <View style={styles.playerPosition}>
                      <Text style={styles.playerPositionText}>{player.position}</Text>
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{player.name}</Text>
                      <Text style={styles.playerDetails}>
                        Age {player.age} • {formatMoney(getPlayerValue(player))}
                      </Text>
                    </View>
                    <View style={styles.playerRating}>
                      <Text style={styles.playerRatingValue}>{player.overall || '?'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#4a6a8a" />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Player Profile Modal */}
      <PlayerProfileModal
        visible={showPlayerModal}
        player={selectedPlayer}
        team={team}
        onClose={() => {
          setShowPlayerModal(false);
          setSelectedPlayer(null);
        }}
        onBidSuccess={onClose}
      />
    </>
  );
}

// Helper function for ordinal suffixes
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  teamBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a3a5c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamInfo: {
    flex: 1,
    marginLeft: 14,
  },
  teamName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  teamShortName: {
    fontSize: 13,
    color: '#6a8aaa',
    marginTop: 2,
  },
  leaguePosition: {
    fontSize: 12,
    color: '#00ff88',
    marginTop: 4,
  },
  ownTeamBadge: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ownTeamText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0a1628',
  },
  quickStats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickStat: {
    flex: 1,
    backgroundColor: '#0d2137',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  quickStatLabel: {
    fontSize: 11,
    color: '#6a8aaa',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  positionFilter: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  positionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#0d2137',
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  positionButtonActive: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  positionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6a8aaa',
  },
  positionButtonTextActive: {
    color: '#0a1628',
  },
  section: {
    backgroundColor: '#0d2137',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4a9eff',
    letterSpacing: 1,
    marginBottom: 12,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a1628',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1a3a5c',
  },
  playerPosition: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a4a6c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playerPositionText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4a9eff',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  playerDetails: {
    fontSize: 11,
    color: '#6a8aaa',
    marginTop: 2,
  },
  playerRating: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  playerRatingValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0a1628',
  },
});
