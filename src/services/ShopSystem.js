// src/services/ShopSystem.js

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
  
  // Town economic status modifier
  const economicMultiplier = {
    struggling: 0.7,
    stable: 1.0,
    growing: 1.2,
    prosperous: 1.5
  };
  
  return Math.floor(baseIncome * (economicMultiplier[shop.townEconomicStatus] || 1.0));
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
  
  // Check if already has a shop
  if (town.playerShop) {
    return { 
      canBuild: false, 
      reason: "Already have a shop in this town" 
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