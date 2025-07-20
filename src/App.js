import React, { useState, useEffect, useRef } from 'react';
import SwipeableOrderCard from './components/SwipeableOrderCard';
import AdventurerCard from './components/AdventurerCard';
import AdventurerCustomerCard from './components/AdventurerCustomerCard';
import QueuedOrderCard from './components/QueuedOrderCard';
import ActiveAdventurers from './components/ActiveAdventurers';
import MarketShop from './components/MarketShop';
import ProcessingStation from './components/ProcessingStation';
import TownInteraction from './components/TownInteraction';
import ShopScreen from './components/ShopScreen';
import { generateAdventurer } from './services/AdventurerGenerator';
import { initialResources, initialGameState, checkPopulationEvent, calculateReputationRequirement, processMissionOutcome, getCurrentEventInfo, logGoldTransaction, sellGear } from './services/GameState';
import { generateInitialZones, updateZoneDanger, calculateMissionSuccess, processMissionOutcome as processZoneOutcome, revealZone } from './services/ZoneSystem';
import { generateInitialTowns } from './services/TownSystem';
import { startShopConstruction, completeShopConstruction, calculateShopIncome, shopTypes, churchType } from './services/ShopSystem';
import { calculateUpgradeEffects, purchaseUpgrade, getUpgradeCategories } from './services/UpgradeSystem';
import './App.css';
import { generateAdventurerCustomer } from './services/AdventurerCustomerGenerator';
import AnimatedCraftingStation from './components/AnimatedCraftingStation';
import { calculateCraftingAttributes } from './services/MaterialAttributes';
import CraftingSection from './components/CraftingSection';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ZonesScreen from './components/ZonesScreen';
import UpgradesScreen from './components/UpgradesScreen';
import StatsScreen from './components/StatsScreen';
import SaveManager from './components/SaveManager';
import StatsBar from './components/StatsBar';
import { loadGame } from './services/SaveSystem';

