// src/components/ShopScreen.js
import React, { useState } from 'react';
import AdventurerCard from './AdventurerCard';
import ZoneDropPanel from './ZoneDropPanel';
import { useDrop } from 'react-dnd';

// Simple mobile detection hook
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 800);
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 800);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

const ShopScreen = ({ 
  adventurers,
  zones, 
  gameState, 
  onAssignAdventurer,
  onUnassignAdventurer,
  currentEvent,
  adventurerPool = [] // Add adventurerPool prop for available adventurers
}) => {
  const isMobile = useIsMobile();
  const [assigningAdventurer, setAssigningAdventurer] = useState(null);

  // Drop target for returning adventurers to available list (desktop only)
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



  if (isMobile) {
    // MOBILE LAYOUT: Stack adventurers and zones vertically, use tap-to-assign
    const availableAdventurers = adventurerPool; // Use pool for available adventurers
    return (
      <div className="shop-screen" style={{ display: 'block', padding: 8 }}>
        <div className="shop-header">
          {currentEvent && (
            <div className="current-event">
              <span className="event-name">{currentEvent.name}</span>
              <span className="event-time">{currentEvent.minutesRemaining}m remaining</span>
            </div>
          )}
        </div>
        <div className="adventurers-section">
          <h3 style={{ textAlign: 'center', marginBottom: 14 }}>Available Adventurers ({availableAdventurers.length})</h3>
          {availableAdventurers.length === 0 ? (
            <div className="no-adventurers">
              <p>No adventurers available. Check back later!</p>
            </div>
          ) : (
            <div className="adventurers-grid" style={{ gap: 10, justifyContent: 'center', alignItems: 'center', margin: '0 auto' }}>
              {availableAdventurers.map(adventurer => (
                <AdventurerCard 
                  key={adventurer.id}
                  adventurer={adventurer}
                  canAfford={true}
                  isMobile={true}
                  draggable={true}
                  fromZoneId={null}
                />
              ))}
            </div>
          )}
        </div>
        <h3 style={{ margin: '24px 0 10px 0', textAlign: 'center' }}>Active Zones</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', width: '100%', margin: '0 auto' }}>
          {zones.map(zone => (
            <ZoneDropPanel
              key={zone.id}
              zone={zone}
              assignedAdventurers={adventurers.filter(a => a.zoneId === zone.id && (a.status === 'assigned' || a.status === 'onMission'))}
              onDropAdventurer={onAssignAdventurer}
              isMobile={true}
              onUnassignAdventurer={onUnassignAdventurer}
            />
          ))}
        </div>
        {/* Remove the unused modal - we're using direct hire buttons now */}
      </div>
    );
  }

  // DESKTOP LAYOUT: Drag-and-drop
  const availableAdventurers = adventurerPool; // Use pool for available adventurers
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
                  draggable={true}
                  fromZoneId={null}
                  isMobile={false}
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
              assignedAdventurers={adventurers.filter(a => a.zoneId === zone.id && (a.status === 'assigned' || a.status === 'onMission'))}
              onDropAdventurer={onAssignAdventurer}
              isMobile={false}
              onUnassignAdventurer={onUnassignAdventurer}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShopScreen;
