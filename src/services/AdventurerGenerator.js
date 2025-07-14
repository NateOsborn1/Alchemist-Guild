// src/services/AdventurerGenerator.js

const adventurerNames = {
  rogue: ["Shadowblade", "Whisper", "Nightfall", "Vex", "Sly", "Phantom", "Wraith"],
  ranger: ["Thornwick", "Swiftarrow", "Greenleaf", "Wildstrike", "Forestborn", "Hawkeye"],
  miner: ["Ironpick", "Stonebreaker", "Deepdelver", "Goldseeker", "Rockfall", "Gemfinder"],
  mage: ["Starweaver", "Flamewright", "Crystalmind", "Spellbound", "Mysticflow", "Arcanus"],
  warrior: ["Ironfist", "Stormblade", "Thunderheart", "Steelborn", "Valor", "Guardian"],
  scout: ["Swiftfoot", "Eagle-eye", "Pathfinder", "Trailblazer", "Wanderer", "Seeker"]
};

const adventurerClasses = {
  rogue: {
    name: "Rogue",
    baseSurvivalRate: 75,
    baseExperience: 40,
    baseWealth: 30,
    gearQuality: "medium",
    description: "Sneaks into dangerous areas seeking treasure and rare materials.",
    lootTable: [
      { material: "gems", min: 1, max: 3, chance: 0.7 },
      { material: "silver", min: 1, max: 2, chance: 0.8 },
      { material: "gold", min: 50, max: 150, chance: 0.6 }
    ]
  },
  ranger: {
    name: "Ranger", 
    baseSurvivalRate: 80,
    baseExperience: 50,
    baseWealth: 25,
    gearQuality: "medium",
    description: "Hunts monsters in deep forests and wild lands.",
    lootTable: [
      { material: "herbs", min: 3, max: 8, chance: 0.9 },
      { material: "leather", min: 2, max: 5, chance: 0.8 },
      { material: "wood", min: 4, max: 10, chance: 0.7 }
    ]
  },
  miner: {
    name: "Miner",
    baseSurvivalRate: 70,
    baseExperience: 35,
    baseWealth: 20,
    gearQuality: "low",
    description: "Delves deep into mountain caves for precious ores.",
    lootTable: [
      { material: "iron", min: 4, max: 8, chance: 0.9 },
      { material: "steel", min: 2, max: 4, chance: 0.7 },
      { material: "ember", min: 1, max: 3, chance: 0.6 }
    ]
  },
  mage: {
    name: "Mage",
    baseSurvivalRate: 65,
    baseExperience: 60,
    baseWealth: 40,
    gearQuality: "high",
    description: "Seeks magical components from mystical sources.",
    lootTable: [
      { material: "crystal", min: 2, max: 4, chance: 0.8 },
      { material: "parchment", min: 3, max: 6, chance: 0.9 },
      { material: "oil", min: 2, max: 5, chance: 0.7 }
    ]
  },
  warrior: {
    name: "Warrior",
    baseSurvivalRate: 85,
    baseExperience: 45,
    baseWealth: 35,
    gearQuality: "medium",
    description: "Fearsome fighter who charges into battle.",
    lootTable: [
      { material: "steel", min: 3, max: 6, chance: 0.8 },
      { material: "leather", min: 2, max: 4, chance: 0.7 },
      { material: "silver", min: 1, max: 2, chance: 0.6 }
    ]
  },
  scout: {
    name: "Scout",
    baseSurvivalRate: 90,
    baseExperience: 55,
    baseWealth: 30,
    gearQuality: "medium",
    description: "Expert at reconnaissance and avoiding danger.",
    lootTable: [
      { material: "herbs", min: 2, max: 5, chance: 0.8 },
      { material: "leather", min: 1, max: 3, chance: 0.7 },
      { material: "wood", min: 3, max: 7, chance: 0.6 }
    ]
  }
};

// Adventurer types that modify base stats
const adventurerTypes = {
  inexperienced: {
    name: "Inexperienced",
    experienceModifier: -20,
    survivalModifier: -15,
    wealthModifier: -10,
    reputationGainOnSuccess: 15,
    reputationLossOnDeath: -5,
    description: "Young and eager, but lacking experience."
  },
  experienced: {
    name: "Experienced",
    experienceModifier: 20,
    survivalModifier: 15,
    wealthModifier: 10,
    reputationGainOnSuccess: 8,
    reputationLossOnDeath: -8,
    description: "Seasoned adventurer with proven skills."
  }
};

// Wealth levels that can be applied to any adventurer type
const wealthLevels = {
  poor: {
    name: "Poor",
    wealthModifier: -15,
    gearQuality: "low",
    reputationLossOnDeath: -3,
    description: "Carries basic equipment."
  },
  average: {
    name: "Average",
    wealthModifier: 0,
    gearQuality: "medium",
    reputationLossOnDeath: -5,
    description: "Standard adventuring gear."
  },
  wealthy: {
    name: "Wealthy",
    wealthModifier: 25,
    gearQuality: "high",
    reputationLossOnDeath: -12,
    description: "Carries expensive, high-quality equipment."
  }
};

