/**
 * Scouting Screen - View other teams, their squads, tactics, and make transfer bids
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame, Player, Team } from '../src/context/GameContext';

type ViewMode = 'teams' | 'team-detail' | 'player-detail';

export default function ScoutingScreen() {
  const { currentSave, getManagedTeam, makeUnlistedBid } = useGame();
  const [viewMode, setViewMode] = useState<ViewMode>('teams');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');

  const managedTeam = getManagedTeam();
  
  // Get all teams except managed team
  const otherTeams = useMemo(() => {
    if (!currentSave) return [];
    return currentSave.teams
      .filter(t => t.id !== currentSave.managed_team_id)
      .sort((a, b) => {
        // Sort by overall rating (calculated from squad)
        const aRating = getTeamRating(a);
        const bRating = getTeamRating(b);
        return bRating - aRating;
      });
  }, [currentSave]);

  // Filter teams by search
  const filteredTeams = useMemo(() => {
    if (!searchQuery) return otherTeams;
    return otherTeams.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.short_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [otherTeams, searchQuery]);

  // Get team's average rating
  const getTeamRating = (team: Team): number => {
    if (!team.squad || team.squad.length === 0) return 0;
    const validPlayers = team.squad.filter(p => p && typeof p.overall === 'number');
    if (validPlayers.length === 0) return 50;
    return Math.round(validPlayers.reduce((sum, p) => sum + p.overall, 0) / validPlayers.length);
  };

  // Get player market value estimate
  const getPlayerValue = (player: Player): number => {
    if (!player) return 0;
    const overall = player.overall || 50; // Default to 50 if undefined
    const baseValue = overall * 50000;
    const ageMultiplier = player.age < 24 ? 1.5 : player.age > 30 ? 0.6 : 1.0;
    const positionMultiplier = ['ST', 'LW', 'RW', 'AM'].includes(player.position) ? 1.3 : 1.0;
    return Math.round(baseValue * ageMultiplier * positionMultiplier);
  };

  // Format currency
  const formatMoney = (amount: number): string => {
    if (amount >= 1000000) return `£${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `£${(amount / 1000).toFixed(0)}K`;
    return `£${amount}`;
  };

  // Handle making a bid for an unlisted player
  const handleMakeBid = async () => {
    if (!selectedPlayer || !selectedTeam) return;
    
    const amount = parseInt(bidAmount.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Bid', 'Please enter a valid bid amount');
      return;
    }

    if (amount > (currentSave?.budget || 0)) {
      Alert.alert('Insufficient Funds', 'You cannot afford this bid');
      return;
    }

    const result = await makeUnlistedBid(selectedPlayer.id, selectedTeam.id, amount);
    
    if (result.accepted) {
      Alert.alert('🎉 Bid Accepted!', `${selectedTeam.name} have accepted your bid for ${selectedPlayer.name}!`);
      setShowBidModal(false);
      setBidAmount('');
      setViewMode('teams');
      setSelectedPlayer(null);
      setSelectedTeam(null);
    } else {
      Alert.alert('Bid Rejected', result.reason || `${selectedTeam.name} have rejected your bid.`);
    }
  };

  // Position groups for filtering
  const positionGroups = ['all', 'GK', 'DEF', 'MID', 'ATT'];
  const getPositionGroup = (position: string): string => {
    if (position === 'GK') return 'GK';
    if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(position)) return 'DEF';
    if (['CM', 'DM', 'AM', 'LM', 'RM'].includes(position)) return 'MID';
    return 'ATT';
  };

  // Render team list
  const renderTeamsList = () => (
    <View style={styles.content}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#6a8aaa" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search teams..."
          placeholderTextColor="#4a6a8a"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#6a8aaa" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Teams List */}
      <ScrollView style={styles.teamsList} showsVerticalScrollIndicator={false}>
        {filteredTeams.map(team => (
          <TouchableOpacity
            key={team.id}
            style={styles.teamCard}
            onPress={() => {
              setSelectedTeam(team);
              setViewMode('team-detail');
            }}
          >
            <View style={styles.teamCardLeft}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamShortName}>{team.short_name}</Text>
            </View>
            <View style={styles.teamCardRight}>
              <View style={styles.teamStats}>
                <View style={styles.teamStat}>
                  <Text style={styles.teamStatLabel}>Squad</Text>
                  <Text style={styles.teamStatValue}>{team.squad.length}</Text>
                </View>
                <View style={styles.teamStat}>
                  <Text style={styles.teamStatLabel}>Rating</Text>
                  <Text style={[styles.teamStatValue, { color: '#00ff88' }]}>
                    {getTeamRating(team)}
                  </Text>
                </View>
                <View style={styles.teamStat}>
                  <Text style={styles.teamStatLabel}>Form</Text>
                  <Text style={styles.teamStatValue}>{team.formation || '4-4-2'}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#4a6a8a" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render team detail view
  const renderTeamDetail = () => {
    if (!selectedTeam) return null;

    const filteredSquad = selectedTeam.squad.filter(p => 
      filterPosition === 'all' || getPositionGroup(p.position) === filterPosition
    ).sort((a, b) => b.overall - a.overall);

    return (
      <View style={styles.content}>
        {/* Team Header */}
        <View style={styles.teamHeader}>
          <View>
            <Text style={styles.teamDetailName}>{selectedTeam.name}</Text>
            <Text style={styles.teamDetailFormation}>
              Formation: {selectedTeam.formation || '4-4-2'} • Rating: {getTeamRating(selectedTeam)}
            </Text>
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

        {/* Squad List */}
        <ScrollView style={styles.squadList} showsVerticalScrollIndicator={false}>
          {filteredSquad.map(player => (
            <TouchableOpacity
              key={player.id}
              style={styles.playerCard}
              onPress={() => {
                setSelectedPlayer(player);
                setViewMode('player-detail');
              }}
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
                <Text style={styles.playerRatingValue}>{player.overall}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#4a6a8a" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render player detail view
  const renderPlayerDetail = () => {
    if (!selectedPlayer || !selectedTeam) return null;

    const estimatedValue = getPlayerValue(selectedPlayer);

    return (
      <View style={styles.content}>
        {/* Player Header */}
        <View style={styles.playerHeader}>
          <View style={styles.playerHeaderPosition}>
            <Text style={styles.playerHeaderPositionText}>{selectedPlayer.position}</Text>
          </View>
          <View style={styles.playerHeaderInfo}>
            <Text style={styles.playerHeaderName}>{selectedPlayer.name}</Text>
            <Text style={styles.playerHeaderTeam}>{selectedTeam.name}</Text>
          </View>
          <View style={styles.playerHeaderRating}>
            <Text style={styles.playerHeaderRatingValue}>{selectedPlayer.overall}</Text>
            <Text style={styles.playerHeaderRatingLabel}>OVR</Text>
          </View>
        </View>

        {/* Player Stats */}
        <View style={styles.playerStatsGrid}>
          <View style={styles.playerStatBox}>
            <Text style={styles.playerStatLabel}>Age</Text>
            <Text style={styles.playerStatValue}>{selectedPlayer.age}</Text>
          </View>
          <View style={styles.playerStatBox}>
            <Text style={styles.playerStatLabel}>Value</Text>
            <Text style={styles.playerStatValue}>{formatMoney(estimatedValue)}</Text>
          </View>
          <View style={styles.playerStatBox}>
            <Text style={styles.playerStatLabel}>Wage</Text>
            <Text style={styles.playerStatValue}>{formatMoney(selectedPlayer.wage)}/w</Text>
          </View>
        </View>

        {/* Attributes */}
        <View style={styles.attributesSection}>
          <Text style={styles.sectionTitle}>Attributes</Text>
          <View style={styles.attributesGrid}>
            {selectedPlayer.position === 'GK' ? (
              <>
                <AttributeRow label="Shot Stopping" value={selectedPlayer.shot_stopping || 10} />
                <AttributeRow label="Handling" value={selectedPlayer.handling || 10} />
                <AttributeRow label="Reflexes" value={selectedPlayer.reflexes || 10} />
                <AttributeRow label="Positioning" value={selectedPlayer.positioning || 10} />
              </>
            ) : (
              <>
                <AttributeRow label="Pace" value={selectedPlayer.pace} />
                <AttributeRow label="Shooting" value={selectedPlayer.finishing} />
                <AttributeRow label="Passing" value={selectedPlayer.passing} />
                <AttributeRow label="Dribbling" value={selectedPlayer.technique} />
                <AttributeRow label="Defending" value={selectedPlayer.tackling} />
                <AttributeRow label="Physical" value={selectedPlayer.stamina} />
              </>
            )}
          </View>
        </View>

        {/* Make Bid Button */}
        <TouchableOpacity
          style={styles.bidButton}
          onPress={() => {
            setBidAmount(estimatedValue.toString());
            setShowBidModal(true);
          }}
        >
          <Ionicons name="cash-outline" size={20} color="#0a1628" />
          <Text style={styles.bidButtonText}>MAKE TRANSFER BID</Text>
        </TouchableOpacity>

        <Text style={styles.bidHint}>
          Your budget: {formatMoney(currentSave?.budget || 0)}
        </Text>
      </View>
    );
  };

  // Attribute row component
  const AttributeRow = ({ label, value }: { label: string; value: number }) => (
    <View style={styles.attributeRow}>
      <Text style={styles.attributeLabel}>{label}</Text>
      <View style={styles.attributeBarContainer}>
        <View style={[styles.attributeBar, { width: `${Math.min(value * 5, 100)}%` }]} />
      </View>
      <Text style={styles.attributeValue}>{value}</Text>
    </View>
  );

  // Get back button based on current view
  const getBackAction = () => {
    switch (viewMode) {
      case 'player-detail':
        return () => {
          setSelectedPlayer(null);
          setViewMode('team-detail');
        };
      case 'team-detail':
        return () => {
          setSelectedTeam(null);
          setFilterPosition('all');
          setViewMode('teams');
        };
      default:
        return () => router.back();
    }
  };

  const getTitle = () => {
    switch (viewMode) {
      case 'player-detail':
        return selectedPlayer?.name || 'Player';
      case 'team-detail':
        return selectedTeam?.name || 'Team';
      default:
        return 'Scouting';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={getBackAction()}>
          <Ionicons name="arrow-back" size={24} color="#00ff88" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTitle()}</Text>
        <View style={styles.headerRight}>
          <Ionicons name="search" size={24} color="#4a9eff" />
        </View>
      </View>

      {/* Content based on view mode */}
      {viewMode === 'teams' && renderTeamsList()}
      {viewMode === 'team-detail' && renderTeamDetail()}
      {viewMode === 'player-detail' && renderPlayerDetail()}

      {/* Bid Modal */}
      <Modal visible={showBidModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Transfer Bid</Text>
            <Text style={styles.modalSubtitle}>
              Make an offer for {selectedPlayer?.name}
            </Text>
            
            <View style={styles.bidInputContainer}>
              <Text style={styles.bidInputPrefix}>£</Text>
              <TextInput
                style={styles.bidInput}
                value={bidAmount}
                onChangeText={setBidAmount}
                keyboardType="numeric"
                placeholder="Enter bid amount"
                placeholderTextColor="#4a6a8a"
              />
            </View>

            <View style={styles.quickBidButtons}>
              {[0.8, 1.0, 1.2, 1.5].map(multiplier => {
                const value = Math.round(getPlayerValue(selectedPlayer!) * multiplier);
                return (
                  <TouchableOpacity
                    key={multiplier}
                    style={styles.quickBidButton}
                    onPress={() => setBidAmount(value.toString())}
                  >
                    <Text style={styles.quickBidButtonText}>{formatMoney(value)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowBidModal(false);
                  setBidAmount('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleMakeBid}
              >
                <Text style={styles.modalButtonText}>Submit Bid</Text>
              </TouchableOpacity>
            </View>
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 32,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: '#fff',
    fontSize: 14,
  },
  
  // Teams List
  teamsList: {
    flex: 1,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  teamCardLeft: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  teamShortName: {
    fontSize: 12,
    color: '#6a8aaa',
    marginTop: 2,
  },
  teamCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamStats: {
    flexDirection: 'row',
    gap: 16,
  },
  teamStat: {
    alignItems: 'center',
  },
  teamStatLabel: {
    fontSize: 10,
    color: '#4a6a8a',
  },
  teamStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  
  // Team Detail
  teamHeader: {
    backgroundColor: '#0d2137',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  teamDetailName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  teamDetailFormation: {
    fontSize: 13,
    color: '#6a8aaa',
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
  squadList: {
    flex: 1,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
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
  
  // Player Detail
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  playerHeaderPosition: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a4a6c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerHeaderPositionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4a9eff',
  },
  playerHeaderInfo: {
    flex: 1,
    marginLeft: 14,
  },
  playerHeaderName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  playerHeaderTeam: {
    fontSize: 13,
    color: '#6a8aaa',
    marginTop: 2,
  },
  playerHeaderRating: {
    alignItems: 'center',
    backgroundColor: '#00ff88',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  playerHeaderRatingValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0a1628',
  },
  playerHeaderRatingLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0a1628',
  },
  playerStatsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  playerStatBox: {
    flex: 1,
    backgroundColor: '#0d2137',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  playerStatLabel: {
    fontSize: 11,
    color: '#6a8aaa',
  },
  playerStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  attributesSection: {
    backgroundColor: '#0d2137',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4a9eff',
    marginBottom: 12,
    letterSpacing: 1,
  },
  attributesGrid: {
    gap: 10,
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attributeLabel: {
    width: 90,
    fontSize: 12,
    color: '#8aa8c8',
  },
  attributeBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#1a3a5c',
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  attributeBar: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: 3,
  },
  attributeValue: {
    width: 24,
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'right',
  },
  bidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ff88',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  bidButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0a1628',
    letterSpacing: 1,
  },
  bidHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6a8aaa',
    marginTop: 10,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0d2137',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 2,
    borderColor: '#1a4a6c',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6a8aaa',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  bidInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a1628',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    paddingHorizontal: 12,
  },
  bidInputPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00ff88',
  },
  bidInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  quickBidButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickBidButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#1a3a5c',
    borderRadius: 6,
    alignItems: 'center',
  },
  quickBidButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4a9eff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#1a4a6c',
  },
  modalButtonConfirm: {
    backgroundColor: '#00ff88',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
