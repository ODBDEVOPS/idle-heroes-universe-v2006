import { Mission } from '../models/mission.model';

export const ALL_MISSIONS: Mission[] = [
  {
    id: 'stage_progression',
    title: 'Frontier Pioneer',
    description: 'Advance through the stages to prove your strength and explore new territories.',
    icon: '🗺️',
    stat: 'stage',
    tiers: [
      { tier: 1, target: 50, reward: { gold: 10000 } },
      { tier: 2, target: 100, reward: { prestigePoints: 5 } },
      { tier: 3, target: 200, reward: { gold: 500000 } },
      { tier: 4, target: 350, reward: { prestigePoints: 25 } },
      { tier: 5, target: 500, reward: { enchantingDust: 100 } },
    ]
  },
  {
    id: 'hero_levels',
    title: 'Master Trainer',
    description: 'Accumulate total hero levels across your entire roster to show your dedication.',
    icon: '💪',
    stat: 'totalHeroLevels',
    tiers: [
      { tier: 1, target: 100, reward: { gold: 5000 } },
      { tier: 2, target: 500, reward: { skillTomes: 5 } },
      { tier: 3, target: 1000, reward: { gold: 100000 } },
      { tier: 4, target: 2500, reward: { skillTomes: 25 } },
      { tier: 5, target: 5000, reward: { prestigePoints: 50 } },
    ]
  },
  {
    id: 'gold_accumulation',
    title: 'Wealth & Power',
    description: 'Amass a great fortune to fund your ever-growing army and ambitions.',
    icon: '💰',
    stat: 'totalGoldEarned',
    tiers: [
        { tier: 1, target: 1e6, reward: { enchantingDust: 10 } },
        { tier: 2, target: 1e8, reward: { prestigePoints: 10 } },
        { tier: 3, target: 1e10, reward: { enchantingDust: 50 } },
        { tier: 4, target: 1e12, reward: { prestigePoints: 40 } },
        { tier: 5, target: 1e15, reward: { skillTomes: 50 } },
    ]
  },
  {
    id: 'prestige_ascension',
    title: 'Cycle of Rebirth',
    description: 'Embrace the cycle of prestige to grow your permanent power and reach new heights.',
    icon: '🌀',
    stat: 'totalPrestiges',
    tiers: [
        { tier: 1, target: 1, reward: { gold: 50000 } },
        { tier: 2, target: 3, reward: { skillTomes: 10 } },
        { tier: 3, target: 5, reward: { prestigePoints: 20 } },
        { tier: 4, target: 10, reward: { enchantingDust: 150 } },
        { tier: 5, target: 20, reward: { prestigePoints: 100 } },
    ]
  }
];
