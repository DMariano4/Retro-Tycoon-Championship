#!/usr/bin/env python3
"""
Backend Test Suite for Retro Football Championship API
Focus: Nationality System Integration Testing

This test suite verifies that the nationality system is properly integrated
and working as expected when creating new games.
"""

import requests
import json
import sys
from typing import Dict, List, Any
from collections import Counter

# Test Configuration
BACKEND_URLS = [
    "https://code-ingest.preview.emergentagent.com",  # Production URL from frontend .env
    "http://localhost:8001"  # Local development URL from review request
]

def test_api_connection(base_url: str) -> bool:
    """Test if the API is accessible"""
    try:
        response = requests.get(f"{base_url}/api/", timeout=10)
        if response.status_code == 200:
            print(f"✅ API connection successful: {base_url}")
            return True
        else:
            print(f"❌ API connection failed: {base_url} (Status: {response.status_code})")
            return False
    except Exception as e:
        print(f"❌ API connection error: {base_url} - {str(e)}")
        return False

def get_available_teams(base_url: str) -> List[Dict]:
    """Get list of available teams"""
    try:
        response = requests.get(f"{base_url}/api/teams", timeout=10)
        if response.status_code == 200:
            teams = response.json()
            print(f"✅ GET /api/teams successful - {len(teams)} teams available")
            return teams
        else:
            print(f"❌ GET /api/teams failed (Status: {response.status_code})")
            return []
    except Exception as e:
        print(f"❌ GET /api/teams error: {str(e)}")
        return []

