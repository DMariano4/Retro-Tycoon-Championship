from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import csv
import io
import json
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'football_manager')]

# Create the main app
app = FastAPI(title="Retro Championship Tycoon API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime

class SessionDataResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    session_token: str

class Player(BaseModel):
    id: str
    name: str
    age: int
    nationality: str
    position: str  # GK, CB, LB, RB, DM, CM, AM, LW, RW, ST
    preferred_positions: List[str] = []
    # Physical attributes (all positions)
    pace: int = 50
    strength: int = 50
    stamina: int = 50
    agility: int = 50
    # Mental attributes (all positions)
    work_rate: int = 50
    concentration: int = 50
    decision_making: int = 50
    composure: int = 50
    # Technical - Goalkeeper
    reflexes: int = 50
    handling: int = 50
    communication: int = 50
    # Technical - Defenders
    tackling: int = 50
    marking: int = 50
    positioning: int = 50
    crossing: int = 50  # for fullbacks
    # Technical - Midfielders
    passing: int = 50
    vision: int = 50
    dribbling: int = 50
    control: int = 50
    # Technical - Forwards
    finishing: int = 50
    off_the_ball: int = 50
    flair: int = 50
    heading: int = 50
    # Overall ratings
    current_ability: int = 50
    potential_ability: int = 60
    value: int = 100000
    wage: int = 1000
    contract_end: int = 2027
    morale: int = 70
    fitness: int = 100
    form: int = 70

class Team(BaseModel):
    id: str
    name: str
    short_name: str
    stadium: str
    division: int = 1  # 1=Premier, 2=Championship, 3=League One, 4=League Two
    budget: int = 10000000
    wage_budget: int = 500000
    formation: str = "4-4-2"
    primary_color: str = "#FF0000"
    secondary_color: str = "#FFFFFF"
    squad: List[Player] = []
    tactics: Dict[str, Any] = {}

class TeamStanding(BaseModel):
    team_id: str
    team_name: str
    played: int = 0
    won: int = 0
    drawn: int = 0
    lost: int = 0
    goals_for: int = 0
    goals_against: int = 0
    goal_difference: int = 0
    points: int = 0

class Fixture(BaseModel):
    id: str
    week: int
    home_team_id: str
    away_team_id: str
    home_team_name: str
    away_team_name: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    played: bool = False
    events: List[Dict[str, Any]] = []

class League(BaseModel):
    id: str
    name: str
    division: int
    season: int = 2024
    current_week: int = 1
    teams: List[str] = []  # team IDs
    table: List[TeamStanding] = []
    fixtures: List[Fixture] = []

class TransferListing(BaseModel):
    id: str
    player: Player
    team_id: str
    team_name: str
    asking_price: int
    listed_date: str

class GameSave(BaseModel):
    id: str
    user_id: Optional[str] = None  # for cloud saves
    name: str
    created_at: datetime
    updated_at: datetime
    game_date: str  # in-game date
    managed_team_id: str
    managed_team_name: str
    season: int
    leagues: List[League] = []
    teams: List[Team] = []
    transfer_market: List[TransferListing] = []
    budget: int = 0
    is_cloud: bool = False

class CreateGameRequest(BaseModel):
    team_id: str
    save_name: str

class SaveGameRequest(BaseModel):
    save_data: Dict[str, Any]
    is_cloud: bool = False

# ==================== AUTH HELPERS ====================

async def get_session_token(request: Request) -> Optional[str]:
    # Check cookie first
    session_token = request.cookies.get("session_token")
    if session_token:
        return session_token
    # Check Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None

async def get_current_user(request: Request) -> Optional[User]:
    session_token = await get_session_token(request)
    if not session_token:
        return None
    
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    if not session:
        return None
    
    # Check expiry with timezone awareness
    expires_at = session.get("expires_at")
    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at <= datetime.now(timezone.utc):
            return None
    
    user_doc = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    if user_doc:
        return User(**user_doc)
    return None

async def require_auth(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange session_id for session_token"""
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session ID")
    
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            user_data = auth_response.json()
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise HTTPException(status_code=500, detail="Authentication failed")
    
    session_data = SessionDataResponse(**user_data)
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    
    # Check if user exists
    existing_user = await db.users.find_one(
        {"email": session_data.email},
        {"_id": 0}
    )
    
    if existing_user:
        user_id = existing_user["user_id"]
    else:
        # Create new user
        await db.users.insert_one({
            "user_id": user_id,
            "email": session_data.email,
            "name": session_data.name,
            "picture": session_data.picture,
            "created_at": datetime.now(timezone.utc)
        })
    
    # Create session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_data.session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_data.session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "user_id": user_id,
        "email": session_data.email,
        "name": session_data.name,
        "picture": session_data.picture,
        "session_token": session_data.session_token
    }

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = await get_session_token(request)
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

# ==================== GAME DATA GENERATION ====================

FIRST_NAMES = ["James", "John", "Michael", "David", "Robert", "William", "Thomas", "Daniel", "Paul", "Mark",
               "Chris", "Steven", "Andrew", "Kevin", "Gary", "Peter", "Jason", "Ryan", "Wayne", "Frank",
               "Marcus", "Harry", "Jack", "Oliver", "Charlie", "George", "Oscar", "Leo", "Max", "Alfie"]

LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Taylor", "Clark",
              "Walker", "Hall", "Allen", "Young", "King", "Wright", "Green", "Adams", "Baker", "Hill",
              "Moore", "Jackson", "Martin", "Lee", "White", "Harris", "Robinson", "Lewis", "Scott", "Wood"]

NATIONALITIES = ["England", "Scotland", "Wales", "Ireland", "France", "Spain", "Germany", "Italy", "Brazil", "Argentina"]

PREMIER_LEAGUE_TEAMS = [
    {"name": "London Royals", "short": "LRO", "stadium": "Royal Park", "primary": "#FF0000", "secondary": "#FFFFFF"},
    {"name": "Manchester City FC", "short": "MCF", "stadium": "City Arena", "primary": "#6CABDD", "secondary": "#FFFFFF"},
    {"name": "Liverpool United", "short": "LIV", "stadium": "Anfield Road", "primary": "#C8102E", "secondary": "#FFFFFF"},
    {"name": "Chelsea Blues", "short": "CHE", "stadium": "Bridge Stadium", "primary": "#034694", "secondary": "#FFFFFF"},
    {"name": "Tottenham FC", "short": "TOT", "stadium": "White Hart Lane", "primary": "#132257", "secondary": "#FFFFFF"},
    {"name": "Arsenal Gunners", "short": "ARS", "stadium": "Emirates Arena", "primary": "#EF0107", "secondary": "#FFFFFF"},
    {"name": "Newcastle Eagles", "short": "NEW", "stadium": "St James Park", "primary": "#241F20", "secondary": "#FFFFFF"},
    {"name": "West Ham Hammers", "short": "WHU", "stadium": "London Stadium", "primary": "#7A263A", "secondary": "#1BB1E7"},
    {"name": "Aston Lions", "short": "AVL", "stadium": "Villa Park", "primary": "#95BFE5", "secondary": "#670E36"},
    {"name": "Brighton Seagulls", "short": "BRI", "stadium": "Amex Arena", "primary": "#0057B8", "secondary": "#FFFFFF"},
    {"name": "Wolves FC", "short": "WOL", "stadium": "Molineux", "primary": "#FDB913", "secondary": "#231F20"},
    {"name": "Crystal Palace", "short": "CRY", "stadium": "Selhurst Park", "primary": "#1B458F", "secondary": "#C4122E"},
    {"name": "Fulham Cottagers", "short": "FUL", "stadium": "Craven Cottage", "primary": "#000000", "secondary": "#FFFFFF"},
    {"name": "Brentford Bees", "short": "BRE", "stadium": "Brentford Stadium", "primary": "#E30613", "secondary": "#FFFFFF"},
    {"name": "Nottingham Forest", "short": "NFO", "stadium": "City Ground", "primary": "#DD0000", "secondary": "#FFFFFF"},
    {"name": "Bournemouth AFC", "short": "BOU", "stadium": "Vitality Stadium", "primary": "#DA291C", "secondary": "#000000"},
    {"name": "Everton Toffees", "short": "EVE", "stadium": "Goodison Park", "primary": "#003399", "secondary": "#FFFFFF"},
    {"name": "Leicester Foxes", "short": "LEI", "stadium": "King Power", "primary": "#003090", "secondary": "#FDBE11"},
    {"name": "Southampton Saints", "short": "SOU", "stadium": "St Marys", "primary": "#D71920", "secondary": "#FFFFFF"},
    {"name": "Ipswich Town", "short": "IPS", "stadium": "Portman Road", "primary": "#0000FF", "secondary": "#FFFFFF"}
]

def generate_player(position: str, ability_range: tuple = (40, 80)) -> Player:
    """Generate a random player"""
    age = random.randint(17, 35)
    base_ability = random.randint(ability_range[0], ability_range[1])
    
    # Adjust potential based on age
    if age < 21:
        potential = min(99, base_ability + random.randint(10, 30))
    elif age < 28:
        potential = min(99, base_ability + random.randint(0, 15))
    else:
        potential = base_ability
    
    # Position-specific stats
    if position == "GK":
        handling = base_ability + random.randint(-5, 15)
        tackling = random.randint(20, 40)
        shooting = random.randint(10, 30)
    elif position == "DEF":
        handling = random.randint(10, 30)
        tackling = base_ability + random.randint(-5, 15)
        shooting = random.randint(30, 50)
    elif position == "MID":
        handling = random.randint(10, 30)
        tackling = base_ability + random.randint(-10, 10)
        shooting = base_ability + random.randint(-10, 10)
    else:  # FWD
        handling = random.randint(10, 30)
        tackling = random.randint(20, 40)
        shooting = base_ability + random.randint(-5, 15)
    
    value = int(base_ability * base_ability * 1000 * (1 + (30 - age) / 30))
    wage = int(value / 50)
    
    return Player(
        id=f"player_{uuid.uuid4().hex[:8]}",
        name=f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
        age=age,
        nationality=random.choice(NATIONALITIES),
        position=position,
        preferred_positions=[position],
        pace=random.randint(base_ability - 15, min(99, base_ability + 15)),
        shooting=min(99, max(1, shooting)),
        passing=random.randint(base_ability - 15, min(99, base_ability + 15)),
        tackling=min(99, max(1, tackling)),
        heading=random.randint(base_ability - 15, min(99, base_ability + 15)),
        stamina=random.randint(60, 99),
        handling=min(99, max(1, handling)),
        current_ability=base_ability,
        potential_ability=potential,
        value=value,
        wage=wage,
        contract_end=2024 + random.randint(1, 5),
        morale=random.randint(60, 90),
        fitness=random.randint(80, 100),
        form=random.randint(50, 80)
    )

def generate_squad(division: int) -> List[Player]:
    """Generate a full squad based on division quality"""
    squad = []
    
    # Ability ranges by division
    ability_ranges = {
        1: (55, 85),  # Premier League
        2: (45, 75),  # Championship
        3: (35, 65),  # League One
        4: (25, 55)   # League Two
    }
    
    ability_range = ability_ranges.get(division, (40, 70))
    
    # Generate players by position
    positions = {
        "GK": 2,
        "DEF": 6,
        "MID": 6,
        "FWD": 4
    }
    
    for position, count in positions.items():
        for _ in range(count):
            squad.append(generate_player(position, ability_range))
    
    return squad

def generate_teams(division: int = 1) -> List[Team]:
    """Generate teams for a division"""
    teams = []
    team_data = PREMIER_LEAGUE_TEAMS if division == 1 else []
    
    if division != 1:
        # Generate fictional teams for other divisions
        division_names = {2: "Championship", 3: "League One", 4: "League Two"}
        prefixes = ["United", "City", "Town", "FC", "Rovers", "Athletic", "Wanderers", "Rangers"]
        cities = ["Bristol", "Leeds", "Sheffield", "Birmingham", "Coventry", "Derby", "Stoke", 
                  "Swansea", "Cardiff", "Reading", "Watford", "Luton", "Preston", "Blackburn",
                  "Burnley", "Sunderland", "Middlesbrough", "Hull", "Plymouth", "Norwich",
                  "Oxford", "Bolton", "Wigan", "Millwall"]
        
        random.shuffle(cities)
        for i in range(min(20, len(cities))):
            city = cities[i]
            prefix = random.choice(prefixes)
            team_data.append({
                "name": f"{city} {prefix}",
                "short": city[:3].upper(),
                "stadium": f"{city} Stadium",
                "primary": f"#{random.randint(0, 0xFFFFFF):06x}",
                "secondary": "#FFFFFF"
            })
    
    for i, data in enumerate(team_data):
        team = Team(
            id=f"team_{division}_{i}",
            name=data["name"],
            short_name=data["short"],
            stadium=data["stadium"],
            division=division,
            budget=50000000 // division,
            wage_budget=2000000 // division,
            formation="4-4-2",
            primary_color=data["primary"],
            secondary_color=data["secondary"],
            squad=generate_squad(division)
        )
        teams.append(team)
    
    return teams

def generate_fixtures(team_ids: List[str], team_names: Dict[str, str]) -> List[Fixture]:
    """Generate a full season of fixtures using round-robin algorithm"""
    fixtures = []
    n = len(team_ids)
    
    if n % 2 != 0:
        team_ids = team_ids + ["BYE"]
        n += 1
    
    week = 1
    teams = team_ids.copy()
    
    for round_num in range((n - 1) * 2):
        is_return = round_num >= (n - 1)
        
        for i in range(n // 2):
            home_idx = i
            away_idx = n - 1 - i
            
            home = teams[home_idx]
            away = teams[away_idx]
            
            if home == "BYE" or away == "BYE":
                continue
            
            if is_return:
                home, away = away, home
            
            fixtures.append(Fixture(
                id=f"fix_{week}_{i}",
                week=week,
                home_team_id=home,
                away_team_id=away,
                home_team_name=team_names.get(home, home),
                away_team_name=team_names.get(away, away)
            ))
        
        # Rotate teams (keep first fixed)
        teams = [teams[0]] + [teams[-1]] + teams[1:-1]
        week += 1
    
    return fixtures

def create_league(teams: List[Team], division: int) -> League:
    """Create a league with teams and fixtures"""
    league_names = {
        1: "Premier League",
        2: "Championship",
        3: "League One",
        4: "League Two"
    }
    
    team_ids = [t.id for t in teams]
    team_names = {t.id: t.name for t in teams}
    
    table = [
        TeamStanding(
            team_id=t.id,
            team_name=t.name
        ) for t in teams
    ]
    
    fixtures = generate_fixtures(team_ids, team_names)
    
    return League(
        id=f"league_{division}",
        name=league_names.get(division, f"Division {division}"),
        division=division,
        season=2024,
        current_week=1,
        teams=team_ids,
        table=table,
        fixtures=fixtures
    )

# ==================== GAME ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Retro Football Manager API", "version": "1.0.0"}

@api_router.get("/teams")
async def get_available_teams():
    """Get list of teams available for new game"""
    teams = generate_teams(division=1)
    return [{"id": t.id, "name": t.name, "stadium": t.stadium, "division": t.division} for t in teams]

@api_router.post("/game/new")
async def create_new_game(req: CreateGameRequest, request: Request):
    """Create a new game save"""
    # Generate all teams for the league
    teams = generate_teams(division=1)
    
    # Find selected team
    selected_team = next((t for t in teams if t.id == req.team_id), None)
    if not selected_team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Create league
    league = create_league(teams, division=1)
    
    # Generate transfer market
    transfer_market = []
    for team in teams:
        # List 1-2 players from each team
        for player in random.sample(team.squad, min(2, len(team.squad))):
            if random.random() > 0.7:  # 30% chance to be listed
                transfer_market.append(TransferListing(
                    id=f"listing_{player.id}",
                    player=player,
                    team_id=team.id,
                    team_name=team.name,
                    asking_price=int(player.value * random.uniform(1.1, 1.5)),
                    listed_date="2024-08-01"
                ))
    
    game_save = GameSave(
        id=f"save_{uuid.uuid4().hex[:12]}",
        name=req.save_name,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        game_date="2024-08-10",
        managed_team_id=selected_team.id,
        managed_team_name=selected_team.name,
        season=2024,
        leagues=[league],
        teams=teams,
        transfer_market=transfer_market,
        budget=selected_team.budget
    )
    
    # Check if user is authenticated for cloud save option
    user = await get_current_user(request)
    if user:
        game_save.user_id = user.user_id
    
    return game_save.dict()

@api_router.post("/game/save")
async def save_game(req: SaveGameRequest, request: Request):
    """Save game to cloud"""
    user = await get_current_user(request)
    
    save_data = req.save_data
    save_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if req.is_cloud and user:
        save_data["user_id"] = user.user_id
        save_data["is_cloud"] = True
        
        # Upsert to database
        await db.game_saves.update_one(
            {"id": save_data["id"]},
            {"$set": save_data},
            upsert=True
        )
    
    return {"success": True, "save_id": save_data["id"]}

@api_router.get("/game/saves")
async def get_cloud_saves(request: Request):
    """Get user's cloud saves"""
    user = await require_auth(request)
    
    saves = await db.game_saves.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    # Return summary info only
    return [{
        "id": s["id"],
        "name": s["name"],
        "managed_team_name": s.get("managed_team_name", "Unknown"),
        "game_date": s.get("game_date", "Unknown"),
        "season": s.get("season", 2024),
        "updated_at": s.get("updated_at")
    } for s in saves]

@api_router.get("/game/load/{save_id}")
async def load_game(save_id: str, request: Request):
    """Load a cloud save"""
    user = await require_auth(request)
    
    save = await db.game_saves.find_one(
        {"id": save_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not save:
        raise HTTPException(status_code=404, detail="Save not found")
    
    return save

@api_router.delete("/game/save/{save_id}")
async def delete_save(save_id: str, request: Request):
    """Delete a cloud save"""
    user = await require_auth(request)
    
    result = await db.game_saves.delete_one(
        {"id": save_id, "user_id": user.user_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Save not found")
    
    return {"success": True}

# ==================== MOD ROUTES ====================

@api_router.post("/mods/upload/teams")
async def upload_team_mod(file: UploadFile = File(...)):
    """Upload CSV file with custom team data"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")
    
    try:
        content = await file.read()
        text = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(text))
        
        teams = []
        for row in reader:
            team = {
                "id": row.get("id", f"team_mod_{len(teams)}"),
                "name": row.get("name", "Unknown Team"),
                "short_name": row.get("short_name", row.get("name", "UNK")[:3]),
                "stadium": row.get("stadium", "Stadium"),
                "division": int(row.get("division", 1)),
                "budget": int(row.get("budget", 10000000)),
                "primary_color": row.get("primary_color", "#FF0000"),
                "secondary_color": row.get("secondary_color", "#FFFFFF")
            }
            teams.append(team)
        
        return {"success": True, "teams_count": len(teams), "teams": teams}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")

@api_router.post("/mods/upload/players")
async def upload_player_mod(file: UploadFile = File(...)):
    """Upload CSV file with custom player data"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")
    
    try:
        content = await file.read()
        text = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(text))
        
        players = []
        for row in reader:
            player = {
                "id": row.get("id", f"player_mod_{len(players)}"),
                "name": row.get("name", "Unknown Player"),
                "team_id": row.get("team_id"),
                "age": int(row.get("age", 25)),
                "nationality": row.get("nationality", "England"),
                "position": row.get("position", "MID"),
                "pace": int(row.get("pace", 50)),
                "shooting": int(row.get("shooting", 50)),
                "passing": int(row.get("passing", 50)),
                "tackling": int(row.get("tackling", 50)),
                "heading": int(row.get("heading", 50)),
                "stamina": int(row.get("stamina", 50)),
                "handling": int(row.get("handling", 50)),
                "current_ability": int(row.get("current_ability", 50)),
                "potential_ability": int(row.get("potential_ability", 60)),
                "value": int(row.get("value", 1000000)),
                "wage": int(row.get("wage", 10000))
            }
            players.append(player)
        
        return {"success": True, "players_count": len(players), "players": players}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")

@api_router.get("/mods/template/teams")
async def get_teams_template():
    """Get CSV template for team mods"""
    return {
        "columns": ["id", "name", "short_name", "stadium", "division", "budget", "primary_color", "secondary_color"],
        "example_row": {
            "id": "team_custom_1",
            "name": "Custom FC",
            "short_name": "CFC",
            "stadium": "Custom Stadium",
            "division": 1,
            "budget": 50000000,
            "primary_color": "#FF0000",
            "secondary_color": "#FFFFFF"
        }
    }

@api_router.get("/mods/template/players")
async def get_players_template():
    """Get CSV template for player mods"""
    return {
        "columns": ["id", "name", "team_id", "age", "nationality", "position", "pace", "shooting", "passing", "tackling", "heading", "stamina", "handling", "current_ability", "potential_ability", "value", "wage"],
        "example_row": {
            "id": "player_custom_1",
            "name": "Custom Player",
            "team_id": "team_custom_1",
            "age": 25,
            "nationality": "England",
            "position": "MID",
            "pace": 70,
            "shooting": 65,
            "passing": 75,
            "tackling": 60,
            "heading": 55,
            "stamina": 80,
            "handling": 30,
            "current_ability": 68,
            "potential_ability": 75,
            "value": 5000000,
            "wage": 50000
        }
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
