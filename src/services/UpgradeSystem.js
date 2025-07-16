// src/services/UpgradeSystem.js

const upgradeCategories = {
  shop: {
    name: "Shop Upgrades",
    description: "Improve your shop to attract better adventurers",
    upgrades: {
      basic_shop: {
        name: "Basic Shop",
        description: "A simple shop with basic amenities",
        cost: 0,
        effect: { wealthyChance: 0.05 },
        purchased: true
      },
      comfortable_shop: {
        name: "Comfortable Shop",
        description: "Add comfortable seating and refreshments",
        cost: 200,
        effect: { wealthyChance: 0.08, reputationBonus: 2 },
        purchased: false
      },
      luxury_shop: {
        name: "Luxury Shop",
        description: "High-end furnishings and premium services",
        cost: 500,
        effect: { wealthyChance: 0.12, reputationBonus: 5 },
        purchased: false
      },
      guild_hall: {
        name: "Guild Hall",
        description: "A prestigious guild hall that attracts the best adventurers",
        cost: 1000,
        effect: { wealthyChance: 0.15, reputationBonus: 10, experienceBonus: 5 },
        purchased: false
      }
    }
  },
  
  zone_manipulation: {
    name: "Zone Manipulation",
    description: "Control and modify zone danger levels",
    upgrades: {
      scouting: {
        name: "Scouting Network",
        description: "Reveal zone danger levels without sending adventurers",
        cost: 300,
        effect: { zoneReveal: true },
        purchased: false
      },
      danger_reduction: {
        name: "Danger Reduction",
        description: "Permanently reduce zone danger growth by 20%",
        cost: 400,
        effect: { dangerGrowthReduction: 0.2 },
        purchased: false
      },
      expedition_funding: {
        name: "Expedition Funding",
        description: "Fund expeditions to clear zones (one-time use)",
        cost: 250,
        effect: { expeditionClear: 1 },
        purchased: false,
        consumable: true
      },
      danger_increase: {
        name: "Experimental Research",
        description: "Increase zone danger for better rewards (risky)",
        cost: 200,
        effect: { dangerIncrease: 0.3 },
        purchased: false
      }
    }
  },
  
  insurance: {
    name: "Death Insurance",
    description: "Profit from adventurer deaths and recover their gear",
    upgrades: {
      basic_insurance: {
        name: "Basic Insurance",
        description: "Gain gold when adventurers die (morbid but profitable)",
        cost: 150,
        effect: { deathGoldReward: 30 },
        purchased: false
      },
      life_insurance: {
        name: "Life Insurance",
        description: "Gain more gold when adventurers die",
        cost: 300,
        effect: { deathGoldReward: 75 },
        purchased: false
      },
      premium_insurance: {
        name: "Premium Insurance",
        description: "Maximum gold rewards from deaths and bonus reputation on success",
        cost: 600,
        effect: { deathGoldReward: 150, reputationBonus: 2 },
        purchased: false
      }
    }
  },
  
  population_control: {
    name: "Population Control",
    description: "Manage town population and growth",
    upgrades: {
      housing: {
        name: "Build Housing",
        description: "Construct housing to increase population",
        cost: 200,
        effect: { populationGrowth: 50 },
        purchased: false
      },
      demolish_housing: {
        name: "Demolish Housing",
        description: "Reduce population by demolishing housing",
        cost: 100,
        effect: { populationReduction: 30 },
        purchased: false
      },
      town_hall: {
        name: "Town Hall",
        description: "Central administration building that stabilizes population",
        cost: 400,
        effect: { populationStability: true },
        purchased: false
      }
    }
  },
  
  education: {
    name: "Education",
    description: "Control experience gain rates for adventurers",
    upgrades: {
      basic_training: {
        name: "Basic Training",
        description: "Provide basic training to adventurers",
        cost: 150,
        effect: { experienceGainBonus: 0.1 },
        purchased: false
      },
      advanced_training: {
        name: "Advanced Training",
        description: "Comprehensive training program",
        cost: 350,
        effect: { experienceGainBonus: 0.25 },
        purchased: false
      },
      demolish_schools: {
        name: "Demolish Schools",
        description: "Remove educational facilities (slows experience gain)",
        cost: 50,
        effect: { experienceGainPenalty: 0.2 },
        purchased: false
      }
    }
  },
  
  guild_acquisitions: {
    name: "Guild Acquisitions",
    description: "Buy out competing guilds to bypass reputation requirements",
    upgrades: {
      small_guild: {
        name: "Small Guild Acquisition",
        description: "Buy out a small competing guild",
        cost: 800,
        effect: { reputationRequirementReduction: 10 },
        purchased: false
      },
      medium_guild: {
        name: "Medium Guild Acquisition",
        description: "Buy out a medium-sized guild",
        cost: 1500,
        effect: { reputationRequirementReduction: 25 },
        purchased: false
      },
      large_guild: {
        name: "Large Guild Acquisition",
        description: "Buy out a major competing guild",
        cost: 3000,
        effect: { reputationRequirementReduction: 50 },
        purchased: false
      }
    }
  }
};

