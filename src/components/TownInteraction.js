// src/components/TownInteraction.js
import React, { useState } from 'react';
import { calculateTradeSuccess, getDominantSpecialization, getRelationshipColor, getRelationshipEffects, canUpgradeTownStatus, upgradeTownStatus } from '../services/TownSystem';
import { canBuildShop, getShopBuildOptions, calculateShopIncome, calculatePendingIncome, canBuildChurch, getBuildingSlotLimits, countTownBuildings, churchType } from '../services/ShopSystem';
import './TownInteraction.css';

const TownInteraction = ({ towns, playerStats, inventory, onEstablishTrade, onUpdateTown, onBuildShop, onBuildChurch, onCollectIncome, onUpgradeTownStatus }) => {
  const [selectedTown, setSelectedTown] = useState(null);
  const [showShopBuilder, setShowShopBuilder] = useState(null);

  const handleEstablishTrade = (town) => {
    const successChance = calculateTradeSuccess(town, playerStats);
    const success = Math.random() * 100 < successChance;
    
    if (success) {
      const updatedTown = {
        ...town,
        tradeEstablished: true,
        relationship: 'neutral',
        relationshipValue: 25,
        lastUpdate: `Trade established! ${town.name} welcomes your business.`
      };
      onEstablishTrade(updatedTown, true);
    } else {
      const updatedTown = {
        ...town,
        relationshipValue: Math.max(-100, town.relationshipValue - 10),
        lastUpdate: `Trade attempt failed. ${town.name} remains suspicious of your intentions.`
      };
      onEstablishTrade(updatedTown, false);
    }
  };

  const handleBuildShop = (town, shopType) => {
    const playerSpec = getDominantSpecialization(playerStats);
    onBuildShop(town.id, shopType, playerSpec);
    setShowShopBuilder(null);
  };

  const handleBuildChurch = (town) => {
    onBuildChurch(town.id);
  };

  const handleCollectIncome = (town) => {
    const pendingIncome = calculatePendingIncome(town.playerShop);
    if (pendingIncome > 0) {
      onCollectIncome(town.id, pendingIncome);
    }
  };

  const handleUpgradeTownStatus = (town) => {
    const upgradeResult = upgradeTownStatus(town, inventory.gold);
    if (upgradeResult.success && onUpgradeTownStatus) {
      onUpgradeTownStatus(town.id, upgradeResult);
    }
  };

  const getSpecializationBadge = (specialization) => {
    const dominant = getDominantSpecialization(specialization);
    const value = specialization[dominant];
    return { type: dominant, value };
  };

  const getRelationshipStatus = (town) => {
    if (!town.tradeEstablished) return 'none';
    if (town.relationshipValue >= 60) return 'allied';
    if (town.relationshipValue >= -20) return 'neutral';
    return 'hostile';
  };

  return (
    <div className="town-interaction">
      <h2>Regional Diplomacy</h2>
      <div className="player-stats-summary">
        <div className="stat-item">
          <span>Fame: {playerStats.fame}</span>
        </div>
        <div className="stat-item">
          <span>Your Specialization: {getDominantSpecialization(playerStats)}</span>
        </div>
      </div>

      <div className="towns-grid">
        {towns.map(town => {
          const relationshipStatus = getRelationshipStatus(town);
          const relationshipColor = getRelationshipColor(relationshipStatus);
          const badge = getSpecializationBadge(town.specialization);
          const tradeSuccess = calculateTradeSuccess(town, playerStats);
          const effects = getRelationshipEffects(relationshipStatus);
          const buildCheck = canBuildShop(town, inventory.gold, playerStats);
          const churchCheck = canBuildChurch(town, inventory.gold);
          const upgradeCheck = canUpgradeTownStatus(town, inventory.gold);
          
          // Shop income calculation
          let shopIncome = 0;
          let pendingIncome = 0;
          if (town.playerShop && town.playerShop.status === 'operational') {
            shopIncome = calculateShopIncome(town.playerShop, relationshipStatus, town.specialization);
            pendingIncome = calculatePendingIncome(town.playerShop);
          }

          return (
            <div 
              key={town.id} 
              className={`town-card ${selectedTown?.id === town.id ? 'selected' : ''}`}
              onClick={() => setSelectedTown(selectedTown?.id === town.id ? null : town)}
            >
              <div className="town-header">
                <h3>{town.name}</h3>
                <div 
                  className="relationship-indicator"
                  style={{ backgroundColor: relationshipColor }}
                >
                  {relationshipStatus === 'none' ? '?' : relationshipStatus}
                </div>
              </div>

              <div className="town-info">
                <div className="town-description">{town.description}</div>
                <div className="town-stats">
                  <span className="population">Pop: {town.population.toLocaleString()}</span>
                  <span className="distance">{town.distance} days travel</span>
                </div>
                
                <div className="specialization-info">
                  <span className={`specialization-badge ${badge.type}`}>
                    {badge.type} {badge.value}%
                  </span>
                  <span className={`economic-status ${town.economicStatus}`}>
                    {town.economicStatus}
                  </span>
                </div>
                
                {/* Building Slots Information */}
                <div className="building-slots-info">
                  <div className="slots-title">Building Slots:</div>
                  <div className="slots-display">
                    <span className="slot-type">
                      Shops: {countTownBuildings(town).shops}/{getBuildingSlotLimits(town.economicStatus).shops}
                    </span>
                    <span className="slot-type">
                      Churches: {countTownBuildings(town).churches}/{getBuildingSlotLimits(town.economicStatus).churches}
                    </span>
                  </div>
                </div>

                {town.tradeEstablished && (
                  <div className="relationship-effects">
                    <div className="effects-title">Trade Benefits:</div>
                    <div className="effects-description">{effects.description}</div>
                  </div>
                )}

                {town.playerShop && (
                  <div className="shop-status">
                    <div className="shop-title">Your Shop: {town.playerShop.type}</div>
                    {town.playerShop.status === 'building' ? (
                      <div className="building-progress">
                        <span>Building... {Math.round(town.playerShop.progress || 0)}%</span>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${town.playerShop.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="shop-operational">
                        <div className="income-info">
                          <span className="income-rate">{shopIncome}g/min</span>
                          {pendingIncome > 0 && (
                            <button 
                              className="collect-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCollectIncome(town);
                              }}
                            >
                              Collect {pendingIncome}g
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="town-actions">
                {!town.tradeEstablished ? (
                  <button 
                    className="establish-trade-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEstablishTrade(town);
                    }}
                  >
                    Establish Trade ({tradeSuccess}%)
                  </button>
                ) : (
                  <div className="trade-status">
                    <span>Trade Active</span>
                    <div className="relationship-bar">
                      <div 
                        className="relationship-fill"
                        style={{ 
                          width: `${Math.max(0, (town.relationshipValue + 100) / 2)}%`,
                          backgroundColor: relationshipColor
                        }}
                      />
                    </div>
                    {buildCheck.canBuild && (
                      <button 
                        className="build-shop-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowShopBuilder(town.id);
                        }}
                      >
                        Build Shop
                      </button>
                    )}
                    {churchCheck.canBuild && (
                      <button 
                        className="build-church-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuildChurch(town);
                        }}
                      >
                        Build Church ({churchType.cost}g)
                      </button>
                    )}
                  </div>
                )}
                
                {/* Town Status Upgrade Button */}
                {upgradeCheck.canUpgrade && (
                  <button 
                    className="upgrade-town-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpgradeTownStatus(town);
                    }}
                  >
                    Donate {upgradeCheck.cost.toLocaleString()}g
                  </button>
                )}
                {!upgradeCheck.canUpgrade && upgradeCheck.reason && (
                  <div className="upgrade-status">
                    <span className="upgrade-reason">{upgradeCheck.reason}</span>
                  </div>
                )}
              </div>

              {selectedTown?.id === town.id && (
                <div className="town-details">
                  <div className="details-section">
                    <h4>Detailed Information</h4>
                    <div className="specialization-breakdown">
                      <div className="spec-bar">
                        <span>Military: {town.specialization.military}%</span>
                        <div className="bar">
                          <div 
                            className="bar-fill military" 
                            style={{ width: `${town.specialization.military}%` }}
                          />
                        </div>
                      </div>
                      <div className="spec-bar">
                        <span>Artisan: {town.specialization.artisan}%</span>
                        <div className="bar">
                          <div 
                            className="bar-fill artisan" 
                            style={{ width: `${town.specialization.artisan}%` }}
                          />
                        </div>
                      </div>
                      <div className="spec-bar">
                        <span>Merchant: {town.specialization.merchant}%</span>
                        <div className="bar">
                          <div 
                            className="bar-fill merchant" 
                            style={{ width: `${town.specialization.merchant}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="last-update">
                      <strong>Latest Intel:</strong> {town.lastUpdate}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showShopBuilder && (
        <div className="shop-builder-modal">
          <div className="modal-overlay" onClick={() => setShowShopBuilder(null)} />
          <div className="modal-content">
            <h3>Build Shop in {towns.find(t => t.id === showShopBuilder)?.name}</h3>
            <div className="shop-options">
              {getShopBuildOptions(towns.find(t => t.id === showShopBuilder), playerStats, inventory.gold).map(option => (
                <div key={option.type} className={`shop-option ${option.available ? 'available' : 'unavailable'}`}>
                  <div className="option-header">
                    <h4>{option.name}</h4>
                    <span className="cost">{option.cost}g</span>
                  </div>
                  <div className="option-description">{option.description}</div>
                  <div className="option-stats">
                    <span>Build Time: {Math.floor(option.buildTime / 60)}min</span>
                    <span>Income: {option.baseIncome.neutral}-{option.baseIncome.allied}g/min</span>
                  </div>
                  {!option.available && option.requirementText && (
                    <div className="requirement-text">{option.requirementText}</div>
                  )}
                  <button 
                    className="build-option-btn"
                    disabled={!option.available}
                    onClick={() => handleBuildShop(towns.find(t => t.id === showShopBuilder), option.type)}
                  >
                    {option.available ? 'Build' : 'Cannot Build'}
                  </button>
                </div>
              ))}
            </div>
            <button className="close-modal" onClick={() => setShowShopBuilder(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TownInteraction;