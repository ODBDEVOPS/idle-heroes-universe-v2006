import { Material } from './material.model';

export type NecroConstructBonusType = 'dpsPercentTank' | 'goldDropPercent' | 'skillChargeRate';

export interface NecroConstruct {
  id: string;
  name: string;
  icon: string;
  description: string;
  bonusType: NecroConstructBonusType;
  bonusValue: number; // The bonus for a single construct
}

export interface NecroConstructRecipe {
  constructId: string;
  materials: Record<string, number>; // materialId -> quantity
}

export const ALL_NECRO_CONSTRUCTS: NecroConstruct[] = [
  { id: 'construct_bone_golem', name: 'Bone Golem', icon: '💀', description: '+5% DPS for all Tank heroes.', bonusType: 'dpsPercentTank', bonusValue: 0.05 },
  { id: 'construct_soul_wraith', name: 'Soul-Stitched Wraith', icon: '👻', description: '+2% Gold from all sources.', bonusType: 'goldDropPercent', bonusValue: 0.02 },
  { id: 'construct_abyssal_watcher', name: 'Abyssal Watcher', icon: '👁️', description: 'Hero skills charge 1% faster.', bonusType: 'skillChargeRate', bonusValue: 0.01 },
];

export const ALL_NECRO_RECIPES: NecroConstructRecipe[] = [
    { constructId: 'construct_bone_golem', materials: { 'stone': 50, 'strange_dust': 10 } },
    { constructId: 'construct_soul_wraith', materials: { 'silk_cloth': 25, 'soul_air': 5 } },
    { constructId: 'construct_abyssal_watcher', materials: { 'obsidian_chunk': 5, 'geode_soul': 1 } },
];
