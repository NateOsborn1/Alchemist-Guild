// src/services/ShopSystem.js

// Building slot limits based on town status
export const getBuildingSlotLimits = (townStatus) => {
  const limits = {
    struggling: { shops: 1, churches: 0 },
    stable: { shops: 1, churches: 1 },
    growing: { shops: 2, churches: 1 },
    prosperous: { shops: 2, churches: 2 }
  };
  return limits[townStatus] || limits.struggling;
};

// Count existing buildings in a town
export const countTownBuildings = (town) => {
  const buildings = {
    shops: 0,
    churches: 0
  };
  
  if (town.playerShop) {
    buildings.shops++;
  }
  
  if (town.playerChurch) {
    buildings.churches++;
  }
  
  return buildings;
};

export const shopTypes = {
  basic: {
    name: "Basic Storefront",
    cost: 800,
    buildTime: 300, // 5 minutes in seconds
    baseIncome: {
      neutral: 50, // per minute
      allied: 85
    },
    description: "A simple shop selling your crafted goods"
  },
  specialized: {
    name: "Specialized Workshop", 
    cost: 1500,
    buildTime: 600, // 10 minutes
    baseIncome: {
      neutral: 90,
      allied: 160
    },
    description: "A workshop tailored to the town's specialization"
  },
  premium: {
    name: "Guild Hall",
    cost: 3000,
    buildTime: 1200, // 20 minutes
    baseIncome: {
      neutral: 150,
      allied: 280
    },
    description: "A prestigious establishment serving elite customers"
  }
};

export const churchType = {
  name: "Church",
  cost: 800,
  buildTime: 600, // 10 minutes
  reputationRate: 0.1, // reputation per minute
  description: "A place of worship that generates passive reputation"
};

export const calculateShopIncome = (shop, townRelationship, townSpecialization) => {
  const shopType = shopTypes[shop.type];
  let baseIncome = shopType.baseIncome[townRelationship] || 0;
  
  // Bonus for matching specialization
  if (shop.type === 'specialized') {
    const playerSpec = shop.playerSpecialization;
    const townSpec = getDominantSpecialization(townSpecialization);
    
    if (playerSpec === townSpec) {
      baseIncome *= 1.3; // 30% bonus for specialization match
    }
  }
  
  // Town economic status multiplier (Step 3: Income Scaling)
  const economicMultiplier = {
    struggling: 1.0,  // Base rate
    stable: 1.33,     // 33% increase
    growing: 1.67,    // 67% increase  
    prosperous: 2.0   // 100% increase (double)
  };
  
  return Math.floor(baseIncome * (economicMultiplier[shop.townEconomicStatus] || 1.0));
};

// Get town status multiplier info for UI display
export const getTownStatusMultiplier = (townStatus) => {
  const multipliers = {
    struggling: { value: 1.0, label: 'Base Rate' },
    stable: { value: 1.33, label: '+33%' },
    growing: { value: 1.67, label: '+67%' },
    prosperous: { value: 2.0, label: '+100%' }
  };
  return multipliers[townStatus] || multipliers.struggling;
};

export const canBuildShop = (town, playerGold, playerStats) => {
  // Must have neutral or better relationship
  if (!town.tradeEstablished) {
    return { 
      canBuild: false, 
      reason: "Must establish trade relationship first" 
    };
  }
  
  if (town.relationshipValue < -20) {
    return { 
      canBuild: false, 
      reason: "Relationship too hostile to build shop" 
    };
  }
  
  // Check building slot limits
  const slotLimits = getBuildingSlotLimits(town.economicStatus);
  const currentBuildings = countTownBuildings(town);
  
  if (currentBuildings.shops >= slotLimits.shops) {
    return { 
      canBuild: false, 
      reason: `Town status (${town.economicStatus}) allows only ${slotLimits.shops} shop(s). Upgrade town to build more.` 
    };
  }
  
  // Check minimum requirements for different shop types
  const basicCost = shopTypes.basic.cost;
  if (playerGold < basicCost) {
    return { 
      canBuild: false, 
      reason: `Need at least ${basicCost} gold for basic shop` 
    };
  }
  
  return { canBuild: true };
};

