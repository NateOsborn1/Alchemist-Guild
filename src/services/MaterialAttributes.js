// src/services/MaterialAttributes.js

// Material attributes: Strength, Speed, Magical
export const materialAttributes = {
  // Metals (Strength-focused)
  copper: { strength: 3, speed: 1, magical: 0, cost: 3, tier: 'basic' },
  iron: { strength: 5, speed: 2, magical: 0, cost: 5, tier: 'basic' },
  steel: { strength: 8, speed: 3, magical: 0, cost: 8, tier: 'advanced' },
  silver: { strength: 4, speed: 2, magical: 6, cost: 25, tier: 'premium' },
  
  // Organic materials (Speed-focused)
  wood: { strength: 2, speed: 4, magical: 1, cost: 3, tier: 'basic' },
  leather: { strength: 3, speed: 5, magical: 1, cost: 6, tier: 'basic' },
  thread: { strength: 1, speed: 6, magical: 2, cost: 2, tier: 'basic' },
  herbs: { strength: 1, speed: 3, magical: 4, cost: 4, tier: 'basic' },
  
  // Magical materials (Magical-focused)
  crystal: { strength: 2, speed: 2, magical: 7, cost: 15, tier: 'advanced' },
  oil: { strength: 1, speed: 4, magical: 3, cost: 7, tier: 'basic' },
  parchment: { strength: 1, speed: 3, magical: 5, cost: 5, tier: 'basic' },
  ember: { strength: 3, speed: 2, magical: 8, cost: 12, tier: 'advanced' },
  gems: { strength: 1, speed: 1, magical: 9, cost: 30, tier: 'premium' }
};

// Calculate total attributes from a list of materials
export const calculateCraftingAttributes = (materials) => {
  let totalStrength = 0;
  let totalSpeed = 0;
  let totalMagical = 0;
  
  materials.forEach(({ name, amount }) => {
    const attributes = materialAttributes[name];
    if (attributes) {
      totalStrength += attributes.strength * amount;
      totalSpeed += attributes.speed * amount;
      totalMagical += attributes.magical * amount;
    }
  });
  
  return {
    strength: totalStrength,
    speed: totalSpeed,
    magical: totalMagical,
    total: totalStrength + totalSpeed + totalMagical
  };
};

// Get material tier color
export const getTierColor = (tier) => {
  switch (tier) {
    case 'basic': return '#8b5a2b';
    case 'advanced': return '#d4af37';
    case 'premium': return '#ffd700';
    default: return '#8b5a2b';
  }
};

// Get attribute color
export const getAttributeColor = (attribute) => {
  switch (attribute) {
    case 'strength': return '#ff6b6b'; // Red
    case 'speed': return '#4ecdc4';    // Teal
    case 'magical': return '#a855f7';  // Purple
    default: return '#f4e4bc';
  }
}; 