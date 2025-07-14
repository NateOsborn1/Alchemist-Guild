// src/components/UpgradesScreen.js
import React, { useState } from 'react';
import { getUpgradeCategories, purchaseUpgrade, calculateUpgradeEffects } from '../services/UpgradeSystem';
import './UpgradesScreen.css';

const UpgradesScreen = ({ playerGold, purchasedUpgrades, onPurchaseUpgrade, upgradeEffects }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showEffects, setShowEffects] = useState(false);

  const categories = getUpgradeCategories(playerGold, purchasedUpgrades);

  const handlePurchase = (categoryId, upgradeId) => {
    const result = purchaseUpgrade(categoryId, upgradeId, playerGold, purchasedUpgrades);
    if (result.success) {
      onPurchaseUpgrade(result.cost, result.purchasedUpgrades);
    } else {
      // Could add a toast notification here
      console.log(`Purchase failed: ${result.message}`);
    }
  };

  const getEffectDescription = (key, value) => {
    const descriptions = {
      wealthyChance: `+${Math.round(value * 100)}% chance for wealthy adventurers`,
      reputationBonus: `+${value} reputation bonus`,
      experienceBonus: `+${value} experience bonus`,
      zoneReveal: 'Zones are automatically revealed',
      dangerGrowthReduction: `-${Math.round(value * 100)}% zone danger growth`,
      expeditionClear: `${value} expedition clear(s) available`,
      dangerIncrease: `+${Math.round(value * 100)}% zone danger (for better rewards)`,
      reputationLossReduction: `-${Math.round(value * 100)}% reputation loss from deaths`,
      deathGoldReward: `+${value} gold when adventurers die`,
      populationGrowth: `+${value} population`,
      populationReduction: `-${value} population`,
      populationStability: 'Population growth is stabilized',
      experienceGainBonus: `+${Math.round(value * 100)}% experience gain`,
      experienceGainPenalty: `-${Math.round(value * 100)}% experience gain`,
      reputationRequirementReduction: `-${value} reputation requirement`
    };
    return descriptions[key] || `${key}: ${value}`;
  };

  return (
    <div className="upgrades-screen">
      <div className="upgrades-header">
        <h2>Guild Upgrades</h2>
        <div className="upgrades-summary">
          <div className="gold-display">
            <span className="gold-label">Gold:</span>
            <span className="gold-amount">{playerGold}</span>
          </div>
          <button 
            className="effects-toggle"
            onClick={() => setShowEffects(!showEffects)}
          >
            {showEffects ? 'Hide' : 'Show'} Current Effects
          </button>
        </div>
      </div>

      {showEffects && (
        <div className="current-effects">
          <h3>Active Effects</h3>
          <div className="effects-grid">
            {Object.entries(upgradeEffects).map(([key, value]) => {
              if (value === 0 || value === false) return null;
              return (
                <div key={key} className="effect-item">
                  <span className="effect-description">
                    {getEffectDescription(key, value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="categories-grid">
        {categories.map(category => (
          <div key={category.id} className="category-card">
            <div className="category-header">
              <h3>{category.name}</h3>
              <div className="category-progress">
                <span className="progress-text">
                  {category.purchasedCount}/{category.totalCount}
                </span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${category.completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>
            
            <p className="category-description">{category.description}</p>
            
            <div className="upgrades-list">
              {category.upgrades.map(upgrade => (
                <div 
                  key={upgrade.id} 
                  className={`upgrade-item ${upgrade.isPurchased ? 'purchased' : ''} ${upgrade.isAvailable ? 'available' : 'unavailable'}`}
                >
                  <div className="upgrade-header">
                    <h4>{upgrade.name}</h4>
                    <div className="upgrade-cost">
                      {upgrade.isPurchased ? (
                        <span className="purchased-badge">✓ Purchased</span>
                      ) : (
                        <span className={`cost-amount ${upgrade.canAfford ? 'affordable' : 'expensive'}`}>
                          {upgrade.cost}g
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="upgrade-description">{upgrade.description}</p>
                  
                  {upgrade.effect && (
                    <div className="upgrade-effects">
                      {Object.entries(upgrade.effect).map(([key, value]) => (
                        <span key={key} className="effect-badge">
                          {getEffectDescription(key, value)}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {!upgrade.isPurchased && (
                    <button
                      className={`purchase-btn ${upgrade.isAvailable ? 'available' : 'unavailable'}`}
                      onClick={() => handlePurchase(category.id, upgrade.id)}
                      disabled={!upgrade.isAvailable}
                    >
                      {upgrade.canAfford ? 'Purchase' : 'Cannot Afford'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpgradesScreen; 