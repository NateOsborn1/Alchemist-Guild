// src/services/NameGenerator.js

const firstNames = [
  "Aiden", "Bryn", "Cael", "Dara", "Eira", "Finn", "Gwen", "Hale", "Iris", "Jace",
  "Kai", "Luna", "Mira", "Nova", "Owen", "Pax", "Quinn", "Raven", "Sage", "Tara",
  "Uma", "Vale", "Wren", "Xara", "Yara", "Zara", "Ash", "Blade", "Cinder", "Dawn",
  "Echo", "Flame", "Gale", "Hawk", "Ivy", "Jade", "Kestrel", "Lark", "Mist", "Nyx"
];

const lastNames = [
  "Shadow", "Storm", "Stone", "Swift", "Thorn", "Vale", "Wind", "Wolf", "Wraith", "Wyrm",
  "Iron", "Gold", "Silver", "Crystal", "Ember", "Frost", "Light", "Night", "Star", "Sun",
  "Blade", "Bow", "Shield", "Staff", "Wand", "Axe", "Hammer", "Spear", "Dagger", "Sword",
  "Raven", "Hawk", "Eagle", "Falcon", "Owl", "Phoenix", "Dragon", "Wolf", "Bear", "Lion"
];

export function generateName() {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
} 