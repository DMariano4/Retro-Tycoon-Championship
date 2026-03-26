import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/context/GameContext';
import { useSaveSlots } from '../src/context/SaveSlotsContext';
import { DashboardTab, SquadTab, TacticsTab, LeagueTab, TransfersTab, FinanceTab, gameStyles as styles } from '../src/components/game';

type TabType = 'dashboard' | 'squad' | 'tactics' | 'league' | 'transfers' | 'finance';

function TabButton({ icon, label, active, onPress }: { icon: string; label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.tabButton, active && styles.tabButtonActive]} onPress={onPress}>
      <Ionicons name={icon as any} size={20} color={active ? '#00ff88' : '#4a6a8a'} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function GameScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const { 
    currentSave, 
    getManagedTeam, 
    getLeague, 
    advanceWeek,
    getUpcomingEvents,
    getCurrentDate,
  } = useGame();
  const { activeSlotId, saveToSlot } = useSaveSlots();
  const [isReady, setIsReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    if (!activeSlotId || !currentSave) {
      Alert.alert('Error', 'No active save slot');
      return;
    }
    
    setIsSaving(true);
    try {
      const success = await saveToSlot(activeSlotId, currentSave);
      if (success) {
        Alert.alert('✓ Saved', `Game saved to Slot ${activeSlotId}`);
      } else {
        Alert.alert('Error', 'Failed to save game');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save game');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExit = () => {
    Alert.alert(
      'Exit Game',
      'Do you want to save before exiting?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit without saving',
          style: 'destructive',
          onPress: () => router.replace('/'),
        },
        {
          text: 'Save & Exit',
          onPress: async () => {
            if (activeSlotId && currentSave) {
              await saveToSlot(activeSlotId, currentSave);
            }
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleNextWeek = () => {
    router.push('/match');
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
    // Get upcoming events for the v2 system
    const upcomingEvents = getUpcomingEvents ? getUpcomingEvents(5) : [];
    const currentDate = getCurrentDate ? getCurrentDate() : undefined;
    
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab 
          team={managedTeam} 
          league={league} 
          save={currentSave}
          fixture={upcomingFixture}
          position={position}
          onNextWeek={handleNextWeek}
          upcomingEvents={upcomingEvents}
          currentDate={currentDate}
        />;
      case 'squad':
        return <SquadTab team={managedTeam} currency={currentSave?.currency_symbol} />;
      case 'tactics':
        return <TacticsTab team={managedTeam} />;
      case 'league':
        return <LeagueTab league={league} teamId={managedTeam?.id} />;
      case 'transfers':
        return <TransfersTab />;
      case 'finance':
        return <FinanceTab team={managedTeam} save={currentSave} />;
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
          <Text style={styles.gameDate}>
            Season {currentSave.season} | Week {league?.current_week || 'Pre'}
            {activeSlotId && ` • Slot ${activeSlotId}`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#00ff88" />
            ) : (
              <Ionicons name="save-outline" size={20} color="#00ff88" />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleExit}
          >
            <Ionicons name="exit-outline" size={20} color="#ff6b6b" />
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
        <TabButton icon="cash" label="FINANCE" active={activeTab === 'finance'} onPress={() => setActiveTab('finance')} />
        <TabButton icon="swap-horizontal" label="TRANSFERS" active={activeTab === 'transfers'} onPress={() => setActiveTab('transfers')} />
      </View>
    </SafeAreaView>
  );
}
