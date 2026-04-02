/**
 * useFinances Hook
 * Handles all financial operations: attendance, revenue, expenses, upgrades
 */

import { Team, Player } from '../context/GameContext';

// Upgrade costs and limits
export const STADIUM_UPGRADE_COST = 500000;    // £500k per 1,000 seats
export const STADIUM_UPGRADE_AMOUNT = 1000;    // +1,000 seats per upgrade
export const STADIUM_MAX_CAPACITY = 120000;    // Max 120k capacity

export const FACILITY_UPGRADE_COST = 500000;   // £500k per level
export const FACILITY_UPGRADE_AMOUNT = 1;      // +1 rating per upgrade
export const FACILITY_MAX_LEVEL = 20;          // Max 20 rating

export interface WeeklyFinances {
  matchRevenue: number;
  sponsorshipIncome: number;
  totalIncome: number;
  wageExpenses: number;
  staffExpenses: number;
  totalExpenses: number;
  netChange: number;
}

/**
 * Calculate match attendance based on ticket price, fan base, and team form
 * Higher prices = lower attendance, lower prices = higher attendance
 */
export function calculateAttendance(team: Team, isHomeMatch: boolean): number {
  if (!isHomeMatch) return 0; // No revenue from away matches
  
  const baseAttendance = Math.min(team.fan_base, team.stadium_capacity);
  
  // Price factor: ticket_price of 40 = 1.0, higher = lower attendance
  const priceFactor = 1 / (1 + (team.ticket_price - 40) / 100);
  
  // Form factor: form 6 = 1.0 (average), form 10 = 1.16, form 1 = 0.84
  // Form is now on 1-10 scale
  const avgForm = team.squad.reduce((sum, p) => sum + p.form, 0) / Math.max(1, team.squad.length);
  const formFactor = 0.8 + (avgForm / 25);
  
  // Random variance ±10%
  const variance = 0.9 + Math.random() * 0.2;
  
  const attendance = Math.floor(baseAttendance * priceFactor * formFactor * variance);
  return Math.max(0, Math.min(attendance, team.stadium_capacity));
}

/**
 * Calculate weekly finances for a team
 * Returns income and expenses breakdown
 */
export function calculateWeeklyFinances(
  team: Team, 
  hadHomeMatch: boolean, 
  attendance: number
): WeeklyFinances {
  // Income
  const matchRevenue = hadHomeMatch ? attendance * team.ticket_price : 0;
  const sponsorshipIncome = team.sponsorship_monthly / 4; // Weekly portion
  const totalIncome = matchRevenue + sponsorshipIncome;
  
  // Expenses
  const wageExpenses = team.squad.reduce((sum, player) => sum + player.wage, 0);
  const staffExpenses = team.staff_costs_weekly;
  const totalExpenses = wageExpenses + staffExpenses;
  
  return {
    matchRevenue,
    sponsorshipIncome,
    totalIncome,
    wageExpenses,
    staffExpenses,
    totalExpenses,
    netChange: totalIncome - totalExpenses,
  };
}

/**
 * Apply weekly financial changes to a team
 */
export function applyWeeklyFinances(
  team: Team, 
  hadHomeMatch: boolean, 
  attendance: number
): Team {
  const finances = calculateWeeklyFinances(team, hadHomeMatch, attendance);
  
  // Initialize finances if not present
  const currentFinances = team.finances || {
    season_income: 0,
    season_expenses: 0,
    season_match_revenue: 0,
    season_sponsorship: 0,
    season_wages: 0,
    season_staff_costs: 0,
  };
  
  return {
    ...team,
    budget: team.budget + finances.netChange,
    finances: {
      season_income: currentFinances.season_income + finances.totalIncome,
      season_expenses: currentFinances.season_expenses + finances.totalExpenses,
      season_match_revenue: currentFinances.season_match_revenue + finances.matchRevenue,
      season_sponsorship: currentFinances.season_sponsorship + finances.sponsorshipIncome,
      season_wages: currentFinances.season_wages + finances.wageExpenses,
      season_staff_costs: currentFinances.season_staff_costs + finances.staffExpenses,
      last_match_attendance: hadHomeMatch ? attendance : currentFinances.last_match_attendance,
      last_match_revenue: hadHomeMatch ? finances.matchRevenue : currentFinances.last_match_revenue,
    },
  };
}

/**
 * Calculate total weekly wages for a squad
 */
export function calculateTotalWages(squad: Player[]): number {
  return squad.reduce((sum, player) => sum + player.wage, 0);
}

/**
 * Check if team can afford a stadium upgrade
 */
export function canUpgradeStadium(team: Team): { canUpgrade: boolean; reason?: string } {
  if (team.stadium_capacity >= STADIUM_MAX_CAPACITY) {
    return { canUpgrade: false, reason: 'Stadium is at maximum capacity' };
  }
  if (team.budget < STADIUM_UPGRADE_COST) {
    return { canUpgrade: false, reason: 'Insufficient budget' };
  }
  return { canUpgrade: true };
}

/**
 * Check if team can afford a facility upgrade
 */
export function canUpgradeFacilities(team: Team): { canUpgrade: boolean; reason?: string } {
  if (team.youth_facilities >= FACILITY_MAX_LEVEL) {
    return { canUpgrade: false, reason: 'Facilities are at maximum level' };
  }
  if (team.budget < FACILITY_UPGRADE_COST) {
    return { canUpgrade: false, reason: 'Insufficient budget' };
  }
  return { canUpgrade: true };
}
