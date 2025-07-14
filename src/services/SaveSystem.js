// src/services/SaveSystem.js

// Current save version - increment this when making breaking changes
const CURRENT_SAVE_VERSION = 1;

// Save data structure
const createEmptySaveData = () => ({
  version: CURRENT_SAVE_VERSION,
  timestamp: Date.now(),
  gameState: null,
  inventory: null,
  zones: null,
  adventurers: [],
  towns: [],
  buildingShops: [],
  playerStats: null,
  reputation: null,
  shopStock: null,
  purchasedUpgrades: {},
  upgradeEffects: null,
  nextAdventurerId: 1,
  nextOrderId: 1,
  orderQueue: [],
  orderDeadlines: {},
  adventurerCustomers: [],
  gameTime: Date.now()
});

// Save the game state
export const saveGame = (gameData) => {
  try {
    const saveData = {
      version: CURRENT_SAVE_VERSION,
      timestamp: Date.now(),
      gameState: gameData.gameState,
      inventory: gameData.inventory,
      zones: gameData.zones,
      adventurers: gameData.adventurers,
      towns: gameData.towns,
      buildingShops: gameData.buildingShops,
      playerStats: gameData.playerStats,
      reputation: gameData.reputation,
      shopStock: gameData.shopStock,
      purchasedUpgrades: gameData.purchasedUpgrades,
      upgradeEffects: gameData.upgradeEffects,
      nextAdventurerId: gameData.nextAdventurerId,
      nextOrderId: gameData.nextOrderId,
      orderQueue: gameData.orderQueue,
      orderDeadlines: gameData.orderDeadlines,
      adventurerCustomers: gameData.adventurerCustomers,
      gameTime: Date.now()
    };

    const saveString = JSON.stringify(saveData);
    localStorage.setItem('alchemistGuildSave', saveString);
    
    console.log('Game saved successfully');
    return { success: true, message: 'Game saved successfully' };
  } catch (error) {
    console.error('Failed to save game:', error);
    return { success: false, message: 'Failed to save game' };
  }
};

// Load the game state
export const loadGame = () => {
  try {
    const saveString = localStorage.getItem('alchemistGuildSave');
    if (!saveString) {
      return { success: false, message: 'No save data found' };
    }

    const saveData = JSON.parse(saveString);
    
    // Check if save data needs migration
    if (saveData.version !== CURRENT_SAVE_VERSION) {
      const migratedData = migrateSaveData(saveData);
      if (migratedData) {
        // Save the migrated data
        saveGame(migratedData);
        return { success: true, data: migratedData, message: 'Save data migrated successfully' };
      } else {
        return { success: false, message: 'Save data is incompatible and cannot be migrated' };
      }
    }

    return { success: true, data: saveData, message: 'Game loaded successfully' };
  } catch (error) {
    console.error('Failed to load game:', error);
    return { success: false, message: 'Failed to load game' };
  }
};

// Migrate save data from older versions
const migrateSaveData = (oldSaveData) => {
  const { version } = oldSaveData;
  
  try {
    switch (version) {
      case 0:
        // Migrate from version 0 to 1
        return migrateFromV0ToV1(oldSaveData);
      // Add more migration cases as needed
      // case 1:
      //   return migrateFromV1ToV2(oldSaveData);
      default:
        console.warn(`Unknown save version: ${version}`);
        return null;
    }
  } catch (error) {
    console.error('Migration failed:', error);
    return null;
  }
};

