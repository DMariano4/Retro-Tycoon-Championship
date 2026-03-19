import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../src/context/GameContext';

export default function SeasonEndScreen() {
  const router = useRouter();
  const { currentSave, getLeague, getManagedTeam } = useGame();
  const [showDetails, setShowDetails] = useState(false);

  const league = getLeague();
  const managedTeam = getManagedTeam();

  if (!currentSave || !league || !managedTeam) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No game data available</Text>
      </SafeAreaView>
    );
  }

  // Sort table by points, then goal difference
  const sortedTable = useMemo(() => {
    return [...league.table].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
      return b.goals_for - a.goals_for;
    });
  }, [league.table]);

  const champion = sortedTable[0];
  const managedPosition = sortedTable.findIndex(t => t.team_id === managedTeam.id) + 1;
  const managedStanding = sortedTable.find(t => t.team_id === managedTeam.id);
  const isChampion = champion?.team_id === managedTeam.id;

  // Top scorers from fixtures
  const topScorers = useMemo(() => {
    const scorerMap: Record<string, { name: string; team: string; goals: number }> = {};
    league.fixtures.filter(f => f.played).forEach(f => {
      const scorers = (f as any).scorers || [];
      scorers.forEach((s: any) => {
        const key = s.playerId || s.playerName;
        if (!scorerMap[key]) {
          const teamName = s.team === 'home' ? f.home_team_name : f.away_team_name;
          scorerMap[key] = { name: s.playerName, team: teamName, goals: 0 };
        }
        scorerMap[key].goals++;
      });
    });
    return Object.values(scorerMap).sort((a, b) => b.goals - a.goals).slice(0, 10);
  }, [league.fixtures]);

  const handleContinue = () => {
    router.push('/contracts');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Season Header */}
        <View style={styles.header}>
          <Text style={styles.seasonLabel}>SEASON {currentSave.season}/{currentSave.season + 1}</Text>
          <Text style={styles.leagueName}>{league.name}</Text>
          <Text style={styles.headerSubtitle}>FINAL STANDINGS</Text>
        </View>

        {/* Champion Banner */}
        <View style={[styles.championBanner, isChampion && styles.championBannerUser]}>
          <Ionicons name="trophy" size={32} color={isChampion ? '#FFD700' : '#00ff88'} />
          <Text style={styles.championText}>CHAMPION</Text>
          <Text style={styles.championName}>{champion?.team_name}</Text>
          <Text style={styles.championStats}>
            {champion?.won}W {champion?.drawn}D {champion?.lost}L · {champion?.points} pts
          </Text>
          {isChampion && (
            <Text style={styles.congratsText}>CONGRATULATIONS!</Text>
          )}
        </View>

        {/* Your Season Summary */}
        {!isChampion && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>YOUR SEASON</Text>
            <Text style={styles.teamName}>{managedTeam.name}</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{managedPosition}{managedPosition === 1 ? 'st' : managedPosition === 2 ? 'nd' : managedPosition === 3 ? 'rd' : 'th'}</Text>
                <Text style={styles.summaryLabel}>POSITION</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{managedStanding?.points}</Text>
                <Text style={styles.summaryLabel}>POINTS</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{managedStanding?.won}</Text>
                <Text style={styles.summaryLabel}>WON</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{managedStanding?.goals_for}</Text>
                <Text style={styles.summaryLabel}>GOALS</Text>
              </View>
            </View>
          </View>
        )}

        {/* Final Table */}
        <View style={styles.tableCard}>
          <TouchableOpacity onPress={() => setShowDetails(!showDetails)} style={styles.tableHeader}>
            <Text style={styles.tableTitle}>FINAL TABLE</Text>
            <Ionicons name={showDetails ? 'chevron-up' : 'chevron-down'} size={18} color="#6a8aaa" />
          </TouchableOpacity>

          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { width: 24 }]}>#</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>TEAM</Text>
            <Text style={[styles.tableHeaderCell, { width: 28 }]}>P</Text>
            <Text style={[styles.tableHeaderCell, { width: 28 }]}>W</Text>
            <Text style={[styles.tableHeaderCell, { width: 28 }]}>D</Text>
            <Text style={[styles.tableHeaderCell, { width: 28 }]}>L</Text>
            {showDetails && (
              <>
                <Text style={[styles.tableHeaderCell, { width: 32 }]}>GF</Text>
                <Text style={[styles.tableHeaderCell, { width: 32 }]}>GA</Text>
              </>
            )}
            <Text style={[styles.tableHeaderCell, { width: 32 }]}>GD</Text>
            <Text style={[styles.tableHeaderCell, { width: 36 }]}>PTS</Text>
          </View>

          {sortedTable.map((team, idx) => {
            const isManaged = team.team_id === managedTeam.id;
            const isTop = idx === 0;
            return (
              <View key={team.team_id} style={[
                styles.tableRow,
                isManaged && styles.tableRowManaged,
                isTop && styles.tableRowChampion,
              ]}>
                <Text style={[styles.tableCell, { width: 24, fontWeight: '700' }]}>{idx + 1}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>{team.team_name}</Text>
                <Text style={[styles.tableCell, { width: 28 }]}>{team.played}</Text>
                <Text style={[styles.tableCell, { width: 28 }]}>{team.won}</Text>
                <Text style={[styles.tableCell, { width: 28 }]}>{team.drawn}</Text>
                <Text style={[styles.tableCell, { width: 28 }]}>{team.lost}</Text>
                {showDetails && (
                  <>
                    <Text style={[styles.tableCell, { width: 32 }]}>{team.goals_for}</Text>
                    <Text style={[styles.tableCell, { width: 32 }]}>{team.goals_against}</Text>
                  </>
                )}
                <Text style={[styles.tableCell, { width: 32, color: team.goal_difference >= 0 ? '#00ff88' : '#ff6b6b' }]}>
                  {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
                </Text>
                <Text style={[styles.tableCell, { width: 36, fontWeight: '800', color: '#00ff88' }]}>{team.points}</Text>
              </View>
            );
          })}
        </View>

        {/* Top Scorers */}
        {topScorers.length > 0 && (
          <View style={styles.scorersCard}>
            <Text style={styles.tableTitle}>TOP SCORERS</Text>
            {topScorers.map((scorer, idx) => (
              <View key={idx} style={styles.scorerRow}>
                <Text style={styles.scorerRank}>{idx + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scorerName}>{scorer.name}</Text>
                  <Text style={styles.scorerTeam}>{scorer.team}</Text>
                </View>
                <Text style={styles.scorerGoals}>{scorer.goals}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>CONTINUE TO OFF-SEASON</Text>
          <Ionicons name="arrow-forward" size={20} color="#0a1628" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  errorText: { color: '#ff6b6b', fontSize: 16, textAlign: 'center', marginTop: 40 },
  header: { alignItems: 'center', marginBottom: 20, paddingTop: 12 },
  seasonLabel: { fontSize: 14, color: '#6a8aaa', letterSpacing: 2, fontWeight: '600' },
  leagueName: { fontSize: 24, fontWeight: '800', color: '#d0e8ff', marginTop: 4 },
  headerSubtitle: { fontSize: 12, color: '#00ff88', letterSpacing: 3, marginTop: 4, fontWeight: '700' },
  championBanner: {
    backgroundColor: '#0d2137', borderWidth: 2, borderColor: '#00ff88', borderRadius: 12,
    padding: 20, alignItems: 'center', marginBottom: 16,
  },
  championBannerUser: { borderColor: '#FFD700', backgroundColor: '#1a2a0a' },
  championText: { fontSize: 13, color: '#00ff88', letterSpacing: 3, fontWeight: '800', marginTop: 8 },
  championName: { fontSize: 22, fontWeight: '800', color: '#d0e8ff', marginTop: 4 },
  championStats: { fontSize: 13, color: '#8ab4d8', marginTop: 4 },
  congratsText: { fontSize: 16, color: '#FFD700', fontWeight: '800', letterSpacing: 2, marginTop: 12 },
  summaryCard: {
    backgroundColor: '#0d2137', borderRadius: 10, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#1a3a5c',
  },
  summaryTitle: { fontSize: 12, color: '#6a8aaa', letterSpacing: 2, fontWeight: '700', marginBottom: 4 },
  teamName: { fontSize: 18, fontWeight: '800', color: '#d0e8ff', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '800', color: '#00ff88' },
  summaryLabel: { fontSize: 10, color: '#6a8aaa', letterSpacing: 1, fontWeight: '700', marginTop: 2 },
  tableCard: {
    backgroundColor: '#0d2137', borderRadius: 10, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#1a3a5c',
  },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tableTitle: { fontSize: 13, color: '#00ff88', letterSpacing: 2, fontWeight: '700' },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1a3a5c' },
  tableHeaderCell: { fontSize: 10, color: '#6a8aaa', fontWeight: '700', textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#0a162810' },
  tableRowManaged: { backgroundColor: '#1a3a5c40' },
  tableRowChampion: { backgroundColor: '#00ff8810' },
  tableCell: { fontSize: 11, color: '#d0e8ff', textAlign: 'center' },
  scorersCard: {
    backgroundColor: '#0d2137', borderRadius: 10, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#1a3a5c',
  },
  scorerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#0a162810' },
  scorerRank: { fontSize: 12, fontWeight: '700', color: '#6a8aaa', width: 24, textAlign: 'center' },
  scorerName: { fontSize: 13, fontWeight: '600', color: '#d0e8ff' },
  scorerTeam: { fontSize: 10, color: '#6a8aaa' },
  scorerGoals: { fontSize: 16, fontWeight: '800', color: '#00ff88', width: 36, textAlign: 'center' },
  continueButton: {
    backgroundColor: '#00ff88', borderRadius: 10, padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
  },
  continueButtonText: { fontSize: 16, fontWeight: '800', color: '#0a1628', letterSpacing: 1 },
});
