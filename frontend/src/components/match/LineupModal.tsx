import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Pressable, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { matchStyles as styles } from './matchStyles';
import { Player } from '../../context/GameContext';

interface LineupModalProps {
  visible: boolean;
  currentSquad: Player[];
  benchPlayers: Player[];
  selectedForSwap: string | null;
  swapMode: 'starting' | 'bench' | null;
  onClose: () => void;
  onPlayerSelect: (playerId: string, isStarting: boolean) => void;
  onConfirmLineup: () => void;
}

export function LineupModal({
  visible,
  currentSquad,
  benchPlayers,
  selectedForSwap,
  swapMode,
  onClose,
  onPlayerSelect,
  onConfirmLineup,
}: LineupModalProps) {
  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>SELECT LINEUP</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#6a8aaa" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSectionTitle}>
            Starting XI: {currentSquad.length}/11 | Bench: {benchPlayers.length}
          </Text>
          
          {selectedForSwap && (
            <View style={styles.swapIndicator}>
              <Ionicons name="swap-horizontal" size={16} color="#00ff88" />
              <Text style={styles.swapIndicatorText}>
                Tap another player to swap
              </Text>
            </View>
          )}
          
          <ScrollView style={styles.subsList} showsVerticalScrollIndicator={false}>
            <Text style={styles.subsListTitle}>STARTING XI</Text>
            {currentSquad.map((player, index) => (
              <TouchableOpacity 
                key={player.id} 
                style={[
                  styles.subPlayerRow,
                  selectedForSwap === player.id && styles.subPlayerRowSelected
                ]}
                onPress={() => onPlayerSelect(player.id, true)}
              >
                <View style={styles.lineupNumber}>
                  <Text style={styles.lineupNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.subPlayerInfo}>
                  <Text style={[
                    styles.subPlayerPosition,
                    selectedForSwap === player.id && { color: '#00ff88' }
                  ]}>{player.position}</Text>
                  <Text style={[
                    styles.subPlayerName,
                    selectedForSwap === player.id && { color: '#00ff88' }
                  ]}>{player.name}</Text>
                  <View style={[
                    styles.subAbility,
                    selectedForSwap === player.id && { backgroundColor: '#00ff8840' }
                  ]}>
                    <Text style={styles.subAbilityText}>{player.current_ability}</Text>
                  </View>
                </View>
                {selectedForSwap === player.id ? (
                  <Ionicons name="checkmark-circle" size={20} color="#00ff88" />
                ) : selectedForSwap ? (
                  <Ionicons name="swap-horizontal" size={20} color="#4a9eff" />
                ) : (
                  <Ionicons name="ellipsis-horizontal" size={20} color="#6a8aaa" />
                )}
              </TouchableOpacity>
            ))}
            
            <Text style={[styles.subsListTitle, { marginTop: 16 }]}>BENCH</Text>
            {benchPlayers.map(player => {
              const isInjured = player.injury && player.injury.recoveryWeeks > 0;
              return (
              <TouchableOpacity 
                key={player.id} 
                style={[
                  styles.subPlayerRow,
                  selectedForSwap === player.id && styles.subPlayerRowSelected,
                  isInjured && { opacity: 0.5, borderLeftWidth: 3, borderLeftColor: '#ff3b30' }
                ]}
                onPress={() => {
                  if (isInjured) {
                    Alert.alert('Player Injured', `${player.name} is injured (${player.injury?.type}) and unavailable for ${player.injury?.recoveryWeeks} week(s).`);
                    return;
                  }
                  onPlayerSelect(player.id, false);
                }}
              >
                <View style={styles.subPlayerInfo}>
                  <Text style={[
                    styles.subPlayerPosition,
                    selectedForSwap === player.id && { color: '#00ff88' },
                    isInjured && { color: '#ff6b6b' }
                  ]}>{player.position}</Text>
                  <Text style={[
                    styles.subPlayerName,
                    selectedForSwap === player.id && { color: '#00ff88' },
                    isInjured && { color: '#ff6b6b' }
                  ]}>{player.name}</Text>
                  {isInjured && (
                    <Ionicons name="medkit" size={12} color="#ff3b30" style={{ marginLeft: 4, marginRight: 2 }} />
                  )}
                  <View style={[
                    styles.subAbility,
                    selectedForSwap === player.id && { backgroundColor: '#00ff8840' },
                    isInjured && { backgroundColor: 'rgba(255, 59, 48, 0.2)' }
                  ]}>
                    <Text style={[styles.subAbilityText, isInjured && { color: '#ff6b6b' }]}>
                      {isInjured ? 'INJ' : player.current_ability}
                    </Text>
                  </View>
                </View>
                {isInjured ? (
                  <Text style={{ color: '#ff6b6b', fontSize: 10 }}>{player.injury?.recoveryWeeks}w</Text>
                ) : selectedForSwap === player.id ? (
                  <Ionicons name="checkmark-circle" size={20} color="#00ff88" />
                ) : selectedForSwap && swapMode === 'starting' ? (
                  <Ionicons name="arrow-up-circle" size={20} color="#00ff88" />
                ) : (
                  <Ionicons name="ellipsis-horizontal" size={20} color="#6a8aaa" />
                )}
              </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.subsNote}>
            {selectedForSwap 
              ? 'Tap another player to swap (any player can play any position)'
              : 'Tap a player to select, then tap another to swap'}
          </Text>

          <Pressable 
            style={styles.modalCloseButton}
            onPress={onConfirmLineup}
            {...(Platform.OS === 'web' ? { onClick: onConfirmLineup } : {})}
            accessibilityRole="button"
          >
            <Text style={styles.modalCloseButtonText}>CONFIRM LINEUP</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
