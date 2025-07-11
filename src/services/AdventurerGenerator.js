// src/services/AdventurerGenerator.js

const adventurerNames = {
  rogue: ["Shadowblade", "Whisper", "Nightfall", "Vex", "Sly", "Phantom", "Wraith"],
  ranger: ["Thornwick", "Swiftarrow", "Greenleaf", "Wildstrike", "Forestborn", "Hawkeye"],
  miner: ["Ironpick", "Stonebreaker", "Deepdelver", "Goldseeker", "Rockfall", "Gemfinder"],
  mage: ["Starweaver", "Flamewright", "Crystalmind", "Spellbound", "Mysticflow", "Arcanus"]
};

const adventurerClasses = {
  rogue: {
    name: "Rogue",
    lootTable: [
      { material: "gems", min: 1, max: 3 },
      { material: "silver", min: 1, max: 2 },
      { material: "gold", min: 50, max: 150 }
    ],
    description: "Sneaks into ancient ruins seeking treasure and rare materials.",
    baseSuccessRate: 70,
    baseMissionTime: 45,
    baseCost: 200
  },
  ranger: {
    name: "Ranger", 
    lootTable: [
      { material: "herbs", min: 3, max: 8 },
      { material: "leather", min: 2, max: 5 },
      { material: "wood", min: 4, max: 10 }
    ],
    description: "Hunts monsters in deep forests and wild lands.",
    baseSuccessRate: 80,
    baseMissionTime: 35,
    baseCost: 150
  },
  miner: {
    name: "Miner",
    lootTable: [
      { material: "iron", min: 4, max: 8 },
      { material: "steel", min: 2, max: 4 },
      { material: "ember", min: 1, max: 3 }
    ],
    description: "Delves deep into mountain caves for precious ores.",
    baseSuccessRate: 85,
    baseMissionTime: 50,
    baseCost: 120
  },
  mage: {
    name: "Mage",
    lootTable: [
      { material: "crystal", min: 2, max: 4 },
      { material: "parchment", min: 3, max: 6 },
      { material: "oil", min: 2, max: 5 }
    ],
    description: "Seeks magical components from mystical sources.",
    baseSuccessRate: 75,
    baseMissionTime: 40,
    baseCost: 180
  }
};

const generateAdventurer = (id) => {
  const classKeys = Object.keys(adventurerClasses);
  const selectedClass = classKeys[Math.floor(Math.random() * classKeys.length)];
  const classData = adventurerClasses[selectedClass];
  
  const name = adventurerNames[selectedClass][
    Math.floor(Math.random() * adventurerNames[selectedClass].length)
  ];
  
  // Add some randomization to stats
  const successRate = Math.max(50, Math.min(95, 
    classData.baseSuccessRate + (Math.random() * 20 - 10)
  ));
  
  const missionTime = Math.max(20, Math.min(90,
    classData.baseMissionTime + (Math.random() * 20 - 10)
  ));
  
  const hiringCost = Math.max(80, Math.min(300,
    classData.baseCost + (Math.random() * 100 - 50)
  ));

  return {
    id,
    name,
    class: classData.name,
    successRate: Math.round(successRate),
    missionTime: Math.round(missionTime),
    hiringCost: Math.round(hiringCost),
    lootTable: classData.lootTable,
    description: classData.description
  };
};

export { generateAdventurer };