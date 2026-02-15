import { SkillTreeNode } from '../models/skill-tree.model';

export const SKILL_TREE_DATA: SkillTreeNode[] = [
  // Core
  { id: 'core_start', name: 'Origin Point', description: 'The beginning of your ascended power.', icon: '✨', cost: 0, branch: 'Core', prerequisites: [], effects: [], position: { x: 50, y: 5 } },
  { id: 'core_dps', name: 'Empowerment', description: '+1% to all hero DPS.', icon: '⚔️', cost: 1, branch: 'Core', prerequisites: ['core_start'], effects: [{ type: 'dpsPercent', value: 0.01 }], position: { x: 40, y: 15 } },
  { id: 'core_gold', name: 'Prosperity', description: '+2% gold from all sources.', icon: '💰', cost: 1, branch: 'Core', prerequisites: ['core_start'], effects: [{ type: 'goldDropPercent', value: 0.02 }], position: { x: 50, y: 15 } },
  { id: 'core_click', name: 'Focus', description: '+3% to all click damage.', icon: '👆', cost: 1, branch: 'Core', prerequisites: ['core_start'], effects: [{ type: 'clickDamagePercent', value: 0.03 }], position: { x: 60, y: 15 } },

  // Conqueror Branch (Idle/DPS) - RED
  { id: 'conq_dps1', name: 'Sharpened Blades', description: '+2% to all hero DPS.', icon: '⚔️', cost: 2, branch: 'Conqueror', prerequisites: ['core_dps'], effects: [{ type: 'dpsPercent', value: 0.02 }], position: { x: 25, y: 25 } },
  { id: 'conq_dps2', name: 'Heroic Might', description: '+3% to all hero DPS.', icon: '⚔️', cost: 3, branch: 'Conqueror', prerequisites: ['conq_dps1'], effects: [{ type: 'dpsPercent', value: 0.03 }], position: { x: 15, y: 35 } },
  { id: 'conq_keystone1', name: 'Endless March', description: 'Increases Offline DPS by 25%. Your heroes fight harder when you are away.', icon: '🚶‍♂️', cost: 5, branch: 'Conqueror', prerequisites: ['conq_dps2'], effects: [{ type: 'offlineDpsPercent', value: 0.25 }], position: { x: 25, y: 45 }, isKeystone: true },
  { id: 'conq_offline_gold', name: 'War Spoils', description: 'Increases Offline Gold gained by 15%.', icon: '📦', cost: 4, branch: 'Conqueror', prerequisites: ['conq_keystone1'], effects: [{ type: 'offlineGoldPercent', value: 0.15 }], position: { x: 15, y: 55 } },
  { id: 'conq_dps3', name: 'Rending Strikes', description: '+5% to all hero DPS.', icon: '⚔️', cost: 8, branch: 'Conqueror', prerequisites: ['conq_offline_gold'], effects: [{ type: 'dpsPercent', value: 0.05 }], position: { x: 25, y: 65 } },
  { id: 'conq_capstone', name: 'Throne of Command', description: '+1 Expedition Slot. All hero DPS is increased by 10%.', icon: '👑', cost: 15, branch: 'Conqueror', prerequisites: ['conq_dps3'], effects: [{ type: 'expeditionSlots', value: 1 }, { type: 'dpsPercent', value: 0.10 }], position: { x: 15, y: 80 }, isKeystone: true },

  // Hoarder Branch (Gold/Economy) - YELLOW
  { id: 'hoard_gold1', name: 'Greedy Goblins', description: '+3% gold from all sources.', icon: '💰', cost: 2, branch: 'Hoarder', prerequisites: ['core_gold'], effects: [{ type: 'goldDropPercent', value: 0.03 }], position: { x: 50, y: 25 } },
  { id: 'hoard_cost_reduct', name: 'Efficient Upgrades', description: 'Reduces hero upgrade costs by 2%.', icon: '📉', cost: 3, branch: 'Hoarder', prerequisites: ['hoard_gold1'], effects: [{ type: 'upgradeCostReduction', value: 0.02 }], position: { x: 50, y: 35 } },
  { id: 'hoard_keystone1', name: 'King Midas', description: 'Increases Offline Gold gained by 30%.', icon: '👑', cost: 5, branch: 'Hoarder', prerequisites: ['hoard_cost_reduct'], effects: [{ type: 'offlineGoldPercent', value: 0.30 }], position: { x: 50, y: 48 }, isKeystone: true },
  { id: 'hoard_gold2', name: 'Treasure Hunter', description: '+5% gold from all sources.', icon: '💰', cost: 6, branch: 'Hoarder', prerequisites: ['hoard_keystone1'], effects: [{ type: 'goldDropPercent', value: 0.05 }], position: { x: 50, y: 60 } },
  { id: 'hoard_tomes', name: 'Ancient Knowledge', description: 'Gain +1 Tome of Skill each time you prestige.', icon: '📚', cost: 10, branch: 'Hoarder', prerequisites: ['hoard_gold2'], effects: [{ type: 'skillTomesPerPrestige', value: 1 }], position: { x: 50, y: 70 } },
  { id: 'hoard_capstone', name: 'The Collector', description: '+1 Dungeon Slot. Gold from all sources increased by 15%.', icon: '💎', cost: 15, branch: 'Hoarder', prerequisites: ['hoard_tomes'], effects: [{ type: 'dungeonSlots', value: 1 }, { type: 'goldDropPercent', value: 0.15 }], position: { x: 50, y: 85 }, isKeystone: true },

  // Zealot Branch (Active/Click) - BLUE
  { id: 'zealot_click1', name: 'Focused Taps', description: '+5% to all click damage.', icon: '👆', cost: 2, branch: 'Zealot', prerequisites: ['core_click'], effects: [{ type: 'clickDamagePercent', value: 0.05 }], position: { x: 75, y: 25 } },
  { id: 'zealot_skill_charge', name: 'Arcane Flow', description: 'Hero skills charge 5% faster.', icon: '⚡', cost: 3, branch: 'Zealot', prerequisites: ['zealot_click1'], effects: [{ type: 'skillChargeRate', value: 0.05 }], position: { x: 85, y: 35 } },
  { id: 'zealot_keystone1', name: 'Critical Strike', description: 'Increases all click damage by a massive 50%.', icon: '💥', cost: 5, branch: 'Zealot', prerequisites: ['zealot_skill_charge'], effects: [{ type: 'clickDamagePercent', value: 0.50 }], position: { x: 75, y: 45 }, isKeystone: true },
  { id: 'zealot_skill_dmg', name: 'Empowered Spells', description: 'Increases damage from hero skills by 10%.', icon: '🔥', cost: 6, branch: 'Zealot', prerequisites: ['zealot_keystone1'], effects: [{ type: 'skillDamagePercent', value: 0.10 }], position: { x: 85, y: 55 } },
  { id: 'zealot_click2', name: 'Shattering Blows', description: '+10% to all click damage.', icon: '👆', cost: 8, branch: 'Zealot', prerequisites: ['zealot_skill_dmg'], effects: [{ type: 'clickDamagePercent', value: 0.10 }], position: { x: 75, y: 65 } },
  { id: 'zealot_capstone', name: 'Godspeed', description: 'Hero skills charge 15% faster and deal 25% more damage.', icon: '🌠', cost: 15, branch: 'Zealot', prerequisites: ['zealot_click2'], effects: [{ type: 'skillChargeRate', value: 0.15 }, { type: 'skillDamagePercent', value: 0.25 }], position: { x: 85, y: 80 }, isKeystone: true },
];
