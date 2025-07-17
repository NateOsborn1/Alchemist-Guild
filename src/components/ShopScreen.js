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
    // MOBILE LAYOUT: Vertical scrollable cards, one at a time
    const availableAdventurers = adventurerPool; // Use pool for available adventurers
    return (
      <div className="shop-screen mobile" style={{ 
        width: '100%',
        maxWidth: '100vw',
        padding: '8px',
        margin: '0',
        overflow: 'hidden', // Prevent horizontal scrolling
        boxSizing: 'border-box'
      }}>
        <div className="shop-header" style={{ marginBottom: '16px' }}>
          {currentEvent && (
            <div className="current-event">
              <span className="event-name">{currentEvent.name}</span>
              <span className="event-time">{currentEvent.minutesRemaining}m remaining</span>
            </div>
          )}
        </div>
        
        <div className="adventurers-section" style={{
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
          <h3 style={{ 
            textAlign: 'center', 
            marginBottom: '16px',
            color: '#d4af37',
            fontSize: '18px'
          }}>
            Available Adventurers ({availableAdventurers.length})
          </h3>
          
          {availableAdventurers.length === 0 ? (
            <div className="no-adventurers" style={{
              textAlign: 'center',
              color: '#cd853f',
              fontStyle: 'italic',
              padding: '40px 20px',
              background: 'rgba(44, 24, 16, 0.4)',
              border: '1px solid #8b5a2b',
              borderRadius: '12px',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <p>No adventurers available. Check back later!</p>
            </div>
          ) : (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center',
              width: '100%',
              maxWidth: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '8px 0',
              boxSizing: 'border-box'
            }}>
              {availableAdventurers.map(adventurer => (
                <div key={adventurer.id} style={{
                  width: '100%',
                  maxWidth: '100%',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <AdventurerCard 
                    adventurer={adventurer}
                    canAfford={gameState.reputation >= adventurer.reputationCost}
                    isMobile={true}
                    draggable={false} // No drag on mobile
                    fromZoneId={null}
                    onAssignAdventurer={onAssignAdventurer}
                    onRequestAssignZone={setAssigningAdventurer}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Active Zones - Hidden on mobile, moved to Zones tab */}
        {/*
        <h3 style={{ 
          margin: 24px 0 12,         textAlign: 'center,
          color: '#d4af37',
          fontSize: '18     }}>
          Active Zones
        </h3>
        
        <div style={{ 
          display: flex,     flexDirection: 'column, 
          gap: 12px        alignItems: 'center',
          marginBottom: '20     }}>
          {zones.map(zone => (
            <ZoneDropPanel
              key={zone.id}
              zone={zone}
              assignedAdventurers={adventurers.filter(a => a.zoneId === zone.id && (a.status === 'assigned' || a.status === 'onMission))}
              onDropAdventurer={onAssignAdventurer}
              isMobile={true}
              onUnassignAdventurer={onUnassignAdventurer}
            />
          ))}
        </div>
        */}
        {assigningAdventurer && (
          <div className="zone-select-modal" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{
              background: '#2c1810', border: '2px solid #d4af37', borderRadius: 12, padding: 24, minWidth: 260, maxWidth: 340
            }}>
              <h3 style={{ color: '#ffd700', marginBottom: 16 }}>Assign to Zone</h3>
              {zones.map(zone => (
                <button
                  key={zone.id}
                  style={{
                    display: 'block', width: '100%', margin: '8px 0', padding: 12,
                    background: '#4a2c1a', color: '#ffd700', border: '1px solid #d4af37', borderRadius: 8, fontWeight: 'bold'
                  }}
                  onClick={() => {
                    onAssignAdventurer(assigningAdventurer, zone.id);
                    setAssigningAdventurer(null);
                  }}
                >
                  {zone.name}
                </button>
              ))}
              <button
                style={{
                  marginTop: 12, background: '#8b5a2b', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px'
                }}
                onClick={() => setAssigningAdventurer(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
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
                  canAfford={gameState.reputation >= adventurer.reputationCost}
                  draggable={true}
                  fromZoneId={null}
                  isMobile={false}
                  onAssignAdventurer={onAssignAdventurer}
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
