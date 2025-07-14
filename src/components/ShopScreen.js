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
  currentEvent 
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

  // Handler for mobile assign
  const handleMobileAssign = (adventurer, zoneId) => {
    onAssignAdventurer(adventurer, zoneId, null);
    setAssigningAdventurer(null);
  };

  if (isMobile) {
    // MOBILE LAYOUT: Stack adventurers and zones vertically, use tap-to-assign
    const availableAdventurers = adventurers.filter(a => a.status === 'available');
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
                  onAssign={() => setAssigningAdventurer(adventurer)}
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
              assignedAdventurers={adventurers.filter(a => (a.status === 'assigned' || a.status === 'onMission') && a.zoneId === zone.id)}
              onDropAdventurer={onAssignAdventurer}
              isMobile={true}
              onUnassignAdventurer={onUnassignAdventurer}
            />
          ))}
        </div>
        {/* Modal for zone selection */}
        {assigningAdventurer && (
          <div style={{
            position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} onClick={() => setAssigningAdventurer(null)}>
            <div style={{ background: '#2c1810', borderRadius: 12, padding: 18, minWidth: 220 }} onClick={e => e.stopPropagation()}>
              <h4 style={{ color: '#ffd700', marginBottom: 12 }}>Assign to Zone</h4>
              {zones.map(zone => (
                <button
                  key={zone.id}
                  style={{
                    display: 'block', width: '100%', margin: '6px 0', padding: 10,
                    background: '#8b5a2b', color: '#fff', border: 'none', borderRadius: 8,
                    fontWeight: 'bold', fontSize: 15, cursor: 'pointer'
                  }}
                  onClick={() => handleMobileAssign(assigningAdventurer, zone.id)}
                >
                  {zone.name}
                </button>
              ))}
              <button style={{ marginTop: 10, width: '100%', padding: 8, background: '#4a2c1a', color: '#ffd700', border: 'none', borderRadius: 8, fontSize: 14 }} onClick={() => setAssigningAdventurer(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DESKTOP LAYOUT: Drag-and-drop
  const availableAdventurers = adventurers.filter(a => a.status === 'available');
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
              assignedAdventurers={adventurers.filter(a => (a.status === 'assigned' || a.status === 'onMission') && a.zoneId === zone.id)}
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
