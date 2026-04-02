/**
 * Transfer Inbox - View and respond to incoming transfer offers from AI teams
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/context/GameContext';
import { IncomingOffer } from '../src/utils/aiManager';

export default function TransferInboxScreen() {
  const { getIncomingOffers, acceptOffer, rejectOffer, currentSave } = useGame();
  const [selectedOffer, setSelectedOffer] = useState<IncomingOffer | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const pendingOffers = getIncomingOffers();

  // Format currency
  const formatMoney = (amount: number): string => {
    if (amount >= 1000000) return `£${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `£${(amount / 1000).toFixed(0)}K`;
    return `£${amount}`;
  };

  // Get offer quality indicator
  const getOfferQuality = (offer: IncomingOffer): { label: string; color: string } => {
    const percentage = (offer.offerAmount / offer.playerValue) * 100;
    if (percentage >= 120) return { label: 'Excellent', color: '#00ff88' };
    if (percentage >= 100) return { label: 'Fair', color: '#4a9eff' };
    if (percentage >= 85) return { label: 'Low', color: '#ffa500' };
    return { label: 'Very Low', color: '#ff6b6b' };
  };

  const handleAccept = async (offer: IncomingOffer) => {
    Alert.alert(
      'Accept Offer?',
      `Sell ${offer.playerName} to ${offer.fromTeamName} for ${formatMoney(offer.offerAmount)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setIsProcessing(true);
            const result = await acceptOffer(offer.id);
            setIsProcessing(false);
            
            if (result.success) {
              Alert.alert('✅ Transfer Complete!', result.message);
              setShowOfferModal(false);
              setSelectedOffer(null);
            } else {
              Alert.alert('Transfer Failed', result.message);
            }
          },
        },
      ]
    );
  };

  const handleReject = (offer: IncomingOffer) => {
    Alert.alert(
      'Reject Offer?',
      `Are you sure you want to reject ${offer.fromTeamName}'s offer for ${offer.playerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            rejectOffer(offer.id);
            setShowOfferModal(false);
            setSelectedOffer(null);
          },
        },
      ]
    );
  };

  const renderOfferCard = (offer: IncomingOffer) => {
    const quality = getOfferQuality(offer);
    
    return (
      <TouchableOpacity
        key={offer.id}
        style={styles.offerCard}
        onPress={() => {
          setSelectedOffer(offer);
          setShowOfferModal(true);
        }}
      >
        <View style={styles.offerHeader}>
          <View style={styles.playerBadge}>
            <Text style={styles.playerPosition}>{offer.playerPosition}</Text>
          </View>
          <View style={styles.offerInfo}>
            <Text style={styles.playerName}>{offer.playerName}</Text>
            <Text style={styles.teamName}>From: {offer.fromTeamName}</Text>
          </View>
          <View style={[styles.qualityBadge, { backgroundColor: quality.color }]}>
            <Text style={styles.qualityText}>{quality.label}</Text>
          </View>
        </View>
        
        <View style={styles.offerDetails}>
          <View style={styles.offerStat}>
            <Text style={styles.offerStatLabel}>Offer</Text>
            <Text style={styles.offerStatValue}>{formatMoney(offer.offerAmount)}</Text>
          </View>
          <View style={styles.offerStat}>
            <Text style={styles.offerStatLabel}>Value</Text>
            <Text style={styles.offerStatValue}>{formatMoney(offer.playerValue)}</Text>
          </View>
          <View style={styles.offerStat}>
            <Text style={styles.offerStatLabel}>Form</Text>
            <Text style={[styles.offerStatValue, { 
              color: (offer.playerForm || 6) >= 7.5 ? '#00ff88' : 
                     (offer.playerForm || 6) >= 5.5 ? '#ffaa00' : '#ff6b6b' 
            }]}>
              {(offer.playerForm || 6).toFixed(1)}
            </Text>
          </View>
          <View style={styles.offerStat}>
            <Text style={styles.offerStatLabel}>Diff</Text>
            <Text style={[styles.offerStatValue, { 
              color: offer.offerAmount >= offer.playerValue ? '#00ff88' : '#ff6b6b' 
            }]}>
              {offer.offerAmount >= offer.playerValue ? '+' : ''}
              {Math.round(((offer.offerAmount / offer.playerValue) - 1) * 100)}%
            </Text>
          </View>
        </View>
        
        <View style={styles.offerActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(offer)}
          >
            <Text style={styles.rejectButtonText}>REJECT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAccept(offer)}
          >
            <Text style={styles.acceptButtonText}>ACCEPT</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#00ff88" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transfer Inbox</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{pendingOffers.length}</Text>
        </View>
      </View>

      {/* Budget Display */}
      <View style={styles.budgetBar}>
        <Text style={styles.budgetLabel}>Current Budget:</Text>
        <Text style={styles.budgetValue}>{formatMoney(currentSave?.budget || 0)}</Text>
      </View>

      {/* Offers List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {pendingOffers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="mail-open-outline" size={60} color="#2a4a6a" />
            <Text style={styles.emptyTitle}>No Pending Offers</Text>
            <Text style={styles.emptyText}>
              AI teams will send transfer bids for your players as the season progresses.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>PENDING OFFERS ({pendingOffers.length})</Text>
            {pendingOffers.map(renderOfferCard)}
          </>
        )}
      </ScrollView>

      {/* Offer Detail Modal */}
      <Modal visible={showOfferModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOffer && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Transfer Offer</Text>
                  <TouchableOpacity onPress={() => {
                    setShowOfferModal(false);
                    setSelectedOffer(null);
                  }}>
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalPlayerInfo}>
                  <View style={styles.modalPlayerBadge}>
                    <Text style={styles.modalPlayerPosition}>{selectedOffer.playerPosition}</Text>
                  </View>
                  <View>
                    <Text style={styles.modalPlayerName}>{selectedOffer.playerName}</Text>
                    <Text style={styles.modalPlayerRating}>Overall: {selectedOffer.playerOverall}</Text>
                  </View>
                </View>

                <View style={styles.modalOfferDetails}>
                  <View style={styles.modalOfferRow}>
                    <Text style={styles.modalOfferLabel}>Bidding Club:</Text>
                    <Text style={styles.modalOfferValue}>{selectedOffer.fromTeamName}</Text>
                  </View>
                  <View style={styles.modalOfferRow}>
                    <Text style={styles.modalOfferLabel}>Offer Amount:</Text>
                    <Text style={[styles.modalOfferValue, { color: '#00ff88' }]}>
                      {formatMoney(selectedOffer.offerAmount)}
                    </Text>
                  </View>
                  <View style={styles.modalOfferRow}>
                    <Text style={styles.modalOfferLabel}>Player Value:</Text>
                    <Text style={styles.modalOfferValue}>{formatMoney(selectedOffer.playerValue)}</Text>
                  </View>
                  <View style={styles.modalOfferRow}>
                    <Text style={styles.modalOfferLabel}>Expires In:</Text>
                    <Text style={styles.modalOfferValue}>{selectedOffer.expiresInWeeks} weeks</Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.modalRejectButton]}
                    onPress={() => handleReject(selectedOffer)}
                    disabled={isProcessing}
                  >
                    <Ionicons name="close-circle" size={20} color="#ff6b6b" />
                    <Text style={styles.modalRejectText}>REJECT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.modalAcceptButton]}
                    onPress={() => handleAccept(selectedOffer)}
                    disabled={isProcessing}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#0a1628" />
                    <Text style={styles.modalAcceptText}>
                      {isProcessing ? 'PROCESSING...' : 'ACCEPT'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  headerBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  budgetBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a4a6c',
  },
  budgetLabel: {
    fontSize: 13,
    color: '#6a8aaa',
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00ff88',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4a9eff',
    letterSpacing: 1,
    marginBottom: 12,
  },
  offerCard: {
    backgroundColor: '#0d2137',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a4a6c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerPosition: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4a9eff',
  },
  offerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  teamName: {
    fontSize: 12,
    color: '#6a8aaa',
    marginTop: 2,
  },
  qualityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  qualityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0a1628',
  },
  offerDetails: {
    flexDirection: 'row',
    backgroundColor: '#0a1628',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  offerStat: {
    flex: 1,
    alignItems: 'center',
  },
  offerStatLabel: {
    fontSize: 10,
    color: '#6a8aaa',
  },
  offerStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  offerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#1a2a3a',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  acceptButton: {
    backgroundColor: '#00ff88',
  },
  rejectButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ff6b6b',
  },
  acceptButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0a1628',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 13,
    color: '#6a8aaa',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0d2137',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  modalPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a1628',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  modalPlayerBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a4a6c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  modalPlayerPosition: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4a9eff',
  },
  modalPlayerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  modalPlayerRating: {
    fontSize: 13,
    color: '#00ff88',
    marginTop: 2,
  },
  modalOfferDetails: {
    backgroundColor: '#0a1628',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  modalOfferRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  modalOfferLabel: {
    fontSize: 14,
    color: '#6a8aaa',
  },
  modalOfferValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  modalRejectButton: {
    backgroundColor: '#1a2a3a',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  modalAcceptButton: {
    backgroundColor: '#00ff88',
  },
  modalRejectText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ff6b6b',
  },
  modalAcceptText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0a1628',
  },
});
