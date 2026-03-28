import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { CupFixture } from '../utils/competitions';

interface CupDrawModalProps {
  visible: boolean;
  cupName: string;
  cupIcon: string;
  cupColor: string;
  roundName: string;
  fixtures: CupFixture[];
  managedTeamId: string;
  onClose: () => void;
}

export function CupDrawModal({
  visible,
  cupName,
  cupIcon,
  cupColor,
  roundName,
  fixtures,
  managedTeamId,
  onClose,
}: CupDrawModalProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  
  // Find managed team's fixture
  const managedFixture = fixtures.find(
    f => f.homeTeamId === managedTeamId || f.awayTeamId === managedTeamId
  );
  const managedFixtureIndex = fixtures.findIndex(
    f => f.homeTeamId === managedTeamId || f.awayTeamId === managedTeamId
  );

  useEffect(() => {
    if (visible && fixtures.length > 0) {
      // Start reveal animation
      setRevealedCount(0);
      setIsRevealing(true);
      
      const interval = setInterval(() => {
        setRevealedCount(prev => {
          if (prev >= fixtures.length) {
            clearInterval(interval);
            setIsRevealing(false);
            return prev;
          }
          return prev + 1;
        });
      }, 400); // Reveal one fixture every 400ms
      
      return () => clearInterval(interval);
    }
  }, [visible, fixtures.length]);

  const isHome = managedFixture?.homeTeamId === managedTeamId;
  const opponent = managedFixture 
    ? (isHome ? managedFixture.awayTeamName : managedFixture.homeTeamName)
    : null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: cupColor }]}>
            <Text style={styles.cupIcon}>{cupIcon}</Text>
            <View style={styles.headerText}>
              <Text style={[styles.cupName, { color: cupColor }]}>{cupName}</Text>
              <Text style={styles.roundName}>{roundName} Draw</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6a8aaa" />
            </TouchableOpacity>
          </View>

          {/* Your Draw - Highlighted */}
          {managedFixture && revealedCount > managedFixtureIndex && (
            <View style={[styles.yourDrawCard, { borderColor: cupColor }]}>
              <Text style={styles.yourDrawLabel}>YOUR DRAW</Text>
              <View style={styles.yourMatchup}>
                <View style={styles.yourTeam}>
                  <Text style={[styles.yourTeamName, isHome && styles.homeTeam]}>
                    {managedFixture.homeTeamName}
                  </Text>
                  {isHome && <Text style={styles.homeLabel}>(H)</Text>}
                </View>
                <Text style={styles.vsText}>vs</Text>
                <View style={styles.yourTeam}>
                  <Text style={[styles.yourTeamName, !isHome && styles.awayTeam]}>
                    {managedFixture.awayTeamName}
                  </Text>
                  {!isHome && <Text style={styles.awayLabel}>(A)</Text>}
                </View>
              </View>
              <Text style={styles.matchDate}>
                {new Date(managedFixture.matchDate).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                })}
              </Text>
            </View>
          )}

          {/* All Fixtures */}
          <ScrollView style={styles.fixturesList} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>ALL FIXTURES</Text>
            {fixtures.map((fixture, index) => {
              const isRevealed = index < revealedCount;
              const isManaged = fixture.homeTeamId === managedTeamId || 
                               fixture.awayTeamId === managedTeamId;
              
              return (
                <View 
                  key={fixture.id} 
                  style={[
                    styles.fixtureRow,
                    isManaged && styles.fixtureRowHighlight,
                    !isRevealed && styles.fixtureRowHidden,
                  ]}
                >
                  <Text style={styles.fixtureNumber}>{index + 1}</Text>
                  {isRevealed ? (
                    <View style={styles.fixtureTeams}>
                      <Text style={[
                        styles.fixtureTeam,
                        fixture.homeTeamId === managedTeamId && styles.managedTeamText
                      ]}>
                        {fixture.homeTeamName}
                      </Text>
                      <Text style={styles.fixtureVs}>v</Text>
                      <Text style={[
                        styles.fixtureTeam,
                        fixture.awayTeamId === managedTeamId && styles.managedTeamText
                      ]}>
                        {fixture.awayTeamName}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.fixtureTeams}>
                      <Text style={styles.hiddenText}>??? ??? ???</Text>
                      <Text style={styles.fixtureVs}>v</Text>
                      <Text style={styles.hiddenText}>??? ??? ???</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Continue Button */}
          {!isRevealing && (
            <TouchableOpacity 
              style={[styles.continueButton, { backgroundColor: cupColor }]}
              onPress={onClose}
            >
              <Text style={styles.continueButtonText}>CONTINUE</Text>
            </TouchableOpacity>
          )}
          
          {isRevealing && (
            <View style={styles.revealingIndicator}>
              <Ionicons name="hourglass" size={20} color="#ffd700" />
              <Text style={styles.revealingText}>Drawing balls...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#0a1628',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1a2d4a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 3,
    backgroundColor: '#0d1f35',
  },
  cupIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  cupName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  roundName: {
    fontSize: 14,
    color: '#6a8aaa',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  yourDrawCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#0d2137',
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  yourDrawLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffd700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  yourMatchup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  yourTeam: {
    flex: 1,
    alignItems: 'center',
  },
  yourTeamName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  homeTeam: {
    color: '#00ff88',
  },
  awayTeam: {
    color: '#4a9eff',
  },
  homeLabel: {
    fontSize: 11,
    color: '#00ff88',
    marginTop: 4,
  },
  awayLabel: {
    fontSize: 11,
    color: '#4a9eff',
    marginTop: 4,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6a8aaa',
  },
  matchDate: {
    fontSize: 12,
    color: '#6a8aaa',
    marginTop: 12,
  },
  fixturesList: {
    paddingHorizontal: 16,
    maxHeight: 300,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4a6a8a',
    letterSpacing: 1,
    marginBottom: 12,
  },
  fixtureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 4,
    backgroundColor: '#0d1f35',
    borderRadius: 8,
  },
  fixtureRowHighlight: {
    backgroundColor: '#1a3a5a',
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  fixtureRowHidden: {
    opacity: 0.5,
  },
  fixtureNumber: {
    width: 24,
    fontSize: 11,
    fontWeight: '600',
    color: '#4a6a8a',
    textAlign: 'center',
  },
  fixtureTeams: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixtureTeam: {
    flex: 1,
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
  },
  managedTeamText: {
    color: '#00ff88',
    fontWeight: '700',
  },
  fixtureVs: {
    fontSize: 10,
    color: '#4a6a8a',
    marginHorizontal: 8,
  },
  hiddenText: {
    flex: 1,
    fontSize: 12,
    color: '#3a5a7a',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  continueButton: {
    margin: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a1628',
    letterSpacing: 1,
  },
  revealingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  revealingText: {
    fontSize: 14,
    color: '#ffd700',
    fontWeight: '600',
  },
});

export default CupDrawModal;
