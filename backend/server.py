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

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection with error handling
mongo_url = os.environ.get('MONGO_URL')
if not mongo_url:
    logger.error("MONGO_URL environment variable is not set")
    raise EnvironmentError("MONGO_URL environment variable is required")

client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'football_manager')]

# Create the main app
app = FastAPI(title="Retro Football Championship API")
api_router = APIRouter(prefix="/api")

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
    # Physical attributes (all positions) - 1-20 scale
    pace: int = 10
    strength: int = 10
    stamina: int = 10
    agility: int = 10
    # Mental attributes (all positions) - 1-20 scale
    work_rate: int = 10
    concentration: int = 10
    decision_making: int = 10
    composure: int = 10
    # Technical - Goalkeeper - 1-20 scale
    reflexes: int = 10
    handling: int = 10
    communication: int = 10
    # Technical - Defenders - 1-20 scale
    tackling: int = 10
    marking: int = 10
    positioning: int = 10
    crossing: int = 10  # for fullbacks
    # Technical - Midfielders - 1-20 scale
    passing: int = 10
    vision: int = 10
    dribbling: int = 10
    control: int = 10
    # Technical - Forwards - 1-20 scale
    finishing: int = 10
    off_the_ball: int = 10
    flair: int = 10
    heading: int = 10
    # Overall ratings - 1-20 scale
    current_ability: int = 10
    potential_ability: int = 12
    value: int = 100000
    wage: int = 1000
    contract_end: str = "2027-06-30"  # Contracts expire June 30th
    morale: int = 14  # 1-20 scale
    fitness: int = 20  # 1-20 scale
    form: int = 14  # 1-20 scale

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
    # ============================================
    # CLUB PROFILE — Foundation for Financial System
    # ============================================
    # Dynamic (auto-evolve based on performance)
    reputation: int = 16             # 1-20, affects sponsorship/player attraction
    fan_base: int = 10000             # Total active supporter pool, grows with success (max ~200K)
    fan_loyalty: int = 16            # 1-20, affects base attendance %
    sponsorship_monthly: int = 2000000  # Monthly sponsor income, recalculated from reputation + position
    # User-defined
    ticket_price: int = 40           # £ per match ticket, user adjustable
    ticket_price_base: int = 40      # Reference base for fan_loyalty impact calculation
    # Upgradeable (spend money to improve)
    stadium_capacity: int = 10000    # Max fans per home match (upgradeable to ~120K)
    youth_facilities: int = 16       # 1-20, youth academy quality
    training_facilities: int = 16    # 1-20, player development rate
    # Derived (calculated from facilities + squad)
    staff_costs_weekly: int = 300000 # Weekly overhead, scales with facilities + squad size

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
    match_date: str  # Actual date of the match (YYYY-MM-DD)
    match_type: str = "league"  # league, friendly, cup
    home_team_id: str
    away_team_id: str
    home_team_name: str
    away_team_name: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    played: bool = False
    events: List[Dict[str, Any]] = []

class SeasonCalendar(BaseModel):
    season_year: int  # e.g., 2025 for 2025/26 season
    pre_season_start: str  # July 1
    pre_season_end: str  # August 9
    season_start: str  # August 10 (first matchday)
    season_end: str  # May 25
    transfer_window_summer_start: str  # July 1
    transfer_window_summer_end: str  # August 31
    transfer_window_winter_start: str  # January 1
    transfer_window_winter_end: str  # January 31
    contract_expiry_date: str  # June 30

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
    game_date: str  # in-game date (YYYY-MM-DD)
    managed_team_id: str
    managed_team_name: str
    season: int  # Starting year of season (e.g., 2025 for 2025/26)
    calendar: SeasonCalendar
    leagues: List[League] = []
    teams: List[Team] = []
    transfer_market: List[TransferListing] = []
    budget: int = 0
    is_cloud: bool = False
    transfer_window_open: bool = True  # Track if transfers are allowed
    is_pre_season: bool = True  # Track if in pre-season

class CreateGameRequest(BaseModel):
    team_id: str
    save_name: str

