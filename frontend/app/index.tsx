import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, ActivityIndicator, ScrollView, Modal, BackHandler, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSaveSlots, SaveSlotMeta } from '../src/context/SaveSlotsContext';
import { useGame } from '../src/context/GameContext';

const { width, height } = Dimensions.get('window');

type MenuScreen = 'splash' | 'main' | 'saves' | 'about';

export default function MainMenu() {
  const { slots, config, isLoading: slotsLoading, loadSlotData, deleteSlot, setActiveSlot } = useSaveSlots();
  const { setCurrentSave } = useGame();
  const [loadingSlot, setLoadingSlot] = useState<number | null>(null);
  const [currentScreen, setCurrentScreen] = useState<MenuScreen>('splash');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  // Splash screen animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Handle back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentScreen === 'splash') {
        return true; // Ignore back during splash
      }
      if (currentScreen !== 'main') {
        setCurrentScreen('main');
        return true;
      }
      setShowExitConfirm(true);
      return true;
    });
    return () => backHandler.remove();
  }, [currentScreen]);

  // Splash screen animation and auto-transition
  useEffect(() => {
    // Fade in and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for loading indicator
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Auto transition to main menu after splash
    const timer = setTimeout(() => {
      setCurrentScreen('main');
    }, 2500);

    return () => {
      clearTimeout(timer);
      pulse.stop();
    };
  }, []);

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

  // Splash screen shows first, regardless of loading state
  if (currentScreen === 'splash') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.splashContainer}>
          <Animated.View style={[
            styles.splashContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}>
            <View style={styles.splashIconContainer}>
              <Ionicons name="football" size={80} color="#00ff88" />
            </View>
            <Text style={styles.splashTitle}>RETRO FOOTBALL</Text>
            <Text style={styles.splashSubtitle}>CHAMPIONSHIP</Text>
            <Animated.View style={[
              styles.splashLoadingContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}>
              <ActivityIndicator size="small" color="#00ff88" />
              <Text style={styles.splashLoadingText}>Loading...</Text>
            </Animated.View>
          </Animated.View>
          <View style={styles.splashFooter}>
            <Text style={styles.splashFooterText}>100% OFFLINE GAME</Text>
            <Text style={styles.splashFooterSubtext}>No internet required</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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

  // Main Menu Screen
  const renderMainMenu = () => (
    <View style={styles.mainMenuContainer}>
      {/* Logo/Title */}
      <View style={styles.logoContainer}>
        <Ionicons name="football" size={56} color="#00ff88" />
        <Text style={styles.mainTitle}>RETRO FOOTBALL</Text>
        <Text style={styles.mainSubtitle}>CHAMPIONSHIP</Text>
        <View style={styles.versionBadge}>
          <Text style={styles.versionText}>v1.0 • 100% OFFLINE</Text>
        </View>
      </View>

      {/* Main Menu Buttons */}
      <View style={styles.menuButtonsContainer}>
        <TouchableOpacity 
          style={[styles.menuButton, styles.menuButtonPrimary]}
          onPress={() => setCurrentScreen('saves')}
        >
          <Ionicons name="play-circle" size={32} color="#0a1628" />
          <View style={styles.menuButtonTextContainer}>
            <Text style={styles.menuButtonTitle}>PLAY GAME</Text>
            <Text style={[styles.menuButtonSubtitle, { color: '#0a4628' }]}>New game or continue</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={28} color="#00ff88" />
          <View style={styles.menuButtonTextContainer}>
            <Text style={[styles.menuButtonTitle, { color: '#ffffff' }]}>SETTINGS</Text>
            <Text style={styles.menuButtonSubtitle}>Game options</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setCurrentScreen('about')}
        >
          <Ionicons name="information-circle-outline" size={28} color="#4a9eff" />
          <View style={styles.menuButtonTextContainer}>
            <Text style={[styles.menuButtonTitle, { color: '#ffffff' }]}>ABOUT</Text>
            <Text style={styles.menuButtonSubtitle}>Credits & info</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuButton, styles.menuButtonExit]}
          onPress={() => setShowExitConfirm(true)}
        >
          <Ionicons name="exit-outline" size={28} color="#ff6b6b" />
          <View style={styles.menuButtonTextContainer}>
            <Text style={[styles.menuButtonTitle, { color: '#ff6b6b' }]}>EXIT</Text>
            <Text style={styles.menuButtonSubtitle}>Close application</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.mainFooter}>
        <Text style={styles.footerText}>⚽ Inspired by CM 01/02 & Elifoot 98</Text>
      </View>
    </View>
  );

  // About Screen
  const renderAboutScreen = () => (
    <ScrollView style={styles.aboutContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('main')}>
        <Ionicons name="arrow-back" size={24} color="#00ff88" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.aboutContent}>
        <Text style={styles.aboutTitle}>RETRO FOOTBALL{'\n'}CHAMPIONSHIP</Text>
        <Text style={styles.aboutVersion}>Version 1.0.0</Text>

        <View style={styles.aboutSection}>
          <Text style={styles.aboutSectionTitle}>ABOUT THE GAME</Text>
          <Text style={styles.aboutText}>
            A classic football management simulation inspired by the golden era of 
            football manager games from the early 2000s.
          </Text>
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.aboutSectionTitle}>FEATURES</Text>
          <Text style={styles.aboutText}>
            • Manage your club through multiple seasons{'\n'}
            • Real-time match simulation with commentary{'\n'}
            • Transfer market with AI managers{'\n'}
            • Financial management & FFP{'\n'}
            • Cup competitions from 17 European nations{'\n'}
            • 100% offline - no internet required{'\n'}
            • 3 save slots for different careers
          </Text>
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.aboutSectionTitle}>CREDITS</Text>
          <Text style={styles.aboutText}>
            Built with React Native & Expo{'\n'}
            Match engine: Custom Poisson simulation{'\n'}
            Player names: Procedurally generated
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  // Save Slots Screen
  const renderSaveSlotsScreen = () => (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Back Button & Title */}
      <View style={styles.saveSlotsHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('main')}>
          <Ionicons name="arrow-back" size={24} color="#00ff88" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.slotsTitle}>SELECT SAVE SLOT</Text>
      </View>

      {/* Save Slots */}
      <View style={styles.slotsContainer}>
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

      {/* Instructions */}
      <View style={styles.instructionsBox}>
        <Text style={styles.instructionsTitle}>💡 TIPS</Text>
        <Text style={styles.instructionsText}>
          • Tap empty slot to start new career{'\n'}
          • Tap filled slot to continue{'\n'}
          • Long press to delete a save
        </Text>
      </View>
    </ScrollView>
  );

  // Exit Confirmation Modal
  const renderExitModal = () => (
    <Modal visible={showExitConfirm} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Ionicons name="exit-outline" size={48} color="#ff6b6b" />
          <Text style={styles.modalTitle}>EXIT GAME?</Text>
          <Text style={styles.modalText}>Are you sure you want to close the application?</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={() => setShowExitConfirm(false)}
            >
              <Text style={styles.modalButtonText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalButtonConfirm]}
              onPress={() => BackHandler.exitApp()}
            >
              <Text style={[styles.modalButtonText, { color: '#ff6b6b' }]}>EXIT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {currentScreen === 'main' && renderMainMenu()}
      {currentScreen === 'saves' && renderSaveSlotsScreen()}
      {currentScreen === 'about' && renderAboutScreen()}
      {renderExitModal()}
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
  
  // ============ MAIN MENU STYLES ============
  mainMenuContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#00ff88',
    letterSpacing: 3,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 255, 136, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  mainSubtitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4a9eff',
    letterSpacing: 4,
    marginTop: 4,
    textAlign: 'center',
  },
  versionBadge: {
    backgroundColor: '#1a3a5c',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2a5a8c',
  },
  versionText: {
    color: '#6aafff',
    fontSize: 11,
    fontWeight: '600',
  },
  menuButtonsContainer: {
    gap: 12,
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a4a6c',
    gap: 16,
  },
  menuButtonPrimary: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  menuButtonExit: {
    borderColor: '#3a2a2a',
    backgroundColor: '#1a1520',
  },
  menuButtonTextContainer: {
    flex: 1,
  },
  menuButtonTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a1628',
    letterSpacing: 1,
  },
  menuButtonSubtitle: {
    fontSize: 11,
    color: '#4a6a8a',
    marginTop: 2,
  },
  mainFooter: {
    alignItems: 'center',
    paddingTop: 16,
  },
  
  // ============ ABOUT SCREEN STYLES ============
  aboutContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  aboutContent: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#00ff88',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 8,
  },
  aboutVersion: {
    fontSize: 14,
    color: '#4a9eff',
    marginBottom: 24,
  },
  aboutSection: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: '#0d2137',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  aboutSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4a9eff',
    letterSpacing: 2,
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 14,
    color: '#8aa8c8',
    lineHeight: 22,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    marginBottom: 12,
  },
  backButtonText: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // ============ SAVE SLOTS SCREEN STYLES ============
  saveSlotsHeader: {
    width: '100%',
    marginBottom: 16,
  },
  instructionsBox: {
    width: '100%',
    maxWidth: 400,
    marginTop: 20,
    backgroundColor: '#0d2137',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  instructionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffd700',
    marginBottom: 8,
    letterSpacing: 1,
  },
  instructionsText: {
    fontSize: 12,
    color: '#6a8aaa',
    lineHeight: 20,
  },
  
  // ============ EXIT MODAL STYLES ============
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
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a4a6c',
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#6a8aaa',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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
    backgroundColor: '#2a1a20',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  
  // ============ LEGACY STYLES (kept for save slots) ============
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
  
  // ============ SPLASH SCREEN STYLES ============
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a1628',
    padding: 24,
  },
  splashContent: {
    alignItems: 'center',
    marginBottom: 60,
  },
  splashIconContainer: {
    marginBottom: 24,
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#00ff88',
    letterSpacing: 3,
    textAlign: 'center',
  },
  splashSubtitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4a9eff',
    letterSpacing: 4,
    marginTop: 4,
    textAlign: 'center',
  },
  splashLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  splashLoadingText: {
    color: '#6a8aaa',
    fontSize: 14,
    fontWeight: '500',
  },
  splashFooter: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  splashFooterText: {
    color: '#00ff88',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  splashFooterSubtext: {
    color: '#4a6a8a',
    fontSize: 11,
    marginTop: 4,
  },
});
