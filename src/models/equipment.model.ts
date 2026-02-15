// FIX: Moved Rarity here to break circular dependency with hero.model.ts
export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export type EquipmentSlot = 'Weapon' | 'Armor' | 'Accessory';

export type EquipmentBonusType = 'dpsFlat' | 'dpsPercent' | 'goldDropPercent' | 'clickDamageFlat';

export interface EquipmentItem {
  id: number;
  name: string;
  slot: EquipmentSlot;
  bonusType: EquipmentBonusType;
  bonusValue: number;
  baseBonusValue: number;
  enchantLevel: number;
  rarity: Rarity;
  lore: string;
  set?: string; // e.g., 'warriors_regalia'
}

export interface SetBonus {
  threshold: number; // e.g., 2 pieces
  description: string;
  bonus: {
    type: 'dpsPercent' | 'goldDropPercent' | 'clickDamagePercent' | 'skillChargeRate';
    value: number;
  };
}

export interface EquipmentSet {
  id: string; // e.g., 'warriors_regalia'
  name: string;
  bonuses: SetBonus[];
}

export const ALL_EQUIPMENT_SETS: EquipmentSet[] = [
  {
    id: 'warriors_regalia',
    name: "Warrior's Regalia",
    bonuses: [
      {
        threshold: 2,
        description: '+10% DPS',
        bonus: { type: 'dpsPercent', value: 0.10 }
      }
    ]
  }
];