class SaveGameRequest(BaseModel):
    save_data: Dict[str, Any]
    is_cloud: bool = False

# ==================== CALENDAR HELPERS ====================

def create_season_calendar(season_year: int) -> SeasonCalendar:
    """Create a season calendar starting from July of the given year"""
    return SeasonCalendar(
        season_year=season_year,
        pre_season_start=f"{season_year}-07-01",
        pre_season_end=f"{season_year}-08-09",
        season_start=f"{season_year}-08-10",
        season_end=f"{season_year + 1}-05-25",
        transfer_window_summer_start=f"{season_year}-07-01",
        transfer_window_summer_end=f"{season_year}-08-31",
        transfer_window_winter_start=f"{season_year + 1}-01-01",
        transfer_window_winter_end=f"{season_year + 1}-01-31",
        contract_expiry_date=f"{season_year + 1}-06-30"
    )

def is_transfer_window_open(game_date: str, calendar: SeasonCalendar) -> bool:
    """Check if current date is within a transfer window"""
    date = datetime.strptime(game_date, "%Y-%m-%d").date()
    summer_start = datetime.strptime(calendar.transfer_window_summer_start, "%Y-%m-%d").date()
    summer_end = datetime.strptime(calendar.transfer_window_summer_end, "%Y-%m-%d").date()
    winter_start = datetime.strptime(calendar.transfer_window_winter_start, "%Y-%m-%d").date()
    winter_end = datetime.strptime(calendar.transfer_window_winter_end, "%Y-%m-%d").date()
    
    return (summer_start <= date <= summer_end) or (winter_start <= date <= winter_end)

def get_season_phase(game_date: str, calendar: SeasonCalendar) -> str:
    """Get current phase: pre_season, season, or off_season"""
    date = datetime.strptime(game_date, "%Y-%m-%d").date()
    pre_start = datetime.strptime(calendar.pre_season_start, "%Y-%m-%d").date()
    pre_end = datetime.strptime(calendar.pre_season_end, "%Y-%m-%d").date()
    season_start = datetime.strptime(calendar.season_start, "%Y-%m-%d").date()
    season_end = datetime.strptime(calendar.season_end, "%Y-%m-%d").date()
    
    if pre_start <= date <= pre_end:
        return "pre_season"
    elif season_start <= date <= season_end:
        return "season"
    else:
        return "off_season"

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

