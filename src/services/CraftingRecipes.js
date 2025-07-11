// src/services/CraftingRecipes.js

export const craftingStations = {
  forge: {
    name: "Forge",
    recipes: [
      {
        output: "Iron Sword",
        materials: [
          { name: "iron", amount: 2 },
          { name: "wood", amount: 1 }
        ],
        craftTime: 15 // seconds
      },
      {
        output: "Steel Dagger", 
        materials: [
          { name: "steel", amount: 1 },
          { name: "leather", amount: 1 }
        ],
        craftTime: 10
      },
      {
        output: "Silver Ring",
        materials: [
          { name: "silver", amount: 1 },
          { name: "gems", amount: 1 }
        ],
        craftTime: 25
      }
    ]
  },
  
  alchemy: {
    name: "Alchemy Lab",
    recipes: [
      {
        output: "Magic Potion",
        materials: [
          { name: "herbs", amount: 2 },
          { name: "crystal", amount: 1 }
        ],
        craftTime: 20
      },
      {
        output: "Healing Salve",
        materials: [
          { name: "herbs", amount: 1 },
          { name: "oil", amount: 1 }
        ],
        craftTime: 8
      },
      {
        output: "Fire Scroll",
        materials: [
          { name: "parchment", amount: 1 },
          { name: "ember", amount: 1 }
        ],
        craftTime: 12
      }
    ]
  },

  workshop: {
    name: "Workshop",
    recipes: [
      {
        output: "Leather Armor",
        materials: [
          { name: "leather", amount: 3 },
          { name: "thread", amount: 2 }
        ],
        craftTime: 30
      },
      {
        output: "Enchanted Staff",
        materials: [
          { name: "wood", amount: 2 },
          { name: "crystal", amount: 1 },
          { name: "gems", amount: 1 }
        ],
        craftTime: 45
      }
    ]
  }
};