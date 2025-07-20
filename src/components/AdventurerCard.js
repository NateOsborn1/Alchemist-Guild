// src/components/AdventurerCard.js
import React from 'react';
import { useDrag } from 'react-dnd';
import './AdventurerCard.css';

const AdventurerCard = ({
  adventurer,
  assignToZone,
  gameState,
  draggable = true,
  fromZoneId = null,
  onAssignAdventurer,
  canAfford,
}) => {
  const [{ opacity }, dragRef] = useDrag({
    type: 'ADVENTURER',
    item: { adventurer, fromZoneId },
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0.3 : 1,
    }),
    canDrag: draggable,
  });

  const handleAssign = (e) => {
    e.stopPropagation();
    if (assignToZone && gameState && gameState.reputation >= adventurer.reputationCost) {
      assignToZone(adventurer);
    } else if (onAssignAdventurer) {
      onAssignAdventurer(adventurer);
    }
  };

  const canAffordFinal = canAfford !== undefined ? canAfford : (gameState ? gameState.reputation >= adventurer.reputationCost : false);

  return (
    <div
      ref={dragRef}
      className={`adventurer-scroll ${canAffordFinal ? 'available' : ''}`}
      style={{
        opacity,
        cursor: draggable ? 'grab' : 'pointer',
      }}
    >
      <div className="scroll-header">
        <div className="guild-seal">
          <div className="guild-text">Adventurers Guild</div>
          <div className="posting-title">~ Hero Recruitment Posting ~</div>
        </div>
        <h2 className="hero-name">{adventurer.name}</h2>
        <div className="class-rank-line">
          <span className={`class-badge ${adventurer.class.toLowerCase()}`}>
            {adventurer.class}
          </span>
          <span className="rank-badge">{adventurer.rank}-Rank</span>
        </div>
      </div>
      
      <div className="scroll-content">
        <div className="qualifications-section">
          <div className="section-title">⚔ Qualifications ⚔</div>
          <div className="qualification-item">
            <span className="qual-label">Success Rate:</span>
            <span className="success-rate">{adventurer.successRate}%</span>
          </div>
          <div className="qualification-item">
            <span className="qual-label">Deployment Cost:</span>
            <div className="cost-display">
              <span className="cost-number">{adventurer.reputationCost}</span>
              <span className="star">⭐</span>
            </div>
          </div>
        </div>
        
        <div className="special-abilities">
          <div className="section-title">✦ Special Abilities ✦</div>
          <div className="ability-box">
            <div className="ability-text">
              {adventurer.zoneBonus ? 
                adventurer.zoneBonus.description : 
                adventurer.classPerks[0] || `${adventurer.class}'s expertise provides unique advantages`
              }
            </div>
          </div>
        </div>
        
        <div className="recruitment-status">
          <button 
            className={`status-button ${canAffordFinal ? 'available' : ''}`}
            onClick={handleAssign}
            disabled={!canAffordFinal}
          >
            {canAffordFinal ? 'Deploy Hero' : 'Insufficient Reputation'}
          </button>
        </div>
      </div>
      
      <div className="wax-seal">
        {canAffordFinal ? '✓' : '✗'}
      </div>
    </div>
  );
};

export default AdventurerCard;