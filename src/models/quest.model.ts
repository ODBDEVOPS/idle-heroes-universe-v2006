// FIX: Import Rarity from equipment.model.ts to break circular dependency.
import { Rarity } from "./equipment.model";

export type QuestCategory = 'Main Story' | 'Daily' | 'Weekly' | 'Achievements';

export type QuestType = 
  'reachStage' | 
  'levelUpHero' | 
  'defeatEnemies' | 
  'summonHero' | 
  'forgeRarity' |
  'earnGold' |
  'useSkills' |
  'clickCount' |
  'prestigeCount' |
  'unlockHeroCount' |
  'unlockHeroRarity' |
  'completeDungeons' |
  'completeExpeditions' |
  'claimSponsorGold' |
  'clearTowerFloor' |
  'fieldHeroes' |
  'levelUpMultipleHeroes' |
  'forgeAnyItem';

export interface Quest {
  id: number;
  description: string;
  type: QuestType;
  target: number | Rarity | { level: number; count: number };
  category: QuestCategory;
  reward: { 
    gold: number; 
    prestigePoints?: number 
  };
  isCompleted: boolean;
  isClaimed: boolean;
}