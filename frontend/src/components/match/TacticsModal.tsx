import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { matchStyles as styles } from './matchStyles';

const FORMATIONS = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '5-3-2', '4-5-1', '4-1-4-1', '3-4-3'];

interface TacticsModalProps {
  visible: boolean;
  selectedFormation: string;
  onClose: () => void;
  onFormationChange: (formation: string) => void;
}

export function TacticsModal({ visible, selectedFormation, onClose, onFormationChange }: TacticsModalProps) {
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
            <Text style={styles.modalTitle}>TACTICS</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6a8aaa" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSectionTitle}>Formation</Text>
          <View style={styles.formationGrid}>
            {FORMATIONS.map(formation => (
              <TouchableOpacity
                key={formation}
                style={[
                  styles.formationOption,
                  selectedFormation === formation && styles.formationOptionActive
                ]}
                onPress={() => onFormationChange(formation)}
              >
                <Text style={[
                  styles.formationOptionText,
                  selectedFormation === formation && styles.formationOptionTextActive
                ]}>
                  {formation}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={onClose}
          >
            <Text style={styles.modalCloseButtonText}>APPLY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
