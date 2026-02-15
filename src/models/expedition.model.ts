import { Hero, Role } from './hero.model';
// FIX: Import Rarity from equipment.model.ts to break circular dependency.
import { Rarity } from './equipment.model';

export interface ExpeditionReward {
  gold: number;
  prestigePoints?: number;
  equipmentDrop?: {
    chance: number; // 0 to 1
    rarity: 'Common' | 'Rare' | 'Epic';
  }
}

export interface ExpeditionRequirements {
  minHeroes: number;
  roles?: { role: Role, count: number }[];
  minTotalLevel?: number;
}

export interface Expedition {
  id: number;
  name: string;
  description: string;
  durationSeconds: number; 
  requirements: ExpeditionRequirements;
  rewards: ExpeditionReward;
}

export interface OngoingExpedition {
  expeditionId: number;
  heroIds: number[];
  startTime: number; // timestamp
  completionTime: number; // timestamp
}

export interface OngoingExpeditionWithDetails extends OngoingExpedition {
    details: Expedition;
    remainingSeconds: number;
    heroes: Hero[];
}