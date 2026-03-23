import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { gameStyles as styles } from './gameStyles';

export function TacticsTab({ team }: any) {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Current Formation Display */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CURRENT FORMATION</Text>
        <View style={styles.currentFormationCard}>
          <Ionicons name="grid-outline" size={48} color="#4a9eff" />
          <Text style={styles.currentFormation}>{team?.formation || '4-4-2'}</Text>
          <Text style={styles.currentFormationLabel}>Formation</Text>
        </View>
      </View>

      {/* Advanced Tactics Button */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.advancedTacticsButton}
          onPress={() => router.push('/tactics-advanced')}
        >
          <View style={styles.advancedTacticsIconContainer}>
            <Ionicons name="settings-outline" size={32} color="#00ff88" />
          </View>
          <View style={styles.advancedTacticsInfo}>
            <Text style={styles.advancedTacticsTitle}>Advanced Tactics</Text>
            <Text style={styles.advancedTacticsDescription}>
              CM01/02 inspired tactics system
            </Text>
            <View style={styles.advancedTacticsTags}>
              <View style={styles.advancedTacticsTag}>
                <Text style={styles.advancedTacticsTagText}>Formation</Text>
              </View>
              <View style={styles.advancedTacticsTag}>
                <Text style={styles.advancedTacticsTagText}>Mentality</Text>
              </View>
              <View style={styles.advancedTacticsTag}>
                <Text style={styles.advancedTacticsTagText}>Passing</Text>
              </View>
              <View style={styles.advancedTacticsTag}>
                <Text style={styles.advancedTacticsTagText}>Tempo</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#4a6a8a" />
        </TouchableOpacity>
      </View>

      {/* Tactical Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TACTICAL FEATURES</Text>
        
        <View style={styles.featureCard}>
          <Ionicons name="flash-outline" size={24} color="#4a9eff" />
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Team Mentality</Text>
            <Text style={styles.featureDescription}>
              Control attacking/defensive balance
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Ionicons name="git-network-outline" size={24} color="#4a9eff" />
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Passing Style</Text>
            <Text style={styles.featureDescription}>
              Direct, mixed, or short passing
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Ionicons name="timer-outline" size={24} color="#4a9eff" />
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Tempo Control</Text>
            <Text style={styles.featureDescription}>
              Adjust speed of play
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Ionicons name="shield-outline" size={24} color="#4a9eff" />
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Defensive Options</Text>
            <Text style={styles.featureDescription}>
              Tackling, pressing, offside trap
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Ionicons name="rocket-outline" size={24} color="#4a9eff" />
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>Counter Attack</Text>
            <Text style={styles.featureDescription}>
              Exploit opponent's attacking play
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
