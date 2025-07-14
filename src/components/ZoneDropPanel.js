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
        padding: 16,
        minHeight: 120,
        transition: 'background 0.2s',
      }}
    >
      <div style={{ fontWeight: 'bold', color: '#d4af37', marginBottom: 8 }}>
        {zone.name} <span style={{ color: '#cd853f', fontWeight: 'normal' }}>({zone.status})</span>
      </div>
      <div style={{ fontSize: 13, color: '#cd853f', marginBottom: 8 }}>{zone.description}</div>
      <div style={{ minHeight: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
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
              {/* Desktop: drag handle */}
              {!isMobile && (
                <div style={{ position: 'absolute', top: 6, right: 10, color: '#ffd700', fontSize: 18, cursor: 'grab', pointerEvents: 'none' }}>⠿</div>
              )}
              {/* Mobile: Unassign button */}
              {isMobile && onUnassignAdventurer && (
                <button
                  style={{
                    position: 'absolute', top: 6, right: 10, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontWeight: 'bold', cursor: 'pointer', fontSize: 13
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