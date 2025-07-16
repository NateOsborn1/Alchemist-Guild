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
  // Collected gear from dead adventurers
  collectedGear: []
};

const initialGameState = {
  reputation: 50,
  population: 1000,
  seasonalEvent: 'normal', // 'festival', 'desperation', 'foreign_convoy', 'normal'
  eventEndTime: null,
  totalGoldEarned: 0,
  totalReputationGained: 0,
  totalReputationLost: 0,
  adventurerStats: {
    totalSent: 0,
    successfulMissions: 0,
    deaths: 0,
    gearCollected: 0
  },
  zoneStats: {
    totalClears: 0,
    totalDeaths: 0,
    zonesRevealed: 0
  },
  reputationHistory: [
    { day: 1, value: 50, event: 'Game Start' }
  ],
  goldHistory: []
};

// Population events that affect reputation importance
const populationEvents = {
  festival: {
    name: "Town Festival",
    description: "The town is celebrating! Reputation matters more during festivals.",
    reputationMultiplier: 1.5,
    duration: 30 * 60 * 1000, // 30 minutes
    populationThreshold: 1200
  },
  desperation: {
    name: "Desperate Times",
    description: "The town is struggling. Reputation matters less as people are desperate for help.",
    reputationMultiplier: 0.5,
    duration: 20 * 60 * 1000, // 20 minutes
    populationThreshold: 600
  },
  foreign_convoy: {
    name: "Foreign Convoy",
    description: "Travelers from afar have arrived! They ignore reputation requirements.",
    reputationMultiplier: 0,
    duration: 15 * 60 * 1000, // 15 minutes
    chance: 0.1 // 10% chance every 5 minutes
  }
};

// Check if population event should trigger
const checkPopulationEvent = (currentState) => {
  const now = Date.now();
  
  // If there's already an active event, don't trigger a new one
  if (currentState.seasonalEvent !== 'normal' && currentState.eventEndTime && now < currentState.eventEndTime) {
    return currentState;
  }
  
  // Check for festival (high population)
  if (currentState.population >= populationEvents.festival.populationThreshold && 
      currentState.seasonalEvent === 'normal') {
    return {
      ...currentState,
      seasonalEvent: 'festival',
      eventEndTime: now + populationEvents.festival.duration
    };
  }
  
  // Check for desperation (low population)
  if (currentState.population <= populationEvents.desperation.populationThreshold && 
      currentState.seasonalEvent === 'normal') {
    return {
      ...currentState,
      seasonalEvent: 'desperation',
      eventEndTime: now + populationEvents.desperation.duration
    };
  }
  
  // Check for foreign convoy (random chance)
  if (Math.random() < populationEvents.foreign_convoy.chance && 
      currentState.seasonalEvent === 'normal') {
    return {
      ...currentState,
      seasonalEvent: 'foreign_convoy',
      eventEndTime: now + populationEvents.foreign_convoy.duration
    };
  }
  
  // Reset to normal if event has ended
  if (currentState.seasonalEvent !== 'normal' && currentState.eventEndTime && now >= currentState.eventEndTime) {
    return {
      ...currentState,
      seasonalEvent: 'normal',
      eventEndTime: null
    };
  }
  
  return currentState;
};

// Calculate reputation requirement with seasonal modifiers
const calculateReputationRequirement = (baseRequirement, gameState) => {
  if (gameState.seasonalEvent === 'foreign_convoy') {
    return 0; // Foreign convoys ignore reputation
  }
  // Fix: fallback to { reputationMultiplier: 1 } if event is not found
  const event = populationEvents[gameState.seasonalEvent] || { reputationMultiplier: 1 };
  return Math.floor(baseRequirement * event.reputationMultiplier);
};