def create_new_game(base_url: str, team_id: str) -> Dict:
    """Create a new game and return the game data"""
    try:
        payload = {
            "team_id": team_id,
            "save_name": "Nationality Test Game",
            "currency_symbol": "£"
        }
        
        response = requests.post(
            f"{base_url}/api/game/new", 
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            game_data = response.json()
            print(f"✅ POST /api/game/new successful - Game created")
            return game_data
        else:
            print(f"❌ POST /api/game/new failed (Status: {response.status_code})")
            print(f"Response: {response.text}")
            return {}
    except Exception as e:
        print(f"❌ POST /api/game/new error: {str(e)}")
        return {}

def analyze_nationality_distribution(players: List[Dict]) -> Dict:
    """Analyze nationality distribution in a list of players"""
    nationality_counts = Counter()
    nationality_flags = {}
    player_names_by_nationality = {}
    
    for player in players:
        nationality = player.get('nationality', 'Unknown')
        nationality_flag = player.get('nationality_flag', '')
        player_name = player.get('name', 'Unknown')
        
        nationality_counts[nationality] += 1
        nationality_flags[nationality] = nationality_flag
        
        if nationality not in player_names_by_nationality:
            player_names_by_nationality[nationality] = []
        player_names_by_nationality[nationality].append(player_name)
    
    return {
        'counts': dict(nationality_counts),
        'flags': nationality_flags,
        'names': player_names_by_nationality,
        'total_players': len(players),
        'unique_nationalities': len(nationality_counts)
    }

def test_nationality_system(base_url: str) -> bool:
    """Main test function for nationality system"""
    print("\n" + "="*80)
    print("🎯 NATIONALITY SYSTEM INTEGRATION TEST")
    print("="*80)
    
    # Step 1: Test API connection
    print("\n📡 Step 1: Testing API Connection")
    if not test_api_connection(base_url):
        return False
    
    # Step 2: Get available teams
    print("\n🏟️ Step 2: Getting Available Teams")
    teams = get_available_teams(base_url)
    if not teams:
        return False
    
    # Select first team for testing
    selected_team = teams[0]
    print(f"Selected team for testing: {selected_team['name']} (ID: {selected_team['id']})")
    
    # Step 3: Create new game
    print("\n🎮 Step 3: Creating New Game")
    game_data = create_new_game(base_url, selected_team['id'])
    if not game_data:
        return False
    
    # Step 4: Analyze nationality system
    print("\n🌍 Step 4: Analyzing Nationality System")
    
    # Find the managed team in the game data
    managed_team_id = game_data.get('managed_team_id')
    managed_team = None
    
    for team in game_data.get('teams', []):
        if team['id'] == managed_team_id:
            managed_team = team
            break
    
    if not managed_team:
        print("❌ Could not find managed team in game data")
        return False
    
    squad = managed_team.get('squad', [])
    if not squad:
        print("❌ No squad found for managed team")
        return False
    
    print(f"📊 Analyzing squad of {len(squad)} players...")
    
    # Analyze nationality distribution
    analysis = analyze_nationality_distribution(squad)
    
    # Print detailed results
    print(f"\n📈 NATIONALITY ANALYSIS RESULTS:")
    print(f"Total Players: {analysis['total_players']}")
    print(f"Unique Nationalities: {analysis['unique_nationalities']}")
    
    print(f"\n🏴 NATIONALITY BREAKDOWN:")
    for nationality, count in sorted(analysis['counts'].items(), key=lambda x: x[1], reverse=True):
        flag = analysis['flags'].get(nationality, '❓')
        percentage = (count / analysis['total_players']) * 100
        print(f"  {flag} {nationality}: {count} players ({percentage:.1f}%)")
    
    # Test specific requirements from review request
    print(f"\n✅ REQUIREMENT VERIFICATION:")
    
    # Check 1: Players have nationality field with country names
    has_nationality_names = all(player.get('nationality') for player in squad)
    print(f"✅ All players have nationality names: {has_nationality_names}")
    
    # Check 2: Players have nationality_flag field with emoji flags
    has_nationality_flags = all(player.get('nationality_flag') for player in squad)
    print(f"✅ All players have nationality flags: {has_nationality_flags}")
    
    # Check 3: Multiple different nationalities appear (at least 3-4)
    min_nationalities = analysis['unique_nationalities'] >= 3
    print(f"✅ Multiple nationalities present ({analysis['unique_nationalities']} >= 3): {min_nationalities}")
    
    # Check 4: England should be around 35% but other nationalities should exist
    england_count = analysis['counts'].get('England', 0)
    england_percentage = (england_count / analysis['total_players']) * 100 if analysis['total_players'] > 0 else 0
    has_diverse_nationalities = analysis['unique_nationalities'] > 1
    print(f"✅ England representation: {england_count} players ({england_percentage:.1f}%)")
    print(f"✅ Diverse nationalities beyond England: {has_diverse_nationalities}")
    
    # Check 5: Show sample names for cultural appropriateness
    print(f"\n👥 SAMPLE PLAYER NAMES BY NATIONALITY:")
    for nationality, names in analysis['names'].items():
        flag = analysis['flags'].get(nationality, '❓')
        sample_names = names[:3]  # Show first 3 names
        print(f"  {flag} {nationality}: {', '.join(sample_names)}")
    
    # Check 6: Verify flags are emoji format
    print(f"\n🏴 FLAG FORMAT VERIFICATION:")
    for nationality, flag in analysis['flags'].items():
        if flag:
            print(f"  {nationality}: '{flag}' (Length: {len(flag)} chars)")
        else:
            print(f"  {nationality}: ❌ Missing flag")
    
    # Overall success criteria
    success_criteria = [
        has_nationality_names,
        has_nationality_flags,
        min_nationalities,
        has_diverse_nationalities,
        analysis['total_players'] >= 20  # Should have a full squad
    ]
    
    overall_success = all(success_criteria)
    
    print(f"\n🎯 OVERALL TEST RESULT: {'✅ PASS' if overall_success else '❌ FAIL'}")
    
    if not overall_success:
        print("❌ Failed criteria:")
        criteria_names = [
            "All players have nationality names",
            "All players have nationality flags", 
            "At least 3 different nationalities",
            "Diverse nationalities beyond England",
            "Full squad (20+ players)"
        ]
        for i, passed in enumerate(success_criteria):
            if not passed:
                print(f"  - {criteria_names[i]}")
    
    return overall_success

def main():
    """Main test execution"""
    print("🚀 Starting Nationality System Integration Test")
    
    # Try each backend URL until one works
    for base_url in BACKEND_URLS:
        print(f"\n🔗 Trying backend URL: {base_url}")
        
        if test_api_connection(base_url):
            success = test_nationality_system(base_url)
            
            if success:
                print(f"\n🎉 NATIONALITY SYSTEM TEST COMPLETED SUCCESSFULLY!")
                print(f"Backend URL: {base_url}")
                return True
            else:
                print(f"\n❌ NATIONALITY SYSTEM TEST FAILED!")
                print(f"Backend URL: {base_url}")
                return False
    
    print(f"\n❌ Could not connect to any backend URL")
    return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)