// src/App.js
import React, { useState, useEffect } from 'react';
import SwipeableOrderCard from './components/SwipeableOrderCard';
import AdventurerCard from './components/AdventurerCard';
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

function App() {
  const [orders, setOrders] = useState([]);
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [rejectedOrders, setRejectedOrders] = useState([]);
  const [nextOrderId, setNextOrderId] = useState(1);
  const [inventory, setInventory] = useState(initialResources);
  
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

  const handleSwipe = (order, action) => {
    console.log(`${action.toUpperCase()}: ${order.customerName} - ${order.itemName}`);
    
    if (action === 'accept') {
      // Try to fulfill the order immediately
      const result = fulfillOrder(inventory, order);
      
      if (result.success) {
        // Update inventory with consumed materials and gained gold
        setInventory(result.newInventory);
        setAcceptedOrders(prev => [...prev, { ...order, fulfilled: true, profit: result.profit }]);
        
        // Update player stats based on order type
        setPlayerStats(prev => ({
          ...prev,
          fame: prev.fame + 1,
          // Increment specialization based on item type
          military: order.itemName.includes('Sword') || order.itemName.includes('Dagger') || order.itemName.includes('Armor') ? 
                   prev.military + 1 : prev.military,
          artisan: order.itemName.includes('Potion') || order.itemName.includes('Scroll') || order.itemName.includes('Staff') ? 
                  prev.artisan + 1 : prev.artisan,
          merchant: order.itemName.includes('Ring') ? prev.merchant + 1 : prev.merchant
        }));
        
        console.log(`✅ Order fulfilled! Gained ${result.profit} gold`);
      } else {
        // Accept but can't fulfill - keep original inventory, add penalty
        setAcceptedOrders(prev => [...prev, { ...order, fulfilled: false, reason: result.reason }]);
        console.log(`❌ Can't fulfill: ${result.reason}`);
      }
    } else {
      setRejectedOrders(prev => [...prev, order]);
    }
    
    // Remove the order from the main deck after a delay
    setTimeout(() => {
      setOrders(prev => prev.filter(o => o.id !== order.id));
    }, 300);
  };

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

  return (
    <div className="App">
      <header className="App-header">
        <h1>The Alchemist's Guild</h1>
        
        <div className="view-switcher">
          <button 
            className={currentView === 'orders' ? 'active' : ''}
            onClick={() => setCurrentView('orders')}
          >
            Customer Orders
          </button>
          <button 
            className={currentView === 'adventurers' ? 'active' : ''}
            onClick={() => setCurrentView('adventurers')}
          >
            Hire Adventurers
          </button>
          <button 
            className={currentView === 'towns' ? 'active' : ''}
            onClick={() => setCurrentView('towns')}
          >
            Town Diplomacy
          </button>
        </div>
        
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
                        onSwipe={handleSwipe}
                        inventory={inventory}
                        key={orders[0].id}
                      />
                    ) : (
                      <div className="no-cards">
                        <h3>No more orders!</h3>
                        <p>Check back later for new opportunities.</p>
                      </div>
                    )}
                  </>
                )}
                
                {currentView === 'adventurers' && (
                  <>
                    <p>Swipe Right to Hire • Swipe Left to Pass</p>
                    {availableAdventurers.length > 0 ? (
                      <AdventurerCard 
                        adventurer={availableAdventurers[0]}
                        onSwipe={handleAdventurerSwipe}
                        canAfford={inventory.gold >= availableAdventurers[0].hiringCost}
                        key={availableAdventurers[0].id}
                      />
                    ) : (
                      <div className="no-cards">
                        <h3>No more adventurers!</h3>
                        <p>Check back later for new recruits.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="right-panel">
              <div className="processing-stations">
                {Object.entries(craftingStations).map(([stationId, station]) => (
                  <ProcessingStation
                    key={stationId}
                    stationType={station.name}
                    recipes={station.recipes}
                    inventory={inventory}
                    onStartCrafting={handleStartCrafting}
                    onCompleteCrafting={handleCompleteCrafting}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="inventory-display">
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