// src/services/ClassPerks.js

export const classPerks = {
  miner: {
    name: "Miner",
    perks: {
      success: "If successful: Earn 50% more gold from ore deposits",
      failure: "If failure: Higher chance to drop valuable gems",
      wealth: "Wealthy miners carry expensive mining tools that fetch high prices when recovered"
    }
  },
  ranger: {
    name: "Ranger",
    perks: {
      success: "If successful: Higher chance to find rare herbs and materials",
      failure: "If failure: May drop enchanted arrows or tracking gear",
      wealth: "Wealthy rangers carry masterwork bows and leather armor"
    }
  },
  mage: {
    name: "Mage",
    perks: {
      success: "If successful: May return with enchanted items or spell scrolls",
      failure: "If failure: Magic items may survive and be recovered",
      wealth: "Wealthy mages carry expensive spell components and enchanted robes"
    }
  },
  rogue: {
    name: "Rogue",
    perks: {
      success: "If successful: May steal additional valuable items",
      failure: "If failure: Hidden pockets may contain stolen goods",
      wealth: "Wealthy rogues carry fine daggers and lockpicking tools"
    }
  },
  warrior: {
    name: "Warrior",
    perks: {
      success: "If successful: May return with enemy weapons and armor",
      failure: "If failure: Battle-worn equipment may still be valuable",
      wealth: "Wealthy warriors carry masterwork weapons and heavy armor"
    }
  }
};

export const getClassPerk = (className, type) => {
  const classData = classPerks[className.toLowerCase()];
  if (!classData) return "Class-specific abilities unknown";
  return classData.perks[type] || "No special ability";
};

export const getWealthBasedPerk = (className, wealth) => {
  const classData = classPerks[className.toLowerCase()];
  if (!classData) return "Carries standard equipment";
  
  if (wealth >= 70) {
    return classData.perks.wealth;
  } else if (wealth >= 40) {
    return "Carries decent quality equipment";
  } else {
    return "Carries basic equipment";
  }
}; 