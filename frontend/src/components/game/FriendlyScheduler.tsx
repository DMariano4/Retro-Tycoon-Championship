import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../../context/GameContext';
import { formatDateDisplay } from '../../utils/calendar';
import { FriendlySlot } from '../../utils/gameGenerator';

interface FriendlySchedulerProps {
  visible: boolean;
  onClose: () => void;
}

export function FriendlyScheduler({ visible, onClose }: FriendlySchedulerProps) {
  const { 
    getFriendlySlots, 
    getAvailableOpponents, 
    scheduleFriendly, 
    cancelFriendly,
    getManagedTeam,
    getLeague,
    currentSave,
  } = useGame();
  
  const [selectedSlot, setSelectedSlot] = useState<FriendlySlot | null>(null);
  
  const slots = getFriendlySlots();
  const managedTeam = getManagedTeam();
  const league = getLeague();
  
  // Check if league has started (any league match played)
  const leagueHasStarted = league?.fixtures?.some(f => f.played && f.match_type !== 'friendly') || false;
  
  const handleSelectSlot = (slot: FriendlySlot) => {
    // Block scheduling if league has started
    if (leagueHasStarted && !slot.isScheduled) {
      Alert.alert(
        'Pre-Season Over',
        'The league has started. You can no longer schedule new friendlies.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (slot.isScheduled) {
      // Show cancel option (only if league hasn't started)
      if (leagueHasStarted) {
        Alert.alert(
          'Cannot Cancel',
          'The league has started. Scheduled friendlies cannot be cancelled.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      Alert.alert(
        'Cancel Friendly?',
        `Cancel the friendly against ${slot.opponent?.name}?`,
        [
          { text: 'Keep', style: 'cancel' },
          { 
            text: 'Cancel Match', 
            style: 'destructive',
            onPress: () => cancelFriendly(slot.id)
          },
        ]
      );
    } else {
      setSelectedSlot(slot);
    }
  };
  
  const handleSelectOpponent = (opponentId: string, opponentName: string) => {
    if (!selectedSlot) return;
    
    scheduleFriendly(selectedSlot.id, opponentId);
    setSelectedSlot(null);
  };

  const handleBackFromOpponents = () => {
    setSelectedSlot(null);
  };
  
  const availableOpponents = selectedSlot ? getAvailableOpponents(selectedSlot.id) : [];
  
  const renderSlotCard = ({ item: slot }: { item: FriendlySlot }) => {
    const isScheduled = slot.isScheduled;
    
    return (
      <Pressable
        style={({ pressed }) => [
          styles.slotCard, 
          isScheduled && styles.slotCardScheduled,
          pressed && styles.slotCardPressed
        ]}
        onPress={() => handleSelectSlot(slot)}
      >
        <View style={styles.slotHeader}>
          <View style={styles.dateBadge}>
            <Ionicons name="calendar-outline" size={14} color="#4a9eff" />
            <Text style={styles.dateText}>{formatDateDisplay(slot.date)}</Text>
          </View>
          <View style={[styles.venueBadge, slot.isHome ? styles.venueHome : styles.venueAway]}>
            <Text style={styles.venueText}>{slot.isHome ? 'HOME' : 'AWAY'}</Text>
          </View>
        </View>
        
        {isScheduled ? (
          <View style={styles.matchupContainer}>
            <Text style={styles.teamName}>
              {slot.isHome ? managedTeam?.name : slot.opponent?.name}
            </Text>
            <Text style={styles.vsText}>vs</Text>
            <Text style={styles.teamName}>
              {slot.isHome ? slot.opponent?.name : managedTeam?.name}
            </Text>
            <View style={styles.scheduledBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#00ff88" />
              <Text style={styles.scheduledText}>SCHEDULED</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptySlot}>
            <Ionicons name="add-circle-outline" size={32} color="#4a6a8a" />
            <Text style={styles.emptyText}>Tap to schedule opponent</Text>
          </View>
        )}
      </Pressable>
    );
  };

  const renderOpponentCard = ({ item: opponent }: { item: any }) => (
    <Pressable
      style={({ pressed }) => [
        styles.opponentCard,
        pressed && styles.opponentCardPressed
      ]}
      onPress={() => handleSelectOpponent(opponent.id, opponent.name)}
    >
      <View style={styles.opponentInfo}>
        <Text style={styles.opponentName}>{opponent.name}</Text>
        <View style={styles.repBadge}>
          <Text style={styles.repText}>⭐ {opponent.reputation}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#4a6a8a" />
    </Pressable>
  );
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>PRE-SEASON FRIENDLIES</Text>
            <Pressable 
              style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.6 }]} 
              onPress={onClose}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>
          
          <Text style={styles.subtitle}>
            {leagueHasStarted 
              ? 'Pre-season is over. No more friendlies can be scheduled.'
              : 'Schedule up to 4 friendly matches before the season starts'}
          </Text>
          
          {/* Slots List or Opponent Selection */}
          {selectedSlot ? (
            <View style={styles.opponentSelection}>
              <View style={styles.selectionHeader}>
                <Pressable 
                  onPress={handleBackFromOpponents}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                >
                  <Ionicons name="arrow-back" size={24} color="#00ff88" />
                </Pressable>
                <Text style={styles.selectionTitle}>
                  Select Opponent for {formatDateDisplay(selectedSlot.date)}
                </Text>
              </View>
              
              {availableOpponents.length === 0 ? (
                <View style={styles.noOpponents}>
                  <Ionicons name="alert-circle-outline" size={32} color="#6a8aaa" />
                  <Text style={styles.noOpponentsText}>
                    No teams available on this date
                  </Text>
                  <Text style={styles.noOpponentsHint}>
                    All teams are already scheduled for friendlies
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={availableOpponents}
                  renderItem={renderOpponentCard}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.opponentListContent}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          ) : (
            <FlatList
              data={slots}
              renderItem={renderSlotCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.slotsListContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.noSlots}>
                  <Text style={styles.noSlotsText}>No friendly slots available</Text>
                </View>
              }
            />
          )}
          
          {/* Info Footer */}
          {!selectedSlot && (
            <View style={styles.infoFooter}>
              <Ionicons name="information-circle-outline" size={16} color="#6a8aaa" />
              <Text style={styles.infoText}>
                Tap a scheduled match to cancel it
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#0a1628',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
    maxHeight: '85%',
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#6a8aaa',
    marginBottom: 16,
  },
  slotsListContent: {
    paddingBottom: 16,
  },
  slotCard: {
    backgroundColor: '#0d2137',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1a4a6c',
  },
  slotCardScheduled: {
    borderColor: '#00ff88',
  },
  slotCardPressed: {
    opacity: 0.7,
    backgroundColor: '#142a45',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1a3a5c',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dateText: {
    color: '#4a9eff',
    fontSize: 12,
    fontWeight: '600',
  },
  venueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  venueHome: {
    backgroundColor: '#1a4a3c',
  },
  venueAway: {
    backgroundColor: '#4a3a1c',
  },
  venueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  matchupContainer: {
    alignItems: 'center',
    gap: 4,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  vsText: {
    fontSize: 10,
    color: '#4a6a8a',
    fontWeight: '600',
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  scheduledText: {
    color: '#00ff88',
    fontSize: 10,
    fontWeight: '700',
  },
  emptySlot: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  emptyText: {
    color: '#4a6a8a',
    fontSize: 12,
  },
  noSlots: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noSlotsText: {
    color: '#4a6a8a',
    fontSize: 14,
  },
  opponentSelection: {
    flex: 1,
    minHeight: 350,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  selectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  opponentListContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  opponentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d2137',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  opponentCardPressed: {
    opacity: 0.7,
    backgroundColor: '#142a45',
  },
  opponentInfo: {
    flex: 1,
  },
  opponentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  repBadge: {
    marginTop: 4,
  },
  repText: {
    fontSize: 11,
    color: '#ffd700',
  },
  noOpponents: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  noOpponentsText: {
    color: '#6a8aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  noOpponentsHint: {
    color: '#4a6a8a',
    fontSize: 11,
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a3a5c',
    marginTop: 12,
  },
  infoText: {
    color: '#6a8aaa',
    fontSize: 11,
  },
});
