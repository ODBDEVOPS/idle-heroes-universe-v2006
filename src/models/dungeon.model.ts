// FIX: Import Rarity from equipment.model.ts to break circular dependency.
import { Rarity } from './equipment.model';

export type DungeonDifficulty = 'Normal' | 'Hard' | 'Nightmare';

export interface DungeonDifficultyStats {
  stageRequirement: number;
  durationSeconds: number;
  cost?: { gold?: number; prestigePoints?: number };
  rewards: {
    gold: number;
    dungeonCrests: number;
    petCrystals?: number;
    equipmentDrop: { chance: number; rarity: Rarity; };
    petEggDrop?: { chance: number };
  };
}

export interface Dungeon {
  id: number;
  name: string;
  description: string;
  difficulties: Record<DungeonDifficulty, DungeonDifficultyStats>;
}

export interface DungeonBounty {
    id: number;
    name: string;
    description: string;
    durationSeconds: number;
    requiredHeroCount: number;
    rewards: {
        dungeonCrests: number;
        gold: number;
        petCrystals?: number;
        essenceOfLoyalty?: { chance: number, amount: number };
    };
}

export interface DungeonShopItem {
    id: number;
    name: string;
    description: string;
    cost: number; // Dungeon Crests
    stock?: number; // Optional: for items with limited purchases per prestige
    isSoldOut: (gameService: any) => boolean;
    purchase: (gameService: any) => boolean; // Returns true on success
}