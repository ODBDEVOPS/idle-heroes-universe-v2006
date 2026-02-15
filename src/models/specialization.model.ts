import { Role } from './hero.model';

export interface SpecializationStatBonuses {
  dpsPercent?: number;
  skillDamagePercent?: number;
  // Future bonuses like healthPercent, damageReduction, etc. can be added here
}

export interface SpecializationSkillModification {
  newDescription: string;
  // Future modifications like adding effects (e.g., 'burn', 'stun') can be added here
}

export interface Specialization {
  id: string; // e.g., 'knight_crusader'
  name: string;
  description: string;
  icon: string; // emoji
  roleOverride?: Role;
  statBonuses: SpecializationStatBonuses;
  skillModification?: SpecializationSkillModification;
}

export interface SpecializationPath {
  baseClass: string;
  promotion1: {
    levelReq: number;
    cost: number; // Essence of Loyalty
    options: string[]; // array of specialization IDs
  };
  promotion2: {
    levelReq: number;
    cost: number; // Essence of Loyalty
    options: Record<string, string[]>; // key is promo1 ID, value is array of promo2 IDs
  };
}
