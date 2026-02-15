export interface SkillTreeNodeEffect {
  type: 
    'dpsPercent' | 
    'goldDropPercent' | 
    'clickDamagePercent' | 
    'skillChargeRate' | 
    'offlineGoldPercent' | 
    'offlineDpsPercent' | 
    'upgradeCostReduction' | 
    'skillDamagePercent' |
    'expeditionSlots' |
    'dungeonSlots' |
    'skillTomesPerPrestige';
  value: number;
}

export interface SkillTreeNode {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji
  cost: number;
  branch: 'Conqueror' | 'Hoarder' | 'Zealot' | 'Core';
  prerequisites: string[];
  effects: SkillTreeNodeEffect[];
  position: { x: number; y: number }; // Percentage-based positions
  isKeystone?: boolean;
}
