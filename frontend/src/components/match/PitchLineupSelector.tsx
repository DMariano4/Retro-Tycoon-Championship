/**
 * PitchLineupSelector - Visual pitch-based lineup selector with draggable players
 * Shows formation positions on pitch and allows player selection for each slot
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Player, Team } from '../../context/GameContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PitchLineupSelectorProps {
  team: Team;
  formation: string;
  selectedLineup: Player[];
  onLineupChange: (lineup: Player[]) => void;
  onFormationChange?: (formation: string) => void;
}

// Formation position templates (x: 0-100 left-right, y: 0-100 GK at bottom)
const FORMATION_TEMPLATES: Record<string, { position: string; x: number; y: number; label: string }[]> = {
  '4-4-2': [
    { position: 'GK', x: 50, y: 5, label: 'GK' },
    { position: 'LB', x: 15, y: 25, label: 'LB' },
    { position: 'CB', x: 38, y: 20, label: 'CB' },
    { position: 'CB', x: 62, y: 20, label: 'CB' },
    { position: 'RB', x: 85, y: 25, label: 'RB' },
    { position: 'LM', x: 15, y: 50, label: 'LM' },
    { position: 'CM', x: 38, y: 45, label: 'CM' },
    { position: 'CM', x: 62, y: 45, label: 'CM' },
    { position: 'RM', x: 85, y: 50, label: 'RM' },
    { position: 'ST', x: 38, y: 75, label: 'ST' },
    { position: 'ST', x: 62, y: 75, label: 'ST' },
  ],
  '4-3-3': [
    { position: 'GK', x: 50, y: 5, label: 'GK' },
    { position: 'LB', x: 15, y: 25, label: 'LB' },
    { position: 'CB', x: 38, y: 20, label: 'CB' },
    { position: 'CB', x: 62, y: 20, label: 'CB' },
    { position: 'RB', x: 85, y: 25, label: 'RB' },
    { position: 'CM', x: 30, y: 48, label: 'CM' },
    { position: 'CM', x: 50, y: 42, label: 'CM' },
    { position: 'CM', x: 70, y: 48, label: 'CM' },
    { position: 'LW', x: 18, y: 75, label: 'LW' },
    { position: 'ST', x: 50, y: 80, label: 'ST' },
    { position: 'RW', x: 82, y: 75, label: 'RW' },
  ],
  '4-2-3-1': [
    { position: 'GK', x: 50, y: 5, label: 'GK' },
    { position: 'LB', x: 15, y: 25, label: 'LB' },
    { position: 'CB', x: 38, y: 20, label: 'CB' },
    { position: 'CB', x: 62, y: 20, label: 'CB' },
    { position: 'RB', x: 85, y: 25, label: 'RB' },
    { position: 'DM', x: 38, y: 40, label: 'DM' },
    { position: 'DM', x: 62, y: 40, label: 'DM' },
    { position: 'LW', x: 20, y: 58, label: 'LW' },
    { position: 'AM', x: 50, y: 62, label: 'AM' },
    { position: 'RW', x: 80, y: 58, label: 'RW' },
    { position: 'ST', x: 50, y: 82, label: 'ST' },
  ],
  '3-5-2': [
    { position: 'GK', x: 50, y: 5, label: 'GK' },
    { position: 'CB', x: 30, y: 20, label: 'CB' },
    { position: 'CB', x: 50, y: 18, label: 'CB' },
    { position: 'CB', x: 70, y: 20, label: 'CB' },
    { position: 'LWB', x: 10, y: 45, label: 'LWB' },
    { position: 'CM', x: 32, y: 42, label: 'CM' },
    { position: 'CM', x: 50, y: 40, label: 'CM' },
    { position: 'CM', x: 68, y: 42, label: 'CM' },
    { position: 'RWB', x: 90, y: 45, label: 'RWB' },
    { position: 'ST', x: 38, y: 75, label: 'ST' },
    { position: 'ST', x: 62, y: 75, label: 'ST' },
  ],
  '5-3-2': [
    { position: 'GK', x: 50, y: 5, label: 'GK' },
    { position: 'LWB', x: 10, y: 28, label: 'LWB' },
    { position: 'CB', x: 30, y: 20, label: 'CB' },
    { position: 'CB', x: 50, y: 18, label: 'CB' },
    { position: 'CB', x: 70, y: 20, label: 'CB' },
    { position: 'RWB', x: 90, y: 28, label: 'RWB' },
    { position: 'CM', x: 30, y: 48, label: 'CM' },
    { position: 'CM', x: 50, y: 45, label: 'CM' },
    { position: 'CM', x: 70, y: 48, label: 'CM' },
    { position: 'ST', x: 38, y: 75, label: 'ST' },
    { position: 'ST', x: 62, y: 75, label: 'ST' },
  ],
  '4-5-1': [
    { position: 'GK', x: 50, y: 5, label: 'GK' },
    { position: 'LB', x: 15, y: 25, label: 'LB' },
    { position: 'CB', x: 38, y: 20, label: 'CB' },
    { position: 'CB', x: 62, y: 20, label: 'CB' },
    { position: 'RB', x: 85, y: 25, label: 'RB' },
    { position: 'LM', x: 10, y: 50, label: 'LM' },
    { position: 'CM', x: 32, y: 45, label: 'CM' },
    { position: 'AM', x: 50, y: 55, label: 'AM' },
    { position: 'CM', x: 68, y: 45, label: 'CM' },
    { position: 'RM', x: 90, y: 50, label: 'RM' },
    { position: 'ST', x: 50, y: 80, label: 'ST' },
  ],
  '4-1-4-1': [
    { position: 'GK', x: 50, y: 5, label: 'GK' },
    { position: 'LB', x: 15, y: 25, label: 'LB' },
    { position: 'CB', x: 38, y: 20, label: 'CB' },
    { position: 'CB', x: 62, y: 20, label: 'CB' },
    { position: 'RB', x: 85, y: 25, label: 'RB' },
    { position: 'DM', x: 50, y: 38, label: 'DM' },
    { position: 'LM', x: 12, y: 55, label: 'LM' },
    { position: 'CM', x: 38, y: 52, label: 'CM' },
    { position: 'CM', x: 62, y: 52, label: 'CM' },
    { position: 'RM', x: 88, y: 55, label: 'RM' },
    { position: 'ST', x: 50, y: 80, label: 'ST' },
  ],
  '3-4-3': [
    { position: 'GK', x: 50, y: 5, label: 'GK' },
    { position: 'CB', x: 30, y: 20, label: 'CB' },
    { position: 'CB', x: 50, y: 18, label: 'CB' },
    { position: 'CB', x: 70, y: 20, label: 'CB' },
    { position: 'LM', x: 15, y: 45, label: 'LM' },
    { position: 'CM', x: 38, y: 42, label: 'CM' },
    { position: 'CM', x: 62, y: 42, label: 'CM' },
    { position: 'RM', x: 85, y: 45, label: 'RM' },
    { position: 'LW', x: 20, y: 75, label: 'LW' },
    { position: 'ST', x: 50, y: 80, label: 'ST' },
    { position: 'RW', x: 80, y: 75, label: 'RW' },
  ],
};

const AVAILABLE_FORMATIONS = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '5-3-2', '4-5-1', '4-1-4-1', '3-4-3'];

// Position compatibility mapping
const POSITION_COMPATIBILITY: Record<string, string[]> = {
  'GK': ['GK'],
  'LB': ['LB', 'LWB', 'CB'],
  'CB': ['CB', 'LB', 'RB'],
  'RB': ['RB', 'RWB', 'CB'],
  'LWB': ['LWB', 'LB', 'LM'],
  'RWB': ['RWB', 'RB', 'RM'],
  'DM': ['DM', 'CM', 'CB'],
  'CM': ['CM', 'DM', 'AM'],
  'LM': ['LM', 'LW', 'LWB'],
  'RM': ['RM', 'RW', 'RWB'],
  'AM': ['AM', 'CM', 'LW', 'RW'],
  'LW': ['LW', 'LM', 'ST'],
  'RW': ['RW', 'RM', 'ST'],
  'ST': ['ST', 'CF', 'LW', 'RW'],
  'CF': ['CF', 'ST', 'AM'],
};

export function PitchLineupSelector({
  team,
  formation,
  selectedLineup,
  onLineupChange,
  onFormationChange,
}: PitchLineupSelectorProps) {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [showFormationPicker, setShowFormationPicker] = useState(false);
  
  const pitchWidth = Math.min(SCREEN_WIDTH - 32, 300);
  const pitchHeight = pitchWidth * 1.2;
  
  const formationTemplate = FORMATION_TEMPLATES[formation] || FORMATION_TEMPLATES['4-4-2'];
  
  // Get available players (not in lineup)
  const availablePlayers = useMemo(() => {
    const selectedIds = new Set(selectedLineup.map(p => p?.id).filter(Boolean));
    return team.squad.filter(p => !selectedIds.has(p.id));
  }, [team.squad, selectedLineup]);
  
  // Get compatible players for a position
  const getCompatiblePlayers = (slotPosition: string) => {
    const compatiblePositions = POSITION_COMPATIBILITY[slotPosition] || [slotPosition];
    return availablePlayers
      .filter(p => compatiblePositions.includes(p.position))
      .sort((a, b) => (b.current_ability || 10) - (a.current_ability || 10));
  };
  
  // Handle slot click
  const handleSlotClick = (index: number) => {
    setSelectedSlotIndex(index);
  };
  
  // Handle player selection for a slot
  const handlePlayerSelect = (player: Player) => {
    if (selectedSlotIndex === null) return;
    
    const newLineup = [...selectedLineup];
    newLineup[selectedSlotIndex] = player;
    onLineupChange(newLineup);
    setSelectedSlotIndex(null);
  };
  
  // Handle clearing a slot
  const handleClearSlot = () => {
    if (selectedSlotIndex === null) return;
    
    const newLineup = [...selectedLineup];
    newLineup[selectedSlotIndex] = null as any;
    onLineupChange(newLineup);
    setSelectedSlotIndex(null);
  };
  
  // Auto-fill best lineup
  const handleAutoFill = () => {
    const newLineup: Player[] = [];
    const usedIds = new Set<string>();
    
    formationTemplate.forEach(slot => {
      const compatiblePositions = POSITION_COMPATIBILITY[slot.position] || [slot.position];
      const bestPlayer = team.squad
        .filter(p => compatiblePositions.includes(p.position) && !usedIds.has(p.id))
        .sort((a, b) => (b.current_ability || 10) - (a.current_ability || 10))[0];
      
      if (bestPlayer) {
        newLineup.push(bestPlayer);
        usedIds.add(bestPlayer.id);
      }
    });
    
    // Fill remaining slots with best available
    while (newLineup.length < 11) {
      const remaining = team.squad
        .filter(p => !usedIds.has(p.id))
        .sort((a, b) => (b.current_ability || 10) - (a.current_ability || 10))[0];
      if (remaining) {
        newLineup.push(remaining);
        usedIds.add(remaining.id);
      } else {
        break;
      }
    }
    
    onLineupChange(newLineup);
  };
  
  // Get rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 15) return '#00ff88';
    if (rating >= 12) return '#4a9eff';
    if (rating >= 9) return '#ffd700';
    return '#ff6b6b';
  };
  
  const selectedSlot = selectedSlotIndex !== null ? formationTemplate[selectedSlotIndex] : null;
  const compatiblePlayersForSlot = selectedSlot ? getCompatiblePlayers(selectedSlot.position) : [];
  
  return (
    <View style={styles.container}>
      {/* Formation Selector */}
      <View style={styles.formationBar}>
        <Text style={styles.formationLabel}>Formation:</Text>
        <TouchableOpacity
          style={styles.formationButton}
          onPress={() => setShowFormationPicker(true)}
        >
          <Text style={styles.formationButtonText}>{formation}</Text>
          <Ionicons name="chevron-down" size={16} color="#4a9eff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.autoFillButton} onPress={handleAutoFill}>
          <Ionicons name="flash" size={16} color="#0a1628" />
          <Text style={styles.autoFillText}>AUTO</Text>
        </TouchableOpacity>
      </View>
      
      {/* Pitch View */}
      <View style={[styles.pitch, { width: pitchWidth, height: pitchHeight }]}>
        {/* Pitch markings */}
        <View style={styles.centerCircle} />
        <View style={styles.centerLine} />
        <View style={styles.penaltyAreaTop} />
        <View style={styles.penaltyAreaBottom} />
        <View style={styles.goalAreaTop} />
        <View style={styles.goalAreaBottom} />
        
        {/* Player slots */}
        {formationTemplate.map((slot, index) => {
          const player = selectedLineup[index];
          const isSelected = selectedSlotIndex === index;
          const isEmpty = !player;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.playerSlot,
                {
                  left: `${slot.x - 8}%`,
                  top: `${100 - slot.y - 6}%`, // Invert Y so GK is at bottom
                },
                isSelected && styles.playerSlotSelected,
                isEmpty && styles.playerSlotEmpty,
              ]}
              onPress={() => handleSlotClick(index)}
            >
              {player ? (
                <>
                  <View style={[styles.playerBadge, { backgroundColor: getRatingColor(player.current_ability || 10) }]}>
                    <Text style={styles.playerRating}>{player.current_ability || 10}</Text>
                  </View>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {player.name.split(' ').pop()}
                  </Text>
                  <Text style={styles.playerPosition}>{player.position}</Text>
                </>
              ) : (
                <>
                  <View style={styles.emptyBadge}>
                    <Ionicons name="add" size={16} color="#4a6a8a" />
                  </View>
                  <Text style={styles.slotLabel}>{slot.label}</Text>
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Player Selection Modal */}
      <Modal
        visible={selectedSlotIndex !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSlotIndex(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.playerSelectModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {selectedSlot?.label || 'Player'}
              </Text>
              <TouchableOpacity onPress={() => setSelectedSlotIndex(null)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {selectedLineup[selectedSlotIndex!] && (
              <TouchableOpacity style={styles.clearButton} onPress={handleClearSlot}>
                <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
                <Text style={styles.clearButtonText}>Remove Player</Text>
              </TouchableOpacity>
            )}
            
            <ScrollView style={styles.playerList} showsVerticalScrollIndicator={false}>
              {compatiblePlayersForSlot.length === 0 ? (
                <Text style={styles.noPlayersText}>No compatible players available</Text>
              ) : (
                compatiblePlayersForSlot.map(player => (
                  <TouchableOpacity
                    key={player.id}
                    style={styles.playerOption}
                    onPress={() => handlePlayerSelect(player)}
                  >
                    <View style={styles.playerOptionLeft}>
                      <View style={[styles.positionBadge, { backgroundColor: '#1a3a5c' }]}>
                        <Text style={styles.positionText}>{player.position}</Text>
                      </View>
                      <View>
                        <Text style={styles.playerOptionName}>{player.name}</Text>
                        <Text style={styles.playerOptionMeta}>
                          {player.age}y • FIT {Math.round(player.fitness || 15)}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.abilityBadge, { backgroundColor: getRatingColor(player.current_ability || 10) }]}>
                      <Text style={styles.abilityText}>{player.current_ability || 10}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Formation Picker Modal */}
      <Modal
        visible={showFormationPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFormationPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFormationPicker(false)}
        >
          <View style={styles.formationPickerModal}>
            <Text style={styles.formationPickerTitle}>Select Formation</Text>
            {AVAILABLE_FORMATIONS.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.formationOption, f === formation && styles.formationOptionActive]}
                onPress={() => {
                  onFormationChange?.(f);
                  setShowFormationPicker(false);
                }}
              >
                <Text style={[styles.formationOptionText, f === formation && styles.formationOptionTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  formationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  formationLabel: {
    color: '#6a8aaa',
    fontSize: 12,
  },
  formationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a3a5c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  formationButtonText: {
    color: '#4a9eff',
    fontSize: 14,
    fontWeight: '700',
  },
  autoFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ff88',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  autoFillText: {
    color: '#0a1628',
    fontSize: 11,
    fontWeight: '700',
  },
  pitch: {
    backgroundColor: '#1a5c34',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    position: 'relative',
    overflow: 'hidden',
  },
  centerCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    top: '50%',
    left: '50%',
    marginLeft: -30,
    marginTop: -30,
  },
  centerLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    top: '50%',
  },
  penaltyAreaTop: {
    position: 'absolute',
    width: '55%',
    height: '18%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderTopWidth: 0,
    top: 0,
    left: '22.5%',
  },
  penaltyAreaBottom: {
    position: 'absolute',
    width: '55%',
    height: '18%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderBottomWidth: 0,
    bottom: 0,
    left: '22.5%',
  },
  goalAreaTop: {
    position: 'absolute',
    width: '30%',
    height: '8%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderTopWidth: 0,
    top: 0,
    left: '35%',
  },
  goalAreaBottom: {
    position: 'absolute',
    width: '30%',
    height: '8%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderBottomWidth: 0,
    bottom: 0,
    left: '35%',
  },
  playerSlot: {
    position: 'absolute',
    width: '16%',
    alignItems: 'center',
    padding: 4,
  },
  playerSlotSelected: {
    backgroundColor: 'rgba(0, 255, 136, 0.3)',
    borderRadius: 8,
  },
  playerSlotEmpty: {
    opacity: 0.8,
  },
  playerBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  playerRating: {
    color: '#0a1628',
    fontSize: 11,
    fontWeight: '800',
  },
  playerName: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  playerPosition: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 7,
    fontWeight: '600',
  },
  emptyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderStyle: 'dashed',
    marginBottom: 2,
  },
  slotLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  playerSelectModal: {
    backgroundColor: '#0d2137',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
    gap: 8,
  },
  clearButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600',
  },
  playerList: {
    paddingHorizontal: 16,
  },
  noPlayersText: {
    color: '#6a8aaa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  playerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  playerOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  positionBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionText: {
    color: '#4a9eff',
    fontSize: 10,
    fontWeight: '700',
  },
  playerOptionName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  playerOptionMeta: {
    color: '#6a8aaa',
    fontSize: 11,
    marginTop: 2,
  },
  abilityBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  abilityText: {
    color: '#0a1628',
    fontSize: 14,
    fontWeight: '800',
  },
  formationPickerModal: {
    backgroundColor: '#0d2137',
    margin: 40,
    borderRadius: 12,
    padding: 16,
  },
  formationPickerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  formationOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#1a3a5c',
  },
  formationOptionActive: {
    backgroundColor: '#00ff88',
  },
  formationOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  formationOptionTextActive: {
    color: '#0a1628',
  },
});
