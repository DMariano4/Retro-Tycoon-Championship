import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { gameStyles as styles } from './gameStyles';

// Simple formation preview component
const FormationPreview = ({ formation }: { formation: string }) => {
  const getPositions = (formation: string) => {
    const formations: { [key: string]: { x: number; y: number }[] } = {
      '4-4-2': [
        { x: 50, y: 90 }, // GK
        { x: 15, y: 70 }, { x: 35, y: 70 }, { x: 65, y: 70 }, { x: 85, y: 70 }, // DEF
        { x: 15, y: 45 }, { x: 35, y: 45 }, { x: 65, y: 45 }, { x: 85, y: 45 }, // MID
        { x: 35, y: 20 }, { x: 65, y: 20 }, // FWD
      ],
      '4-3-3': [
        { x: 50, y: 90 },
        { x: 15, y: 70 }, { x: 35, y: 70 }, { x: 65, y: 70 }, { x: 85, y: 70 },
        { x: 30, y: 45 }, { x: 50, y: 45 }, { x: 70, y: 45 },
        { x: 20, y: 20 }, { x: 50, y: 20 }, { x: 80, y: 20 },
      ],
      '4-2-3-1': [
        { x: 50, y: 90 },
        { x: 15, y: 70 }, { x: 35, y: 70 }, { x: 65, y: 70 }, { x: 85, y: 70 },
        { x: 35, y: 55 }, { x: 65, y: 55 },
        { x: 20, y: 35 }, { x: 50, y: 35 }, { x: 80, y: 35 },
        { x: 50, y: 15 },
      ],
      '3-5-2': [
        { x: 50, y: 90 },
        { x: 25, y: 70 }, { x: 50, y: 70 }, { x: 75, y: 70 },
        { x: 10, y: 45 }, { x: 30, y: 45 }, { x: 50, y: 45 }, { x: 70, y: 45 }, { x: 90, y: 45 },
        { x: 35, y: 20 }, { x: 65, y: 20 },
      ],
      '5-3-2': [
        { x: 50, y: 90 },
        { x: 10, y: 65 }, { x: 30, y: 70 }, { x: 50, y: 70 }, { x: 70, y: 70 }, { x: 90, y: 65 },
        { x: 30, y: 45 }, { x: 50, y: 45 }, { x: 70, y: 45 },
        { x: 35, y: 20 }, { x: 65, y: 20 },
      ],
      '4-5-1': [
        { x: 50, y: 90 },
        { x: 15, y: 70 }, { x: 35, y: 70 }, { x: 65, y: 70 }, { x: 85, y: 70 },
        { x: 10, y: 45 }, { x: 30, y: 45 }, { x: 50, y: 40 }, { x: 70, y: 45 }, { x: 90, y: 45 },
        { x: 50, y: 18 },
      ],
      '4-1-4-1': [
        { x: 50, y: 90 },
        { x: 15, y: 70 }, { x: 35, y: 70 }, { x: 65, y: 70 }, { x: 85, y: 70 },
        { x: 50, y: 55 },
        { x: 12, y: 38 }, { x: 35, y: 40 }, { x: 65, y: 40 }, { x: 88, y: 38 },
        { x: 50, y: 18 },
      ],
      '3-4-3': [
        { x: 50, y: 90 },
        { x: 25, y: 70 }, { x: 50, y: 70 }, { x: 75, y: 70 },
        { x: 15, y: 45 }, { x: 38, y: 45 }, { x: 62, y: 45 }, { x: 85, y: 45 },
        { x: 20, y: 20 }, { x: 50, y: 18 }, { x: 80, y: 20 },
      ],
    };
    return formations[formation] || formations['4-4-2'];
  };

  const positions = getPositions(formation);

  return (
    <View style={tacticsStyles.pitchPreview}>
      <View style={tacticsStyles.pitchLines}>
        <View style={tacticsStyles.centerCircle} />
        <View style={tacticsStyles.centerLine} />
      </View>
      {positions.map((pos, idx) => (
        <View
          key={idx}
          style={[
            tacticsStyles.playerDot,
            { left: `${pos.x - 4}%`, top: `${pos.y - 6}%` },
            idx === 0 && tacticsStyles.playerDotGK,
          ]}
        />
      ))}
    </View>
  );
};

