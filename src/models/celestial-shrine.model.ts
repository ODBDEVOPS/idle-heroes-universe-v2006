export type BlessingType = 'goldRush' | 'powerSurge' | 'skillFrenzy';

export interface Blessing {
  type: BlessingType;
  name: string;
  description: string;
  durationSeconds: number;
  cooldownSeconds: number;
  bonusMultiplier: number;
}

export interface ActiveBlessing {
  type: BlessingType;
  endTime: number; // timestamp
}

export interface BlessingCooldown {
    type: BlessingType;
    readyTime: number; // timestamp
}