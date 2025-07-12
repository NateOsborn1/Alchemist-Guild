// src/components/AdventurerCard.js
import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import './AdventurerCard.css';

const AdventurerCard = ({ adventurer, onSwipe, canAfford }) => {
  const [exitX, setExitX] = React.useState(0);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-20, 0, 20]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  const rejectColor = useTransform(x, [-100, 0], ["#4d1a1a", "#2c1810"]);
  const acceptColor = useTransform(x, [0, 100], ["#2c1810", "#1a4d1a"]);
  const cardColor = useTransform(x, [-100, 0, 100], [rejectColor, "#2c1810", acceptColor]);

  const handleDragEnd = (event, info) => {
    const threshold = 80;
    const velocityThreshold = 400; // Add velocity threshold like SwipeableOrderCard
    
    if ((info.offset.x > threshold || info.velocity.x > velocityThreshold) && canAfford) {
      setExitX(1000);
      onSwipe(adventurer, 'hire');
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      setExitX(-1000);
      onSwipe(adventurer, 'reject');
    }
    // If neither condition is met, exitX stays 0 and card snaps back
  };

  return (
    <motion.div
      className="adventurer-card"
      style={{ x, rotate, opacity, backgroundColor: cardColor }}
      drag="x"
      dragConstraints={{ left: -300, right: 300 }}
      dragElastic={0.8} // Add this like SwipeableOrderCard
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX } : {}} // <-- This is the key fix!
      transition={{ type: "spring", stiffness: 400, damping: 40 }} // Match SwipeableOrderCard
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
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
          <span className={`class-badge ${adventurer.class.toLowerCase()}`}>
            {adventurer.class}
          </span>
        </div>
        
        <div className="adventurer-stats">
          <div className="stat-row">
            <span className="stat-label">Success Rate:</span>
            <span className="stat-value">{adventurer.successRate}%</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Mission Time:</span>
            <span className="stat-value">{adventurer.missionTime}min</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Hiring Cost:</span>
            <span className={`stat-value ${canAfford ? 'affordable' : 'expensive'}`}>
              {adventurer.hiringCost}g
            </span>
          </div>
        </div>
        
        <div className="loot-preview">
          <div className="loot-title">Potential Loot:</div>
          <div className="loot-items">
            {adventurer.lootTable.map((item, index) => (
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