// src/App.js
import React, { useState, useEffect } from 'react';
import SwipeableOrderCard from './components/SwipeableOrderCard';
import AdventurerCard from './components/AdventurerCard';
import AdventurerCustomerCard from './components/AdventurerCustomerCard'; // NEW
import QueuedOrderCard from './components/QueuedOrderCard'; // NEW
import ActiveAdventurers from './components/ActiveAdventurers';
import MarketShop from './components/MarketShop';
import ProcessingStation from './components/ProcessingStation';
import TownInteraction from './components/TownInteraction';
import { generateRandomOrder } from './services/OrderGenerator';
import { generateAdventurer } from './services/AdventurerGenerator';
import { initialResources, canFulfillOrder, fulfillOrder } from './services/GameState';
import { craftingStations } from './services/CraftingRecipes';
import { generateInitialTowns } from './services/TownSystem';
import { startShopConstruction, completeShopConstruction, calculateShopIncome, shopTypes } from './services/ShopSystem';
import './App.css';
import { generateAdventurerCustomer } from './services/AdventurerCustomerGenerator';
import AnimatedCraftingStation from './components/AnimatedCraftingStation';
import { calculateCraftingAttributes } from './services/MaterialAttributes';

function App() {
  const [orders, setOrders] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [rejectedOrders, setRejectedOrders] = useState([]);
  const [nextOrderId, setNextOrderId] = useState(1);
  const [inventory, setInventory] = useState(initialResources);
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  
  // Adventurer system
  const [availableAdventurers, setAvailableAdventurers] = useState([]);
  const [activeAdventurers, setActiveAdventurers] = useState([]);
  const [nextAdventurerId, setNextAdventurerId] = useState(1);
  const [currentView, setCurrentView] = useState('orders'); // 'orders', 'adventurers', 'towns'
  
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
  
  // Shop stock
  const [shopStock, setShopStock] = useState({
    iron: 20, steel: 15, wood: 25, leather: 18, herbs: 22, crystal: 8,
    oil: 12, parchment: 16, ember: 6, silver: 4, gems: 3, thread: 30
  });

  // NEW: Order queue system
  const [orderQueue, setOrderQueue] = useState([]); // Max 3 slots
  const [orderDeadlines, setOrderDeadlines] = useState({}); // Track deadlines
  const [reputation, setReputation] = useState(50); // Start at 50
  
  // NEW: Adventurer customers system
  const [adventurerCustomers, setAdventurerCustomers] = useState([]);
  
  // Add these new state variables after your existing state
  const [dailyOrdersAccepted, setDailyOrdersAccepted] = useState(0);
  const [lastOrderReset, setLastOrderReset] = useState(Date.now());

  // Generate initial orders when component mounts
  useEffect(() => {
    const initialOrders = [];
    for (let i = 1; i <= 3; i++) {
      initialOrders.push(generateRandomOrder(i));
    }
    setOrders(initialOrders);
    setNextOrderId(4);
  }, []);

  // Generate initial towns
  useEffect(() => {
    setTowns(generateInitialTowns());
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
      initialAdventurers.push(generateAdventurer(i));
    }
    setAvailableAdventurers(initialAdventurers);
    setNextAdventurerId(4);
  }, []);

  // Add new order when deck gets low
  useEffect(() => {
    if (orders.length < 2) {
      const newOrder = generateRandomOrder(nextOrderId);
      setOrders(prev => [...prev, newOrder]);
      setNextOrderId(prev => prev + 1);
    }
  }, [orders.length, nextOrderId]);

  // Add new adventurer when deck gets low
  useEffect(() => {
    if (currentView === 'adventurers' && availableAdventurers.length < 2) {
      const newAdventurer = generateAdventurer(nextAdventurerId);
      setAvailableAdventurers(prev => [...prev, newAdventurer]);
      setNextAdventurerId(prev => prev + 1);
    }
  }, [availableAdventurers.length, nextAdventurerId, currentView]);

  // Add this useEffect to reset daily orders every 24 hours
  useEffect(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (now - lastOrderReset >= oneDay) {
      setDailyOrdersAccepted(0);
      setLastOrderReset(now);
      console.log('🔄 Daily order limit reset!');
    }
  }, [lastOrderReset]);

  // Update the handleOrderSwipe function
  const handleOrderSwipe = (order, action) => {
    if (action === 'accept') {
      // Check daily limit first
      if (dailyOrdersAccepted >= 3) {
        console.log('❌ Daily order limit reached! Come back tomorrow.');
        // Don't remove the order from deck, just return
        return;
      }
      
      if (orderQueue.length < 3) {
        // Add to queue with deadline
        const deadline = Date.now() + (order.deadlineHours * 60 * 60 * 1000);
        const queuedOrder = {
          ...order,
          queueTime: Date.now(),
          deadline: deadline,
          status: 'queued'
        };
        
        setOrderQueue(prev => [...prev, queuedOrder]);
        setOrderDeadlines(prev => ({
          ...prev,
          [order.id]: deadline
        }));
        
        // Increment daily counter
        setDailyOrdersAccepted(prev => prev + 1);
        
        console.log(`Order queued: ${order.customerName} - ${order.itemName} (${dailyOrdersAccepted + 1}/3 today)`);
      } else {
        console.log('Order queue is full!');
      }
    } else {
      setRejectedOrders(prev => [...prev, order]);
    }
    
    // Remove from main deck
    setTimeout(() => {
      setOrders(prev => prev.filter(o => o.id !== order.id));
    }, 300);
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
          startTime: Date.now(),
          returnTime: Date.now() + missionDuration,
          progress: 0
        };
        
        setActiveAdventurers(prev => [...prev, hiredAdventurer]);
        console.log(`Hired ${adventurer.name} for ${adventurer.hiringCost} gold`);
      }
    }
    
    // Remove from available deck
    setTimeout(() => {
      setAvailableAdventurers(prev => prev.filter(a => a.id !== adventurer.id));
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

  // Generate new adventurer customers when deck gets low
  useEffect(() => {
    if (currentView === 'adventurers' && adventurerCustomers.length < 2) {
      const newCustomer = generateAdventurerCustomer(nextOrderId);
      setAdventurerCustomers(prev => [...prev, newCustomer]);
      setNextOrderId(prev => prev + 1);
    }
  }, [adventurerCustomers.length, currentView, nextOrderId]);

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
    
    setActiveAdventurers(prev => [...prev, customerAdventurer]);
    
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

  const handleCraft = (materials) => {
    // Calculate the crafted item based on attributes
    const attributes = calculateCraftingAttributes(materials);
    
    // Simple crafting logic - you can expand this
    let craftedItem = 'Basic Component';
    let quality = 'Common';
    
    if (attributes.total > 20) {
      craftedItem = 'Advanced Component';
      quality = 'Uncommon';
    }
    if (attributes.total > 40) {
      craftedItem = 'Masterwork Component';
      quality = 'Rare';
    }
    
    // Consume materials
    setInventory(prev => {
      const newInventory = { ...prev };
      materials.forEach(({ name, amount }) => {
        newInventory[name] -= amount;
      });
      return newInventory;
    });
    
    // Add crafted item
    setInventory(prev => ({
      ...prev,
      [craftedItem]: (prev[craftedItem] || 0) + 1
    }));
    
    console.log(`Crafted ${quality} ${craftedItem}!`, attributes);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>The Alchemist's Guild</h1>
        
        <div className="game-stats">
          <div className="stat">
            <span className="stat-label">Gold:</span>
            <span className="stat-value">{inventory.gold}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Fame:</span>
            <span className="stat-value">{playerStats.fame}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Reputation:</span>
            <span className="stat-value">{reputation}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Daily:</span>
            <span className={`stat-value ${dailyOrdersAccepted >= 3 ? 'limit-reached' : ''}`}>
              {dailyOrdersAccepted}/3
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Queue:</span>
            <span className="stat-value">{orderQueue.length}/3</span>
          </div>
          <div className="stat">
            <span className="stat-label">Accepted:</span>
            <span className="stat-value">{acceptedOrders.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Active Missions:</span>
            <span className="stat-value">{activeAdventurers.length}</span>
          </div>
        </div>
        
        {currentView === 'towns' ? (
          <TownInteraction 
            towns={towns}
            playerStats={playerStats}
            inventory={inventory}
            onEstablishTrade={handleEstablishTrade}
            onUpdateTown={(town) => setTowns(prev => prev.map(t => t.id === town.id ? town : t))}
            onBuildShop={handleBuildShop}
            onCollectIncome={handleCollectIncome}
          />
        ) : (
          <div className="main-content">
            <div className="left-panel">
              <MarketShop 
                inventory={inventory}
                shopStock={shopStock}
                onBuyMaterial={handleBuyMaterial}
              />
              
              <ActiveAdventurers 
                activeAdventurers={activeAdventurers}
                onMissionComplete={handleMissionComplete}
              />
            </div>
            
            <div className="center-panel">
              <div className="card-area">
                {currentView === 'orders' && (
                  <>
                    <p>Swipe Right to Accept • Swipe Left to Reject</p>
                    {orders.length > 0 ? (
                      <SwipeableOrderCard 
                        order={orders[0]} 
                        onSwipe={handleOrderSwipe}
                        inventory={inventory}
                        dailyLimitReached={dailyOrdersAccepted >= 3} // NEW
                        key={orders[0].id}
                      />
                    ) : (
                      <div className="no-cards">
                        <h3>{dailyOrdersAccepted >= 3 ? 'Daily Limit Reached!' : 'No more orders!'}</h3>
                        <p>{dailyOrdersAccepted >= 3 ? 'Come back tomorrow for new opportunities.' : 'Check back later for new opportunities.'}</p>
                      </div>
                    )}
                  </>
                )}
                
                {currentView === 'adventurers' && (
                  <>
                    <p>Swipe Right to Sell Gear • Swipe Left to Pass</p>
                    {adventurerCustomers.length > 0 ? (
                      <AdventurerCustomerCard 
                        customer={adventurerCustomers[0]}
                        onSwipe={handleAdventurerCustomerSwipe}
                        inventory={inventory}
                        key={adventurerCustomers[0].id}
                      />
                    ) : (
                      <div className="no-cards">
                        <h3>No customers!</h3>
                        <p>Build your reputation to attract more adventurers.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* NEW: Order Queue Display */}
              {currentView === 'orders' && (
                <div className="order-queue">
                  <h4>Active Orders ({orderQueue.length}/3)</h4>
                  <div className="queue-slots">
                    {[0, 1, 2].map(slotIndex => {
                      const order = orderQueue[slotIndex];
                      return (
                        <div key={slotIndex} className={`queue-slot ${order ? 'filled' : 'empty'}`}>
                          {order ? (
                            <QueuedOrderCard 
                              order={order}
                              onSwipe={handleQueuedOrderSwipe}
                              onComplete={handleOrderComplete} // NEW
                              inventory={inventory} // NEW
                              key={order.id}
                            />
                          ) : (
                            <div className="empty-slot">
                              <span>Empty</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {/* Remove crafting stations from right panel */}
            <div className="right-panel">
              {/* Crafting station is now only in the inventory sheet */}
            </div>
          </div>
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
                <AnimatedCraftingStation
                  inventory={inventory}
                  onCraft={handleCraft}
                />
                <div className="inventory-grid">
                  {Object.entries(inventory).filter(([key]) => key !== 'gold').map(([material, amount]) => (
                    <div key={material} className="inventory-item">
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
            className={`nav-button inventory-nav${inventoryOpen ? ' active' : ''}`}
            onClick={toggleInventory}
            aria-label="Inventory"
          >
            <img src="/inventory-icon.svg" alt="" className="inventory-icon" />
          </button>
          <button
            className={`nav-button${currentView === 'orders' ? ' active' : ''}`}
            onClick={() => setCurrentView('orders')}
          >
            Orders
          </button>
          <button
            className={`nav-button${currentView === 'adventurers' ? ' active' : ''}`}
            onClick={() => setCurrentView('adventurers')}
          >
            Adventurers
          </button>
          <button
            className={`nav-button${currentView === 'team' ? ' active' : ''}`}
            onClick={() => setCurrentView('team')}
          >
            Team
          </button>
          <button
            className={`nav-button${currentView === 'news' ? ' active' : ''}`}
            onClick={() => setCurrentView('news')}
          >
            News
          </button>
        </div>
        
        {/* Inventory Toggle Button */}
        {/* This button is now outside the inventory sheet */}
        
        {/* Mobile Inventory Sheet */}
        {/* This is now handled by the JSX structure */}
        
        {/* Desktop Inventory Display (hidden on mobile) */}
        <div className="inventory-display desktop-only">
          <h4>Inventory</h4>
          <div className="inventory-grid">
            {Object.entries(inventory).filter(([key]) => key !== 'gold').map(([material, amount]) => (
              <div key={material} className="inventory-item">
                <span className="material-name">{material}</span>
                <span className="material-amount">{amount}</span>
              </div>
            ))}
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;