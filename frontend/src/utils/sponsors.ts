/**
 * Sponsor Calculation System
 * 
 * Calculates realistic sponsor values based on club reputation (1-20 scale).
 * All values are annual amounts.
 */

// Generic sponsor name pools (no real brands)
const KIT_MANUFACTURERS = {
  local: ['ProKit', 'SportGear', 'ActiveWear', 'TeamKit', 'LocalSport'],
  regional: ['SportMax', 'AthleticCo', 'PrimeSport', 'VelocityKit', 'StrikeWear'],
  national: ['Apex Sports', 'Titan Athletic', 'Phoenix Sportswear', 'Summit Gear', 'Dynamo Kit'],
  major: ['GlobalSport', 'Elite Athletic', 'Victory Sports', 'Champion Gear', 'Premier Kit'],
  elite: ['Olympus Sports', 'Prestige Athletic', 'Crown Sportswear', 'Imperial Gear', 'Zenith Sports'],
};

const SHIRT_SPONSORS = {
  local: ['City Motors', 'Metro Insurance', 'Regional Bank', 'Local Builders', 'Town Electricals'],
  regional: ['Eastland Airways', 'Northern Finance', 'Coastal Hotels', 'Highland Energy', 'Valley Tech'],
  national: ['National Express', 'United Insurance', 'Central Bank', 'Standard Motors', 'Premier Telecom'],
  major: ['Global Airlines', 'World Finance', 'Continental Hotels', 'Universal Energy', 'Mega Tech'],
  elite: ['Skyward Airways', 'Titan Financial', 'Imperial Hotels', 'Apex Energy', 'Quantum Tech'],
};

const SLEEVE_SPONSORS = {
  entry: ['QuickBet', 'FastLoans', 'EasyInsure', 'SmartPay', 'DirectDeals'],
  standard: ['BetPro', 'FinanceHub', 'InsurePlus', 'PayMax', 'DealZone'],
  premium: ['EliteBet', 'WealthCorp', 'SecureLife', 'GoldPay', 'LuxuryDeals'],
};

const STADIUM_SPONSORS = {
  regional: ['Metro Arena', 'City Stadium', 'Regional Park', 'County Ground', 'Town Arena'],
  national: ['National Stadium', 'Central Arena', 'United Park', 'Premier Ground', 'Capital Arena'],
  global: ['Global Arena', 'World Stadium', 'Imperial Park', 'Titan Ground', 'Apex Arena'],
};

const TRAINING_SPONSORS = {
  basic: ['FitZone', 'TrainPro', 'SportBase', 'ActiveHub', 'GymTech'],
  standard: ['EliteFit', 'ProTrain', 'SportMax', 'PrimeHub', 'PowerTech'],
  premium: ['ApexFitness', 'UltraTrain', 'PremierSport', 'EliteHub', 'TitanTech'],
};

