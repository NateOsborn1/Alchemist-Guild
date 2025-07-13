// src/components/QueuedOrderCard.js
import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import './QueuedOrderCard.css';

const QueuedOrderCard = ({ order, onSwipe, onComplete, inventory }) => {
  const [exitX, setExitX] = useState(0);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-30, 0, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  const rejectColor = useTransform(x, [-100, 0], ["#4d1a1a", "#2c1810"]);
  const cardColor = useTransform(x, [-100, 0], [rejectColor, "#2c1810"]);

  const handleDragEnd = (event, info) => {
    const threshold = 80;
    const velocityThreshold = 300;
    
    if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      // Swipe left - Cancel order
      setExitX(-1000);
      onSwipe(order, 'cancel');
    }
    // Only allow left swipe to cancel
  };

  const timeRemaining = Math.max(0, Math.ceil((order.deadline - Date.now()) / (1000 * 60))); // minutes
  const hours = Math.floor(timeRemaining / 60);
  const minutes = timeRemaining % 60;
  const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  const canComplete = inventory[order.itemName] >= order.quantity;

  return (
    <motion.div
      className="queued-order-card"
      style={{
        x,
        rotate,
        opacity,
        backgroundColor: cardColor,
      }}
      drag="x"
      dragConstraints={{ left: -100, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      animate={exitX !== 0 ? { x: exitX } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 40 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="swipe-indicator left">
        <span>✗</span>
        <span>CANCEL</span>
      </div>

      <div className="queued-order-content">
        <div className="order-header">
          <h4>{order.customerName}</h4>
          <span className="customer-tier">{order.customerTier}</span>
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
        
        <div className="deadline-info">
          <span className={`deadline ${timeRemaining < 30 ? 'urgent' : 'normal'}`}>
            {timeString} remaining
          </span>
        </div>
        
        {/* NEW: Complete button */}
        <div className="order-actions">
          <button 
            className={`complete-btn ${canComplete ? 'can-complete' : 'cannot-complete'}`}
            onClick={() => canComplete && onComplete(order)}
            disabled={!canComplete}
          >
            {canComplete ? 'Complete Order' : `Need ${order.quantity}x ${order.itemName}`}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default QueuedOrderCard; 