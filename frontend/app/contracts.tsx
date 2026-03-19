import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame, Player } from '../src/context/GameContext';

export default function ContractsScreen() {
  const router = useRouter();
  const { currentSave, getManagedTeam, getExpiringContracts, getRetirementCandidates,
    renewContract, releasePlayer, retirePlayer, applyAgeProgression, startNewSeason } = useGame();

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showNegotiation, setShowNegotiation] = useState(false);
  const [wageOffer, setWageOffer] = useState(0);
  const [yearsOffer, setYearsOffer] = useState(2);
  const [processedPlayers, setProcessedPlayers] = useState<Set<string>>(new Set());
  const [showRetirements, setShowRetirements] = useState(true);

  const managedTeam = getManagedTeam();
  const expiringContracts = getExpiringContracts();
  const { userChoice: retirementCandidates } = getRetirementCandidates();

  const unprocessedExpiring = expiringContracts.filter(p => !processedPlayers.has(p.id));
  const unprocessedRetirements = retirementCandidates.filter(p => !processedPlayers.has(p.id) && !expiringContracts.find(e => e.id === p.id));

  const handleOpenNegotiation = (player: Player) => {
    setSelectedPlayer(player);
    setWageOffer(Math.round(player.wage * 1.15)); // Suggest 15% raise
    setYearsOffer(2);
    setShowNegotiation(true);
  };

  const handleRenew = () => {
    if (!selectedPlayer) return;
    renewContract(selectedPlayer.id, wageOffer, yearsOffer);
    setProcessedPlayers(new Set([...processedPlayers, selectedPlayer.id]));
    setShowNegotiation(false);
    setSelectedPlayer(null);
  };

  const handleRelease = (player: Player) => {
    Alert.alert(
      'Release Player',
      `Release ${player.name} as a free agent? They will be available for other teams to sign.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release', style: 'destructive',
          onPress: () => {
            releasePlayer(player.id);
            setProcessedPlayers(new Set([...processedPlayers, player.id]));
          }
        }
      ]
    );
  };

  const handleRetire = (player: Player) => {
    Alert.alert(
      'Retire Player',
      `Retire ${player.name}? A young replacement will be generated for the squad.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retire', style: 'destructive',
          onPress: () => {
            retirePlayer(player.id);
            setProcessedPlayers(new Set([...processedPlayers, player.id]));
          }
        }
      ]
    );
  };

  const handleKeep = (player: Player) => {
    // Just mark as processed — player stays as is
    setProcessedPlayers(new Set([...processedPlayers, player.id]));
  };

  const handleContinueToNewSeason = () => {
    // Apply age progression, then start new season
    applyAgeProgression();
    startNewSeason();
    router.replace('/game');
  };

  const allProcessed = unprocessedExpiring.length === 0 && unprocessedRetirements.length === 0;

  const renderPlayerCard = (player: Player, type: 'expiring' | 'retirement') => {
    const isProcessed = processedPlayers.has(player.id);
    return (
      <View key={player.id} style={[styles.playerCard, isProcessed && styles.playerCardProcessed]}>
        <View style={styles.playerInfo}>
          <View style={styles.playerHeader}>
            <View style={styles.positionBadge}>
              <Text style={styles.positionText}>{player.position}</Text>
            </View>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerAge}>Age {player.age}</Text>
          </View>
          <View style={styles.playerStats}>
            <Text style={styles.statText}>Ability: {typeof player.current_ability === 'number' ? player.current_ability.toFixed(0) : player.current_ability}</Text>
            <Text style={styles.statText}>Wage: £{(player.wage / 1000).toFixed(0)}k/w</Text>
            <Text style={styles.statText}>Contract: {player.contract_end}</Text>
          </View>
        </View>
        {!isProcessed && (
          <View style={styles.actionButtons}>
            {type === 'expiring' && (
              <>
                <TouchableOpacity style={styles.renewButton} onPress={() => handleOpenNegotiation(player)}>
                  <Text style={styles.renewButtonText}>RENEW</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.releaseButton} onPress={() => handleRelease(player)}>
                  <Text style={styles.releaseButtonText}>RELEASE</Text>
                </TouchableOpacity>
              </>
            )}
            {type === 'retirement' && (
              <>
                <TouchableOpacity style={styles.keepButton} onPress={() => handleKeep(player)}>
                  <Text style={styles.keepButtonText}>KEEP</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.renewButton} onPress={() => handleOpenNegotiation(player)}>
                  <Text style={styles.renewButtonText}>RENEW</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.retireButton} onPress={() => handleRetire(player)}>
                  <Text style={styles.retireButtonText}>RETIRE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.releaseButton} onPress={() => handleRelease(player)}>
                  <Text style={styles.releaseButtonText}>FREE</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
        {isProcessed && (
          <View style={styles.processedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#00ff88" />
            <Text style={styles.processedText}>Done</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="document-text" size={28} color="#00ff88" />
          <Text style={styles.title}>CONTRACT MANAGEMENT</Text>
          <Text style={styles.subtitle}>{managedTeam?.name} · Off-Season {currentSave?.season}/{(currentSave?.season || 0) + 1}</Text>
        </View>

        {/* Expiring Contracts Section */}
        {expiringContracts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={18} color="#ff9f43" />
              <Text style={styles.sectionTitle}>EXPIRING CONTRACTS ({unprocessedExpiring.length} remaining)</Text>
            </View>
            <Text style={styles.sectionDescription}>
              These players' contracts expire this summer. Renew or release them.
            </Text>
            {expiringContracts.map(p => renderPlayerCard(p, 'expiring'))}
          </View>
        )}

        {/* Retirement Decisions Section */}
        {retirementCandidates.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={18} color="#ff6b6b" />
              <Text style={styles.sectionTitle}>VETERAN PLAYERS ({unprocessedRetirements.length} remaining)</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Players aged 35+. Keep them, offer a new contract, retire them, or release as free agents.
            </Text>
            {retirementCandidates.filter(p => !expiringContracts.find(e => e.id === p.id)).map(p => renderPlayerCard(p, 'retirement'))}
          </View>
        )}

        {/* No Actions Needed */}
        {expiringContracts.length === 0 && retirementCandidates.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle" size={40} color="#00ff88" />
            <Text style={styles.emptyText}>No contract decisions needed!</Text>
            <Text style={styles.emptySubtext}>All players are under contract for next season.</Text>
          </View>
        )}

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, !allProcessed && unprocessedExpiring.length > 0 && styles.continueButtonDisabled]}
          onPress={handleContinueToNewSeason}
        >
          <Text style={styles.continueButtonText}>
            {allProcessed || (unprocessedExpiring.length === 0 && unprocessedRetirements.length === 0)
              ? 'START NEW SEASON'
              : `CONTINUE (${unprocessedExpiring.length + unprocessedRetirements.length} unresolved)`}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#0a1628" />
        </TouchableOpacity>

      </ScrollView>

      {/* Contract Negotiation Modal */}
      <Modal visible={showNegotiation} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>CONTRACT NEGOTIATION</Text>
            {selectedPlayer && (
              <>
                <Text style={styles.modalPlayerName}>{selectedPlayer.name}</Text>
                <Text style={styles.modalPlayerInfo}>
                  {selectedPlayer.position} · Age {selectedPlayer.age} · Ability {typeof selectedPlayer.current_ability === 'number' ? selectedPlayer.current_ability.toFixed(0) : selectedPlayer.current_ability}
                </Text>
                <Text style={styles.modalCurrentWage}>
                  Current wage: £{(selectedPlayer.wage / 1000).toFixed(0)}k/week
                </Text>

                {/* Wage Offer */}
                <Text style={styles.modalLabel}>WEEKLY WAGE OFFER</Text>
                <View style={styles.offerRow}>
                  <TouchableOpacity style={styles.offerButton} onPress={() => setWageOffer(Math.max(1000, wageOffer - 5000))}>
                    <Ionicons name="remove" size={20} color="#ff6b6b" />
                  </TouchableOpacity>
                  <Text style={styles.offerValue}>£{(wageOffer / 1000).toFixed(0)}k</Text>
                  <TouchableOpacity style={styles.offerButton} onPress={() => setWageOffer(wageOffer + 5000)}>
                    <Ionicons name="add" size={20} color="#00ff88" />
                  </TouchableOpacity>
                </View>

                {/* Years */}
                <Text style={styles.modalLabel}>CONTRACT LENGTH</Text>
                <View style={styles.yearsRow}>
                  {[1, 2, 3, 4, 5].map(y => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.yearButton, yearsOffer === y && styles.yearButtonActive]}
                      onPress={() => setYearsOffer(y)}
                    >
                      <Text style={[styles.yearText, yearsOffer === y && styles.yearTextActive]}>{y}yr</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Actions */}
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowNegotiation(false)}>
                    <Text style={styles.modalCancelText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalConfirmButton} onPress={handleRenew}>
                    <Text style={styles.modalConfirmText}>CONFIRM RENEWAL</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 20, paddingTop: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#d0e8ff', letterSpacing: 1, marginTop: 8 },
  subtitle: { fontSize: 13, color: '#6a8aaa', marginTop: 4 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#d0e8ff', letterSpacing: 1 },
  sectionDescription: { fontSize: 11, color: '#6a8aaa', marginBottom: 12 },
  playerCard: {
    backgroundColor: '#0d2137', borderRadius: 10, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#1a3a5c',
  },
  playerCardProcessed: { opacity: 0.5 },
  playerInfo: { marginBottom: 8 },
  playerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  positionBadge: { backgroundColor: '#1a3a5c', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  positionText: { fontSize: 10, fontWeight: '800', color: '#00ff88' },
  playerName: { fontSize: 15, fontWeight: '700', color: '#d0e8ff', flex: 1 },
  playerAge: { fontSize: 12, color: '#6a8aaa', fontWeight: '600' },
  playerStats: { flexDirection: 'row', gap: 16, marginTop: 6 },
  statText: { fontSize: 11, color: '#8ab4d8' },
  actionButtons: { flexDirection: 'row', gap: 8 },
  renewButton: { backgroundColor: '#00ff88', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 8 },
  renewButtonText: { fontSize: 12, fontWeight: '800', color: '#0a1628' },
  releaseButton: { backgroundColor: '#ff6b6b20', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#ff6b6b' },
  releaseButtonText: { fontSize: 12, fontWeight: '700', color: '#ff6b6b' },
  retireButton: { backgroundColor: '#ff9f4320', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#ff9f43' },
  retireButtonText: { fontSize: 12, fontWeight: '700', color: '#ff9f43' },
  keepButton: { backgroundColor: '#4a9eff20', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#4a9eff' },
  keepButtonText: { fontSize: 12, fontWeight: '700', color: '#4a9eff' },
  processedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  processedText: { fontSize: 12, color: '#00ff88', fontWeight: '600' },
  emptyCard: {
    backgroundColor: '#0d2137', borderRadius: 10, padding: 32, alignItems: 'center',
    borderWidth: 1, borderColor: '#1a3a5c', marginBottom: 20,
  },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#d0e8ff', marginTop: 12 },
  emptySubtext: { fontSize: 12, color: '#6a8aaa', marginTop: 4 },
  continueButton: {
    backgroundColor: '#00ff88', borderRadius: 10, padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
  },
  continueButtonDisabled: { backgroundColor: '#00ff8880' },
  continueButtonText: { fontSize: 16, fontWeight: '800', color: '#0a1628', letterSpacing: 1 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5,10,20,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    backgroundColor: '#0d2137', borderRadius: 12, padding: 20, width: '85%', maxWidth: 380,
    borderWidth: 2, borderColor: '#00ff88',
  },
  modalTitle: { fontSize: 14, fontWeight: '800', color: '#00ff88', letterSpacing: 2, textAlign: 'center' },
  modalPlayerName: { fontSize: 20, fontWeight: '800', color: '#d0e8ff', textAlign: 'center', marginTop: 12 },
  modalPlayerInfo: { fontSize: 12, color: '#8ab4d8', textAlign: 'center', marginTop: 4 },
  modalCurrentWage: { fontSize: 12, color: '#6a8aaa', textAlign: 'center', marginTop: 2, marginBottom: 16 },
  modalLabel: { fontSize: 11, fontWeight: '700', color: '#6a8aaa', letterSpacing: 1, marginBottom: 8 },
  offerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20 },
  offerButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a3a5c',
    alignItems: 'center', justifyContent: 'center',
  },
  offerValue: { fontSize: 24, fontWeight: '800', color: '#d0e8ff', minWidth: 80, textAlign: 'center' },
  yearsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  yearButton: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6,
    backgroundColor: '#1a3a5c', borderWidth: 1, borderColor: '#1a3a5c',
  },
  yearButtonActive: { backgroundColor: '#00ff8830', borderColor: '#00ff88' },
  yearText: { fontSize: 12, fontWeight: '700', color: '#6a8aaa' },
  yearTextActive: { color: '#00ff88' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelButton: {
    flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#6a8aaa',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 13, fontWeight: '700', color: '#6a8aaa' },
  modalConfirmButton: {
    flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#00ff88',
    alignItems: 'center',
  },
  modalConfirmText: { fontSize: 13, fontWeight: '800', color: '#0a1628' },
});
