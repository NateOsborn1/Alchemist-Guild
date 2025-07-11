// src/App.js - CoreEngine Version
import React, { useState, useEffect } from 'react';
import SwipeableOrderCard from './components/SwipeableOrderCard';
import AdventurerCard from './components/AdventurerCard';
import ActiveAdventurers from './components/ActiveAdventurers';
import MarketShop from './components/MarketShop';
import ProcessingStation from './components/ProcessingStation';
import { generateRandomOrder } from './services/OrderGenerator';
import { generateAdventurer } from './services/AdventurerGenerator';
import { initialResources, canFulfillOrder, fulfillOrder } from './services/GameState';
import { craftingStations } from './services/CraftingRecipes';
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
  const [currentView, setCurrentView] = useState('orders'); // 'orders' or 'adventurers'
  
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
        </div>
        
        <div className="game-stats">
          <div className="stat">
            <span className="stat-label">Gold:</span>
            <span className="stat-value">{inventory.gold}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Accepted:</span>
            <span className="stat-value">{acceptedOrders.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Rejected:</span>
            <span className="stat-value">{rejectedOrders.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Active Missions:</span>
            <span className="stat-value">{activeAdventurers.length}</span>
          </div>
        </div>
        
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