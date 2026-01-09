import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
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
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractYear, setContractYear] = useState(2026);
  const [contractMonth, setContractMonth] = useState(6);
  const [proposedWage, setProposedWage] = useState(0);
  const [wageInputText, setWageInputText] = useState('0');

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
    // Colors based on 1-20 scale
    if (value >= 16) return '#00ff88';  // Excellent (16-20)
    if (value >= 13) return '#4a9eff';  // Good (13-15)
    if (value >= 10) return '#ffcc00';  // Average (10-12)
    if (value >= 7) return '#ff9f43';   // Below Average (7-9)
    return '#ff6b6b';                    // Poor (1-6)
  };

  const getMoraleText = (morale: number) => {
    // Morale is on 1-20 scale
    if (morale >= 16) return 'Excellent';
    if (morale >= 12) return 'Good';
    if (morale >= 8) return 'Average';
    if (morale >= 4) return 'Poor';
    return 'Very Poor';
  };

  const getFormText = (form: number) => {
    // Form is on 1-20 scale
    if (form >= 16) return 'Outstanding';
    if (form >= 12) return 'Good';
    if (form >= 8) return 'Average';
    if (form >= 4) return 'Poor';
    return 'Terrible';
  };

  const isOwnPlayer = managedTeam?.squad.some(p => p.id === player.id);

  const handleRenewContract = () => {
    if (!isOwnPlayer) {
      Alert.alert('Not Your Player', 'This player is not in your squad.');
      return;
    }
    setShowActionsMenu(false);
    // Initialize with current values
    const currentYear = parseInt(player.contract_end.split('-')[0]);
    const currentMonth = parseInt(player.contract_end.split('-')[1]);
    setContractYear(currentYear + 1); // Offer 1 year extension by default
    setContractMonth(currentMonth);
    setProposedWage(player.wage); // Start with current wage
    setWageInputText(player.wage.toLocaleString());
    setShowContractModal(true);
  };

  const handleContractOffer = () => {
    const minimumWage = Math.floor(player.wage * 0.9);
    
    if (proposedWage < minimumWage) {
      Alert.alert(
        'Offer Too Low',
        `${player.name} will not accept less than ${formatWage(minimumWage)} per week.\n\nCurrent wage: ${formatWage(player.wage)}\nYour offer: ${formatWage(proposedWage)}`,
        [
          { text: 'Revise Offer', style: 'cancel' },
          {
            text: 'Cancel Negotiation',
            style: 'destructive',
            onPress: () => setShowContractModal(false)
          }
        ]
      );
      return;
    }

    // Check if player has already renewed contract this season
    const currentSeason = currentSave?.season || 2025;
    if (player.last_contract_renewal && player.last_contract_renewal === currentSeason) {
      Alert.alert(
        'Contract Already Renewed',
        `${player.name} has already renewed their contract this season. You can only renew once per season per player.`,
        [{ text: 'OK', onPress: () => setShowContractModal(false) }]
      );
      return;
    }

    // Contract accepted!
    const newContractEnd = `${contractYear}-${String(contractMonth).padStart(2, '0')}-30`;
    
    Alert.alert(
      'Contract Accepted!',
      `${player.name} has agreed to the new contract:\n\nNew wage: ${formatWage(proposedWage)}/week\nContract until: ${newContractEnd}`,
      [
        {
          text: 'Confirm',
          onPress: () => {
            // Update player contract in the game context
            player.wage = proposedWage;
            player.contract_end = newContractEnd;
            player.last_contract_renewal = currentSeason; // Mark as renewed this season
            setShowContractModal(false);
            Alert.alert('Success', 'Contract has been updated!');
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

  const StatItem = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{Math.round(value)}</Text>
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
            <Text style={styles.overallRatingValue}>{Math.round(player.current_ability)}</Text>
            <Text style={styles.overallRatingLabel}>OVR</Text>
          </View>
        </View>

        {/* Quick Info */}
        <View style={styles.quickInfoGrid}>
          <View style={styles.quickInfoItem}>
            <Text style={styles.quickInfoValue}>{Math.round(player.potential_ability)}</Text>
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
          <View style={styles.statsGrid}>
            {positionStats.stats.map((stat, index) => (
              <StatItem 
                key={index} 
                label={stat.label} 
                value={stat.value} 
                color={getAbilityColor(stat.value)}
              />
            ))}
          </View>
        </View>

        {/* Physical Attributes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PHYSICAL</Text>
          <View style={styles.statsGrid}>
            <StatItem label="Pace" value={player.pace} color={getAbilityColor(player.pace)} />
            <StatItem label="Strength" value={player.strength} color={getAbilityColor(player.strength)} />
            <StatItem label="Stamina" value={player.stamina} color={getAbilityColor(player.stamina)} />
            <StatItem label="Agility" value={player.agility} color={getAbilityColor(player.agility)} />
          </View>
        </View>

        {/* Mental Attributes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MENTAL</Text>
          <View style={styles.statsGrid}>
            <StatItem label="Work Rate" value={player.work_rate} color={getAbilityColor(player.work_rate)} />
            <StatItem label="Concentration" value={player.concentration} color={getAbilityColor(player.concentration)} />
            <StatItem label="Decision Making" value={player.decision_making} color={getAbilityColor(player.decision_making)} />
            <StatItem label="Composure" value={player.composure} color={getAbilityColor(player.composure)} />
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
          </View>
        </View>

        {/* Condition & Form */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CURRENT FORM</Text>
            <TouchableOpacity onPress={() => setShowFormHistory(!showFormHistory)}>
              <Text style={styles.expandLink}>
                {showFormHistory ? 'Hide History' : 'View History'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Recent Form</Text>
              <Text style={[styles.infoValue, { color: getAbilityColor(player.form) }]}>
                {((player.form / 100) * 9 + 1).toFixed(1)}/10.0
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

          {/* Form History */}
          {showFormHistory && (
            <View style={styles.formHistoryCard}>
              <Text style={styles.formHistoryTitle}>Last 10 Matches</Text>
              {formHistory.map((match, index) => (
                <View key={index} style={styles.formHistoryRow}>
                  <Text style={styles.formHistoryMatch}>{match.match}</Text>
                  <View style={styles.formHistoryResult}>
                    <Text style={[
                      styles.formHistoryResultText,
                      { color: match.result === 'W' ? '#00ff88' : match.result === 'D' ? '#ffcc00' : '#ff6b6b' }
                    ]}>
                      {match.result}
                    </Text>
                  </View>
                  <Text style={styles.formHistoryRating}>Rating: {match.rating}</Text>
                </View>
              ))}
              <Text style={styles.formHistoryNote}>
                * Mock data - full match tracking coming soon
              </Text>
            </View>
          )}
        </View>

        {/* Career Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CAREER STATISTICS</Text>
          
          {/* Season Stats */}
          <View style={styles.careerStatsTable}>
            <View style={styles.careerStatsHeader}>
              <Text style={[styles.careerStatsHeaderText, { flex: 2 }]}>Season</Text>
              <Text style={styles.careerStatsHeaderText}>Apps</Text>
              <Text style={styles.careerStatsHeaderText}>Goals</Text>
              <Text style={styles.careerStatsHeaderText}>Assists</Text>
            </View>
            {careerStatsBySeason.map((season, index) => (
              <View key={index} style={styles.careerStatsRow}>
                <Text style={[styles.careerStatsCell, { flex: 2, fontWeight: '600' }]}>{season.season}</Text>
                <Text style={styles.careerStatsCell}>{season.apps}</Text>
                <Text style={styles.careerStatsCell}>{season.goals}</Text>
                <Text style={styles.careerStatsCell}>{season.assists}</Text>
              </View>
            ))}
            <View style={[styles.careerStatsRow, styles.careerStatsTotalRow]}>
              <Text style={[styles.careerStatsCell, { flex: 2, fontWeight: '700', color: '#00ff88' }]}>
                Total Career
              </Text>
              <Text style={[styles.careerStatsCell, { fontWeight: '700', color: '#00ff88' }]}>
                {careerStatsBySeason.reduce((sum, s) => sum + s.apps, 0)}
              </Text>
              <Text style={[styles.careerStatsCell, { fontWeight: '700', color: '#00ff88' }]}>
                {careerStatsBySeason.reduce((sum, s) => sum + s.goals, 0)}
              </Text>
              <Text style={[styles.careerStatsCell, { fontWeight: '700', color: '#00ff88' }]}>
                {careerStatsBySeason.reduce((sum, s) => sum + s.assists, 0)}
              </Text>
            </View>
          </View>
          <Text style={styles.careerNote}>* Mock data - full career tracking in development</Text>
        </View>

        {/* Actions Button */}
        {isOwnPlayer && (
          <TouchableOpacity 
            style={styles.actionsButton}
            onPress={() => setShowActionsMenu(true)}
          >
            <Ionicons name="menu-outline" size={20} color="#fff" />
            <Text style={styles.actionsButtonText}>PLAYER ACTIONS</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Actions Menu Modal */}
      <Modal
        visible={showActionsMenu}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActionsMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionsMenu(false)}
        >
          <View style={styles.actionsModal}>
            <View style={styles.actionsModalHeader}>
              <Text style={styles.actionsModalTitle}>Player Actions</Text>
              <TouchableOpacity onPress={() => setShowActionsMenu(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.actionItem} onPress={handleRenewContract}>
              <Ionicons name="document-text-outline" size={24} color="#4a9eff" />
              <View style={styles.actionItemInfo}>
                <Text style={styles.actionItemTitle}>Renew Contract</Text>
                <Text style={styles.actionItemSubtitle}>Offer new contract terms</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#4a6a8a" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={handleListForTransfer}>
              <Ionicons name="swap-horizontal-outline" size={24} color="#ffcc00" />
              <View style={styles.actionItemInfo}>
                <Text style={styles.actionItemTitle}>List for Transfer</Text>
                <Text style={styles.actionItemSubtitle}>Put player on transfer market</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#4a6a8a" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => {
                setShowActionsMenu(false);
                Alert.alert('Coming Soon', 'Player training feature will be added in future update.');
              }}
            >
              <Ionicons name="fitness-outline" size={24} color="#00ff88" />
              <View style={styles.actionItemInfo}>
                <Text style={styles.actionItemTitle}>Individual Training</Text>
                <Text style={styles.actionItemSubtitle}>Set training focus</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#4a6a8a" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionItem, { borderBottomWidth: 0 }]}
              onPress={() => {
                setShowActionsMenu(false);
                Alert.alert('Coming Soon', 'Squad role assignment will be added in future update.');
              }}
            >
              <Ionicons name="star-outline" size={24} color="#ff9f43" />
              <View style={styles.actionItemInfo}>
                <Text style={styles.actionItemTitle}>Squad Role</Text>
                <Text style={styles.actionItemSubtitle}>Set as captain, vice-captain, etc.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#4a6a8a" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Contract Renewal Modal */}
      <Modal
        visible={showContractModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowContractModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowContractModal(false)}
        >
          <View style={styles.contractModal} onStartShouldSetResponder={() => true}>
            <View style={styles.contractModalHeader}>
              <Text style={styles.contractModalTitle}>CONTRACT RENEWAL</Text>
              <TouchableOpacity onPress={() => setShowContractModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.contractPlayerInfo}>
                <Text style={styles.contractPlayerName}>{player.name}</Text>
                <Text style={styles.contractCurrentInfo}>
                  Current: {formatWage(player.wage)}/week • Expires {player.contract_end}
                </Text>
              </View>

            {/* Contract End Date */}
            <View style={styles.contractSection}>
              <Text style={styles.contractSectionTitle}>CONTRACT UNTIL</Text>
              <View style={styles.datePickers}>
                <View style={styles.datePickerGroup}>
                  <Text style={styles.datePickerLabel}>Year</Text>
                  <View style={styles.pickerButtons}>
                    {[2026, 2027, 2028, 2029, 2030].map(year => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.pickerButton,
                          contractYear === year && styles.pickerButtonActive
                        ]}
                        onPress={() => setContractYear(year)}
                      >
                        <Text style={[
                          styles.pickerButtonText,
                          contractYear === year && styles.pickerButtonTextActive
                        ]}>
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.datePickerGroup}>
                  <Text style={styles.datePickerLabel}>Month</Text>
                  <View style={styles.pickerButtons}>
                    <TouchableOpacity
                      style={[
                        styles.pickerButton,
                        styles.pickerButtonActive
                      ]}
                      disabled
                    >
                      <Text style={[
                        styles.pickerButtonText,
                        styles.pickerButtonTextActive
                      ]}>
                        June
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.datePickerNote}>Contracts end at season close</Text>
                </View>
              </View>
            </View>

            {/* Weekly Wage */}
            <View style={styles.contractSection}>
              <Text style={styles.contractSectionTitle}>WEEKLY WAGE</Text>
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
                    setProposedWage(player.wage);
                    setWageInputText(player.wage.toLocaleString());
                  }}
                >
                  <Text style={styles.wagePresetText}>Current Wage</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.wageInfo}>
                <View style={styles.wageInfoRow}>
                  <Text style={styles.wageInfoLabel}>Current Wage:</Text>
                  <Text style={styles.wageInfoValue}>{formatWage(player.wage)}</Text>
                </View>
                <View style={styles.wageInfoRow}>
                  <Text style={styles.wageInfoLabel}>Your Offer:</Text>
                  <Text style={[styles.wageInfoValue, { fontWeight: '700' }]}>
                    {formatWage(proposedWage)}
                  </Text>
                </View>
              </View>
            </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.contractOfferButton}
              onPress={handleContractOffer}
            >
              <Ionicons name="document-text" size={20} color="#0a1628" />
              <Text style={styles.contractOfferButtonText}>OFFER CONTRACT</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  },
  statsGrid: {
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '47%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#0a1628',
    borderRadius: 6,
  },
  statLabel: {
    fontSize: 13,
    color: '#9ab8d8',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  expandLink: {
    fontSize: 12,
    color: '#4a9eff',
    fontWeight: '600',
  },
  formHistoryCard: {
    backgroundColor: '#0d2137',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    marginTop: 12,
  },
  formHistoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6a8aaa',
    marginBottom: 8,
  },
  formHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  formHistoryMatch: {
    flex: 1,
    fontSize: 11,
    color: '#9ab8d8',
  },
  formHistoryResult: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1a3a5c',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  formHistoryResultText: {
    fontSize: 10,
    fontWeight: '700',
  },
  formHistoryRating: {
    fontSize: 11,
    color: '#6a8aaa',
    width: 80,
    textAlign: 'right',
  },
  formHistoryNote: {
    fontSize: 10,
    color: '#4a6a8a',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  careerStatsTable: {
    backgroundColor: '#0d2137',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    overflow: 'hidden',
  },
  careerStatsHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a3a5c',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  careerStatsHeaderText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#6a8aaa',
    textAlign: 'center',
  },
  careerStatsRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  careerStatsTotalRow: {
    backgroundColor: '#1a4a3c',
    borderBottomWidth: 0,
  },
  careerStatsCell: {
    flex: 1,
    fontSize: 12,
    color: '#9ab8d8',
    textAlign: 'center',
  },
  actionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a9eff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  actionsButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  actionsModal: {
    backgroundColor: '#0d2137',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  actionsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a4a6c',
  },
  actionsModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a4a6c',
  },
  actionItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  actionItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  actionItemSubtitle: {
    fontSize: 12,
    color: '#6a8aaa',
    marginTop: 2,
  },
  contractModal: {
    backgroundColor: '#0d2137',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '75%',
  },
  contractModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1a4a6c',
  },
  contractModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  contractPlayerInfo: {
    padding: 20,
    backgroundColor: '#0a1628',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  contractPlayerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00ff88',
    marginBottom: 6,
  },
  contractCurrentInfo: {
    fontSize: 12,
    color: '#6a8aaa',
  },
  contractSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  contractSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6a8aaa',
    letterSpacing: 1,
    marginBottom: 12,
  },
  datePickers: {
    gap: 16,
  },
  datePickerGroup: {
    marginBottom: 12,
  },
  datePickerLabel: {
    fontSize: 11,
    color: '#4a9eff',
    marginBottom: 8,
    fontWeight: '600',
  },
  datePickerNote: {
    fontSize: 10,
    color: '#6a8aaa',
    marginTop: 6,
    fontStyle: 'italic',
  },
  pickerButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pickerButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#1a3a5c',
    borderWidth: 2,
    borderColor: '#2a5a8c',
  },
  pickerButtonActive: {
    backgroundColor: '#1a4a3c',
    borderColor: '#00ff88',
  },
  pickerButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6a8aaa',
  },
  pickerButtonTextActive: {
    color: '#00ff88',
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
  wageValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
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
  wageInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#0a1628',
    borderRadius: 8,
    gap: 8,
  },
  wageInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wageInfoLabel: {
    fontSize: 12,
    color: '#6a8aaa',
  },
  wageInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  contractOfferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ff88',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  contractOfferButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a1628',
    letterSpacing: 1,
  },
});
