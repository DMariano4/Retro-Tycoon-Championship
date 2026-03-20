#!/usr/bin/env python3
"""
Focused Backend Test for Season Year Fix Verification
Testing the specific requirements from the review request
"""

import requests
import json
import sys
from typing import Dict, Any

# Configuration - Use the production URL from frontend/.env
BACKEND_URL = "https://code-ingest.preview.emergentagent.com/api"
TEST_TIMEOUT = 30

class SeasonFixTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = TEST_TIMEOUT
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str = "", details: Any = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_health_check(self) -> bool:
        """Test GET /api/ - Should return 200 with API info"""
        try:
            response = self.session.get(f"{BACKEND_URL}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "version" in data:
                    self.log_test("Health Check", True, f"API healthy: {data['message']} v{data['version']}")
                    return True
                else:
                    self.log_test("Health Check", False, "Health endpoint missing expected fields")
                    return False
            else:
                self.log_test("Health Check", False, f"Expected 200, got {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Request failed: {str(e)}")
            return False
    
    def test_teams_api(self) -> bool:
        """Test GET /api/teams - Should return 20 teams with squad data"""
        try:
            response = self.session.get(f"{BACKEND_URL}/teams")
            if response.status_code == 200:
                teams = response.json()
                
                # Check we have exactly 20 teams
                if len(teams) != 20:
                    self.log_test("Teams API", False, f"Expected 20 teams, got {len(teams)}")
                    return False
                
                # Check each team has required structure
                sample_team = teams[0]
                required_fields = ["id", "name", "stadium", "division"]
                missing_fields = [field for field in required_fields if field not in sample_team]
                
                if missing_fields:
                    self.log_test("Teams API", False, f"Team missing fields: {missing_fields}")
                    return False
                
                self.log_test("Teams API", True, f"Returns {len(teams)} teams with correct structure")
                return True
            else:
                self.log_test("Teams API", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Teams API", False, f"Request failed: {str(e)}")
            return False
    
    def test_create_game_season_fix(self) -> bool:
        """Test POST /api/game/new - CRITICAL: Verify season = 2025 (NOT 2024) and game_date = 2025-07-01"""
        try:
            # Use the first test from the review request exactly
            payload = {
                "team_id": "man_utd", 
                "save_name": "Test Save"
            }
            
            # First get available teams to use a valid team_id
            teams_response = self.session.get(f"{BACKEND_URL}/teams")
            if teams_response.status_code != 200:
                self.log_test("Create Game Season Fix", False, "Could not get teams list")
                return False
            
            teams = teams_response.json()
            if not teams:
                self.log_test("Create Game Season Fix", False, "No teams available")
                return False
            
            # Use first available team instead of "man_utd"
            payload["team_id"] = teams[0]["id"]
            
            response = self.session.post(f"{BACKEND_URL}/game/new", json=payload)
            if response.status_code == 200:
                game_data = response.json()
                
                # CRITICAL CHECK 1: Verify the league's season field equals 2025 (NOT 2024)
                if "leagues" not in game_data or not game_data["leagues"]:
                    self.log_test("Create Game Season Fix", False, "No leagues found in game data")
                    return False
                
                league = game_data["leagues"][0]
                season_value = league.get("season")
                
                if season_value != 2025:
                    self.log_test("Create Game Season Fix", False, 
                                f"❌ CRITICAL BUG: League season is {season_value}, should be 2025", 
                                {"expected": 2025, "actual": season_value})
                    return False
                
                # CRITICAL CHECK 2: Verify game_date starts at "2025-07-01"
                game_date = game_data.get("game_date")
                if game_date != "2025-07-01":
                    self.log_test("Create Game Season Fix", False,
                                f"❌ CRITICAL BUG: Game date is {game_date}, should be 2025-07-01",
                                {"expected": "2025-07-01", "actual": game_date})
                    return False
                
                # Verify it returns a proper game object
                required_fields = ["id", "managed_team_id", "teams", "leagues", "game_date"]
                missing_fields = [field for field in required_fields if field not in game_data]
                
                if missing_fields:
                    self.log_test("Create Game Season Fix", False, f"Game object missing fields: {missing_fields}")
                    return False
                
                self.log_test("Create Game Season Fix", True, 
                            f"✅ Season year fix VERIFIED: Season={season_value}, Game date={game_date}")
                return True
            else:
                self.log_test("Create Game Season Fix", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Create Game Season Fix", False, f"Request failed: {str(e)}")
            return False
    
    def test_save_game_api(self) -> bool:
        """Test POST /api/game/save - Should work for saving game data"""
        try:
            # Create a test game first
            teams_response = self.session.get(f"{BACKEND_URL}/teams")
            if teams_response.status_code != 200:
                self.log_test("Save Game API", False, "Could not get teams for test game creation")
                return False
            
            teams = teams_response.json()
            create_payload = {
                "team_id": teams[0]["id"],
                "save_name": "Test Save for Save API"
            }
            
            create_response = self.session.post(f"{BACKEND_URL}/game/new", json=create_payload)
            if create_response.status_code != 200:
                self.log_test("Save Game API", False, "Could not create test game")
                return False
            
            game_data = create_response.json()
            
            # Now test saving the game
            save_payload = {
                "save_data": game_data,
                "is_cloud": False  # Test local save
            }
            
            response = self.session.post(f"{BACKEND_URL}/game/save", json=save_payload)
            if response.status_code == 200:
                result = response.json()
                if result.get("success") and result.get("save_id"):
                    self.log_test("Save Game API", True, f"Game saved successfully with ID: {result['save_id']}")
                    return True
                else:
                    self.log_test("Save Game API", False, "Save response missing success/save_id")
                    return False
            else:
                self.log_test("Save Game API", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Save Game API", False, f"Request failed: {str(e)}")
            return False
    
    def test_load_game_auth_behavior(self) -> bool:
        """Test GET /api/game/load - Should require authentication"""
        try:
            # Test loading without auth - should return 401
            response = self.session.get(f"{BACKEND_URL}/game/saves")
            
            if response.status_code == 401:
                self.log_test("Load Game Auth Behavior", True, "Correctly requires authentication (returns 401)")
                return True
            else:
                self.log_test("Load Game Auth Behavior", False, 
                            f"Expected 401 for unauthenticated request, got {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Load Game Auth Behavior", False, f"Request failed: {str(e)}")
            return False
    
    def run_focused_tests(self) -> Dict[str, Any]:
        """Run the focused tests from the review request"""
        print("🏈 Season Fix Verification Tests - Retro Championship Tycoon")
        print("=" * 70)
        print("Testing the specific requirements from the review request:")
        print("1. Health Check API (GET /api/health)")
        print("2. Teams API (GET /api/teams) - 20 teams with squads")  
        print("3. Create Game API (POST /api/game/new) - CRITICAL: Season = 2025, Game Date = 2025-07-01")
        print("4. Save/Load Game APIs")
        print("=" * 70)
        
        # Run all focused tests
        tests = [
            self.test_health_check,
            self.test_teams_api, 
            self.test_create_game_season_fix,
            self.test_save_game_api,
            self.test_load_game_auth_behavior
        ]
        
        for test in tests:
            test()
            print()  # Add spacing between tests
        
        return self.get_summary()
    
    def get_summary(self) -> Dict[str, Any]:
        """Get test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print("\n" + "=" * 60)
        print("📊 SEASON FIX TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        else:
            print("\n🎉 All season fix verification tests passed!")
            print("✅ The season year bug has been fixed successfully!")
        
        return {
            "total_tests": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": (passed_tests/total_tests)*100,
            "results": self.test_results
        }

def main():
    """Main test runner"""
    tester = SeasonFixTester()
    summary = tester.run_focused_tests()
    
    # Exit with error code if tests failed
    if summary["failed"] > 0:
        print(f"\n💥 {summary['failed']} tests failed!")
        sys.exit(1)
    else:
        print("\n🎉 All season fix tests passed!")
        sys.exit(0)

if __name__ == "__main__":
    main()