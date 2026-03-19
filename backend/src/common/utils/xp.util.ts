// XP needed to reach each level: level 1 = 1000, level 2 = 2200, ...
// Formula: base * level * 1.2 (increases as levels go up)
export const getXpForLevel = (level: number): number => {
  return Math.floor(1000 * level * 1.2);
};

// Given total XP, return { level, xp (in current level), xpToNextLevel }
export const calculateLevel = (
  totalXp: number,
): {
  level: number;
  xp: number;
  xpToNextLevel: number;
} => {
  let level = 1;
  let remainingXp = totalXp;

  while (true) {
    const xpNeeded = getXpForLevel(level);
    if (remainingXp < xpNeeded) break;
    remainingXp -= xpNeeded;
    level++;
  }

  return {
    level,
    xp: remainingXp,
    xpToNextLevel: getXpForLevel(level),
  };
};