// Calculate total effects from all purchased upgrades
const calculateUpgradeEffects = (purchasedUpgrades) => {
  const effects = {
    wealthyChance: 0.05, // Base chance
    reputationBonus: 0,
    experienceBonus: 0,
    zoneReveal: false,
    dangerGrowthReduction: 0,
    expeditionClear: 0,
    dangerIncrease: 0,
    deathGoldReward: 0,
    populationGrowth: 0,
    populationReduction: 0,
    populationStability: false,
    experienceGainBonus: 0,
    experienceGainPenalty: 0,
    reputationRequirementReduction: 0
  };

  Object.values(purchasedUpgrades).forEach(category => {
    Object.values(category).forEach(upgrade => {
      if (upgrade.purchased && upgrade.effect) {
        Object.entries(upgrade.effect).forEach(([key, value]) => {
          if (typeof effects[key] === 'number') {
            effects[key] += value;
          } else if (typeof effects[key] === 'boolean') {
            effects[key] = effects[key] || value;
          }
        });
      }
    });
  });

  return effects;
};

// Purchase an upgrade
const purchaseUpgrade = (category, upgradeId, playerGold, purchasedUpgrades) => {
  const categoryData = upgradeCategories[category];
  if (!categoryData) {
    return { success: false, message: "Invalid category" };
  }

  const upgrade = categoryData.upgrades[upgradeId];
  if (!upgrade) {
    return { success: false, message: "Invalid upgrade" };
  }

  if (upgrade.purchased) {
    return { success: false, message: "Upgrade already purchased" };
  }

  if (playerGold < upgrade.cost) {
    return { success: false, message: "Insufficient gold" };
  }

  // Create updated purchased upgrades
  const updatedPurchasedUpgrades = { ...purchasedUpgrades };
  if (!updatedPurchasedUpgrades[category]) {
    updatedPurchasedUpgrades[category] = {};
  }
  
  updatedPurchasedUpgrades[category][upgradeId] = {
    ...upgrade,
    purchased: true,
    purchasedAt: Date.now()
  };

  return {
    success: true,
    cost: upgrade.cost,
    purchasedUpgrades: updatedPurchasedUpgrades,
    message: `Successfully purchased ${upgrade.name}`
  };
};

// Use a consumable upgrade (like expedition funding)
const useConsumableUpgrade = (category, upgradeId, purchasedUpgrades) => {
  const categoryData = upgradeCategories[category];
  if (!categoryData) {
    return { success: false, message: "Invalid category" };
  }

  const upgrade = categoryData.upgrades[upgradeId];
  if (!upgrade || !upgrade.consumable) {
    return { success: false, message: "Not a consumable upgrade" };
  }

  const purchasedUpgrade = purchasedUpgrades[category]?.[upgradeId];
  if (!purchasedUpgrade || !purchasedUpgrade.purchased) {
    return { success: false, message: "Upgrade not purchased" };
  }

  // Remove the consumable upgrade
  const updatedPurchasedUpgrades = { ...purchasedUpgrades };
  delete updatedPurchasedUpgrades[category][upgradeId];

  return {
    success: true,
    effect: upgrade.effect,
    purchasedUpgrades: updatedPurchasedUpgrades,
    message: `Used ${upgrade.name}`
  };
};

// Get available upgrades for a category
const getAvailableUpgrades = (category, playerGold, purchasedUpgrades) => {
  const categoryData = upgradeCategories[category];
  if (!categoryData) {
    return [];
  }

  return Object.entries(categoryData.upgrades).map(([id, upgrade]) => {
    // Check if explicitly purchased OR if it's a default upgrade (cost 0 and purchased: true)
    const isPurchased = purchasedUpgrades[category]?.[id]?.purchased || (upgrade.cost === 0 && upgrade.purchased === true);
    const canAfford = playerGold >= upgrade.cost;
    
    return {
      id,
      ...upgrade,
      isPurchased,
      canAfford,
      isAvailable: !isPurchased && canAfford
    };
  });
};

// Get all upgrade categories with summary
const getUpgradeCategories = (playerGold, purchasedUpgrades) => {
  return Object.entries(upgradeCategories).map(([categoryId, category]) => {
    const upgrades = getAvailableUpgrades(categoryId, playerGold, purchasedUpgrades);
    const purchasedCount = upgrades.filter(u => u.isPurchased).length;
    const totalCount = upgrades.length;
    
    return {
      id: categoryId,
      ...category,
      upgrades,
      purchasedCount,
      totalCount,
      completionPercentage: Math.round((purchasedCount / totalCount) * 100)
    };
  });
};

export {
  upgradeCategories,
  calculateUpgradeEffects,
  purchaseUpgrade,
  useConsumableUpgrade,
  getAvailableUpgrades,
  getUpgradeCategories
}; 