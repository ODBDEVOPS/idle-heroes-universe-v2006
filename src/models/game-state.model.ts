import { OngoingExpedition } from "./expedition.model";
import { ActiveBlessing, BlessingCooldown } from "./celestial-shrine.model";
import { DungeonDifficulty } from './dungeon.model';
import { PlayerPet } from './pet.model';
import { HeroMemory } from './chronicle.model';
import { TowerState } from './tower.model';
import { EnemyType } from './enemy.model';
// FIX: Import Rarity from equipment.model.ts to break circular dependency.
import { Rarity } from "./equipment.model";

export interface ActiveDungeonRun {
  dungeonId: number;
  difficulty: DungeonDifficulty;
  startTime: number; // timestamp
  completionTime: number; // timestamp
}

export interface ActiveDungeonBounty {
    bountyId: number;
    heroIds: number[];
    startTime: number;
    completionTime: number;
}

export interface TeamPreset {
  name: string;
  heroIds: (number | null)[];
}

export interface HeroFarmState {
  assignedHeroIds: (number | null)[];
  lastCollectionTimestamp: number;
  accumulatedEssence: number;
  accumulatedEssenceOfLoyalty: number;
}

export interface GuildMember {
  name: string;
  stage: number;
  title: 'Guild Master' | 'Officer' | 'Member';
}

export interface GameState {
  stage: number;
  gold: number;
  clickDamage: number;
  prestigePoints: number;
  goldMultiplier: number;
  theme: 'light' | 'dark';
  // Team
  activeHeroIds: (number | null)[];
  teamPresets: TeamPreset[];
  // Quest trackers
  totalEnemiesDefeated: number;
  totalHeroesSummoned: number;
  highestRarityForged: Rarity | null;
  // Offline progress
  lastUpdateTimestamp: number;
  // Tower of Trials
  towerFloor: number;
  towerState: TowerState; // New property for tower run state
  // Daily Login
  lastLoginDate: string | null; // YYYY-MM-DD
  consecutiveLoginDays: number;
  // Artifacts
  artifacts: number[]; // Array of artifact IDs
  // Codex
  unlockedHeroIds: number[];
  viewedHeroIdsInCodex: number[];
  viewedPetIdsInCodex: number[];
  discoveredMaterials: string[]; // array of material IDs
  viewedMaterialsInCodex: string[]; // array of material IDs
  discoveredMonsterTypes: EnemyType[]; // NEW: Track discovered monster types
  viewedMonsterTypesInCodex: EnemyType[]; // NEW: Track viewed monster types in Codex
  // Stats
  totalClicks: number;
  totalGoldEarned: number;
  totalPrestiges: number;
  totalSkillsUsed: number;
  totalDungeonsCompleted: number;
  totalExpeditionsCompleted: number;
  totalSponsorClaims: number;
  totalItemsForged: number;
  totalGoldDonated: number;
  // Combat mode
  autoDpsEnabled: boolean;
  autoSkillEnabled: boolean;
  // Expeditions
  ongoingExpeditions: OngoingExpedition[];
  // Dungeons
  activeDungeonRuns: ActiveDungeonRun[];
  dungeonCrests: number;
  activeDungeonBounties: ActiveDungeonBounty[];
  purchasedDungeonShopItems: Record<number, number>;
  // Celestial Shrine
  activeBlessings: ActiveBlessing[];
  blessingCooldowns: BlessingCooldown[];
  // Gold Features
  lastTributeClaimTimestamp: number | null;
  lastGoldRushTimestamp: null;
  vaultInvestment: { amount: number, returnTime: number } | null;
  lastSponsorOfferTimestamp: number | null;
  // Gold Mine
  activeMiningOperation: { operationId: number, completionTime: number } | null;
  // Alchemy Lab
  enchantingDust: number;
  // Summoning
  lastFreeStandardSummonTimestamp: number | null;
  heroShards: Record<number, number>;
  standardPityCount: number;
  premiumPityCount: number;
  heroSkillLevels: Record<number, number>;
  // Pets
  pets: PlayerPet[];
  petCrystals: number;
  essenceOfLoyalty: number;
  // Astral Chronicle
  heroMemories: Record<number, HeroMemory[]>;
  // Skill Training
  skillTomes: number;
  // Skill Tree
  unlockedSkillTreeNodes: string[];
  // Hero Farm
  heroEssence: number;
  heroFarm: HeroFarmState;
  materials: Record<string, number>; // material.id -> quantity
  // Specializations
  heroSpecializations: Record<number, string[]>; // heroId -> ['spec_id_1', 'spec_id_2']
  // Soul Alchemy
  unlockedHybridSouls: string[];
  // Mission Objectives
  missionProgress: Record<string, number>; // missionId -> highest claimed tier index
  // Necro-Artisanat
  necroConstructs: Record<string, number>; // constructId -> quantity
  // Dimensional Rift
  riftLevel: number;
  highestRiftLevel: number;
  riftShards: number;
  // Guild
  guild: {
    id: string | null;
    name: string | null;
    level: number;
    exp: number;
    members: GuildMember[];
  } | null;
  // Headquarters
  headquartersUpgrades: Record<string, number>;
}