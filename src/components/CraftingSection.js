// src/components/CraftingSection.js
import React, { useState, useImperativeHandle, forwardRef } from 'react';
import CraftingPolygon from './CraftingPolygon'; // Reuse your polygon visual
import { recipes } from '../services/CraftingRecipes'; // See below for this file
import { materialAttributes } from '../services/MaterialAttributes';

// Themed slot component
function Slot({ value, onClick, placeholder }) {
  return (
    <div
      onClick={onClick}
      style={{
        minWidth: 90,
        minHeight: 36,
        background: value
          ? 'linear-gradient(135deg, #d4af37 60%, #b8863b 100%)'
          : 'rgba(44,24,16,0.2)',
        border: value
          ? '2px solid #ffd700'
          : '2px dashed #8b5a2b',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: value ? '#2c1810' : '#cd853f',
        fontWeight: 'bold',
        fontSize: 15,
        margin: 4,
        cursor: 'pointer',
        boxShadow: value ? '0 2px 8px #d4af3740' : 'none',
        position: 'relative',
        transition: 'background 0.2s, border 0.2s',
      }}
      title={value ? 'Click to remove' : 'Click to fill'}
    >
      {value ? (
        <>
          {value}
          <span
            style={{
              marginLeft: 8,
              color: '#ff6b6b',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: 18,
            }}
            onClick={e => {
              e.stopPropagation();
              onClick('remove');
            }}
          >
            ✕
          </span>
        </>
      ) : (
        <span style={{ opacity: 0.7 }}>{placeholder}</span>
      )}
    </div>
  );
}

const CraftingSection = forwardRef(function CraftingSection({ inventory, onCraft }, ref) {
  const [selectedRecipe, setSelectedRecipe] = useState(recipes[0]);
  const [baseMaterials, setBaseMaterials] = useState(Array(selectedRecipe.baseSlots.length).fill(null));
  const [enhancements, setEnhancements] = useState(Array(selectedRecipe.enhancementSlots).fill(null));

  // Reset slots if recipe changes
  React.useEffect(() => {
    setBaseMaterials(Array(selectedRecipe.baseSlots.length).fill(null));
    setEnhancements(Array(selectedRecipe.enhancementSlots).fill(null));
  }, [selectedRecipe]);

  // Helper to get all used materials
  const usedMaterials = [...baseMaterials, ...enhancements].filter(Boolean);

  // Calculate attributes
  const attributes = usedMaterials.reduce(
    (acc, mat) => {
      const attr = materialAttributes[mat] || { strength: 0, speed: 0, magical: 0 };
      acc.strength += attr.strength;
      acc.speed += attr.speed;
      acc.magical += attr.magical;
      return acc;
    },
    { strength: 0, speed: 0, magical: 0 }
  );

  // Check if crafting is possible
  const canCraft =
    baseMaterials.every(Boolean) &&
    baseMaterials.every(mat => (inventory[mat] || 0) > 0) &&
    enhancements.every(mat => !mat || (inventory[mat] || 0) > 0);

  // Handle crafting
  const handleCraft = () => {
    if (!canCraft) return;
    // Build material list for onCraft
    const allMaterials = [...baseMaterials, ...enhancements].filter(Boolean);
    const materialCounts = {};
    allMaterials.forEach(mat => {
      materialCounts[mat] = (materialCounts[mat] || 0) + 1;
    });
    const mats = Object.entries(materialCounts).map(([name, amount]) => ({ name, amount }));
    onCraft(mats, selectedRecipe.name, attributes);
    // Reset slots
    setBaseMaterials(Array(selectedRecipe.baseSlots.length).fill(null));
    setEnhancements(Array(selectedRecipe.enhancementSlots).fill(null));
  };

  // Allow parent to fill slots by inventory click
  useImperativeHandle(ref, () => ({
    fillNextSlot: (material) => {
      // Try to fill base slots first
      const baseIdx = baseMaterials.findIndex(x => !x);
      if (baseIdx !== -1) {
        setBaseMaterials(arr => {
          const copy = [...arr];
          copy[baseIdx] = material;
          return copy;
        });
        return;
      }
      // Then enhancement slots
      const enhIdx = enhancements.findIndex(x => !x);
      if (enhIdx !== -1) {
        setEnhancements(arr => {
          const copy = [...arr];
          copy[enhIdx] = material;
          return copy;
        });
      }
    }
  }), [baseMaterials, enhancements]);

  return (
    <div style={{
      background: 'rgba(44,24,16,0.4)',
      border: '1px solid #8b5a2b',
      borderRadius: 10,
      padding: 16,
      marginBottom: 24,
      width: '100%',
      maxWidth: 420,
      textAlign: 'left',
      boxShadow: '0 2px 12px #0004',
    }}>
      <h3 style={{ color: '#d4af37', marginTop: 0 }}>Craft Gear</h3>
      <div style={{ marginBottom: 12 }}>
        <label>
          <b>Recipe:</b>
          <select
            value={selectedRecipe.name}
            onChange={e => setSelectedRecipe(recipes.find(r => r.name === e.target.value))}
            style={{ marginLeft: 8 }}
          >
            {recipes.map(r => (
              <option key={r.name} value={r.name}>{r.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <b>Base Materials:</b>
        <div style={{ display: 'flex', gap: 8 }}>
          {selectedRecipe.baseSlots.map((slot, idx) => (
            <Slot
              key={idx}
              value={baseMaterials[idx]}
              placeholder={`Slot ${idx + 1} (${slot.type})`}
              onClick={action => {
                if (action === 'remove') {
                  setBaseMaterials(arr => {
                    const copy = [...arr];
                    copy[idx] = null;
                    return copy;
                  });
                }
              }}
            />
          ))}
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <b>Enhancements:</b>
        <div style={{ display: 'flex', gap: 8 }}>
          {Array.from({ length: selectedRecipe.enhancementSlots }).map((_, idx) => (
            <Slot
              key={idx}
              value={enhancements[idx]}
              placeholder={`Enhance ${idx + 1}`}
              onClick={action => {
                if (action === 'remove') {
                  setEnhancements(arr => {
                    const copy = [...arr];
                    copy[idx] = null;
                    return copy;
                  });
                }
              }}
            />
          ))}
        </div>
      </div>
      <div style={{ margin: '16px 0' }}>
        <b>Attributes:</b>
        <CraftingPolygon attributes={attributes} />
      </div>
      <button
        onClick={handleCraft}
        disabled={!canCraft}
        style={{
          background: canCraft ? 'linear-gradient(90deg,#ffd700 60%,#d4af37 100%)' : '#8b5a2b',
          color: '#2c1810',
          border: 'none',
          borderRadius: 10,
          padding: '12px 0',
          fontWeight: 'bold',
          fontSize: 18,
          cursor: canCraft ? 'pointer' : 'not-allowed',
          marginTop: 12,
          boxShadow: canCraft ? '0 2px 8px #d4af3740' : 'none',
          width: '100%',
          letterSpacing: 1,
          transition: 'all 0.2s',
        }}
      >
        Craft
      </button>
    </div>
  );
});

export default CraftingSection;
