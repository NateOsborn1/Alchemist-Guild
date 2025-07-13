// src/services/AdventurerCustomerGenerator.js

const customerNames = [
  "Evya Shieldmaiden", "Thorin Ironbeard", "Lyra Shadowweaver", "Gareth the Bold",
  "Astrid Flameheart", "Roderick Goldhand", "Vera Stormcaller", "Bjorn the Massive",
  "Celeste Moonwhisper", "Darius Ironwill", "Seraphina the Wise", "Marcus the Merchant"
];

const customerClasses = ["Warrior", "Miner", "Mage", "Ranger", "Rogue"];

const items = [
  { name: "Iron Sword", basePrice: 50, reputationBonus: 3 },
  { name: "Steel Dagger", basePrice: 30, reputationBonus: 2 },
  { name: "Magic Potion", basePrice: 80, reputationBonus: 5 },
  { name: "Healing Salve", basePrice: 25, reputationBonus: 2 },
  { name: "Fire Scroll", basePrice: 120, reputationBonus: 8 },
  { name: "Silver Ring", basePrice: 200, reputationBonus: 10 },
  { name: "Leather Armor", basePrice: 150, reputationBonus: 5 },
  { name: "Enchanted Staff", basePrice: 300, reputationBonus: 12 }
];

const missionDescriptions = [
  "Heading to the frontlines to protect our borders. Need sturdy armor.",
  "Delving deep into the mountain caves. Need reliable tools.",
  "Researching ancient magic. Need enchanted equipment.",
  "Scouting dangerous territories. Need stealth gear.",
  "Hunting powerful beasts. Need specialized weapons.",
  "Exploring ancient ruins. Need protective gear.",
  "Guarding merchant caravans. Need defensive equipment.",
  "Investigating dark forces. Need magical items."
];

const customerDescriptions = [
  "A seasoned warrior known for bravery in battle.",
  "A dwarf miner seeking fortune in the depths.",
  "A mysterious mage studying forbidden arts.",
  "A skilled ranger patrolling the wilds.",
  "A stealthy rogue operating in shadows.",
  "A noble knight serving the realm.",
  "A wise scholar seeking knowledge.",
  "A merchant prince expanding trade routes."
];

const generateAdventurerCustomer = (id) => {
  const name = customerNames[Math.floor(Math.random() * customerNames.length)];
  const customerClass = customerClasses[Math.floor(Math.random() * customerClasses.length)];
  const item = items[Math.floor(Math.random() * items.length)];
  const missionDesc = missionDescriptions[Math.floor(Math.random() * missionDescriptions.length)];
  const customerDesc = customerDescriptions[Math.floor(Math.random() * customerDescriptions.length)];
  
  const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
  const priceVariation = 0.8 + (Math.random() * 0.4); // ±20% price variation
  const finalPrice = Math.floor(item.basePrice * quantity * priceVariation);
  
  return {
    id,
    name,
    class: customerClass,
    missionDescription: missionDesc,
    itemName: item.name,
    quantity,
    priceOffer: finalPrice,
    reputationBonus: item.reputationBonus,
    description: customerDesc
  };
};

export { generateAdventurerCustomer }; 