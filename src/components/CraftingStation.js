// src/components/CraftingStation.js
import React, { useState } from 'react';
import CraftingPolygon from './CraftingPolygon';
import { calculateCraftingAttributes, materialAttributes } from '../services/MaterialAttributes';
import './CraftingStation.css';

const CraftingStation = ({ inventory, onCraft }) => {
  const [craftingQueue, setCraftingQueue] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const addToCraftingQueue = (materialName, amount = 1) => {
    setCraftingQueue(prev => {
      const existing = prev.find(item => item.name === materialName);
      if (existing) {
        return prev.map(item => 
          item.name === materialName 
            ? { ...item, amount: item.amount + amount }
            : item
        );
      } else {
        return [...prev, { name: materialName, amount }];
      }
    });
  };
  
  const removeFromCraftingQueue = (materialName) => {
    setCraftingQueue(prev => prev.filter(item => item.name !== materialName));
  };
  
  const clearCraftingQueue = () => {
    setCraftingQueue([]);
  };
  
  const handleCraft = () => {
    if (craftingQueue.length === 0) return;
    
    // Check if we have all materials
    const canCraft = craftingQueue.every(item => 
      (inventory[item.name] || 0) >= item.amount
    );
    
    if (canCraft) {
      onCraft(craftingQueue);
      clearCraftingQueue();
    }
  };
  
  const attributes = calculateCraftingAttributes(craftingQueue);
  const canCraft = craftingQueue.length > 0 && 
    craftingQueue.every(item => (inventory[item.name] || 0) >= item.amount);
  
  return (
    <div className="crafting-station">
      <h3>Crafting Station</h3>
      
      {/* Anvil Button */}
      <div className="anvil-section">
        <button 
          className="anvil-button"
          onClick={handleCraft}
          disabled={!canCraft}
        >
          <img src="/anvil-icon.svg" alt="Anvil" className="anvil-icon" />
          <span>Craft</span>
        </button>
      </div>
      
      {/* Crafting Polygon */}
      {craftingQueue.length > 0 && (
        <CraftingPolygon attributes={attributes} />
      )}
      
      {/* Crafting Queue */}
      <div className="crafting-queue">
        <h4>Materials ({craftingQueue.length})</h4>
        <div className="queue-items">
          {craftingQueue.map((item, index) => (
            <div key={index} className="queue-item">
              <span className="material-name">{item.name}</span>
              <span className="material-amount">x{item.amount}</span>
              <button 
                className="remove-btn"
                onClick={() => removeFromCraftingQueue(item.name)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {craftingQueue.length > 0 && (
          <button className="clear-btn" onClick={clearCraftingQueue}>
            Clear All
          </button>
        )}
      </div>
      
      {/* Material Grid for Dragging */}
      <div className="material-grid">
        <h4>Drag Materials to Anvil</h4>
        <div className="materials-container">
          {Object.entries(inventory)
            .filter(([key]) => key !== 'gold' && materialAttributes[key])
            .map(([material, amount]) => (
              <div 
                key={material}
                className="material-item"
                draggable={amount > 0}
                onDragStart={(e) => {
                  if (amount > 0) {
                    e.dataTransfer.setData('material', material);
                    setIsDragging(true);
                  }
                }}
                onDragEnd={() => setIsDragging(false)}
                onClick={() => amount > 0 && addToCraftingQueue(material, 1)}
              >
                <span className="material-name">{material}</span>
                <span className="material-amount">{amount}</span>
                <div className="material-attributes">
                  <span className="attr strength">S: {materialAttributes[material]?.strength}</span>
                  <span className="attr speed">Sp: {materialAttributes[material]?.speed}</span>
                  <span className="attr magical">M: {materialAttributes[material]?.magical}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CraftingStation; 