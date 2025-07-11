// src/components/OrderCard.js
import React from 'react';
import './OrderCard.css';

const OrderCard = ({ order }) => {
  return (
    <div className="order-card">
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
  );
};

export default OrderCard;