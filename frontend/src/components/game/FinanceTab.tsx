import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatValue, formatCompactValue } from '../../utils/formatters';
import { gameStyles as styles } from './gameStyles';
import { StyleSheet } from 'react-native';
import { useGame } from '../../context/GameContext';
import { FFP_TIERS, FFPStatus } from '../../utils/ffp';

interface FinanceTabProps {
  team: any;
  save: any;
}

// Upgrade constants (must match GameContext)
const STADIUM_UPGRADE_COST = 500000;
const STADIUM_MAX_CAPACITY = 120000;
const FACILITY_UPGRADE_COST = 500000;
const FACILITY_MAX_LEVEL = 20;

export function FinanceTab({ team, save }: FinanceTabProps) {
  const { updateTicketPrice, upgradeStadium, upgradeYouthFacilities, upgradeTrainingFacilities } = useGame();
  const currency = save?.currency_symbol || '£';
  const [ticketInput, setTicketInput] = useState(team?.ticket_price?.toString() || '40');
  
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
  const totalWeeks = 38;
  const weeklyAvgIncome = currentWeek > 0 ? finances.season_income / currentWeek : 0;
  const weeklyAvgExpenses = currentWeek > 0 ? finances.season_expenses / currentWeek : 0;
  
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
  const netProfitLoss = finances.season_income - finances.season_expenses;
  const isProfit = netProfitLoss >= 0;

  // Handle ticket price update
  const handleTicketPriceUpdate = () => {
    const newPrice = parseInt(ticketInput, 10);
    if (isNaN(newPrice) || newPrice < 1 || newPrice > 999) {
      Alert.alert('Invalid Price', 'Ticket price must be between 1 and 999');
      setTicketInput(team?.ticket_price?.toString() || '40');
      return;
    }
    updateTicketPrice(newPrice);
  };

  // Handle upgrades
  const handleStadiumUpgrade = () => {
    if (team?.stadium_capacity >= STADIUM_MAX_CAPACITY) {
      Alert.alert('Maximum Reached', 'Stadium is at maximum capacity!');
      return;
    }
    if (team?.budget < STADIUM_UPGRADE_COST) {
      Alert.alert('Insufficient Funds', `You need ${formatValue(STADIUM_UPGRADE_COST, currency)} to upgrade the stadium.`);
      return;
    }
    const success = upgradeStadium();
    if (success) {
      Alert.alert('Stadium Upgraded!', '+1,000 capacity added.');
    }
  };

  const handleYouthUpgrade = () => {
    if (team?.youth_facilities >= FACILITY_MAX_LEVEL) {
      Alert.alert('Maximum Reached', 'Youth facilities are at maximum level!');
      return;
    }
    if (team?.budget < FACILITY_UPGRADE_COST) {
      Alert.alert('Insufficient Funds', `You need ${formatValue(FACILITY_UPGRADE_COST, currency)} to upgrade youth facilities.`);
      return;
    }
    const success = upgradeYouthFacilities();
    if (success) {
      Alert.alert('Youth Facilities Upgraded!', '+1 rating added.');
    }
  };

  const handleTrainingUpgrade = () => {
    if (team?.training_facilities >= FACILITY_MAX_LEVEL) {
      Alert.alert('Maximum Reached', 'Training facilities are at maximum level!');
      return;
    }
    if (team?.budget < FACILITY_UPGRADE_COST) {
      Alert.alert('Insufficient Funds', `You need ${formatValue(FACILITY_UPGRADE_COST, currency)} to upgrade training facilities.`);
      return;
    }
    const success = upgradeTrainingFacilities();
    if (success) {
      Alert.alert('Training Facilities Upgraded!', '+1 rating added.');
    }
  };

  // Can afford checks
  const canAffordStadium = (team?.budget || 0) >= STADIUM_UPGRADE_COST && (team?.stadium_capacity || 0) < STADIUM_MAX_CAPACITY;
  const canAffordYouth = (team?.budget || 0) >= FACILITY_UPGRADE_COST && (team?.youth_facilities || 0) < FACILITY_MAX_LEVEL;
  const canAffordTraining = (team?.budget || 0) >= FACILITY_UPGRADE_COST && (team?.training_facilities || 0) < FACILITY_MAX_LEVEL;

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

      {/* Ticket Price Control */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TICKET PRICING</Text>
        <View style={financeStyles.ticketCard}>
          <View style={financeStyles.ticketHeader}>
            <Ionicons name="ticket" size={24} color="#ffcc00" />
            <Text style={financeStyles.ticketTitle}>Match Day Ticket Price</Text>
          </View>
          <View style={financeStyles.ticketInputRow}>
            <Text style={financeStyles.currencySymbol}>{currency}</Text>
            <TextInput
              style={financeStyles.ticketInput}
              value={ticketInput}
              onChangeText={setTicketInput}
              keyboardType="numeric"
              maxLength={3}
              onBlur={handleTicketPriceUpdate}
              onSubmitEditing={handleTicketPriceUpdate}
            />
            <TouchableOpacity 
              style={financeStyles.ticketButton}
              onPress={handleTicketPriceUpdate}
            >
              <Text style={financeStyles.ticketButtonText}>SET</Text>
            </TouchableOpacity>
          </View>
          <Text style={financeStyles.ticketHint}>
            Higher prices = more revenue, lower attendance
          </Text>
          <View style={financeStyles.ticketImpact}>
            <Text style={financeStyles.ticketImpactLabel}>Current Price:</Text>
            <Text style={financeStyles.ticketImpactValue}>{currency}{team?.ticket_price || 40}</Text>
          </View>
        </View>
      </View>

      {/* Facility Upgrades */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FACILITY UPGRADES</Text>
        
        {/* Stadium */}
        <View style={financeStyles.upgradeCard}>
          <View style={financeStyles.upgradeHeader}>
            <Ionicons name="business" size={24} color="#a55eea" />
            <View style={financeStyles.upgradeInfo}>
              <Text style={financeStyles.upgradeName}>Stadium Capacity</Text>
              <Text style={financeStyles.upgradeLevel}>
                {(team?.stadium_capacity || 0).toLocaleString()} / {STADIUM_MAX_CAPACITY.toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={financeStyles.upgradeBar}>
            <View style={[financeStyles.upgradeBarFill, { 
              width: `${((team?.stadium_capacity || 0) / STADIUM_MAX_CAPACITY) * 100}%`,
              backgroundColor: '#a55eea'
            }]} />
          </View>
          <TouchableOpacity 
            style={[financeStyles.upgradeButton, !canAffordStadium && financeStyles.upgradeButtonDisabled]}
            onPress={handleStadiumUpgrade}
            disabled={!canAffordStadium}
          >
            <Text style={financeStyles.upgradeButtonText}>
              +1,000 Seats • {formatValue(STADIUM_UPGRADE_COST, currency)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Youth Facilities */}
        <View style={financeStyles.upgradeCard}>
          <View style={financeStyles.upgradeHeader}>
            <Ionicons name="school" size={24} color="#4a9eff" />
            <View style={financeStyles.upgradeInfo}>
              <Text style={financeStyles.upgradeName}>Youth Facilities</Text>
              <Text style={financeStyles.upgradeLevel}>
                Level {team?.youth_facilities || 0} / {FACILITY_MAX_LEVEL}
              </Text>
            </View>
          </View>
          <View style={financeStyles.upgradeBar}>
            <View style={[financeStyles.upgradeBarFill, { 
              width: `${((team?.youth_facilities || 0) / FACILITY_MAX_LEVEL) * 100}%`,
              backgroundColor: '#4a9eff'
            }]} />
          </View>
          <TouchableOpacity 
            style={[financeStyles.upgradeButton, !canAffordYouth && financeStyles.upgradeButtonDisabled]}
            onPress={handleYouthUpgrade}
            disabled={!canAffordYouth}
          >
            <Text style={financeStyles.upgradeButtonText}>
              +1 Level • {formatValue(FACILITY_UPGRADE_COST, currency)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Training Facilities */}
        <View style={financeStyles.upgradeCard}>
          <View style={financeStyles.upgradeHeader}>
            <Ionicons name="fitness" size={24} color="#00ff88" />
            <View style={financeStyles.upgradeInfo}>
              <Text style={financeStyles.upgradeName}>Training Facilities</Text>
              <Text style={financeStyles.upgradeLevel}>
                Level {team?.training_facilities || 0} / {FACILITY_MAX_LEVEL}
              </Text>
            </View>
          </View>
          <View style={financeStyles.upgradeBar}>
            <View style={[financeStyles.upgradeBarFill, { 
              width: `${((team?.training_facilities || 0) / FACILITY_MAX_LEVEL) * 100}%`,
              backgroundColor: '#00ff88'
            }]} />
          </View>
          <TouchableOpacity 
            style={[financeStyles.upgradeButton, !canAffordTraining && financeStyles.upgradeButtonDisabled]}
            onPress={handleTrainingUpgrade}
            disabled={!canAffordTraining}
          >
            <Text style={financeStyles.upgradeButtonText}>
              +1 Level • {formatValue(FACILITY_UPGRADE_COST, currency)}
            </Text>
          </TouchableOpacity>
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

      {/* Sponsor Deals */}
      {team?.sponsors && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SPONSOR DEALS (Annual)</Text>
          <View style={financeStyles.breakdownCard}>
            {/* Kit Manufacturer */}
            <View style={financeStyles.sponsorRow}>
              <View style={financeStyles.sponsorInfo}>
                <Ionicons name="shirt" size={18} color="#4a9eff" />
                <View style={financeStyles.sponsorText}>
                  <Text style={financeStyles.sponsorName}>{team.sponsors.kit_manufacturer.name}</Text>
                  <Text style={financeStyles.sponsorType}>Kit Manufacturer • {team.sponsors.kit_manufacturer.tier}</Text>
                </View>
              </View>
              <Text style={financeStyles.sponsorValue}>
                {formatValue(team.sponsors.kit_manufacturer.annual, currency)}/yr
              </Text>
            </View>

            {/* Main Shirt Sponsor */}
            <View style={financeStyles.sponsorRow}>
              <View style={financeStyles.sponsorInfo}>
                <Ionicons name="pricetag" size={18} color="#ff9f43" />
                <View style={financeStyles.sponsorText}>
                  <Text style={financeStyles.sponsorName}>{team.sponsors.main_shirt.name}</Text>
                  <Text style={financeStyles.sponsorType}>Shirt Sponsor • {team.sponsors.main_shirt.tier}</Text>
                </View>
              </View>
              <Text style={financeStyles.sponsorValue}>
                {formatValue(team.sponsors.main_shirt.annual, currency)}/yr
              </Text>
            </View>

            {/* Sleeve Sponsor (if available) */}
            {team.sponsors.sleeve && (
              <View style={financeStyles.sponsorRow}>
                <View style={financeStyles.sponsorInfo}>
                  <Ionicons name="hand-left" size={18} color="#a55eea" />
                  <View style={financeStyles.sponsorText}>
                    <Text style={financeStyles.sponsorName}>{team.sponsors.sleeve.name}</Text>
                    <Text style={financeStyles.sponsorType}>Sleeve Sponsor • {team.sponsors.sleeve.tier}</Text>
                  </View>
                </View>
                <Text style={financeStyles.sponsorValue}>
                  {formatValue(team.sponsors.sleeve.annual, currency)}/yr
                </Text>
              </View>
            )}

            {/* Stadium Naming (if available) */}
            {team.sponsors.stadium_naming && (
              <View style={financeStyles.sponsorRow}>
                <View style={financeStyles.sponsorInfo}>
                  <Ionicons name="business" size={18} color="#00ff88" />
                  <View style={financeStyles.sponsorText}>
                    <Text style={financeStyles.sponsorName}>{team.sponsors.stadium_naming.name}</Text>
                    <Text style={financeStyles.sponsorType}>Stadium Naming • {team.sponsors.stadium_naming.tier}</Text>
                  </View>
                </View>
                <Text style={financeStyles.sponsorValue}>
                  {formatValue(team.sponsors.stadium_naming.annual, currency)}/yr
                </Text>
              </View>
            )}

            {/* Training Ground (if available) */}
            {team.sponsors.training_ground && (
              <View style={financeStyles.sponsorRow}>
                <View style={financeStyles.sponsorInfo}>
                  <Ionicons name="fitness" size={18} color="#ffcc00" />
                  <View style={financeStyles.sponsorText}>
                    <Text style={financeStyles.sponsorName}>{team.sponsors.training_ground.name}</Text>
                    <Text style={financeStyles.sponsorType}>Training Ground • {team.sponsors.training_ground.tier}</Text>
                  </View>
                </View>
                <Text style={financeStyles.sponsorValue}>
                  {formatValue(team.sponsors.training_ground.annual, currency)}/yr
                </Text>
              </View>
            )}

            {/* Official Partners (if available) */}
            {team.sponsors.official_partners && (
              <View style={financeStyles.sponsorRow}>
                <View style={financeStyles.sponsorInfo}>
                  <Ionicons name="globe" size={18} color="#4a9eff" />
                  <View style={financeStyles.sponsorText}>
                    <Text style={financeStyles.sponsorName}>{team.sponsors.official_partners.count} Official Partners</Text>
                    <Text style={financeStyles.sponsorType}>{team.sponsors.official_partners.tier} Tier</Text>
                  </View>
                </View>
                <Text style={financeStyles.sponsorValue}>
                  {formatValue(team.sponsors.official_partners.annual, currency)}/yr
                </Text>
              </View>
            )}

            <View style={financeStyles.breakdownDivider} />
            <View style={financeStyles.breakdownRow}>
              <Text style={financeStyles.breakdownTotalLabel}>Total Annual Sponsorship</Text>
              <Text style={[financeStyles.breakdownValue, { color: '#00ff88' }]}>
                {formatValue(team.sponsors.total_annual, currency)}/yr
              </Text>
            </View>
            <View style={financeStyles.breakdownRow}>
              <Text style={financeStyles.breakdownLabel}>Monthly Income</Text>
              <Text style={financeStyles.breakdownValue}>
                {formatValue(team.sponsorship_monthly, currency)}/mo
              </Text>
            </View>
          </View>
        </View>
      )}

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
        {(() => {
          const ffpStatus = (team?.ffp?.status || 'healthy') as FFPStatus;
          const ffpTier = FFP_TIERS[ffpStatus];
          const actualWageRatio = team?.ffp?.wage_ratio || wageRatio;
          
          return (
            <View style={[financeStyles.ffpCard, { borderColor: ffpTier.color }]}>
              <View style={financeStyles.ffpHeader}>
                <Ionicons name={ffpTier.icon as any} size={28} color={ffpTier.color} />
                <View style={financeStyles.ffpHeaderText}>
                  <Text style={[financeStyles.ffpStatus, { color: ffpTier.color }]}>
                    {ffpTier.label}
                  </Text>
                  <Text style={financeStyles.ffpSubtext}>
                    {ffpTier.description}
                  </Text>
                </View>
                <Text style={[financeStyles.ffpRatio, { color: ffpTier.color }]}>
                  {isFinite(actualWageRatio) ? actualWageRatio.toFixed(0) : '0'}%
                </Text>
              </View>
              
              <View style={financeStyles.ffpBar}>
                <View style={[financeStyles.ffpBarFill, { 
                  width: `${Math.min(isFinite(actualWageRatio) ? actualWageRatio : 0, 100)}%`,
                  backgroundColor: ffpTier.color 
                }]} />
                <View style={[financeStyles.ffpThreshold, { left: '60%' }]} />
                <View style={[financeStyles.ffpThreshold, { left: '70%' }]} />
                <View style={[financeStyles.ffpThreshold, { left: '80%' }]} />
              </View>
              <View style={financeStyles.ffpLegend}>
                <Text style={financeStyles.ffpLegendText}>0%</Text>
                <Text style={[financeStyles.ffpLegendText, { color: '#00ff88' }]}>60%</Text>
                <Text style={[financeStyles.ffpLegendText, { color: '#ffcc00' }]}>70%</Text>
                <Text style={[financeStyles.ffpLegendText, { color: '#ff9f43' }]}>80%</Text>
                <Text style={[financeStyles.ffpLegendText, { color: '#ff4757' }]}>100%</Text>
              </View>
              
              {/* Consequences */}
              {ffpStatus !== 'healthy' && (
                <View style={financeStyles.ffpConsequences}>
                  <Text style={financeStyles.ffpConsequencesTitle}>Current Restrictions:</Text>
                  {ffpTier.consequences.map((consequence, idx) => (
                    <View key={idx} style={financeStyles.ffpConsequenceRow}>
                      <Ionicons name="alert" size={12} color={ffpTier.color} />
                      <Text style={[financeStyles.ffpConsequenceText, { color: ffpTier.color }]}>
                        {consequence}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Transfer Restriction Badge */}
              {ffpTier.transferRestriction > 0 && (
                <View style={[financeStyles.ffpBadge, { backgroundColor: ffpTier.color }]}>
                  <Ionicons name="lock-closed" size={14} color="#fff" />
                  <Text style={financeStyles.ffpBadgeText}>
                    {ffpTier.transferRestriction === 1 
                      ? 'Transfer Embargo Active' 
                      : 'Transfer Budget Capped 50%'}
                  </Text>
                </View>
              )}
            </View>
          );
        })()}
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
  ticketCard: {
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  ticketInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffcc00',
  },
  ticketInput: {
    flex: 1,
    backgroundColor: '#1a3a5c',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    minWidth: 80,
  },
  ticketButton: {
    backgroundColor: '#4a9eff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  ticketButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  ticketHint: {
    fontSize: 12,
    color: '#6a8aaa',
    textAlign: 'center',
    marginBottom: 12,
  },
  ticketImpact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1a3a5c',
    padding: 12,
    borderRadius: 6,
  },
  ticketImpactLabel: {
    fontSize: 13,
    color: '#8aa8c8',
  },
  ticketImpactValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffcc00',
  },
  upgradeCard: {
    backgroundColor: '#0d2137',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a4a6c',
    marginBottom: 12,
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  upgradeInfo: {
    flex: 1,
  },
  upgradeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  upgradeLevel: {
    fontSize: 12,
    color: '#6a8aaa',
    marginTop: 2,
  },
  upgradeBar: {
    height: 8,
    backgroundColor: '#1a3a5c',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  upgradeBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  upgradeButton: {
    backgroundColor: '#2a5a8c',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonDisabled: {
    backgroundColor: '#1a3a5c',
    opacity: 0.5,
  },
  upgradeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
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
  // Sponsor styles
  sponsorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5c',
  },
  sponsorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  sponsorText: {
    flex: 1,
  },
  sponsorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  sponsorType: {
    fontSize: 11,
    color: '#6a8aaa',
    marginTop: 2,
  },
  sponsorValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00ff88',
  },
  // FFP Consequences styles
  ffpConsequences: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a3a5c',
  },
  ffpConsequencesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8aa8c8',
    marginBottom: 8,
  },
  ffpConsequenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  ffpConsequenceText: {
    fontSize: 11,
    flex: 1,
  },
  ffpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 10,
    borderRadius: 6,
    justifyContent: 'center',
  },
  ffpBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});
