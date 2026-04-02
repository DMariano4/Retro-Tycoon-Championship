/**
 * Team Profile Page - Full-page view of any team's profile
 * Accessible via clicking team names throughout the app
 */
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Player, Team, useGame } from '../../src/context/GameContext';
import { PlayerProfileModal } from '../../src/components/shared/PlayerProfileModal';

export default function TeamProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentSave, getTeamById } = useGame();
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
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

  // Get team from context
  const team = useMemo(() => {
    if (!currentSave || !id) return null;
    return currentSave.teams.find(t => t.id === id) || null;
  }, [currentSave, id]);

  // Position group helper
  const getPositionGroup = (position: string): string => {
    if (position === 'GK') return 'GK';
    if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(position)) return 'DEF';
    if (['CM', 'DM', 'AM', 'LM', 'RM'].includes(position)) return 'MID';
    return 'ATT';
  };

  // Get team's average rating
  const teamRating = useMemo(() => {
    if (!team?.squad || team.squad.length === 0) return 0;
    const validPlayers = team.squad.filter(p => p && typeof p.overall === 'number');
    if (validPlayers.length === 0) return 50;
    return Math.round(validPlayers.reduce((sum, p) => sum + p.overall, 0) / validPlayers.length);
  }, [team?.squad]);

  // Get league position
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

  // Filter and sort squad
  const filteredSquad = useMemo(() => {
    if (!team?.squad) return [];
    return team.squad
      .filter(p => p && (filterPosition === 'all' || getPositionGroup(p.position) === filterPosition))
      .sort((a, b) => (b.current_ability || b.overall || 0) - (a.current_ability || a.overall || 0));
  }, [team?.squad, filterPosition]);

  // Position groups for filtering
  const positionGroups = ['all', 'GK', 'DEF', 'MID', 'ATT'];

  // Loading state
  if (isChecking || !isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff88" />
          <Text style={styles.loadingText}>Loading team...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Team not found
  if (!team) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#00ff88" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>Team not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwnTeam = team.id === currentSave?.managed_team_id;
  const currency = currentSave?.currency_symbol || '£';

  // Format currency with user's chosen symbol
  const formatMoney = (amount: number): string => {
    if (amount >= 1000000) return `${currency}${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${currency}${(amount / 1000).toFixed(0)}K`;
    return `${currency}${amount}`;
  };

  // Get player value
  const getPlayerValue = (player: Player): number => {
    const ability = player.current_ability || 10;
    const baseValue = ability * 500000;
    
    // Age multiplier
    let ageMultiplier = 1.0;
    if (player.age <= 21) ageMultiplier = 1.4;
    else if (player.age <= 25) ageMultiplier = 1.2;
    else if (player.age <= 29) ageMultiplier = 1.0;
    else if (player.age <= 32) ageMultiplier = 0.7;
    else ageMultiplier = 0.4;
    
    return Math.round(baseValue * ageMultiplier);
  };

  // Get rating color
  const getRatingColor = (rating: number): string => {
    if (rating >= 17) return '#00ff88';
    if (rating >= 14) return '#4a9eff';
    if (rating >= 10) return '#ffd700';
    if (rating >= 7) return '#ff9500';
    return '#ff6b6b';
  };

  // Get form color
  const getFormColor = (form: number): string => {
    if (form >= 8) return '#00ff88';
    if (form >= 6) return '#4a9eff';
    if (form >= 5) return '#ffd700';
    return '#ff6b6b';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#00ff88" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{team.name}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Team Info Card */}
        <View style={styles.teamInfoCard}>
          <View style={styles.teamBadgeContainer}>
            <View style={[styles.teamBadge, { backgroundColor: team.primary_color || '#1a3a5c' }]}>
              <Text style={styles.teamBadgeText}>{team.short_name?.substring(0, 3) || 'TM'}</Text>
            </View>
          </View>
          <View style={styles.teamInfoContent}>
            <Text style={styles.teamName}>{team.name}</Text>
            <Text style={styles.teamStadium}>
              <Ionicons name="location-outline" size={14} color="#6a8aaa" /> {team.stadium}
            </Text>
            {leaguePosition && (
              <Text style={styles.teamPosition}>
                {leaguePosition.position}{['st', 'nd', 'rd'][leaguePosition.position - 1] || 'th'} in {leaguePosition.league}
              </Text>
            )}
          </View>
          <View style={styles.teamRatingContainer}>
            <Text style={[styles.teamRatingValue, { color: getRatingColor(teamRating) }]}>
              {teamRating}
            </Text>
            <Text style={styles.teamRatingLabel}>OVR</Text>
          </View>
        </View>

        {/* Team Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{team.squad?.length || 0}</Text>
            <Text style={styles.statLabel}>Squad</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{team.formation || '4-4-2'}</Text>
            <Text style={styles.statLabel}>Formation</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{team.stadium_capacity?.toLocaleString() || '-'}</Text>
            <Text style={styles.statLabel}>Capacity</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{team.reputation || '-'}</Text>
            <Text style={styles.statLabel}>Rep</Text>
          </View>
        </View>

        {/* Position Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by Position:</Text>
          <View style={styles.filterButtons}>
            {positionGroups.map(pos => (
              <TouchableOpacity
                key={pos}
                style={[styles.filterButton, filterPosition === pos && styles.filterButtonActive]}
                onPress={() => setFilterPosition(pos)}
              >
                <Text style={[styles.filterButtonText, filterPosition === pos && styles.filterButtonTextActive]}>
                  {pos === 'all' ? 'ALL' : pos}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Squad List */}
        <View style={styles.squadSection}>
          <Text style={styles.sectionTitle}>
            Squad ({filteredSquad.length} players)
          </Text>
          
          {filteredSquad.map((player, index) => (
            <TouchableOpacity
              key={player.id}
              style={styles.playerRow}
              onPress={() => {
                setSelectedPlayer(player);
                setShowPlayerModal(true);
              }}
            >
              <View style={styles.playerLeft}>
                <View style={styles.playerPosition}>
                  <Text style={styles.playerPositionText}>{player.position}</Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerMeta}>
                    {player.age}y • {player.nationality || 'Unknown'}
                  </Text>
                </View>
              </View>
              <View style={styles.playerRight}>
                <View style={styles.playerStats}>
                  <View style={styles.playerStatItem}>
                    <Text style={[styles.playerStatValue, { color: getRatingColor(player.current_ability || player.overall || 10) }]}>
                      {player.current_ability || player.overall || 10}
                    </Text>
                    <Text style={styles.playerStatLabel}>ABL</Text>
                  </View>
                  <View style={styles.playerStatItem}>
                    <Text style={[styles.playerStatValue, { color: getFormColor(player.form || 6) }]}>
                      {(player.form || 6).toFixed(1)}
                    </Text>
                    <Text style={styles.playerStatLabel}>FRM</Text>
                  </View>
                </View>
                <Text style={styles.playerValue}>{formatMoney(getPlayerValue(player))}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Player Profile Modal */}
      {selectedPlayer && (
        <PlayerProfileModal
          visible={showPlayerModal}
          player={selectedPlayer}
          team={team}
          onClose={() => {
            setShowPlayerModal(false);
            setSelectedPlayer(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6a8aaa',
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    color: '#00ff88',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  teamInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0d2137',
    margin: 16,
    borderRadius: 12,
    gap: 12,
  },
  teamBadgeContainer: {
    width: 60,
    height: 60,
  },
  teamBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  teamInfoContent: {
    flex: 1,
  },
  teamName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  teamStadium: {
    color: '#6a8aaa',
    fontSize: 13,
    marginBottom: 2,
  },
  teamPosition: {
    color: '#00ff88',
    fontSize: 12,
    fontWeight: '600',
  },
  teamRatingContainer: {
    alignItems: 'center',
    backgroundColor: '#1a3a5c',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  teamRatingValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  teamRatingLabel: {
    color: '#6a8aaa',
    fontSize: 10,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#0d2137',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    color: '#6a8aaa',
    fontSize: 10,
    marginTop: 2,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterLabel: {
    color: '#6a8aaa',
    fontSize: 12,
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#1a3a5c',
  },
  filterButtonActive: {
    backgroundColor: '#00ff88',
  },
  filterButtonText: {
    color: '#6a8aaa',
    fontSize: 12,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#0a1628',
  },
  squadSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d2137',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  playerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  playerPosition: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a3a5c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerPositionText: {
    color: '#4a9eff',
    fontSize: 10,
    fontWeight: '700',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  playerMeta: {
    color: '#6a8aaa',
    fontSize: 11,
  },
  playerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  playerStats: {
    flexDirection: 'row',
    gap: 12,
  },
  playerStatItem: {
    alignItems: 'center',
  },
  playerStatValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  playerStatLabel: {
    color: '#6a8aaa',
    fontSize: 8,
    fontWeight: '600',
  },
  playerValue: {
    color: '#ffd700',
    fontSize: 11,
    fontWeight: '600',
  },
});
