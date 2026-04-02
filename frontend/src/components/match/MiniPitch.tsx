import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { FORMATION_POSITIONS } from './matchHelpers';

const { width } = Dimensions.get('window');

interface MiniPitchProps {
  formation?: string;
  homeTeam: any;
  awayTeam: any;
  lastEvent?: any;
}

// Formation positions with proper horizontal spread for visualization
// Each position has x (0-100, left to right) and y (0-100, goalkeeper at 0, striker at 100)
// Y values: GK=0, Defenders=15-25, Midfielders=40-60, Forwards=75-90
const VISUAL_FORMATION_POSITIONS: Record<string, { position: string; x: number; y: number }[]> = {
  '4-4-2': [
    { position: 'GK', x: 50, y: 2 },
    { position: 'LB', x: 12, y: 22 }, { position: 'CB', x: 35, y: 18 },
    { position: 'CB', x: 65, y: 18 }, { position: 'RB', x: 88, y: 22 },
    { position: 'LM', x: 12, y: 48 }, { position: 'CM', x: 35, y: 44 },
    { position: 'CM', x: 65, y: 44 }, { position: 'RM', x: 88, y: 48 },
    { position: 'ST', x: 35, y: 75 }, { position: 'ST', x: 65, y: 75 },
  ],
  '4-3-3': [
    { position: 'GK', x: 50, y: 2 },
    { position: 'LB', x: 12, y: 22 }, { position: 'CB', x: 35, y: 18 },
    { position: 'CB', x: 65, y: 18 }, { position: 'RB', x: 88, y: 22 },
    { position: 'CM', x: 28, y: 46 }, { position: 'CM', x: 50, y: 42 },
    { position: 'CM', x: 72, y: 46 },
    { position: 'LW', x: 15, y: 75 }, { position: 'ST', x: 50, y: 80 },
    { position: 'RW', x: 85, y: 75 },
  ],
  '3-5-2': [
    { position: 'GK', x: 50, y: 2 },
    { position: 'CB', x: 28, y: 18 }, { position: 'CB', x: 50, y: 15 },
    { position: 'CB', x: 72, y: 18 },
    { position: 'LWB', x: 8, y: 42 }, { position: 'CM', x: 30, y: 40 },
    { position: 'CM', x: 50, y: 38 }, { position: 'CM', x: 70, y: 40 },
    { position: 'RWB', x: 92, y: 42 },
    { position: 'ST', x: 35, y: 75 }, { position: 'ST', x: 65, y: 75 },
  ],
  '4-5-1': [
    { position: 'GK', x: 50, y: 2 },
    { position: 'LB', x: 12, y: 22 }, { position: 'CB', x: 35, y: 18 },
    { position: 'CB', x: 65, y: 18 }, { position: 'RB', x: 88, y: 22 },
    { position: 'LM', x: 8, y: 46 }, { position: 'CM', x: 32, y: 42 },
    { position: 'AM', x: 50, y: 52 }, { position: 'CM', x: 68, y: 42 },
    { position: 'RM', x: 92, y: 46 },
    { position: 'ST', x: 50, y: 80 },
  ],
  '5-3-2': [
    { position: 'GK', x: 50, y: 2 },
    { position: 'LWB', x: 8, y: 24 }, { position: 'CB', x: 28, y: 18 },
    { position: 'CB', x: 50, y: 15 }, { position: 'CB', x: 72, y: 18 },
    { position: 'RWB', x: 92, y: 24 },
    { position: 'CM', x: 28, y: 44 }, { position: 'CM', x: 50, y: 42 },
    { position: 'CM', x: 72, y: 44 },
    { position: 'ST', x: 35, y: 75 }, { position: 'ST', x: 65, y: 75 },
  ],
  '4-2-3-1': [
    { position: 'GK', x: 50, y: 2 },
    { position: 'LB', x: 12, y: 22 }, { position: 'CB', x: 35, y: 18 },
    { position: 'CB', x: 65, y: 18 }, { position: 'RB', x: 88, y: 22 },
    { position: 'DM', x: 35, y: 36 }, { position: 'DM', x: 65, y: 36 },
    { position: 'LW', x: 18, y: 55 }, { position: 'AM', x: 50, y: 58 },
    { position: 'RW', x: 82, y: 55 },
    { position: 'ST', x: 50, y: 80 },
  ],
  '3-4-3': [
    { position: 'GK', x: 50, y: 2 },
    { position: 'CB', x: 28, y: 18 }, { position: 'CB', x: 50, y: 15 },
    { position: 'CB', x: 72, y: 18 },
    { position: 'LM', x: 12, y: 44 }, { position: 'CM', x: 38, y: 42 },
    { position: 'CM', x: 62, y: 42 }, { position: 'RM', x: 88, y: 44 },
    { position: 'LW', x: 18, y: 75 }, { position: 'ST', x: 50, y: 80 },
    { position: 'RW', x: 82, y: 75 },
  ],
  '4-1-4-1': [
    { position: 'GK', x: 50, y: 2 },
    { position: 'LB', x: 12, y: 22 }, { position: 'CB', x: 35, y: 18 },
    { position: 'CB', x: 65, y: 18 }, { position: 'RB', x: 88, y: 22 },
    { position: 'DM', x: 50, y: 34 },
    { position: 'LM', x: 12, y: 52 }, { position: 'CM', x: 35, y: 50 },
    { position: 'CM', x: 65, y: 50 }, { position: 'RM', x: 88, y: 52 },
    { position: 'ST', x: 50, y: 80 },
  ],
};

