import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatValue } from '../../utils/formatters';
import { gameStyles as styles } from './gameStyles';

export function DashboardTab({ team, league, save, fixture, position, onNextWeek }: any) {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{position}{position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'}</Text>
          <Text style={styles.statLabel}>Position</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatValue(save?.budget || 0)}</Text>
          <Text style={styles.statLabel}>Budget</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{team?.squad?.length || 0}</Text>
          <Text style={styles.statLabel}>Squad Size</Text>
        </View>
      </View>

      {/* Next Match */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NEXT MATCH</Text>
        {fixture ? (
          <View style={styles.matchCard}>
            <View style={styles.matchTeams}>
              <Text style={[styles.matchTeam, fixture.home_team_id === team?.id && styles.matchTeamHighlight]}>
                {fixture.home_team_name}
              </Text>
              <Text style={styles.matchVs}>vs</Text>
              <Text style={[styles.matchTeam, fixture.away_team_id === team?.id && styles.matchTeamHighlight]}>
                {fixture.away_team_name}
              </Text>
            </View>
            <Text style={styles.matchWeek}>
              {fixture.match_type === 'friendly' ? 'PRE-SEASON FRIENDLY' : `Week ${fixture.week}`}
            </Text>
            <TouchableOpacity style={styles.playButton} onPress={onNextWeek}>
              <Ionicons name="play" size={16} color="#0a1628" />
              <Text style={styles.playButtonText}>PLAY MATCH</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.matchCard}>
            <Text style={styles.noMatchText}>No upcoming matches</Text>
          </View>
        )}
      </View>

      {/* League Standing Preview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>LEAGUE STANDING</Text>
        <View style={styles.tablePreview}>
          {league?.table.slice(0, 5).map((standing: any, index: number) => (
            <View 
              key={standing.team_id} 
              style={[
                styles.tableRow,
                standing.team_id === team?.id && styles.tableRowHighlight
              ]}
            >
              <Text style={styles.tablePos}>{index + 1}</Text>
              <Text style={styles.tableTeam}>{standing.team_name}</Text>
              <Text style={styles.tablePts}>{standing.points}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
