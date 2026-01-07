import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/context/GameContext';

const { width: screenWidth } = Dimensions.get('window');

// CM01/02 inspired tactics options
const FORMATIONS = ['4-4-2', '4-3-3', '3-5-2', '4-5-1', '5-3-2', '4-2-3-1', '3-4-3', '5-4-1'];

const MENTALITY_OPTIONS = [
  { id: 'very_defensive', label: 'Very Defensive', value: 1 },
  { id: 'defensive', label: 'Defensive', value: 2 },
  { id: 'balanced', label: 'Balanced', value: 3 },
  { id: 'attacking', label: 'Attacking', value: 4 },
  { id: 'very_attacking', label: 'Very Attacking', value: 5 },
];

const PASSING_STYLE = [
  { id: 'direct', label: 'Direct', description: 'Long balls, quick transitions' },
  { id: 'mixed', label: 'Mixed', description: 'Balance of short and long passes' },
  { id: 'short', label: 'Short', description: 'Patient buildup play' },
];

const TEMPO_OPTIONS = [
  { id: 'slow', label: 'Slow', description: 'Patient, controlled' },
  { id: 'normal', label: 'Normal', description: 'Standard pace' },
  { id: 'fast', label: 'Fast', description: 'Quick, direct play' },
];

const TACKLING_OPTIONS = [
  { id: 'easy', label: 'Easy', description: 'Fewer fouls, less aggressive' },
  { id: 'normal', label: 'Normal', description: 'Balanced approach' },
  { id: 'hard', label: 'Hard', description: 'Aggressive, physical' },
];

const CLOSING_DOWN_OPTIONS = [
  { id: 'never', label: 'Never', description: 'Sit back, hold shape' },
  { id: 'sometimes', label: 'Sometimes', description: 'Selective pressing' },
  { id: 'always', label: 'Always', description: 'High press' },
];

