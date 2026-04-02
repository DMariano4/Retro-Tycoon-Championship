/**
 * PlayerCareerStatsModal - Shows player career stats by season
 */
import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Player } from '../../context/GameContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PlayerCareerStatsModalProps {
  visible: boolean;
  player: Player | null;
  onClose: () => void;
}

export function PlayerCareerStatsModal({ visible, player, onClose }: PlayerCareerStatsModalProps) {
  if (!player) return null;

  const careerStats = player.careerStats || {};
  const seasons = Object.keys(careerStats).sort((a, b) => Number(b) - Number(a)); // Most recent first

  // Calculate career totals
  const careerTotals = seasons.reduce(
    (totals, season) => {
      const stats = careerStats[season];
      return {
        appearances: totals.appearances + stats.appearances,
        goals: totals.goals + stats.goals,
        assists: totals.assists + stats.assists,
        cleanSheets: totals.cleanSheets + stats.cleanSheets,
        yellowCards: totals.yellowCards + stats.yellowCards,
        redCards: totals.redCards + stats.redCards,
      };
    },
    { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, yellowCards: 0, redCards: 0 }
  );

  // Get rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 7.5) return '#00ff88';
    if (rating >= 6.5) return '#4a9eff';
    if (rating >= 5.5) return '#ffd700';
    return '#ff6b6b';
  };

  const isGK = player.position === 'GK';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.positionBadge}>
                <Text style={styles.positionText}>{player.position}</Text>
              </View>
              <View>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerInfo}>
                  {player.age}y • {player.nationality}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Career Totals */}
          <View style={styles.totalsSection}>
            <Text style={styles.sectionTitle}>CAREER TOTALS</Text>
            <View style={styles.totalsGrid}>
              <View style={styles.totalItem}>
                <Text style={styles.totalValue}>{careerTotals.appearances}</Text>
                <Text style={styles.totalLabel}>Apps</Text>
              </View>
              <View style={styles.totalItem}>
                <Text style={[styles.totalValue, { color: '#00ff88' }]}>{careerTotals.goals}</Text>
                <Text style={styles.totalLabel}>Goals</Text>
              </View>
              <View style={styles.totalItem}>
                <Text style={[styles.totalValue, { color: '#4a9eff' }]}>{careerTotals.assists}</Text>
                <Text style={styles.totalLabel}>Assists</Text>
              </View>
              {isGK && (
                <View style={styles.totalItem}>
                  <Text style={[styles.totalValue, { color: '#ffd700' }]}>{careerTotals.cleanSheets}</Text>
                  <Text style={styles.totalLabel}>CS</Text>
                </View>
              )}
            </View>
          </View>

          {/* Season by Season */}
          <View style={styles.seasonsSection}>
            <Text style={styles.sectionTitle}>SEASON BY SEASON</Text>
            
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { flex: 1.5 }]}>Season</Text>
              <Text style={[styles.headerCell, { flex: 2 }]}>Team</Text>
              <Text style={styles.headerCell}>AP</Text>
              <Text style={styles.headerCell}>G</Text>
              <Text style={styles.headerCell}>A</Text>
              {isGK && <Text style={styles.headerCell}>CS</Text>}
              <Text style={styles.headerCell}>Rtg</Text>
            </View>

            <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
              {seasons.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Ionicons name="stats-chart-outline" size={40} color="#4a6a8a" />
                  <Text style={styles.noDataText}>No career stats yet</Text>
                  <Text style={styles.noDataSubtext}>Play matches to build career history</Text>
                </View>
              ) : (
                seasons.map((season) => {
                  const stats = careerStats[season];
                  return (
                    <View key={season} style={styles.tableRow}>
                      <Text style={[styles.cell, { flex: 1.5 }]}>{season}/{Number(season) + 1 - 2000}</Text>
                      <Text style={[styles.cell, styles.teamCell, { flex: 2 }]} numberOfLines={1}>
                        {stats.teamName}
                      </Text>
                      <Text style={styles.cell}>{stats.appearances}</Text>
                      <Text style={[styles.cell, stats.goals > 0 && { color: '#00ff88' }]}>
                        {stats.goals}
                      </Text>
                      <Text style={[styles.cell, stats.assists > 0 && { color: '#4a9eff' }]}>
                        {stats.assists}
                      </Text>
                      {isGK && (
                        <Text style={[styles.cell, stats.cleanSheets > 0 && { color: '#ffd700' }]}>
                          {stats.cleanSheets}
                        </Text>
                      )}
                      <Text style={[styles.cell, { color: getRatingColor(stats.avgRating || 0) }]}>
                        {stats.avgRating?.toFixed(1) || '-'}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButtonFull} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Math.min(SCREEN_WIDTH - 32, 400),
    maxHeight: '85%',
    backgroundColor: '#0d2137',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1a3a5c',
    borderBottomWidth: 1,
    borderBottomColor: '#2a4a6c',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  positionBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0d2137',
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionText: {
    color: '#4a9eff',
    fontSize: 12,
    fontWeight: '700',
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  playerInfo: {
    color: '#6a8aaa',
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  totalsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  sectionTitle: {
    color: '#4a9eff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  totalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  totalItem: {
    alignItems: 'center',
  },
  totalValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  totalLabel: {
    color: '#6a8aaa',
    fontSize: 10,
    marginTop: 4,
  },
  seasonsSection: {
    flex: 1,
    padding: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: '#0a1628',
    borderRadius: 6,
    marginBottom: 8,
  },
  headerCell: {
    flex: 1,
    color: '#4a6a8a',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  tableBody: {
    maxHeight: 200,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  cell: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  teamCell: {
    textAlign: 'left',
    color: '#6a8aaa',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noDataText: {
    color: '#6a8aaa',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  noDataSubtext: {
    color: '#4a6a8a',
    fontSize: 12,
    marginTop: 4,
  },
  closeButtonFull: {
    backgroundColor: '#1a3a5c',
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2a4a6c',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
