import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { matchStyles as styles } from './matchStyles';
import { FORMATION_POSITIONS } from './matchHelpers';

const { width } = Dimensions.get('window');

interface MiniPitchProps {
  formation?: string;
  homeTeam: any;
  awayTeam: any;
  lastEvent?: any;
}

export function MiniPitch({ formation, homeTeam, awayTeam, lastEvent }: MiniPitchProps) {
  const homePositions = FORMATION_POSITIONS[homeTeam?.formation || '4-4-2'] || FORMATION_POSITIONS['4-4-2'];
  const awayPositions = FORMATION_POSITIONS[awayTeam?.formation || '4-4-2'] || FORMATION_POSITIONS['4-4-2'];
  
  const pitchWidth = Math.min(width - 32, 380);
  const pitchHeight = pitchWidth * 0.65;

  // Map positions to pitch sections to avoid overlap
  const homeAdjusted = homePositions.map(pos => ({
    ...pos,
    y: pos.y * 0.45
  }));

  const awayAdjusted = awayPositions.map(pos => ({
    ...pos,
    y: 55 + ((100 - pos.y) * 0.45)
  }));

  return (
    <View style={[styles.miniPitchContainer, { width: pitchWidth, height: pitchHeight }]}>
      {/* Pitch background */}
      <View style={styles.miniPitch}>
        {/* Center line */}
        <View style={[styles.centerLine, { top: pitchHeight / 2 }]} />
        
        {/* Center circle */}
        <View style={[styles.centerCircle, { 
          top: pitchHeight / 2 - 25, 
          left: pitchWidth / 2 - 25,
          width: 50,
          height: 50,
          borderRadius: 25,
        }]} />
        
        {/* Penalty boxes */}
        <View style={[styles.penaltyBox, styles.penaltyBoxTop, {
          width: pitchWidth * 0.5,
          left: pitchWidth * 0.25,
          height: 50,
        }]} />
        <View style={[styles.penaltyBox, styles.penaltyBoxBottom, {
          width: pitchWidth * 0.5,
          left: pitchWidth * 0.25,
          height: 50,
        }]} />
      </View>

      {/* Home team players (bottom) */}
      {homeAdjusted.map((pos, index) => (
        <View
          key={`home-${index}`}
          style={[
            styles.miniPlayerDot,
            styles.homePlayerDot,
            {
              left: (pos.x / 100) * pitchWidth - 12,
              bottom: (pos.y / 100) * pitchHeight - 12,
            },
          ]}
        >
          <Text style={[styles.miniPlayerLabel, styles.homePlayerLabel]}>{pos.position}</Text>
        </View>
      ))}

      {/* Away team players (top) */}
      {awayAdjusted.map((pos, index) => (
        <View
          key={`away-${index}`}
          style={[
            styles.miniPlayerDot,
            styles.awayPlayerDot,
            {
              left: (pos.x / 100) * pitchWidth - 12,
              top: (pos.y / 100) * pitchHeight - 12,
            },
          ]}
        >
          <Text style={[styles.miniPlayerLabel, styles.awayPlayerLabel]}>{pos.position}</Text>
        </View>
      ))}

      {/* Ball position indicator (based on last event) */}
      {lastEvent && (
        <View style={[
          styles.ballIndicator,
          {
            left: pitchWidth / 2 - 6,
            top: pitchHeight / 2 - 6,
          }
        ]} />
      )}
    </View>
  );
}
