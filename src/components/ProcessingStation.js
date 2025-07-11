// src/components/ProcessingStation.js
import React, { useState, useEffect } from 'react';
import './ProcessingStation.css';

const ProcessingStation = ({ 
  stationType, 
  recipes, 
  inventory, 
  onStartCrafting, 
  onCompleteCrafting 
}) => {
  const [activeJobs, setActiveJobs] = useState([]);

  // Check for completed jobs every second
  useEffect(() => {
    if (activeJobs.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      
      setActiveJobs(prevJobs => {
        const completed = prevJobs.filter(job => now >= job.completionTime);
        const remaining = prevJobs.filter(job => now < job.completionTime);
        
        // Process completed jobs
        completed.forEach(job => {
          console.log(`Completing craft: ${job.quantity}x ${job.recipe.output}`);
          onCompleteCrafting(job.recipe.output, job.quantity);
        });
        
        return remaining;
      });
    }, 500); // Check more frequently

    return () => clearInterval(interval);
  }, [activeJobs.length, onCompleteCrafting]);

  const canCraft = (recipe, quantity = 1) => {
    return recipe.materials.every(material => {
      const required = material.amount * quantity;
      const available = inventory[material.name] || 0;
      return available >= required;
    });
  };

  const startCrafting = (recipe, quantity = 1) => {
    if (!canCraft(recipe, quantity)) return;

    // Consume materials
    onStartCrafting(recipe, quantity);

    // Add to active jobs
    const newJob = {
      id: Date.now(),
      recipe,
      quantity,
      startTime: Date.now(),
      completionTime: Date.now() + (recipe.craftTime * 1000),
      progress: 0
    };

    setActiveJobs(prev => [...prev, newJob]);
  };

  // Update progress for active jobs
  useEffect(() => {
    if (activeJobs.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setActiveJobs(prev => prev.map(job => ({
        ...job,
        progress: Math.min(100, ((now - job.startTime) / (job.completionTime - job.startTime)) * 100)
      })));
    }, 100);

    return () => clearInterval(interval);
  }, [activeJobs.length]);

  return (
    <div className="processing-station">
      <h4>{stationType} Station</h4>
      
      <div className="recipes-list">
        {recipes.map(recipe => {
          const canMake = canCraft(recipe);
          const finishedCount = inventory[recipe.output] || 0;
          
          return (
            <div key={recipe.output} className="recipe-item">
              <div className="recipe-info">
                <div className="recipe-name">{recipe.output}</div>
                <div className="recipe-time">{recipe.craftTime}s</div>
                <div className="recipe-stock">Stock: {finishedCount}</div>
              </div>
              
              <div className="recipe-materials">
                {recipe.materials.map(mat => (
                  <span 
                    key={mat.name} 
                    className={`material ${(inventory[mat.name] || 0) >= mat.amount ? 'available' : 'insufficient'}`}
                  >
                    {mat.amount}x {mat.name}
                  </span>
                ))}
              </div>
              
              <button 
                className={`craft-button ${canMake ? 'can-craft' : 'cannot-craft'}`}
                onClick={() => startCrafting(recipe)}
                disabled={!canMake}
              >
                Craft
              </button>
            </div>
          );
        })}
      </div>

      <div className="active-jobs">
        <h5>Crafting Queue</h5>
        {activeJobs.length === 0 ? (
          <div className="no-jobs">No items crafting</div>
        ) : (
          activeJobs.map(job => (
            <div key={job.id} className="job-item">
              <div className="job-info">
                <span>{job.quantity}x {job.recipe.output}</span>
                <span className="job-time">
                  {Math.max(0, Math.ceil((job.completionTime - Date.now()) / 1000))}s remaining
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProcessingStation;