// src/services/AdventurerGenerator.js
import { generateName } from './NameGenerator';

// Rank-based system instead of complex wealth/experience
const adventurerRanks = {
  A: {
    name: "A-Rank",
    successRate: 85, // High success in dangerous areas
    reputationCost: 8,
    description: "Elite adventurer with proven track record",
    classPerks: 3 // A-rank gets 3 class perks
  },
  B: {
    name: "B-Rank", 
    successRate: 65, // Good in mid-danger, some chance in high
    reputationCost: 5,
    description: "Experienced adventurer with solid skills",
    classPerks: 2 // B-rank gets 2 class perks
  },
  C: {
    name: "C-Rank",
    successRate: 45, // Struggles with mid-danger, okay in low
    reputationCost: 3,
    description: "Novice adventurer eager to prove themselves",
    classPerks: 1 // C-rank gets 1 class perk
  }
};

const adventurerClasses = {
  miner: {
    name: "Miner",
    perks: [
      "Ore deposits yield 50% more gold",
      "Higher chance to find rare gems",
      "Mining tools fetch premium prices when recovered"
    ]
  },
  ranger: {
    name: "Ranger", 
    perks: [
      "Higher chance to find rare herbs and materials",
      "May return with enchanted arrows or tracking gear",
      "Masterwork bows and leather armor"
    ]
  },
  mage: {
    name: "Mage",
    perks: [
      "May return with enchanted items or spell scrolls",
      "Magic items may survive mission failures",
      "Expensive spell components and enchanted robes"
    ]
  },
  rogue: {
    name: "Rogue",
    perks: [
      "May steal additional valuable items",
      "Hidden pockets may contain stolen goods",
      "Fine daggers and lockpicking tools"
    ]
  },
  warrior: {
    name: "Warrior",
    perks: [
      "May return with enemy weapons and armor",
      "Battle-worn equipment may still be valuable",
      "Masterwork weapons and heavy armor"
    ]
  }
};

export function generateAdventurer(id, population = 1000, upgradeEffects = {}) {
  // Determine rank based on population and random chance
  let rank;
  const rand = Math.random();
  if (population >= 1200 && rand < 0.3) {
    rank = 'A';
  } else if (population >= 600 && rand < 0.6) {
    rank = 'B';
  } else {
    rank = 'C';
  }

  // Select class
  const classNames = Object.keys(adventurerClasses);
  const selectedClass = classNames[Math.floor(Math.random() * classNames.length)];
  const classData = adventurerClasses[selectedClass];
  const rankData = adventurerRanks[rank];

  // Get class perks based on rank
  const availablePerks = classData.perks;
  const perkCount = rankData.classPerks;
  const selectedPerks = availablePerks.slice(0, perkCount);

  // Generate name
  const name = generateName();

  return {
    id,
    name,
    class: classData.name,
    rank,
    successRate: rankData.successRate,
    reputationCost: rankData.reputationCost,
    description: rankData.description,
    classPerks: selectedPerks,
    // Legacy properties for compatibility
    experience: rank === 'A' ? 80 : rank === 'B' ? 50 : 20,
    wealth: rank === 'A' ? 80 : rank === 'B' ? 50 : 20,
    // Mission outcome modifiers
    reputationGainOnSuccess: rank === 'A' ? 12 : rank === 'B' ? 8 : 5,
    // Zone clearing effectiveness
    zoneClearingPower: rank === 'A' ? 8 : rank === 'B' ? 5 : 2,
    // Reputation requirement (simplified)
    reputationRequirement: 0, // No reputation requirement for hiring
    // Status tracking
    status: 'available',
    zoneId: null,
    mission: null,
    lastMissionFailed: false
  };
}