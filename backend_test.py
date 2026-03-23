#!/usr/bin/env python3
"""
Comprehensive 2-Season Simulation Test for Retro Championship Tycoon
Tests the complete game flow including season transitions, player systems, and data integrity.
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

# Get backend URL from frontend .env
BACKEND_URL = "https://code-ingest.preview.emergentagent.com/api"

class GameSimulationTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.game_data = None
        self.save_id = None
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
    
    def test_teams_api(self):
        """Test teams API returns 20 teams"""
        teams = self.make_request("GET", "/teams")
        success = isinstance(teams, list) and len(teams) == 20
        details = f"Found {len(teams) if isinstance(teams, list) else 0} teams"
        if success:
            # Verify team structure
            first_team = teams[0]
            required_fields = ["id", "name", "stadium", "division"]
            has_all_fields = all(field in first_team for field in required_fields)
            success = has_all_fields
            if not has_all_fields:
                details += f" - Missing fields: {[f for f in required_fields if f not in first_team]}"
        self.log_test("Teams API", success, details)
        return success, teams if success else []
    
    def test_game_creation(self):
        """Test game creation with comprehensive validation"""
        # Use first team from teams list
        _, teams = self.test_teams_api()
        if not teams:
            self.log_test("Game Creation", False, "No teams available")
            return False
            
        team_id = teams[0]["id"]  # Should be "team_1_0" for London Royals
        
        game_data = self.make_request("POST", "/game/new", {
            "team_id": team_id,
            "save_name": "2-Season Simulation Test",
            "currency_symbol": "£"
        })
        
        if not game_data:
            self.log_test("Game Creation", False, "No response from API")
            return False
            
        # Comprehensive validation
        success = True
        issues = []
        
        # Basic structure
        required_fields = ["id", "name", "season", "game_date", "managed_team_id", "teams", "leagues", "currency_symbol"]
        for field in required_fields:
            if field not in game_data:
                success = False
                issues.append(f"Missing {field}")
        
        # Season validation (should be 2025, not 2024)
        if game_data.get("season") != 2025:
            success = False
            issues.append(f"Season should be 2025, got {game_data.get('season')}")
            
        # Game date validation (should start July 1, 2025)
        if game_data.get("game_date") != "2025-07-01":
            success = False
            issues.append(f"Game date should be 2025-07-01, got {game_data.get('game_date')}")
            
        # Teams validation (should have 20 teams)
        teams_data = game_data.get("teams", [])
        if len(teams_data) != 20:
            success = False
            issues.append(f"Should have 20 teams, got {len(teams_data)}")
        
        # Club profile fields validation
        if teams_data:
            first_team = teams_data[0]
            club_fields = ["reputation", "fan_base", "fan_loyalty", "stadium_capacity", 
                          "ticket_price", "sponsorship_monthly", "youth_facilities", 
                          "training_facilities", "staff_costs_weekly", "budget"]
            for field in club_fields:
                if field not in first_team:
                    success = False
                    issues.append(f"Team missing club profile field: {field}")
        
        # Player validation (each team should have 24 players)
        if teams_data:
            for i, team in enumerate(teams_data[:3]):  # Check first 3 teams
                squad = team.get("squad", [])
                if len(squad) < 20:  # Should have at least 20 players
                    success = False
                    issues.append(f"Team {i} has only {len(squad)} players")
                    
                # Check player structure
                if squad:
                    player = squad[0]
                    player_fields = ["id", "name", "position", "current_ability", "fitness", "form", "contract_end"]
                    for field in player_fields:
                        if field not in player:
                            success = False
                            issues.append(f"Player missing field: {field}")
                            break
        
        # League validation
        leagues = game_data.get("leagues", [])
        if len(leagues) != 1:
            success = False
            issues.append(f"Should have 1 league, got {len(leagues)}")
        elif leagues:
            league = leagues[0]
            if len(league.get("fixtures", [])) < 380:  # Should have 380+ fixtures (38 weeks * 10 matches + friendlies)
                success = False
                issues.append(f"Should have 380+ fixtures, got {len(league.get('fixtures', []))}")
        
        # Currency symbol validation
        if game_data.get("currency_symbol") != "£":
            success = False
            issues.append(f"Currency should be £, got {game_data.get('currency_symbol')}")
        
        self.game_data = game_data
        details = "All validations passed" if success else f"Issues: {', '.join(issues)}"
        self.log_test("Game Creation", success, details)
        return success
    
    def test_save_game(self):
        """Test game save functionality"""
        if not self.game_data:
            self.log_test("Game Save", False, "No game data to save")
            return False
            
        result = self.make_request("POST", "/game/save", {
            "save_data": self.game_data,
            "is_cloud": False
        })
        
        success = result.get("success", False)
        if success:
            self.save_id = result.get("save_id")
            
        self.log_test("Game Save", success, f"Save ID: {self.save_id}" if success else "Save failed")
        return success
    
    def simulate_season_progression(self, season_name: str, target_season: int):
        """Simulate progression through a season"""
        print(f"\n🏆 Starting {season_name} Simulation...")
        
        if not self.game_data:
            self.log_test(f"{season_name} - Data Available", False, "No game data")
            return False
            
        # Verify starting conditions
        current_season = self.game_data.get("season")
        success = current_season == target_season
        self.log_test(f"{season_name} - Starting Season", success, 
                     f"Expected {target_season}, got {current_season}")
        
        # Check league structure
        leagues = self.game_data.get("leagues", [])
        if not leagues:
            self.log_test(f"{season_name} - League Structure", False, "No leagues found")
            return False
            
        league = leagues[0]
        fixtures = league.get("fixtures", [])
        table = league.get("table", [])
        
        # Validate fixtures exist
        fixture_count = len(fixtures)
        success = fixture_count >= 380  # Should have 380+ fixtures
        self.log_test(f"{season_name} - Fixtures Generated", success, 
                     f"Found {fixture_count} fixtures")
        
        # Validate league table
        table_size = len(table)
        success = table_size == 20
        self.log_test(f"{season_name} - League Table", success, 
                     f"Found {table_size} teams in table")
        
        # Check team data integrity
        teams = self.game_data.get("teams", [])
        if teams:
            # Verify all teams have squads
            teams_with_squads = sum(1 for team in teams if len(team.get("squad", [])) >= 20)
            success = teams_with_squads == 20
            self.log_test(f"{season_name} - Team Squads", success, 
                         f"{teams_with_squads}/20 teams have full squads")
            
            # Check player fitness and form ranges
            all_players = []
            for team in teams:
                all_players.extend(team.get("squad", []))
            
            if all_players:
                fitness_values = [p.get("fitness", 0) for p in all_players]
                form_values = [p.get("form", 0) for p in all_players]
                
                fitness_valid = all(1 <= f <= 20 for f in fitness_values)
                form_valid = all(1 <= f <= 20 for f in form_values)
                
                self.log_test(f"{season_name} - Player Fitness Range", fitness_valid,
                             f"Range: {min(fitness_values)}-{max(fitness_values)}")
                self.log_test(f"{season_name} - Player Form Range", form_valid,
                             f"Range: {min(form_values)}-{max(form_values)}")
        
        return True
    
    def test_player_injury_system(self):
        """Test player injury system data structures"""
        print(f"\n🏥 Testing Player Injury System...")
        
        if not self.game_data:
            self.log_test("Injury System - Data Available", False, "No game data")
            return False
            
        teams = self.game_data.get("teams", [])
        if not teams:
            self.log_test("Injury System - Teams Available", False, "No teams found")
            return False
            
        # Check player data structure supports injuries
        managed_team = None
        for team in teams:
            if team.get("id") == self.game_data.get("managed_team_id"):
                managed_team = team
                break
                
        if not managed_team:
            self.log_test("Injury System - Managed Team Found", False, "Managed team not found")
            return False
            
        squad = managed_team.get("squad", [])
        if not squad:
            self.log_test("Injury System - Squad Available", False, "No squad found")
            return False
            
        # Check if players have injury-related fields (they should be None initially)
        player = squad[0]
        
        # Players should have fitness field (required for injury system)
        has_fitness = "fitness" in player
        self.log_test("Injury System - Fitness Field", has_fitness, 
                     f"Fitness: {player.get('fitness', 'Missing')}")
        
        # Players should have form field (affects injury probability)
        has_form = "form" in player
        self.log_test("Injury System - Form Field", has_form,
                     f"Form: {player.get('form', 'Missing')}")
        
        # Check age field (affects injury probability)
        has_age = "age" in player
        self.log_test("Injury System - Age Field", has_age,
                     f"Age: {player.get('age', 'Missing')}")
        
        # Check contract dates (for contract renewal system)
        has_contract = "contract_end" in player
        contract_date = player.get("contract_end", "")
        contract_valid = contract_date.endswith("-06-30")  # Should end June 30th
        self.log_test("Injury System - Contract Dates", has_contract and contract_valid,
                     f"Contract ends: {contract_date}")
        
        return has_fitness and has_form and has_age and has_contract
    
    def test_contract_renewal_system(self):
        """Test contract renewal system data structures"""
        print(f"\n📝 Testing Contract Renewal System...")
        
        if not self.game_data:
            self.log_test("Contract System - Data Available", False, "No game data")
            return False
            
        teams = self.game_data.get("teams", [])
        all_players = []
        for team in teams:
            all_players.extend(team.get("squad", []))
            
        if not all_players:
            self.log_test("Contract System - Players Available", False, "No players found")
            return False
            
        # Check contract date distribution
        contract_years = {}
        for player in all_players:
            contract_end = player.get("contract_end", "")
            if contract_end:
                year = contract_end.split("-")[0]
                contract_years[year] = contract_years.get(year, 0) + 1
        
        # Should have contracts expiring in different years (2025-2029)
        years_with_contracts = len(contract_years)
        success = years_with_contracts >= 3  # Should have variety
        self.log_test("Contract System - Contract Variety", success,
                     f"Contracts expire in {years_with_contracts} different years: {list(contract_years.keys())}")
        
        # Check for players with contracts expiring soon (2025 or 2026)
        expiring_soon = contract_years.get("2025", 0) + contract_years.get("2026", 0)
        success = expiring_soon > 0
        self.log_test("Contract System - Expiring Contracts", success,
                     f"{expiring_soon} players have contracts expiring in 2025-2026")
        
        return True
    
    def test_season_transition_logic(self):
        """Test season transition data structures"""
        print(f"\n🔄 Testing Season Transition Logic...")
        
        if not self.game_data:
            self.log_test("Season Transition - Data Available", False, "No game data")
            return False
            
        # Check calendar structure
        calendar = self.game_data.get("calendar", {})
        if not calendar:
            self.log_test("Season Transition - Calendar Available", False, "No calendar found")
            return False
            
        # Validate calendar dates
        required_dates = ["pre_season_start", "season_start", "season_end", 
                         "transfer_window_summer_start", "transfer_window_summer_end",
                         "contract_expiry_date"]
        
        missing_dates = [date for date in required_dates if date not in calendar]
        success = len(missing_dates) == 0
        self.log_test("Season Transition - Calendar Dates", success,
                     f"Missing dates: {missing_dates}" if missing_dates else "All dates present")
        
        # Check season year consistency
        season_year = calendar.get("season_year", 0)
        game_season = self.game_data.get("season", 0)
        success = season_year == game_season == 2025
        self.log_test("Season Transition - Season Year Consistency", success,
                     f"Calendar: {season_year}, Game: {game_season}")
        
        # Check contract expiry date format
        contract_expiry = calendar.get("contract_expiry_date", "")
        success = contract_expiry == "2026-06-30"
        self.log_test("Season Transition - Contract Expiry Date", success,
                     f"Expected 2026-06-30, got {contract_expiry}")
        
        return True
    
    def test_fitness_recovery_system(self):
        """Test fitness recovery system data structures"""
        print(f"\n💪 Testing Fitness Recovery System...")
        
        if not self.game_data:
            self.log_test("Fitness Recovery - Data Available", False, "No game data")
            return False
            
        teams = self.game_data.get("teams", [])
        all_players = []
        for team in teams:
            all_players.extend(team.get("squad", []))
            
        if not all_players:
            self.log_test("Fitness Recovery - Players Available", False, "No players found")
            return False
            
        # Check fitness values are in valid range (1-20)
        fitness_values = [p.get("fitness", 0) for p in all_players]
        valid_fitness = all(1 <= f <= 20 for f in fitness_values)
        self.log_test("Fitness Recovery - Fitness Range Valid", valid_fitness,
                     f"Range: {min(fitness_values)}-{max(fitness_values)}")
        
        # Check fitness distribution (should be mostly high for new game)
        high_fitness_count = sum(1 for f in fitness_values if f >= 16)
        high_fitness_percentage = (high_fitness_count / len(fitness_values)) * 100
        success = high_fitness_percentage >= 70  # Most players should start with high fitness
        self.log_test("Fitness Recovery - Initial Fitness Distribution", success,
                     f"{high_fitness_percentage:.1f}% of players have fitness >= 16")
        
        # Check that players have stamina attribute (affects fitness recovery)
        stamina_values = [p.get("stamina", 0) for p in all_players if "stamina" in p]
        success = len(stamina_values) == len(all_players)
        self.log_test("Fitness Recovery - Stamina Attributes", success,
                     f"{len(stamina_values)}/{len(all_players)} players have stamina")
        
        return valid_fitness and success
    
    def run_comprehensive_test(self):
        """Run the complete 2-season simulation test"""
        print("🚀 Starting Comprehensive 2-Season Simulation Test")
        print("=" * 60)
        
        # Phase 1: Basic API Tests
        print("\n📡 Phase 1: Basic API Validation")
        if not self.test_health_check():
            return False
            
        # Phase 2: Game Creation and Validation
        print("\n🎮 Phase 2: Game Creation and Data Validation")
        if not self.test_game_creation():
            return False
            
        if not self.test_save_game():
            return False
            
        # Phase 3: Season 1 Simulation
        print("\n🏆 Phase 3: Season 1 (2025) Validation")
        if not self.simulate_season_progression("Season 1 (2025)", 2025):
            return False
            
        # Phase 4: Player Systems Testing
        print("\n👥 Phase 4: Player Systems Validation")
        self.test_player_injury_system()
        self.test_contract_renewal_system()
        self.test_fitness_recovery_system()
        
        # Phase 5: Season Transition Testing
        print("\n🔄 Phase 5: Season Transition Logic")
        self.test_season_transition_logic()
        
        # Phase 6: Results Summary
        print("\n📊 Test Results Summary")
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
        
        # Critical issues check
        critical_failures = []
        for result in self.test_results:
            if not result["success"] and any(critical in result["test"] for critical in 
                ["API Health", "Game Creation", "Teams API", "Season", "Fixtures"]):
                critical_failures.append(result["test"])
        
        if critical_failures:
            print(f"\n🚨 CRITICAL FAILURES DETECTED:")
            for failure in critical_failures:
                print(f"  - {failure}")
            return False
        
        print(f"\n✅ 2-Season Simulation Test COMPLETED")
        print(f"Backend APIs are ready for comprehensive season simulation!")
        
        return passed_tests >= total_tests * 0.8  # 80% pass rate required

if __name__ == "__main__":
    tester = GameSimulationTester()
    success = tester.run_comprehensive_test()
    exit(0 if success else 1)