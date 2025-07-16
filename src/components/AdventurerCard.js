// src/components/AdventurerCard.js
import React from 'react';
import './AdventurerCard.css';
import { useDrag } from 'react-dnd';

const AdventurerCard = ({ adventurer, canAfford, draggable = false, fromZoneId, isMobile = false }) => {
  // Helper for experience color
  const getExperienceColor = (exp) => {
    if (exp >= 70) return '#ffd700';
    if (exp < 30) return '#ff6b6b';
    return '#f4e4bc';
  };
  // Helper for wealth color
  const getWealthColor = (wealth) => {
    if (wealth >= 70) return '#ffd700';
    if (wealth < 30) return '#ff6b6b';
    return '#f4e4bc';
  };

  // DnD drag source
  const [{ isDragging }, drag] = useDrag({
    type: 'ADVENTURER',
    item: { adventurer, fromZoneId },
    canDrag: draggable,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const hireCost = Math.max(3, Math.floor(adventurer.experience / 10)); // Calculate cost

  if (isMobile) {
    // MOBILE: Show card with reputation cost indicator
    return (
      <div className="adventurer-card" style={{ backgroundColor: '#2c1810', opacity: isDragging ? 0.3 : 1, width: '90vw', maxWidth: 320, margin: '0 auto', padding: 8, fontSize: 14 }}>
        <div className="adventurer-content">
          <div className="adventurer-header" style={{ fontSize: 16 }}>
            <h3 style={{ fontSize: 16, margin: 0 }}>{adventurer.name}</h3>
            <span className={`class-badge ${adventurer.class.toLowerCase()}`}>{adventurer.class}</span>
          </div>
          {/* New info block */}
          <div className="adventurer-info" style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              <span><b>Wealth:</b> <span style={{ color: getWealthColor(adventurer.wealth) }}>{adventurer.wealth}</span></span>
              <span><b>Exp:</b> <span style={{ color: getExperienceColor(adventurer.experience) }}>{adventurer.experience}</span></span>
            </div>
            <div style={{ fontSize: 12, marginTop: 2 }}>
              <b>Gear:</b> {adventurer.gear ? `${adventurer.gear.weapon}, ${adventurer.gear.armor}, ${adventurer.gear.accessory}` : '—'}
            </div>
          </div>
          <div className="loot-preview" style={{ padding: 4, fontSize: 12 }}>
            <div className="loot-title">Notable Loot:</div>
            <div className="loot-items">
              {adventurer.lootTable && adventurer.lootTable.slice(0,2).map((item, index) => (
                <span key={index} className="loot-item">
                  {item.min}-{item.max}x {item.material}
                </span>
              ))}
            </div>
          </div>
          <div className="adventurer-description" style={{ fontSize: 12, marginBottom: 6 }}>
            {adventurer.description}
          </div>
          {/* Reputation cost indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
            <span style={{ 
              color: '#ffd700', 
              fontSize: 14, 
              fontWeight: 'bold',
              background: 'rgba(212, 175, 55, 0.2)',
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid #d4af37'
            }}>
              Hire Cost: {hireCost} ⭐
            </span>
          </div>
        </div>
      </div>
    );
  }

  // DESKTOP: Drag-and-drop for zone assignment, button for hiring
  return (
    <div
      ref={draggable ? drag : null}
      className="adventurer-card"
      style={{
        backgroundColor: '#2c1810',
        opacity: isDragging ? 0.3 : 1,
        cursor: draggable ? 'grab' : 'default',
      }}
    >
      <div className="adventurer-content">
        <div className="adventurer-header">
          <h3>{adventurer.name}</h3>
          <span className={`class-badge ${adventurer.class.toLowerCase()}`}>{adventurer.class}</span>
        </div>
        {/* New info block */}
        <div className="adventurer-info" style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <span><b>Wealth:</b> <span style={{ color: getWealthColor(adventurer.wealth) }}>{adventurer.wealth}</span></span>
            <span><b>Exp:</b> <span style={{ color: getExperienceColor(adventurer.experience) }}>{adventurer.experience}</span></span>
          </div>
          <div style={{ fontSize: 12, marginTop: 2 }}>
            <b>Gear:</b> {adventurer.gear ? `${adventurer.gear.weapon}, ${adventurer.gear.armor}, ${adventurer.gear.accessory}` : '—'}
          </div>
        </div>
        <div className="loot-preview">
          <div className="loot-title">Notable Loot:</div>
          <div className="loot-items">
            {adventurer.lootTable && adventurer.lootTable.slice(0,2).map((item, index) => (
              <span key={index} className="loot-item">
                {item.min}-{item.max}x {item.material}
              </span>
            ))}
          </div>
        </div>
        <div className="adventurer-description">
          {adventurer.description}
        </div>
        {/* Reputation cost indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <span style={{ 
            color: '#ffd700', 
            fontSize: 14, 
            fontWeight: 'bold',
            background: 'rgba(212, 175, 55, 0.2)',
            padding: '4px 8px',
            borderRadius: 4,
            border: '1px solid #d4af37'
          }}>
            Hire Cost: {hireCost} ⭐
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdventurerCard;