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
 * Calculate a player's market value
 */
function calculatePlayerValue(player: Player): number {
  const overall = player.overall || player.current_ability || 50;
  const baseValue = overall * 50000;
  const ageMultiplier = player.age < 24 ? 1.5 : player.age > 30 ? 0.6 : 1.0;
  const positionMultiplier = ['ST', 'LW', 'RW', 'AM', 'CF'].includes(player.position) ? 1.3 : 1.0;
  return Math.round(baseValue * ageMultiplier * positionMultiplier);
}

/**
 * Generate AI bids for user's players
 * Called during week simulation
 */
export function generateAIOffersForUserPlayers(
  teams: Team[],
  managedTeamId: string,
  currentWeek: number,
  existingOffers: IncomingOffer[] = []
): IncomingOffer[] {
  const newOffers: IncomingOffer[] = [];
  
  // Find user's team
  const userTeam = teams.find(t => t.id === managedTeamId);
  if (!userTeam || !userTeam.squad) return newOffers;
  
  // Get AI teams that might be interested in buying
  const aiTeams = teams.filter(t => t.id !== managedTeamId);
  
  // Limit number of offers per week (1-3 max, with probability)
  const offerChance = 0.3; // 30% chance of getting an offer each week
  if (Math.random() > offerChance) return newOffers;
  
  const maxOffersThisWeek = Math.floor(1 + Math.random() * 2); // 1-2 offers max
  
  // Filter out players that already have pending offers
  const pendingOfferPlayerIds = existingOffers
    .filter(o => o.status === 'pending')
    .map(o => o.playerId);
  
  const availablePlayers = userTeam.squad.filter(p => 
    !pendingOfferPlayerIds.includes(p.id) &&
    p.overall >= 60 // Only bid for decent players
  );
  
  if (availablePlayers.length === 0) return newOffers;
  
  // Sort players by attractiveness (higher overall = more interest)
  const sortedPlayers = [...availablePlayers].sort((a, b) => 
    (b.overall || 0) - (a.overall || 0)
  );
  
  // Generate offers
  for (let i = 0; i < Math.min(maxOffersThisWeek, sortedPlayers.length); i++) {
    const player = sortedPlayers[i];
    const playerValue = calculatePlayerValue(player);
    
    // Find an AI team that needs this position and can afford the player
    const interestedTeams = aiTeams.filter(team => {
      const analysis = analyzeSquad(team);
      const needsPosition = analysis.weakPositions.includes(player.position);
      const canAfford = (team.transfer_budget || 5000000) >= playerValue * 0.8;
      const betterThanAverage = (player.overall || 50) > analysis.averageRating;
      
      return (needsPosition || betterThanAverage) && canAfford;
    });
    
    if (interestedTeams.length === 0) continue;
    
    // Pick a random interested team
    const biddingTeam = interestedTeams[Math.floor(Math.random() * interestedTeams.length)];
    
    // Generate offer amount (80% to 120% of value, AI tries to get a deal)
    const offerMultiplier = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    const offerAmount = Math.round(playerValue * offerMultiplier);
    
    const offer: IncomingOffer = {
      id: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId: player.id,
      playerName: player.name,
      playerPosition: player.position,
      playerOverall: player.overall || 50,
      fromTeamId: biddingTeam.id,
      fromTeamName: biddingTeam.name,
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

