// src/components/StatsScreen.js
import React, { useState } from 'react';
import './StatsScreen.css';

const StatsScreen = ({ gameState, adventurers, zones, inventory, purchasedUpgrades }) => {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Calculate various statistics
  const totalAdventurers = adventurers.length;
  const availableAdventurers = adventurers.filter(a => a.status === 'available').length;
  const onMissionAdventurers = adventurers.filter(a => a.status === 'onMission').length;
  const assignedAdventurers = adventurers.filter(a => a.status === 'assigned').length;

  const totalMissions = gameState.adventurerStats.totalSent;
  const successfulMissions = gameState.adventurerStats.successfulMissions;
  const failedMissions = gameState.adventurerStats.deaths;
  const successRate = totalMissions > 0 ? Math.round((successfulMissions / totalMissions) * 100) : 0;

  const totalGoldEarned = gameState.totalGoldEarned;
  const currentGold = inventory.gold;
  const totalReputationGained = gameState.totalReputationGained;
  const totalReputationLost = gameState.totalReputationLost;

  const zonesRevealed = zones.filter(z => z.isRevealed).length;
  const totalZoneClears = gameState.zoneStats.totalClears;
  const totalZoneDeaths = gameState.zoneStats.totalDeaths;

  const upgradesPurchased = Object.values(purchasedUpgrades).reduce((total, category) => {
    return total + Object.values(category).filter(upgrade => upgrade.purchased).length;
  }, 0);

  const totalUpgrades = Object.values(purchasedUpgrades).reduce((total, category) => {
    return total + Object.values(category).length;
  }, 0);

  const renderOverview = () => (
    <div className="stats-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Adventurers</h3>
          <div className="stat-value">{totalAdventurers}</div>
          <div className="stat-breakdown">
            <span>Available: {availableAdventurers}</span>
            <span>On Mission: {onMissionAdventurers}</span>
            <span>Assigned: {assignedAdventurers}</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>Missions</h3>
          <div className="stat-value">{totalMissions}</div>
          <div className="stat-breakdown">
            <span className="success">Success: {successfulMissions}</span>
            <span className="failure">Deaths: {failedMissions}</span>
            <span>Rate: {successRate}%</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>Economy</h3>
          <div className="stat-value">{currentGold}g</div>
          <div className="stat-breakdown">
            <span>Total Earned: {totalGoldEarned}g</span>
            <span>Reputation: {gameState.reputation}</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>Zones</h3>
          <div className="stat-value">{zonesRevealed}/{zones.length}</div>
          <div className="stat-breakdown">
            <span>Clears: {totalZoneClears}</span>
            <span>Deaths: {totalZoneDeaths}</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>Upgrades</h3>
          <div className="stat-value">{upgradesPurchased}/{totalUpgrades}</div>
          <div className="stat-breakdown">
            <span>Progress: {Math.round((upgradesPurchased / totalUpgrades) * 100)}%</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>Population</h3>
          <div className="stat-value">{gameState.population}</div>
          <div className="stat-breakdown">
            <span>Current Event: {gameState.seasonalEvent}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMissions = () => (
    <div className="stats-missions">
      <h3>Mission History</h3>
      <div className="mission-stats">
        <div className="mission-chart">
          <div className="chart-bar">
            <div className="chart-label">Success Rate</div>
            <div className="chart-bar-container">
              <div 
                className="chart-bar-fill success" 
                style={{ width: `${successRate}%` }}
              />
              <span className="chart-value">{successRate}%</span>
            </div>
          </div>
          
          <div className="chart-bar">
            <div className="chart-label">Death Rate</div>
            <div className="chart-bar-container">
              <div 
                className="chart-bar-fill failure" 
                style={{ width: `${totalMissions > 0 ? Math.round((failedMissions / totalMissions) * 100) : 0}%` }}
              />
              <span className="chart-value">
                {totalMissions > 0 ? Math.round((failedMissions / totalMissions) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="mission-details">
          <div className="detail-item">
            <span className="detail-label">Total Missions:</span>
            <span className="detail-value">{totalMissions}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Successful:</span>
            <span className="detail-value success">{successfulMissions}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Deaths:</span>
            <span className="detail-value failure">{failedMissions}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Gear Collected:</span>
            <span className="detail-value">{gameState.adventurerStats.gearCollected}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderZones = () => (
    <div className="stats-zones">
      <h3>Zone Progress</h3>
      <div className="zones-list">
        {zones.map(zone => (
          <div key={zone.id} className="zone-stat-card">
            <div className="zone-header">
              <h4>{zone.name}</h4>
              <span className={`zone-status ${zone.status}`}>{zone.status}</span>
            </div>
            
            <div className="zone-details">
              <div className="zone-progress">
                <span>Danger: {zone.dangerLevel}/{zone.maxDanger}</span>
                <div className="danger-bar">
                  <div 
                    className="danger-fill" 
                    style={{ 
                      width: `${(zone.dangerLevel / zone.maxDanger) * 100}%`,
                      backgroundColor: zone.dangerLevel > zone.maxDanger * 0.8 ? '#ff6b6b' : 
                                     zone.dangerLevel > zone.maxDanger * 0.6 ? '#ffa500' : '#4ecdc4'
                    }}
                  />
                </div>
              </div>
              
              <div className="zone-stats">
                <span>Clears: {zone.totalClears}</span>
                <span>Deaths: {zone.totalDeaths}</span>
                <span>Revealed: {zone.isRevealed ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReputation = () => (
    <div className="stats-reputation">
      <h3>Reputation History</h3>
      <div className="reputation-summary">
        <div className="reputation-current">
          <span className="current-label">Current Reputation:</span>
          <span className="current-value">{gameState.reputation}</span>
        </div>
        
        <div className="reputation-breakdown">
          <div className="breakdown-item">
            <span className="breakdown-label">Total Gained:</span>
            <span className="breakdown-value positive">+{totalReputationGained}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Total Lost:</span>
            <span className="breakdown-value negative">-{totalReputationLost}</span>
          </div>
        </div>
      </div>

      <div className="reputation-history">
        <h4>Recent History</h4>
        <div className="history-list">
          {gameState.reputationHistory.slice(-10).reverse().map((entry, index) => (
            <div key={index} className="history-item">
              <span className="history-day">Day {entry.day}</span>
              <span className="history-value">{entry.value}</span>
              <span className="history-event">{entry.event}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUpgrades = () => (
    <div className="stats-upgrades">
      <h3>Upgrade Progress</h3>
      <div className="upgrades-summary">
        <div className="upgrade-progress">
          <span>Overall Progress: {upgradesPurchased}/{totalUpgrades}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${Math.round((upgradesPurchased / totalUpgrades) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="upgrades-categories">
        {Object.entries(purchasedUpgrades).map(([categoryId, category]) => {
          const purchasedCount = Object.values(category).filter(upgrade => upgrade.purchased).length;
          const totalCount = Object.values(category).length;
          const percentage = Math.round((purchasedCount / totalCount) * 100);
          
          return (
            <div key={categoryId} className="upgrade-category">
              <div className="category-header">
                <h4>{categoryId.replace(/_/g, ' ').toUpperCase()}</h4>
                <span className="category-progress">{purchasedCount}/{totalCount}</span>
              </div>
              <div className="category-bar">
                <div 
                  className="category-fill" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="stats-screen">
      <div className="stats-header">
        <h2>Guild Statistics</h2>
        <div className="stats-tabs">
          <button 
            className={`tab-button ${selectedTab === 'overview' ? 'active' : ''}`}
            onClick={() => setSelectedTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-button ${selectedTab === 'missions' ? 'active' : ''}`}
            onClick={() => setSelectedTab('missions')}
          >
            Missions
          </button>
          <button 
            className={`tab-button ${selectedTab === 'zones' ? 'active' : ''}`}
            onClick={() => setSelectedTab('zones')}
          >
            Zones
          </button>
          <button 
            className={`tab-button ${selectedTab === 'reputation' ? 'active' : ''}`}
            onClick={() => setSelectedTab('reputation')}
          >
            Reputation
          </button>
          <button 
            className={`tab-button ${selectedTab === 'upgrades' ? 'active' : ''}`}
            onClick={() => setSelectedTab('upgrades')}
          >
            Upgrades
          </button>
        </div>
      </div>

      <div className="stats-content">
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'missions' && renderMissions()}
        {selectedTab === 'zones' && renderZones()}
        {selectedTab === 'reputation' && renderReputation()}
        {selectedTab === 'upgrades' && renderUpgrades()}
      </div>
    </div>
  );
};

export default StatsScreen;
