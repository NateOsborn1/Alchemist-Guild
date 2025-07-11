// src/services/GameState.js

const initialResources = {
  gold: 500,
  // Raw materials
  iron: 10,
  steel: 5,
  wood: 15,
  leather: 8,
  herbs: 12,
  crystal: 3,
  oil: 6,
  parchment: 4,
  ember: 2,
  silver: 1,
  gems: 1,
  thread: 10,
  // Finished goods (start with 0)
  "Iron Sword": 0,
  "Steel Dagger": 0,
  "Magic Potion": 0,
  "Healing Salve": 0,
  "Fire Scroll": 0,
  "Silver Ring": 0,
  "Leather Armor": 0,
  "Enchanted Staff": 0
};

const canFulfillOrder = (inventory, order) => {
  // Check if we have the finished product
  const available = inventory[order.itemName] || 0;
  return available >= order.quantity;
};

const fulfillOrder = (inventory, order) => {
  if (!canFulfillOrder(inventory, order)) {
    return { success: false, newInventory: inventory, reason: "Insufficient finished goods" };
  }

  const newInventory = { ...inventory };
  
  // Consume finished goods
  newInventory[order.itemName] -= order.quantity;
  
  // Add gold
  newInventory.gold += order.priceOffer;

  return { 
    success: true, 
    newInventory, 
    profit: order.priceOffer 
  };
};

export { initialResources, canFulfillOrder, fulfillOrder };