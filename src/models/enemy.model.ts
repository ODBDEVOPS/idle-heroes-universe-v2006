export type EnemyType = 'Normal' | 'Armored' | 'Swift' | 'Hoarder' | 'Boss' | 'Caster' | 'Squad' | 'Minerals' | 'Flora' | 'Fauna' | 'Aquatic';

export interface Enemy {
  name: string;
  maxHp: number;
  currentHp: number;
  asciiArt: string;
  goldReward: number;
  isBoss: boolean; 
  type: EnemyType;
  damageReduction?: number;
  // New properties for abilities
  activeEffects?: { type: 'harden' | 'weaken', expiration: number }[];
  isFrenzied?: boolean;
  lastAbilityUse?: Record<string, number>;
}

export interface CodexMonster {
  type: EnemyType;
  name: string;
  description: string;
  asciiArt: string; // A representative art
  strengths?: string;
  weaknesses?: string;
  habitat: string;
}

// -- For Dimensional Rift --
export interface Anomaly {
  id: 'regenerating' | 'hardened' | 'dampening';
  name: string;
  description: string;
  icon: string;
}

export interface RiftEnemy extends Enemy {
  anomalies: Anomaly[];
  isElite?: boolean;
}