// src/services/OrderGenerator.js

const customerNames = [
  "Marcus the Merchant", "Elena the Enchanter", "Thorin Ironbeard",
  "Lyra Shadowweaver", "Gareth the Bold", "Astrid Flameheart",
  "Roderick Goldhand", "Vera Stormcaller", "Bjorn the Massive",
  "Celeste Moonwhisper", "Darius Ironwill", "Seraphina the Wise"
];

const items = [
  { name: "Iron Sword", basePrice: 50 },
  { name: "Steel Dagger", basePrice: 30 },
  { name: "Magic Potion", basePrice: 80 },
  { name: "Healing Salve", basePrice: 25 },
  { name: "Fire Scroll", basePrice: 120 },
  { name: "Silver Ring", basePrice: 200 },
  { name: "Leather Armor", basePrice: 150 },
  { name: "Enchanted Staff", basePrice: 300 }
];

const tiers = ["Bronze", "Silver", "Gold", "Platinum"];

const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

const generateRandomOrder = (id) => {
  const item = getRandomElement(items);
  const customerName = getRandomElement(customerNames);
  const tier = getRandomElement(tiers);
  const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 items
  
  // Price variation based on tier and market fluctuation
  const tierMultiplier = {
    "Bronze": 0.8,
    "Silver": 1.0,
    "Gold": 1.3,
    "Platinum": 1.6
  };
  
  // Random market fluctuation ±30%
  const marketFactor = 0.7 + (Math.random() * 0.6);
  const finalPrice = Math.floor(
    item.basePrice * quantity * tierMultiplier[tier] * marketFactor
  );
  
  // Deadline varies by tier (better customers give more time)
  const deadlineHours = {
    "Bronze": Math.floor(Math.random() * 12) + 6,    // 6-18 hours
    "Silver": Math.floor(Math.random() * 24) + 12,   // 12-36 hours  
    "Gold": Math.floor(Math.random() * 48) + 24,     // 24-72 hours
    "Platinum": Math.floor(Math.random() * 72) + 48  // 48-120 hours
  };
  
  const formatDeadline = (hours) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  return {
    id,
    customerName,
    customerTier: tier,
    quantity,
    itemName: item.name,
    priceOffer: finalPrice,
    deadline: formatDeadline(deadlineHours[tier]),
    deadlineHours: deadlineHours[tier]
  };
};

export { generateRandomOrder };