// src/components/AdventurerCustomerCard.js
import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import './AdventurerCustomerCard.css';

const AdventurerCustomerCard = ({ customer, onSwipe, inventory }) => {
  const [exitX, setExitX] = useState(0);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-30, 0, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  const acceptColor = useTransform(x, [0, 100], ["#2c1810", "#1a4d1a"]);
  const rejectColor = useTransform(x, [-100, 0], ["#4d1a1a", "#2c1810"]);
  const cardColor = useTransform(x, [-100, 0, 100], [rejectColor, "#2c1810", acceptColor]);

  const handleDragEnd = (event, info) => {
    const threshold = 100;
    const velocityThreshold = 400;
    
    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      // Swipe right - Sell gear
      setExitX(1000);
      onSwipe(customer, 'sell');
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      // Swipe left - Pass
      setExitX(-1000);
      onSwipe(customer, 'pass');
    }
  };

  const canFulfill = inventory[customer.itemName] >= customer.quantity;

  return (
    <motion.div
      className="adventurer-customer-card"
      style={{
        x,
        rotate,
        opacity,
        backgroundColor: cardColor,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="swipe-indicator left">
        <span>✗</span>
        <span>PASS</span>
      </div>
      
      <div className="swipe-indicator right">
        <span>✓</span>
        <span>SELL</span>
      </div>

      <div className="customer-content">
        <div className="customer-header">
          <h3>{customer.name}</h3>
          <span className={`class-badge ${customer.class.toLowerCase()}`}>
            {customer.class}
          </span>
        </div>
        
        <div className="mission-info">
          <div className="mission-description">
            {customer.missionDescription}
          </div>
          <div className="mission-requirements">
            <span className="requirements-label">Needs:</span>
            <span className={`item-requirement ${canFulfill ? 'available' : 'unavailable'}`}>
              {customer.quantity}x {customer.itemName}
            </span>
          </div>
        </div>
        
        <div className="purchase-details">
          <div className="price-offer">
            <span className="gold-amount">{customer.priceOffer}</span>
            <span className="currency">gold</span>
          </div>
          <div className="reputation-bonus">
            <span className="bonus-label">Reputation:</span>
            <span className="bonus-value">+{customer.reputationBonus}</span>
          </div>
        </div>
        
        <div className="customer-description">
          {customer.description}
        </div>
      </div>
    </motion.div>
  );
};

export default AdventurerCustomerCard; 