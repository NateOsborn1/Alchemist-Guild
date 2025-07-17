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
      // Can't assign to zones in downtime
      if (zone.isInDowntime) return false;
      return true;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Calculate health percentage
  const healthPercentage = zone.maxHealth > 0 ? (zone.currentHealth / zone.maxHealth) * 100 : 0;
  
  // Get downtime time remaining
  const getDowntimeRemaining = () => {
    if (!zone.isInDowntime || !zone.downtimeEndTime) return null;
    const timeRemaining = Math.max(0, zone.downtimeEndTime - Date.now());
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Calculate party bonuses
  const getPartyBonuses = () => {
    if (assignedAdventurers.length < 2) return null;
    
    const bonuses = {};
    assignedAdventurers.forEach(adv => {
      if (adv.zoneBonus) {
        const type = adv.zoneBonus.type;
        if (!bonuses[type]) {
          bonuses[type] = {
            count: 0,
            totalEffect: 0,
            adventurers: []
          };
        }
        bonuses[type].count++;
        bonuses[type].totalEffect += adv.zoneBonus.effect;
        bonuses[type].adventurers.push(adv.name);
      }
    });
    
    // Only return bonuses that have multiple adventurers
    return Object.entries(bonuses).filter(([type, data]) => data.count > 1);
  };

  const partyBonuses = getPartyBonuses();

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
      {/* Header with zone name */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 8,
        gap: 12
      }}>
        <div style={{ 
          fontWeight: 'bold', 
          color: '#d4af37', 
          fontSize: isMobile ? 15 : 18,
          flex: 1
        }}>
          {zone.name}
        </div>
        
        {/* Downtime display */}
        {zone.isInDowntime && (
          <div style={{
            textAlign: 'center',
            color: '#4ecdc4',
            fontSize: isMobile ? 11 : 13,
            fontWeight: 'bold',
            padding: '4px 8px',
            background: '#2c1810',
            border: '1px solid #4ecdc4',
            borderRadius: 6,
            minWidth: 80
          }}>
            <div style={{ fontSize: isMobile ? 10 : 12 }}>🏆 CLEARED</div>
            <div style={{ fontSize: isMobile ? 9 : 11, color: '#cd853f' }}>
              {getDowntimeRemaining()}
            </div>
          </div>
        )}
      </div>
      
      {/* Health percentage centered below zone name */}
      {!zone.isInDowntime && (
        <div style={{
          textAlign: 'center',
          marginBottom: 8
        }}>
          <div style={{
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: isMobile ? 14 : 16,
            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
          }}>
            {Math.round(healthPercentage)}%
          </div>
        </div>
      )}
      
      {/* Health bar progress bar */}
      {!zone.isInDowntime && (
        <div style={{
          background: 'transparent', // Changed from '#ffffff'
          border: '0.5px solid #8b5a2b',
          borderRadius: 8,
          padding: 2, // Reduce padding for thinner look
          marginBottom: 8,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            background: '#4a2c1a',
            height: isMobile ? 8 : 10,
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              background: `linear-gradient(90deg, #8b2635, #a52a2a, #ffd700)`,
              height: '100%',
              width: `${Math.max(0, Math.min(100, healthPercentage))}%`,
              borderRadius: 4,
              transition: 'width 0.5s ease, background 0.3s ease',
              boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.2)'
            }} />
            {/* Health bar glow effect */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(90deg, transparent, #8b263533, transparent)`,
              animation: 'healthGlow 2s ease-in-out infinite alternate',
              borderRadius: 4
            }} />
          </div>
        </div>
      )}
      
      {/* Party Bonus Display */}
      {partyBonuses && partyBonuses.length > 0 && (
        <div style={{
          marginBottom: 8,
          padding: 6,
          background: 'rgba(212, 175, 55, 0.2)',
          border: '1px solid #d4af37',
          borderRadius: 6,
          fontSize: isMobile ? 11 : 12
        }}>
          <div style={{
            color: '#ffd700',
            fontWeight: 'bold',
            marginBottom: 4,
            fontSize: isMobile ? 10 : 11
          }}>
            🎯 PARTY BONUSES ACTIVE
          </div>
          {partyBonuses.map(([type, data]) => (
            <div key={type} style={{
              color: '#4ecdc4',
              fontSize: isMobile ? 10 : 11,
              marginBottom: 2
            }}>
              {type === 'success' && '⚡ Success Rate'}
              {type === 'damage' && '⚔️ Zone Damage'}
              {type === 'reputation' && '⭐ Reputation'}
              {type === 'gold' && '💰 Gold Rewards'}
              {type === 'loot' && '🎒 Loot Quality'}
              : +{Math.round(data.totalEffect * 100 / data.count)}% (from {data.count} adventurers)
            </div>
          ))}
        </div>
      )}
      
      <div style={{ fontSize: isMobile ? 12 : 15, color: '#cd853f', marginBottom: 5 }}>{zone.description}</div>
      <div style={{ minHeight: 28, display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: isMobile ? 4 : 12 }}>
        {assignedAdventurers.length === 0 ? (
          <span style={{ color: '#8b5a2b', fontStyle: 'italic' }}>
            {zone.isInDowntime ? 'Zone cleared - in downtime' : 'No adventurers assigned'}
          </span>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: isMobile ? 6 : 8, 
            justifyContent: 'center',
            alignItems: 'flex-start'
          }}>
            {assignedAdventurers.map(adv => (
              <div key={adv.id} style={{ 
                position: 'relative',
                background: 'linear-gradient(135deg, #2c1810, #4a2c1a)',
                border: '1px solid #8b5a2b',
                borderRadius: 6,
                padding: isMobile ? 6 : 8,
                minWidth: isMobile ? 80 : 100,
                maxWidth: isMobile ? 120 : 140,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                {/* Compact adventurer info */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 2,
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  {/* Name */}
                  <div style={{
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: 'bold',
                    color: '#f4e4bc',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                  }}>
                    {adv.name}
                  </div>
                  
                  {/* Rank */}
                  <div style={{
                    fontSize: isMobile ? 10 : 11,
                    fontWeight: 'bold',
                    color: adv.rank === 'A' ? '#ffd700' : adv.rank === 'B' ? '#4ecdc4' : '#ff6b6b',
                    background: adv.rank === 'A' ? 'rgba(255, 215, 0, 0.2)' : adv.rank === 'B' ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                    padding: '2px 4px',
                    borderRadius: 3,
                    border: `1px solid ${adv.rank === 'A' ? '#ffd700' : adv.rank === 'B' ? '#4ecdc4' : '#ff6b6b'}`
                  }}>
                    {adv.rank}
                  </div>
                  
                  {/* Class */}
                  <div style={{
                    fontSize: isMobile ? 9 : 10,
                    color: '#cd853f',
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}>
                    {adv.class}
                  </div>
                </div>
                
                {/* Mission progress indicator */}
                {adv.status === 'onMission' && adv.mission && (
                  <div style={{
                    position: 'absolute',
                    bottom: -4,
                    left: 2,
                    right: 2,
                    background: '#2c1810',
                    border: '1px solid #8b5a2b',
                    borderRadius: 3,
                    padding: '2px 4px',
                    fontSize: isMobile ? 8 : 9,
                    color: '#cd853f'
                  }}>
                    <div style={{ 
                      background: '#8b5a2b', 
                      height: 2, 
                      borderRadius: 1,
                      marginTop: 1
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
                  <div style={{ 
                    position: 'absolute', 
                    top: 2, 
                    right: 2, 
                    color: '#ffd700', 
                    fontSize: 12, 
                    cursor: 'grab', 
                    pointerEvents: 'none' 
                  }}>⠿</div>
                )}
                
                {/* Mobile: Unassign button */}
                {isMobile && onUnassignAdventurer && (
                  <button
                    style={{
                      position: 'absolute', 
                      top: 2, 
                      right: 2, 
                      background: '#ff6b6b', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 3, 
                      padding: '2px 4px', 
                      fontWeight: 'bold', 
                      cursor: 'pointer', 
                      fontSize: 8
                    }}
                    onClick={() => onUnassignAdventurer(adv, zone.id)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {!isMobile && isOver && canDrop && (
        <div style={{ color: '#ffd700', marginTop: 8 }}>Drop adventurer here!</div>
      )}
      
      {/* Add CSS animation for health bar glow */}
      <style jsx>{`
        @keyframes healthGlow {
          0% { opacity: 0.3; }
          100% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default ZoneDropPanel; 