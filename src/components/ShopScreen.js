// src/components/ShopScreen.js
import React from 'react';
import AdventurerCard from './AdventurerCard';
import ZoneDropPanel from './ZoneDropPanel';
import { useDrop } from 'react-dnd';

const ShopScreen = ({ 
  availableAdventurers, 
  zones, 
  gameState, 
  zoneAssignments,
  onAssignAdventurer,
  onUnassignAdventurer,
  currentEvent 
}) => {
  // Drop target for returning adventurers to available list
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'ADVENTURER',
    drop: (item) => {
      if (item.fromZoneId && onUnassignAdventurer) {
        onUnassignAdventurer(item.adventurer, item.fromZoneId);
      }
    },
    canDrop: (item) => !!item.fromZoneId,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div className="shop-screen" style={{ display: 'flex', gap: 32 }}>
      {/* Left: Adventurers (drop target) */}
      <div style={{ flex: 1 }} ref={drop}>
        <div className="shop-header">
          {currentEvent && (
            <div className="current-event">
              <span className="event-name">{currentEvent.name}</span>
              <span className="event-time">{currentEvent.minutesRemaining}m remaining</span>
            </div>
          )}
        </div>
        <div className="adventurers-section">
          <h3>Available Adventurers ({availableAdventurers.length})</h3>
          {availableAdventurers.length === 0 ? (
            <div className="no-adventurers">
              <p>No adventurers available. Check back later!</p>
            </div>
          ) : (
            <div className="adventurers-grid">
              {availableAdventurers.map(adventurer => (
                <AdventurerCard 
                  key={adventurer.id}
                  adventurer={adventurer}
                  canAfford={true}
                  onSwipe={() => {}}
                  draggable // Will use react-dnd in the card
                />
              ))}
            </div>
          )}
          {isOver && canDrop && (
            <div style={{ color: '#ffd700', marginTop: 8, textAlign: 'center' }}>Release to return adventurer here</div>
          )}
        </div>
      </div>
      {/* Right: Zones as drop targets */}
      <div style={{ flex: 1 }}>
        <h3>Active Zones</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {zones.map(zone => (
            <ZoneDropPanel
              key={zone.id}
              zone={zone}
              assignedAdventurers={zoneAssignments[zone.id] || []}
              onDropAdventurer={onAssignAdventurer}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShopScreen;
