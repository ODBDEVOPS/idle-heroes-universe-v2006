export interface MissionReward {
  gold?: number;
  prestigePoints?: number;
  enchantingDust?: number;
  skillTomes?: number;
}

export interface MissionTier {
  tier: number;
  target: number;
  reward: MissionReward;
}

export type MissionStat = 'stage' | 'totalHeroLevels' | 'totalGoldEarned' | 'totalPrestiges';

export interface Mission {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  stat: MissionStat;
  tiers: MissionTier[];
}
