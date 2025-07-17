// src/components/AdventurerCard.js
import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import './AdventurerCard.css';

const AdventurerCard = ({
  adventurer,
  assignToZone,
  gameState,
  showStats = false,
  compact = false,
  draggable = true,
  fromZoneId = null,
  onAssignAdventurer,
  canAfford,
  isMobile: isMobileProp = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showClassInfo, setShowClassInfo] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMobile, setIsMobile] = useState(isMobileProp || window.innerWidth <= 768);

  React.useEffect(() => {
    if (!isMobileProp) {
      const handleResize = () => setIsMobile(window.innerWidth <= 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isMobileProp]);

  const [{ opacity }, drag] = useDrag({
    type: 'ADVENTURER',
    item: { adventurer, fromZoneId },
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0.3 : 1,
    }),
    canDrag: draggable,
  });

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

  const getClassBonusDescription = () => {
    const descriptions = {
      'Rogue': 'Skilled at stealth missions and finding hidden treasures',
      'Ranger': 'Excel at wilderness exploration and tracking',
      'Miner': 'Master of underground expeditions and ore extraction',
      'Mage': 'Harness magical energies for powerful effects',
      'Warrior': 'Unmatched in combat and physical challenges'
    };
    return descriptions[adventurer.class] || 'Specialized adventurer';
  };

  const handleCardClick = (e) => {
    // Prevent flip when clicking buttons or in desktop mode
    if (e.target.classList.contains('assign-button') || 
        e.target.classList.contains('flip-back-button') ||
        !isMobile) {
      return;
    }
    
    // On mobile, toggle flip
    if (isMobile) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleAssign = (e) => {
    e.stopPropagation();
    if (assignToZone && gameState && gameState.reputation >= adventurer.reputationCost) {
      assignToZone(adventurer);
    } else if (onAssignAdventurer) {
      onAssignAdventurer(adventurer);
    }
  };

  const handleFlipBack = (e) => {
    e.stopPropagation();
    setIsFlipped(false);
  };

  const canAffordFinal = canAfford !== undefined ? canAfford : (gameState ? gameState.reputation >= adventurer.reputationCost : false);

  return (
    <div
      ref={draggable ? drag : null}
      className={`adventurer-card ${isFlipped ? 'flipped' : ''}`}
      style={{
        opacity: isDragging ? 0.3 : 1,
        cursor: draggable ? 'grab' : 'pointer',
      }}
      onClick={handleCardClick}
    >
      <div className="card-container">
        {/* Card Front */}
        <div className="card-face card-front">
          {/* Header: Class/Rank on left, Name on right */}
          <div className="card-header">
            <div className="class-rank-column">
              <span className={`class-badge ${adventurer.class.toLowerCase()}`}>
                {adventurer.class}
              </span>
              <div className="rank-badge">{adventurer.rank}-Rank</div>
            </div>
            <h3 className="adventurer-name">{adventurer.name}</h3>
          </div>

          {/* Success Rate */}
          <div className="success-rate">
            <span className="rate-label">Success Rate:</span>
            <span className="rate-value" style={{ color: getRankColor(adventurer.rank) }}>
              {adventurer.successRate}%
            </span>
          </div>

          {/* Cost */}
          <div className="cost-section">
            <span className="cost-label">Cost:</span>
            <span className="cost-value">
              {adventurer.reputationCost} <span className="reputation-icon">⭐</span>
            </span>
          </div>

          {/* Desktop only - show specialty */}
          {!isMobile && (
            <div className="specialty-section">
              <span className="specialty-label">Specialty:</span>
              <span className="specialty-text">
                {adventurer.zoneBonus ? adventurer.zoneBonus.description : adventurer.classPerks[0]}
              </span>
            </div>
          )}

          {/* Mobile tap indicator */}
          {isMobile && (
            <div className="tap-indicator">Tap for details</div>
          )}
        </div>

        {/* Card Back - Mobile Only */}
        {isMobile && (
          <div className="card-face card-back">
            <div className="card-back-content">
              <div className="back-header">
                <span className="back-title">{adventurer.name}</span>
                <button className="flip-back-button" onClick={handleFlipBack}>
                  Back
                </button>
              </div>

              {/* Class Perks */}
              <div className="specialty-section">
                <span className="specialty-label">Class Perks:</span>
                <div className="specialty-text">
                  <div className="perk-item">{getClassBonusDescription()}</div>
                  {adventurer.classPerks.map((perk, index) => (
                    <div key={index} className="perk-item">• {perk}</div>
                  ))}
                </div>
              </div>

              {/* Zone Bonus if applicable */}
              {adventurer.zoneBonus && (
                <div className="specialty-section">
                  <span className="specialty-label">Zone Bonus:</span>
                  <span className="specialty-text">
                    {adventurer.zoneBonus.description} 
                    (+{Math.round((adventurer.zoneBonus.effect || 0) * 100)}%)
                  </span>
                </div>
              )}

              {/* Assign Button */}
              <button
                className="assign-button"
                onClick={handleAssign}
                disabled={!canAffordFinal}
              >
                {canAffordFinal ? 'Assign to Zone' : 'Insufficient Reputation'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Class info popup - Keep for desktop hover */}
      {showClassInfo && !isMobile && (
        <div className="class-info-popup">
          <div className="popup-content">
            <h4>{adventurer.class} Class</h4>
            <p className="bonus-description">{getClassBonusDescription()}</p>
            <p className="bonus-effect">
              Effect: +{Math.round((adventurer.zoneBonus?.effect || 0) * 100)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdventurerCard;