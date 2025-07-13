import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Simple color map for demo
const materialColors = {
  iron: '#b0b0b0',
  wood: '#a67c52',
  leather: '#8b5a2b',
  crystal: '#a855f7',
  herbs: '#4ecdc4',
  gems: '#ffd700',
  // ...add more as needed
};

const demoMaterials = Object.keys(materialColors);

function getOrbPosition(index, total, radius = 60) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

export default function AnimatedCraftingStation() {
  const [queue, setQueue] = useState([]);
  const [crafting, setCrafting] = useState(false);
  const [crafted, setCrafted] = useState(false);

  // Add a random material for demo
  const addMaterial = () => {
    const mat = demoMaterials[Math.floor(Math.random() * demoMaterials.length)];
    setQueue(q => [...q, { name: mat, id: Math.random() }]);
    setCrafted(false);
  };

  // Animate crafting
  const handleCraft = () => {
    setCrafting(true);
    setTimeout(() => {
      setCrafting(false);
      setQueue([]);
      setCrafted(true);
    }, 1200);
  };

  return (
    <div style={{ textAlign: 'center', margin: 40 }}>
      <h3>Animated Crafting Demo</h3>
      <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto' }}>
        {/* Anvil SVG */}
        <svg width={80} height={80} style={{ position: 'absolute', left: 70, top: 70, zIndex: 2 }}>
          <ellipse cx="40" cy="60" rx="30" ry="10" fill="#2c1810" opacity={0.7} />
          <rect x="20" y="40" width="40" height="20" rx="6" fill="#8b5a2b" />
          <rect x="30" y="30" width="20" height="10" rx="3" fill="#d4af37" />
        </svg>

        {/* Orbs */}
        <AnimatePresence>
          {queue.map((mat, i) => {
            const { x, y } = getOrbPosition(i, queue.length);
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
                  left: 100,
                  top: 100,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: materialColors[mat.name] || '#fff',
                  border: '2px solid #d4af37',
                  zIndex: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: '#2c1810',
                  fontSize: 13,
                  boxShadow: '0 2px 8px #0006',
                }}
              >
                {mat.name[0].toUpperCase()}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Press */}
        <motion.div
          initial={false}
          animate={crafting ? { y: 60, opacity: 1 } : { y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'absolute',
            left: 90,
            top: 0,
            width: 40,
            height: 60,
            background: '#d4af37',
            borderRadius: 8,
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
                left: 90,
                top: 90,
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#ffd700',
                color: '#2c1810',
                fontWeight: 'bold',
                fontSize: 18,
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
      <div style={{ marginTop: 24 }}>
        <button onClick={addMaterial} style={{ marginRight: 10 }}>
          Add Material
        </button>
        <button onClick={handleCraft} disabled={queue.length === 0 || crafting}>
          {crafting ? 'Crafting...' : 'Craft'}
        </button>
      </div>
    </div>
  );
}