export const canBuildChurch = (town, playerGold) => {
  // Must have neutral or better relationship
  if (!town.tradeEstablished) {
    return { 
      canBuild: false, 
      reason: "Must establish trade relationship first" 
    };
  }
  
  if (town.relationshipValue < -20) {
    return { 
      canBuild: false, 
      reason: "Relationship too hostile to build church" 
    };
  }
  
  // Check building slot limits
  const slotLimits = getBuildingSlotLimits(town.economicStatus);
  const currentBuildings = countTownBuildings(town);
  
  if (currentBuildings.churches >= slotLimits.churches) {
    return { 
      canBuild: false, 
      reason: `Town status (${town.economicStatus}) allows only ${slotLimits.churches} church(es). Upgrade town to build more.` 
    };
  }
  
  // Check if already has a church
  if (town.playerChurch) {
    return { 
      canBuild: false, 
      reason: "Already have a church in this town" 
    };
  }
  
  // Check minimum requirements
  if (playerGold < churchType.cost) {
    return { 
      canBuild: false, 
      reason: `Need at least ${churchType.cost} gold for church` 
    };
  }
  
  return { canBuild: true };
};

export const getShopBuildOptions = (town, playerStats, playerGold) => {
  const options = [];
  
  Object.entries(shopTypes).forEach(([type, data]) => {
    const canAfford = playerGold >= data.cost;
    let available = true;
    let requirementText = "";
    
    // Requirements for different shop types
    switch (type) {
      case 'basic':
        // No special requirements
        break;
      case 'specialized':
        const totalRep = playerStats.military + playerStats.artisan + playerStats.merchant;
        if (totalRep < 20) {
          available = false;
          requirementText = "Need 20+ total specialization points";
        }
        break;
      case 'premium':
        if (playerStats.fame < 30) {
          available = false;
          requirementText = "Need 30+ fame";
        }
        break;
    }
    
    options.push({
      type,
      ...data,
      available: available && canAfford,
      canAfford,
      requirementText
    });
  });
  
  return options;
};

export const startShopConstruction = (townId, shopType, playerSpecialization) => {
  const shopData = shopTypes[shopType];
  
  return {
    townId,
    type: shopType,
    playerSpecialization, // The specialization when built
    status: 'building',
    startTime: Date.now(),
    completionTime: Date.now() + (shopData.buildTime * 1000),
    totalInvestment: shopData.cost,
    progress: 0
  };
};

export const completeShopConstruction = (shop, town) => {
  return {
    ...shop,
    status: 'operational',
    lastIncomeCollection: Date.now(),
    townEconomicStatus: town.economicStatus
  };
};

export const startChurchConstruction = (townId) => {
  return {
    townId,
    type: 'church',
    status: 'building',
    startTime: Date.now(),
    completionTime: Date.now() + (churchType.buildTime * 1000),
    totalInvestment: churchType.cost,
    progress: 0
  };
};

export const completeChurchConstruction = (church, town) => {
  return {
    ...church,
    status: 'operational',
    lastReputationCollection: Date.now(),
    townEconomicStatus: town.economicStatus
  };
};

export const calculateChurchReputation = (church) => {
  if (church.status !== 'operational') return 0;
  
  const timeSinceLastCollection = Date.now() - church.lastReputationCollection;
  const minutesElapsed = timeSinceLastCollection / (1000 * 60);
  
  // Cap at 24 hours worth of reputation to prevent exploitation
  const cappedMinutes = Math.min(minutesElapsed, 24 * 60);
  
  return Math.floor(cappedMinutes * churchType.reputationRate);
};

export const calculatePendingIncome = (shop) => {
  if (shop.status !== 'operational') return 0;
  
  const timeSinceLastCollection = Date.now() - shop.lastIncomeCollection;
  const minutesElapsed = timeSinceLastCollection / (1000 * 60);
  
  // Cap at 24 hours worth of income to prevent exploitation
  const cappedMinutes = Math.min(minutesElapsed, 24 * 60);
  
  return Math.floor(cappedMinutes * (shop.currentIncomeRate / 60)); // Convert per-minute to per-second
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