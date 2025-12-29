import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useGame } from '../src/context/GameContext';

const { width } = Dimensions.get('window');

export default function MainMenu() {
  const { user, isLoading: authLoading } = useAuth();
  const { currentSave, loadFromLocal, isLoading: gameLoading } = useGame();

  useEffect(() => {
    // Try to load local save on mount
    loadFromLocal();
  }, []);

  const handleNewGame = () => {
    router.push('/team-select');
  };

  const handleContinue = () => {
    if (currentSave) {
      router.push('/game');
    }
  };

  const handleLoadGame = () => {
    router.push('/load-game');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Title */}
        <View style={styles.logoContainer}>
          <Text style={styles.title}>RETRO</Text>
          <Text style={styles.subtitle}>FOOTBALL MANAGER</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v1.0</Text>
          </View>
        </View>

        {/* Decorative football */}
        <View style={styles.footballContainer}>
          <Ionicons name="football" size={80} color="#00ff88" />
        </View>

        {/* Menu Buttons */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuButton} onPress={handleNewGame}>
            <Ionicons name="add-circle-outline" size={24} color="#00ff88" />
            <Text style={styles.menuButtonText}>NEW GAME</Text>
          </TouchableOpacity>

          {currentSave && (
            <TouchableOpacity 
              style={[styles.menuButton, styles.continueButton]} 
              onPress={handleContinue}
            >
              <Ionicons name="play-circle-outline" size={24} color="#0a1628" />
              <Text style={[styles.menuButtonText, styles.continueButtonText]}>CONTINUE</Text>
              <Text style={styles.saveInfo}>{currentSave.managed_team_name}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuButton} onPress={handleLoadGame}>
            <Ionicons name="cloud-download-outline" size={24} color="#00ff88" />
            <Text style={styles.menuButtonText}>LOAD GAME</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={handleSettings}>
            <Ionicons name="settings-outline" size={24} color="#00ff88" />
            <Text style={styles.menuButtonText}>SETTINGS</Text>
          </TouchableOpacity>
        </View>

        {/* User status */}
        <View style={styles.userStatus}>
          {authLoading ? (
            <Text style={styles.statusText}>Checking login...</Text>
          ) : user ? (
            <View style={styles.loggedInContainer}>
              <Ionicons name="checkmark-circle" size={16} color="#00ff88" />
              <Text style={styles.statusText}>Cloud saves enabled: {user.name}</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.loginPrompt}
              onPress={() => router.push('/login')}
            >
              <Ionicons name="cloud-offline-outline" size={16} color="#ff6b6b" />
              <Text style={styles.loginText}>Sign in for cloud saves</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Early 2000s Classics Inspired</Text>
          <Text style={styles.footerSubtext}>Like CM 01/02 & Elifoot 98</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#00ff88',
    letterSpacing: 8,
    textShadowColor: '#00ff88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4a9eff',
    letterSpacing: 4,
    marginTop: 4,
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
    fontSize: 12,
    fontWeight: '600',
  },
  footballContainer: {
    marginVertical: 20,
    opacity: 0.8,
  },
  menuContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1a4a6c',
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#00ff88',
    borderColor: '#00cc6a',
  },
  menuButtonText: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    flex: 1,
  },
  continueButtonText: {
    color: '#0a1628',
  },
  saveInfo: {
    color: '#0a1628',
    fontSize: 11,
    fontWeight: '600',
  },
  userStatus: {
    alignItems: 'center',
    marginTop: 20,
  },
  loggedInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    color: '#6a8aaa',
    fontSize: 12,
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  loginText: {
    color: '#ff6b6b',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  footerText: {
    color: '#3a5a7a',
    fontSize: 11,
    fontWeight: '600',
  },
  footerSubtext: {
    color: '#2a4a6a',
    fontSize: 10,
    marginTop: 2,
  },
});
