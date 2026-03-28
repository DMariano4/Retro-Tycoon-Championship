import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { matchStyles as styles } from './matchStyles';
import { Player } from '../../context/GameContext';

interface SubstitutionModalProps {
  visible: boolean;
  currentSquad: Player[];
  benchPlayers: Player[];
  substitutions: { out: string; in: string }[];
  selectedPlayerOut: string | null;
  onClose: () => void;
  onSelectPlayerOut: (playerId: string) => void;
  onMakeSubstitution: (playerId: string) => void;
}

export function SubstitutionModal({
  visible,
  currentSquad,
  benchPlayers,
  substitutions,
  selectedPlayerOut,
  onClose,
  onSelectPlayerOut,
  onMakeSubstitution,
}: SubstitutionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>SUBSTITUTIONS</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6a8aaa" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSectionTitle}>
            {substitutions.length}/3 substitutions made
          </Text>
          
          <ScrollView style={styles.subsList} showsVerticalScrollIndicator={false}>
            <Text style={styles.subsListTitle}>ON PITCH</Text>
            {currentSquad.map(player => (
              <TouchableOpacity 
                key={player.id} 
                style={[
                  styles.subPlayerRow,
                  selectedPlayerOut === player.id && styles.subPlayerRowSelected
                ]}
                onPress={() => onSelectPlayerOut(player.id)}
              >
                <View style={styles.subPlayerInfo}>
                  <Text style={styles.subPlayerPosition}>{player.position}</Text>
                  <Text style={styles.subPlayerName}>{player.name}</Text>
                  <Text style={styles.subPlayerAbility}>{player.current_ability}</Text>
                </View>
                {selectedPlayerOut === player.id && (
                  <Ionicons name="checkmark-circle" size={20} color="#ff6b6b" />
                )}
              </TouchableOpacity>
            ))}
            
            <Text style={[styles.subsListTitle, { marginTop: 16 }]}>BENCH</Text>
            {benchPlayers.map(player => (
              <TouchableOpacity 
                key={player.id} 
                style={styles.subPlayerRow}
                onPress={() => onMakeSubstitution(player.id)}
                disabled={!selectedPlayerOut}
              >
                <View style={styles.subPlayerInfo}>
                  <Text style={styles.subPlayerPosition}>{player.position}</Text>
                  <Text style={styles.subPlayerName}>{player.name}</Text>
                  <View style={styles.subAbility}>
                    <Text style={styles.subAbilityText}>{player.current_ability}</Text>
                  </View>
                </View>
                {selectedPlayerOut && (
                  <Ionicons name="arrow-up-circle" size={20} color="#00ff88" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.subsNote}>
            {selectedPlayerOut 
              ? 'Tap a bench player to bring them on'
              : 'Tap a player on the pitch to substitute them off'}
          </Text>

          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={onClose}
          >
            <Text style={styles.modalCloseButtonText}>DONE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
