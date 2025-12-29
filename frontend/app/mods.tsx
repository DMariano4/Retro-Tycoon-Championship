import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Constants from 'expo-constants';

const getBackendUrl = () => {
  const envUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 
                 process.env.EXPO_PUBLIC_BACKEND_URL || '';
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return '';
  }
  return envUrl;
};

const BACKEND_URL = getBackendUrl();

export default function ModsScreen() {
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleUploadTeams = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      setLoading(true);
      setUploadResult(null);

      const file = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: 'text/csv',
        name: file.name
      } as any);

      const response = await fetch(`${BACKEND_URL}/api/mods/upload/teams`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUploadResult(data);
        Alert.alert('Success', `Imported ${data.teams_count} teams!`);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to upload file');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick file');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPlayers = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      setLoading(true);
      setUploadResult(null);

      const file = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: 'text/csv',
        name: file.name
      } as any);

      const response = await fetch(`${BACKEND_URL}/api/mods/upload/players`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUploadResult(data);
        Alert.alert('Success', `Imported ${data.players_count} players!`);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to upload file');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#00ff88" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MODS</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#4a9eff" />
          <Text style={styles.infoText}>
            Import custom teams and players via CSV files. This allows you to create
            your own leagues with real or fictional teams.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>IMPORT DATA</Text>
          
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={handleUploadTeams}
            disabled={loading}
          >
            <View style={styles.uploadIcon}>
              <Ionicons name="shield" size={24} color="#00ff88" />
            </View>
            <View style={styles.uploadInfo}>
              <Text style={styles.uploadTitle}>Import Teams</Text>
              <Text style={styles.uploadSubtitle}>Upload CSV with team data</Text>
            </View>
            {loading ? (
              <ActivityIndicator color="#00ff88" />
            ) : (
              <Ionicons name="cloud-upload" size={24} color="#4a6a8a" />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={handleUploadPlayers}
            disabled={loading}
          >
            <View style={styles.uploadIcon}>
              <Ionicons name="person" size={24} color="#4a9eff" />
            </View>
            <View style={styles.uploadInfo}>
              <Text style={styles.uploadTitle}>Import Players</Text>
              <Text style={styles.uploadSubtitle}>Upload CSV with player data</Text>
            </View>
            {loading ? (
              <ActivityIndicator color="#4a9eff" />
            ) : (
              <Ionicons name="cloud-upload" size={24} color="#4a6a8a" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CSV FORMAT</Text>
          
          <View style={styles.formatCard}>
            <Text style={styles.formatTitle}>Teams CSV Columns:</Text>
            <Text style={styles.formatColumns}>
              id, name, short_name, stadium, division, budget, primary_color, secondary_color
            </Text>
          </View>

          <View style={styles.formatCard}>
            <Text style={styles.formatTitle}>Players CSV Columns:</Text>
            <Text style={styles.formatColumns}>
              id, name, team_id, age, nationality, position, pace, shooting, passing, tackling, heading, stamina, handling, current_ability, potential_ability, value, wage
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EXAMPLE</Text>
          
          <View style={styles.exampleCard}>
            <Text style={styles.exampleTitle}>teams.csv</Text>
            <Text style={styles.exampleContent}>
              id,name,short_name,stadium,division,budget,primary_color,secondary_color{"\n"}
              team_1,Real Madrid,RMA,Santiago Bernabeu,1,200000000,#FFFFFF,#00529F{"\n"}
              team_2,Barcelona,BAR,Camp Nou,1,180000000,#A50044,#004D98
            </Text>
          </View>
        </View>

        {uploadResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>LAST UPLOAD RESULT</Text>
            <View style={styles.resultCard}>
              <Ionicons name="checkmark-circle" size={24} color="#00ff88" />
              <Text style={styles.resultText}>
                Successfully processed {uploadResult.teams_count || uploadResult.players_count} items
              </Text>
            </View>
          </View>
        )}
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#0d2a4a',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    color: '#9ab8d8',
    fontSize: 13,
    lineHeight: 20,
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    marginBottom: 8,
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1a3a5c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  uploadInfo: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  uploadSubtitle: {
    fontSize: 12,
    color: '#6a8aaa',
    marginTop: 2,
  },
  formatCard: {
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    marginBottom: 8,
  },
  formatTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4a9eff',
    marginBottom: 8,
  },
  formatColumns: {
    fontSize: 11,
    color: '#6a8aaa',
    fontFamily: 'monospace',
  },
  exampleCard: {
    backgroundColor: '#0d1a28',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a3a5c',
  },
  exampleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00ff88',
    marginBottom: 8,
  },
  exampleContent: {
    fontSize: 10,
    color: '#6a8aaa',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a4a3c',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  resultText: {
    flex: 1,
    color: '#00ff88',
    fontSize: 14,
  },
});
