import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatValue } from '../../utils/formatters';
import { gameStyles as styles } from './gameStyles';
import { GameEvent, formatDateDisplay } from '../../utils/calendar';
import { getCompetitionIcon, getCompetitionColor } from '../../utils/competitions';

interface DashboardTabProps {
  team: any;
  league: any;
  save: any;
  fixture: any;
  position: number;
  onNextWeek: () => void;
  // New event-based props
  upcomingEvents?: GameEvent[];
  currentDate?: string;
  onPlayEvent?: (event: GameEvent) => void;
}

export function DashboardTab({ 
  team, 
  league, 
  save, 
  fixture, 
  position, 
  onNextWeek,
  upcomingEvents = [],
  currentDate,
  onPlayEvent,
}: DashboardTabProps) {
  const currency = save?.currency_symbol || '£';
  const hasEventSystem = upcomingEvents && upcomingEvents.length > 0;
  
  // Get the next event (first uncompleted)
  const nextEvent = upcomingEvents.find(e => !e.completed);
  
  const renderEventCard = (event: GameEvent, isNext: boolean = false) => {
    const icon = getCompetitionIcon(event.competition || 'league');
    const color = getCompetitionColor(event.competition || 'league');
    const isMatch = event.type === 'match';
    const isCupDraw = event.type === 'cup_draw';
    
    return (
      <View 
        key={event.id} 
        style={[
          styles.eventCard,
          isNext && styles.eventCardNext,
        ]}
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventDateBadge}>
            <Text style={styles.eventDateText}>{formatDateDisplay(event.date)}</Text>
          </View>
          <View style={[styles.eventTypeBadge, { backgroundColor: color + '30' }]}>
            <Text style={[styles.eventTypeText, { color }]}>{icon} {event.title}</Text>
          </View>
        </View>
        
        {isMatch && event.data && (
          <View style={styles.eventMatchInfo}>
            <Text style={[
              styles.eventTeamName,
              event.data.home_team_id === team?.id && styles.eventTeamHighlight
            ]}>
              {event.data.home_team_name}
            </Text>
            <Text style={styles.eventVs}>vs</Text>
            <Text style={[
              styles.eventTeamName,
              event.data.away_team_id === team?.id && styles.eventTeamHighlight
            ]}>
              {event.data.away_team_name}
            </Text>
          </View>
        )}
        
        {isCupDraw && (
          <View style={styles.eventDrawInfo}>
            <Ionicons name="shuffle" size={20} color={color} />
            <Text style={styles.eventDrawText}>{event.competitionRound} Draw</Text>
          </View>
        )}
        
        {event.type === 'transfer_window_open' && (
          <View style={styles.eventTransferInfo}>
            <Ionicons name="swap-horizontal" size={20} color="#00ff88" />
            <Text style={styles.eventTransferText}>Transfer Window Opens</Text>
          </View>
        )}
        
        {event.type === 'transfer_window_close' && (
          <View style={styles.eventTransferInfo}>
            <Ionicons name="lock-closed" size={20} color="#ff6b6b" />
            <Text style={styles.eventTransferText}>Transfer Deadline Day!</Text>
          </View>
        )}
        
        {isNext && (isMatch || isCupDraw) && (
          <TouchableOpacity 
            style={[styles.playButton, { marginTop: 12 }]} 
            onPress={() => onPlayEvent ? onPlayEvent(event) : onNextWeek()}
          >
            <Ionicons name={isMatch ? "play" : "shuffle"} size={16} color="#0a1628" />
            <Text style={styles.playButtonText}>
              {isMatch ? 'PLAY MATCH' : 'VIEW DRAW'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Current Date (if using event system) */}
      {currentDate && (
        <View style={styles.currentDateBanner}>
          <Ionicons name="calendar" size={14} color="#4a9eff" />
          <Text style={styles.currentDateText}>{formatDateDisplay(currentDate)}</Text>
        </View>
      )}
      
      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {position}{position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'}
          </Text>
          <Text style={styles.statLabel}>Position</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatValue(save?.budget || 0, currency)}</Text>
          <Text style={styles.statLabel}>Budget</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{team?.squad?.length || 0}</Text>
          <Text style={styles.statLabel}>Squad Size</Text>
        </View>
      </View>

      {/* Upcoming Events (v2 system) or Next Match (legacy) */}
      {hasEventSystem ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UPCOMING EVENTS</Text>
          {upcomingEvents.slice(0, 4).map((event, index) => 
            renderEventCard(event, index === 0)
          )}
          {upcomingEvents.length === 0 && (
            <View style={styles.matchCard}>
              <Text style={styles.noMatchText}>No upcoming events</Text>
            </View>
          )}
        </View>
      ) : (
        /* Legacy: Next Match only */
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
      )}

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
