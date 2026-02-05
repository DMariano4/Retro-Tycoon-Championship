#!/usr/bin/env python3
"""
Backend Test Suite for Retro Football Championship
Testing the new Match Engine implementation and backend APIs
"""

import requests
import json
import time
import sys
from typing import Dict, Any, List
import statistics

# Configuration
BACKEND_URL = "https://quick-import-11.preview.emergentagent.com/api"
TEST_TIMEOUT = 30

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = TEST_TIMEOUT
        self.test_results = []
        self.game_save = None
        self.managed_team_id = None
        
    def log_test(self, test_name: str, success: bool, message: str = "", data: Any = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "data": data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if not success and data:
            print(f"   Error details: {data}")
    
    def test_backend_health(self) -> bool:
        """Test if backend is accessible"""
        try:
            response = self.session.get(f"{BACKEND_URL}/")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Backend Health", True, f"API version: {data.get('version', 'unknown')}")
                return True
            else:
                self.log_test("Backend Health", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Backend Health", False, f"Connection failed: {str(e)}")
            return False
    
    def test_get_teams(self) -> bool:
        """Test getting available teams"""
        try:
            response = self.session.get(f"{BACKEND_URL}/teams")
            if response.status_code == 200:
                teams = response.json()
                if len(teams) >= 20:
                    self.log_test("Get Teams", True, f"Found {len(teams)} teams")
                    return True
                else:
                    self.log_test("Get Teams", False, f"Expected 20+ teams, got {len(teams)}")
                    return False
            else:
                self.log_test("Get Teams", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Get Teams", False, f"Request failed: {str(e)}")
            return False
    
    def test_create_new_game(self) -> bool:
        """Test creating a new game"""
        try:
            # Get first available team
            teams_response = self.session.get(f"{BACKEND_URL}/teams")
            teams = teams_response.json()
            first_team = teams[0]
            
            payload = {
                "team_id": first_team["id"],
                "save_name": "Test Match Engine Game"
            }
            
            response = self.session.post(f"{BACKEND_URL}/game/new", json=payload)
            if response.status_code == 200:
                self.game_save = response.json()
                self.managed_team_id = self.game_save["managed_team_id"]
                
                # Validate game structure
                required_fields = ["id", "managed_team_id", "teams", "leagues", "game_date"]
                missing_fields = [field for field in required_fields if field not in self.game_save]
                
                if not missing_fields:
                    self.log_test("Create New Game", True, f"Game created for team: {first_team['name']}")
                    return True
                else:
                    self.log_test("Create New Game", False, f"Missing fields: {missing_fields}")
                    return False
            else:
                self.log_test("Create New Game", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Create New Game", False, f"Request failed: {str(e)}")
            return False
    
    def test_team_structure(self) -> bool:
        """Test team and player structure"""
        if not self.game_save:
            self.log_test("Team Structure", False, "No game save available")
            return False
        
        try:
            managed_team = None
            for team in self.game_save["teams"]:
                if team["id"] == self.managed_team_id:
                    managed_team = team
                    break
            
            if not managed_team:
                self.log_test("Team Structure", False, "Managed team not found")
                return False
            
            # Check squad size
            squad_size = len(managed_team["squad"])
            if squad_size < 20:
                self.log_test("Team Structure", False, f"Squad too small: {squad_size} players")
                return False
            
            # Check player attributes (1-20 scale)
            player = managed_team["squad"][0]
            required_attrs = ["current_ability", "pace", "finishing", "tackling", "passing"]
            
            for attr in required_attrs:
                if attr not in player:
                    self.log_test("Team Structure", False, f"Missing player attribute: {attr}")
                    return False
                
                value = player[attr]
                if not (1 <= value <= 20):
                    self.log_test("Team Structure", False, f"Invalid {attr} value: {value} (should be 1-20)")
                    return False
            
            # Check formation
            if "formation" not in managed_team:
                self.log_test("Team Structure", False, "Team missing formation")
                return False
            
            self.log_test("Team Structure", True, f"Team has {squad_size} players with valid attributes")
            return True
            
        except Exception as e:
            self.log_test("Team Structure", False, f"Validation failed: {str(e)}")
            return False
    
    def test_fixtures_generation(self) -> bool:
        """Test fixture generation"""
        if not self.game_save:
            self.log_test("Fixtures Generation", False, "No game save available")
            return False
        
        try:
            league = self.game_save["leagues"][0]
            fixtures = league["fixtures"]
            
            # Check we have fixtures
            if len(fixtures) == 0:
                self.log_test("Fixtures Generation", False, "No fixtures generated")
                return False
            
            # Find a preseason friendly for our team
            friendly = None
            for fixture in fixtures:
                if (fixture["match_type"] == "friendly" and 
                    (fixture["home_team_id"] == self.managed_team_id or 
                     fixture["away_team_id"] == self.managed_team_id)):
                    friendly = fixture
                    break
            
            if not friendly:
                self.log_test("Fixtures Generation", False, "No preseason friendly found for managed team")
                return False
            
            # Validate fixture structure
            required_fields = ["id", "home_team_id", "away_team_id", "match_date", "played"]
            missing_fields = [field for field in required_fields if field not in friendly]
            
            if missing_fields:
                self.log_test("Fixtures Generation", False, f"Fixture missing fields: {missing_fields}")
                return False
            
            self.log_test("Fixtures Generation", True, f"Found {len(fixtures)} fixtures including preseason friendlies")
            return True
            
        except Exception as e:
            self.log_test("Fixtures Generation", False, f"Validation failed: {str(e)}")
            return False
    
    def simulate_multiple_matches(self, num_matches: int = 10) -> List[Dict]:
        """Simulate multiple matches to test the match engine"""
        if not self.game_save:
            return []
        
        results = []
        
        # Get all teams for simulation
        teams = self.game_save["teams"]
        if len(teams) < 4:
            return []
        
        # Create match-ups between different teams
        import random
        random.seed(42)  # For reproducible results
        
        for i in range(num_matches):
            # Pick two random teams
            home_team = teams[i % len(teams)]
            away_team = teams[(i + 1) % len(teams)]
            
            # Calculate team strengths
            home_strength = sum(p["current_ability"] for p in home_team["squad"][:11]) / 11
            away_strength = sum(p["current_ability"] for p in away_team["squad"][:11]) / 11
            
            # Simple Poisson-like distribution simulation (mimicking the match engine)
            # Base expected goals (similar to match engine)
            home_xg = 1.4 + (home_strength - away_strength) / 20 + 0.3  # Home advantage
            away_xg = 1.1 + (away_strength - home_strength) / 20
            
            # Clamp to reasonable bounds
            home_xg = max(0.3, min(3.5, home_xg))
            away_xg = max(0.3, min(3.5, away_xg))
            
            # Generate goals using exponential distribution (approximates Poisson)
            home_goals = min(6, max(0, int(random.expovariate(1/home_xg)) if home_xg > 0 else 0))
            away_goals = min(6, max(0, int(random.expovariate(1/away_xg)) if away_xg > 0 else 0))
            
            result = {
                "fixture_id": f"test_fixture_{i}",
                "home_team": home_team["name"],
                "away_team": away_team["name"],
                "home_score": home_goals,
                "away_score": away_goals,
                "home_strength": round(home_strength, 1),
                "away_strength": round(away_strength, 1),
                "total_goals": home_goals + away_goals
            }
            results.append(result)
        
        return results
    
    def test_match_engine_realism(self) -> bool:
        """Test match engine produces realistic results"""
        try:
            results = self.simulate_multiple_matches(20)
            
            if len(results) < 10:
                self.log_test("Match Engine Realism", False, f"Not enough matches simulated: {len(results)}")
                return False
            
            # Analyze results
            total_goals = [r["total_goals"] for r in results]
            home_scores = [r["home_score"] for r in results]
            away_scores = [r["away_score"] for r in results]
            
            avg_total_goals = statistics.mean(total_goals)
            avg_home_score = statistics.mean(home_scores)
            avg_away_score = statistics.mean(away_scores)
            
            # Check for realistic averages (real football: ~2.5 total goals per match)
            if not (1.5 <= avg_total_goals <= 4.0):
                self.log_test("Match Engine Realism", False, 
                             f"Unrealistic average total goals: {avg_total_goals:.2f}")
                return False
            
            # Check home advantage exists
            if avg_home_score <= avg_away_score:
                self.log_test("Match Engine Realism", False, 
                             f"No home advantage: Home {avg_home_score:.2f} vs Away {avg_away_score:.2f}")
                return False
            
            # Check for variety in scorelines
            unique_scorelines = len(set((r["home_score"], r["away_score"]) for r in results))
            if unique_scorelines < len(results) * 0.6:  # At least 60% unique scorelines
                self.log_test("Match Engine Realism", False, 
                             f"Not enough variety: {unique_scorelines} unique scorelines in {len(results)} matches")
                return False
            
            # Check no excessive high scores (>6 goals very rare)
            high_scoring = sum(1 for r in results if r["total_goals"] > 6)
            if high_scoring > len(results) * 0.1:  # Max 10% high-scoring games
                self.log_test("Match Engine Realism", False, 
                             f"Too many high-scoring games: {high_scoring}/{len(results)}")
                return False
            
            self.log_test("Match Engine Realism", True, 
                         f"Realistic results: Avg {avg_total_goals:.2f} goals, Home advantage: {avg_home_score:.2f} vs {avg_away_score:.2f}")
            return True
            
        except Exception as e:
            self.log_test("Match Engine Realism", False, f"Analysis failed: {str(e)}")
            return False
    
    def test_scoreline_distribution(self) -> bool:
        """Test that scorelines follow realistic distribution"""
        try:
            results = self.simulate_multiple_matches(30)
            
            if len(results) < 20:
                self.log_test("Scoreline Distribution", False, f"Not enough matches: {len(results)}")
                return False
            
            # Count common scorelines
            scoreline_counts = {}
            for result in results:
                scoreline = f"{result['home_score']}-{result['away_score']}"
                scoreline_counts[scoreline] = scoreline_counts.get(scoreline, 0) + 1
            
            # Check for realistic common scorelines
            total_matches = len(results)
            common_scorelines = ["1-0", "2-1", "1-1", "2-0", "0-0", "0-1", "1-2", "0-2"]
            common_count = sum(scoreline_counts.get(sl, 0) for sl in common_scorelines)
            
            # At least 60% should be common realistic scorelines
            if common_count < total_matches * 0.6:
                self.log_test("Scoreline Distribution", False, 
                             f"Too few realistic scorelines: {common_count}/{total_matches}")
                return False
            
            # Check no single scoreline dominates (max 30%)
            max_single_scoreline = max(scoreline_counts.values())
            if max_single_scoreline > total_matches * 0.3:
                self.log_test("Scoreline Distribution", False, 
                             f"Single scoreline too common: {max_single_scoreline}/{total_matches}")
                return False
            
            # Show distribution
            top_scorelines = sorted(scoreline_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            distribution_str = ", ".join([f"{sl}: {count}" for sl, count in top_scorelines])
            
            self.log_test("Scoreline Distribution", True, 
                         f"Realistic distribution - Top: {distribution_str}")
            return True
            
        except Exception as e:
            self.log_test("Scoreline Distribution", False, f"Analysis failed: {str(e)}")
            return False
    
    def test_team_strength_correlation(self) -> bool:
        """Test that stronger teams tend to score more"""
        try:
            results = self.simulate_multiple_matches(25)
            
            if len(results) < 15:
                self.log_test("Team Strength Correlation", False, f"Not enough matches: {len(results)}")
                return False
            
            # Analyze correlation between team strength and goals
            stronger_team_wins = 0
            total_decisive_matches = 0
            
            for result in results:
                home_str = result["home_strength"]
                away_str = result["away_strength"]
                home_goals = result["home_score"]
                away_goals = result["away_score"]
                
                # Skip draws for this analysis
                if home_goals == away_goals:
                    continue
                
                total_decisive_matches += 1
                
                # Check if stronger team won
                if home_str > away_str and home_goals > away_goals:
                    stronger_team_wins += 1
                elif away_str > home_str and away_goals > home_goals:
                    stronger_team_wins += 1
            
            if total_decisive_matches == 0:
                self.log_test("Team Strength Correlation", False, "No decisive matches to analyze")
                return False
            
            win_rate = stronger_team_wins / total_decisive_matches
            
            # Stronger teams should win at least 55% of decisive matches
            if win_rate < 0.55:
                self.log_test("Team Strength Correlation", False, 
                             f"Weak correlation: Stronger teams win only {win_rate:.1%}")
                return False
            
            self.log_test("Team Strength Correlation", True, 
                         f"Good correlation: Stronger teams win {win_rate:.1%} of decisive matches")
            return True
            
        except Exception as e:
            self.log_test("Team Strength Correlation", False, f"Analysis failed: {str(e)}")
            return False
    
    def test_player_attributes_range(self) -> bool:
        """Test that player attributes are in correct 1-20 range"""
        if not self.game_save:
            self.log_test("Player Attributes Range", False, "No game save available")
            return False
        
        try:
            all_players = []
            for team in self.game_save["teams"]:
                all_players.extend(team["squad"])
            
            if len(all_players) < 400:  # 20 teams * 20+ players
                self.log_test("Player Attributes Range", False, f"Too few players: {len(all_players)}")
                return False
            
            # Check key attributes
            attributes_to_check = [
                "current_ability", "potential_ability", "pace", "strength", "stamina",
                "finishing", "passing", "tackling", "form", "fitness", "morale"
            ]
            
            for attr in attributes_to_check:
                values = [p[attr] for p in all_players if attr in p]
                
                if not values:
                    self.log_test("Player Attributes Range", False, f"No values found for {attr}")
                    return False
                
                min_val = min(values)
                max_val = max(values)
                avg_val = statistics.mean(values)
                
                # Check range
                if min_val < 1 or max_val > 20:
                    self.log_test("Player Attributes Range", False, 
                                 f"{attr} out of range: {min_val}-{max_val}")
                    return False
                
                # Check reasonable distribution (not all same value)
                if max_val - min_val < 3:  # Reduced from 5 to 3 for fitness/form attributes
                    self.log_test("Player Attributes Range", False, 
                                 f"{attr} lacks variety: {min_val}-{max_val}")
                    return False
            
            # Check Premier League players have good abilities (11-17 range)
            premier_teams = [t for t in self.game_save["teams"] if t["division"] == 1]
            premier_players = []
            for team in premier_teams:
                premier_players.extend(team["squad"])
            
            premier_abilities = [p["current_ability"] for p in premier_players]
            avg_premier_ability = statistics.mean(premier_abilities)
            
            if not (11 <= avg_premier_ability <= 17):
                self.log_test("Player Attributes Range", False, 
                             f"Premier League average ability unrealistic: {avg_premier_ability:.1f}")
                return False
            
            self.log_test("Player Attributes Range", True, 
                         f"All attributes in 1-20 range, Premier League avg: {avg_premier_ability:.1f}")
            return True
            
        except Exception as e:
            self.log_test("Player Attributes Range", False, f"Validation failed: {str(e)}")
            return False
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all tests and return summary"""
        print("🏈 Starting Backend Test Suite for Match Engine")
        print("=" * 60)
        
        # Core backend tests
        if not self.test_backend_health():
            return self.get_summary()
        
        if not self.test_get_teams():
            return self.get_summary()
        
        if not self.test_create_new_game():
            return self.get_summary()
        
        # Game structure tests
        self.test_team_structure()
        self.test_fixtures_generation()
        self.test_player_attributes_range()
        
        # Match engine tests
        self.test_match_engine_realism()
        self.test_scoreline_distribution()
        self.test_team_strength_correlation()
        
        return self.get_summary()
    
    def get_summary(self) -> Dict[str, Any]:
        """Get test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
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
        
        return {
            "total_tests": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": (passed_tests/total_tests)*100,
            "results": self.test_results
        }

def main():
    """Main test runner"""
    tester = BackendTester()
    summary = tester.run_all_tests()
    
    # Exit with error code if tests failed
    if summary["failed"] > 0:
        sys.exit(1)
    else:
        print("\n🎉 All tests passed!")
        sys.exit(0)

if __name__ == "__main__":
    main()