function App() {
  // Core game state
  const [gameState, setGameState] = useState(initialGameState);
  const [inventory, setInventory] = useState(initialResources);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  // Zone system
  const [zones, setZones] = useState(generateInitialZones());
  // Adventurers: single source of truth
  const [adventurers, setAdventurers] = useState([]); // All adventurers
  const [nextAdventurerId, setNextAdventurerId] = useState(1);
  const [currentView, setCurrentView] = useState('shop');
  
  // Legacy order system (keeping for compatibility)
  const [orderQueue, setOrderQueue] = useState([]);
  const [orderDeadlines, setOrderDeadlines] = useState({});
  const [adventurerCustomers, setAdventurerCustomers] = useState([]);
  const [nextOrderId, setNextOrderId] = useState(1);
  
  // Town system
  const [towns, setTowns] = useState([]);
  const [buildingShops, setBuildingShops] = useState([]); // Shops under construction
  const [buildingChurches, setBuildingChurches] = useState([]); // Churches under construction
  
  // Player stats for town interactions
  const [playerStats, setPlayerStats] = useState({
    fame: 5, // Starts low
    military: 0,
    artisan: 0, 
    merchant: 0
  });
  
  // Legacy reputation system (keeping for compatibility)
  const [reputation, setReputation] = useState(50);
  
  // Shop stock
  const [shopStock, setShopStock] = useState({
    iron: 20, steel: 15, wood: 25, leather: 18, herbs: 22, crystal: 8,
    oil: 12, parchment: 16, ember: 6, silver: 4, gems: 3, thread: 30
  });

  // Upgrade system
  const [purchasedUpgrades, setPurchasedUpgrades] = useState({});
  const [upgradeEffects, setUpgradeEffects] = useState(calculateUpgradeEffects({}));
  
  // UI state
  const [craftedPopup, setCraftedPopup] = useState(null);
  const [lastCraftedItem, setLastCraftedItem] = useState(null);
  const [saveManagerOpen, setSaveManagerOpen] = useState(false);
  const [selectedGear, setSelectedGear] = useState(null);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [afkGoldPopup, setAfkGoldPopup] = useState(null);

  // Add population state and adventurer pool state
  const [populationState, setPopulationState] = useState('Stable'); // 'Struggling', 'Stable', 'Booming'
  const [adventurerPool, setAdventurerPool] = useState([]); // The current pool of available adventurers
  const [poolRefreshTime, setPoolRefreshTime] = useState(Date.now() + 12 * 60 * 60 * 1000); // Next refresh in 12 hours (real time)
  const [failedMissionsSinceRefresh, setFailedMissionsSinceRefresh] = useState(0);
  const [refreshesUsed, setRefreshesUsed] = useState(0); // Track refreshes used (max 2 per 12 hours)
  
  // Game log system
  const [gameLog, setGameLog] = useState([]);
  
  // Track processed missions to prevent duplicates
  const processedMissionsRef = useRef(new Set());
  
  // Helper function to add log entries
  const addLogEntry = (message, type = 'info') => {
    const entry = {
      id: Date.now(),
      timestamp: Date.now(),
      message,
      type // 'info', 'success', 'warning', 'error'
    };
    setGameLog(prev => [entry, ...prev.slice(0, 49)]); // Keep last 50 entries
  };

  // Helper: get pool size based on population state
  const getPoolSize = (state) => {
    if (state === 'Struggling') return 4;
    if (state === 'Booming') return 8;
    return 6; // Stable
  };

  // Helper: update population state based on gameState.population
  useEffect(() => {
    if (gameState.population < 600) {
      setPopulationState('Struggling');
    } else if (gameState.population >= 1200) {
      setPopulationState('Booming');
    } else {
      setPopulationState('Stable');
    }
  }, [gameState.population]);

  // Pool refresh logic (twice per 12 hours, real time)
  useEffect(() => {
    const now = Date.now();
    if (now >= poolRefreshTime) {
      // Reset refresh counter and timer
      setRefreshesUsed(0);
      setPoolRefreshTime(now + 12 * 60 * 60 * 1000); // Next reset in 12 hours
    }
    
    // Set up interval to check every minute
    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= poolRefreshTime) {
        setRefreshesUsed(0);
        setPoolRefreshTime(Date.now() + 12 * 60 * 60 * 1000);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [poolRefreshTime]);

  // Manual refresh function
  const handlePoolRefresh = () => {
    if (refreshesUsed < 2) {
      const poolSize = getPoolSize(populationState) - failedMissionsSinceRefresh;
      const newPool = [];
      for (let i = 0; i < poolSize; i++) {
        const adv = generateAdventurer(nextAdventurerId + i, gameState.population, upgradeEffects);
        adv.status = 'available';
        adv.zoneId = null;
        adv.mission = null;
        newPool.push(adv);
      }
      setAdventurerPool(newPool);
      setNextAdventurerId(prev => prev + poolSize);
      setFailedMissionsSinceRefresh(0);
      setRefreshesUsed(prev => prev + 1);
      addLogEntry(`Refreshed adventurer pool (${poolSize} available)`, 'info');
    }
  };

  // Initialize pool on first load
  useEffect(() => {
    if (adventurerPool.length === 0) {
      const poolSize = getPoolSize(populationState);
      const newPool = [];
      for (let i = 0; i < poolSize; i++) {
        const adv = generateAdventurer(nextAdventurerId + i, gameState.population, upgradeEffects);
        adv.status = 'available';
        adv.zoneId = null;
        adv.mission = null;
        newPool.push(adv);
      }
      setAdventurerPool(newPool);
      setNextAdventurerId(prev => prev + poolSize);
    }
  }, [populationState, gameState.population, upgradeEffects, nextAdventurerId, adventurerPool.length]);

  // Handler for drag-and-drop assignment
  const handleAssignAdventurerToZone = (adventurer, zoneId, fromZoneId) => {
    // Start the mission immediately when assigned
    handleAdventurerAssignment(adventurer, zoneId);
  };

  // Handler for unassigning (dragging out of a zone)
  const handleUnassignAdventurer = (adventurer, fromZoneId) => {
    setAdventurers(prev => prev.map(a =>
      a.id === adventurer.id
        ? { ...a, status: 'available', zoneId: null, mission: null }
        : a
    ));
  };

  // Generate initial towns
  useEffect(() => {
    setTowns(generateInitialTowns());
  }, []);

  // Update zone danger levels over time
  useEffect(() => {
    const interval = setInterval(() => {
      setZones(prevZones => updateZoneDanger(prevZones, upgradeEffects));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [upgradeEffects]);

  // Check for population events
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prevState => {
        const newState = checkPopulationEvent(prevState);
        
        // Log when events start
        if (newState.seasonalEvent !== prevState.seasonalEvent) {
          if (newState.seasonalEvent === 'festival') {
            addLogEntry('🎉 Town Festival has begun! Reputation matters more during celebrations.', 'success');
          } else if (newState.seasonalEvent === 'desperation') {
            addLogEntry('😰 Desperate times have fallen. Reputation matters less as people are desperate for help.', 'warning');
          } else if (newState.seasonalEvent === 'foreign_convoy') {
            addLogEntry('🚢 Foreign convoy has arrived! Travelers ignore reputation requirements.', 'info');
          } else if (newState.seasonalEvent === 'normal') {
            addLogEntry('📅 Seasonal event has ended. Back to normal conditions.', 'info');
          }
        }
        
        return newState;
      });
    }, 300000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Check for completed shop construction
  useEffect(() => {
    if (buildingShops.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      
      setBuildingShops(prevShops => {
        const completed = prevShops.filter(shop => now >= shop.completionTime);
        const stillBuilding = prevShops.filter(shop => now < shop.completionTime);
        
        // Complete shops and add them to towns
        completed.forEach(shop => {
          setTowns(prevTowns => prevTowns.map(town => {
            if (town.id === shop.townId) {
              const completedShop = completeShopConstruction(shop, town);
              return {
                ...town,
                playerShop: completedShop,
                lastUpdate: `Your ${shopTypes[shop.type].name} is now operational!`
              };
            }
            return town;
          }));
        });
        
        return stillBuilding;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [buildingShops.length]);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      const gameData = {
        gameState,
        inventory,
        zones,
        adventurers,
        towns,
        buildingShops,
        playerStats,
        reputation,
        shopStock,
        purchasedUpgrades,
        upgradeEffects,
        nextAdventurerId,
        nextOrderId,
        orderQueue,
        orderDeadlines,
        adventurerCustomers,
        // New adventurer pool state
        populationState,
        adventurerPool,
        poolRefreshTime,
        failedMissionsSinceRefresh,
        refreshesUsed,
        // Game log system
        gameLog
      };
      
      // Import autoSave function
      import('./services/SaveSystem').then(({ autoSave }) => {
        autoSave(gameData);
      });
    }, 60000); // Auto-save every minute

    return () => clearInterval(autoSaveInterval);
  }, [gameState, inventory, zones, adventurers, towns, buildingShops, playerStats, reputation, shopStock, purchasedUpgrades, upgradeEffects, nextAdventurerId, nextOrderId, orderQueue, orderDeadlines, adventurerCustomers, populationState, adventurerPool, poolRefreshTime, failedMissionsSinceRefresh, refreshesUsed]);

  // Update shop construction progress
  useEffect(() => {
    if (buildingShops.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setBuildingShops(prev => prev.map(shop => ({
        ...shop,
        progress: Math.min(100, ((now - shop.startTime) / (shop.completionTime - shop.startTime)) * 100)
      })));
      
      // Also update progress in towns for display
      setTowns(prevTowns => prevTowns.map(town => {
        const buildingShop = buildingShops.find(shop => shop.townId === town.id);
        if (buildingShop && town.playerShop && town.playerShop.status === 'building') {
          return {
            ...town,
            playerShop: {
              ...town.playerShop,
              progress: Math.min(100, ((now - buildingShop.startTime) / (buildingShop.completionTime - buildingShop.startTime)) * 100)
            }
          };
        }
        return town;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [buildingShops]);

  // Generate initial adventurers
  useEffect(() => {
    const initialAdventurers = [];
    for (let i = 1; i <= 3; i++) {
      const adv = generateAdventurer(i, gameState.population, upgradeEffects);
      adv.status = 'available';
      adv.zoneId = null;
      adv.mission = null;
      // Only add if id is unique
      if (!initialAdventurers.some(a => a.id === adv.id)) {
        initialAdventurers.push(adv);
      }
    }
    setAdventurers(prev => {
      // Only add if id is unique in the main array too
      const unique = initialAdventurers.filter(na => !prev.some(a => a.id === na.id));
      return [...prev, ...unique];
    });
    setNextAdventurerId(4);
  }, [gameState.population, upgradeEffects]);

  // Generate initial adventurer customers
  useEffect(() => {
    const sampleCustomers = [
      {
        id: 1,
        name: "Evya Shieldmaiden",
        class: "Warrior",
        missionDescription: "Heading to the frontlines to protect our borders. Need sturdy armor.",
        itemName: "Leather Armor",
        quantity: 2,
        priceOffer: 300,
        reputationBonus: 5,
        description: "A seasoned warrior known for her bravery in battle."
      },
      {
        id: 2,
        name: "Thorin Ironbeard",
        class: "Miner",
        missionDescription: "Delving deep into the mountain caves. Need reliable tools.",
        itemName: "Iron Sword",
        quantity: 1,
        priceOffer: 120,
        reputationBonus: 3,
        description: "A dwarf miner seeking fortune in the depths."
      },
      {
        id: 3,
        name: "Lyra Shadowweaver",
        class: "Mage",
        missionDescription: "Researching ancient magic. Need enchanted equipment.",
        itemName: "Enchanted Staff",
        quantity: 1,
        priceOffer: 450,
        reputationBonus: 8,
        description: "A mysterious mage studying forbidden arts."
      }
    ];
    
    setAdventurerCustomers(sampleCustomers);
  }, []);

  // Add new adventurer when deck gets low
  useEffect(() => {
    const availableCount = adventurers.filter(a => a.status === 'available').length;
    if (currentView === 'shop' && availableCount < 2) {
      const newAdventurer = generateAdventurer(nextAdventurerId, gameState.population, upgradeEffects);
      newAdventurer.status = 'available';
      newAdventurer.zoneId = null;
      newAdventurer.mission = null;
      setAdventurers(prev => prev.some(a => a.id === newAdventurer.id) ? prev : [...prev, newAdventurer]);
      setNextAdventurerId(prev => prev + 1);
    }
  }, [adventurers, nextAdventurerId, currentView, gameState.population, upgradeEffects]);

  // Generate new adventurer customers when deck gets low
  useEffect(() => {
    if (currentView === 'adventurers' && adventurerCustomers.length < 2) {
      const newCustomer = generateAdventurerCustomer(nextOrderId);
      setAdventurerCustomers(prev => [...prev, newCustomer]);
      setNextOrderId(prev => prev + 1);
    }
  }, [adventurerCustomers.length, currentView, nextOrderId]);

  // Check for completed missions
  useEffect(() => {
    const onMissionAdventurers = adventurers.filter(a => a.status === 'onMission');
    if (onMissionAdventurers.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      
      setAdventurers(prevAdventurers => {
        // Find completed and active missions using mission.returnTime
        const completed = prevAdventurers.filter(adventurer => 
          adventurer.status === 'onMission' && adventurer.mission && now >= adventurer.mission.returnTime
        );
        const active = prevAdventurers.filter(adventurer => 
          adventurer.status === 'onMission' && adventurer.mission && now < adventurer.mission.returnTime
        );
        
        // Only process if there are actually completed missions
        if (completed.length === 0) return prevAdventurers;
        
        console.log('[mission completion useEffect] setAdventurers: completed', completed.length, completed, 'active', active.length, active);
        
        // Process completed missions
        completed.forEach(adventurer => {
          const missionKey = `${adventurer.id}_${adventurer.mission.id}`;
          if (processedMissionsRef.current.has(missionKey)) {
            console.log('Mission already processed, skipping:', missionKey);
            return;
          }
          processedMissionsRef.current.add(missionKey);

          console.log('Mission completed:', adventurer.name, 'now:', now, 'returnTime:', adventurer.mission.returnTime);
          const success = Math.random() * 100 < adventurer.mission.successChance;
          
          // Store success result for this adventurer
          const adventurerWithResult = { ...adventurer, lastMissionFailed: !success };
          
          // Calculate damage dealt to zone first
          const zone = zones.find(z => z.id === adventurerWithResult.zoneId);
          let damagePercentage = 0;
          let calculatedZone = null; // Store the calculated zone outcome
          
          if (zone) {
            // Apply zone bonuses from other adventurers in the same zone
            const zoneAdventurers = adventurers.filter(a => a.zoneId === zone.id && a.status === 'onMission');
            let zoneBonusMultiplier = 1;
            let zoneBonusDescription = '';
            
            // Calculate zone bonuses
            zoneAdventurers.forEach(zoneAdv => {
              if (zoneAdv.zoneBonus && zoneAdv.id !== adventurerWithResult.id) {
                if (zoneAdv.zoneBonus.type === 'damage') {
                  zoneBonusMultiplier += zoneAdv.zoneBonus.effect;
                  zoneBonusDescription += ` +${Math.round(zoneAdv.zoneBonus.effect * 100)}% damage from ${zoneAdv.name}`;
                }
              }
            });
            
            // Apply zone bonus to damage calculation
            const baseZone = processZoneOutcome(adventurerWithResult, zone, success);
            const baseDamageDealt = zone.currentHealth - baseZone.currentHealth;
            const bonusDamageDealt = baseDamageDealt * (zoneBonusMultiplier - 1); // Extra damage from bonuses
            const totalDamageDealt = baseDamageDealt + bonusDamageDealt;
            
            // Create modified zone outcome with bonus damage
            calculatedZone = {
              ...baseZone,
              currentHealth: Math.max(0, zone.currentHealth - totalDamageDealt)
            };
            
            damagePercentage = zone.maxHealth > 0 ? (totalDamageDealt / zone.maxHealth) * 100 : 0;
            
            // Log zone bonus if applied
            if (zoneBonusDescription) {
              addLogEntry(`⚔️ Zone synergy:${zoneBonusDescription}`, 'info');
            }
          }
          
          // Update zone
          setZones(prevZones => {
            const zoneIndex = prevZones.findIndex(z => z.id === adventurerWithResult.zoneId);
            if (zoneIndex !== -1) {
              const updatedZones = [...prevZones];
              const oldZone = updatedZones[zoneIndex];
              // Use the calculatedZone from above with zone bonuses applied
              const zoneToUpdate = calculatedZone || processZoneOutcome(adventurerWithResult, oldZone, success);
              
              // Check if zone was just cleared (health went from >0 to 0)
              if (oldZone.currentHealth > 0 && zoneToUpdate.currentHealth <= 0 && !oldZone.isInDowntime) {
                // Zone was just cleared - give reputation bonus
                setGameState(prev => ({
                  ...prev,
                  reputation: prev.reputation + zoneToUpdate.reputationBonus
                }));
                addLogEntry(`🏆 ${zoneToUpdate.name} has been cleared! +${zoneToUpdate.reputationBonus} ⭐ reputation bonus!`, 'success');
              }
              
              updatedZones[zoneIndex] = zoneToUpdate;
              return updatedZones;
            }
            return prevZones;
          });
          
          // Update game state with upgrade effects
          setGameState(prevState => processMissionOutcome(adventurerWithResult, adventurerWithResult.mission, success, prevState, upgradeEffects));
          
                        // Add materials to inventory if successful
              if (success) {
                setInventory(prevInventory => {
                  const newInventory = { ...prevInventory };
                  // Add a random gear drop
                  if (!newInventory.collectedGear) newInventory.collectedGear = [];
                  const gearDrop = {
                    id: `gear_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                    name: `${adventurerWithResult.class}'s Trophy`,
                    quality: ['Common', 'Uncommon', 'Rare'][Math.floor(Math.random() * 3)],
                    value: Math.floor(Math.random() * 100) + 50,
                    adventurer: adventurerWithResult.name,
                    description: `Recovered from a successful mission by ${adventurerWithResult.name}.`
                  };
                  newInventory.collectedGear = [...newInventory.collectedGear, gearDrop];
                  
                  // Apply zone bonuses for reputation and gold
                  const zoneAdventurers = adventurers.filter(a => a.zoneId === adventurerWithResult.zoneId && a.status === 'onMission');
                  let reputationBonus = 0;
                  let goldBonus = 0;
                  let lootBonus = 0;
                  
                  zoneAdventurers.forEach(zoneAdv => {
                    if (zoneAdv.zoneBonus && zoneAdv.id !== adventurerWithResult.id) {
                      if (zoneAdv.zoneBonus.type === 'reputation') {
                        reputationBonus += Math.floor((adventurerWithResult.reputationGainOnSuccess || 0) * zoneAdv.zoneBonus.effect);
                      } else if (zoneAdv.zoneBonus.type === 'gold') {
                        goldBonus += Math.floor(gearDrop.value * zoneAdv.zoneBonus.effect);
                      } else if (zoneAdv.zoneBonus.type === 'loot') {
                        lootBonus += Math.floor(gearDrop.value * zoneAdv.zoneBonus.effect);
                      }
                    }
                  });
                  
                  // Add log entry here where gearDrop is in scope
                  const baseReward = Math.max(5, Math.floor(adventurerWithResult.experience / 8));
                  const upgradeBonus = upgradeEffects.reputationBonus || 0;
                  const reputationGain = baseReward + (adventurerWithResult.reputationGainOnSuccess || 0) + upgradeBonus + reputationBonus;
                  
                  // Apply gold bonus
                  if (goldBonus > 0) {
                    gearDrop.value += goldBonus;
                    addLogEntry(`💰 Mining expertise: +${goldBonus}g to gear value`, 'info');
                  }
                  
                  // Apply loot bonus
                  if (lootBonus > 0) {
                    gearDrop.value += lootBonus;
                    addLogEntry(`🎒 Rogues skills: +${lootBonus}g to gear value`, 'info');
                  }
                  
                  // Log reputation bonus if applied
                  if (reputationBonus > 0) {
                    addLogEntry(`⭐ Rangers guidance: +${reputationBonus} reputation bonus`, 'info');
                  }
                  
                  addLogEntry(`${adventurerWithResult.name} successfully returned with ${gearDrop.name} (+${reputationGain} ⭐, dealt ${damagePercentage.toFixed(2)}% damage to zone)`, 'success');
                  
                  return newInventory;
                });
              } else {
                // Failed mission - no additional reputation penalty (already paid when hiring)
                addLogEntry(`${adventurerWithResult.name} failed to return (dealt ${damagePercentage.toFixed(2)}% damage to zone)`, 'error');
              }
          
          // Handle death rewards from upgrades
          if (!success && upgradeEffects.deathGoldReward) {
            setInventory(prev => ({ ...prev, gold: prev.gold + upgradeEffects.deathGoldReward }));
            setGameState(prev => {
              const newState = { ...prev };
              logGoldTransaction(newState, upgradeEffects.deathGoldReward, 'earn', 'death_insurance');
              return newState;
            });
            addLogEntry(`Received ${upgradeEffects.deathGoldReward}g from death insurance`, 'warning');
            console.log(`Received ${upgradeEffects.deathGoldReward} gold from death insurance`);
          }
          
          console.log(`${adventurerWithResult.name} returned! Success: ${success}`);
          
        });
        // Only update completed adventurers, keep all others unchanged
        return prevAdventurers.map(a => {
          if (a.status === 'onMission' && a.mission && now >= a.mission.returnTime) {
            // Find the processed result for this adventurer
            const processedAdventurer = completed.find(c => c.id === a.id);
            return { 
              ...a, 
              status: 'available', 
              mission: null, 
              zoneId: null,
              lastMissionFailed: processedAdventurer ? processedAdventurer.lastMissionFailed : false
            };
          }
          return a;
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [adventurers.filter(a => a.status === 'onMission').length]);

  // Update mission progress
  useEffect(() => {
    if (adventurers.filter(a => a.status === 'onMission').length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      
      setAdventurers(prev => prev.map(adventurer => {
        if (adventurer.status === 'onMission' && adventurer.mission) {
          const total = adventurer.mission.returnTime - adventurer.mission.startTime;
          const elapsed = now - adventurer.mission.startTime;
          const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
          
          return {
            ...adventurer,
            mission: {
              ...adventurer.mission,
              progress
            }
          };
        }
        return adventurer;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [adventurers.filter(a => a.status === 'onMission').length]);



  // NEW: Handle queued order swipe (cancel)
  const handleQueuedOrderSwipe = (order, action) => {
    if (action === 'cancel') {
      setOrderQueue(prev => prev.filter(o => o.id !== order.id));
      setOrderDeadlines(prev => {
        const newDeadlines = { ...prev };
        delete newDeadlines[order.id];
        return newDeadlines;
      });
      console.log(`Order cancelled: ${order.customerName}`);
    }
  };

  // NEW: Check for missed deadlines
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      setOrderQueue(prev => {
        const missed = prev.filter(order => now > order.deadline);
        const active = prev.filter(order => now <= order.deadline);
        
        // Apply reputation penalty for missed orders
        missed.forEach(order => {
          setReputation(prev => Math.max(0, prev - 5)); // -5 reputation per missed order
          console.log(`❌ Missed deadline: ${order.customerName} - Reputation -5`);
        });
        
        return active;
      });
      
      // Clean up deadlines for missed orders
      setOrderDeadlines(prev => {
        const newDeadlines = { ...prev };
        Object.keys(newDeadlines).forEach(orderId => {
          if (now > newDeadlines[orderId]) {
            delete newDeadlines[orderId];
          }
        });
        return newDeadlines;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle adventurer assignment to zones (this now includes hiring)
  const handleAdventurerAssignment = (adventurer, zoneId) => {
    console.log('handleAdventurerAssignment called with:', adventurer, zoneId);
    if (!adventurer || typeof adventurer !== 'object' || !adventurer.id) {
      console.error('Invalid adventurer object passed to handleAdventurerAssignment:', adventurer);
      return;
    }
    
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;

    // Check if adventurer is in pool (needs to be hired first)
    const isInPool = adventurerPool.some(a => a.id === adventurer.id);
    if (isInPool) {
      // Use the new reputation cost system
      const hireCost = adventurer.reputationCost;
      if (gameState.reputation < hireCost) {
        console.log(`❌ Reputation too low! Need ${hireCost}, have ${gameState.reputation}`);
        return;
      }
      
      // Calculate mission success chance with zone bonuses
      const zoneAdventurers = adventurers.filter(a => a.zoneId === zoneId && a.status === 'onMission');
      const successChance = calculateMissionSuccess(adventurer, zone, zoneAdventurers);

      // Create mission
      const mission = {
        id: Date.now(),
        adventurer: adventurer,
        zone,
        zoneId,
        startTime: Date.now(),
        returnTime: Date.now() + (30 * 1000), // 30 seconds
        successChance,
        progress: 0
      };

      // Hire the adventurer and immediately assign to mission in one state update
      setGameState(prev => ({ ...prev, reputation: prev.reputation - hireCost }));
      setAdventurerPool(prev => prev.filter(a => a.id !== adventurer.id));
      setAdventurers(prev => [...prev, { 
        ...adventurer, 
        status: 'onMission', 
        mission, 
        zoneId,
        lastMissionFailed: false // Clear the failed flag when hiring
      }]);
      
      addLogEntry(`Hired ${adventurer.name} for ${zone.name} (${hireCost} ⭐)`, 'success');
      console.log(`Hired ${adventurer.name} for ${hireCost} reputation and sent to ${zone.name} (${successChance}% success chance)`);
    } else {
      // Adventurer is already hired, just assign to mission
      const latestAdventurer = adventurers.find(a => a.id === adventurer.id);
      if (!latestAdventurer) return;

      // Use the latest adventurer object
      const requiredRep = calculateReputationRequirement(latestAdventurer.reputationRequirement, gameState);
      if (gameState.reputation < requiredRep) {
        console.log(`❌ Reputation too low! Need ${requiredRep}, have ${gameState.reputation}`);
        return;
      }

      // Calculate mission success chance with zone bonuses
      const zoneAdventurers = adventurers.filter(a => a.zoneId === zoneId && a.status === 'onMission');
      const successChance = calculateMissionSuccess(latestAdventurer, zone, zoneAdventurers);

      // Create mission
      const mission = {
        id: Date.now(),
        adventurer: latestAdventurer,
        zone,
        zoneId,
        startTime: Date.now(),
        returnTime: Date.now() + (30 * 1000), // 30 seconds
        successChance,
        progress: 0
      };

      // Update the adventurer's status and mission
      setAdventurers(prev => {
        const updated = prev.map(a => {
          if (a.id === latestAdventurer.id) {
            console.log('Updating adventurer:', a, 'to onMission with mission:', mission);
            return { ...a, status: 'onMission', mission, zoneId };
          }
          return a;
        });
        console.log('[handleAdventurerAssignment] setAdventurers:', updated.length, updated);
        return updated;
      });

      addLogEntry(`Assigned ${latestAdventurer.name} to ${zone.name}`, 'info');
      console.log(`🗺️ ${latestAdventurer.name} sent to ${zone.name} (${successChance}% success chance)`);
    }

    // Reveal zone if not already revealed (or if scouting upgrade is active)
    if (!zone.isRevealed || upgradeEffects.zoneReveal) {
      setZones(prevZones => prevZones.map(z => 
        z.id === zoneId ? revealZone(z) : z
      ));
    }
  };

  const handleMissionComplete = (adventurer, success, loot) => {
    if (success) {
      setInventory(prev => {
        const newInventory = { ...prev };
        Object.entries(loot).forEach(([material, amount]) => {
          newInventory[material] = (newInventory[material] || 0) + amount;
        });
        return newInventory;
      });
      console.log(`${adventurer.name} succeeded and brought back:`, loot);
    } else {
      console.log(`${adventurer.name} failed their mission`);
      setFailedMissionsSinceRefresh(prev => prev + 1); // Increment failed missions
    }
  };

  const handleEstablishTrade = (town, success) => {
    setTowns(prev => prev.map(t => t.id === town.id ? town : t));
    
    if (success) {
      console.log(`✅ Trade established with ${town.name}!`);
    } else {
      console.log(`❌ Failed to establish trade with ${town.name}`);
    }
  };

  const handleBuildShop = (townId, shopType, playerSpecialization) => {
    const shopCost = shopTypes[shopType].cost;
    
    if (inventory.gold >= shopCost) {
      // Deduct cost
      setInventory(prev => ({ ...prev, gold: prev.gold - shopCost }));
      
      // Start construction
      const newShop = startShopConstruction(townId, shopType, playerSpecialization);
      setBuildingShops(prev => [...prev, newShop]);
      
      // Update town with building shop reference
      setTowns(prev => prev.map(town => 
        town.id === townId 
          ? { ...town, playerShop: { ...newShop, status: 'building' } }
          : town
      ));
      
      console.log(`Started building ${shopTypes[shopType].name} in town ${townId}`);
    }
  };

  const handleBuildChurch = (townId) => {
    // Deduct gold
    setInventory(prev => ({ ...prev, gold: prev.gold - churchType.cost }));
    
    // Add to building churches
    const newChurch = {
      townId,
      type: 'church',
      status: 'building',
      startTime: Date.now(),
      completionTime: Date.now() + (churchType.buildTime * 1000),
      totalInvestment: churchType.cost,
      progress: 0
    };
    
    setBuildingChurches(prev => [...prev, newChurch]);
    
    // Update town
    setTowns(prev => prev.map(town => {
      if (town.id === townId) {
        return {
          ...town,
          playerChurch: newChurch,
          lastUpdate: `Started construction of Church in ${town.name}.`
        };
      }
      return town;
    }));
    
    console.log(`Started building church in town ${townId}`);
  };

  const handleCollectIncome = (townId, amount) => {
    setInventory(prev => ({ ...prev, gold: prev.gold + amount }));
    setGameState(prev => {
      const newState = { ...prev };
      logGoldTransaction(newState, amount, 'earn', 'shop_income');
      return newState;
    });
    
    // Update shop's last collection time
    setTowns(prev => prev.map(town => {
      if (town.id === townId && town.playerShop) {
        return {
          ...town,
          playerShop: {
            ...town.playerShop,
            lastIncomeCollection: Date.now()
          }
        };
      }
      return town;
    }));
    
    console.log(`Collected ${amount} gold from shop income`);
  };

  const handleUpgradeTownStatus = (townId, upgradeResult) => {
    // Deduct gold from inventory
    setInventory(prev => ({ ...prev, gold: prev.gold - upgradeResult.cost }));
    
    // Add reputation to game state
    setGameState(prev => ({ ...prev, reputation: prev.reputation + upgradeResult.reputationGain }));
    
    // Update town status
    setTowns(prev => prev.map(town => {
      if (town.id === townId) {
        return {
          ...town,
          economicStatus: upgradeResult.newStatus,
          lastUpdate: `Town status upgraded to ${upgradeResult.newStatus} through generous donations.`
        };
      }
      return town;
    }));
    
    // Log the upgrade
    addLogEntry(upgradeResult.message, 'success');
    addLogEntry(`+${upgradeResult.reputationGain} reputation from donation`, 'info');
  };

  // Handle upgrade purchase
  const handlePurchaseUpgrade = (cost, newPurchasedUpgrades) => {
  setInventory(prev => ({ ...prev, gold: prev.gold - cost }));
  setGameState(prev => {
    const newState = { ...prev };
    logGoldTransaction(newState, -cost, 'spend', 'purchase_upgrade');
    return newState;
  });
  setPurchasedUpgrades(newPurchasedUpgrades);
  setUpgradeEffects(calculateUpgradeEffects(newPurchasedUpgrades));
  
  // Find the purchased upgrade name for the log
  const purchasedUpgrade = Object.values(newPurchasedUpgrades).flat().find(upg => upg.purchased && !purchasedUpgrades[upg.category]?.[upg.id]?.purchased);
  if (purchasedUpgrade) {
    addLogEntry(`Purchased upgrade: ${purchasedUpgrade.name}`, 'success');
  }
};

  // Handle loading game data
  const handleLoadGame = (saveData) => {
    setGameState(saveData.gameState);
    setInventory(saveData.inventory);
    setZones(saveData.zones);
    setAdventurers(saveData.adventurers);
    setTowns(saveData.towns);
    setBuildingShops(saveData.buildingShops);
    setPlayerStats(saveData.playerStats);
    setReputation(saveData.reputation);
    setShopStock(saveData.shopStock);
    setPurchasedUpgrades(saveData.purchasedUpgrades);
    setUpgradeEffects(saveData.upgradeEffects);
    setNextAdventurerId(saveData.nextAdventurerId);
    setNextOrderId(saveData.nextOrderId);
    setOrderQueue(saveData.orderQueue);
    setOrderDeadlines(saveData.orderDeadlines);
    setAdventurerCustomers(saveData.adventurerCustomers);
    // Load new adventurer pool state
    setPopulationState(saveData.populationState || 'Stable');
    setAdventurerPool(saveData.adventurerPool || []);
    setPoolRefreshTime(saveData.poolRefreshTime || Date.now() + 12 * 60 * 60 * 1000);
    setFailedMissionsSinceRefresh(saveData.failedMissionsSinceRefresh || 0);
    setRefreshesUsed(saveData.refreshesUsed || 0);
    setGameLog(saveData.gameLog || []);
    setGameLoaded(true);
    console.log('Game loaded successfully');
  };

  const handleBuyMaterial = (material, cost) => {
    setInventory(prev => ({
      ...prev,
      gold: prev.gold - cost,
      [material]: (prev[material] || 0) + 1
    }));
    
    setShopStock(prev => ({
      ...prev,
      [material]: prev[material] - 1
    }));
    
    setGameState(prev => {
      const newState = { ...prev };
      logGoldTransaction(newState, -cost, 'spend', 'buy_material');
      return newState;
    });
    console.log(`Bought 1x ${material} for ${cost} gold`);
  };

  const handleStartCrafting = (recipe, quantity) => {
    setInventory(prev => {
      const newInventory = { ...prev };
      
      // Consume materials
      recipe.materials.forEach(material => {
        newInventory[material.name] -= material.amount * quantity;
      });
      
      return newInventory;
    });
    console.log(`Started crafting ${quantity}x ${recipe.output}`);
  };

  const handleCompleteCrafting = (itemName, quantity) => {
    setInventory(prev => {
      const newInventory = { ...prev };
      if (!newInventory.collectedGear) newInventory.collectedGear = [];
      for (let i = 0; i < quantity; i++) {
        newInventory.collectedGear.push({
          id: `crafted_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          name: itemName,
          quality: ['Common', 'Uncommon', 'Rare'][Math.floor(Math.random() * 3)],
          value: Math.floor(Math.random() * 100) + 30,
          description: `Handcrafted in your guild's workshop.`
        });
      }
      return newInventory;
    });
    console.log(`✅ Completed crafting ${quantity}x ${itemName}`);
  };

  // Add this new function to handle inventory toggle
  const toggleInventory = () => {
    setInventoryOpen(!inventoryOpen);
  };

  // NEW: Handle adventurer customer swipes
  const handleAdventurerCustomerSwipe = (customer, action) => {
    if (action === 'sell') {
      // Check if we have the item
      if (inventory[customer.itemName] >= customer.quantity) {
        // Sell the item
        setInventory(prev => ({
          ...prev,
          [customer.itemName]: prev[customer.itemName] - customer.quantity,
          gold: prev.gold + customer.priceOffer
        }));
        
        // Add reputation
        setReputation(prev => prev + customer.reputationBonus);
        
        console.log(`Sold ${customer.quantity}x ${customer.itemName} to ${customer.name} for ${customer.priceOffer} gold`);
      } else {
        console.log(`Cannot sell ${customer.itemName} - insufficient stock`);
      }
    }
    
    // Remove from deck
    setTimeout(() => {
      setAdventurerCustomers(prev => prev.filter(c => c.id !== customer.id));
    }, 300);
  };



  // Add this new function to handle order completion
  const handleOrderComplete = (order) => {
    // Remove from queue
    setOrderQueue(prev => prev.filter(o => o.id !== order.id));
    
    // Add gold and reputation
    setInventory(prev => ({ ...prev, gold: prev.gold + order.priceOffer }));
    setReputation(prev => prev + 5); // +5 reputation for completing order
    
    // Convert customer to adventurer and start mission
    const customerAdventurer = {
      id: `adv_${order.id}`,
      name: order.customerName,
      class: getCustomerClass(order.customerTier), // We'll create this function
      successRate: getCustomerSuccessRate(order.customerTier), // We'll create this function
      missionTime: getCustomerMissionTime(order.customerTier), // We'll create this function
      hiringCost: 0, // Already "hired" through order completion
      lootTable: getCustomerLootTable(order.customerTier), // We'll create this function
      description: `${order.customerName} is now on a mission after receiving their ${order.itemName}.`,
      startTime: Date.now(),
      returnTime: Date.now() + (getCustomerMissionTime(order.customerTier) * 60 * 1000),
      progress: 0,
      fromOrder: true // Flag to identify this adventurer came from an order
    };
    
    setAdventurers(prev => [...prev, customerAdventurer]);
    
    console.log(`✅ Order completed! ${order.customerName} is now on a mission.`);
  };

  // Add these helper functions
  const getCustomerClass = (tier) => {
    const classMap = {
      'Bronze': 'Miner',
      'Silver': 'Ranger', 
      'Gold': 'Warrior',
      'Platinum': 'Mage'
    };
    return classMap[tier] || 'Ranger';
  };

  const getCustomerSuccessRate = (tier) => {
    const rateMap = {
      'Bronze': 60,
      'Silver': 70,
      'Gold': 80,
      'Platinum': 90
    };
    return rateMap[tier] || 70;
  };

  const getCustomerMissionTime = (tier) => {
    const timeMap = {
      'Bronze': 30,
      'Silver': 40,
      'Gold': 50,
      'Platinum': 60
    };
    return timeMap[tier] || 40;
  };

  const getCustomerLootTable = (tier) => {
    const lootMap = {
      'Bronze': [
        { material: 'iron', min: 2, max: 4 },
        { material: 'wood', min: 3, max: 6 }
      ],
      'Silver': [
        { material: 'steel', min: 1, max: 3 },
        { material: 'leather', min: 2, max: 4 },
        { material: 'herbs', min: 2, max: 5 }
      ],
      'Gold': [
        { material: 'silver', min: 1, max: 2 },
        { material: 'crystal', min: 1, max: 2 },
        { material: 'oil', min: 2, max: 4 }
      ],
      'Platinum': [
        { material: 'gems', min: 1, max: 3 },
        { material: 'ember', min: 1, max: 2 },
        { material: 'parchment', min: 2, max: 4 }
      ]
    };
    return lootMap[tier] || lootMap['Silver'];
  };

  // Ref for CraftingSection to allow inventory click-to-fill
  const craftingSectionRef = useRef();

  const handleSellGear = (gearId) => {
    // Get the new inventory and gold earned
    const { inventory: newInventory, gold } = sellGear(gearId, inventory);

    // Update inventory (this triggers a re-render)
    setInventory(newInventory);

    // Log the gold transaction and update gameState
    setGameState(prev => {
      const newState = { ...prev };
      logGoldTransaction(newState, gold, 'earn', 'sell_gear');
      return newState;
    });
    
    // Find the gear name for the log
    const gear = inventory.collectedGear?.find(g => g.id === gearId);
    if (gear) {
      addLogEntry(`Sold ${gear.name} for ${gold}g`, 'info');
    }
  };

  // Track last active timestamp for AFK rewards
  useEffect(() => {
    const saveLastActive = () => {
      localStorage.setItem('alchemistGuildLastActive', Date.now().toString());
    };
    window.addEventListener('beforeunload', saveLastActive);
    window.addEventListener('blur', saveLastActive);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') saveLastActive();
    });
    return () => {
      window.removeEventListener('beforeunload', saveLastActive);
      window.removeEventListener('blur', saveLastActive);
      document.removeEventListener('visibilitychange', saveLastActive);
    };
  }, []);

  useEffect(() => {
    if (!gameLoaded) return;
    const lastActive = localStorage.getItem('alchemistGuildLastActive');
    if (lastActive && inventory && typeof inventory.gold === 'number') {
      const now = Date.now();
      const afkSeconds = Math.floor((now - parseInt(lastActive, 10)) / 1000);
      if (afkSeconds > 30) {
        let baseGold = Math.floor(afkSeconds / 10);
        const onMissionCount = adventurers.filter(a => a.status === 'onMission').length;
        const bonusGold = Math.floor(baseGold * 0.2 * onMissionCount);
        const totalGold = baseGold + bonusGold;

        if (totalGold > 0) {
          setInventory(prev => {
            const newInventory = { ...prev, gold: (prev.gold || 0) + totalGold };
            
            // Chance to find gear from dead adventurers during AFK time
            const deadAdventurers = adventurers.filter(a => a.status === 'available' && a.lastMissionFailed);
            if (deadAdventurers.length > 0 && Math.random() < 0.3) { // 30% chance
              const deadAdventurer = deadAdventurers[Math.floor(Math.random() * deadAdventurers.length)];
              if (deadAdventurer.gear) {
                const recoveredGear = {
                  id: `recovered_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                  name: `${deadAdventurer.name}'s ${deadAdventurer.gear.weapon}`,
                  quality: deadAdventurer.gear.quality,
                  value: Math.floor(deadAdventurer.gear.value * 0.7), // Reduced value for recovered gear
                  adventurer: deadAdventurer.name,
                  description: `Recovered from ${deadAdventurer.name}'s remains after their failed mission.`
                };
                if (!newInventory.collectedGear) newInventory.collectedGear = [];
                newInventory.collectedGear.push(recoveredGear);
                addLogEntry(`Recovered ${recoveredGear.name} from ${deadAdventurer.name}'s remains`, 'warning');
              }
            }
            
            setGameState(prevState => {
              const newState = { ...prevState };
              logGoldTransaction(newState, totalGold, 'earn', 'afk_reward');
              return newState;
            });
            // Show non-blocking popup
            setAfkGoldPopup({ gold: totalGold, seconds: afkSeconds });
            setTimeout(() => setAfkGoldPopup(null), 4000);
            addLogEntry(`Earned ${totalGold}g from AFK rewards (${afkSeconds}s)`, 'success');
            return newInventory;
          });
        }
      }
    }
    // eslint-disable-next-line
  }, [gameLoaded]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && gameLoaded) {
        const lastActive = localStorage.getItem('alchemistGuildLastActive');
        if (lastActive && inventory && typeof inventory.gold === 'number') {
          const now = Date.now();
          const afkSeconds = Math.floor((now - parseInt(lastActive, 10)) / 1000);
          if (afkSeconds > 30) {
            let baseGold = Math.floor(afkSeconds / 10);
            const onMissionCount = adventurers.filter(a => a.status === 'onMission').length;
            const bonusGold = Math.floor(baseGold * 0.2 * onMissionCount);
            const totalGold = baseGold + bonusGold;

            if (totalGold > 0) {
              setInventory(prev => {
                const newInventory = { ...prev, gold: (prev.gold || 0) + totalGold };
                setGameState(prevState => {
                  const newState = { ...prevState };
                  logGoldTransaction(newState, totalGold, 'earn', 'afk_reward');
                  return newState;
                });
                setAfkGoldPopup({ gold: totalGold, seconds: afkSeconds });
                return newInventory;
              });
            }
          }
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [gameLoaded, inventory, adventurers]);

  // On mount, load saved game if it exists
  useEffect(() => {
    const saved = loadGame();
    if (saved.success && saved.data) {
      const data = saved.data;
      setGameState(data.gameState);
      setInventory(data.inventory);
      setZones(data.zones);
      setAdventurers(data.adventurers);
      setTowns(data.towns);
      setBuildingShops(data.buildingShops);
      setPlayerStats(data.playerStats);
      setReputation(data.reputation);
      setShopStock(data.shopStock);
      setPurchasedUpgrades(data.purchasedUpgrades);
      setUpgradeEffects(data.upgradeEffects);
      setNextAdventurerId(data.nextAdventurerId);
      setNextOrderId(data.nextOrderId);
      setOrderQueue(data.orderQueue);
      setOrderDeadlines(data.orderDeadlines);
      setAdventurerCustomers(data.adventurerCustomers);
      // Load new adventurer pool state
      setPopulationState(data.populationState || 'Stable');
      setAdventurerPool(data.adventurerPool || []);
      setPoolRefreshTime(data.poolRefreshTime || Date.now() + 12 * 60 * 60 * 1000);
      setFailedMissionsSinceRefresh(data.failedMissionsSinceRefresh || 0);
      setRefreshesUsed(data.refreshesUsed || 0);
      // Optionally: show a message "Game loaded!"
    }
    setGameLoaded(true);
  }, []);

  useEffect(() => {
    if (afkGoldPopup) {
      const timer = setTimeout(() => setAfkGoldPopup(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [afkGoldPopup]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        {craftedPopup && (
          <div className="crafted-banner-popup">
            <span>
              <b>You've crafted:</b> {craftedPopup.name}
              {craftedPopup.quality && (
                <span className={`crafted-quality ${craftedPopup.quality.toLowerCase()}`}>
                  &nbsp;({craftedPopup.quality})
                </span>
              )}
              !
            </span>
          </div>
        )}
        {afkGoldPopup && (
          <div className="crafted-banner-popup" style={{
            background: '#2c1810',
            color: '#ffd700',
            border: '2px solid #d4af37',
            boxShadow: '0 4px 24px #000a',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            zIndex: 4001
          }}>
            <span>
              <b>AFK Gold:</b> +{afkGoldPopup.gold}g <span style={{ fontStyle: 'italic', color: '#cd853f' }}>({afkGoldPopup.seconds}s offline)</span>
            </span>
          </div>
        )}
        {selectedGear && (
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 3000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setSelectedGear(null)}
          >
            <div
              style={{
                background: '#2c1810',
                border: '2px solid #d4af37',
                borderRadius: 12,
                padding: 24,
                minWidth: 260,
                maxWidth: 340,
                color: '#f4e4bc',
                position: 'relative'
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'none', border: 'none', color: '#ffd700', fontSize: 22, cursor: 'pointer'
                }}
                onClick={() => setSelectedGear(null)}
                title="Close"
              >✕</button>
              <h3 style={{ color: '#ffd700', marginBottom: 8 }}>{selectedGear.name}</h3>
              <div style={{ marginBottom: 8 }}>
                <b>Quality:</b> {selectedGear.quality}
              </div>
              <div style={{ marginBottom: 8 }}>
                <b>Value:</b> {selectedGear.value}g
              </div>
              {selectedGear.adventurer && (
                <div style={{ marginBottom: 8 }}>
                  <b>Collected from:</b> <span style={{ fontStyle: 'italic' }}>{selectedGear.adventurer}</span>
                </div>
              )}
              {selectedGear.description && (
                <div style={{ marginBottom: 8, fontStyle: 'italic', color: '#cd853f' }}>
                  {selectedGear.description}
                </div>
              )}
              {/* Optional: Add Sell button here too */}
              <div style={{ marginBottom: 8, color: '#ffd700' }}>
                <b>Sell Price:</b> {Math.floor(selectedGear.value * 0.7)}g
              </div>
              <button
                style={{
                  marginTop: 12,
                  background: '#ff6b6b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 18px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  handleSellGear(selectedGear.id);
                  setSelectedGear(null);
                }}
                title="Sell for gold"
              >
                Sell
              </button>
            </div>
          </div>
        )}
        {/* StatsBar at the top */}
        <StatsBar 
          inventory={inventory}
          gameState={gameState}
          adventurers={adventurers}
          zones={zones}
          purchasedUpgrades={purchasedUpgrades}
          onOpenSaveManager={() => setSaveManagerOpen(true)}
          // New props for adventurer pool system
          adventurerPool={adventurerPool}
          populationState={populationState}
          refreshesUsed={refreshesUsed}
          onPoolRefresh={handlePoolRefresh}
          // Game log system
          gameLog={gameLog}
        />
        <header className="App-header">
          
          {currentView === 'shop' && (
            <ShopScreen
              adventurers={adventurers} // Use main adventurers array to see all hired adventurers
              adventurerPool={adventurerPool} // Pass pool for available adventurers
              zones={zones}
              gameState={gameState}
              onAssignAdventurer={handleAssignAdventurerToZone}
              onUnassignAdventurer={handleUnassignAdventurer}
              currentEvent={getCurrentEventInfo(gameState)}
            />
          )}
          
          {currentView === 'zones' && (
            <ZonesScreen
              zones={zones}
              adventurers={adventurers}
              onAssignAdventurer={handleAssignAdventurerToZone}
              onUnassignAdventurer={handleUnassignAdventurer}
            />
          )}
          
          {currentView === 'town' && (
            <TownInteraction 
              towns={towns}
              playerStats={playerStats}
              inventory={inventory}
              onEstablishTrade={handleEstablishTrade}
              onUpdateTown={(town) => setTowns(prev => prev.map(t => t.id === town.id ? town : t))}
              onBuildShop={handleBuildShop}
              onBuildChurch={handleBuildChurch}
              onCollectIncome={handleCollectIncome}
              onUpgradeTownStatus={handleUpgradeTownStatus}
            />
          )}
          
          {currentView === 'upgrades' && (
            <UpgradesScreen
              playerGold={inventory.gold}
              purchasedUpgrades={purchasedUpgrades}
              onPurchaseUpgrade={handlePurchaseUpgrade}
              upgradeEffects={upgradeEffects}
            />
          )}
          
          {/* Inventory Sheet (only when open) */}
          {inventoryOpen && (
            <>
              <div className="inventory-overlay" onClick={toggleInventory} />
              <div className="inventory-sheet" style={{ marginTop: 60 }}>
                <div className="inventory-sheet-header">
                  <button 
                    className="inventory-close-btn"
                    onClick={toggleInventory}
                  >
                    ✕
                  </button>
                </div>
                <div className="inventory-sheet-content">
                  {/* Crafting station at the top */}
                  {false && (
                    <CraftingSection
                      ref={craftingSectionRef}
                      inventory={inventory}
                      onCraft={(materials, recipeName, attributes) => {
                        // 1. Consume materials from inventory
                        setInventory(prev => {
                          const newInventory = { ...prev };
                          materials.forEach(({ name, amount }) => {
                            newInventory[name] = (newInventory[name] || 0) - amount;
                          });
                          return newInventory;
                        });

                        // 2. Determine item quality and name
                        let craftedItem = recipeName;
                        let quality = 'Common';
                        const total = (attributes.strength || 0) + (attributes.speed || 0) + (attributes.magical || 0);
                        if (total > 20) {
                          craftedItem = `${craftedItem} (Advanced)`;
                          quality = 'Uncommon';
                        }
                        if (total > 40) {
                          craftedItem = `${craftedItem} (Masterwork)`;
                          quality = 'Rare';
                        }

                        // 3. Add crafted item to inventory
                        setInventory(prev => ({
                          ...prev,
                          [craftedItem]: (prev[craftedItem] || 0) + 1
                        }));

                        // 4. Show crafted popup
                        setCraftedPopup({ name: craftedItem, quality });
                        setTimeout(() => setCraftedPopup(null), 4000);
                        setLastCraftedItem({ name: craftedItem, quality });
                        setTimeout(() => setLastCraftedItem(null), 1800);
                      }}
                    />
                  )}
                  <div style={{ height: 32 }} /> {/* <-- Add this spacer */}
                  {/* Inventory grid below */}
                  <div className="inventory-grid">
                    {(inventory.collectedGear || []).length === 0 ? (
                      <div style={{ fontStyle: 'italic', color: '#cd853f' }}>No gear collected yet.</div>
                    ) : (
                      inventory.collectedGear.map(gear => (
                        <div key={gear.id} className="inventory-item">
                          <span
                            className="material-name"
                            style={{ fontStyle: 'italic', cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => setSelectedGear(gear)}
                            title="View details"
                          >
                            {gear.name}
                          </span>
                          <span className="material-amount" style={{ color: '#ffd700', fontWeight: 'bold', fontSize: 16 }}>
                            {Math.floor(gear.value * 0.7)}g
                          </span>
                          <span style={{ fontSize: 11, color: '#cd853f', fontStyle: 'italic', marginBottom: 2 }}>
                            Sale Price
                          </span>
                          <button
                            style={{
                              marginTop: 4,
                              background: '#ff6b6b',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 6,
                              padding: '4px 10px',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleSellGear(gear.id)}
                            title={`Sell for ${Math.floor(gear.value * 0.7)} gold`}
                          >
                            Sell
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Updated Bottom Navigation */}
          <div className="bottom-navigation">
            <button
              className={`nav-button${currentView === 'shop' ? ' active' : ''}`}
              onClick={() => setCurrentView('shop')}
            >
              Shop
            </button>
            <button
              className={`nav-button${currentView === 'zones' ? ' active' : ''}`}
              onClick={() => setCurrentView('zones')}
            >
              Zones
            </button>
            <button
              className={`nav-button inventory-nav${inventoryOpen ? ' active' : ''}`}
              onClick={toggleInventory}
              aria-label="Inventory"
            >
              <img src="/inventory-icon.svg" alt="" className="inventory-icon" />
            </button>
            <button
              className={`nav-button${currentView === 'town' ? ' active' : ''}`}
              onClick={() => setCurrentView('town')}
            >
              Town
            </button>
            <button
              className={`nav-button${currentView === 'upgrades' ? ' active' : ''}`}
              onClick={() => setCurrentView('upgrades')}
            >
              Upgrades
            </button>
            <button
              className={`nav-button${currentView === 'stats' ? ' active' : ''}`}
              onClick={() => setCurrentView('stats')}
            >
              Stats
            </button>
          </div>
          
          {/* Inventory Toggle Button */}
          {/* This button is now outside the inventory sheet */}
          
          {/* Mobile Inventory Sheet */}
          {/* This is now handled by the JSX structure */}
          
          {/* Desktop Inventory Display (hidden on mobile) */}
        </header>
        
        {/* Save Manager */}
        <SaveManager
          gameData={{
            gameState,
            inventory,
            zones,
            adventurers,
            towns,
            buildingShops,
            playerStats,
            reputation,
            shopStock,
            purchasedUpgrades,
            upgradeEffects,
            nextAdventurerId,
            nextOrderId,
            orderQueue,
            orderDeadlines,
            adventurerCustomers
          }}
          onLoadGame={handleLoadGame}
          isOpen={saveManagerOpen}
          onClose={() => setSaveManagerOpen(false)}
        />
      </div>
    </DndProvider>
  );
}

export default App;