const generateAdventurer = (id, townPopulation = 1000) => {
  const classKeys = Object.keys(adventurerClasses);
  const selectedClass = classKeys[Math.floor(Math.random() * classKeys.length)];
  const classData = adventurerClasses[selectedClass];
  
  const name = adventurerNames[selectedClass][
    Math.floor(Math.random() * adventurerNames[selectedClass].length)
  ];
  
  // Determine adventurer type (inexperienced vs experienced)
  const typeKeys = Object.keys(adventurerTypes);
  const selectedType = typeKeys[Math.floor(Math.random() * typeKeys.length)];
  const typeData = adventurerTypes[selectedType];
  
  // Determine wealth level
  const wealthKeys = Object.keys(wealthLevels);
  let selectedWealth = wealthKeys[1]; // Default to average
  
  // Wealthy adventurers appear based on town population
  const wealthyChance = Math.min(0.15, townPopulation / 10000); // Max 15% chance
  if (Math.random() < wealthyChance) {
    selectedWealth = wealthKeys[2]; // wealthy
  } else if (Math.random() < 0.3) {
    selectedWealth = wealthKeys[0]; // poor
  }
  
  const wealthData = wealthLevels[selectedWealth];
  
  // Calculate final stats with modifiers
  const baseExperience = classData.baseExperience + typeData.experienceModifier + wealthData.wealthModifier;
  const experience = Math.max(10, Math.min(100, baseExperience + (Math.random() * 20 - 10)));
  
  const baseSurvival = classData.baseSurvivalRate + typeData.survivalModifier;
  const survivalRate = Math.max(30, Math.min(95, baseSurvival + (Math.random() * 20 - 10)));
  
  const baseWealth = classData.baseWealth + typeData.wealthModifier + wealthData.wealthModifier;
  const wealth = Math.max(5, Math.min(100, baseWealth + (Math.random() * 20 - 10)));
  
  // Calculate reputation requirements based on experience and wealth
  const reputationRequirement = Math.max(0, Math.floor((experience + wealth) / 4) - 10);
  
  // Generate gear based on wealth and class
  const gear = generateAdventurerGear(selectedClass, wealthData.gearQuality, wealth);
  
  // Calculate loot table with chances
  const lootTable = classData.lootTable.map(item => ({
    ...item,
    actualAmount: Math.random() < item.chance ? 
      Math.floor(Math.random() * (item.max - item.min + 1)) + item.min : 0
  })).filter(item => item.actualAmount > 0);

  return {
    id,
    name,
    class: classData.name,
    type: typeData.name,
    wealth: wealthData.name,
    experience: Math.round(experience),
    survivalRate: Math.round(survivalRate),
    wealth: Math.round(wealth),
    reputationRequirement: Math.max(0, reputationRequirement),
    gear,
    lootTable,
    description: `${typeData.description} ${classData.description}`,
    // Mission outcome modifiers
    reputationGainOnSuccess: typeData.reputationGainOnSuccess,
    reputationLossOnDeath: typeData.reputationLossOnDeath + wealthData.reputationLossOnDeath,
    // Zone clearing effectiveness
    zoneClearingPower: Math.floor(experience / 10) + (selectedType === 'experienced' ? 2 : 0)
  };
};

const generateAdventurerGear = (adventurerClass, quality, wealth) => {
  const gearTemplates = {
    rogue: {
      weapon: ["Dagger", "Short Sword", "Rapier", "Poisoned Blade"],
      armor: ["Leather Vest", "Shadow Cloak", "Silk Armor", "Assassin's Garb"],
      accessory: ["Lockpicks", "Smoke Bombs", "Grappling Hook", "Invisibility Ring"]
    },
    ranger: {
      weapon: ["Shortbow", "Longbow", "Crossbow", "Enchanted Bow"],
      armor: ["Leather Armor", "Studded Leather", "Ranger's Cloak", "Forest Mail"],
      accessory: ["Tracking Kit", "Healing Potions", "Animal Companion", "Nature's Blessing"]
    },
    miner: {
      weapon: ["Pickaxe", "Mining Hammer", "Rock Breaker", "Gem Cutter"],
      armor: ["Work Clothes", "Mining Gear", "Stone Armor", "Dwarven Plate"],
      accessory: ["Lantern", "Mining Tools", "Gem Detector", "Earth's Protection"]
    },
    mage: {
      weapon: ["Staff", "Wand", "Crystal Focus", "Arcane Blade"],
      armor: ["Robe", "Enchanted Robe", "Mystic Armor", "Ethereal Garb"],
      accessory: ["Spellbook", "Mana Crystal", "Familiar", "Reality Shard"]
    },
    warrior: {
      weapon: ["Sword", "Battle Axe", "War Hammer", "Legendary Blade"],
      armor: ["Chain Mail", "Plate Armor", "Battle Armor", "Dragon Scale"],
      accessory: ["Shield", "War Banner", "Hero's Medallion", "Victory's Call"]
    },
    scout: {
      weapon: ["Light Bow", "Scout's Blade", "Throwing Knives", "Precision Bow"],
      armor: ["Light Armor", "Scout's Leather", "Ranger's Vest", "Shadow Armor"],
      accessory: ["Spyglass", "Climbing Gear", "Stealth Cloak", "Eagle's Eye"]
    }
  };

  const template = gearTemplates[adventurerClass];
  const qualityIndex = quality === 'low' ? 0 : quality === 'medium' ? 1 : quality === 'high' ? 2 : 3;
  
  // Wealth affects gear quality
  const finalQualityIndex = Math.min(3, qualityIndex + Math.floor(wealth / 25));
  
  return {
    weapon: template.weapon[Math.min(finalQualityIndex, template.weapon.length - 1)],
    armor: template.armor[Math.min(finalQualityIndex, template.armor.length - 1)],
    accessory: template.accessory[Math.min(finalQualityIndex, template.accessory.length - 1)],
    quality: finalQualityIndex === 0 ? 'low' : finalQualityIndex === 1 ? 'medium' : finalQualityIndex === 2 ? 'high' : 'legendary',
    value: Math.floor(wealth * (finalQualityIndex + 1) * 2)
  };
};

export { generateAdventurer, adventurerTypes, wealthLevels };