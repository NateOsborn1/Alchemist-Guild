// src/components/AdventurerCard.js
import React from 'react';
import './AdventurerCard.css';
import { useDrag } from 'react-dnd';

const AdventurerCard = ({ adventurer, canAfford, draggable = false, fromZoneId, isMobile = false, onAssignAdventurer }) => {
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

  return (
    <div
      ref={draggable ? drag : null}
      className="adventurer-card"
      style={{
        opacity: isDragging ? 0.3 : 1,
        cursor: draggable ? 'grab' : 'default',
      }}
    >
      {/* Name - Centered and Big */}
      <h3 className="adventurer-name">{adventurer.name}</h3>

      {/* Header: Class and Rank */}
      <div className="card-header">
        <span className={`class-badge ${adventurer.class.toLowerCase()}`}>
          {adventurer.class}
        </span>
        <div className="rank-badge" style={{ 
          background: getRankBackground(adventurer.rank),
          color: '#2c1810'
        }}>
          {adventurer.rank}-Rank
        </div>
      </div>

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