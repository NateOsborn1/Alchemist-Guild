// src/components/MarketShop.js
import React from 'react';
import './MarketShop.css';

const materialPrices = {
  iron: { price: 5, stock: 20 },
  steel: { price: 8, stock: 15 },
  wood: { price: 3, stock: 25 },
  leather: { price: 6, stock: 18 },
  herbs: { price: 4, stock: 22 },
  crystal: { price: 15, stock: 8 },
  oil: { price: 7, stock: 12 },
  parchment: { price: 5, stock: 16 },
  ember: { price: 12, stock: 6 },
  silver: { price: 25, stock: 4 },
  gems: { price: 30, stock: 3 },
  thread: { price: 2, stock: 30 }
};

const MarketShop = ({ inventory, shopStock, onBuyMaterial }) => {
  const handleBuy = (material, cost) => {
    const available = shopStock[material] || 0;
    if (inventory.gold >= cost && available > 0) {
      onBuyMaterial(material, cost);
    }
  };

  return (
    <div className="market-shop">
      <h4>Material Market</h4>
      <div className="shop-grid">
        {Object.entries(materialPrices).map(([material, data]) => {
          const available = shopStock[material] || 0;
          const canAfford = inventory.gold >= data.price;
          const canBuy = canAfford && available > 0;
          const currentAmount = inventory[material] || 0;
          
          return (
            <div key={material} className="shop-item">
              <div className="item-info">
                <span className="item-name">{material}</span>
                <span className="item-stock">You: {currentAmount}</span>
                <span className="shop-stock">Shop: {available}</span>
              </div>
              <button 
                className={`buy-button ${canBuy ? 'affordable' : 'unavailable'}`}
                onClick={() => handleBuy(material, data.price)}
                disabled={!canBuy}
              >
                {data.price}g
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketShop;