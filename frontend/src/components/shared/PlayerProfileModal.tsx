/**
 * PlayerProfileModal - Reusable modal to view any player's profile and make bids
 * Can be opened from anywhere in the app
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Player, Team, useGame } from '../../context/GameContext';

interface PlayerProfileModalProps {
  visible: boolean;
  player: Player | null;
  team: Team | null;
  onClose: () => void;
  onBidSuccess?: () => void;
}

export function PlayerProfileModal({ visible, player, team, onClose, onBidSuccess }: PlayerProfileModalProps) {
  const { currentSave, makeUnlistedBid } = useGame();
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!player || !team) return null;

  const isOwnPlayer = team.id === currentSave?.managed_team_id;
  const currency = currentSave?.currency_symbol || '£';

  // Calculate player value (consistent with aiManager.ts - 1-20 ability scale)
  const getPlayerValue = (): number => {
    const ability = player.current_ability || 10;
    const baseValue = ability * 500000;  // £500K per ability point
    
    // Age multiplier
    let ageMultiplier = 1.0;
    if (player.age < 21) ageMultiplier = 1.6;
    else if (player.age < 24) ageMultiplier = 1.4;
    else if (player.age < 28) ageMultiplier = 1.1;
    else if (player.age < 30) ageMultiplier = 1.0;
    else if (player.age < 32) ageMultiplier = 0.7;
    else ageMultiplier = 0.5;
    
    const positionMultiplier = ['ST', 'CF', 'LW', 'RW', 'CAM'].includes(player.position) ? 1.3 : 1.0;
    return Math.round(baseValue * ageMultiplier * positionMultiplier);
  };

  const estimatedValue = getPlayerValue();

  // Format currency with user's chosen symbol
  const formatMoney = (amount: number): string => {
    if (amount >= 1000000) return `${currency}${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${currency}${(amount / 1000).toFixed(0)}K`;
    return `${currency}${amount}`;
  };

  // Handle making a bid
  const handleMakeBid = async () => {
    const amount = parseInt(bidAmount.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Bid', 'Please enter a valid bid amount');
      return;
    }

    if (amount > (currentSave?.budget || 0)) {
      Alert.alert('Insufficient Funds', 'You cannot afford this bid');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await makeUnlistedBid(player.id, team.id, amount);
      setIsSubmitting(false);

      if (result && result.accepted) {
        Alert.alert(
          '🎉 Transfer Complete!', 
          `${player.name} has joined your squad for ${formatMoney(amount)}!`,
          [{ text: 'OK', onPress: () => {
            setShowBidModal(false);
            setBidAmount('');
            onClose();
            onBidSuccess?.();
          }}]
        );
      } else {
        Alert.alert('Bid Rejected', result?.reason || `${team.name} have rejected your bid.`);
      }
    } catch (error) {
      setIsSubmitting(false);
      console.error('Transfer error:', error);
      Alert.alert('Error', 'Something went wrong with the transfer. Please try again.');
    }
  };

  // Attribute row component
  const AttributeRow = ({ label, value }: { label: string; value: number }) => (
    <View style={styles.attributeRow}>
      <Text style={styles.attributeLabel}>{label}</Text>
      <View style={styles.attributeBarContainer}>
        <View style={[styles.attributeBar, { width: `${Math.min((value || 10) * 5, 100)}%` }]} />
      </View>
      <Text style={styles.attributeValue}>{value || '-'}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Player Profile</Text>
            <View style={styles.headerRight} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Player Header */}
            <View style={styles.playerHeader}>
              <View style={styles.positionBadge}>
                <Text style={styles.positionText}>{player.position}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                <TouchableOpacity style={styles.teamLink}>
                  <Text style={styles.teamName}>{team.name}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingValue}>{player.overall || '?'}</Text>
                <Text style={styles.ratingLabel}>OVR</Text>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatLabel}>Age</Text>
                <Text style={styles.quickStatValue}>{player.age}</Text>
              </View>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatLabel}>Value</Text>
                <Text style={styles.quickStatValue}>{formatMoney(estimatedValue)}</Text>
              </View>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatLabel}>Wage</Text>
                <Text style={styles.quickStatValue}>{formatMoney(player.wage || 0)}/w</Text>
              </View>
            </View>

            {/* Transfer Section - Moved to top for visibility (only for other teams' players) */}
            {!isOwnPlayer && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>TRANSFER</Text>
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
                <Text style={styles.budgetHint}>
                  Your budget: {formatMoney(currentSave?.budget || 0)}
                </Text>
              </View>
            )}

            {/* Attributes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ATTRIBUTES</Text>
              <View style={styles.attributesGrid}>
                {player.position === 'GK' ? (
                  <>
                    <AttributeRow label="Shot Stopping" value={player.shot_stopping || 10} />
                    <AttributeRow label="Handling" value={player.handling || 10} />
                    <AttributeRow label="Reflexes" value={player.reflexes || 10} />
                    <AttributeRow label="Positioning" value={player.positioning || 10} />
                  </>
                ) : (
                  <>
                    <AttributeRow label="Pace" value={player.pace} />
                    <AttributeRow label="Shooting" value={player.finishing} />
                    <AttributeRow label="Passing" value={player.passing} />
                    <AttributeRow label="Dribbling" value={player.technique} />
                    <AttributeRow label="Defending" value={player.tackling} />
                    <AttributeRow label="Physical" value={player.stamina} />
                  </>
                )}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Bid Modal */}
        <Modal visible={showBidModal} transparent animationType="fade">
          <View style={styles.bidOverlay}>
            <View style={styles.bidContainer}>
              <Text style={styles.bidTitle}>Transfer Bid</Text>
              <Text style={styles.bidSubtitle}>Make an offer for {player.name}</Text>

              <View style={styles.bidInputContainer}>
                <Text style={styles.bidInputPrefix}>{currency}</Text>
                <TextInput
                  style={styles.bidInput}
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor="#4a6a8a"
                />
              </View>

              <View style={styles.quickBids}>
                {[0.8, 1.0, 1.2, 1.5].map(mult => (
                  <TouchableOpacity
                    key={mult}
                    style={styles.quickBidButton}
                    onPress={() => setBidAmount(Math.round(estimatedValue * mult).toString())}
                  >
                    <Text style={styles.quickBidText}>{formatMoney(Math.round(estimatedValue * mult))}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.bidButtons}>
                <TouchableOpacity
                  style={[styles.bidActionButton, styles.bidCancelButton]}
                  onPress={() => {
                    setShowBidModal(false);
                    setBidAmount('');
                  }}
                >
                  <Text style={styles.bidActionText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.bidActionButton, styles.bidConfirmButton]}
                  onPress={handleMakeBid}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.bidActionText, { color: '#0a1628' }]}>
                    {isSubmitting ? 'Submitting...' : 'Submit Bid'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
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
  positionBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a4a6c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4a9eff',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  playerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  teamLink: {
    marginTop: 4,
  },
  teamName: {
    fontSize: 13,
    color: '#4a9eff',
  },
  ratingBadge: {
    alignItems: 'center',
    backgroundColor: '#00ff88',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  ratingValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0a1628',
  },
  ratingLabel: {
    fontSize: 10,
    fontWeight: '600',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
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
  budgetHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6a8aaa',
    marginTop: 10,
  },
  // Bid Modal Styles
  bidOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  bidContainer: {
    backgroundColor: '#0d2137',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 2,
    borderColor: '#1a4a6c',
  },
  bidTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  bidSubtitle: {
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
  quickBids: {
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
  quickBidText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4a9eff',
  },
  bidButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  bidActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bidCancelButton: {
    backgroundColor: '#1a4a6c',
  },
  bidConfirmButton: {
    backgroundColor: '#00ff88',
  },
  bidActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
