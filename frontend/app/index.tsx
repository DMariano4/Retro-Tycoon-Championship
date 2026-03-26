import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSaveSlots, SaveSlotMeta } from '../src/context/SaveSlotsContext';
import { useGame } from '../src/context/GameContext';

const { width } = Dimensions.get('window');

export default function MainMenu() {
  const { slots, config, isLoading: slotsLoading, loadSlotData, deleteSlot, setActiveSlot } = useSaveSlots();
  const { setCurrentSave } = useGame();
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null);

  const handleSlotPress = async (slot: SaveSlotMeta) => {
    if (slot.isEmpty) {
      // Start new game in this slot
      setActiveSlot(slot.slotId);
      router.push({
        pathname: '/team-select',
        params: { slotId: slot.slotId.toString() }
      });
    } else {
      // Load existing game
      setLoadingSlot(slot.slotId);
      try {
        const saveData = await loadSlotData(slot.slotId);
        if (saveData) {
          setActiveSlot(slot.slotId);
          setCurrentSave(saveData);
          router.push('/game');
        } else {
          Alert.alert('Error', 'Failed to load save data');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load game');
      } finally {
        setLoadingSlot(null);
      }
    }
  };

  const handleSlotDelete = (slot: SaveSlotMeta) => {
    if (slot.isEmpty) return;
    
    Alert.alert(
      'Delete Save',
      `Are you sure you want to delete "${slot.saveName}"?\n\nThis cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteSlot(slot.slotId);
            if (!success) {
              Alert.alert('Error', 'Failed to delete save');
            }
          },
        },
      ]
    );
  };

  const formatLastSaved = (isoDate: string | null): string => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getPositionSuffix = (pos: number): string => {
    if (pos === 1) return 'st';
    if (pos === 2) return 'nd';
    if (pos === 3) return 'rd';
    return 'th';
  };

  const renderSlot = (slot: SaveSlotMeta) => {
    const isLoadingThis = loadingSlot === slot.slotId;
    
    return (
      <TouchableOpacity
        key={slot.slotId}
        style={[styles.slotCard, !slot.isEmpty && styles.slotCardFilled]}
        onPress={() => handleSlotPress(slot)}
        onLongPress={() => handleSlotDelete(slot)}
        disabled={isLoadingThis}
      >
        {isLoadingThis ? (
          <View style={styles.slotLoading}>
            <ActivityIndicator size="large" color="#00ff88" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : slot.isEmpty ? (
          <View style={styles.slotEmpty}>
            <View style={styles.slotHeader}>
              <Text style={styles.slotNumber}>SLOT {slot.slotId}</Text>
            </View>
            <Ionicons name="add-circle-outline" size={48} color="#3a5a7a" />
            <Text style={styles.emptyText}>EMPTY SLOT</Text>
            <Text style={styles.emptySubtext}>Tap to start new career</Text>
          </View>
        ) : (
          <View style={styles.slotFilled}>
            <View style={styles.slotHeader}>
              <Text style={styles.slotNumber}>SLOT {slot.slotId}</Text>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleSlotDelete(slot)}
              >
                <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.slotContent}>
              <View style={styles.teamRow}>
                <Ionicons name="football" size={24} color="#00ff88" />
                <Text style={styles.teamName}>{slot.teamName}</Text>
              </View>
              
              <Text style={styles.saveName}>{slot.saveName}</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Season</Text>
                  <Text style={styles.statValue}>{slot.season}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Week</Text>
                  <Text style={styles.statValue}>{slot.currentWeek || 'Pre'}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Position</Text>
                  <Text style={[
                    styles.statValue, 
                    slot.leaguePosition && slot.leaguePosition <= 4 && styles.statValueGood,
                    slot.leaguePosition && slot.leaguePosition >= 18 && styles.statValueBad,
                  ]}>
                    {slot.leaguePosition ? `${slot.leaguePosition}${getPositionSuffix(slot.leaguePosition)}` : '-'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.lastSaved}>
                Last saved: {formatLastSaved(slot.lastSaved)}
              </Text>
            </View>
            
            <View style={styles.playButton}>
              <Ionicons name="play" size={20} color="#0a1628" />
              <Text style={styles.playButtonText}>CONTINUE</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (slotsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff88" />
          <Text style={styles.loadingText}>Loading saves...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo/Title */}
        <View style={styles.logoContainer}>
          <Text style={styles.title}>RETRO FOOTBALL</Text>
          <Text style={styles.subtitle}>CHAMPIONSHIP</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v1.0 • OFFLINE</Text>
          </View>
        </View>

        {/* Save Slots */}
        <View style={styles.slotsContainer}>
          <Text style={styles.slotsTitle}>SAVE SLOTS</Text>
          
          {slots.map(slot => renderSlot(slot))}
          
          {/* Premium Upgrade Prompt */}
          {!config.hasPremium && (
            <View style={styles.premiumPrompt}>
              <Ionicons name="lock-closed" size={16} color="#ffd700" />
              <Text style={styles.premiumText}>
                Unlock {10 - config.totalSlots} more slots • Coming soon
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={20} color="#6a8aaa" />
            <Text style={styles.settingsText}>Settings</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>Early 2000s Classics Inspired</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6a8aaa',
    fontSize: 14,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#00ff88',
    letterSpacing: 4,
    textShadowColor: '#00ff88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4a9eff',
    letterSpacing: 3,
    marginTop: 2,
  },
  versionBadge: {
    backgroundColor: '#1a3a5c',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2a5a8c',
  },
  versionText: {
    color: '#6aafff',
    fontSize: 11,
    fontWeight: '600',
  },
  slotsContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
  },
  slotsTitle: {
    color: '#6a8aaa',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  slotCard: {
    backgroundColor: '#0d2137',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a4a6c',
    overflow: 'hidden',
  },
  slotCardFilled: {
    borderColor: '#2a5a8c',
  },
  slotLoading: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  slotEmpty: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  slotNumber: {
    color: '#4a6a8a',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  deleteButton: {
    padding: 4,
  },
  emptyText: {
    color: '#4a6a8a',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  emptySubtext: {
    color: '#3a5a7a',
    fontSize: 11,
  },
  slotFilled: {
    padding: 16,
  },
  slotContent: {
    gap: 8,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  teamName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  saveName: {
    color: '#6a8aaa',
    fontSize: 12,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a3a5c',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#4a6a8a',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  statValueGood: {
    color: '#00ff88',
  },
  statValueBad: {
    color: '#ff6b6b',
  },
  lastSaved: {
    color: '#4a6a8a',
    fontSize: 10,
    marginTop: 8,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ff88',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  playButtonText: {
    color: '#0a1628',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  premiumPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    opacity: 0.7,
  },
  premiumText: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  settingsText: {
    color: '#6a8aaa',
    fontSize: 14,
  },
  footerText: {
    color: '#3a5a7a',
    fontSize: 11,
    fontWeight: '600',
  },
});