export default function AdvancedTacticsScreen() {
  const { getManagedTeam, updateFormation } = useGame();
  const team = getManagedTeam();

  // Initialize with team's current tactics or defaults
  const [formation, setFormation] = useState(team?.formation || '4-4-2');
  const [mentality, setMentality] = useState(3); // Balanced
  const [passingStyle, setPassingStyle] = useState('mixed');
  const [tempo, setTempo] = useState('normal');
  const [tackling, setTackling] = useState('normal');
  const [closingDown, setClosingDown] = useState('sometimes');
  const [offsideTrap, setOffsideTrap] = useState(false);
  const [counterAttack, setCounterAttack] = useState(false);

  const handleSaveTactics = () => {
    const tactics = {
      formation,
      mentality,
      passingStyle,
      tempo,
      tackling,
      closingDown,
      offsideTrap,
      counterAttack,
    };
    
    updateFormation(formation, tactics);
    Alert.alert('Success', 'Tactics saved successfully!');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#00ff88" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ADVANCED TACTICS</Text>
        <TouchableOpacity onPress={handleSaveTactics}>
          <Ionicons name="checkmark" size={24} color="#00ff88" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Formation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FORMATION</Text>
          <Text style={styles.sectionDescription}>Choose your team's shape</Text>
          <View style={styles.formationGrid}>
            {FORMATIONS.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.formationButton, formation === f && styles.formationButtonActive]}
                onPress={() => setFormation(f)}
              >
                <Text style={[styles.formationText, formation === f && styles.formationTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Team Mentality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TEAM MENTALITY</Text>
          <Text style={styles.sectionDescription}>Overall attacking/defensive approach</Text>
          <View style={styles.sliderContainer}>
            {MENTALITY_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.mentaliryDot,
                  mentality >= option.value && styles.mentalityDotActive
                ]}
                onPress={() => setMentality(option.value)}
              >
                <View style={styles.mentalityDotInner} />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.mentalityLabels}>
            <Text style={styles.mentalityLabel}>Defensive</Text>
            <Text style={[styles.mentalityLabel, styles.mentalityLabelActive]}>
              {MENTALITY_OPTIONS[mentality - 1]?.label}
            </Text>
            <Text style={styles.mentalityLabel}>Attacking</Text>
          </View>
        </View>

        {/* Passing Style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PASSING STYLE</Text>
          <Text style={styles.sectionDescription}>How your team builds attacks</Text>
          {PASSING_STYLE.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, passingStyle === option.id && styles.optionCardActive]}
              onPress={() => setPassingStyle(option.id)}
            >
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              {passingStyle === option.id && (
                <Ionicons name="checkmark-circle" size={24} color="#00ff88" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tempo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TEMPO</Text>
          <Text style={styles.sectionDescription}>Speed of play</Text>
          {TEMPO_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, tempo === option.id && styles.optionCardActive]}
              onPress={() => setTempo(option.id)}
            >
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              {tempo === option.id && (
                <Ionicons name="checkmark-circle" size={24} color="#00ff88" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tackling */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TACKLING</Text>
          <Text style={styles.sectionDescription}>Defensive aggression level</Text>
          {TACKLING_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, tackling === option.id && styles.optionCardActive]}
              onPress={() => setTackling(option.id)}
            >
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              {tackling === option.id && (
                <Ionicons name="checkmark-circle" size={24} color="#00ff88" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Closing Down */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CLOSING DOWN</Text>
          <Text style={styles.sectionDescription}>Pressing intensity</Text>
          {CLOSING_DOWN_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, closingDown === option.id && styles.optionCardActive]}
              onPress={() => setClosingDown(option.id)}
            >
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              {closingDown === option.id && (
                <Ionicons name="checkmark-circle" size={24} color="#00ff88" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Special Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SPECIAL INSTRUCTIONS</Text>
          <Text style={styles.sectionDescription}>Additional tactical options</Text>
          
          <TouchableOpacity
            style={[styles.toggleCard, offsideTrap && styles.toggleCardActive]}
            onPress={() => setOffsideTrap(!offsideTrap)}
          >
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Offside Trap</Text>
              <Text style={styles.toggleDescription}>
                Defenders push up to catch attackers offside
              </Text>
            </View>
            <View style={[styles.toggle, offsideTrap && styles.toggleActive]}>
              {offsideTrap && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleCard, counterAttack && styles.toggleCardActive]}
            onPress={() => setCounterAttack(!counterAttack)}
          >
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Counter Attack</Text>
              <Text style={styles.toggleDescription}>
                Exploit space when opponents push forward
              </Text>
            </View>
            <View style={[styles.toggle, counterAttack && styles.toggleActive]}>
              {counterAttack && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Tactical Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>TACTICAL SUMMARY</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Formation:</Text>
            <Text style={styles.summaryValue}>{formation}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Mentality:</Text>
            <Text style={styles.summaryValue}>{MENTALITY_OPTIONS[mentality - 1]?.label}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Style:</Text>
            <Text style={styles.summaryValue}>
              {PASSING_STYLE.find(p => p.id === passingStyle)?.label} passing, {tempo} tempo
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Defense:</Text>
            <Text style={styles.summaryValue}>
              {TACKLING_OPTIONS.find(t => t.id === tackling)?.label} tackling, {closingDown} closing down
            </Text>
          </View>
          {(offsideTrap || counterAttack) && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Special:</Text>
              <Text style={styles.summaryValue}>
                {[offsideTrap && 'Offside trap', counterAttack && 'Counter attack']
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveTactics}>
          <Ionicons name="save-outline" size={20} color="#0a1628" />
          <Text style={styles.saveButtonText}>SAVE TACTICS</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 16,
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
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 11,
    color: '#4a6a8a',
    marginBottom: 12,
  },
  formationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formationButton: {
    backgroundColor: '#0d2137',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1a4a6c',
  },
  formationButtonActive: {
    borderColor: '#00ff88',
    backgroundColor: '#1a4a3c',
  },
  formationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6a8aaa',
  },
  formationTextActive: {
    color: '#00ff88',
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  mentaliryDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a3a5c',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1a4a6c',
  },
  mentalityDotActive: {
    backgroundColor: '#1a4a3c',
    borderColor: '#00ff88',
  },
  mentalityDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  mentalityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  mentalityLabel: {
    fontSize: 10,
    color: '#4a6a8a',
  },
  mentalityLabelActive: {
    fontSize: 11,
    color: '#00ff88',
    fontWeight: '700',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1a4a6c',
    marginBottom: 8,
  },
  optionCardActive: {
    borderColor: '#00ff88',
    backgroundColor: '#1a4a3c',
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  optionDescription: {
    fontSize: 11,
    color: '#6a8aaa',
    marginTop: 2,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1a4a6c',
    marginBottom: 8,
  },
  toggleCardActive: {
    borderColor: '#00ff88',
    backgroundColor: '#1a4a3c',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  toggleDescription: {
    fontSize: 11,
    color: '#6a8aaa',
    marginTop: 2,
  },
  toggle: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#1a3a5c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#00ff88',
  },
  summaryCard: {
    backgroundColor: '#0d4a2f',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1a6a4f',
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00ff88',
    letterSpacing: 1,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1a5a4f',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6aaa8a',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1a3a5c',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00ff88',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a1628',
    letterSpacing: 1,
  },
});
