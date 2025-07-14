// src/services/ZoneSystem.js

const zoneTypes = {
  forest: {
    name: "Dark Forest",
    description: "A dense, shadowy forest where monsters lurk in the undergrowth.",
    baseDanger: 30,
    growthRate: 2, // Danger increase per minute
    maxDanger: 100,
    monsterTypes: ["Giant Spiders", "Wolves", "Bandits", "Dark Elves"],
    materials: ["wood", "herbs", "leather"],
    clearEffectiveness: 1.0
  },
  caves: {
    name: "Ancient Caves",
    description: "Deep underground caverns filled with ancient horrors and valuable minerals.",
    baseDanger: 40,
    growthRate: 3,
    maxDanger: 120,
    monsterTypes: ["Goblins", "Trolls", "Undead", "Cave Dragons"],
    materials: ["iron", "steel", "gems", "ember"],
    clearEffectiveness: 1.2
  },
  ruins: {
    name: "Forgotten Ruins",
    description: "Crumbling ruins of an ancient civilization, home to powerful undead and magical constructs.",
    baseDanger: 50,
    growthRate: 4,
    maxDanger: 150,
    monsterTypes: ["Skeletons", "Golems", "Wraiths", "Ancient Guardians"],
    materials: ["crystal", "parchment", "silver", "gems"],
    clearEffectiveness: 1.5
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
      isRevealed: false,
      monsterTypes: zoneTypes.forest.monsterTypes,
      materials: zoneTypes.forest.materials,
      clearEffectiveness: zoneTypes.forest.clearEffectiveness,
      status: 'dangerous', // 'safe', 'dangerous', 'cleared'
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

// Update zone danger levels over time
const updateZoneDanger = (zones) => {
  const now = Date.now();
  
  return zones.map(zone => {
    const timeDiff = (now - zone.lastGrowthTime) / (1000 * 60); // Convert to minutes
    const dangerIncrease = timeDiff * zone.growthRate;
    
    const newDangerLevel = Math.min(zone.maxDanger, zone.dangerLevel + dangerIncrease);
    
    // Update status based on danger level
    let newStatus = zone.status;
    if (newDangerLevel >= zone.maxDanger * 0.8) {
      newStatus = 'dangerous';
    } else if (newDangerLevel <= zone.maxDanger * 0.2) {
      newStatus = 'safe';
    } else {
      newStatus = 'dangerous';
    }
    
    return {
      ...zone,
      dangerLevel: Math.round(newDangerLevel),
      lastGrowthTime: now,
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
  
  if (success) {
    // Successful mission reduces danger significantly
    const clearAmount = adventurer.zoneClearingPower * zone.clearEffectiveness * 2;
    updatedZone.dangerLevel = Math.max(0, zone.dangerLevel - clearAmount);
    updatedZone.totalClears += 1;
    updatedZone.lastCleared = Date.now();
    
    // Update status
    if (updatedZone.dangerLevel <= zone.maxDanger * 0.2) {
      updatedZone.status = 'safe';
    }
  } else {
    // Failed mission reduces danger slightly
    const clearAmount = adventurer.zoneClearingPower * zone.clearEffectiveness;
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
  
  const dangerPercentage = (zone.dangerLevel / zone.maxDanger) * 100;
  
  if (dangerPercentage >= 80) {
    return `Extremely Dangerous (${Math.round(dangerPercentage)}%)`;
  } else if (dangerPercentage >= 60) {
    return `Very Dangerous (${Math.round(dangerPercentage)}%)`;
  } else if (dangerPercentage >= 40) {
    return `Dangerous (${Math.round(dangerPercentage)}%)`;
  } else if (dangerPercentage >= 20) {
    return `Moderately Safe (${Math.round(dangerPercentage)}%)`;
  } else {
    return `Safe (${Math.round(dangerPercentage)}%)`;
  }
};

// Get zone color based on danger level
const getZoneColor = (zone) => {
  if (!zone.isRevealed) {
    return '#8b5a2b'; // Brown for unknown
  }
  
  const dangerPercentage = (zone.dangerLevel / zone.maxDanger) * 100;
  
  if (dangerPercentage >= 80) {
    return '#ff0000'; // Red for extremely dangerous
  } else if (dangerPercentage >= 60) {
    return '#ff6b6b'; // Light red for very dangerous
  } else if (dangerPercentage >= 40) {
    return '#ffa500'; // Orange for dangerous
  } else if (dangerPercentage >= 20) {
    return '#ffff00'; // Yellow for moderately safe
  } else {
    return '#00ff00'; // Green for safe
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