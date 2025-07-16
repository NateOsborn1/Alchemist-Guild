// src/services/ZoneSystem.js

const zoneTypes = {
  forest: {
    name: "Dark Forest",
    description: "A dense, shadowy forest where monsters lurk in the undergrowth.",
    baseDanger: 30,
    growthRate: 2, // Danger increase per minute
    maxDanger: 100,
    healthPool: 1000, // High health pool like a boss
    healthRegenRate: 5, // Health regen per minute when not in downtime
    monsterTypes: ["Giant Spiders", "Wolves", "Bandits", "Dark Elves"],
    materials: ["wood", "herbs", "leather"],
    clearEffectiveness: 1.0,
    reputationBonus: 50 // Bonus when zone is cleared
  },
  caves: {
    name: "Ancient Caves",
    description: "Deep underground caverns filled with ancient horrors and valuable minerals.",
    baseDanger: 40,
    growthRate: 3,
    maxDanger: 120,
    healthPool: 1500,
    healthRegenRate: 6,
    monsterTypes: ["Goblins", "Trolls", "Undead", "Cave Dragons"],
    materials: ["iron", "steel", "gems", "ember"],
    clearEffectiveness: 1.2,
    reputationBonus: 75
  },
  ruins: {
    name: "Forgotten Ruins",
    description: "Crumbling ruins of an ancient civilization, home to powerful undead and magical constructs.",
    baseDanger: 50,
    growthRate: 4,
    maxDanger: 150,
    healthPool: 2000,
    healthRegenRate: 8,
    monsterTypes: ["Skeletons", "Golems", "Wraiths", "Ancient Guardians"],
    materials: ["crystal", "parchment", "silver", "gems"],
    clearEffectiveness: 1.5,
    reputationBonus: 100
  }
};

const generateInitialZones = () => {
  return [
    {
      id: 1,
      type: 'forest',
      name: zoneTypes.forest.name,
      description: zoneTypes.forest.description,
      dangerLevel: zoneTypes.forest.baseDanger,
      maxDanger: zoneTypes.forest.maxDanger,
      growthRate: zoneTypes.forest.growthRate,
      lastGrowthTime: Date.now(),
      // New health system
      currentHealth: zoneTypes.forest.healthPool,
      maxHealth: zoneTypes.forest.healthPool,
      healthRegenRate: zoneTypes.forest.healthRegenRate,
      lastHealthRegenTime: Date.now(),
      isInDowntime: false,
      downtimeStartTime: null,
      downtimeEndTime: null,
      reputationBonus: zoneTypes.forest.reputationBonus,
      // Existing properties
      isRevealed: false,
      monsterTypes: zoneTypes.forest.monsterTypes,
      materials: zoneTypes.forest.materials,
      clearEffectiveness: zoneTypes.forest.clearEffectiveness,
      status: 'dangerous', // 'safe', 'dangerous', 'cleared', 'downtime'
      lastCleared: null,
      totalClears: 0,
      totalDeaths: 0
    },
    {
      id: 2,
      type: 'caves',
      name: zoneTypes.caves.name,
      description: zoneTypes.caves.description,
      dangerLevel: zoneTypes.caves.baseDanger,
      maxDanger: zoneTypes.caves.maxDanger,
      growthRate: zoneTypes.caves.growthRate,
      lastGrowthTime: Date.now(),
      // New health system
      currentHealth: zoneTypes.caves.healthPool,
      maxHealth: zoneTypes.caves.healthPool,
      healthRegenRate: zoneTypes.caves.healthRegenRate,
      lastHealthRegenTime: Date.now(),
      isInDowntime: false,
      downtimeStartTime: null,
      downtimeEndTime: null,
      reputationBonus: zoneTypes.caves.reputationBonus,
      // Existing properties
      isRevealed: false,
      monsterTypes: zoneTypes.caves.monsterTypes,
      materials: zoneTypes.caves.materials,
      clearEffectiveness: zoneTypes.caves.clearEffectiveness,
      status: 'dangerous',
      lastCleared: null,
      totalClears: 0,
      totalDeaths: 0
    },
    {
      id: 3,
      type: 'ruins',
      name: zoneTypes.ruins.name,
      description: zoneTypes.ruins.description,
      dangerLevel: zoneTypes.ruins.baseDanger,
      maxDanger: zoneTypes.ruins.maxDanger,
      growthRate: zoneTypes.ruins.growthRate,
      lastGrowthTime: Date.now(),
      // New health system
      currentHealth: zoneTypes.ruins.healthPool,
      maxHealth: zoneTypes.ruins.healthPool,
      healthRegenRate: zoneTypes.ruins.healthRegenRate,
      lastHealthRegenTime: Date.now(),
      isInDowntime: false,
      downtimeStartTime: null,
      downtimeEndTime: null,
      reputationBonus: zoneTypes.ruins.reputationBonus,
      // Existing properties
      isRevealed: false,
      monsterTypes: zoneTypes.ruins.monsterTypes,
      materials: zoneTypes.ruins.materials,
      clearEffectiveness: zoneTypes.ruins.clearEffectiveness,
      status: 'dangerous',
      lastCleared: null,
      totalClears: 0,
      totalDeaths: 0
    }
  ];
};

// Update zone danger levels and health regeneration over time
const updateZoneDanger = (zones, upgradeEffects = {}) => {
  const now = Date.now();
  
  return zones.map(zone => {
    const timeDiff = (now - zone.lastGrowthTime) / (1000 * 60); // Convert to minutes
    const baseDangerIncrease = timeDiff * zone.growthRate;
    
    // Apply danger growth reduction from upgrades
    const growthReduction = upgradeEffects.dangerGrowthReduction || 0;
    const dangerIncrease = baseDangerIncrease * (1 - growthReduction);
    
    const newDangerLevel = Math.min(zone.maxDanger, zone.dangerLevel + dangerIncrease);
    
    // Health regeneration (only when not in downtime)
    let newHealth = zone.currentHealth;
    let newStatus = zone.status;
    let isInDowntime = zone.isInDowntime;
    let downtimeStartTime = zone.downtimeStartTime;
    let downtimeEndTime = zone.downtimeEndTime;
    
    if (!zone.isInDowntime) {
      // Check if health reached 0 and zone should go into downtime
      if (zone.currentHealth <= 0) {
        isInDowntime = true;
        downtimeStartTime = now;
        // Set downtime until next IRL day (midnight)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        downtimeEndTime = tomorrow.getTime();
        newStatus = 'downtime';
      } else {
        // Normal health regeneration
        const healthTimeDiff = (now - zone.lastHealthRegenTime) / (1000 * 60);
        const healthRegen = healthTimeDiff * zone.healthRegenRate;
        newHealth = Math.min(zone.maxHealth, zone.currentHealth + healthRegen);
      }
    } else {
      // Check if downtime is over
      if (now >= zone.downtimeEndTime) {
        isInDowntime = false;
        downtimeStartTime = null;
        downtimeEndTime = null;
        newHealth = zone.maxHealth; // Full health after downtime
        newStatus = 'dangerous';
      }
    }
    
    // Update status based on danger level (only if not in downtime)
    if (!isInDowntime) {
      if (newDangerLevel >= zone.maxDanger * 0.8) {
        newStatus = 'dangerous';
      } else if (newDangerLevel <= zone.maxDanger * 0.2) {
        newStatus = 'safe';
      } else {
        newStatus = 'dangerous';
      }
    }
    
    return {
      ...zone,
      dangerLevel: Math.round(newDangerLevel),
      lastGrowthTime: now,
      currentHealth: Math.round(newHealth),
      lastHealthRegenTime: now,
      isInDowntime,
      downtimeStartTime,
      downtimeEndTime,
      status: newStatus
    };
  });
};

// Calculate mission success chance based on adventurer stats and zone danger
const calculateMissionSuccess = (adventurer, zone) => {
  const baseChance = adventurer.survivalRate;
  const dangerPenalty = zone.dangerLevel * 0.5; // Each danger point reduces success by 0.5%
  const experienceBonus = adventurer.experience * 0.2; // Each experience point adds 0.2%
  
  const finalChance = Math.max(5, Math.min(95, baseChance - dangerPenalty + experienceBonus));
  return Math.round(finalChance);
};

// Process mission outcome and update zone
const processMissionOutcome = (adventurer, zone, success) => {
  const updatedZone = { ...zone };
  
  // Calculate damage to zone health (both success and failure deal damage)
  const baseDamage = adventurer.zoneClearingPower * zone.clearEffectiveness;
  const damage = success ? baseDamage * 2 : baseDamage; // Success deals more damage
  
  updatedZone.currentHealth = Math.max(0, zone.currentHealth - damage);
  
  if (success) {
    // Successful mission also reduces danger level
    const clearAmount = baseDamage * 2;
    updatedZone.dangerLevel = Math.max(0, zone.dangerLevel - clearAmount);
    updatedZone.totalClears += 1;
    updatedZone.lastCleared = Date.now();
    
    // Check if zone was just cleared (health reached 0)
    if (zone.currentHealth > 0 && updatedZone.currentHealth <= 0) {
      // Zone was just cleared - this will trigger downtime and reputation bonus
      updatedZone.isInDowntime = true;
      updatedZone.downtimeStartTime = Date.now();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      updatedZone.downtimeEndTime = tomorrow.getTime();
      updatedZone.status = 'downtime';
    }
  } else {
    // Failed mission reduces danger slightly
    const clearAmount = baseDamage;
    updatedZone.dangerLevel = Math.max(0, zone.dangerLevel - clearAmount);
    updatedZone.totalDeaths += 1;
  }
  
  return updatedZone;
};

// Reveal zone when first adventurer is sent
const revealZone = (zone) => {
  return {
    ...zone,
    isRevealed: true
  };
};

// Get zone status description
const getZoneStatusDescription = (zone) => {
  if (!zone.isRevealed) {
    return "Unknown - Send an adventurer to explore";
  }
  
  if (zone.isInDowntime) {
    const timeRemaining = Math.max(0, zone.downtimeEndTime - Date.now());
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    return `Cleared! Returns in ${hours}h ${minutes}m`;
  }
  
  const dangerPercentage = (zone.dangerLevel / zone.maxDanger) * 100;
  const healthPercentage = (zone.currentHealth / zone.maxHealth) * 100;
  
  if (dangerPercentage >= 80) {
    return `Extremely Dangerous (${Math.round(dangerPercentage)}%) - Health: ${Math.round(healthPercentage)}%`;
  } else if (dangerPercentage >= 60) {
    return `Very Dangerous (${Math.round(dangerPercentage)}%) - Health: ${Math.round(healthPercentage)}%`;
  } else if (dangerPercentage >= 40) {
    return `Dangerous (${Math.round(dangerPercentage)}%) - Health: ${Math.round(healthPercentage)}%`;
  } else if (dangerPercentage >= 20) {
    return `Moderately Safe (${Math.round(dangerPercentage)}%) - Health: ${Math.round(healthPercentage)}%`;
  } else {
    return `Safe (${Math.round(dangerPercentage)}%) - Health: ${Math.round(healthPercentage)}%`;
  }
};

// Get zone color based on danger level
const getZoneColor = (zone) => {
  if (!zone.isRevealed) {
    return '#8b5a2b'; // Brown for unknown
  }
  
  if (zone.isInDowntime) {
    return '#4ecdc4'; // Teal for cleared/downtime
  }
  
  const dangerPercentage = (zone.dangerLevel / zone.maxDanger) * 100;
  
  if (dangerPercentage >= 80) {
    return '#ff6b6b'; // Red for extremely dangerous
  } else if (dangerPercentage >= 60) {
    return '#ff8c42'; // Orange for very dangerous
  } else if (dangerPercentage >= 40) {
    return '#ffd700'; // Yellow for dangerous
  } else if (dangerPercentage >= 20) {
    return '#90ee90'; // Light green for moderately safe
  } else {
    return '#4ecdc4'; // Teal for safe
  }
};

// Get monster description for zone
const getMonsterDescription = (zone) => {
  if (!zone.isRevealed) {
    return "Unknown creatures";
  }
  
  const dangerPercentage = (zone.dangerLevel / zone.maxDanger) * 100;
  
  if (dangerPercentage >= 80) {
    return `Powerful ${zone.monsterTypes[3]} dominate the area`;
  } else if (dangerPercentage >= 60) {
    return `${zone.monsterTypes[2]} are common here`;
  } else if (dangerPercentage >= 40) {
    return `${zone.monsterTypes[1]} roam the area`;
  } else {
    return `Weak ${zone.monsterTypes[0]} are all that remain`;
  }
};

// Calculate materials found in zone based on clearing success
const calculateZoneLoot = (zone, success, adventurer) => {
  if (!success) return [];
  
  const baseAmount = success ? 2 : 1;
  const experienceBonus = Math.floor(adventurer.experience / 20);
  const totalAmount = baseAmount + experienceBonus;
  
  const loot = [];
  zone.materials.forEach(material => {
    if (Math.random() < 0.7) { // 70% chance for each material
      const amount = Math.floor(Math.random() * totalAmount) + 1;
      loot.push({ material, amount });
    }
  });
  
  return loot;
};

export {
  generateInitialZones,
  updateZoneDanger,
  calculateMissionSuccess,
  processMissionOutcome,
  revealZone,
  getZoneStatusDescription,
  getZoneColor,
  getMonsterDescription,
  calculateZoneLoot,
  zoneTypes
}; 