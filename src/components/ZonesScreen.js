// src/components/ZonesScreen.js
import React, { useState, useEffect } from 'react';
import './ZonesScreen.css';

// Component for displaying active missions
const ActiveMissionCard = ({ adventurer }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  const { mission } = adventurer;
  if (!mission) return null;

  // Calculate progress and time remaining
  const totalTime = mission.returnTime - mission.startTime;
  const elapsed = Math.max(0, currentTime - mission.startTime);
  const progress = Math.min(100, Math.round((elapsed / totalTime) * 100));
  const timeLeft = Math.max(0, Math.ceil((mission.returnTime - currentTime) / 1000)); // in seconds

  // Format time left
  const formatTime = (seconds) => {
    if (seconds <= 0) return 'Complete!';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Get rank color
  const getRankColor = (rank) => {
    const colors = {
      S: '#ff6b6b',
      A: '#f59e0b',
      B: '#10b981',
      C: '#6b7280',
      D: '#475569',
      F: '#374151'
    };
    return colors[rank] || '#6b7280';
  };

  return (
    <div className="mission-card">
      <div className="mission-header">
        <span className="adventurer-name">{adventurer.name}</span>
        <span className={`class-badge ${adventurer.class.toLowerCase()}`}>
          {adventurer.class}
        </span>
      </div>
      
      <div className="mission-stats">
        <div className="stat-item">
          <span className="stat-label">Success:</span>
          <span className="stat-value success-rate">{mission.successChance || 0}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Time:</span>
          <span className="stat-value time-left">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {adventurer.lootTable && adventurer.lootTable.length > 0 && (
        <div className="loot-preview">
          <span className="loot-label">Expected loot:</span>
          <div className="loot-items">
            {adventurer.lootTable.slice(0, 2).map((item, index) => (
              <span key={index} className="loot-item">
                {item.min}-{item.max}x {item.material}
              </span>
            ))}
            {adventurer.lootTable.length > 2 && (
              <span className="loot-more">+{adventurer.lootTable.length - 2} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main ZonesScreen component
const ZonesScreen = ({ zones, adventurers }) => {
  const [expandedZones, setExpandedZones] = useState({});

  const toggleZone = (zoneId) => {
    setExpandedZones(prev => ({
      ...prev,
      [zoneId]: !prev[zoneId]
    }));
  };

  // Get danger level color
  const getDangerColor = (dangerLevel, maxDanger) => {
    const ratio = dangerLevel / maxDanger;
    if (ratio >= 0.8) return '#ff6b6b'; // High danger - red
    if (ratio >= 0.5) return '#f59e0b'; // Medium danger - orange
    return '#10b981'; // Low danger - green
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'dangerous': return '#f59e0b';
      case 'overrun': return '#ff6b6b';
      case 'cleared': return '#6b7280';
      default: return '#ffd700';
    }
  };

  return (
    <div className="zones-screen">
      <h2 className="screen-title">Zone Overview</h2>
      
      <div className="zones-container">
        {zones.map(zone => {
          // Get adventurers on missions in this zone
          const activeMissions = adventurers.filter(
            a => a.status === 'onMission' && a.zoneId === zone.id
          );
          const isExpanded = expandedZones[zone.id] || false;

          return (
            <div key={zone.id} className="zone-card">
              <div 
                className="zone-header"
                onClick={() => toggleZone(zone.id)}
              >
                <div className="zone-title-row">
                  <h3 className="zone-name">{zone.name}</h3>
                  <span className="expand-icon">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </div>
                
                <div className="zone-quick-stats">
                  <span 
                    className="zone-status"
                    style={{ color: getStatusColor(zone.status) }}
                  >
                    {zone.status}
                  </span>
                  <span className="mission-count">
                    {activeMissions.length} active
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="zone-details">
                  <p className="zone-description">{zone.description}</p>
                  
                  <div className="zone-stats">
                    <div className="stat-row">
                      <span className="stat-label">Danger Level:</span>
                      <div className="danger-display">
                        <span 
                          className="danger-value"
                          style={{ color: getDangerColor(zone.dangerLevel, zone.maxDanger) }}
                        >
                          {zone.dangerLevel.toFixed(1)}
                        </span>
                        <span className="danger-max">/ {zone.maxDanger}</span>
                        <div className="danger-bar">
                          <div 
                            className="danger-fill"
                            style={{ 
                              width: `${(zone.dangerLevel / zone.maxDanger) * 100}%`,
                              backgroundColor: getDangerColor(zone.dangerLevel, zone.maxDanger)
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {zone.monsterTypes && zone.monsterTypes.length > 0 && (
                      <div className="stat-row">
                        <span className="stat-label">Monsters:</span>
                        <div className="monster-list">
                          {zone.monsterTypes.map((monster, index) => (
                            <span key={index} className="monster-type">
                              {monster}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {zone.lootMultiplier && zone.lootMultiplier !== 1 && (
                      <div className="stat-row">
                        <span className="stat-label">Loot Bonus:</span>
                        <span className="bonus-value">
                          {Math.round((zone.lootMultiplier - 1) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="missions-section">
                    <h4 className="section-title">Active Missions</h4>
                    {activeMissions.length === 0 ? (
                      <p className="no-missions">No active missions in this zone</p>
                    ) : (
                      <div className="missions-grid">
                        {activeMissions.map(adventurer => (
                          <ActiveMissionCard 
                            key={adventurer.id} 
                            adventurer={adventurer} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ZonesScreen;