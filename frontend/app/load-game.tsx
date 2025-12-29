import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useGame } from '../src/context/GameContext';

interface CloudSave {
  id: string;
  name: string;
  managed_team_name: string;
  game_date: string;
  season: number;
  updated_at: string;
}

export default function LoadGameScreen() {
  const [cloudSaves, setCloudSaves] = useState<CloudSave[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { getCloudSaves, loadFromCloud, currentSave, loadFromLocal, isLoading } = useGame();

  useEffect(() => {
    loadSaves();
  }, []);

  const loadSaves = async () => {
    setLoading(true);
    if (user) {
      const saves = await getCloudSaves();
      setCloudSaves(saves);
    }
    setLoading(false);
  };

  const handleLoadCloud = async (saveId: string) => {
    const success = await loadFromCloud(saveId);
    if (success) {
      router.replace('/game');
    } else {
      Alert.alert('Error', 'Failed to load save');
    }
  };

  const handleLoadLocal = async () => {
    const success = await loadFromLocal();
    if (success) {
      router.replace('/game');
    } else {
      Alert.alert('No Local Save', 'No local save found on this device.');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const renderSave = ({ item }: { item: CloudSave }) => (
    <TouchableOpacity
      style={styles.saveCard}
      onPress={() => handleLoadCloud(item.id)}
    >
      <View style={styles.saveIcon}>
        <Ionicons name="cloud" size={24} color="#4a9eff" />
      </View>
      <View style={styles.saveInfo}>
        <Text style={styles.saveName}>{item.name}</Text>
        <Text style={styles.saveTeam}>{item.managed_team_name}</Text>
        <Text style={styles.saveDate}>
          Season {item.season} | {formatDate(item.game_date)}
        </Text>
        <Text style={styles.saveUpdated}>
          Last saved: {formatDate(item.updated_at)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#4a6a8a" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#00ff88" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>LOAD GAME</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Local Save Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LOCAL SAVE</Text>
          {currentSave ? (
            <TouchableOpacity style={styles.saveCard} onPress={handleLoadLocal}>
              <View style={[styles.saveIcon, { backgroundColor: '#1a4a3c' }]}>
                <Ionicons name="phone-portrait" size={24} color="#00ff88" />
              </View>
              <View style={styles.saveInfo}>
                <Text style={styles.saveName}>{currentSave.name}</Text>
                <Text style={styles.saveTeam}>{currentSave.managed_team_name}</Text>
                <Text style={styles.saveDate}>
                  Season {currentSave.season} | {formatDate(currentSave.game_date)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#4a6a8a" />
            </TouchableOpacity>
          ) : (
            <View style={styles.noSave}>
              <Text style={styles.noSaveText}>No local save found</Text>
            </View>
          )}
        </View>

        {/* Cloud Saves Section */}
        <View style={[styles.section, { flex: 1 }]}>
          <Text style={styles.sectionTitle}>CLOUD SAVES</Text>
          {!user ? (
            <View style={styles.loginPrompt}>
              <Ionicons name="cloud-offline" size={40} color="#4a6a8a" />
              <Text style={styles.loginPromptText}>Sign in to access cloud saves</Text>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push('/login')}
              >
                <Text style={styles.loginButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4a9eff" />
              <Text style={styles.loadingText}>Loading cloud saves...</Text>
            </View>
          ) : cloudSaves.length === 0 ? (
            <View style={styles.noSave}>
              <Ionicons name="cloud-outline" size={40} color="#4a6a8a" />
              <Text style={styles.noSaveText}>No cloud saves found</Text>
              <Text style={styles.noSaveHint}>Start a new game and save to cloud</Text>
            </View>
          ) : (
            <FlatList
              data={cloudSaves}
              renderItem={renderSave}
              keyExtractor={item => item.id}
              style={styles.saveList}
              contentContainerStyle={styles.saveListContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00ff88" />
          <Text style={styles.loadingOverlayText}>Loading game...</Text>
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
  content: {
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
  saveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    marginBottom: 8,
  },
  saveIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1a3a5c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  saveInfo: {
    flex: 1,
  },
  saveName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  saveTeam: {
    fontSize: 14,
    color: '#4a9eff',
    marginTop: 2,
  },
  saveDate: {
    fontSize: 12,
    color: '#6a8aaa',
    marginTop: 4,
  },
  saveUpdated: {
    fontSize: 11,
    color: '#4a6a8a',
    marginTop: 2,
  },
  noSave: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0d2137',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  noSaveText: {
    color: '#6a8aaa',
    fontSize: 14,
    marginTop: 8,
  },
  noSaveHint: {
    color: '#4a6a8a',
    fontSize: 12,
    marginTop: 4,
  },
  loginPrompt: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#0d2137',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  loginPromptText: {
    color: '#6a8aaa',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#6a8aaa',
    marginTop: 12,
  },
  saveList: {
    flex: 1,
  },
  saveListContent: {
    paddingBottom: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 22, 40, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlayText: {
    color: '#00ff88',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
  },
});