def generate_player(position: str, ability_range: tuple = (8, 17)) -> Player:
    """Generate a random player with position-specific stats (1-20 scale)"""
    age = random.randint(17, 35)
    base_ability = random.randint(ability_range[0], ability_range[1])
    
    # Adjust potential based on age (1-20 scale)
    if age < 21:
        potential = min(20, base_ability + random.randint(2, 6))
    elif age < 28:
        potential = min(20, base_ability + random.randint(0, 3))
    else:
        potential = base_ability
    
    # Helper to generate stat with variance (1-20 scale)
    def stat(base, bonus=0, variance=3):
        return min(20, max(1, base + bonus + random.randint(-variance, variance)))
    
    # Physical attributes (all positions)
    pace = stat(base_ability)
    strength = stat(base_ability)
    stamina = stat(base_ability, 1)
    agility = stat(base_ability)
    
    # Mental attributes (all positions)
    work_rate = stat(base_ability)
    concentration = stat(base_ability)
    decision_making = stat(base_ability)
    composure = stat(base_ability)
    
    # Position-specific stats with defaults
    reflexes = stat(6)
    handling = stat(6)
    communication = stat(6)
    tackling = stat(base_ability, -2)
    marking = stat(base_ability, -2)
    positioning = stat(base_ability)
    crossing = stat(base_ability, -2)
    passing = stat(base_ability)
    vision = stat(base_ability, -1)
    dribbling = stat(base_ability, -1)
    control = stat(base_ability)
    finishing = stat(base_ability, -2)
    off_the_ball = stat(base_ability, -1)
    flair = stat(base_ability, -2)
    heading = stat(base_ability, -1)
    
    # Position-specific boosts
    if position == "GK":
        reflexes = stat(base_ability, 2)
        handling = stat(base_ability, 2)
        communication = stat(base_ability, 1)
        positioning = stat(base_ability, 1)
        tackling = stat(4)
        finishing = stat(3)
    elif position in ["CB"]:
        tackling = stat(base_ability, 2)
        marking = stat(base_ability, 2)
        positioning = stat(base_ability, 1)
        heading = stat(base_ability, 1)
        strength = stat(base_ability, 1)
    elif position in ["LB", "RB"]:
        tackling = stat(base_ability, 1)
        marking = stat(base_ability, 1)
        positioning = stat(base_ability, 1)
        crossing = stat(base_ability, 2)
        pace = stat(base_ability, 2)
    elif position in ["DM"]:
        tackling = stat(base_ability, 2)
        marking = stat(base_ability, 1)
        positioning = stat(base_ability, 2)
        passing = stat(base_ability, 1)
        work_rate = stat(base_ability, 2)
    elif position in ["CM"]:
        passing = stat(base_ability, 2)
        vision = stat(base_ability, 1)
        control = stat(base_ability, 1)
        stamina = stat(base_ability, 2)
    elif position in ["AM"]:
        passing = stat(base_ability, 1)
        vision = stat(base_ability, 2)
        dribbling = stat(base_ability, 2)
        off_the_ball = stat(base_ability, 1)
    elif position in ["LW", "RW"]:
        pace = stat(base_ability, 3)
        dribbling = stat(base_ability, 2)
        crossing = stat(base_ability, 2)
        finishing = stat(base_ability, 1)
    elif position == "ST":
        finishing = stat(base_ability, 3)
        off_the_ball = stat(base_ability, 2)
        heading = stat(base_ability, 1)
        composure = stat(base_ability, 1)
    
    # Calculate value and wage based on 1-20 scale
    value = int(base_ability * base_ability * 250000 * (1 + (30 - age) / 30))
    wage = int(value / 50)
    
    return Player(
        id=f"player_{uuid.uuid4().hex[:8]}",
        name=f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
        age=age,
        nationality=random.choice(NATIONALITIES),
        position=position,
        preferred_positions=[position],
        # Physical
        pace=pace,
        strength=strength,
        stamina=stamina,
        agility=agility,
        # Mental
        work_rate=work_rate,
        concentration=concentration,
        decision_making=decision_making,
        composure=composure,
        # Technical - GK
        reflexes=reflexes,
        handling=handling,
        communication=communication,
        # Technical - Defenders
        tackling=tackling,
        marking=marking,
        positioning=positioning,
        crossing=crossing,
        # Technical - Midfielders
        passing=passing,
        vision=vision,
        dribbling=dribbling,
        control=control,
        # Technical - Forwards
        finishing=finishing,
        off_the_ball=off_the_ball,
        flair=flair,
        heading=heading,
        # Overall
        current_ability=base_ability,
        potential_ability=potential,
        value=value,
        wage=wage,
        contract_end=f"{2025 + random.randint(1, 4)}-06-30",  # Contracts expire June 30th
        morale=random.randint(12, 18),  # 1-20 scale
        fitness=random.randint(16, 20),  # 1-20 scale
        form=random.randint(10, 16)  # 1-20 scale
    )

def generate_squad(division: int, season_year: int = 2025) -> List[Player]:
    """Generate a full squad based on division quality"""
    squad = []
    
    # Ability ranges by division (1-20 scale)
    ability_ranges = {
        1: (11, 17),  # Premier League
        2: (9, 15),   # Championship
        3: (7, 13),   # League One
        4: (5, 11)    # League Two
    }
    
    ability_range = ability_ranges.get(division, (8, 14))
    
    # Generate players by specific positions
    positions = {
        "GK": 2,
        "CB": 4,
        "LB": 2,
        "RB": 2,
        "DM": 2,
        "CM": 3,
        "AM": 2,
        "LW": 2,
        "RW": 2,
        "ST": 3
    }
    
    for position, count in positions.items():
        for _ in range(count):
            squad.append(generate_player(position, ability_range))
    
    return squad