const PARTNER_SPONSORS = {
  basic: ['CityBank', 'RegionalAir', 'LocalMedia', 'AreaTech'],
  standard: ['NationalBank', 'SkyAir', 'MediaCorp', 'TechSolutions', 'FinanceFirst'],
  premium: ['GlobalBank', 'WorldAir', 'PrimeMedia', 'MegaTech', 'WealthManagement', 'LuxuryBrands'],
};

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInRange(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

export interface SponsorBreakdown {
  kit_manufacturer: { name: string; annual: number; tier: string };
  main_shirt: { name: string; annual: number; tier: string };
  sleeve?: { name: string; annual: number; tier: string };
  stadium_naming?: { name: string; annual: number; tier: string };
  training_ground?: { name: string; annual: number; tier: string };
  official_partners?: { name: string; annual: number; tier: string; count: number };
  total_annual: number;
}

/**
 * Calculate all sponsors for a club based on reputation
 */
export function calculateSponsors(reputation: number): SponsorBreakdown {
  let totalAnnual = 0;

  // Kit Manufacturer (all clubs)
  let kitTier: string;
  let kitAnnual: number;
  let kitName: string;
  
  if (reputation <= 4) {
    kitTier = 'Local';
    kitAnnual = randomInRange(50000, 200000);
    kitName = randomFromArray(KIT_MANUFACTURERS.local);
  } else if (reputation <= 8) {
    kitTier = 'Regional';
    kitAnnual = randomInRange(200000, 1000000);
    kitName = randomFromArray(KIT_MANUFACTURERS.regional);
  } else if (reputation <= 12) {
    kitTier = 'National';
    kitAnnual = randomInRange(1000000, 5000000);
    kitName = randomFromArray(KIT_MANUFACTURERS.national);
  } else if (reputation <= 16) {
    kitTier = 'Major';
    kitAnnual = randomInRange(5000000, 20000000);
    kitName = randomFromArray(KIT_MANUFACTURERS.major);
  } else {
    kitTier = 'Elite';
    kitAnnual = randomInRange(20000000, 60000000);
    kitName = randomFromArray(KIT_MANUFACTURERS.elite);
  }
  totalAnnual += kitAnnual;

  // Main Shirt Sponsor (all clubs)
  let shirtTier: string;
  let shirtAnnual: number;
  let shirtName: string;
  
  if (reputation <= 4) {
    shirtTier = 'Local';
    shirtAnnual = randomInRange(20000, 100000);
    shirtName = randomFromArray(SHIRT_SPONSORS.local);
  } else if (reputation <= 8) {
    shirtTier = 'Regional';
    shirtAnnual = randomInRange(100000, 500000);
    shirtName = randomFromArray(SHIRT_SPONSORS.regional);
  } else if (reputation <= 12) {
    shirtTier = 'National';
    shirtAnnual = randomInRange(500000, 5000000);
    shirtName = randomFromArray(SHIRT_SPONSORS.national);
  } else if (reputation <= 16) {
    shirtTier = 'Major';
    shirtAnnual = randomInRange(5000000, 25000000);
    shirtName = randomFromArray(SHIRT_SPONSORS.major);
  } else {
    shirtTier = 'Elite';
    shirtAnnual = randomInRange(25000000, 70000000);
    shirtName = randomFromArray(SHIRT_SPONSORS.elite);
  }
  totalAnnual += shirtAnnual;

  const result: SponsorBreakdown = {
    kit_manufacturer: { name: kitName, annual: kitAnnual, tier: kitTier },
    main_shirt: { name: shirtName, annual: shirtAnnual, tier: shirtTier },
    total_annual: 0, // Will be set at end
  };

  // Sleeve Sponsor (Rep 8+ only)
  if (reputation >= 8) {
    let sleeveTier: string;
    let sleeveAnnual: number;
    let sleeveName: string;
    
    if (reputation <= 11) {
      sleeveTier = 'Entry';
      sleeveAnnual = randomInRange(100000, 500000);
      sleeveName = randomFromArray(SLEEVE_SPONSORS.entry);
    } else if (reputation <= 15) {
      sleeveTier = 'Standard';
      sleeveAnnual = randomInRange(500000, 3000000);
      sleeveName = randomFromArray(SLEEVE_SPONSORS.standard);
    } else {
      sleeveTier = 'Premium';
      sleeveAnnual = randomInRange(3000000, 15000000);
      sleeveName = randomFromArray(SLEEVE_SPONSORS.premium);
    }
    totalAnnual += sleeveAnnual;
    result.sleeve = { name: sleeveName, annual: sleeveAnnual, tier: sleeveTier };
  }

  // Stadium Naming Rights (Rep 12+ only)
  if (reputation >= 12) {
    let stadiumTier: string;
    let stadiumAnnual: number;
    let stadiumName: string;
    
    if (reputation <= 14) {
      stadiumTier = 'Regional';
      stadiumAnnual = randomInRange(1000000, 5000000);
      stadiumName = randomFromArray(STADIUM_SPONSORS.regional);
    } else if (reputation <= 17) {
      stadiumTier = 'National';
      stadiumAnnual = randomInRange(5000000, 15000000);
      stadiumName = randomFromArray(STADIUM_SPONSORS.national);
    } else {
      stadiumTier = 'Global';
      stadiumAnnual = randomInRange(15000000, 30000000);
      stadiumName = randomFromArray(STADIUM_SPONSORS.global);
    }
    totalAnnual += stadiumAnnual;
    result.stadium_naming = { name: stadiumName, annual: stadiumAnnual, tier: stadiumTier };
  }

  // Training Ground Partner (Rep 6+ only)
  if (reputation >= 6) {
    let trainingTier: string;
    let trainingAnnual: number;
    let trainingName: string;
    
    if (reputation <= 10) {
      trainingTier = 'Basic';
      trainingAnnual = randomInRange(50000, 300000);
      trainingName = randomFromArray(TRAINING_SPONSORS.basic);
    } else if (reputation <= 15) {
      trainingTier = 'Standard';
      trainingAnnual = randomInRange(300000, 2000000);
      trainingName = randomFromArray(TRAINING_SPONSORS.standard);
    } else {
      trainingTier = 'Premium';
      trainingAnnual = randomInRange(2000000, 8000000);
      trainingName = randomFromArray(TRAINING_SPONSORS.premium);
    }
    totalAnnual += trainingAnnual;
    result.training_ground = { name: trainingName, annual: trainingAnnual, tier: trainingTier };
  }

  // Official Partners (Rep 10+ only)
  if (reputation >= 10) {
    let partnerTier: string;
    let partnerAnnual: number;
    let partnerCount: number;
    let partnerNames: string[];
    
    if (reputation <= 13) {
      partnerTier = 'Basic';
      partnerCount = randomInRange(1, 2);
      partnerAnnual = randomInRange(500000, 2000000);
      partnerNames = PARTNER_SPONSORS.basic;
    } else if (reputation <= 17) {
      partnerTier = 'Standard';
      partnerCount = randomInRange(2, 4);
      partnerAnnual = randomInRange(2000000, 8000000);
      partnerNames = PARTNER_SPONSORS.standard;
    } else {
      partnerTier = 'Premium';
      partnerCount = randomInRange(4, 6);
      partnerAnnual = randomInRange(8000000, 20000000);
      partnerNames = PARTNER_SPONSORS.premium;
    }
    totalAnnual += partnerAnnual;
    result.official_partners = { 
      name: partnerNames.slice(0, partnerCount).join(', '), 
      annual: partnerAnnual, 
      tier: partnerTier,
      count: partnerCount
    };
  }

  result.total_annual = totalAnnual;
  return result;
}

/**
 * Get monthly sponsorship from annual total
 */
export function getMonthlySponsorship(sponsors: SponsorBreakdown): number {
  return Math.round(sponsors.total_annual / 12);
}

/**
 * Format sponsor value for display
 */
export function formatSponsorValue(value: number, currency: string = '£'): string {
  if (value >= 1000000) {
    return `${currency}${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${currency}${(value / 1000).toFixed(0)}K`;
  }
  return `${currency}${value}`;
}
