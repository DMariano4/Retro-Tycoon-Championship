import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../../context/GameContext';
import { formatValue, formatWageShort } from '../../utils/formatters';
import { gameStyles as styles } from './gameStyles';

export function TransfersTab() {
  const { currentSave, makeTransferOffer, getManagedTeam } = useGame();
  const team = getManagedTeam();
  const currency = currentSave?.currency_symbol || '£';
  const [searchPlayer, setSearchPlayer] = useState('');
  const [searchClub, setSearchClub] = useState('');
  const [positionFilter, setPositionFilter] = useState<string | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [proposedFee, setProposedFee] = useState(0);
  const [proposedWage, setProposedWage] = useState(0);
  const [feeInputText, setFeeInputText] = useState('0');
  const [wageInputText, setWageInputText] = useState('0');

  const formatWageLocal = (wage: number) => {
    if (wage >= 1000) return `${currency}${(wage / 1000).toFixed(1)}K`;
    return `${currency}${wage}`;
  };

  const handleMakeOffer = async (listing: any) => {
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

    if (proposedFee < minimumFee || proposedWage < minimumWage) {
      setShowOfferModal(false);
      Alert.alert(
        'Offer Rejected',
        `${selectedListing.team_name} has rejected your transfer proposal for ${selectedListing.player.name}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (proposedFee > team.budget) {
      Alert.alert(
        'Insufficient Funds',
        `You don't have enough budget for this transfer.\n\nYour budget: ${formatValue(team.budget, currency)}\nTransfer fee: ${formatValue(proposedFee, currency)}`,
        [{ text: 'Revise Offer', style: 'cancel' }]
      );
      return;
    }

    const result = await makeTransferOffer(selectedListing.id, proposedFee, proposedWage);
    setShowOfferModal(false);

    if (result) {
      Alert.alert(
        'Transfer Complete!',
        `${selectedListing.player.name} has joined your team!\n\nTransfer fee: ${formatValue(proposedFee, currency)}\nWeekly wage: ${formatWageLocal(proposedWage)}`,
        [{ text: 'Great!' }]
      );
    } else {
      Alert.alert('Error', 'Failed to complete transfer. Please try again.');
    }
  };

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
        <Text style={styles.budgetValue}>{formatValue(currentSave?.budget || 0, currency)}</Text>
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
                <Text style={styles.transferPrice}>{formatValue(listing.asking_price, currency)}</Text>
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
                    Asking Price: {formatValue(selectedListing.asking_price, currency)}
                  </Text>
                </View>

                {/* Transfer Fee Section */}
                <View style={styles.transferOfferSection}>
                  <Text style={styles.transferOfferSectionTitle}>TRANSFER FEE</Text>
                  <View style={styles.transferFeeInputContainer}>
                    <Text style={styles.transferFeePrefix}>{currency}</Text>
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
                    <Text style={styles.wageInputPrefix}>{currency}</Text>
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
                      <Text style={styles.transferOfferInfoValue}>{formatWageLocal(selectedListing.player.wage)}</Text>
                    </View>
                    <View style={styles.transferOfferInfoRow}>
                      <Text style={styles.transferOfferInfoLabel}>Your Offer:</Text>
                      <Text style={[styles.transferOfferInfoValue, { fontWeight: '700' }]}>
                        {formatWageLocal(proposedWage)}
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