// Process mission outcome and update game state
const processMissionOutcome = (adventurer, zone, success, gameState, upgradeEffects = {}) => {
  const updatedState = { ...gameState };
  
  // Update adventurer stats
  updatedState.adventurerStats.totalSent += 1;
  if (success) {
    updatedState.adventurerStats.successfulMissions += 1;
  } else {
    updatedState.adventurerStats.deaths += 1;
    updatedState.adventurerStats.gearCollected += 1;
  }
  
  // Calculate reputation change with seasonal modifiers and upgrade effects
  let reputationChange = 0;
  if (success) {
    reputationChange = adventurer.reputationGainOnSuccess;
  } else {
    reputationChange = adventurer.reputationLossOnDeath;
    // Apply reputation loss reduction from upgrades
    const lossReduction = upgradeEffects.reputationLossReduction || 0;
    reputationChange = Math.floor(reputationChange * (1 - lossReduction));
  }
  
  // Apply seasonal event multiplier
  const event = populationEvents[gameState.seasonalEvent] || { reputationMultiplier: 1 };
  reputationChange = Math.floor(reputationChange * event.reputationMultiplier);
  
  // Update reputation
  updatedState.reputation = Math.max(0, Math.min(100, gameState.reputation + reputationChange));
  
  if (reputationChange > 0) {
    updatedState.totalReputationGained += reputationChange;
  } else {
    updatedState.totalReputationLost += Math.abs(reputationChange);
  }
  
  // Update zone stats
  if (success) {
    updatedState.zoneStats.totalClears += 1;
  } else {
    updatedState.zoneStats.totalDeaths += 1;
  }
  
  // Add gear to inventory if adventurer died
  if (!success && adventurer.gear) {
    const gearItem = {
      id: Date.now(),
      name: `${adventurer.name}'s ${adventurer.gear.weapon}`,
      type: 'weapon',
      quality: adventurer.gear.quality,
      value: adventurer.gear.value,
      adventurer: adventurer.name,
      collectedAt: Date.now()
    };
    
    if (!updatedState.collectedGear) {
      updatedState.collectedGear = [];
    }
    updatedState.collectedGear.push(gearItem);
  }
  
  return updatedState;
};

// Add gear to inventory
const addGearToInventory = (gear, inventory) => {
  const updatedInventory = { ...inventory };
  
  if (!updatedInventory.collectedGear) {
    updatedInventory.collectedGear = [];
  }
  
  updatedInventory.collectedGear.push({
    ...gear,
    id: Date.now(),
    collectedAt: Date.now()
  });
  
  return updatedInventory;
};

// Sell gear for gold
const sellGear = (gearId, inventory) => {
  const updatedInventory = { ...inventory };
  
  if (!updatedInventory.collectedGear) {
    return { inventory: updatedInventory, gold: 0 };
  }
  
  const gearIndex = updatedInventory.collectedGear.findIndex(g => g.id === gearId);
  if (gearIndex === -1) {
    return { inventory: updatedInventory, gold: 0 };
  }
  
  const gear = updatedInventory.collectedGear[gearIndex];
  const goldValue = Math.floor(gear.value * 0.7); // Sell for 70% of value
  
  updatedInventory.collectedGear.splice(gearIndex, 1);
  updatedInventory.gold += goldValue;
  
  return { inventory: updatedInventory, gold: goldValue };
};

// Update population based on events and player actions
const updatePopulation = (gameState, playerActions = {}) => {
  let populationChange = 0;
  
  // Natural population growth/decline based on reputation
  if (gameState.reputation >= 70) {
    populationChange += 1; // Population grows in high reputation
  } else if (gameState.reputation <= 30) {
    populationChange -= 1; // Population declines in low reputation
  }
  
  // Seasonal event effects
  if (gameState.seasonalEvent === 'festival') {
    populationChange += 2; // Festivals attract people
  } else if (gameState.seasonalEvent === 'desperation') {
    populationChange -= 1; // Desperation drives people away
  }
  
  // Player action effects (from upgrades)
  if (playerActions.housingBuilt) {
    populationChange += 5;
  }
  if (playerActions.housingDemolished) {
    populationChange -= 3;
  }
  
  const newPopulation = Math.max(100, Math.min(2000, gameState.population + populationChange));
  
  return {
    ...gameState,
    population: newPopulation
  };
};

// Get current seasonal event info
const getCurrentEventInfo = (gameState) => {
  if (gameState.seasonalEvent === 'normal') {
    return null;
  }
  
  const event = populationEvents[gameState.seasonalEvent];
  if (!event) return null;
  
  const timeRemaining = gameState.eventEndTime ? Math.max(0, gameState.eventEndTime - Date.now()) : 0;
  const minutesRemaining = Math.ceil(timeRemaining / (1000 * 60));
  
  return {
    ...event,
    timeRemaining,
    minutesRemaining
  };
};

// Log a gold transaction to gameState.goldHistory
const logGoldTransaction = (gameState, amount, type, reason = '') => {
  // Defensive: ensure goldHistory exists
  if (!gameState.goldHistory) gameState.goldHistory = [];
  // Add new entry
  gameState.goldHistory.push({
    timestamp: Date.now(),
    amount, // positive for earn, negative for spend
    type,   // 'earn' or 'spend'
    reason  // e.g. 'mission', 'shop', 'sell_gear', etc.
  });
  // Optional: prune to last 500 entries to avoid unbounded growth
  if (gameState.goldHistory.length > 500) {
    gameState.goldHistory = gameState.goldHistory.slice(-500);
  }
};

export { 
  initialResources, 
  initialGameState,
  populationEvents,
  checkPopulationEvent,
  calculateReputationRequirement,
  processMissionOutcome,
  addGearToInventory,
  sellGear,
  updatePopulation,
  getCurrentEventInfo,
  logGoldTransaction
};