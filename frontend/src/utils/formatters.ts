/**
 * Utility functions for formatting values in the app
 * All player attributes use 1-20 scale
 */

// Format monetary values (player value, budget, etc.)
export const formatValue = (value: number): string => {
  if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `£${(value / 1000).toFixed(0)}K`;
  return `£${value}`;
};

// Format weekly wages
export const formatWage = (wage: number): string => {
  if (wage >= 1000) return `£${(wage / 1000).toFixed(1)}K/week`;
  return `£${wage}/week`;
};

// Format wage without /week suffix (for shorter display)
export const formatWageShort = (wage: number): string => {
  if (wage >= 1000) return `£${(wage / 1000).toFixed(1)}K`;
  return `£${wage}`;
};

// Get color based on attribute value (1-20 scale)
export const getAbilityColor = (value: number): string => {
  if (value >= 16) return '#00ff88';  // Excellent (16-20)
  if (value >= 13) return '#4a9eff';  // Good (13-15)
  if (value >= 10) return '#ffcc00';  // Average (10-12)
  if (value >= 7) return '#ff9f43';   // Below Average (7-9)
  return '#ff6b6b';                    // Poor (1-6)
};

// Get morale text description (1-20 scale)
export const getMoraleText = (morale: number): string => {
  if (morale >= 16) return 'Excellent';
  if (morale >= 12) return 'Good';
  if (morale >= 8) return 'Average';
  if (morale >= 4) return 'Poor';
  return 'Very Poor';
};

// Get form text description (1-20 scale)
export const getFormText = (form: number): string => {
  if (form >= 16) return 'Outstanding';
  if (form >= 12) return 'Good';
  if (form >= 8) return 'Average';
  if (form >= 4) return 'Poor';
  return 'Terrible';
};

// Get form color for display
export const getFormColor = (form: number): string => {
  if (form >= 16) return '#00ff88';
  if (form >= 12) return '#4a9eff';
  if (form >= 8) return '#ffaa00';
  return '#ff6b6b';
};

// Get injury severity color
export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'Minor': return '#ffd700';
    case 'Moderate': return '#ff9500';
    case 'Serious': return '#ff6b35';
    case 'Severe': return '#ff3b30';
    case 'Critical': return '#cc0000';
    default: return '#ff9500';
  }
};

// Format date for display
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
};

// Format contract end date
export const formatContractEnd = (dateString: string): string => {
  const [year, month] = dateString.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
};

// Get match event icon name (for Ionicons)
export const getEventIcon = (type: string): string => {
  switch (type) {
    case 'GOAL': return 'football';
    case 'YELLOW_CARD': return 'card';
    case 'SAVE': return 'hand-left';
    case 'CHANCE': return 'flash';
    case 'FOUL': return 'warning';
    case 'INJURY': return 'medkit';
    case 'SUBSTITUTION': return 'swap-horizontal';
    case 'TACTICAL_CHANGE': return 'grid-outline';
    default: return 'ellipse';
  }
};

// Get match event color
export const getEventColor = (type: string): string => {
  switch (type) {
    case 'GOAL': return '#00ff88';
    case 'YELLOW_CARD': return '#ffcc00';
    case 'SAVE': return '#4a9eff';
    case 'CHANCE': return '#ff9f43';
    case 'FOUL': return '#ff6b6b';
    case 'INJURY': return '#ff3b30';
    case 'SUBSTITUTION': return '#9b59b6';
    case 'TACTICAL_CHANGE': return '#3498db';
    default: return '#6a8aaa';
  }
};
