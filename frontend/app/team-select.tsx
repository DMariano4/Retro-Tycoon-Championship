import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/context/GameContext';
import { getBackendUrl } from '../src/utils/api';

const BACKEND_URL = getBackendUrl();

interface TeamOption {
  id: string;
  name: string;
  stadium: string;
  division: number;
}

export default function TeamSelectScreen() {
  // Use a single state object to avoid React 19 batching issues
  const [state, setState] = useState<{
    teams: TeamOption[];
    selectedTeam: TeamOption | null;
    saveName: string;
    loading: boolean;
    error: string | null;
  }>({
    teams: [],
    selectedTeam: null,
    saveName: '',
    loading: true,
    error: null
  });

  const { createNewGame, isLoading: gameLoading } = useGame();

  useEffect(() => {
    console.log('Component mounted, fetching teams');
    fetchTeams();
  }, []);

  const fetchTeams = () => {
    console.log('fetchTeams started');
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const apiUrl = `${BACKEND_URL}/api/teams`;
    console.log('Fetching teams from:', apiUrl);
    
    fetch(apiUrl)
      .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(data => {
        console.log('Teams loaded:', data.length);
        setState(prev => ({
          ...prev,
          teams: data,
          loading: false
        }));
        console.log('State updated with teams');
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setState(prev => ({
          ...prev,
          error: err.message || 'Network error',
          loading: false
        }));
      });
  };

  const setSelectedTeam = (team: TeamOption | null) => {
    setState(prev => ({ ...prev, selectedTeam: team }));
  };

  const setSaveName = (name: string) => {
    setState(prev => ({ ...prev, saveName: name }));
  };

  const { teams, selectedTeam, saveName, loading, error } = state;

  const handleStartGame = async () => {
    if (!selectedTeam) {
      Alert.alert('Select Team', 'Please select a team to manage');
      return;
    }

    const name = saveName.trim() || `${selectedTeam.name} Career`;
    const success = await createNewGame(selectedTeam.id, name);
    
    if (success) {
      router.replace('/game');
    } else {
      Alert.alert('Error', 'Failed to create game. Please try again.');
    }
  };

  const renderTeam = ({ item }: { item: TeamOption }) => (
    <TouchableOpacity
      style={[
        styles.teamCard,
        selectedTeam?.id === item.id && styles.teamCardSelected
      ]}
      onPress={() => setSelectedTeam(item)}
    >
      <View style={styles.teamInfo}>
        <Text style={styles.teamName}>{item.name}</Text>
        <Text style={styles.teamStadium}>{item.stadium}</Text>
      </View>
      {selectedTeam?.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color="#00ff88" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#00ff88" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SELECT YOUR TEAM</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.divisionBadge}>
        <Text style={styles.divisionText}>PREMIER LEAGUE - {loading ? 'LOADING' : `${teams.length} TEAMS`}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff88" />
          <Text style={styles.loadingText}>Loading teams...</Text>
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTeams}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : teams.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="football-outline" size={48} color="#4a6a8a" />
          <Text style={styles.loadingText}>No teams available</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.teamList}
          contentContainerStyle={styles.teamListContent}
          showsVerticalScrollIndicator={false}
        >
          {teams.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.teamCard,
                selectedTeam?.id === item.id && styles.teamCardSelected
              ]}
              onPress={() => setSelectedTeam(item)}
            >
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{item.name}</Text>
                <Text style={styles.teamStadium}>{item.stadium}</Text>
              </View>
              {selectedTeam?.id === item.id && (
                <Ionicons name="checkmark-circle" size={24} color="#00ff88" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {selectedTeam && (
        <View style={styles.footer}>
          <View style={styles.saveNameContainer}>
            <Text style={styles.saveNameLabel}>Save Name:</Text>
            <TextInput
              style={styles.saveNameInput}
              value={saveName}
              onChangeText={setSaveName}
              placeholder={`${selectedTeam.name} Career`}
              placeholderTextColor="#4a6a8a"
            />
          </View>

          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartGame}
            disabled={gameLoading}
          >
            {gameLoading ? (
              <ActivityIndicator color="#0a1628" />
            ) : (
              <>
                <Ionicons name="play" size={20} color="#0a1628" />
                <Text style={styles.startButtonText}>START CAREER</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  divisionBadge: {
    backgroundColor: '#1a3a5c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  divisionText: {
    color: '#4a9eff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6a8aaa',
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
  retryButton: {
    backgroundColor: '#1a4a6c',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  teamList: {
    flex: 1,
  },
  teamListContent: {
    padding: 16,
    gap: 8,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1a4a6c',
  },
  teamCardSelected: {
    borderColor: '#00ff88',
    backgroundColor: '#0d2a3f',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  teamStadium: {
    fontSize: 12,
    color: '#6a8aaa',
    marginTop: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a3a5c',
    backgroundColor: '#0d2137',
  },
  saveNameContainer: {
    marginBottom: 16,
  },
  saveNameLabel: {
    color: '#6a8aaa',
    fontSize: 12,
    marginBottom: 8,
  },
  saveNameInput: {
    backgroundColor: '#0a1628',
    borderWidth: 1,
    borderColor: '#1a4a6c',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ff88',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  startButtonText: {
    color: '#0a1628',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
