import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGame } from '../../context/GameContext';

type FilterType = 'all' | 'league' | 'cup' | 'friendly';

interface ScheduleTabProps {
  team: any;
  league: any;
}

export function ScheduleTab({ team, league }: ScheduleTabProps) {
  const { currentSave, getUpcomingEvents } = useGame();
  const [filter, setFilter] = useState<FilterType>('all');
  
  const currency = currentSave?.currency_symbol || '£';
  
  // Get all events from calendar
  const allEvents = useMemo(() => {
    if (!currentSave) return [];
    return getUpcomingEvents(100); // Get up to 100 events
  }, [currentSave, getUpcomingEvents]);

  // Filter events based on type
  const filteredEvents = useMemo(() => {
    if (filter === 'all') return allEvents;
    
    return allEvents.filter(event => {
      switch (filter) {
        case 'league':
          return event.type === 'league_match';
        case 'cup':
          return event.type === 'cup_match' || event.type === 'cup_draw';
        case 'friendly':
          return event.type === 'friendly_match';
        default:
          return true;
      }
    });
  }, [allEvents, filter]);

  // Separate into upcoming and past
  const currentDate = currentSave?.game_date || '';
  
  const { upcomingMatches, pastMatches } = useMemo(() => {
    const upcoming: typeof filteredEvents = [];
    const past: typeof filteredEvents = [];
    
    filteredEvents.forEach(event => {
      // Check if event has a result (is completed)
      if (event.result) {
        past.push(event);
      } else {
        upcoming.push(event);
      }
    });
    
    return { upcomingMatches: upcoming, pastMatches: past.reverse() };
  }, [filteredEvents]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'league_match': return 'football';
      case 'cup_match': return 'trophy';
      case 'cup_draw': return 'shuffle';
      case 'friendly_match': return 'people';
      case 'transfer_window_open':
      case 'transfer_window_close': return 'swap-horizontal';
      case 'season_end': return 'flag';
      default: return 'calendar';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'league_match': return '#4a9eff';
      case 'cup_match': return '#ffaa00';
      case 'cup_draw': return '#ffaa00';
      case 'friendly_match': return '#00ff88';
      default: return '#6a8aaa';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'TBD';
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const renderFilterButton = (filterType: FilterType, label: string, icon: string) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === filterType && styles.filterButtonActive]}
      onPress={() => setFilter(filterType)}
    >
      <Ionicons 
        name={icon as any} 
        size={14} 
        color={filter === filterType ? '#0a1628' : '#6a8aaa'} 
      />
      <Text style={[styles.filterButtonText, filter === filterType && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderMatchCard = (event: any, isPast: boolean = false) => {
    const isHomeTeam = event.homeTeam?.id === team?.id;
    const isAwayTeam = event.awayTeam?.id === team?.id;
    const isOurMatch = isHomeTeam || isAwayTeam;
    
    // Determine result styling
    let resultStyle = null;
    let resultText = '';
    if (isPast && event.result && isOurMatch) {
      const ourScore = isHomeTeam ? event.result.homeScore : event.result.awayScore;
      const theirScore = isHomeTeam ? event.result.awayScore : event.result.homeScore;
      
      if (ourScore > theirScore) {
        resultStyle = styles.resultWin;
        resultText = 'W';
      } else if (ourScore < theirScore) {
        resultStyle = styles.resultLoss;
        resultText = 'L';
      } else {
        resultStyle = styles.resultDraw;
        resultText = 'D';
      }
    }

    return (
      <View 
        key={event.id} 
        style={[
          styles.matchCard,
          isOurMatch && styles.matchCardHighlight,
          isPast && styles.matchCardPast
        ]}
      >
        <View style={styles.matchHeader}>
          <View style={styles.matchDateBadge}>
            <Text style={styles.matchDateText}>{formatDate(event.date)}</Text>
          </View>
          <View style={[styles.matchTypeBadge, { backgroundColor: getEventColor(event.type) + '33' }]}>
            <Ionicons name={getEventIcon(event.type) as any} size={10} color={getEventColor(event.type)} />
            <Text style={[styles.matchTypeText, { color: getEventColor(event.type) }]}>
              {event.type === 'league_match' ? 'League' : 
               event.type === 'cup_match' ? event.competitionName || 'Cup' : 
               event.type === 'friendly_match' ? 'Friendly' : event.type}
            </Text>
          </View>
          {resultStyle && (
            <View style={[styles.resultBadge, resultStyle]}>
              <Text style={styles.resultBadgeText}>{resultText}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.matchTeams}>
          <Text 
            style={[
              styles.matchTeamName, 
              isHomeTeam && styles.matchTeamNameHighlight
            ]}
            numberOfLines={1}
          >
            {event.homeTeam?.name || 'TBD'}
          </Text>
          
          {isPast && event.result ? (
            <View style={styles.matchScoreContainer}>
              <Text style={styles.matchScore}>
                {event.result.homeScore} - {event.result.awayScore}
              </Text>
            </View>
          ) : (
            <Text style={styles.matchVs}>vs</Text>
          )}
          
          <Text 
            style={[
              styles.matchTeamName, 
              styles.matchTeamNameRight,
              isAwayTeam && styles.matchTeamNameHighlight
            ]}
            numberOfLines={1}
          >
            {event.awayTeam?.name || 'TBD'}
          </Text>
        </View>
        
        {event.venue && (
          <View style={styles.matchVenue}>
            <Ionicons name="location-outline" size={10} color="#4a6a8a" />
            <Text style={styles.matchVenueText}>{event.venue}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderOtherEvent = (event: any) => (
    <View key={event.id} style={styles.otherEventCard}>
      <View style={[styles.otherEventIcon, { backgroundColor: getEventColor(event.type) + '33' }]}>
        <Ionicons name={getEventIcon(event.type) as any} size={16} color={getEventColor(event.type)} />
      </View>
      <View style={styles.otherEventInfo}>
        <Text style={styles.otherEventTitle}>
          {event.type === 'transfer_window_open' ? 'Transfer Window Opens' :
           event.type === 'transfer_window_close' ? 'Transfer Window Closes' :
           event.type === 'cup_draw' ? `${event.competitionName || 'Cup'} Draw` :
           event.type === 'season_end' ? 'Season Ends' :
           event.title || event.type}
        </Text>
        <Text style={styles.otherEventDate}>{formatDate(event.date)}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Current Date */}
      <View style={styles.currentDateBanner}>
        <Ionicons name="calendar" size={14} color="#4a9eff" />
        <Text style={styles.currentDateText}>{formatDate(currentDate)}</Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All', 'list')}
        {renderFilterButton('league', 'League', 'football')}
        {renderFilterButton('cup', 'Cup', 'trophy')}
        {renderFilterButton('friendly', 'Friendly', 'people')}
      </View>

      {/* Stats Summary */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{upcomingMatches.filter(e => e.type.includes('match')).length}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#00ff88' }]}>
            {pastMatches.filter(e => {
              if (!e.result) return false;
              const isHome = e.homeTeam?.id === team?.id;
              const ourScore = isHome ? e.result.homeScore : e.result.awayScore;
              const theirScore = isHome ? e.result.awayScore : e.result.homeScore;
              return ourScore > theirScore;
            }).length}
          </Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#ffaa00' }]}>
            {pastMatches.filter(e => {
              if (!e.result) return false;
              return e.result.homeScore === e.result.awayScore;
            }).length}
          </Text>
          <Text style={styles.statLabel}>Draws</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#ff6b6b' }]}>
            {pastMatches.filter(e => {
              if (!e.result) return false;
              const isHome = e.homeTeam?.id === team?.id;
              const ourScore = isHome ? e.result.homeScore : e.result.awayScore;
              const theirScore = isHome ? e.result.awayScore : e.result.homeScore;
              return ourScore < theirScore;
            }).length}
          </Text>
          <Text style={styles.statLabel}>Losses</Text>
        </View>
      </View>

      {/* Upcoming Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>UPCOMING FIXTURES</Text>
        {upcomingMatches.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={32} color="#4a6a8a" />
            <Text style={styles.emptyText}>No upcoming matches</Text>
          </View>
        ) : (
          upcomingMatches.slice(0, 10).map(event => 
            event.type.includes('match') 
              ? renderMatchCard(event, false)
              : renderOtherEvent(event)
          )
        )}
      </View>

      {/* Past Results Section */}
      {pastMatches.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT RESULTS</Text>
          {pastMatches.slice(0, 10).map(event => 
            event.type.includes('match')
              ? renderMatchCard(event, true)
              : null
          )}
        </View>
      )}
      
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  currentDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    marginBottom: 12,
    backgroundColor: '#0d2137',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  currentDateText: {
    color: '#4a9eff',
    fontSize: 11,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    backgroundColor: '#0d2137',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  filterButtonActive: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  filterButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6a8aaa',
  },
  filterButtonTextActive: {
    color: '#0a1628',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#0d2137',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4a9eff',
  },
  statLabel: {
    fontSize: 9,
    color: '#6a8aaa',
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6a8aaa',
    letterSpacing: 1,
    marginBottom: 8,
  },
  matchCard: {
    backgroundColor: '#0d2137',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    marginBottom: 6,
  },
  matchCardHighlight: {
    borderColor: '#00ff88',
    borderWidth: 1,
  },
  matchCardPast: {
    opacity: 0.85,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  matchDateBadge: {
    backgroundColor: '#1a3a5c',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  matchDateText: {
    color: '#9ab8d8',
    fontSize: 9,
    fontWeight: '600',
  },
  matchTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  matchTypeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  resultBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
  },
  resultBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  resultWin: {
    backgroundColor: '#00ff88',
  },
  resultLoss: {
    backgroundColor: '#ff6b6b',
  },
  resultDraw: {
    backgroundColor: '#ffaa00',
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchTeamName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#9ab8d8',
  },
  matchTeamNameRight: {
    textAlign: 'right',
  },
  matchTeamNameHighlight: {
    color: '#00ff88',
    fontWeight: '700',
  },
  matchVs: {
    fontSize: 10,
    color: '#4a6a8a',
    paddingHorizontal: 8,
  },
  matchScoreContainer: {
    backgroundColor: '#1a3a5c',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  matchScore: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  matchVenue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  matchVenueText: {
    fontSize: 9,
    color: '#4a6a8a',
  },
  otherEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d2137',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    marginBottom: 6,
    gap: 10,
  },
  otherEventIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherEventInfo: {
    flex: 1,
  },
  otherEventTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  otherEventDate: {
    fontSize: 10,
    color: '#6a8aaa',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0d2137',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  emptyText: {
    fontSize: 12,
    color: '#6a8aaa',
    marginTop: 8,
  },
});
