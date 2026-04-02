/**
 * AI Manager Intelligence
 * 
 * Handles AI team decision making:
 * - Transfer activity (buying/selling players)
 * - Tactical changes (formations, styles)
 * - Squad management priorities
 */

import { Player, Team, TransferListing } from '../context/GameContext';

// ============================================
// CONFIGURATION
// ============================================

// Position priorities for squad building
export const POSITION_PRIORITIES: Record<string, number> = {
  'GK': 2,   // Need 2 goalkeepers minimum
  'CB': 4,   // Need 4 center backs
  'LB': 2,   // Need 2 left backs
  'RB': 2,   // Need 2 right backs
  'CDM': 2,  // Need 2 defensive midfielders
  'CM': 4,   // Need 4 central midfielders
  'CAM': 2,  // Need 2 attacking midfielders
  'LW': 2,   // Need 2 left wingers
  'RW': 2,   // Need 2 right wingers
  'LM': 2,   // Need 2 left midfielders
  'RM': 2,   // Need 2 right midfielders
  'ST': 3,   // Need 3 strikers
  'CF': 2,   // Need 2 center forwards
};

// Formation options for AI teams
export const AI_FORMATIONS = [
  '4-4-2',
  '4-3-3',
  '4-2-3-1',
  '3-5-2',
  '5-3-2',
  '4-5-1',
  '4-1-4-1',
  '3-4-3',
];

// Personality types that influence AI behavior
export type AIPersonality = 'defensive' | 'balanced' | 'attacking' | 'youth-focused' | 'experienced';

// ============================================
// SQUAD ANALYSIS
// ============================================

export interface SquadAnalysis {
  totalPlayers: number;
  averageRating: number;
  averageAge: number;
  positionCounts: Record<string, number>;
  weakPositions: string[];
  strongPositions: string[];
  needsReinforcement: boolean;
  tooManyPlayers: boolean;
  totalWages: number;
  wageToRevenueRatio: number;
}

/**
 * Analyze a team's squad composition
 */
export function analyzeSquad(team: Team): SquadAnalysis {
  const squad = team.squad;
  
  // Count players by position
  const positionCounts: Record<string, number> = {};
  for (const player of squad) {
    positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
  }
  
  // Find weak and strong positions
  const weakPositions: string[] = [];
  const strongPositions: string[] = [];
  
  for (const [position, needed] of Object.entries(POSITION_PRIORITIES)) {
    const have = positionCounts[position] || 0;
    if (have < needed) {
      weakPositions.push(position);
    } else if (have > needed + 1) {
      strongPositions.push(position);
    }
  }
  
  // Calculate averages
  const totalRating = squad.reduce((sum, p) => sum + p.current_ability, 0);
  const totalAge = squad.reduce((sum, p) => sum + p.age, 0);
  const totalWages = squad.reduce((sum, p) => sum + p.wage, 0);
  
  const averageRating = squad.length > 0 ? totalRating / squad.length : 0;
  const averageAge = squad.length > 0 ? totalAge / squad.length : 0;
  
  // Estimate revenue (simplified)
  const estimatedMonthlyRevenue = team.sponsorship_monthly + (team.fan_base * team.ticket_price * 2);
  const wageToRevenueRatio = estimatedMonthlyRevenue > 0 ? (totalWages * 4) / estimatedMonthlyRevenue : 0;
  
  return {
    totalPlayers: squad.length,
    averageRating: Math.round(averageRating),
    averageAge: Math.round(averageAge * 10) / 10,
    positionCounts,
    weakPositions,
    strongPositions,
    needsReinforcement: weakPositions.length > 0 || squad.length < 22,
    tooManyPlayers: squad.length > 30,
    totalWages,
    wageToRevenueRatio,
  };
}

// ============================================
// TRANSFER DECISIONS
// ============================================

export interface TransferTarget {
  player: Player;
  listing: TransferListing;
  priority: number;         // 1-10, higher = more urgent
  reason: string;
  maxBid: number;
}

export interface SaleCandidate {
  player: Player;
  priority: number;         // 1-10, higher = more likely to sell
  reason: string;
  minPrice: number;
}

/**
 * Identify players the AI team should try to buy
 */
export function identifyTransferTargets(
  team: Team,
  transferMarket: TransferListing[],
  analysis: SquadAnalysis
): TransferTarget[] {
  const targets: TransferTarget[] = [];
  const maxBudget = team.budget * 0.7; // Don't spend more than 70% of budget on one player
  
  // Filter out own players and those we can't afford
  const affordableListings = transferMarket.filter(
    l => l.team_id !== team.id && l.asking_price <= maxBudget
  );
  
  for (const listing of affordableListings) {
    const player = listing.player;
    let priority = 0;
    let reason = '';
    
    // Check if position is weak
    if (analysis.weakPositions.includes(player.position)) {
      priority += 5;
      reason = `Need ${player.position}`;
    }
    
    // Check if player would improve squad
    if (player.current_ability > analysis.averageRating + 5) {
      priority += 3;
      reason = reason ? `${reason}, quality upgrade` : 'Quality upgrade';
    }
    
    // Young talent
    if (player.age < 23 && player.potential_ability > player.current_ability + 10) {
      priority += 2;
      reason = reason ? `${reason}, young talent` : 'Young talent';
    }
    
    // Good value
    const valueRatio = player.value / listing.asking_price;
    if (valueRatio > 1.2) {
      priority += 2;
      reason = reason ? `${reason}, good value` : 'Good value';
    }
    
    // Only consider if priority is significant
    if (priority >= 3) {
      // Calculate max bid (based on value and urgency)
      const baseBid = listing.asking_price;
      const urgencyMultiplier = 1 + (priority / 20); // Up to 1.5x for urgent needs
      const maxBid = Math.min(maxBudget, baseBid * urgencyMultiplier);
      
      targets.push({
        player,
        listing,
        priority,
        reason,
        maxBid: Math.round(maxBid),
      });
    }
  }
  
  // Sort by priority
  return targets.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

/**
 * Identify players the AI team should list for sale
 */
export function identifySaleCandidates(
  team: Team,
  analysis: SquadAnalysis
): SaleCandidate[] {
  const candidates: SaleCandidate[] = [];
  
  for (const player of team.squad) {
    let priority = 0;
    let reason = '';
    
    // Too many players at position
    if (analysis.strongPositions.includes(player.position)) {
      priority += 3;
      reason = `Surplus ${player.position}`;
    }
    
    // Squad too large
    if (analysis.tooManyPlayers) {
      priority += 2;
      reason = reason ? `${reason}, squad too large` : 'Squad too large';
    }
    
    // Old player past prime
    if (player.age > 32) {
      priority += 2;
      reason = reason ? `${reason}, aging` : 'Aging player';
    }
    
    // High wages relative to ability
    const wageToAbilityRatio = player.wage / (player.current_ability * 100);
    if (wageToAbilityRatio > 1.5) {
      priority += 2;
      reason = reason ? `${reason}, overpaid` : 'Overpaid';
    }
    
    // Low form
    if (player.form < 5) {
      priority += 1;
      reason = reason ? `${reason}, poor form` : 'Poor form';
    }
    
    // Don't sell key players (top 11 by ability)
    const sortedSquad = [...team.squad].sort((a, b) => b.current_ability - a.current_ability);
    const isKeyPlayer = sortedSquad.slice(0, 11).some(p => p.id === player.id);
    if (isKeyPlayer) {
      priority -= 5;
    }
    
    // Only consider if priority is significant
    if (priority >= 3) {
      // Calculate minimum acceptable price
      const minPrice = Math.round(player.value * 0.8);
      
      candidates.push({
        player,
        priority,
        reason,
        minPrice,
      });
    }
  }
  
  // Sort by priority
  return candidates.sort((a, b) => b.priority - a.priority).slice(0, 3);
}

// ============================================
// TACTICAL DECISIONS
// ============================================

export interface TacticalRecommendation {
  formation: string;
  style: 'defensive' | 'balanced' | 'attacking';
  reason: string;
}

/**
 * Recommend a formation based on squad composition
 */
export function recommendFormation(team: Team, analysis: SquadAnalysis): TacticalRecommendation {
  const positionCounts = analysis.positionCounts;
  
  // Count attackers, midfielders, defenders
  const attackers = (positionCounts['ST'] || 0) + (positionCounts['CF'] || 0) + 
                    (positionCounts['LW'] || 0) + (positionCounts['RW'] || 0);
  const midfielders = (positionCounts['CM'] || 0) + (positionCounts['CAM'] || 0) + 
                      (positionCounts['CDM'] || 0) + (positionCounts['LM'] || 0) + 
                      (positionCounts['RM'] || 0);
  const defenders = (positionCounts['CB'] || 0) + (positionCounts['LB'] || 0) + 
                    (positionCounts['RB'] || 0);
  
  let formation = '4-4-2';
  let style: 'defensive' | 'balanced' | 'attacking' = 'balanced';
  let reason = 'Standard balanced formation';
  
  // Strong attacking options
  if (attackers >= 5 && positionCounts['ST'] >= 2) {
    formation = '4-3-3';
    style = 'attacking';
    reason = 'Strong attacking options with multiple forwards';
  }
  // Lots of midfielders
  else if (midfielders >= 6) {
    formation = '4-5-1';
    style = 'balanced';
    reason = 'Midfield-heavy squad suits possession play';
  }
  // Strong defense
  else if (defenders >= 6 && positionCounts['CB'] >= 4) {
    formation = '5-3-2';
    style = 'defensive';
    reason = 'Defensive depth allows back 5 formation';
  }
  // Weak defense
  else if (defenders < 4) {
    formation = '3-5-2';
    style = 'attacking';
    reason = 'Limited defenders, focus on attacking';
  }
  // Lots of wingers
  else if ((positionCounts['LW'] || 0) >= 2 && (positionCounts['RW'] || 0) >= 2) {
    formation = '4-3-3';
    style = 'attacking';
    reason = 'Wide options suit 4-3-3';
  }
  
  return { formation, style, reason };
}

/**
 * Get formation based on opponent strength
 */
export function getMatchFormation(
  team: Team,
  opponent: Team,
  currentFormation: string
): string {
  const teamRating = team.squad.reduce((sum, p) => sum + p.current_ability, 0) / Math.max(1, team.squad.length);
  const oppRating = opponent.squad.reduce((sum, p) => sum + p.current_ability, 0) / Math.max(1, opponent.squad.length);
  
  const ratingDiff = teamRating - oppRating;
  
  // Much stronger - be more attacking
  if (ratingDiff > 10) {
    if (currentFormation === '4-4-2') return '4-3-3';
    if (currentFormation === '4-5-1') return '4-4-2';
  }
  // Much weaker - be more defensive
  else if (ratingDiff < -10) {
    if (currentFormation === '4-3-3') return '4-5-1';
    if (currentFormation === '4-4-2') return '5-3-2';
  }
  
  // Keep current formation
  return currentFormation;
}

// ============================================
// AI TRANSFER EXECUTION
// ============================================

export interface AITransferAction {
  type: 'buy' | 'sell' | 'list';
  teamId: string;
  teamName: string;
  player: Player;
  price: number;
  reason: string;
}

/**
 * Execute AI transfer decisions for all AI teams
 * Returns list of actions taken
 */
export function executeAITransfers(
  teams: Team[],
  managedTeamId: string,
  transferMarket: TransferListing[],
  transferWindowOpen: boolean
): { 
  updatedTeams: Team[]; 
  updatedMarket: TransferListing[]; 
  actions: AITransferAction[] 
} {
  if (!transferWindowOpen) {
    return { updatedTeams: teams, updatedMarket: transferMarket, actions: [] };
  }
  
  const actions: AITransferAction[] = [];
  let updatedTeams = [...teams];
  let updatedMarket = [...transferMarket];
  
  // Process each AI team
  for (const team of teams) {
    // Skip managed team
    if (team.id === managedTeamId) continue;
    
    // Random chance to act (not every team acts every window)
    if (Math.random() > 0.6) continue;
    
    const analysis = analyzeSquad(team);
    
    // SELLING: List surplus players
    const saleCandidates = identifySaleCandidates(team, analysis);
    for (const candidate of saleCandidates.slice(0, 1)) { // List max 1 per cycle
      // Check if already listed
      const alreadyListed = updatedMarket.some(
        l => l.player.id === candidate.player.id
      );
      
      if (!alreadyListed && Math.random() > 0.5) {
        const listing: TransferListing = {
          id: `listing_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          player: candidate.player,
          team_id: team.id,
          team_name: team.name,
          asking_price: candidate.minPrice,
          listed_date: new Date().toISOString().split('T')[0],
        };
        
        updatedMarket.push(listing);
        actions.push({
          type: 'list',
          teamId: team.id,
          teamName: team.name,
          player: candidate.player,
          price: candidate.minPrice,
          reason: candidate.reason,
        });
      }
    }
    
    // BUYING: Look for targets
    const targets = identifyTransferTargets(team, updatedMarket, analysis);
    for (const target of targets.slice(0, 1)) { // Buy max 1 per cycle
      // Don't buy from self
      if (target.listing.team_id === team.id) continue;
      
      // Check if can afford
      const teamInList = updatedTeams.find(t => t.id === team.id);
      if (!teamInList || teamInList.budget < target.listing.asking_price) continue;
      
      // Random negotiation - sometimes deal falls through
      if (Math.random() > 0.7) continue;
      
      // Execute transfer
      const sellingTeam = updatedTeams.find(t => t.id === target.listing.team_id);
      if (!sellingTeam) continue;
      
      // Calculate wage for new team
      const newWage = Math.round(target.player.current_ability * 100 * (0.9 + Math.random() * 0.2));
      const transferredPlayer = {
        ...target.player,
        wage: newWage,
      };
      
      // Update buying team
      updatedTeams = updatedTeams.map(t => {
        if (t.id === team.id) {
          return {
            ...t,
            budget: t.budget - target.listing.asking_price,
            squad: [...t.squad, transferredPlayer],
          };
        }
        return t;
      });
      
      // Update selling team
      updatedTeams = updatedTeams.map(t => {
        if (t.id === target.listing.team_id) {
          return {
            ...t,
            budget: t.budget + target.listing.asking_price,
            squad: t.squad.filter(p => p.id !== target.player.id),
          };
        }
        return t;
      });
      
      // Remove from market
      updatedMarket = updatedMarket.filter(l => l.id !== target.listing.id);
      
      actions.push({
        type: 'buy',
        teamId: team.id,
        teamName: team.name,
        player: target.player,
        price: target.listing.asking_price,
        reason: target.reason,
      });
    }
  }
  
  return { updatedTeams, updatedMarket, actions };
}

/**
 * Update AI team formations based on squad
 */
export function updateAIFormations(teams: Team[], managedTeamId: string): Team[] {
  return teams.map(team => {
    // Skip managed team
    if (team.id === managedTeamId) return team;
    
    // Random chance to change (not every team changes)
    if (Math.random() > 0.3) return team;
    
    const analysis = analyzeSquad(team);
    const recommendation = recommendFormation(team, analysis);
    
    // Only change if different
    if (team.formation !== recommendation.formation) {
      return {
        ...team,
        formation: recommendation.formation,
      };
    }
    
    return team;
  });
}

// ============================================
// AI BIDS FOR USER PLAYERS
// ============================================

export interface IncomingOffer {
  id: string;
  playerId: string;
  playerName: string;
  playerPosition: string;
  playerOverall: number;
  playerForm: number;
  fromTeamId: string;
  fromTeamName: string;
  offerAmount: number;
  playerValue: number;
  week: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: number;
  expiresInWeeks: number;
}

/**
 * Calculate a player's market value (fixed for 1-20 ability scale)
 */
function calculatePlayerValue(player: Player): number {
  const ability = player.current_ability || 10;
  // Base value: ability on 1-20 scale × £500,000
  // So a 10-rated player = £5M, 15-rated = £7.5M, 18-rated = £9M
  const baseValue = ability * 500000;
  
  // Age multiplier: young players worth more (potential), old players worth less
  let ageMultiplier = 1.0;
  if (player.age < 21) ageMultiplier = 1.6;
  else if (player.age < 24) ageMultiplier = 1.4;
  else if (player.age < 28) ageMultiplier = 1.1;
  else if (player.age < 30) ageMultiplier = 1.0;
  else if (player.age < 32) ageMultiplier = 0.7;
  else ageMultiplier = 0.5;
  
  // Position multiplier: attackers worth more
  const positionMultiplier = ['ST', 'CF', 'LW', 'RW', 'CAM'].includes(player.position) ? 1.3 : 1.0;
  
  return Math.round(baseValue * ageMultiplier * positionMultiplier);
}

/**
 * Calculate AI interest score for a player
 * Based on: Performance (form), Relative Quality, Position Need, and Special Factors
 */
function calculateInterestScore(
  player: Player,
  biddingTeam: Team,
  isOnTransferList: boolean = false
): { score: number; reason: string } {
  const analysis = analyzeSquad(biddingTeam);
  let score = 0;
  const reasons: string[] = [];
  
  // 1. PERFORMANCE SCORE (form-based) - 50% weight
  // Form is now on 1-10 scale (average of last 5 match ratings)
  const form = player.form || 6.0;
  if (form >= 8.5) {
    score += 5;
    reasons.push('Outstanding form');
  } else if (form >= 7.5) {
    score += 4;
    reasons.push('Excellent form');
  } else if (form >= 6.5) {
    score += 2;
    reasons.push('Good form');
  } else if (form >= 5.5) {
    score += 1;
    reasons.push('Average form');
  } else {
    // Struggling players - still get some interest but less
    score += 0;
    if (isOnTransferList) {
      score += 1; // Slightly more interest if already listed
      reasons.push('Available (listed)');
    }
  }
  
  // 2. RELATIVE QUALITY (30% weight)
  // Compare player's ability to the bidding team's squad average
  const playerAbility = player.current_ability || 10;
  const teamAvgAbility = analysis.averageRating;
  
  if (playerAbility > teamAvgAbility + 3) {
    score += 4;
    reasons.push('Significant upgrade');
  } else if (playerAbility > teamAvgAbility + 1) {
    score += 3;
    reasons.push('Quality improvement');
  } else if (playerAbility > teamAvgAbility) {
    score += 2;
    reasons.push('Slight improvement');
  } else if (playerAbility >= teamAvgAbility - 1) {
    score += 1;
    reasons.push('Depth option');
  }
  // If player is worse than team average, no score bonus
  
  // 3. POSITION NEED (20% weight)
  if (analysis.weakPositions.includes(player.position)) {
    score += 3;
    reasons.push(`Need ${player.position}`);
  }
  
  // 4. BREAKOUT BONUS: Young player in great form
  if (player.age < 23 && form >= 7.5) {
    score += 2;
    reasons.push('Young talent');
  }
  
  return { 
    score, 
    reason: reasons.length > 0 ? reasons.join(', ') : 'General interest' 
  };
}

/**
 * Determine offer amount based on form and value
 */
function calculateOfferAmount(player: Player, baseValue: number): number {
  const form = player.form || 6.0;
  
  // Offer multiplier based on form
  let multiplier: number;
  if (form >= 8.5) {
    // Hot player - premium offers (100-130% of value)
    multiplier = 1.0 + Math.random() * 0.3;
  } else if (form >= 7.0) {
    // Good form - fair to good offers (90-115% of value)
    multiplier = 0.9 + Math.random() * 0.25;
  } else if (form >= 5.5) {
    // Average form - standard offers (80-100% of value)
    multiplier = 0.8 + Math.random() * 0.2;
  } else {
    // Struggling form - lowball offers (60-85% of value)
    multiplier = 0.6 + Math.random() * 0.25;
  }
  
  return Math.round(baseValue * multiplier);
}

/**
 * Generate AI bids for user's players
 * Called during week simulation
 * 
 * Uses PERFORMANCE-BASED scouting (not static ability thresholds)
 */
export function generateAIOffersForUserPlayers(
  teams: Team[],
  managedTeamId: string,
  currentWeek: number,
  existingOffers: IncomingOffer[] = [],
  transferListedPlayerIds: string[] = []
): IncomingOffer[] {
  const newOffers: IncomingOffer[] = [];
  
  // Find user's team
  const userTeam = teams.find(t => t.id === managedTeamId);
  if (!userTeam || !userTeam.squad) return newOffers;
  
  // Get AI teams that might be interested in buying
  const aiTeams = teams.filter(t => t.id !== managedTeamId);
  
  // Base offer chance: 35% per week (slightly increased for more activity)
  const offerChance = 0.35;
  if (Math.random() > offerChance) return newOffers;
  
  const maxOffersThisWeek = Math.floor(1 + Math.random() * 2); // 1-2 offers max
  
  // Filter out players that already have pending offers
  const pendingOfferPlayerIds = existingOffers
    .filter(o => o.status === 'pending')
    .map(o => o.playerId);
  
  // All players can potentially receive offers (no static ability filter!)
  // The interest score will determine which players actually get offers
  const availablePlayers = userTeam.squad.filter(p => 
    !pendingOfferPlayerIds.includes(p.id)
  );
  
  if (availablePlayers.length === 0) return newOffers;
  
  // Score each player based on attractiveness to AI teams
  interface ScoredPlayer {
    player: Player;
    bestTeam: Team | null;
    score: number;
    reason: string;
    isListed: boolean;
  }
  
  const scoredPlayers: ScoredPlayer[] = availablePlayers.map(player => {
    const isListed = transferListedPlayerIds.includes(player.id);
    let bestTeam: Team | null = null;
    let bestScore = 0;
    let bestReason = '';
    
    // Find the most interested AI team
    for (const team of aiTeams) {
      const playerValue = calculatePlayerValue(player);
      const canAfford = (team.budget || team.transfer_budget || 5000000) >= playerValue * 0.6;
      
      if (!canAfford) continue;
      
      const { score, reason } = calculateInterestScore(player, team, isListed);
      if (score > bestScore) {
        bestScore = score;
        bestTeam = team;
        bestReason = reason;
      }
    }
    
    return { player, bestTeam, score: bestScore, reason: bestReason, isListed };
  });
  
  // Sort by interest score (highest first)
  scoredPlayers.sort((a, b) => {
    // Listed players with struggling form get priority from lower teams
    if (a.isListed && a.player.form < 5.5 && !b.isListed) return -1;
    if (b.isListed && b.player.form < 5.5 && !a.isListed) return 1;
    return b.score - a.score;
  });
  
  // Generate offers for top scoring players
  // Minimum interest score threshold: 3 (ensures some genuine interest)
  const eligiblePlayers = scoredPlayers.filter(sp => sp.score >= 3 && sp.bestTeam);
  
  for (let i = 0; i < Math.min(maxOffersThisWeek, eligiblePlayers.length); i++) {
    const { player, bestTeam, reason } = eligiblePlayers[i];
    if (!bestTeam) continue;
    
    const playerValue = calculatePlayerValue(player);
    const offerAmount = calculateOfferAmount(player, playerValue);
    
    const offer: IncomingOffer = {
      id: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId: player.id,
      playerName: player.name,
      playerPosition: player.position,
      playerOverall: player.current_ability || 10,
      playerForm: player.form || 6.0,
      fromTeamId: bestTeam.id,
      fromTeamName: bestTeam.name,
      offerAmount,
      playerValue,
      week: currentWeek,
      status: 'pending',
      createdAt: Date.now(),
      expiresInWeeks: 2, // Offer expires after 2 weeks
    };
    
    newOffers.push(offer);
  }
  
  return newOffers;
}

/**
 * Process expired offers
 */
export function processExpiredOffers(
  offers: IncomingOffer[],
  currentWeek: number
): IncomingOffer[] {
  return offers.map(offer => {
    if (offer.status === 'pending') {
      const weeksOld = currentWeek - offer.week;
      if (weeksOld >= offer.expiresInWeeks) {
        return { ...offer, status: 'expired' as const };
      }
    }
    return offer;
  });
}

