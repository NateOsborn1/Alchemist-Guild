import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { materialAttributes, calculateCraftingAttributes } from '../services/MaterialAttributes';
import CraftingPolygon from './CraftingPolygon';

// Helper for orb positions
function getOrbPosition(index, total, radius = 60) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

export default function AnimatedCraftingStation({ inventory, onCraft, onAddMaterial, lastCraftedItem }) {
  const [queue, setQueue] = useState([]);
  const [crafting, setCrafting] = useState(false);
  const [crafted, setCrafted] = useState(false);

  // Add material to queue (if available in inventory)
  const addMaterial = (mat) => {
    if ((inventory[mat] || 0) <= queue.filter(q => q.name === mat).length) return;
    setQueue(q => [...q, { name: mat, id: Math.random() }]);
    setCrafted(false);
  };

  // Remove material from queue
  const removeMaterial = (id) => {
    setQueue(q => q.filter(mat => mat.id !== id));
  };

  // Clear queue
  const clearQueue = () => setQueue([]);

  // Animate crafting
  const handleCraft = () => {
    if (queue.length === 0) return;
    setCrafting(true);
    setTimeout(() => {
      setCrafting(false);
      setQueue([]);
      setCrafted(true);
      // Call real crafting logic
      if (onCraft) {
        // Convert queue to [{name, amount}]
        const matCounts = {};
        queue.forEach(q => { matCounts[q.name] = (matCounts[q.name] || 0) + 1; });
        const mats = Object.entries(matCounts).map(([name, amount]) => ({ name, amount }));
        onCraft(mats);
      }
    }, 1200);
  };

  // Calculate attributes for polygon
  const matCounts = {};
  queue.forEach(q => { matCounts[q.name] = (matCounts[q.name] || 0) + 1; });
  const matsForPolygon = Object.entries(matCounts).map(([name, amount]) => ({ name, amount }));
  const attributes = calculateCraftingAttributes(matsForPolygon);

  // Can craft if all materials are available
  const canCraft = queue.length > 0 && queue.every(q =>
    (inventory[q.name] || 0) >= queue.filter(x => x.name === q.name).length
  );

  // Material color map
  const materialColors = {};
  Object.keys(materialAttributes).forEach(mat => {
    // Use a color based on attribute focus
    const attr = materialAttributes[mat];
    if (attr.strength >= attr.speed && attr.strength >= attr.magical) materialColors[mat] = '#b0b0b0';
    else if (attr.speed >= attr.strength && attr.speed >= attr.magical) materialColors[mat] = '#4ecdc4';
    else materialColors[mat] = '#a855f7';
  });

  // Expose addMaterial for parent
  React.useEffect(() => {
    if (onAddMaterial) onAddMaterial(addMaterial);
    // eslint-disable-next-line
  }, [onAddMaterial, inventory, queue]);

  return (
    <div style={{ textAlign: 'center', margin: 0, padding: 0 }}>
      <h3 style={{ color: '#d4af37', marginBottom: 10 }}>Crafting Station</h3>
      <div style={{
        position: 'relative',
        width: 260,
        height: 220,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Orbs */}
        <AnimatePresence>
          {queue.map((mat, i) => {
            const { x, y } = getOrbPosition(i, queue.length, 70);
            return (
              <motion.div
                key={mat.id}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={
                  crafting
                    ? { x: 0, y: 0, opacity: 0 }
                    : { x, y, opacity: 1 }
                }
                exit={{ x: 0, y: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{
                  position: 'absolute',
                  left: 110,
                  top: 90,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: materialColors[mat.name] || '#fff',
                  border: '2px solid #d4af37',
                  zIndex: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: '#2c1810',
                  fontSize: 15,
                  boxShadow: '0 2px 8px #0006',
                  cursor: 'pointer',
                }}
                onClick={() => removeMaterial(mat.id)}
                title={`Remove ${mat.name}`}
              >
                {mat.name[0].toUpperCase()}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Anvil SVG */}
        <svg width={90} height={90} style={{ position: 'absolute', left: 85, top: 70, zIndex: 2 }}>
          <ellipse cx="45" cy="70" rx="34" ry="12" fill="#2c1810" opacity={0.7} />
          <rect x="20" y="45" width="50" height="25" rx="8" fill="#8b5a2b" />
          <rect x="35" y="30" width="20" height="12" rx="4" fill="#d4af37" />
        </svg>

        {/* Press */}
        <motion.div
          initial={false}
          animate={crafting ? { y: 80, opacity: 1 } : { y: -120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'absolute',
            left: 80,
            top: 0,
            width: 100,
            height: 80,
            background: '#d4af37',
            borderRadius: 16,
            zIndex: 10,
            boxShadow: '0 4px 16px #0008',
          }}
        />

        {/* Crafted item pop */}
        <AnimatePresence>
          {crafted && lastCraftedItem && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{
                position: 'absolute',
                left: 105,
                top: 105,
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#ffd700',
                color: '#2c1810',
                fontWeight: 'bold',
                fontSize: 18,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                boxShadow: '0 2px 12px #0008',
              }}
            >
              <span style={{ fontSize: 16 }}>{lastCraftedItem.name}</span>
              <span style={{
                fontSize: 12,
                color: lastCraftedItem.quality === 'Rare' ? '#a855f7'
                      : lastCraftedItem.quality === 'Uncommon' ? '#4ecdc4'
                      : '#d4af37',
                marginTop: 2,
              }}>
                {lastCraftedItem.quality}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Polygon visualization */}
      {queue.length > 0 && (
        <div style={{ margin: '20px auto 0 auto', maxWidth: 220 }}>
          <CraftingPolygon attributes={attributes} />
        </div>
      )}

      {/* Craft Button */}
      <div style={{ marginTop: 18 }}>
        <button
          onClick={handleCraft}
          disabled={!canCraft || crafting}
          style={{
            background: canCraft ? '#d4af37' : '#8b5a2b',
            color: '#2c1810',
            border: 'none',
            borderRadius: 8,
            padding: '10px 32px',
            fontWeight: 'bold',
            fontSize: 16,
            cursor: canCraft && !crafting ? 'pointer' : 'not-allowed',
            marginTop: 8,
            boxShadow: canCraft ? '0 2px 8px #d4af3740' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {crafting ? 'Crafting...' : 'Craft'}
        </button>
      </div>
    </div>
  );
}
