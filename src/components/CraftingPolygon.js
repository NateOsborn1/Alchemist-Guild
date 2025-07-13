// src/components/CraftingPolygon.js
import React from 'react';
import './CraftingPolygon.css';

const CraftingPolygon = ({ attributes }) => {
  const { strength, speed, magical } = attributes;
  
  // Normalize values to fit in a triangle (0-100 scale)
  const maxValue = Math.max(strength, speed, magical);
  const scale = maxValue > 0 ? 100 / maxValue : 1;
  
  const normalizedStrength = strength * scale;
  const normalizedSpeed = speed * scale;
  const normalizedMagical = magical * scale;
  
  // Calculate polygon points (equilateral triangle)
  const centerX = 100;
  const centerY = 100;
  const radius = 80;
  
  // Strength point (bottom)
  const strengthX = centerX;
  const strengthY = centerY + radius * (normalizedStrength / 100);
  
  // Speed point (top-right)
  const speedAngle = (2 * Math.PI) / 3; // 120 degrees
  const speedX = centerX + radius * Math.cos(speedAngle) * (normalizedSpeed / 100);
  const speedY = centerY + radius * Math.sin(speedAngle) * (normalizedSpeed / 100);
  
  // Magical point (top-left)
  const magicalAngle = (4 * Math.PI) / 3; // 240 degrees
  const magicalX = centerX + radius * Math.cos(magicalAngle) * (normalizedMagical / 100);
  const magicalY = centerY + radius * Math.sin(magicalAngle) * (normalizedMagical / 100);
  
  const polygonPoints = `${strengthX},${strengthY} ${speedX},${speedY} ${magicalX},${magicalY}`;
  
  return (
    <div className="crafting-polygon">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {/* Background triangle */}
        <polygon
          points="100,20 180,180 20,180"
          fill="none"
          stroke="#8b5a2b"
          strokeWidth="2"
          opacity="0.3"
        />
        
        {/* Attribute polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(212, 175, 55, 0.3)"
          stroke="#d4af37"
          strokeWidth="3"
        />
        
        {/* Attribute labels */}
        <text x="100" y="195" textAnchor="middle" className="attribute-label strength">
          Strength: {strength}
        </text>
        <text x="185" y="185" textAnchor="end" className="attribute-label speed">
          Speed: {speed}
        </text>
        <text x="15" y="185" textAnchor="start" className="attribute-label magical">
          Magical: {magical}
        </text>
        
        {/* Center point */}
        <circle cx="100" cy="100" r="3" fill="#d4af37" />
      </svg>
    </div>
  );
};

export default CraftingPolygon; 