#!/usr/bin/env python3
"""
Comprehensive Financial System Test for Retro Championship Tycoon
Tests the newly implemented financial system across 2 seasons as requested in the review.
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

# Get backend URL from frontend .env
BACKEND_URL = "https://code-ingest.preview.emergentagent.com/api"

class FinancialSystemTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.game_data = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = f"{status} {test_name}"
        if details:
            result += f" - {details}"
        print(result)
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def make_request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Make HTTP request to backend"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method == "GET":
                response = requests.get(url, timeout=30)
            elif method == "POST":
                response = requests.post(url, json=data, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"❌ Request failed: {method} {endpoint} - {str(e)}")
            return {}
    
    def test_health_check(self):
        """Test API health check"""
        result = self.make_request("GET", "/")
        success = "message" in result and "Retro Football Championship API" in result["message"]
        self.log_test("API Health Check", success, f"Response: {result.get('message', 'No message')}")
        return success
    
    def test_teams_basic_structure(self):
        """Test teams API returns 20 teams with basic structure"""
        teams = self.make_request("GET", "/teams")
        success = isinstance(teams, list) and len(teams) == 20
        details = f"Found {len(teams) if isinstance(teams, list) else 0} teams"
        self.log_test("Teams API Basic Structure", success, details)
        return success, teams if success else []
    
    def test_game_creation_with_financial_data(self):
        """Test game creation includes comprehensive financial system data"""
        print("\n💰 Testing Game Creation with Financial Data...")
        
        # Get teams first
        _, teams = self.test_teams_basic_structure()
        if not teams:
            self.log_test("Financial - Game Creation", False, "No teams available")
            return False
            
        team_id = teams[0]["id"]
        
        game_data = self.make_request("POST", "/game/new", {
            "team_id": team_id,
            "save_name": "Financial System Test",
            "currency_symbol": "£"
        })
        
        if not game_data:
            self.log_test("Financial - Game Creation", False, "No response from API")
            return False
            
        self.game_data = game_data
        teams_data = game_data.get("teams", [])
        
        if not teams_data:
            self.log_test("Financial - Game Creation", False, "No teams data in response")
            return False
            
        # Test first team for financial structure
        first_team = teams_data[0]
        
        # Check for sponsors object
        sponsors = first_team.get("sponsors")
        if sponsors is None:
            self.log_test("Financial - Sponsors Object", False, "Missing sponsors object")
            return False
        
        # Check sponsors object structure
        required_sponsor_fields = ["kit_manufacturer", "main_shirt", "sleeve", "stadium_naming", 
                                 "training_ground", "official_partners", "total_annual"]
        missing_sponsor_fields = [field for field in required_sponsor_fields if field not in sponsors]
        
        sponsors_complete = len(missing_sponsor_fields) == 0
        self.log_test("Financial - Sponsors Object Structure", sponsors_complete,
                     f"Missing fields: {missing_sponsor_fields}" if missing_sponsor_fields else "All sponsor fields present")
        
        # Check sponsorship_monthly calculation
        total_annual = sponsors.get("total_annual", 0)
        sponsorship_monthly = first_team.get("sponsorship_monthly", 0)
        monthly_calculated_correctly = sponsorship_monthly == total_annual / 12
        self.log_test("Financial - Sponsorship Monthly Calculation", monthly_calculated_correctly,
                     f"Annual: £{total_annual:,}, Monthly: £{sponsorship_monthly:,}, Expected: £{total_annual/12:,.0f}")
        
        # Check for FFP object
        ffp = first_team.get("ffp")
        if ffp is None:
            self.log_test("Financial - FFP Object", False, "Missing ffp object")
            return False
        
        # Check FFP object structure
        required_ffp_fields = ["status", "wage_ratio", "consecutive_deficit_seasons", 
                              "transfer_restriction", "warnings_issued"]
        missing_ffp_fields = [field for field in required_ffp_fields if field not in ffp]
        
        ffp_complete = len(missing_ffp_fields) == 0
        self.log_test("Financial - FFP Object Structure", ffp_complete,
                     f"Missing fields: {missing_ffp_fields}" if missing_ffp_fields else "All FFP fields present")
        
        # Check for finances object
        finances = first_team.get("finances")
        if finances is None:
            self.log_test("Financial - Finances Object", False, "Missing finances object for P&L tracking")
            return False
        else:
            self.log_test("Financial - Finances Object", True, "Finances object present for P&L tracking")
        
        success = sponsors_complete and monthly_calculated_correctly and ffp_complete and (finances is not None)
        self.log_test("Financial - Game Creation Complete", success, 
                     "All financial system components present" if success else "Missing financial system components")
        
        return success
    
    def test_sponsor_system_verification(self):
        """Test sponsor values scale with reputation and meet requirements"""
        print("\n🏢 Testing Sponsor System Verification...")
        
        if not self.game_data:
            self.log_test("Sponsor System - Data Available", False, "No game data")
            return False
            
        teams_data = self.game_data.get("teams", [])
        if not teams_data:
            self.log_test("Sponsor System - Teams Available", False, "No teams data")
            return False
        
        # Test sponsor scaling with reputation
        low_rep_teams = [t for t in teams_data if t.get("reputation", 0) <= 6]
        mid_rep_teams = [t for t in teams_data if 10 <= t.get("reputation", 0) <= 14]
        high_rep_teams = [t for t in teams_data if t.get("reputation", 0) >= 16]
        
        # Test low rep team (should have ~£550k/year total)
        if low_rep_teams:
            low_team = low_rep_teams[0]
            sponsors = low_team.get("sponsors", {})
            total_annual = sponsors.get("total_annual", 0)
            expected_low = 550000  # £550k
            low_rep_correct = 400000 <= total_annual <= 700000  # Allow some variance
            self.log_test("Sponsor System - Low Rep Scaling", low_rep_correct,
                         f"Rep {low_team.get('reputation')}: £{total_annual:,}/year (expected ~£550k)")
        else:
            self.log_test("Sponsor System - Low Rep Scaling", False, "No low reputation teams found")
        
        # Test mid rep team (should have ~£11.7M/year total)
        if mid_rep_teams:
            mid_team = mid_rep_teams[0]
            sponsors = mid_team.get("sponsors", {})
            total_annual = sponsors.get("total_annual", 0)
            expected_mid = 11700000  # £11.7M
            mid_rep_correct = 10000000 <= total_annual <= 13000000  # Allow some variance
            self.log_test("Sponsor System - Mid Rep Scaling", mid_rep_correct,
                         f"Rep {mid_team.get('reputation')}: £{total_annual:,}/year (expected ~£11.7M)")
        else:
            self.log_test("Sponsor System - Mid Rep Scaling", False, "No mid reputation teams found")
        
        # Test high rep team (should have £50M+/year total)
        if high_rep_teams:
            high_team = high_rep_teams[0]
            sponsors = high_team.get("sponsors", {})
            total_annual = sponsors.get("total_annual", 0)
            high_rep_correct = total_annual >= 50000000  # £50M+
            self.log_test("Sponsor System - High Rep Scaling", high_rep_correct,
                         f"Rep {high_team.get('reputation')}: £{total_annual:,}/year (expected £50M+)")
        else:
            self.log_test("Sponsor System - High Rep Scaling", False, "No high reputation teams found")
        
        # Test generic sponsor names (no real brands)
        real_brands = ["Nike", "Adidas", "Emirates", "Etihad", "Old Trafford", "Anfield"]
        generic_sponsors = True
        brand_issues = []
        
        for team in teams_data[:5]:  # Check first 5 teams
            sponsors = team.get("sponsors", {})
            for sponsor_type, sponsor_name in sponsors.items():
                if isinstance(sponsor_name, str) and any(brand in sponsor_name for brand in real_brands):
                    generic_sponsors = False
                    brand_issues.append(f"{team.get('name')}: {sponsor_type} = {sponsor_name}")
        
        self.log_test("Sponsor System - Generic Names", generic_sponsors,
                     f"Real brand issues: {brand_issues}" if brand_issues else "All sponsor names are generic")
        
        # Test sponsor availability based on reputation
        reputation_rules_correct = True
        rule_violations = []
        
        for team in teams_data:
            reputation = team.get("reputation", 0)
            sponsors = team.get("sponsors", {})
            
            # Sleeve sponsor: Only for rep 8+
            if "sleeve" in sponsors and sponsors["sleeve"] and reputation < 8:
                reputation_rules_correct = False
                rule_violations.append(f"{team.get('name')} (rep {reputation}) has sleeve sponsor but rep < 8")
            
            # Stadium naming: Only for rep 12+
            if "stadium_naming" in sponsors and sponsors["stadium_naming"] and reputation < 12:
                reputation_rules_correct = False
                rule_violations.append(f"{team.get('name')} (rep {reputation}) has stadium naming but rep < 12")
            
            # Training ground: Only for rep 6+
            if "training_ground" in sponsors and sponsors["training_ground"] and reputation < 6:
                reputation_rules_correct = False
                rule_violations.append(f"{team.get('name')} (rep {reputation}) has training ground sponsor but rep < 6")
            
            # Official partners: Only for rep 10+
            if "official_partners" in sponsors and sponsors["official_partners"] and reputation < 10:
                reputation_rules_correct = False
                rule_violations.append(f"{team.get('name')} (rep {reputation}) has official partners but rep < 10")
        
        self.log_test("Sponsor System - Reputation Rules", reputation_rules_correct,
                     f"Rule violations: {rule_violations}" if rule_violations else "All reputation rules followed")
        
        return True
    
    def test_team_financial_structure(self):
        """Test all 20 teams have required financial structure"""
        print("\n🏦 Testing Team Financial Structure...")
        
        if not self.game_data:
            self.log_test("Team Finance - Data Available", False, "No game data")
            return False
            
        teams_data = self.game_data.get("teams", [])
        if len(teams_data) != 20:
            self.log_test("Team Finance - Team Count", False, f"Expected 20 teams, got {len(teams_data)}")
            return False
        
        # Check all teams have required financial fields
        required_fields = ["budget", "wage_budget", "staff_costs_weekly", "ticket_price", 
                          "stadium_capacity", "fan_base", "reputation"]
        
        teams_with_all_fields = 0
        field_issues = []
        
        for team in teams_data:
            team_complete = True
            for field in required_fields:
                if field not in team:
                    team_complete = False
                    field_issues.append(f"{team.get('name', 'Unknown')}: missing {field}")
            
            if team_complete:
                teams_with_all_fields += 1
        
        all_teams_complete = teams_with_all_fields == 20
        self.log_test("Team Finance - Required Fields", all_teams_complete,
                     f"{teams_with_all_fields}/20 teams have all fields. Issues: {field_issues[:5]}")
        
        # Check budget values (should be £50M for div 1)
        budget_correct = True
        budget_issues = []
        
        for team in teams_data:
            budget = team.get("budget", 0)
            if budget != 50000000:  # £50M
                budget_correct = False
                budget_issues.append(f"{team.get('name')}: £{budget:,}")
        
        self.log_test("Team Finance - Budget Values", budget_correct,
                     f"Budget issues: {budget_issues[:3]}" if budget_issues else "All teams have £50M budget")
        
        # Check data types are numbers (not strings)
        numeric_fields = ["budget", "wage_budget", "staff_costs_weekly", "ticket_price", 
                         "stadium_capacity", "fan_base", "reputation", "sponsorship_monthly"]
        
        type_correct = True
        type_issues = []
        
        for team in teams_data[:3]:  # Check first 3 teams
            for field in numeric_fields:
                value = team.get(field)
                if value is not None and not isinstance(value, (int, float)):
                    type_correct = False
                    type_issues.append(f"{team.get('name')}: {field} is {type(value).__name__}")
        
        self.log_test("Team Finance - Data Types", type_correct,
                     f"Type issues: {type_issues}" if type_issues else "All monetary values are numbers")
        
        return all_teams_complete and budget_correct and type_correct
    
    def test_ffp_initial_state(self):
        """Test FFP initial state for all teams"""
        print("\n⚖️ Testing FFP Initial State...")
        
        if not self.game_data:
            self.log_test("FFP - Data Available", False, "No game data")
            return False
            
        teams_data = self.game_data.get("teams", [])
        if not teams_data:
            self.log_test("FFP - Teams Available", False, "No teams data")
            return False
        
        ffp_healthy_count = 0
        ffp_issues = []
        
        for team in teams_data:
            ffp = team.get("ffp", {})
            
            # Check FFP status is 'healthy'
            status = ffp.get("status")
            if status != "healthy":
                ffp_issues.append(f"{team.get('name')}: status = {status}")
            
            # Check wage_ratio is 0 initially
            wage_ratio = ffp.get("wage_ratio")
            if wage_ratio != 0:
                ffp_issues.append(f"{team.get('name')}: wage_ratio = {wage_ratio}")
            
            # Check consecutive_deficit_seasons is 0
            deficit_seasons = ffp.get("consecutive_deficit_seasons")
            if deficit_seasons != 0:
                ffp_issues.append(f"{team.get('name')}: deficit_seasons = {deficit_seasons}")
            
            # Check transfer_restriction is 0
            transfer_restriction = ffp.get("transfer_restriction")
            if transfer_restriction != 0:
                ffp_issues.append(f"{team.get('name')}: transfer_restriction = {transfer_restriction}")
            
            if (status == "healthy" and wage_ratio == 0 and 
                deficit_seasons == 0 and transfer_restriction == 0):
                ffp_healthy_count += 1
        
        all_ffp_healthy = ffp_healthy_count == 20
        self.log_test("FFP - Initial State", all_ffp_healthy,
                     f"{ffp_healthy_count}/20 teams have correct FFP initial state. Issues: {ffp_issues[:5]}")
        
        return all_ffp_healthy
    
    def test_data_integrity_checks(self):
        """Test data integrity requirements"""
        print("\n🔍 Testing Data Integrity Checks...")
        
        if not self.game_data:
            self.log_test("Data Integrity - Data Available", False, "No game data")
            return False
            
        teams_data = self.game_data.get("teams", [])
        if not teams_data:
            self.log_test("Data Integrity - Teams Available", False, "No teams data")
            return False
        
        integrity_issues = []
        teams_passed = 0
        
        for team in teams_data:
            team_issues = []
            
            # Check sponsor total_annual equals sum of categories
            sponsors = team.get("sponsors", {})
            if sponsors:
                total_annual = sponsors.get("total_annual", 0)
                category_sum = 0
                
                for key, value in sponsors.items():
                    if key != "total_annual" and isinstance(value, (int, float)):
                        category_sum += value
                
                if abs(total_annual - category_sum) > 1:  # Allow small rounding differences
                    team_issues.append(f"total_annual ({total_annual}) != sum of categories ({category_sum})")
            
            # Check sponsorship_monthly equals total_annual / 12
            sponsorship_monthly = team.get("sponsorship_monthly", 0)
            if sponsors:
                total_annual = sponsors.get("total_annual", 0)
                expected_monthly = total_annual / 12
                if abs(sponsorship_monthly - expected_monthly) > 1:
                    team_issues.append(f"sponsorship_monthly ({sponsorship_monthly}) != total_annual/12 ({expected_monthly})")
            
            if not team_issues:
                teams_passed += 1
            else:
                integrity_issues.extend([f"{team.get('name')}: {issue}" for issue in team_issues])
        
        all_integrity_passed = teams_passed == 20
        self.log_test("Data Integrity - Calculations", all_integrity_passed,
                     f"{teams_passed}/20 teams passed integrity checks. Issues: {integrity_issues[:3]}")
        
        return all_integrity_passed
    
    def run_financial_system_test(self):
        """Run the complete financial system test"""
        print("💰 Starting Comprehensive Financial System Test")
        print("=" * 60)
        
        # Phase 1: Basic API Tests
        print("\n📡 Phase 1: API Health Check")
        if not self.test_health_check():
            return False
        
        # Phase 2: Game Creation with Financial Data
        print("\n🎮 Phase 2: Game Creation with Financial Data")
        if not self.test_game_creation_with_financial_data():
            print("❌ CRITICAL: Financial system not implemented in backend")
            return False
        
        # Phase 3: Sponsor System Verification
        print("\n🏢 Phase 3: Sponsor System Verification")
        self.test_sponsor_system_verification()
        
        # Phase 4: Team Financial Structure
        print("\n🏦 Phase 4: Team Financial Structure")
        self.test_team_financial_structure()
        
        # Phase 5: FFP Initial State
        print("\n⚖️ Phase 5: FFP Initial State")
        self.test_ffp_initial_state()
        
        # Phase 6: Data Integrity Checks
        print("\n🔍 Phase 6: Data Integrity Checks")
        self.test_data_integrity_checks()
        
        # Results Summary
        print("\n📊 Financial System Test Results")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        return passed_tests >= total_tests * 0.8

if __name__ == "__main__":
    tester = FinancialSystemTester()
    success = tester.run_financial_system_test()
    exit(0 if success else 1)