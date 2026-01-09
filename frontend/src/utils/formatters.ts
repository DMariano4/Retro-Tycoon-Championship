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
