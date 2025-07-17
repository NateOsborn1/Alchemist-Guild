// src/components/AdventurerCard.js
import React, { useState } from 'react';
import './AdventurerCard.css';
import { useDrag } from 'react-dnd';

const AdventurerCard = ({ adventurer, canAfford, draggable = false, fromZoneId, isMobile = false, onAssignAdventurer }) => {
  const [showClassInfo, setShowClassInfo] = useState(false);
  
  // DnD drag source
  const [{ isDragging }, drag] = useDrag({
    type: 'ADVENTURER',
    item: { adventurer, fromZoneId },
    canDrag: draggable,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Get rank color
  const getRankColor = (rank) => {
    switch (rank) {
      case 'A': return '#ffd700'; // Gold
      case 'B': return '#4ecdc4'; // Teal
      case 'C': return '#ff6b6b'; // Red
      default: return '#f4e4bc';
    }
  };

  // Get rank background
  const getRankBackground = (rank) => {
    switch (rank) {
      case 'A': return 'linear-gradient(135deg, #ffd700, #ffed4e)';
      case 'B': return 'linear-gradient(135deg, #4ecdc4, #45b7aa)';
      case 'C': return 'linear-gradient(135deg, #ff6b6b, #e74c3c)';
      default: return '#8b5a2b';
    }
  };

  // Handle assign button click
  const handleAssign = (e) => {
    e.stopPropagation();
    if (onAssignAdventurer) {
      onAssignAdventurer(adventurer);
    }
  };

  // Handle card click/tap
  const handleCardClick = () => {
    setShowClassInfo(!showClassInfo);
  };

  // Get class bonus description
  const getClassBonusDescription = () => {
    if (!adventurer.zoneBonus) return "No party bonus";
    
    const descriptions = {
      success: "Increases success rate of other adventurers in the same zone,",
      damage: "Increases damage dealt to zones by other adventurers,",
      reputation: "Increases reputation rewards for other adventurers,",
      gold: "Increases gold value of gear found by other adventurers,",
      loot: "Eases loot quality and value for other adventurers"
    };
    
    return descriptions[adventurer.zoneBonus.type] || "Provides party bonus";
  };

  return (
    <div
      ref={draggable ? drag : null}
      className="adventurer-card"
      style={{
        opacity: isDragging ? 0.3 : 1,
        cursor: draggable ? 'grab' : 'pointer',
      }}
      onClick={handleCardClick}
    >
      {/* Header row: Class/Rank on left, Name on right */}
      <div className="card-header">
        <div className="class-rank-column">
          <span className={`class-badge ${adventurer.class.toLowerCase()}`}>{adventurer.class}</span>
          <div className="rank-badge">{adventurer.rank}-Rank</div>
        </div>
        <h3 className="adventurer-name">{adventurer.name}</h3>
      </div>

      {/* Class info popup */}
      {showClassInfo && (
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

      {/* Success Rate - BIGGEST number */}
      <div className="success-rate">
        <span className="rate-label">Success Rate:</span>
        <span className="rate-value" style={{ color: getRankColor(adventurer.rank) }}>
          {adventurer.successRate}%
        </span>
      </div>

      {/* Cost Section */}
      <div className="cost-section">
        <span className="cost-label">Cost:</span>
        <span className="cost-value">
          {adventurer.reputationCost} <span className="reputation-icon">⭐</span>
        </span>
      </div>

      {/* Specialty - ONE LINE only */}
      <div className="specialty-section">
        <span className="specialty-label">Specialty:</span>
        <span className="specialty-text">
          {adventurer.zoneBonus ? adventurer.zoneBonus.description : adventurer.classPerks[0]}
        </span>
      </div>

      {/* Assign Button */}
      <button
        className="assign-button"
        onClick={handleAssign}
        disabled={!canAfford}
        style={{
          background: canAfford ? '#8b5a2b' : '#4a2c1a',
          color: canAfford ? '#f4e4bc' : '#8b5a2b',
          borderColor: canAfford ? '#d4af37' : '#8b5a2b',
          cursor: canAfford ? 'pointer' : 'not-allowed'
        }}
      >
        {canAfford ? 'Assign to Zone' : 'Insufficient Reputation'}
      </button>
    </div>
  );
};

export default AdventurerCard;