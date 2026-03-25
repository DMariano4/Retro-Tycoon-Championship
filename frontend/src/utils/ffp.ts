/**
 * Financial Fair Play (FFP) System
 * 
 * Monitors club finances and applies restrictions based on wage-to-revenue ratio.
 */

export type FFPStatus = 'healthy' | 'warning' | 'caution' | 'crisis' | 'insolvency';

export interface FFPState {
  status: FFPStatus;
  wage_ratio: number;
  consecutive_deficit_seasons: number;
  transfer_restriction: number;  // 0 = none, 0.5 = 50% cap, 1 = full embargo
  warnings_issued: number;
  last_warning_date?: string;
}

export interface FFPTier {
  status: FFPStatus;
  label: string;
  color: string;
  icon: string;
  minRatio: number;
  maxRatio: number;
  transferRestriction: number;
  description: string;
  consequences: string[];
}

/**
 * FFP Tier Definitions
 */
export const FFP_TIERS: Record<FFPStatus, FFPTier> = {
  healthy: {
    status: 'healthy',
    label: 'Healthy',
    color: '#00ff88',
    icon: 'checkmark-circle',
    minRatio: 0,
    maxRatio: 60,
    transferRestriction: 0,
    description: 'Finances in excellent shape',
    consequences: [
      'Full transfer activity allowed',
      'No restrictions on signings',
      'Board is pleased with financial management'
    ]
  },
  warning: {
    status: 'warning',
    label: 'Warning',
    color: '#ffcc00',
    icon: 'warning',
    minRatio: 60,
    maxRatio: 70,
    transferRestriction: 0,
    description: 'Board monitoring finances closely',
    consequences: [
      'Board sends formal warning',
      'Advised to reduce wage bill',
      'Transfer activity still permitted'
    ]
  },
  caution: {
    status: 'caution',
    label: 'Caution',
    color: '#ff9f43',
    icon: 'alert-circle',
    minRatio: 70,
    maxRatio: 80,
    transferRestriction: 0.5,
    description: 'Transfer budget restricted',
    consequences: [
      'Transfer budget capped at 50%',
      'Must sell before buying',
      'Board demands cost reduction plan'
    ]
  },
  crisis: {
    status: 'crisis',
    label: 'Crisis',
    color: '#ff4757',
    icon: 'close-circle',
    minRatio: 80,
    maxRatio: 100,
    transferRestriction: 1,
    description: 'Transfer embargo in effect',
    consequences: [
      'Cannot sign players (except free agents)',
      'Loan signings only',
      'Must offload high earners',
      'Board considering action'
    ]
  },
  insolvency: {
    status: 'insolvency',
    label: 'Insolvency',
    color: '#8b0000',
    icon: 'skull',
    minRatio: 100,
    maxRatio: Infinity,
    transferRestriction: 1,
    description: 'Club facing administration',
    consequences: [
      'Transfer embargo',
      'Automatic point deduction (-5 points)',
      'Forced player sales may occur',
      'Risk of further sanctions'
    ]
  }
};

/**
 * Calculate FFP status based on wage-to-revenue ratio
 */
export function calculateFFPStatus(
  weeklyWages: number,
  weeklyRevenue: number,
  currentBudget: number,
  consecutiveDeficitSeasons: number = 0
): FFPStatus {
  // Check for insolvency first (negative budget for 2+ seasons)
  if (currentBudget < 0 && consecutiveDeficitSeasons >= 2) {
    return 'insolvency';
  }

  // Calculate wage ratio
  const wageRatio = weeklyRevenue > 0 ? (weeklyWages / weeklyRevenue) * 100 : 100;

  if (wageRatio >= 80) return 'crisis';
  if (wageRatio >= 70) return 'caution';
  if (wageRatio >= 60) return 'warning';
  return 'healthy';
}

/**
 * Get FFP tier information for a given status
 */
export function getFFPTier(status: FFPStatus): FFPTier {
  return FFP_TIERS[status];
}

/**
 * Calculate wage-to-revenue ratio
 */
export function calculateWageRatio(weeklyWages: number, weeklyRevenue: number): number {
  if (weeklyRevenue <= 0) return 100;
  return (weeklyWages / weeklyRevenue) * 100;
}

/**
 * Get transfer budget multiplier based on FFP status
 */
export function getTransferBudgetMultiplier(status: FFPStatus): number {
  const tier = FFP_TIERS[status];
  return 1 - tier.transferRestriction;
}

/**
 * Check if a transfer is allowed under current FFP status
 */
export function canSignPlayer(
  ffpStatus: FFPStatus,
  isFreeTranfer: boolean = false,
  isLoan: boolean = false
): { allowed: boolean; reason?: string } {
  const tier = FFP_TIERS[ffpStatus];
  
  if (tier.transferRestriction === 0) {
    return { allowed: true };
  }
  
  if (tier.transferRestriction === 1) {
    // Full embargo - only free agents and loans allowed
    if (isFreeTranfer || isLoan) {
      return { allowed: true };
    }
    return { 
      allowed: false, 
      reason: 'Transfer embargo in effect. Only free agents and loans permitted.' 
    };
  }
  
  if (tier.transferRestriction === 0.5) {
    // 50% restriction - transfers allowed but budget capped
    return { 
      allowed: true, 
      reason: 'Transfer budget capped at 50% due to FFP caution.' 
    };
  }
  
  return { allowed: true };
}

/**
 * Calculate point deduction for insolvency
 */
export function getPointDeduction(ffpStatus: FFPStatus, consecutiveSeasons: number): number {
  if (ffpStatus !== 'insolvency') return 0;
  
  // First season of insolvency: -5 points
  // Second consecutive: -10 points
  // Third consecutive: -15 points (and potential relegation)
  return Math.min(consecutiveSeasons * 5, 15);
}

/**
 * Generate FFP warning message
 */
export function getFFPWarningMessage(
  currentStatus: FFPStatus, 
  previousStatus: FFPStatus | undefined,
  teamName: string
): string | null {
  // No warning if healthy or status hasn't changed
  if (currentStatus === 'healthy') return null;
  if (currentStatus === previousStatus) return null;
  
  const tier = FFP_TIERS[currentStatus];
  
  switch (currentStatus) {
    case 'warning':
      return `⚠️ BOARD WARNING: ${teamName}'s wage bill is concerning. The board advises reducing player wages to maintain financial stability.`;
    
    case 'caution':
      return `🟠 FFP CAUTION: ${teamName} has exceeded safe wage limits. Transfer budget has been reduced by 50% until finances improve.`;
    
    case 'crisis':
      return `🔴 FFP CRISIS: ${teamName} is in financial crisis! A transfer embargo is now in effect. Only free agents and loan signings are permitted.`;
    
    case 'insolvency':
      return `⛔ INSOLVENCY WARNING: ${teamName} faces administration! A 5-point deduction has been applied. Immediate action required to avoid further sanctions.`;
    
    default:
      return null;
  }
}

/**
 * Initialize FFP state for a new team
 */
export function initializeFFP(): FFPState {
  return {
    status: 'healthy',
    wage_ratio: 0,
    consecutive_deficit_seasons: 0,
    transfer_restriction: 0,
    warnings_issued: 0,
    last_warning_date: undefined
  };
}

/**
 * Update FFP state based on current finances
 */
export function updateFFPState(
  currentFFP: FFPState | undefined,
  weeklyWages: number,
  weeklyRevenue: number,
  currentBudget: number,
  currentDate: string
): FFPState {
  const existingFFP = currentFFP || initializeFFP();
  
  const wageRatio = calculateWageRatio(weeklyWages, weeklyRevenue);
  const newStatus = calculateFFPStatus(
    weeklyWages, 
    weeklyRevenue, 
    currentBudget, 
    existingFFP.consecutive_deficit_seasons
  );
  
  const tier = FFP_TIERS[newStatus];
  
  // Track if status worsened (for warning purposes)
  const statusOrder: FFPStatus[] = ['healthy', 'warning', 'caution', 'crisis', 'insolvency'];
  const currentIndex = statusOrder.indexOf(existingFFP.status);
  const newIndex = statusOrder.indexOf(newStatus);
  const statusWorsened = newIndex > currentIndex;
  
  return {
    status: newStatus,
    wage_ratio: Math.round(wageRatio * 10) / 10,
    consecutive_deficit_seasons: existingFFP.consecutive_deficit_seasons,
    transfer_restriction: tier.transferRestriction,
    warnings_issued: statusWorsened ? existingFFP.warnings_issued + 1 : existingFFP.warnings_issued,
    last_warning_date: statusWorsened ? currentDate : existingFFP.last_warning_date
  };
}

/**
 * Process end-of-season FFP updates
 */
export function processSeasonEndFFP(
  currentFFP: FFPState | undefined,
  seasonEndBudget: number
): FFPState {
  const existingFFP = currentFFP || initializeFFP();
  
  // Track consecutive deficit seasons
  let deficitSeasons = existingFFP.consecutive_deficit_seasons;
  if (seasonEndBudget < 0) {
    deficitSeasons += 1;
  } else {
    deficitSeasons = 0; // Reset if back in the black
  }
  
  return {
    ...existingFFP,
    consecutive_deficit_seasons: deficitSeasons,
    warnings_issued: 0, // Reset warnings for new season
    last_warning_date: undefined
  };
}
