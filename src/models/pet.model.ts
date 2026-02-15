// FIX: Import Rarity from equipment.model.ts to break circular dependency.
import { Rarity } from './equipment.model';

export type PetBonusType = 
  'goldDropPercent' | 
  'dpsPercent' | 
  'clickDamagePercent' |
  'skillChargeRate' |
  'prestigePointPercent' |
  'chestChancePercent' |
  'dungeonSpeedPercent' |
  'expeditionSpeedPercent';

export interface Pet {
  id: number;
  name: string;
  rarity: Rarity;
  bonusType: PetBonusType;
  baseBonus: number;
  bonusPerLevel: number;
  description: string;
  lore: string;
  art: string;
  ascendedArt?: string;
  evolutionCostEssence?: number;
}

export interface PlayerPet {
  petId: number;
  level: number;
  isEquipped: boolean;
  ascensionLevel: number;
}