def calculate_staff_costs(facilities_avg: float, squad_size: int) -> int:
    """Derive weekly staff costs from facilities level and squad size.
    Higher facilities and bigger squads cost more to maintain."""
    base_cost = 100000  # £100K minimum
    facilities_cost = int(facilities_avg * 10000)  # £10K per facilities point
    squad_cost = squad_size * 2000  # £2K per player
    return base_cost + facilities_cost + squad_cost


def generate_teams(division: int = 1) -> List[Team]:
    """Generate teams for a division with scaled club profiles.
    
    Base values (Division 1 = 80% of theoretical max):
    - reputation: 16, fan_loyalty: 16, youth_facilities: 16, training_facilities: 16
    - stadium_capacity: 40,000, ticket_price: £40
    - sponsorship_monthly: £2,000,000, starting_budget: £50,000,000
    
    Division scaling: value × (0.75 ^ (division - 1))
    """
    teams = []
    team_data = PREMIER_LEAGUE_TEAMS if division == 1 else []
    
    if division != 1:
        # Generate fictional teams for other divisions
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
    
    # Division scaling factor: 25% reduction per division level
    scale = 0.75 ** (division - 1)
    
    # Base values (Division 1 = 80% of theoretical max)
    base_reputation = round(16 * scale)
    base_fan_base = round(10000 * scale)
    base_fan_loyalty = round(16 * scale)
    base_youth_facilities = round(16 * scale)
    base_training_facilities = round(16 * scale)
    base_stadium_capacity = round(10000 * scale)
    base_ticket_price = round(40 * scale)
    base_sponsorship = round(2000000 * scale)
    base_budget = round(50000000 * scale)
    base_wage_budget = round(2000000 * scale)
    
    # Ability ranges scale with division
    ability_ranges = {
        1: (11, 17),
        2: (9, 14),
        3: (7, 11),
        4: (5, 9)
    }
    
    for i, data in enumerate(team_data):
        squad = generate_squad(division, season_year=2025)
        facilities_avg = (base_youth_facilities + base_training_facilities) / 2.0
        staff_costs = calculate_staff_costs(facilities_avg, len(squad))
        
        team = Team(
            id=f"team_{division}_{i}",
            name=data["name"],
            short_name=data["short"],
            stadium=data["stadium"],
            division=division,
            budget=base_budget,
            wage_budget=base_wage_budget,
            formation="4-4-2",
            primary_color=data["primary"],
            secondary_color=data["secondary"],
            squad=squad,
            # Club profile (scaled by division)
            reputation=base_reputation,
            fan_base=base_fan_base,
            fan_loyalty=base_fan_loyalty,
            stadium_capacity=base_stadium_capacity,
            ticket_price=base_ticket_price,
            ticket_price_base=base_ticket_price,
            sponsorship_monthly=base_sponsorship,
            youth_facilities=base_youth_facilities,
            training_facilities=base_training_facilities,
            staff_costs_weekly=staff_costs,
        )
        teams.append(team)
    
    return teams

