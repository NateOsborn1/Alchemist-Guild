// src/components/ActiveAdventurers.js
import React, { useState, useEffect } from 'react';
import './ActiveAdventurers.css';

const ActiveAdventurers = ({ activeAdventurers, onMissionComplete }) => {
  const [adventurers, setAdventurers] = useState(activeAdventurers);

  // Update local state when props change
  useEffect(() => {
    setAdventurers(activeAdventurers);
  }, [activeAdventurers]);

  // Check for completed missions
  useEffect(() => {
    if (adventurers.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      
      setAdventurers(prevAdventurers => {
        const completed = prevAdventurers.filter(adv => now >= adv.returnTime);
        const active = prevAdventurers.filter(adv => now < adv.returnTime);
        
        // Process completed missions
        completed.forEach(adventurer => {
          const success = Math.random() * 100 < adventurer.successRate;
          const loot = {};
          
          if (success) {
            // Calculate loot based on loot table
            adventurer.lootTable.forEach(item => {
              const amount = Math.floor(
                Math.random() * (item.max - item.min + 1) + item.min
              );
              loot[item.material] = (loot[item.material] || 0) + amount;
            });
          }
          
          console.log(`${adventurer.name} returned! Success: ${success}`, loot);
          onMissionComplete(adventurer, success, loot);
        });
        
        return active;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [adventurers.length, onMissionComplete]);

  // Update progress for active adventurers
  useEffect(() => {
    if (adventurers.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setAdventurers(prev => prev.map(adv => ({
        ...adv,
        progress: Math.min(100, ((now - adv.startTime) / (adv.returnTime - adv.startTime)) * 100)
      })));
    }, 100);

    return () => clearInterval(interval);
  }, [adventurers.length]);

  if (adventurers.length === 0) {
    return (
      <div className="active-adventurers">
        <h4>Active Missions</h4>
        <div className="no-missions">No adventurers currently on missions</div>
      </div>
    );
  }

  return (
    <div className="active-adventurers">
      <h4>Active Missions ({adventurers.length})</h4>
      <div className="missions-list">
        {adventurers.map(adventurer => {
          const timeRemaining = Math.max(0, Math.ceil((adventurer.returnTime - Date.now()) / 1000));
          const minutes = Math.floor(timeRemaining / 60);
          const seconds = timeRemaining % 60;
          
          return (
            <div key={adventurer.id} className="mission-item">
              <div className="mission-header">
                <span className="adventurer-name">{adventurer.name}</span>
                <span className={`class-badge ${adventurer.class.toLowerCase()}`}>
                  {adventurer.class}
                </span>
              </div>
              
              <div className="mission-stats">
                <span className="success-rate">{adventurer.successRate}% success</span>
                <span className="time-remaining">
                  {timeRemaining > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : 'Returning...'}
                </span>
              </div>
              
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${adventurer.progress || 0}%` }}
                />
              </div>
              
              <div className="expected-loot">
                {adventurer.lootTable.map((item, index) => (
                  <span key={index} className="loot-preview">
                    {item.min}-{item.max} {item.material}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActiveAdventurers;