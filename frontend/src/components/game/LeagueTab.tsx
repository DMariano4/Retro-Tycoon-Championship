import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { gameStyles as styles } from './gameStyles';
import { TeamProfileModal } from '../shared/TeamProfileModal';
import { Team, useGame } from '../../context/GameContext';

export function LeagueTab({ league, teamId }: any) {
  const { currentSave } = useGame();
  const [view, setView] = useState<'table' | 'fixtures'>('table');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);

  if (!league) return null;

  // Find team by ID
  const findTeam = (id: string): Team | undefined => {
    return currentSave?.teams.find(t => t.id === id);
  };

  // Handle team press
  const handleTeamPress = (teamIdToOpen: string) => {
    const team = findTeam(teamIdToOpen);
    if (team) {
      setSelectedTeam(team);
      setShowTeamModal(true);
    }
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.leagueToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, view === 'table' && styles.toggleButtonActive]}
          onPress={() => setView('table')}
        >
          <Text style={[styles.toggleText, view === 'table' && styles.toggleTextActive]}>TABLE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, view === 'fixtures' && styles.toggleButtonActive]}
          onPress={() => setView('fixtures')}
        >
          <Text style={[styles.toggleText, view === 'fixtures' && styles.toggleTextActive]}>FIXTURES</Text>
        </TouchableOpacity>
      </View>

      {view === 'table' ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.fullTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.tablePosCol]}>#</Text>
              <Text style={[styles.tableHeaderText, styles.tableTeamCol]}>Team</Text>
              <Text style={styles.tableHeaderText}>P</Text>
              <Text style={styles.tableHeaderText}>W</Text>
              <Text style={styles.tableHeaderText}>D</Text>
              <Text style={styles.tableHeaderText}>L</Text>
              <Text style={styles.tableHeaderText}>GD</Text>
              <Text style={[styles.tableHeaderText, styles.tablePtsCol]}>Pts</Text>
            </View>
            {league.table.map((standing: any, index: number) => (
              <TouchableOpacity 
                key={standing.team_id}
                style={[
                  styles.tableDataRow,
                  standing.team_id === teamId && styles.tableRowHighlight
                ]}
                onPress={() => handleTeamPress(standing.team_id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tableData, styles.tablePosCol]}>{index + 1}</Text>
                <Text style={[styles.tableData, styles.tableTeamCol, { color: '#4a9eff' }]} numberOfLines={1}>
                  {standing.team_name}
                </Text>
                <Text style={styles.tableData}>{standing.played}</Text>
                <Text style={styles.tableData}>{standing.won}</Text>
                <Text style={styles.tableData}>{standing.drawn}</Text>
                <Text style={styles.tableData}>{standing.lost}</Text>
                <Text style={styles.tableData}>{standing.goal_difference}</Text>
                <Text style={[styles.tableData, styles.tablePtsCol]}>{standing.points}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Hint text */}
          <Text style={{ color: '#4a6a8a', fontSize: 11, textAlign: 'center', marginTop: 12, fontStyle: 'italic' }}>
            Tap any team to view squad & make transfers
          </Text>
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {Array.from({ length: 38 }, (_, i) => i + 1).map(week => {
            const weekFixtures = league.fixtures.filter((f: any) => f.week === week);
            if (weekFixtures.length === 0) return null;
            
            return (
              <View key={week} style={styles.weekSection}>
                <Text style={styles.weekTitle}>Week {week}</Text>
                {weekFixtures.map((fixture: any) => (
                  <View 
                    key={fixture.id} 
                    style={[
                      styles.fixtureRow,
                      (fixture.home_team_id === teamId || fixture.away_team_id === teamId) && styles.fixtureRowHighlight
                    ]}
                  >
                    <TouchableOpacity 
                      style={styles.fixtureTeamButton}
                      onPress={() => handleTeamPress(fixture.home_team_id)}
                    >
                      <Text style={[styles.fixtureTeam, { color: '#4a9eff' }]}>{fixture.home_team_name}</Text>
                    </TouchableOpacity>
                    <View style={styles.fixtureScore}>
                      {fixture.played ? (
                        <Text style={styles.fixtureScoreText}>
                          {fixture.home_score} - {fixture.away_score}
                        </Text>
                      ) : (
                        <Text style={styles.fixtureScoreText}>vs</Text>
                      )}
                    </View>
                    <TouchableOpacity 
                      style={styles.fixtureTeamButton}
                      onPress={() => handleTeamPress(fixture.away_team_id)}
                    >
                      <Text style={[styles.fixtureTeam, { color: '#4a9eff' }]}>{fixture.away_team_name}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Team Profile Modal */}
      <TeamProfileModal
        visible={showTeamModal}
        team={selectedTeam}
        onClose={() => {
          setShowTeamModal(false);
          setSelectedTeam(null);
        }}
      />
    </View>
  );
}
