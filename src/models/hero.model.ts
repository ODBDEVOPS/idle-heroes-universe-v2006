// FIX: Import Rarity from equipment.model.ts to break circular dependency.
import { EquipmentItem, EquipmentSlot, Rarity } from './equipment.model';

export type Role = 'Tank' | 'DPS' | 'Support' | 'Assassin' | 'Controller' | 'Bruiser' | 'Marksman' | 'Mage' | 'Healer' | 'Démoniste' | 'Shaman' | 'Mangas Hero' | 'Video game Hero';

export interface HeroStats {
  totalDamageDealt: number;
  skillsUsed: number;
}

export interface Hero {
  id: number;
  name: string;
  level: number;
  baseDps: number;
  baseHp: number;
  baseCost: number;
  upgradeCostMultiplier: number;
  rarity: Rarity;
  role: Role;
  baseClass: string; // New property for Specializations
  skillDescription: string;
  lore: string;
  currentDps: number;
  maxHp: number;
  currentHp: number;
  nextLevelCost: number;
  equipment: Record<EquipmentSlot, EquipmentItem | null>;
  skillCharge: number;
  skillReady: boolean;
  isFavorite?: boolean;
  // XP System
  currentXp: number;
  xpToNextLevel: number;
  offlineXp: number;
  // New Stats
  stats?: HeroStats;
  positionalModifier?: number;
  ascensionLevel: number;
  skillLevel: number;
}