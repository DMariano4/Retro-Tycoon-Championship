import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { user, logout } = useAuth();

  const handleClearLocalSave = () => {
    Alert.alert(
      'Clear Local Save',
      'Are you sure you want to delete your local save? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('retro_fm_local_save');
            Alert.alert('Success', 'Local save deleted');
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    await logout();
    Alert.alert('Logged Out', 'You have been signed out');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#00ff88" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          {user ? (
            <View style={styles.accountCard}>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{user.name}</Text>
                <Text style={styles.accountEmail}>{user.email}</Text>
              </View>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/login')}
            >
              <Ionicons name="log-in-outline" size={24} color="#4a9eff" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Sign In</Text>
                <Text style={styles.settingSubtitle}>Enable cloud saves</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#4a6a8a" />
            </TouchableOpacity>
          )}
        </View>

        {/* Game Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GAME DATA</Text>
          <TouchableOpacity style={styles.settingItem} onPress={handleClearLocalSave}>
            <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: '#ff6b6b' }]}>Clear Local Save</Text>
              <Text style={styles.settingSubtitle}>Delete save from this device</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Mods Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MODS</Text>
          <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/mods')}>
            <Ionicons name="folder-open-outline" size={24} color="#00ff88" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Manage Mods</Text>
              <Text style={styles.settingSubtitle}>Import custom teams via CSV</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4a6a8a" />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>RETRO CHAMPIONSHIP TYCOON</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            <Text style={styles.aboutDescription}>
              A classic football management simulation inspired by CM 01/02 and Elifoot 98.
              Manage your club, build your squad, and compete for glory!
            </Text>
          </View>
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
  accountCard: {
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  accountInfo: {
    marginBottom: 16,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  accountEmail: {
    fontSize: 14,
    color: '#6a8aaa',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#2a1a2a',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '700',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6a8aaa',
    marginTop: 2,
  },
  aboutCard: {
    backgroundColor: '#0d2137',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00ff88',
    letterSpacing: 1,
  },
  aboutVersion: {
    fontSize: 12,
    color: '#4a9eff',
    marginTop: 4,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#6a8aaa',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
});
