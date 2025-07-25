// src/components/SwipeableOrderCard.js
import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import './SwipeableOrderCard.css';

const SwipeableOrderCard = ({ order, onSwipe, inventory, dailyLimitReached }) => {
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

  const handleDragEnd = (event, info) => {
    // Don't allow swiping if daily limit is reached
    if (dailyLimitReached) {
      return;
    }
    
    const threshold = 100;
    const velocityThreshold = 400;
    
    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      // Swipe right - Accept
      setExitX(1000);
      onSwipe(order, 'accept');
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      // Swipe left - Reject
      setExitX(-1000);
      onSwipe(order, 'reject');
    }
    // If neither condition is met, the card will automatically spring back due to dragConstraints
  };

  return (
    <motion.div
      className={`swipeable-card ${dailyLimitReached ? 'disabled' : ''}`}
      style={{
        x,
        rotate,
        opacity: dailyLimitReached ? 0.5 : opacity,
        backgroundColor: dailyLimitReached ? "#4a2c1a" : cardColor,
      }}
      drag={dailyLimitReached ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      whileHover={dailyLimitReached ? {} : { scale: 1.02 }}
      whileTap={dailyLimitReached ? {} : { scale: 0.98 }}
    >
      {dailyLimitReached && (
        <div className="daily-limit-overlay">
          <div className="limit-message">
            <span className="limit-icon">⏰</span>
            <span className="limit-text">Daily Limit Reached</span>
            <span className="limit-subtext">Come back tomorrow for new orders</span>
          </div>
        </div>
      )}
      
      <div className="swipe-indicator left">
        <span>✗</span>
        <span>REJECT</span>
      </div>
      
      <div className="swipe-indicator right">
        <span>✓</span>
        <span>ACCEPT</span>
      </div>

      <div className="card-content">
        <div className="customer-info">
          <h3>{order.customerName}</h3>
          <span className="reputation-badge">{order.customerTier}</span>
        </div>
        
        <div className="order-details">
          <div className="item-request">
            <span className="quantity">{order.quantity}x</span>
            <span className="item-name">{order.itemName}</span>
          </div>
          
          <div className="price-offer">
            <span className="gold-amount">{order.priceOffer}</span>
            <span className="currency">gold</span>
          </div>
        </div>
        
        <div className="order-deadline">
          <span>Deadline: {order.deadline}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeableOrderCard;