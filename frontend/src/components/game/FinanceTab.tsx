import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatValue, formatCompactValue } from '../../utils/formatters';
import { gameStyles as styles } from './gameStyles';
import { StyleSheet } from 'react-native';

interface FinanceTabProps {
  team: any;
  save: any;
}

export function FinanceTab({ team, save }: FinanceTabProps) {
  const currency = save?.currency_symbol || '£';
  const finances = team?.finances || {
    season_income: 0,
    season_expenses: 0,
    season_match_revenue: 0,
    season_sponsorship: 0,
    season_wages: 0,
    season_staff_costs: 0,
    last_match_attendance: 0,
    last_match_revenue: 0,
  };

  // Calculate weekly averages and projections
  const league = save?.leagues?.[0];
  const currentWeek = league?.current_week || 1;
  const totalWeeks = 38; // Full season
  const weeklyAvgIncome = currentWeek > 0 ? finances.season_income / currentWeek : 0;
  const weeklyAvgExpenses = currentWeek > 0 ? finances.season_expenses / currentWeek : 0;
  const projectedSeasonProfit = (weeklyAvgIncome - weeklyAvgExpenses) * totalWeeks;
  
  // Calculate wage-to-revenue ratio for FFP
  const weeklyWages = team?.squad?.reduce((sum: number, p: any) => sum + (p.wage || 0), 0) || 0;
  const weeklyRevenue = weeklyAvgIncome || 1;
  const wageRatio = (weeklyWages / weeklyRevenue) * 100;
  
  const getWageRatioStatus = (ratio: number) => {
    if (ratio < 60) return { color: '#00ff88', status: 'Healthy', icon: 'checkmark-circle' };
    if (ratio < 70) return { color: '#ffcc00', status: 'Warning', icon: 'warning' };
    if (ratio < 80) return { color: '#ff9f43', status: 'Caution', icon: 'alert-circle' };
    return { color: '#ff4757', status: 'Critical', icon: 'close-circle' };
  };
  
  const wageStatus = getWageRatioStatus(wageRatio);

  // Net profit/loss
  const netProfitLoss = finances.season_income - finances.season_expenses;
  const isProfit = netProfitLoss >= 0;

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Current Balance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CURRENT BALANCE</Text>
        <View style={financeStyles.balanceCard}>
          <Ionicons name="wallet" size={32} color="#00ff88" />
          <Text style={financeStyles.balanceValue}>
            {formatValue(team?.budget || 0, currency)}
          </Text>
          <Text style={financeStyles.balanceLabel}>Available Funds</Text>
        </View>
      </View>

      {/* Season Overview Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SEASON OVERVIEW (Week {currentWeek})</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#00ff88', fontSize: 18 }]}>
              {formatCompactValue(finances.season_income, currency)}
            </Text>
            <Text style={styles.statLabel}>Income</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#ff6b6b', fontSize: 18 }]}>
              {formatCompactValue(finances.season_expenses, currency)}
            </Text>
            <Text style={styles.statLabel}>Expenses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: isProfit ? '#00ff88' : '#ff6b6b', fontSize: 18 }]}>
              {isProfit ? '+' : ''}{formatCompactValue(netProfitLoss, currency)}
            </Text>
            <Text style={styles.statLabel}>Net P&L</Text>
          </View>
        </View>
      </View>

      {/* Income Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INCOME BREAKDOWN</Text>
        <View style={financeStyles.breakdownCard}>
          <View style={financeStyles.breakdownRow}>
            <View style={financeStyles.breakdownLeft}>
              <Ionicons name="football" size={20} color="#4a9eff" />
              <Text style={financeStyles.breakdownLabel}>Match Day Revenue</Text>
            </View>
            <Text style={financeStyles.breakdownValue}>
              {formatValue(finances.season_match_revenue, currency)}
            </Text>
          </View>
          <View style={financeStyles.breakdownRow}>
            <View style={financeStyles.breakdownLeft}>
              <Ionicons name="megaphone" size={20} color="#ff9f43" />
              <Text style={financeStyles.breakdownLabel}>Sponsorship</Text>
            </View>
            <Text style={financeStyles.breakdownValue}>
              {formatValue(finances.season_sponsorship, currency)}
            </Text>
          </View>
          <View style={financeStyles.breakdownDivider} />
          <View style={financeStyles.breakdownRow}>
            <Text style={financeStyles.breakdownTotalLabel}>Total Income</Text>
            <Text style={[financeStyles.breakdownValue, { color: '#00ff88' }]}>
              {formatValue(finances.season_income, currency)}
            </Text>
          </View>
        </View>
      </View>

      {/* Expenses Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EXPENSES BREAKDOWN</Text>
        <View style={financeStyles.breakdownCard}>
          <View style={financeStyles.breakdownRow}>
            <View style={financeStyles.breakdownLeft}>
              <Ionicons name="people" size={20} color="#ff6b6b" />
              <Text style={financeStyles.breakdownLabel}>Player Wages</Text>
            </View>
            <Text style={financeStyles.breakdownValue}>
              {formatValue(finances.season_wages, currency)}
            </Text>
          </View>
          <View style={financeStyles.breakdownRow}>
            <View style={financeStyles.breakdownLeft}>
              <Ionicons name="briefcase" size={20} color="#a55eea" />
              <Text style={financeStyles.breakdownLabel}>Staff Costs</Text>
            </View>
            <Text style={financeStyles.breakdownValue}>
              {formatValue(finances.season_staff_costs, currency)}
            </Text>
          </View>
          <View style={financeStyles.breakdownDivider} />
          <View style={financeStyles.breakdownRow}>
            <Text style={financeStyles.breakdownTotalLabel}>Total Expenses</Text>
            <Text style={[financeStyles.breakdownValue, { color: '#ff6b6b' }]}>
              {formatValue(finances.season_expenses, currency)}
            </Text>
          </View>
        </View>
      </View>

      {/* Last Match Stats */}
      {finances.last_match_attendance !== undefined && finances.last_match_attendance > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LAST HOME MATCH</Text>
          <View style={financeStyles.lastMatchCard}>
            <View style={financeStyles.lastMatchStat}>
              <Ionicons name="people" size={24} color="#4a9eff" />
              <Text style={financeStyles.lastMatchValue}>
                {finances.last_match_attendance?.toLocaleString()}
              </Text>
              <Text style={financeStyles.lastMatchLabel}>Attendance</Text>
            </View>
            <View style={financeStyles.lastMatchDivider} />
            <View style={financeStyles.lastMatchStat}>
              <Ionicons name="cash" size={24} color="#00ff88" />
              <Text style={financeStyles.lastMatchValue}>
                {formatValue(finances.last_match_revenue || 0, currency)}
              </Text>
              <Text style={financeStyles.lastMatchLabel}>Revenue</Text>
            </View>
          </View>
        </View>
      )}

      {/* Financial Fair Play Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FINANCIAL FAIR PLAY</Text>
        <View style={[financeStyles.ffpCard, { borderColor: wageStatus.color }]}>
          <View style={financeStyles.ffpHeader}>
            <Ionicons name={wageStatus.icon as any} size={28} color={wageStatus.color} />
            <View style={financeStyles.ffpHeaderText}>
              <Text style={[financeStyles.ffpStatus, { color: wageStatus.color }]}>
                {wageStatus.status}
              </Text>
              <Text style={financeStyles.ffpSubtext}>
                Wage-to-Revenue Ratio
              </Text>
            </View>
            <Text style={[financeStyles.ffpRatio, { color: wageStatus.color }]}>
              {wageRatio.toFixed(0)}%
            </Text>
          </View>
          <View style={financeStyles.ffpBar}>
            <View style={[financeStyles.ffpBarFill, { 
              width: `${Math.min(wageRatio, 100)}%`,
              backgroundColor: wageStatus.color 
            }]} />
            <View style={[financeStyles.ffpThreshold, { left: '60%' }]} />
            <View style={[financeStyles.ffpThreshold, { left: '70%' }]} />
            <View style={[financeStyles.ffpThreshold, { left: '80%' }]} />
          </View>
          <View style={financeStyles.ffpLegend}>
            <Text style={financeStyles.ffpLegendText}>0%</Text>
            <Text style={financeStyles.ffpLegendText}>60%</Text>
            <Text style={financeStyles.ffpLegendText}>70%</Text>
            <Text style={financeStyles.ffpLegendText}>80%</Text>
            <Text style={financeStyles.ffpLegendText}>100%</Text>
          </View>
        </View>
      </View>

      {/* Weekly Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WEEKLY SUMMARY</Text>
        <View style={financeStyles.weeklySummary}>
          <View style={financeStyles.weeklyRow}>
            <Text style={financeStyles.weeklyLabel}>Weekly Wages</Text>
            <Text style={[financeStyles.weeklyValue, { color: '#ff6b6b' }]}>
              -{formatValue(weeklyWages, currency)}
            </Text>
          </View>
          <View style={financeStyles.weeklyRow}>
            <Text style={financeStyles.weeklyLabel}>Weekly Staff Costs</Text>
            <Text style={[financeStyles.weeklyValue, { color: '#ff6b6b' }]}>
              -{formatValue(team?.staff_costs_weekly || 0, currency)}
            </Text>
          </View>
          <View style={financeStyles.weeklyRow}>
            <Text style={financeStyles.weeklyLabel}>Weekly Sponsorship</Text>
            <Text style={[financeStyles.weeklyValue, { color: '#00ff88' }]}>
              +{formatValue((team?.sponsorship_monthly || 0) / 4, currency)}
            </Text>
          </View>
          <View style={financeStyles.weeklyRow}>
            <Text style={financeStyles.weeklyLabel}>Avg Match Revenue</Text>
            <Text style={[financeStyles.weeklyValue, { color: '#00ff88' }]}>
              +{formatValue(currentWeek > 0 ? finances.season_match_revenue / currentWeek : 0, currency)}
            </Text>
          </View>
        </View>
      </View>

      {/* Club Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CLUB PROFILE</Text>
        <View style={financeStyles.clubInfo}>
          <View style={financeStyles.clubInfoRow}>
            <Ionicons name="star" size={18} color="#ffcc00" />
            <Text style={financeStyles.clubInfoLabel}>Reputation</Text>
            <Text style={financeStyles.clubInfoValue}>{team?.reputation || 0}/20</Text>
          </View>
          <View style={financeStyles.clubInfoRow}>
            <Ionicons name="people" size={18} color="#4a9eff" />
            <Text style={financeStyles.clubInfoLabel}>Fan Base</Text>
            <Text style={financeStyles.clubInfoValue}>{(team?.fan_base || 0).toLocaleString()}</Text>
          </View>
          <View style={financeStyles.clubInfoRow}>
            <Ionicons name="business" size={18} color="#a55eea" />
            <Text style={financeStyles.clubInfoLabel}>Stadium Capacity</Text>
            <Text style={financeStyles.clubInfoValue}>{(team?.stadium_capacity || 0).toLocaleString()}</Text>
          </View>
          <View style={financeStyles.clubInfoRow}>
            <Ionicons name="ticket" size={18} color="#00ff88" />
            <Text style={financeStyles.clubInfoLabel}>Ticket Price</Text>
            <Text style={financeStyles.clubInfoValue}>{currency}{team?.ticket_price || 0}</Text>
          </View>
        </View>
      </View>

      {/* Bottom padding */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const financeStyles = StyleSheet.create({
  balanceCard: {
    backgroundColor: '#0d2137',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    alignItems: 'center',
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginTop: 12,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#6a8aaa',
    marginTop: 4,
  },
  breakdownCard: {
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#8aa8c8',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#1a4a6c',
    marginVertical: 8,
  },
  breakdownTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  lastMatchCard: {
    backgroundColor: '#0d2137',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  lastMatchStat: {
    alignItems: 'center',
  },
  lastMatchValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  lastMatchLabel: {
    fontSize: 11,
    color: '#6a8aaa',
    marginTop: 4,
  },
  lastMatchDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#1a4a6c',
  },
  ffpCard: {
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  ffpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ffpHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  ffpStatus: {
    fontSize: 18,
    fontWeight: '800',
  },
  ffpSubtext: {
    fontSize: 11,
    color: '#6a8aaa',
    marginTop: 2,
  },
  ffpRatio: {
    fontSize: 28,
    fontWeight: '800',
  },
  ffpBar: {
    height: 8,
    backgroundColor: '#1a3a5c',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  ffpBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  ffpThreshold: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#fff',
    opacity: 0.3,
  },
  ffpLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  ffpLegendText: {
    fontSize: 9,
    color: '#6a8aaa',
  },
  weeklySummary: {
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  weeklyLabel: {
    fontSize: 13,
    color: '#8aa8c8',
  },
  weeklyValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  clubInfo: {
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  clubInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  clubInfoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#8aa8c8',
  },
  clubInfoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