export function TacticsTab({ team }: any) {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Current Formation with Preview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CURRENT FORMATION</Text>
        <TouchableOpacity 
          style={tacticsStyles.formationCard}
          onPress={() => router.push('/tactics-advanced')}
        >
          <FormationPreview formation={team?.formation || '4-4-2'} />
          <View style={tacticsStyles.formationInfo}>
            <Text style={tacticsStyles.formationText}>{team?.formation || '4-4-2'}</Text>
            <Text style={tacticsStyles.tapToEdit}>Tap to edit tactics</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Tactical Features - 2 Column Layout */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TACTICAL FEATURES</Text>
        
        <View style={tacticsStyles.featuresGrid}>
          <View style={tacticsStyles.featureItem}>
            <Ionicons name="flash-outline" size={20} color="#4a9eff" />
            <Text style={tacticsStyles.featureTitle}>Mentality</Text>
            <Text style={tacticsStyles.featureDesc}>Attack/Defense</Text>
          </View>

          <View style={tacticsStyles.featureItem}>
            <Ionicons name="git-network-outline" size={20} color="#4a9eff" />
            <Text style={tacticsStyles.featureTitle}>Passing</Text>
            <Text style={tacticsStyles.featureDesc}>Direct/Short</Text>
          </View>

          <View style={tacticsStyles.featureItem}>
            <Ionicons name="timer-outline" size={20} color="#4a9eff" />
            <Text style={tacticsStyles.featureTitle}>Tempo</Text>
            <Text style={tacticsStyles.featureDesc}>Speed of play</Text>
          </View>

          <View style={tacticsStyles.featureItem}>
            <Ionicons name="shield-outline" size={20} color="#4a9eff" />
            <Text style={tacticsStyles.featureTitle}>Defending</Text>
            <Text style={tacticsStyles.featureDesc}>Press/Offside</Text>
          </View>

          <View style={tacticsStyles.featureItem}>
            <Ionicons name="rocket-outline" size={20} color="#4a9eff" />
            <Text style={tacticsStyles.featureTitle}>Counter</Text>
            <Text style={tacticsStyles.featureDesc}>Quick breaks</Text>
          </View>

          <View style={tacticsStyles.featureItem}>
            <Ionicons name="body-outline" size={20} color="#4a9eff" />
            <Text style={tacticsStyles.featureTitle}>Marking</Text>
            <Text style={tacticsStyles.featureDesc}>Man/Zonal</Text>
          </View>
        </View>
      </View>

      {/* Advanced Tactics Button */}
      <TouchableOpacity 
        style={tacticsStyles.advancedButton}
        onPress={() => router.push('/tactics-advanced')}
      >
        <Ionicons name="settings-outline" size={20} color="#0a1628" />
        <Text style={tacticsStyles.advancedButtonText}>OPEN ADVANCED TACTICS</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const tacticsStyles = StyleSheet.create({
  pitchPreview: {
    width: 100,
    height: 130,
    backgroundColor: '#1a5c3a',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2a7a4a',
    position: 'relative',
    overflow: 'hidden',
  },
  pitchLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  centerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  playerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff88',
  },
  playerDotGK: {
    backgroundColor: '#ffaa00',
  },
  formationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    gap: 16,
  },
  formationInfo: {
    flex: 1,
  },
  formationText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  tapToEdit: {
    fontSize: 11,
    color: '#4a9eff',
    marginTop: 4,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureItem: {
    width: '48%',
    backgroundColor: '#0d2137',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    marginTop: 6,
  },
  featureDesc: {
    fontSize: 10,
    color: '#6a8aaa',
    marginTop: 2,
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ff88',
    padding: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  advancedButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0a1628',
  },
});
