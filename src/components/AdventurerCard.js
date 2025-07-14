// src/components/AdventurerCard.js
import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import './AdventurerCard.css';
import { useDrag } from 'react-dnd';

const AdventurerCard = ({ adventurer, onSwipe, canAfford, draggable = false, fromZoneId, isMobile = false, onAssign }) => {
  const [exitX, setExitX] = useState(0);
  
  // Track the drag position
  const x = useMotionValue(0);
  
  // Transform drag position to rotation and opacity
  const rotate = useTransform(x, [-200, 0, 200], [-30, 0, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  // Colors for accept/reject feedback
  const acceptColor = useTransform(x, [0, 100], ["#2c1810", "#1a4d1a"]);
  const rejectColor = useTransform(x, [-100, 0], ["#4d1a1a", "#2c1810"]);
  const cardColor = useTransform(x, [-100, 0, 100], [rejectColor, "#2c1810", acceptColor]);

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

  if (isMobile) {
    // MOBILE: No drag/swipe, just show card and assign button
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
          {onAssign && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                style={{
                  marginTop: 6,
                  width: 140,
                  padding: '8px 0',
                  background: '#ffd700',
                  color: '#2c1810',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 'bold',
                  fontSize: 15,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px #d4af3740',
                }}
                onClick={() => onAssign(adventurer)}
              >
                Assign
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // DESKTOP: Drag-and-drop/swipe
  const handleDragEnd = (event, info) => {
    const threshold = 100;
    const velocityThreshold = 400;
    
    if ((info.offset.x > threshold || info.velocity.x > velocityThreshold) && canAfford) {
      // Swipe right - Hire
      setExitX(1000);
      onSwipe(adventurer, 'hire');
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      // Swipe left - Reject
      setExitX(-1000);
      onSwipe(adventurer, 'reject');
    }
    // If neither condition is met, the card will automatically spring back due to dragConstraints
  };

  return (
    <motion.div
      ref={draggable ? drag : null}
      className="adventurer-card"
      style={{
        x,
        rotate,
        opacity: isDragging ? 0.3 : opacity,
        backgroundColor: cardColor,
        cursor: draggable ? 'grab' : 'default',
      }}
      drag={draggable ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={draggable ? handleDragEnd : undefined}
      animate={exitX !== 0 ? { x: exitX } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      whileHover={draggable ? { scale: 1.02 } : {}}
      whileTap={draggable ? { scale: 0.98 } : {}}
    >
      <div className="swipe-indicator left">
        <span>✗</span>
        <span>PASS</span>
      </div>
      
      <div className="swipe-indicator right">
        <span>✓</span>
        <span>HIRE</span>
      </div>

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
      </div>
    </motion.div>
  );
};

export default AdventurerCard;