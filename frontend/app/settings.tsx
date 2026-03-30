import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSaveSlots } from '../src/context/SaveSlotsContext';

export default function SettingsScreen() {
  const { clearAllSlots } = useSaveSlots();

  const handleClearAllSaves = () => {
    Alert.alert(
      'Clear All Saves',
      'Are you sure you want to delete ALL save slots? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await clearAllSlots();
            Alert.alert('Success', 'All saves deleted');
          }
        }
      ]
    );
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
        {/* Game Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GAME DATA</Text>
          <TouchableOpacity style={styles.settingItem} onPress={handleClearAllSaves}>
            <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: '#ff6b6b' }]}>Clear All Saves</Text>
              <Text style={styles.settingSubtitle}>Delete all save slots</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>RETRO FOOTBALL CHAMPIONSHIP</Text>
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
