import React from 'react';
import { View, Text, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { matchStyles as styles } from './matchStyles';

interface WeekSimulationModalProps {
  visible: boolean;
  currentWeek: number;
  leagueCount: number;
}

export function WeekSimulationModal({ visible, currentWeek, leagueCount }: WeekSimulationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.simLoadingOverlay}>
        <View style={styles.simLoadingContainer}>
          {/* Retro screen border */}
          <View style={styles.simLoadingScreen}>
            {/* Header */}
            <View style={styles.simLoadingHeader}>
              <Ionicons name="football" size={24} color="#00ff88" />
              <Text style={styles.simLoadingTitle}>SIMULATING MATCHES</Text>
              <Ionicons name="football" size={24} color="#00ff88" />
            </View>

            {/* Week info */}
            <Text style={styles.simLoadingWeek}>
              Week {currentWeek || 0} Results
            </Text>

            {/* Animated dots */}
            <View style={styles.simLoadingDots}>
              <Text style={styles.simLoadingDotsText}>Processing league fixtures . . .</Text>
            </View>

            {/* Retro progress bar */}
            <View style={styles.simProgressContainer}>
              <View style={styles.simProgressTrack}>
                <View style={[styles.simProgressFill, { width: '100%' }]} />
              </View>
              <Text style={styles.simProgressText}>
                {leagueCount} league{leagueCount > 1 ? 's' : ''} · ~{leagueCount * 9} matches
              </Text>
            </View>

            {/* Spinner */}
            <ActivityIndicator size="large" color="#00ff88" style={{ marginTop: 16 }} />

            {/* Retro footer */}
            <Text style={styles.simLoadingFooter}>Please wait...</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
