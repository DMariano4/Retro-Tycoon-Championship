import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions, TextInput, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/context/GameContext';
import { useAuth } from '../src/context/AuthContext';

const { width } = Dimensions.get('window');

// Position display names
const POSITION_GROUPS: Record<string, string[]> = {
  'GOALKEEPERS': ['GK'],
  'DEFENDERS': ['CB', 'LB', 'RB'],
  'MIDFIELDERS': ['DM', 'CM', 'AM'],
  'FORWARDS': ['LW', 'RW', 'ST']
};

type TabType = 'dashboard' | 'squad' | 'tactics' | 'league' | 'transfers';

export default function GameScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const { currentSave, getManagedTeam, getLeague, saveGame, advanceWeek } = useGame();
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useFocusEffect(
    useCallback(() => {
      // Small delay to ensure layout is mounted
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

  if (isChecking || !currentSave || !isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff88" />
          <Text style={styles.loadingText}>Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const managedTeam = getManagedTeam();
  const league = getLeague();

  const handleSave = async (isCloud: boolean) => {
    const success = await saveGame(isCloud);
    if (success) {
      Alert.alert('Saved', isCloud ? 'Game saved to cloud' : 'Game saved locally');
    } else {
      Alert.alert('Error', 'Failed to save game');
    }
  };

  const handleNextWeek = () => {
    Alert.alert(
      'Advance Time',
      'Play this week\'s matches and advance to the next week?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            advanceWeek();
            router.push('/match');
          }
        }
      ]
    );
  };

  const getUpcomingFixture = () => {
    if (!league || !managedTeam) return null;
    return league.fixtures.find(
      f => !f.played && (f.home_team_id === managedTeam.id || f.away_team_id === managedTeam.id)
    );
  };

  const getTeamPosition = () => {
    if (!league || !managedTeam) return 0;
    const idx = league.table.findIndex(t => t.team_id === managedTeam.id);
    return idx + 1;
  };

  const upcomingFixture = getUpcomingFixture();
  const position = getTeamPosition();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab 
          team={managedTeam} 
          league={league} 
          save={currentSave}
          fixture={upcomingFixture}
          position={position}
          onNextWeek={handleNextWeek}
        />;
      case 'squad':
        return <SquadTab team={managedTeam} />;
      case 'tactics':
        return <TacticsTab team={managedTeam} />;
      case 'league':
        return <LeagueTab league={league} teamId={managedTeam?.id} />;
      case 'transfers':
        return <TransfersTab />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>{managedTeam?.name || 'Unknown'}</Text>
          <Text style={styles.gameDate}>{currentSave.game_date} | Week {league?.current_week || 1}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={() => handleSave(false)}
          >
            <Ionicons name="save-outline" size={20} color="#00ff88" />
          </TouchableOpacity>
          {user && (
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={() => handleSave(true)}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#4a9eff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={20} color="#6a8aaa" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TabButton icon="home" label="HOME" active={activeTab === 'dashboard'} onPress={() => setActiveTab('dashboard')} />
        <TabButton icon="people" label="SQUAD" active={activeTab === 'squad'} onPress={() => setActiveTab('squad')} />
        <TabButton icon="grid" label="TACTICS" active={activeTab === 'tactics'} onPress={() => setActiveTab('tactics')} />
        <TabButton icon="trophy" label="LEAGUE" active={activeTab === 'league'} onPress={() => setActiveTab('league')} />
        <TabButton icon="swap-horizontal" label="TRANSFERS" active={activeTab === 'transfers'} onPress={() => setActiveTab('transfers')} />
      </View>
    </SafeAreaView>
  );
}

function TabButton({ icon, label, active, onPress }: { icon: string; label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.tabButton, active && styles.tabButtonActive]} onPress={onPress}>
      <Ionicons name={icon as any} size={20} color={active ? '#00ff88' : '#4a6a8a'} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// Dashboard Tab
function DashboardTab({ team, league, save, fixture, position, onNextWeek }: any) {
  const formatBudget = (amount: number) => {
    if (amount >= 1000000) return `£${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `£${(amount / 1000).toFixed(0)}K`;
    return `£${amount}`;
  };

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{position}{position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'}</Text>
          <Text style={styles.statLabel}>Position</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatBudget(save?.budget || 0)}</Text>
          <Text style={styles.statLabel}>Budget</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{team?.squad?.length || 0}</Text>
          <Text style={styles.statLabel}>Squad Size</Text>
        </View>
      </View>

      {/* Next Match */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NEXT MATCH</Text>
        {fixture ? (
          <View style={styles.matchCard}>
            <View style={styles.matchTeams}>
              <Text style={[styles.matchTeam, fixture.home_team_id === team?.id && styles.matchTeamHighlight]}>
                {fixture.home_team_name}
              </Text>
              <Text style={styles.matchVs}>vs</Text>
              <Text style={[styles.matchTeam, fixture.away_team_id === team?.id && styles.matchTeamHighlight]}>
                {fixture.away_team_name}
              </Text>
            </View>
            <Text style={styles.matchWeek}>Week {fixture.week}</Text>
            <TouchableOpacity style={styles.playButton} onPress={onNextWeek}>
              <Ionicons name="play" size={16} color="#0a1628" />
              <Text style={styles.playButtonText}>PLAY MATCH</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.matchCard}>
            <Text style={styles.noMatchText}>No upcoming matches</Text>
          </View>
        )}
      </View>

      {/* League Standing Preview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>LEAGUE STANDING</Text>
        <View style={styles.tablePreview}>
          {league?.table.slice(0, 5).map((standing: any, index: number) => (
            <View 
              key={standing.team_id} 
              style={[
                styles.tableRow,
                standing.team_id === team?.id && styles.tableRowHighlight
              ]}
            >
              <Text style={styles.tablePos}>{index + 1}</Text>
              <Text style={styles.tableTeam}>{standing.team_name}</Text>
              <Text style={styles.tablePts}>{standing.points}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// Squad Tab
function SquadTab({ team }: any) {
  if (!team) return null;

  const groupByPosition = () => {
    const groups: Record<string, any[]> = {};
    for (const [groupName, positions] of Object.entries(POSITION_GROUPS)) {
      groups[groupName] = team.squad.filter((p: any) => positions.includes(p.position));
    }
    return groups;
  };

  const positionGroups = groupByPosition();

  const formatValue = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}K`;
    return `£${value}`;
  };

  const handlePlayerPress = (playerId: string) => {
    router.push(`/player/${playerId}`);
  };

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {Object.entries(positionGroups).map(([groupName, players]: [string, any[]]) => (
        <View key={groupName} style={styles.positionGroup}>
          <View style={styles.positionHeader}>
            <Text style={styles.positionTitle}>{groupName}</Text>
            <Text style={styles.positionCount}>{players.length}</Text>
          </View>
          {players.map((player: any) => (
            <TouchableOpacity 
              key={player.id} 
              style={styles.playerCard}
              onPress={() => handlePlayerPress(player.id)}
              activeOpacity={0.7}
            >
              <View style={styles.playerInfo}>
                <View style={styles.playerNameRow}>
                  <View style={styles.positionBadge}>
                    <Text style={styles.positionBadgeText}>{player.position}</Text>
                  </View>
                  <Text style={styles.playerName}>{player.name}</Text>
                </View>
                <View style={styles.playerMeta}>
                  <Text style={styles.playerAge}>{player.age} yrs</Text>
                  <Text style={styles.playerNat}>{player.nationality}</Text>
                </View>
              </View>
              <View style={styles.playerStats}>
                <View style={styles.abilityBadge}>
                  <Text style={styles.abilityText}>{Math.round(player.current_ability)}</Text>
                </View>
                <Text style={styles.playerValue}>{formatValue(player.value)}</Text>
                <Ionicons name="chevron-forward" size={16} color="#4a6a8a" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

// Tactics Tab
function TacticsTab({ team }: any) {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Current Formation Display */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CURRENT FORMATION</Text>
        <View style={styles.currentFormationCard}>
          <Ionicons name="grid-outline" size={48} color="#4a9eff" />
          <Text style={styles.currentFormation}>{team?.formation || '4-4-2'}</Text>
          <Text style={styles.currentFormationLabel}>Formation</Text>
        </View>
      </View>

      {/* Advanced Tactics Button */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.advancedTacticsButton}
          onPress={() => router.push('/tactics-advanced')}
        >
          <View style={styles.advancedTacticsIconContainer}>
            <Ionicons name="settings-outline" size={32} color="#00ff88" />
          </View>
          <View style={styles.advancedTacticsInfo}>
            <Text style={styles.advancedTacticsTitle}>Advanced Tactics</Text>
            <Text style={styles.advancedTacticsDescription}>
              CM01/02 inspired tactics system
            </Text>
            <View style={styles.advancedTacticsTags}>
              <View style={styles.advancedTacticsTag}>
                <Text style={styles.advancedTacticsTagText}>Formation</Text>
              </View>
              <View style={styles.advancedTacticsTag}>
                <Text style={styles.advancedTacticsTagText}>Mentality</Text>
              </View>
              <View style={styles.advancedTacticsTag}>
                <Text style={styles.advancedTacticsTagText}>Passing</Text>
              </View>
              <View style={styles.advancedTacticsTag}>
                <Text style={styles.advancedTacticsTagText}>Tempo</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#4a6a8a" />
        </TouchableOpacity>
      </View>

      {/* Tactical Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TACTICAL FEATURES</Text>
        
        <View style={styles.featureCard}>
          <Ionicons name="flash-outline" size={24} color="#4a9eff" />
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Team Mentality</Text>
            <Text style={styles.featureDescription}>
              Control attacking/defensive balance
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Ionicons name="git-network-outline" size={24} color="#4a9eff" />
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Passing Style</Text>
            <Text style={styles.featureDescription}>
              Direct, mixed, or short passing
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Ionicons name="timer-outline" size={24} color="#4a9eff" />
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Tempo Control</Text>
            <Text style={styles.featureDescription}>
              Adjust speed of play
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Ionicons name="shield-outline" size={24} color="#4a9eff" />
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Defensive Options</Text>
            <Text style={styles.featureDescription}>
              Tackling, pressing, offside trap
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Ionicons name="rocket-outline" size={24} color="#4a9eff" />
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Counter Attack</Text>
            <Text style={styles.featureDescription}>
              Exploit opponent's attacking play
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// League Tab
function LeagueTab({ league, teamId }: any) {
  const [view, setView] = useState<'table' | 'fixtures'>('table');

  if (!league) return null;

  return (
    <View style={styles.tabContent}>
      <View style={styles.leagueToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, view === 'table' && styles.toggleButtonActive]}
          onPress={() => setView('table')}
        >
          <Text style={[styles.toggleText, view === 'table' && styles.toggleTextActive]}>TABLE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, view === 'fixtures' && styles.toggleButtonActive]}
          onPress={() => setView('fixtures')}
        >
          <Text style={[styles.toggleText, view === 'fixtures' && styles.toggleTextActive]}>FIXTURES</Text>
        </TouchableOpacity>
      </View>

      {view === 'table' ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.fullTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.tablePosCol]}>#</Text>
              <Text style={[styles.tableHeaderText, styles.tableTeamCol]}>Team</Text>
              <Text style={styles.tableHeaderText}>P</Text>
              <Text style={styles.tableHeaderText}>W</Text>
              <Text style={styles.tableHeaderText}>D</Text>
              <Text style={styles.tableHeaderText}>L</Text>
              <Text style={styles.tableHeaderText}>GD</Text>
              <Text style={[styles.tableHeaderText, styles.tablePtsCol]}>Pts</Text>
            </View>
            {league.table.map((standing: any, index: number) => (
              <View 
                key={standing.team_id}
                style={[
                  styles.tableDataRow,
                  standing.team_id === teamId && styles.tableRowHighlight
                ]}
              >
                <Text style={[styles.tableData, styles.tablePosCol]}>{index + 1}</Text>
                <Text style={[styles.tableData, styles.tableTeamCol]} numberOfLines={1}>{standing.team_name}</Text>
                <Text style={styles.tableData}>{standing.played}</Text>
                <Text style={styles.tableData}>{standing.won}</Text>
                <Text style={styles.tableData}>{standing.drawn}</Text>
                <Text style={styles.tableData}>{standing.lost}</Text>
                <Text style={styles.tableData}>{standing.goal_difference}</Text>
                <Text style={[styles.tableData, styles.tablePtsCol]}>{standing.points}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {Array.from({ length: 38 }, (_, i) => i + 1).map(week => {
            const weekFixtures = league.fixtures.filter((f: any) => f.week === week);
            if (weekFixtures.length === 0) return null;
            
            return (
              <View key={week} style={styles.weekSection}>
                <Text style={styles.weekTitle}>Week {week}</Text>
                {weekFixtures.map((fixture: any) => (
                  <View 
                    key={fixture.id} 
                    style={[
                      styles.fixtureRow,
                      (fixture.home_team_id === teamId || fixture.away_team_id === teamId) && styles.fixtureRowHighlight
                    ]}
                  >
                    <Text style={styles.fixtureTeam}>{fixture.home_team_name}</Text>
                    <View style={styles.fixtureScore}>
                      {fixture.played ? (
                        <Text style={styles.fixtureScoreText}>
                          {fixture.home_score} - {fixture.away_score}
                        </Text>
                      ) : (
                        <Text style={styles.fixtureVs}>vs</Text>
                      )}
                    </View>
                    <Text style={styles.fixtureTeam}>{fixture.away_team_name}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

// Transfers Tab
function TransfersTab() {
  const { currentSave, makeTransferOffer, getManagedTeam } = useGame();
  const team = getManagedTeam();
  const [searchPlayer, setSearchPlayer] = useState('');
  const [searchClub, setSearchClub] = useState('');
  const [positionFilter, setPositionFilter] = useState<string | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [proposedFee, setProposedFee] = useState(0);
  const [proposedWage, setProposedWage] = useState(0);
  const [feeInputText, setFeeInputText] = useState('0');
  const [wageInputText, setWageInputText] = useState('0');

  const formatValue = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}K`;
    return `£${value}`;
  };

  const formatWage = (wage: number) => {
    if (wage >= 1000) return `£${(wage / 1000).toFixed(1)}K`;
    return `£${wage}`;
  };

  const handleMakeOffer = async (listing: any) => {
    // Initialize modal with listing data
    setSelectedListing(listing);
    setProposedFee(listing.asking_price);
    setProposedWage(listing.player.wage);
    setFeeInputText(listing.asking_price.toLocaleString());
    setWageInputText(listing.player.wage.toLocaleString());
    setShowOfferModal(true);
  };

  const handleSubmitOffer = async () => {
    if (!selectedListing || !team) return;

    const minimumFee = Math.floor(selectedListing.asking_price * 0.9);
    const minimumWage = Math.floor(selectedListing.player.wage * 0.9);

    // Check if offer is too low (hidden from user)
    if (proposedFee < minimumFee || proposedWage < minimumWage) {
      setShowOfferModal(false);
      Alert.alert(
        'Offer Rejected',
        `${selectedListing.team_name} has rejected your transfer proposal for ${selectedListing.player.name}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Check budget
    if (proposedFee > team.budget) {
      Alert.alert(
        'Insufficient Funds',
        `You don't have enough budget for this transfer.\n\nYour budget: ${formatValue(team.budget)}\nTransfer fee: ${formatValue(proposedFee)}`,
        [{ text: 'Revise Offer', style: 'cancel' }]
      );
      return;
    }

    // Offer accepted!
    const result = await makeTransferOffer(selectedListing.id, proposedFee, proposedWage);
    setShowOfferModal(false);

    if (result) {
      Alert.alert(
        'Transfer Complete!',
        `${selectedListing.player.name} has joined your team!\n\nTransfer fee: ${formatValue(proposedFee)}\nWeekly wage: ${formatWage(proposedWage)}`,
        [{ text: 'Great!' }]
      );
    } else {
      Alert.alert('Error', 'Failed to complete transfer. Please try again.');
    }
  };

  // Filter listings
  const filteredListings = currentSave?.transfer_market
    .filter(l => l.team_id !== team?.id)
    .filter(l => {
      const playerMatch = searchPlayer === '' || 
        l.player.name.toLowerCase().includes(searchPlayer.toLowerCase());
      const clubMatch = searchClub === '' || 
        l.team_name.toLowerCase().includes(searchClub.toLowerCase());
      const posMatch = positionFilter === null || l.player.position === positionFilter;
      return playerMatch && clubMatch && posMatch;
    }) || [];

  const positions = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.budgetDisplay}>
        <Text style={styles.budgetLabel}>Transfer Budget</Text>
        <Text style={styles.budgetValue}>{formatValue(currentSave?.budget || 0)}</Text>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="person-outline" size={16} color="#4a6a8a" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search player..."
              placeholderTextColor="#4a6a8a"
              value={searchPlayer}
              onChangeText={setSearchPlayer}
            />
          </View>
          <View style={styles.searchInputContainer}>
            <Ionicons name="shield-outline" size={16} color="#4a6a8a" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search club..."
              placeholderTextColor="#4a6a8a"
              value={searchClub}
              onChangeText={setSearchClub}
            />
          </View>
        </View>
        
        {/* Position Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.positionFilterScroll}
          contentContainerStyle={styles.positionFilterContent}
        >
          <TouchableOpacity
            style={[styles.positionChip, positionFilter === null && styles.positionChipActive]}
            onPress={() => setPositionFilter(null)}
          >
            <Text style={[styles.positionChipText, positionFilter === null && styles.positionChipTextActive]}>
              ALL
            </Text>
          </TouchableOpacity>
          {positions.map(pos => (
            <TouchableOpacity
              key={pos}
              style={[styles.positionChip, positionFilter === pos && styles.positionChipActive]}
              onPress={() => setPositionFilter(positionFilter === pos ? null : pos)}
            >
              <Text style={[styles.positionChipText, positionFilter === pos && styles.positionChipTextActive]}>
                {pos}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          TRANSFER MARKET ({filteredListings.length} players)
        </Text>
        {filteredListings.length === 0 ? (
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={32} color="#4a6a8a" />
            <Text style={styles.noResultsText}>No players found</Text>
          </View>
        ) : (
          filteredListings.slice(0, 30).map(listing => (
            <View 
              key={listing.id} 
              style={styles.transferCard}
            >
              <TouchableOpacity 
                style={styles.transferInfo}
                onPress={() => router.push(`/player/${listing.player.id}`)}
                activeOpacity={0.7}
              >
                <Text style={styles.transferName}>{listing.player.name}</Text>
                <Text style={styles.transferMeta}>
                  {listing.player.position} | {listing.player.age} yrs | {listing.team_name}
                </Text>
                <View style={styles.transferStats}>
                  <Text style={styles.transferStat}>OVR {Math.round(listing.player.current_ability)}</Text>
                  <Text style={styles.transferStat}>PAC {Math.round(listing.player.pace)}</Text>
                  <Text style={styles.transferStat}>STR {Math.round(listing.player.strength)}</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.transferAction}>
                <Text style={styles.transferPrice}>{formatValue(listing.asking_price)}</Text>
                <TouchableOpacity 
                  style={styles.offerButton}
                  onPress={() => handleMakeOffer(listing)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.offerButtonText}>BID</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Transfer Offer Modal */}
      {selectedListing && (
        <Modal
          visible={showOfferModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowOfferModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowOfferModal(false)}
          >
            <View style={styles.transferOfferModal} onStartShouldSetResponder={() => true}>
              <View style={styles.transferOfferHeader}>
                <Text style={styles.transferOfferTitle}>MAKE TRANSFER OFFER</Text>
                <TouchableOpacity onPress={() => setShowOfferModal(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.transferOfferPlayerInfo}>
                  <Text style={styles.transferOfferPlayerName}>{selectedListing.player.name}</Text>
                  <Text style={styles.transferOfferPlayerMeta}>
                    {selectedListing.player.position} • {selectedListing.player.age} yrs • {selectedListing.team_name}
                  </Text>
                  <Text style={styles.transferOfferAskingPrice}>
                    Asking Price: {formatValue(selectedListing.asking_price)}
                  </Text>
                </View>

                {/* Transfer Fee Section */}
                <View style={styles.transferOfferSection}>
                  <Text style={styles.transferOfferSectionTitle}>TRANSFER FEE</Text>
                  <View style={styles.transferFeeInputContainer}>
                    <Text style={styles.transferFeePrefix}>£</Text>
                    <TouchableOpacity
                      style={styles.transferFeeButton}
                      onPress={() => {
                        const newFee = Math.max(0, proposedFee - 1000000);
                        setProposedFee(newFee);
                        setFeeInputText(newFee.toLocaleString());
                      }}
                    >
                      <Ionicons name="remove-circle-outline" size={28} color="#ff6b6b" />
                    </TouchableOpacity>
                    <View style={styles.transferFeeValueContainer}>
                      <TextInput
                        style={styles.transferFeeInput}
                        value={feeInputText}
                        onChangeText={(text) => {
                          setFeeInputText(text);
                          const numericValue = parseInt(text.replace(/,/g, '')) || 0;
                          setProposedFee(numericValue);
                        }}
                        onBlur={() => {
                          setFeeInputText(proposedFee.toLocaleString());
                        }}
                        keyboardType="numeric"
                        selectTextOnFocus
                        returnKeyType="done"
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.transferFeeButton}
                      onPress={() => {
                        const newFee = proposedFee + 1000000;
                        setProposedFee(newFee);
                        setFeeInputText(newFee.toLocaleString());
                      }}
                    >
                      <Ionicons name="add-circle-outline" size={28} color="#00ff88" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.transferFeePresets}>
                    <TouchableOpacity
                      style={styles.transferFeePresetButton}
                      onPress={() => {
                        setProposedFee(selectedListing.asking_price);
                        setFeeInputText(selectedListing.asking_price.toLocaleString());
                      }}
                    >
                      <Text style={styles.transferFeePresetText}>Asking Price</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Weekly Wage Section */}
                <View style={styles.transferOfferSection}>
                  <Text style={styles.transferOfferSectionTitle}>WEEKLY WAGE</Text>
                  <View style={styles.wageInputContainer}>
                    <Text style={styles.wageInputPrefix}>£</Text>
                    <TouchableOpacity
                      style={styles.wageButton}
                      onPress={() => {
                        const newWage = Math.max(0, proposedWage - 1000);
                        setProposedWage(newWage);
                        setWageInputText(newWage.toLocaleString());
                      }}
                    >
                      <Ionicons name="remove-circle-outline" size={28} color="#ff6b6b" />
                    </TouchableOpacity>
                    <View style={styles.wageValueContainer}>
                      <TextInput
                        style={styles.wageInput}
                        value={wageInputText}
                        onChangeText={(text) => {
                          setWageInputText(text);
                          const numericValue = parseInt(text.replace(/,/g, '')) || 0;
                          setProposedWage(numericValue);
                        }}
                        onBlur={() => {
                          setWageInputText(proposedWage.toLocaleString());
                        }}
                        keyboardType="numeric"
                        selectTextOnFocus
                        returnKeyType="done"
                      />
                      <Text style={styles.wageValueLabel}>per week</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.wageButton}
                      onPress={() => {
                        const newWage = proposedWage + 1000;
                        setProposedWage(newWage);
                        setWageInputText(newWage.toLocaleString());
                      }}
                    >
                      <Ionicons name="add-circle-outline" size={28} color="#00ff88" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.wagePresets}>
                    <TouchableOpacity
                      style={styles.wagePresetButton}
                      onPress={() => {
                        setProposedWage(selectedListing.player.wage);
                        setWageInputText(selectedListing.player.wage.toLocaleString());
                      }}
                    >
                      <Text style={styles.wagePresetText}>Current Wage</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.transferOfferInfo}>
                    <View style={styles.transferOfferInfoRow}>
                      <Text style={styles.transferOfferInfoLabel}>Player's Current Wage:</Text>
                      <Text style={styles.transferOfferInfoValue}>{formatWage(selectedListing.player.wage)}</Text>
                    </View>
                    <View style={styles.transferOfferInfoRow}>
                      <Text style={styles.transferOfferInfoLabel}>Your Offer:</Text>
                      <Text style={[styles.transferOfferInfoValue, { fontWeight: '700' }]}>
                        {formatWage(proposedWage)}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.submitOfferButton}
                  onPress={handleSubmitOffer}
                >
                  <Ionicons name="paper-plane" size={20} color="#0a1628" />
                  <Text style={styles.submitOfferButtonText}>SUBMIT OFFER</Text>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  teamInfo: {},
  teamName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  gameDate: {
    fontSize: 12,
    color: '#6a8aaa',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0d2137',
    borderTopWidth: 1,
    borderTopColor: '#1a3a5c',
    paddingBottom: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabButtonActive: {},
  tabLabel: {
    fontSize: 9,
    color: '#4a6a8a',
    marginTop: 4,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#00ff88',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6a8aaa',
    letterSpacing: 1,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00ff88',
  },
  statLabel: {
    fontSize: 10,
    color: '#6a8aaa',
    marginTop: 4,
  },
  matchCard: {
    backgroundColor: '#0d2137',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    alignItems: 'center',
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  matchTeam: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ab8d8',
    flex: 1,
    textAlign: 'center',
  },
  matchTeamHighlight: {
    color: '#00ff88',
  },
  matchVs: {
    fontSize: 12,
    color: '#4a6a8a',
  },
  matchWeek: {
    fontSize: 11,
    color: '#4a6a8a',
    marginTop: 8,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ff88',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    gap: 8,
    marginTop: 16,
  },
  playButtonText: {
    color: '#0a1628',
    fontSize: 14,
    fontWeight: '800',
  },
  noMatchText: {
    color: '#6a8aaa',
    fontSize: 14,
  },
  tablePreview: {
    backgroundColor: '#0d2137',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  tableRowHighlight: {
    backgroundColor: '#1a4a3c',
  },
  tablePos: {
    width: 24,
    fontSize: 12,
    color: '#6a8aaa',
    fontWeight: '700',
  },
  tableTeam: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
  },
  tablePts: {
    width: 30,
    fontSize: 13,
    color: '#00ff88',
    fontWeight: '700',
    textAlign: 'right',
  },
  positionGroup: {
    marginBottom: 20,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  positionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4a9eff',
    letterSpacing: 1,
  },
  positionCount: {
    fontSize: 12,
    color: '#4a6a8a',
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    marginBottom: 6,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  playerMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  playerAge: {
    fontSize: 11,
    color: '#6a8aaa',
  },
  playerNat: {
    fontSize: 11,
    color: '#6a8aaa',
  },
  playerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  abilityBadge: {
    backgroundColor: '#1a4a3c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  abilityText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00ff88',
  },
  playerValue: {
    fontSize: 11,
    color: '#6a8aaa',
    minWidth: 50,
    textAlign: 'right',
  },
  currentFormationCard: {
    backgroundColor: '#0d2137',
    padding: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a4a6c',
    alignItems: 'center',
  },
  currentFormation: {
    fontSize: 48,
    fontWeight: '900',
    color: '#00ff88',
    marginTop: 12,
  },
  currentFormationLabel: {
    fontSize: 12,
    color: '#6a8aaa',
    marginTop: 8,
  },
  advancedTacticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  advancedTacticsIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a4a3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  advancedTacticsInfo: {
    flex: 1,
    marginLeft: 16,
  },
  advancedTacticsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  advancedTacticsDescription: {
    fontSize: 12,
    color: '#6a8aaa',
    marginTop: 4,
  },
  advancedTacticsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  advancedTacticsTag: {
    backgroundColor: '#1a4a3c',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  advancedTacticsTagText: {
    fontSize: 9,
    color: '#00ff88',
    fontWeight: '600',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    marginBottom: 8,
  },
  featureInfo: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  featureDescription: {
    fontSize: 11,
    color: '#6a8aaa',
    marginTop: 2,
  },
  formationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formationButton: {
    backgroundColor: '#0d2137',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1a4a6c',
  },
  formationButtonActive: {
    borderColor: '#00ff88',
    backgroundColor: '#1a4a3c',
  },
  formationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6a8aaa',
  },
  formationTextActive: {
    color: '#00ff88',
  },
  pitchPreview: {
    backgroundColor: '#0d4a2f',
    padding: 40,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a6a4f',
  },
  pitchLine: {
    width: 60,
    height: 2,
    backgroundColor: '#ffffff40',
    marginBottom: 20,
  },
  formationDisplay: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  pitchNote: {
    fontSize: 11,
    color: '#ffffff60',
    marginTop: 20,
  },
  leagueToggle: {
    flexDirection: 'row',
    backgroundColor: '#0d2137',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#1a4a6c',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6a8aaa',
    letterSpacing: 1,
  },
  toggleTextActive: {
    color: '#fff',
  },
  fullTable: {
    backgroundColor: '#0d2137',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#1a3a5c',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6a8aaa',
    width: 24,
    textAlign: 'center',
  },
  tablePosCol: {
    width: 24,
  },
  tableTeamCol: {
    flex: 1,
    textAlign: 'left',
  },
  tablePtsCol: {
    width: 30,
  },
  tableDataRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  tableData: {
    fontSize: 11,
    color: '#9ab8d8',
    width: 24,
    textAlign: 'center',
  },
  weekSection: {
    marginBottom: 16,
  },
  weekTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4a9eff',
    marginBottom: 8,
  },
  fixtureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    padding: 10,
    borderRadius: 4,
    marginBottom: 4,
  },
  fixtureRowHighlight: {
    backgroundColor: '#1a4a3c',
  },
  fixtureTeam: {
    flex: 1,
    fontSize: 11,
    color: '#9ab8d8',
  },
  fixtureScore: {
    paddingHorizontal: 12,
  },
  fixtureScoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  fixtureVs: {
    fontSize: 10,
    color: '#4a6a8a',
  },
  budgetDisplay: {
    backgroundColor: '#1a4a3c',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  budgetLabel: {
    fontSize: 11,
    color: '#6a8aaa',
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#00ff88',
  },
  transferCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    marginBottom: 8,
  },
  transferInfo: {
    flex: 1,
    marginRight: 12,
  },
  transferName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  transferMeta: {
    fontSize: 11,
    color: '#6a8aaa',
    marginTop: 2,
  },
  transferStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  transferStat: {
    fontSize: 9,
    color: '#4a9eff',
    fontWeight: '600',
  },
  transferAction: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  transferPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00ff88',
  },
  offerButton: {
    backgroundColor: '#4a9eff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  offerButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  // Search styles
  searchSection: {
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    borderWidth: 1,
    borderColor: '#1a4a6c',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 13,
  },
  positionFilterScroll: {
    flexGrow: 0,
  },
  positionFilterContent: {
    gap: 6,
    paddingRight: 16,
  },
  positionChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#0d2137',
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  positionChipActive: {
    backgroundColor: '#1a4a3c',
    borderColor: '#00ff88',
  },
  positionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6a8aaa',
  },
  positionChipTextActive: {
    color: '#00ff88',
  },
  noResults: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#0d2137',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  noResultsText: {
    color: '#6a8aaa',
    fontSize: 14,
    marginTop: 8,
  },
  // Squad position badges
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  positionBadge: {
    backgroundColor: '#1a4a6c',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  positionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4a9eff',
  },
  // Transfer Offer Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  transferOfferModal: {
    backgroundColor: '#0d2137',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '75%',
  },
  transferOfferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1a4a6c',
  },
  transferOfferTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  transferOfferPlayerInfo: {
    padding: 20,
    backgroundColor: '#0a1628',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  transferOfferPlayerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00ff88',
    marginBottom: 6,
  },
  transferOfferPlayerMeta: {
    fontSize: 12,
    color: '#6a8aaa',
    marginBottom: 8,
  },
  transferOfferAskingPrice: {
    fontSize: 14,
    color: '#4a9eff',
    fontWeight: '600',
  },
  transferOfferSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  transferOfferSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6a8aaa',
    letterSpacing: 1,
    marginBottom: 12,
  },
  transferFeeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a1628',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  transferFeePrefix: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4a9eff',
  },
  transferFeeButton: {
    padding: 4,
  },
  transferFeeValueContainer: {
    alignItems: 'center',
    minWidth: 140,
  },
  transferFeeInput: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    minWidth: 140,
    padding: 0,
  },
  transferFeePresets: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  transferFeePresetButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#1a3a5c',
    borderRadius: 6,
    alignItems: 'center',
  },
  transferFeePresetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a9eff',
  },
  wageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a1628',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  wageInputPrefix: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4a9eff',
  },
  wageButton: {
    padding: 4,
  },
  wageValueContainer: {
    alignItems: 'center',
    minWidth: 120,
  },
  wageInput: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    minWidth: 120,
    padding: 0,
  },
  wageValueLabel: {
    fontSize: 10,
    color: '#6a8aaa',
    marginTop: 2,
  },
  wagePresets: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  wagePresetButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#1a3a5c',
    borderRadius: 6,
    alignItems: 'center',
  },
  wagePresetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a9eff',
  },
  transferOfferInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#0a1628',
    borderRadius: 8,
    gap: 8,
  },
  transferOfferInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transferOfferInfoLabel: {
    fontSize: 12,
    color: '#6a8aaa',
  },
  transferOfferInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  submitOfferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ff88',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  submitOfferButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a1628',
    letterSpacing: 1,
  },
});
