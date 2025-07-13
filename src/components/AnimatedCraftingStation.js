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

export default function AnimatedCraftingStation({ inventory, onCraft }) {
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

  return (
    <div style={{ textAlign: 'center', margin: 20 }}>
      <h3 style={{ color: '#d4af37', marginBottom: 10 }}>Crafting Station</h3>
      <div style={{ position: 'relative', width: 240, height: 240, margin: '0 auto' }}>
        {/* Anvil SVG */}
        <svg width={90} height={90} style={{ position: 'absolute', left: 75, top: 75, zIndex: 2 }}>
          <ellipse cx="45" cy="70" rx="34" ry="12" fill="#2c1810" opacity={0.7} />
          <rect x="20" y="45" width="50" height="25" rx="8" fill="#8b5a2b" />
          <rect x="35" y="30" width="20" height="12" rx="4" fill="#d4af37" />
        </svg>

        {/* Orbs */}
        <AnimatePresence>
          {queue.map((mat, i) => {
            const { x, y } = getOrbPosition(i, queue.length, 75);
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
                  left: 120,
                  top: 120,
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

        {/* Press */}
        <motion.div
          initial={false}
          animate={crafting ? { y: 80, opacity: 1 } : { y: -120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'absolute',
            left: 70,
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
          {crafted && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{
                position: 'absolute',
                left: 110,
                top: 110,
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#ffd700',
                color: '#2c1810',
                fontWeight: 'bold',
                fontSize: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                boxShadow: '0 2px 12px #0008',
              }}
            >
              ★
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

      {/* Material grid */}
      <div style={{ margin: '18px 0 0 0' }}>
        <div style={{ color: '#cd853f', fontWeight: 'bold', marginBottom: 6 }}>Add Materials</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
          gap: 8,
          maxWidth: 400,
          margin: '0 auto'
        }}>
          {Object.entries(inventory)
            .filter(([key]) => key !== 'gold' && materialAttributes[key])
            .map(([mat, amount]) => (
              <div
                key={mat}
                style={{
                  background: '#2c1810',
                  border: '1px solid #8b5a2b',
                  borderRadius: 8,
                  padding: 8,
                  color: '#f4e4bc',
                  opacity: amount <= queue.filter(q => q.name === mat).length ? 0.4 : 1,
                  cursor: amount <= queue.filter(q => q.name === mat).length ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: 13,
                  textAlign: 'center',
                  userSelect: 'none',
                }}
                onClick={() => addMaterial(mat)}
                title={amount > 0 ? `Add ${mat}` : 'Out of stock'}
              >
                {mat.charAt(0).toUpperCase() + mat.slice(1)}<br />
                <span style={{ color: '#ffd700' }}>{amount - queue.filter(q => q.name === mat).length}</span>
              </div>
            ))}
        </div>
        {queue.length > 0 && (
          <button
            onClick={clearQueue}
            style={{
              marginTop: 10,
              background: '#8b5a2b',
              color: '#f4e4bc',
              border: 'none',
              borderRadius: 6,
              padding: '6px 18px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Clear All
          </button>
        )}
      </div>
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
