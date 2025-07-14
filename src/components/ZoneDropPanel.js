import React from 'react';
import { useDrop } from 'react-dnd';
import AdventurerCard from './AdventurerCard';

const ZoneDropPanel = ({ zone, assignedAdventurers, onDropAdventurer, isMobile = false, onUnassignAdventurer }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'ADVENTURER',
    drop: (item) => {
      if (onDropAdventurer) onDropAdventurer(item.adventurer, zone.id, item.fromZoneId);
    },
    canDrop: (item) => {
      // Optionally add logic for reputation, etc.
      return true;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={!isMobile ? drop : undefined}
      style={{
        border: `2px dashed ${isOver ? '#ffd700' : '#8b5a2b'}`,
        background: isOver ? 'rgba(212,175,55,0.08)' : 'rgba(44,24,16,0.2)',
        borderRadius: 10,
        padding: isMobile ? 8 : 16,
        minHeight: isMobile ? 60 : 120,
        transition: 'background 0.2s',
        width: isMobile ? '90vw' : undefined,
        maxWidth: isMobile ? 320 : undefined,
        margin: isMobile ? '0 auto' : undefined,
        fontSize: isMobile ? 13 : undefined,
        display: 'block',
      }}
    >
      <div style={{ fontWeight: 'bold', color: '#d4af37', marginBottom: 5, fontSize: isMobile ? 15 : 18 }}>
        {zone.name} <span style={{ color: '#cd853f', fontWeight: 'normal' }}>({zone.status})</span>
      </div>
      <div style={{ fontSize: isMobile ? 12 : 15, color: '#cd853f', marginBottom: 5 }}>{zone.description}</div>
      <div style={{ minHeight: 28, display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: isMobile ? 4 : 12 }}>
        {assignedAdventurers.length === 0 ? (
          <span style={{ color: '#8b5a2b', fontStyle: 'italic' }}>No adventurers assigned</span>
        ) : (
          assignedAdventurers.map(adv => (
            <div key={adv.id} style={{ position: 'relative' }}>
              <AdventurerCard
                adventurer={adv}
                canAfford={true}
                onSwipe={() => {}}
                draggable={!isMobile}
                fromZoneId={zone.id}
                isMobile={isMobile}
              />
              
              {/* Mission progress indicator */}
              {adv.status === 'onMission' && adv.mission && (
                <div style={{
                  position: 'absolute',
                  bottom: -8,
                  left: 0,
                  right: 0,
                  background: '#2c1810',
                  border: '1px solid #8b5a2b',
                  borderRadius: 4,
                  padding: '2px 4px',
                  fontSize: isMobile ? 10 : 12,
                  color: '#cd853f'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Mission: {Math.round(adv.mission.progress || 0)}%</span>
                    <span>{Math.max(0, Math.ceil((adv.mission.returnTime - Date.now()) / 60000))}m</span>
                  </div>
                  <div style={{ 
                    background: '#8b5a2b', 
                    height: 2, 
                    borderRadius: 1,
                    marginTop: 2
                  }}>
                    <div style={{ 
                      background: '#ffd700', 
                      height: '100%', 
                      width: `${Math.min(100, Math.max(0, adv.mission.progress || 0))}%`,
                      borderRadius: 1,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              )}
              
              {/* Desktop: drag handle */}
              {!isMobile && (
                <div style={{ position: 'absolute', top: 6, right: 10, color: '#ffd700', fontSize: 18, cursor: 'grab', pointerEvents: 'none' }}>⠿</div>
              )}
              {/* Mobile: Unassign button */}
              {isMobile && onUnassignAdventurer && (
                <button
                  style={{
                    position: 'absolute', top: 6, right: 10, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontWeight: 'bold', cursor: 'pointer', fontSize: 12
                  }}
                  onClick={() => onUnassignAdventurer(adv, zone.id)}
                >
                  Unassign
                </button>
              )}
            </div>
          ))
        )}
      </div>
      {!isMobile && isOver && canDrop && (
        <div style={{ color: '#ffd700', marginTop: 8 }}>Drop adventurer here!</div>
      )}
    </div>
  );
};

export default ZoneDropPanel; 