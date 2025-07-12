// src/services/TownSystem.js

export const generateInitialTowns = () => {
  const townNames = [
    "Silverbrook", "Goldport", "Ironwatch", "Crystalhaven", "Thornvale", 
    "Stormhold", "Duskwood", "Brightwater", "Shadowmere", "Copperhill"
  ];

  const descriptions = [
    "A mining town nestled in silver-rich mountains",
    "Bustling port city known for its merchant guilds", 
    "Fortress town guarding the eastern borders",
    "Magical research center built around crystal formations",
    "Agricultural settlement surrounded by thorny forests",
    "Coastal stronghold weathering constant storms",
    "Mysterious woodland town shrouded in ancient magic",
    "Peaceful riverside community known for its crafters",
    "Lakeside town with a reputation for secrecy",
    "Industrial settlement built around copper mines"
  ];

  return townNames.slice(0, 6).map((name, index) => {
    // Random but balanced specialization
    const specializations = ['military', 'artisan', 'merchant'];
    const primary = specializations[Math.floor(Math.random() * 3)];
    const remaining = specializations.filter(s => s !== primary);
    
    const militaryPercent = primary === 'military' ? 50 + Math.random() * 20 : 15 + Math.random() * 20;
    const artisanPercent = primary === 'artisan' ? 50 + Math.random() * 20 : 15 + Math.random() * 20;
    const merchantPercent = 100 - militaryPercent - artisanPercent;

    return {
      id: index + 1,
      name,
      description: descriptions[index],
      population: 800 + Math.floor(Math.random() * 2000),
      distance: Math.floor(Math.random() * 5) + 1, // 1-5 days travel
      specialization: {
        military: Math.round(militaryPercent),
        artisan: Math.round(artisanPercent),
        merchant: Math.round(Math.max(0, merchantPercent))
      },
      relationship: 'none', // none, neutral, allied, hostile
      relationshipValue: 0, // -100 to +100
      tradeEstablished: false,
      economicStatus: ['struggling', 'stable', 'growing', 'prosperous'][Math.floor(Math.random() * 4)],
      lastUpdate: "Initial survey data",
      knownResources: [], // Discovered through adventurers/trade
      events: [] // Active events affecting this town
    };
  });
};

export const calculateTradeSuccess = (town, playerStats) => {
  // Base success from fame
  let successChance = Math.min(playerStats.fame * 2, 60); // Fame caps at 30 for 60% base
  
  // Get player's dominant specialization
  const playerDominant = getDominantSpecialization(playerStats);
  const townDominant = getDominantSpecialization(town.specialization);
  
  // Competition penalty if same specialization
  if (playerDominant === townDominant) {
    successChance -= 25; // Competition penalty
  } else {
    // Bonus for complementary specializations
    if ((playerDominant === 'military' && townDominant === 'artisan') ||
        (playerDominant === 'artisan' && townDominant === 'merchant') ||
        (playerDominant === 'merchant' && townDominant === 'military')) {
      successChance += 15;
    }
  }
  
  // Specialization modifiers
  switch (playerDominant) {
    case 'military':
      successChance += Math.floor(playerStats.military / 10); // Intimidation bonus
      break;
    case 'artisan':
      successChance += Math.floor(playerStats.artisan / 8); // Quality reputation
      break;
    case 'merchant':
      successChance += Math.floor(playerStats.merchant / 6); // Trade connections
      break;
  }
  
  // Economic status modifier
  const economicModifier = {
    'struggling': 20, // Desperate for trade
    'stable': 0,
    'growing': -5,
    'prosperous': -15 // Self-sufficient
  };
  successChance += economicModifier[town.economicStatus];
  
  return Math.max(5, Math.min(95, successChance)); // 5-95% range
};

export const getDominantSpecialization = (stats) => {
  if (typeof stats.military !== 'undefined') {
    // Player stats format
    const military = stats.military || 0;
    const artisan = stats.artisan || 0; 
    const merchant = stats.merchant || 0;
    
    if (military >= artisan && military >= merchant) return 'military';
    if (artisan >= merchant) return 'artisan';
    return 'merchant';
  } else {
    // Town specialization format
    const { military, artisan, merchant } = stats;
    if (military >= artisan && military >= merchant) return 'military';
    if (artisan >= merchant) return 'artisan';
    return 'merchant';
  }
};

export const getRelationshipColor = (relationship) => {
  switch (relationship) {
    case 'allied': return '#4ecdc4'; // Green
    case 'neutral': return '#6b9bd2'; // Blue  
    case 'hostile': return '#ff6b6b'; // Red
    default: return '#8b5a2b'; // Brown for no relationship
  }
};

export const getRelationshipEffects = (relationship) => {
  switch (relationship) {
    case 'allied':
      return {
        adventurerSuccessBonus: 15,
        priceModifier: -10,
        eventAccess: true,
        description: "+15% adventurer success, -10% material costs, exclusive events"
      };
    case 'neutral':
      return {
        adventurerSuccessBonus: 0,
        priceModifier: 0,
        eventAccess: false,
        description: "Standard rates and opportunities"
      };
    case 'hostile':
      return {
        adventurerSuccessBonus: -25,
        priceModifier: 20,
        eventAccess: false,
        description: "-25% adventurer success, +20% material costs"
      };
    default:
      return {
        adventurerSuccessBonus: 0,
        priceModifier: 0,
        eventAccess: false,
        description: "No trade relationship established"
      };
  }
};