def generate_fixtures(team_ids: List[str], team_names: Dict[str, str], season_year: int = 2025) -> List[Fixture]:
    """Generate a full season of fixtures using round-robin algorithm with real dates"""
    fixtures = []
    n = len(team_ids)
    
    if n % 2 != 0:
        team_ids = team_ids + ["BYE"]
        n += 1
    
    # Season starts August 10, matches typically on Saturdays
    # 38 matchweeks for 20-team league
    season_start = datetime(season_year, 8, 10)
    
    week = 1
    teams_list = team_ids.copy()
    
    for round_num in range((n - 1) * 2):
        is_return = round_num >= (n - 1)
        
        # Calculate match date - mostly Saturdays, some midweek
        # First half: Aug 10 - Dec 26, Second half: Jan 1 - May 25
        if week <= 19:
            # First half of season
            match_date = season_start + timedelta(weeks=week - 1)
        else:
            # Second half of season (starts Jan 1)
            second_half_start = datetime(season_year + 1, 1, 1)
            match_date = second_half_start + timedelta(weeks=week - 20)
        
        # Adjust to nearest Saturday
        days_until_saturday = (5 - match_date.weekday()) % 7
        match_date = match_date + timedelta(days=days_until_saturday)
        match_date_str = match_date.strftime("%Y-%m-%d")
        
        for i in range(n // 2):
            home_idx = i
            away_idx = n - 1 - i
            
            home = teams_list[home_idx]
            away = teams_list[away_idx]
            
            if home == "BYE" or away == "BYE":
                continue
            
            if is_return:
                home, away = away, home
            
            fixtures.append(Fixture(
                id=f"fix_{week}_{i}",
                week=week,
                match_date=match_date_str,
                match_type="league",
                home_team_id=home,
                away_team_id=away,
                home_team_name=team_names.get(home, home),
                away_team_name=team_names.get(away, away)
            ))
        
        # Rotate teams (keep first fixed)
        teams_list = [teams_list[0]] + [teams_list[-1]] + teams_list[1:-1]
        week += 1
    
    return fixtures

def generate_preseason_friendlies(team: Team, all_teams: List[Team], season_year: int = 2025) -> List[Fixture]:
    """Generate pre-season friendly fixtures for a team"""
    friendlies = []
    
    # 4 friendlies in July
    friendly_dates = [
        f"{season_year}-07-12",
        f"{season_year}-07-19",
        f"{season_year}-07-26",
        f"{season_year}-08-02"
    ]
    
    # Pick random opponents (not self)
    opponents = [t for t in all_teams if t.id != team.id]
    random.shuffle(opponents)
    
    for i, date in enumerate(friendly_dates):
        opponent = opponents[i % len(opponents)]
        is_home = random.choice([True, False])
        
        friendlies.append(Fixture(
            id=f"friendly_{team.id}_{i}",
            week=0,  # Pre-season
            match_date=date,
            match_type="friendly",
            home_team_id=team.id if is_home else opponent.id,
            away_team_id=opponent.id if is_home else team.id,
            home_team_name=team.name if is_home else opponent.name,
            away_team_name=opponent.name if is_home else team.name
        ))
    
    return friendlies

def create_league(teams: List[Team], division: int, season_year: int = 2025) -> League:
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
    
    fixtures = generate_fixtures(team_ids, team_names, season_year)
    
    return League(
        id=f"league_{division}",
        name=league_names.get(division, f"Division {division}"),
        division=division,
        season=season_year,
        current_week=1,
        teams=team_ids,
        table=table,
        fixtures=fixtures
    )

# ==================== GAME ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Retro Football Championship API", "version": "1.0.0"}

@api_router.get("/teams")
async def get_available_teams():
    """Get list of teams available for new game"""
    teams = generate_teams(division=1)
    return [{"id": t.id, "name": t.name, "stadium": t.stadium, "division": t.division} for t in teams]

@api_router.post("/game/new")
async def create_new_game(req: CreateGameRequest, request: Request):
    """Create a new game save starting in July 2025 pre-season"""
    season_year = 2025
    
    # Generate all teams for the league
    teams = generate_teams(division=1)
    
    # Find selected team
    selected_team = next((t for t in teams if t.id == req.team_id), None)
    if not selected_team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Create season calendar
    calendar = create_season_calendar(season_year)
    
    # Create league with proper dates
    league = create_league(teams, division=1, season_year=season_year)
    
    # Generate pre-season friendlies for managed team
    friendlies = generate_preseason_friendlies(selected_team, teams, season_year)
    
    # Add friendlies to fixtures (they go before league fixtures)
    league.fixtures = friendlies + league.fixtures
    
    # Generate transfer market (window is open in pre-season)
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
                    listed_date=f"{season_year}-07-01"
                ))
    
    game_save = GameSave(
        id=f"save_{uuid.uuid4().hex[:12]}",
        name=req.save_name,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        game_date=f"{season_year}-07-01",  # Start July 1st (pre-season)
        managed_team_id=selected_team.id,
        managed_team_name=selected_team.name,
        season=season_year,
        calendar=calendar,
        leagues=[league],
        teams=teams,
        transfer_market=transfer_market,
        budget=selected_team.budget,
        transfer_window_open=True,
        is_pre_season=True
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
