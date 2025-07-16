// src/App.js
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
import { initialResources, initialGameState, checkPopulationEvent, calculateReputationRequirement, processMissionOutcome, getCurrentEventInfo, logGoldTransaction } from './services/GameState';
import { generateInitialZones, updateZoneDanger, calculateMissionSuccess, processMissionOutcome as processZoneOutcome, revealZone } from './services/ZoneSystem';
import { generateInitialTowns } from './services/TownSystem';
import { startShopConstruction, completeShopConstruction, calculateShopIncome, shopTypes } from './services/ShopSystem';
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
      setGameState(prevState => checkPopulationEvent(prevState));
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
        adventurerCustomers
      };
      
      // Import autoSave function
      import('./services/SaveSystem').then(({ autoSave }) => {
        autoSave(gameData);
      });
    }, 60000); // Auto-save every minute

    return () => clearInterval(autoSaveInterval);
  }, [gameState, inventory, zones, adventurers, towns, buildingShops, playerStats, reputation, shopStock, purchasedUpgrades, upgradeEffects, nextAdventurerId, nextOrderId, orderQueue, orderDeadlines, adventurerCustomers]);

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
    if (adventurers.filter(a => a.status === 'onMission').length === 0) return;

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
        console.log('[mission completion useEffect] setAdventurers: completed', completed.length, completed, 'active', active.length, active);
        
        // Process completed missions
        completed.forEach(adventurer => {
          console.log('Mission completed:', adventurer.name, 'now:', now, 'returnTime:', adventurer.mission.returnTime);
          const success = Math.random() * 100 < adventurer.mission.successChance;
          
          // Update zone
          setZones(prevZones => {
            const zoneIndex = prevZones.findIndex(z => z.id === adventurer.zoneId);
            if (zoneIndex !== -1) {
              const updatedZones = [...prevZones];
              updatedZones[zoneIndex] = processZoneOutcome(adventurer, updatedZones[zoneIndex], success);
              return updatedZones;
            }
            return prevZones;
          });
          
          // Update game state with upgrade effects
          setGameState(prevState => processMissionOutcome(adventurer, adventurer.mission, success, prevState, upgradeEffects));
          
          // Add materials to inventory if successful
          if (success) {
            setInventory(prevInventory => {
              const newInventory = { ...prevInventory };
              adventurer.mission.materials?.forEach(material => {
                if (Math.random() < 0.7) { // 70% chance for each material
                  const amount = Math.floor(Math.random() * 3) + 1;
                  newInventory[material] = (newInventory[material] || 0) + amount;
                }
              });
              return newInventory;
            });
          }
          
          // Handle death rewards from upgrades
          if (!success && upgradeEffects.deathGoldReward) {
            setInventory(prev => ({ ...prev, gold: prev.gold + upgradeEffects.deathGoldReward }));
            setGameState(prev => {
              const newState = { ...prev };
              logGoldTransaction(newState, upgradeEffects.deathGoldReward, 'earn', 'death_insurance');
              return newState;
            });
            console.log(`Received ${upgradeEffects.deathGoldReward} gold from death insurance`);
          }
          
          console.log(`${adventurer.name} returned! Success: ${success}`);
        });
        // Only update completed adventurers, keep all others unchanged
        return prevAdventurers.map(a => {
          if (a.status === 'onMission' && a.mission && now >= a.mission.returnTime) {
            // Mark as available, clear mission and zoneId
            return { ...a, status: 'available', mission: null, zoneId: null };
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

  // Handle adventurer assignment to zones
  const handleAdventurerAssignment = (adventurer, zoneId) => {
    console.log('handleAdventurerAssignment called with:', adventurer, zoneId);
    if (!adventurer || typeof adventurer !== 'object' || !adventurer.id) {
      console.error('Invalid adventurer object passed to handleAdventurerAssignment:', adventurer);
      return;
    }
    // Always get the latest adventurer from state
    const latestAdventurer = adventurers.find(a => a.id === adventurer.id);
    if (!latestAdventurer) return;

    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;

    // Use the latest adventurer object
    const requiredRep = calculateReputationRequirement(latestAdventurer.reputationRequirement, gameState);
    if (gameState.reputation < requiredRep) {
      console.log(`❌ Reputation too low! Need ${requiredRep}, have ${gameState.reputation}`);
      return;
    }

    // Reveal zone if not already revealed (or if scouting upgrade is active)
    if (!zone.isRevealed || upgradeEffects.zoneReveal) {
      setZones(prevZones => prevZones.map(z => 
        z.id === zoneId ? revealZone(z) : z
      ));
    }

    // Calculate mission success chance
    const successChance = calculateMissionSuccess(latestAdventurer, zone);

    // Create mission
    const mission = {
      id: Date.now(),
      adventurer: latestAdventurer,
      zone,
      zoneId,
      startTime: Date.now(),
      returnTime: Date.now() + (30 * 60 * 1000), // 30 minutes
      successChance,
      progress: 0
    };

    // Only update the adventurer's status and mission, do not remove from array
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

    console.log(`🗺️ ${latestAdventurer.name} sent to ${zone.name} (${successChance}% success chance)`);
  };

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

  const handleAdventurerSwipe = (adventurer, action) => {
    if (action === 'hire') {
      if (inventory.gold >= adventurer.hiringCost) {
        // Hire the adventurer
        setInventory(prev => ({ ...prev, gold: prev.gold - adventurer.hiringCost }));
        
        const missionDuration = adventurer.missionTime * 60 * 1000; // Convert minutes to milliseconds
        const hiredAdventurer = {
          ...adventurer,
          status: 'onMission',
          mission: {
            id: Date.now(),
            adventurer: hiredAdventurer,
            zone: null, // Will be set by handleAdventurerAssignment
            zoneId: null, // Will be set by handleAdventurerAssignment
            startTime: Date.now(),
            returnTime: Date.now() + missionDuration,
            successChance: 0, // Will be set by handleAdventurerAssignment
            progress: 0
          }
        };
        
        setAdventurers(prev => [...prev, hiredAdventurer]);
        console.log(`Hired ${adventurer.name} for ${adventurer.hiringCost} gold`);
      }
    }
    
    // Remove from available deck
    setTimeout(() => {
      setAdventurers(prev => prev.filter(a => a.id !== adventurer.id));
    }, 300);
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

  // Handle upgrade purchase
  const handlePurchaseUpgrade = (cost, newPurchasedUpgrades) => {
    setInventory(prev => ({ ...prev, gold: prev.gold - cost }));
    setPurchasedUpgrades(newPurchasedUpgrades);
    setUpgradeEffects(calculateUpgradeEffects(newPurchasedUpgrades));
    console.log(`Purchased upgrade for ${cost} gold`);
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
    setInventory(prev => ({
      ...prev,
      [itemName]: (prev[itemName] || 0) + quantity
    }));
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
        <header className="App-header">
          <h1>The Alchemist's Guild</h1>
          
          <div className="game-stats">
            <div className="stat">
              <span className="stat-label">Gold:</span>
              <span className="stat-value">{inventory.gold}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Reputation:</span>
              <span className="stat-value">{gameState.reputation}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Population:</span>
              <span className="stat-value">{gameState.population}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Active Missions:</span>
              <span className="stat-value">{adventurers.filter(a => a.status === 'onMission').length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Available:</span>
              <span className="stat-value">{adventurers.filter(a => a.status === 'available').length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Success Rate:</span>
              <span className="stat-value">
                {gameState.adventurerStats.totalSent > 0 
                  ? Math.round((gameState.adventurerStats.successfulMissions / gameState.adventurerStats.totalSent) * 100)
                  : 0}%
              </span>
            </div>
            <button 
              className="save-button"
              onClick={() => setSaveManagerOpen(true)}
              title="Save/Load Game"
            >
              💾
            </button>
          </div>
          
          {currentView === 'shop' && (
            <ShopScreen
              adventurers={adventurers}
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
              onCollectIncome={handleCollectIncome}
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
          
          {currentView === 'stats' && (
            <StatsScreen
              gameState={gameState}
              adventurers={adventurers}
              zones={zones}
              inventory={inventory}
              purchasedUpgrades={purchasedUpgrades}
            />
          )}
          
          {/* Inventory Sheet (only when open) */}
          {inventoryOpen && (
            <>
              <div className="inventory-overlay" onClick={toggleInventory} />
              <div className="inventory-sheet">
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
                  <div style={{ height: 32 }} /> {/* <-- Add this spacer */}
                  {/* Inventory grid below */}
                  <div className="inventory-grid">
                    {Object.entries(inventory)
                      .filter(([key]) => key !== 'gold')
                      .map(([material, amount]) => (
                        <div
                          key={material}
                          className="inventory-item"
                          style={{
                            position: 'relative',
                            cursor: amount > 0 ? 'pointer' : 'not-allowed',
                            opacity: amount > 0 ? 1 : 0.5,
                          }}
                          onClick={() => {
                            if (amount > 0 && craftingSectionRef.current) {
                              craftingSectionRef.current.fillNextSlot(material);
                            }
                          }}
                          title={amount > 0 ? `Add ${material} to crafting` : 'Out of stock'}
                        >
                          <span className="material-name">{material}</span>
                          <span className="material-amount">{amount}</span>
                        </div>
                      ))}
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