export function MiniPitch({ formation, homeTeam, awayTeam, lastEvent }: MiniPitchProps) {
  const homeFormation = homeTeam?.formation || '4-4-2';
  const awayFormation = awayTeam?.formation || '4-4-2';
  
  const homePositions = VISUAL_FORMATION_POSITIONS[homeFormation] || VISUAL_FORMATION_POSITIONS['4-4-2'];
  const awayPositions = VISUAL_FORMATION_POSITIONS[awayFormation] || VISUAL_FORMATION_POSITIONS['4-4-2'];
  
  const pitchWidth = Math.min(width - 32, 360);
  const pitchHeight = pitchWidth * 1.4; // More vertical space for proper football pitch proportions

  // Home team plays in bottom half (y: 50-100%)
  // GK (y:2) should be at ~95%, Strikers (y:80) should be at ~55%
  const homeAdjusted = homePositions.map(pos => ({
    ...pos,
    // Scale y from 0-100 to 95-55% (inverted - GK at bottom, strikers at center)
    y: 95 - (pos.y / 100) * 40
  }));

  // Away team plays in top half (y: 0-50%)
  // GK (y:2) should be at ~5%, Strikers (y:80) should be at ~45%
  const awayAdjusted = awayPositions.map(pos => ({
    ...pos,
    // Scale y from 0-100 to 5-45% (GK at top, strikers at center)
    y: 5 + (pos.y / 100) * 40
  }));

  // Determine ball position based on last event
  const getBallPosition = () => {
    if (!lastEvent) return { x: 50, y: 50 };
    
    const isHomeEvent = lastEvent.team === homeTeam?.short_name;
    
    // Position ball based on event type and team
    switch (lastEvent.type) {
      case 'GOAL':
        return isHomeEvent ? { x: 50, y: 10 } : { x: 50, y: 90 }; // In the goal
      case 'CHANCE':
      case 'SAVE':
        return isHomeEvent ? { x: 50, y: 18 } : { x: 50, y: 82 }; // Near goal
      case 'CORNER':
        return isHomeEvent 
          ? { x: Math.random() > 0.5 ? 5 : 95, y: 10 }
          : { x: Math.random() > 0.5 ? 5 : 95, y: 90 };
      case 'FOUL':
        return { x: 30 + Math.random() * 40, y: 30 + Math.random() * 40 };
      default:
        return { x: 50, y: 50 };
    }
  };

  const ballPos = getBallPosition();

  return (
    <View style={[pitchStyles.container, { width: pitchWidth, height: pitchHeight }]}>
      {/* Pitch background */}
      <View style={pitchStyles.pitch}>
        {/* Center line */}
        <View style={[pitchStyles.centerLine, { top: pitchHeight / 2 }]} />
        
        {/* Center circle */}
        <View style={[pitchStyles.centerCircle, { 
          top: pitchHeight / 2 - 20, 
          left: pitchWidth / 2 - 20,
          width: 40,
          height: 40,
          borderRadius: 20,
        }]} />
        
        {/* Penalty boxes */}
        <View style={[pitchStyles.penaltyBox, pitchStyles.penaltyBoxTop, {
          width: pitchWidth * 0.44,
          left: pitchWidth * 0.28,
          height: pitchHeight * 0.16,
        }]} />
        <View style={[pitchStyles.penaltyBox, pitchStyles.penaltyBoxBottom, {
          width: pitchWidth * 0.44,
          left: pitchWidth * 0.28,
          height: pitchHeight * 0.16,
        }]} />
        
        {/* Goal areas */}
        <View style={[pitchStyles.goalArea, {
          top: 0,
          width: pitchWidth * 0.22,
          left: pitchWidth * 0.39,
          height: pitchHeight * 0.06,
        }]} />
        <View style={[pitchStyles.goalArea, {
          bottom: 0,
          width: pitchWidth * 0.22,
          left: pitchWidth * 0.39,
          height: pitchHeight * 0.06,
        }]} />
      </View>

      {/* Away team players (top half - attacking downward) */}
      {awayAdjusted.map((pos, index) => (
        <View
          key={`away-${index}`}
          style={[
            pitchStyles.playerDot,
            pitchStyles.awayPlayer,
            {
              left: (pos.x / 100) * pitchWidth - 11,
              top: (pos.y / 100) * pitchHeight - 11,
            },
          ]}
        >
          <Text style={pitchStyles.awayLabel}>{pos.position}</Text>
        </View>
      ))}

      {/* Home team players (bottom half - attacking upward) */}
      {homeAdjusted.map((pos, index) => (
        <View
          key={`home-${index}`}
          style={[
            pitchStyles.playerDot,
            pitchStyles.homePlayer,
            {
              left: (pos.x / 100) * pitchWidth - 11,
              top: (pos.y / 100) * pitchHeight - 11,
            },
          ]}
        >
          <Text style={pitchStyles.homeLabel}>{pos.position}</Text>
        </View>
      ))}

      {/* Ball position indicator */}
      {lastEvent && (
        <View style={[
          pitchStyles.ball,
          {
            left: (ballPos.x / 100) * pitchWidth - 5,
            top: (ballPos.y / 100) * pitchHeight - 5,
          }
        ]} />
      )}
      
      {/* Team labels */}
      <View style={pitchStyles.teamLabelContainer}>
        <Text style={pitchStyles.awayTeamLabel}>{awayTeam?.short_name || 'AWAY'}</Text>
        <Text style={pitchStyles.homeTeamLabel}>{homeTeam?.short_name || 'HOME'}</Text>
      </View>
    </View>
  );
}

const pitchStyles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#1a5c2e',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2a7a3e',
  },
  pitch: {
    flex: 1,
    position: 'relative',
  },
  centerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  centerCircle: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  penaltyBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  penaltyBoxTop: {
    top: 0,
    borderTopWidth: 0,
  },
  penaltyBoxBottom: {
    bottom: 0,
    borderBottomWidth: 0,
  },
  goalArea: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  playerDot: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  homePlayer: {
    backgroundColor: '#4a9eff',
    borderColor: '#fff',
  },
  awayPlayer: {
    backgroundColor: '#ff6b6b',
    borderColor: '#fff',
  },
  homeLabel: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '800',
    textAlign: 'center',
  },
  awayLabel: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '800',
    textAlign: 'center',
  },
  ball: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
  },
  teamLabelContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 4,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  awayTeamLabel: {
    color: '#ff6b6b',
    fontSize: 9,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  homeTeamLabel: {
    color: '#4a9eff',
    fontSize: 9,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
});