// Migration from version 0 to 1
const migrateFromV0ToV1 = (v0Data) => {
  console.log('Migrating save data from version 0 to 1');
  
  // Create new save structure with defaults
  const newData = createEmptySaveData();
  
  // Migrate existing data with fallbacks
  newData.gameState = v0Data.gameState || {
    reputation: 50,
    population: 1000,
    seasonalEvent: 'normal',
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
    ]
  };
  
  newData.inventory = v0Data.inventory || {
    gold: 500,
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
    collectedGear: []
  };
  
  newData.zones = v0Data.zones || [];
  newData.adventurers = v0Data.adventurers || [];
  newData.towns = v0Data.towns || [];
  newData.buildingShops = v0Data.buildingShops || [];
  newData.playerStats = v0Data.playerStats || {
    fame: 5,
    military: 0,
    artisan: 0,
    merchant: 0
  };
  newData.reputation = v0Data.reputation || 50;
  newData.shopStock = v0Data.shopStock || {
    iron: 20, steel: 15, wood: 25, leather: 18, herbs: 22, crystal: 8,
    oil: 12, parchment: 16, ember: 6, silver: 4, gems: 3, thread: 30
  };
  newData.purchasedUpgrades = v0Data.purchasedUpgrades || {};
  newData.upgradeEffects = v0Data.upgradeEffects || {};
  newData.nextAdventurerId = v0Data.nextAdventurerId || 1;
  newData.nextOrderId = v0Data.nextOrderId || 1;
  newData.orderQueue = v0Data.orderQueue || [];
  newData.orderDeadlines = v0Data.orderDeadlines || {};
  newData.adventurerCustomers = v0Data.adventurerCustomers || [];
  
  // Preserve timestamp from original save
  newData.timestamp = v0Data.timestamp || Date.now();
  
  return newData;
};

// Check if save data exists
export const hasSaveData = () => {
  return localStorage.getItem('alchemistGuildSave') !== null;
};

// Delete save data
export const deleteSaveData = () => {
  try {
    localStorage.removeItem('alchemistGuildSave');
    console.log('Save data deleted successfully');
    return { success: true, message: 'Save data deleted successfully' };
  } catch (error) {
    console.error('Failed to delete save data:', error);
    return { success: false, message: 'Failed to delete save data' };
  }
};

// Get save info (for display purposes)
export const getSaveInfo = () => {
  try {
    const saveString = localStorage.getItem('alchemistGuildSave');
    if (!saveString) {
      return null;
    }

    const saveData = JSON.parse(saveString);
    return {
      version: saveData.version,
      timestamp: saveData.timestamp,
      gameTime: saveData.gameTime,
      lastPlayed: new Date(saveData.timestamp).toLocaleString(),
      totalPlayTime: saveData.gameTime ? Math.floor((Date.now() - saveData.gameTime) / 1000) : 0
    };
  } catch (error) {
    console.error('Failed to get save info:', error);
    return null;
  }
};

// Auto-save functionality
export const autoSave = (gameData) => {
  // Only auto-save if the game has been running for at least 30 seconds
  const minAutoSaveInterval = 30000; // 30 seconds
  const lastSave = localStorage.getItem('alchemistGuildLastAutoSave');
  const now = Date.now();
  
  if (!lastSave || (now - parseInt(lastSave)) > minAutoSaveInterval) {
    const result = saveGame(gameData);
    if (result.success) {
      localStorage.setItem('alchemistGuildLastAutoSave', now.toString());
    }
    return result;
  }
  
  return { success: true, message: 'Auto-save skipped (too soon)' };
};

// Export save data for backup
export const exportSaveData = () => {
  try {
    const saveString = localStorage.getItem('alchemistGuildSave');
    if (!saveString) {
      return { success: false, message: 'No save data to export' };
    }

    const saveData = JSON.parse(saveString);
    const exportData = {
      ...saveData,
      exportTimestamp: Date.now(),
      exportVersion: CURRENT_SAVE_VERSION
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alchemist-guild-save-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, message: 'Save data exported successfully' };
  } catch (error) {
    console.error('Failed to export save data:', error);
    return { success: false, message: 'Failed to export save data' };
  }
};

// Import save data from backup
export const importSaveData = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Validate imported data
        if (!importedData.version || !importedData.gameState) {
          resolve({ success: false, message: 'Invalid save file format' });
          return;
        }

        // Migrate if needed
        if (importedData.version !== CURRENT_SAVE_VERSION) {
          const migratedData = migrateSaveData(importedData);
          if (!migratedData) {
            resolve({ success: false, message: 'Imported save data is incompatible' });
            return;
          }
          importedData = migratedData;
        }

        // Save the imported data
        const saveString = JSON.stringify(importedData);
        localStorage.setItem('alchemistGuildSave', saveString);
        
        resolve({ success: true, data: importedData, message: 'Save data imported successfully' });
      } catch (error) {
        console.error('Failed to import save data:', error);
        resolve({ success: false, message: 'Failed to import save data' });
      }
    };
    reader.onerror = () => {
      resolve({ success: false, message: 'Failed to read save file' });
    };
    reader.readAsText(file);
  });
}; 