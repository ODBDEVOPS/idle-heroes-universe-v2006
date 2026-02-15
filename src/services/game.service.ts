import { signal, computed, WritableSignal, Injectable, effect } from '@angular/core';
import { GameState, ActiveDungeonRun, TeamPreset, ActiveDungeonBounty, HeroFarmState, GuildMember } from '../models/game-state.model';
import { Hero, Role, HeroStats } from '../models/hero.model';
import { Enemy, EnemyType, CodexMonster, Anomaly, RiftEnemy } from '../models/enemy.model';
import { Quest } from '../models/quest.model';
import { EquipmentItem, EquipmentSlot, EquipmentBonusType, Rarity, ALL_EQUIPMENT_SETS } from '../models/equipment.model';
import { Artifact } from '../models/artifact.model';
import { Expedition, OngoingExpedition, ExpeditionReward } from '../models/expedition.model';
import { Blessing, BlessingType, ActiveBlessing, BlessingCooldown } from '../models/celestial-shrine.model';
import { Dungeon, DungeonDifficulty, DungeonBounty, DungeonShopItem } from '../models/dungeon.model';
import { LeaderboardEntry } from '../models/leaderboard.model';
import { Pet, PlayerPet } from '../models/pet.model';
import { ChronicleService, StrategicAnalysisPayload } from './chronicle.service';
import { HeroMemory, ChronicleQuest } from '../models/chronicle.model';
import { SkillTreeNode, SkillTreeNodeEffect } from '../models/skill-tree.model';
import { SKILL_TREE_DATA } from '../data/skill-tree-data';
import { ASCII_ART } from '../data/ascii-art';
import { Material, ALL_MATERIALS } from '../models/material.model';
import { Specialization, SpecializationPath } from '../models/specialization.model';
import { ALL_SPECIALIZATIONS, ALL_SPECIALIZATION_PATHS } from '../data/specializations';
import { TowerChallenge, TowerChallengeOutcome, TowerState } from '../models/tower.model';
import { MissionReward } from '../models/mission.model';
import { ALL_MISSIONS } from '../data/missions-data';
import { ALL_NECRO_CONSTRUCTS, ALL_NECRO_RECIPES, NecroConstruct, NecroConstructRecipe } from '../models/necro-construct.model';

const INITIAL_GAME_STATE: GameState = {
  stage: 1,
  gold: 10,
  clickDamage: 1,
  prestigePoints: 0,
  goldMultiplier: 1,
  theme: 'dark',
  activeHeroIds: [1, null, null, null, null, null, null, null, null, null],
  teamPresets: [
    { name: 'Preset 1', heroIds: [1, null, null, null, null, null, null, null, null, null] },
    { name: 'Preset 2', heroIds: [null, null, null, null, null, null, null, null, null, null] },
  ],
  totalEnemiesDefeated: 0,
  totalHeroesSummoned: 0,
  highestRarityForged: null,
  lastUpdateTimestamp: Date.now(),
  towerFloor: 1,
  towerState: { currentChoices: [] },
  lastLoginDate: null,
  consecutiveLoginDays: 0,
  artifacts: [],
  unlockedHeroIds: [1],
  viewedHeroIdsInCodex: [],
  viewedPetIdsInCodex: [],
  discoveredMaterials: [],
  viewedMaterialsInCodex: [],
  discoveredMonsterTypes: [],
  viewedMonsterTypesInCodex: [],
  totalClicks: 0,
  totalGoldEarned: 0,
  totalPrestiges: 0,
  totalSkillsUsed: 0,
  totalDungeonsCompleted: 0,
  totalExpeditionsCompleted: 0,
  totalSponsorClaims: 0,
  totalItemsForged: 0,
  totalGoldDonated: 0,
  autoDpsEnabled: true,
  autoSkillEnabled: false,
  ongoingExpeditions: [],
  activeDungeonRuns: [],
  dungeonCrests: 0,
  activeDungeonBounties: [],
  purchasedDungeonShopItems: {},
  activeBlessings: [],
  blessingCooldowns: [],
  lastTributeClaimTimestamp: null,
  lastGoldRushTimestamp: null,
  vaultInvestment: null,
  lastSponsorOfferTimestamp: null,
  activeMiningOperation: null,
  enchantingDust: 0,
  lastFreeStandardSummonTimestamp: null,
  heroShards: {},
  standardPityCount: 0,
  premiumPityCount: 0,
  heroSkillLevels: {},
  pets: [],
  petCrystals: 0,
  essenceOfLoyalty: 0,
  heroMemories: {},
  skillTomes: 0,
  unlockedSkillTreeNodes: ['core_start'],
  heroEssence: 0,
  heroFarm: {
    assignedHeroIds: [null, null],
    lastCollectionTimestamp: Date.now(),
    accumulatedEssence: 0,
    accumulatedEssenceOfLoyalty: 0,
  },
  materials: {},
  heroSpecializations: {},
  unlockedHybridSouls: [],
  missionProgress: {},
  necroConstructs: {},
  riftLevel: 0,
  highestRiftLevel: 0,
  riftShards: 0,
  guild: null,
  headquartersUpgrades: {},
};

export type GlobalUpgradeBonusType = 'globalDpsPercent' | 'globalGoldPercent' | 'globalClickDamagePercent' | 'offlineGoldPercent' | 'heroCostReductionPercent' | 'globalXpPercent';

export interface GlobalUpgrade {
  id: GlobalUpgradeBonusType;
  name: string;
  description: string;
  icon: string;
  department: 'War Council' | 'Treasury' | 'Training Grounds';
  baseCost: number;
  costMultiplier: number;
  baseBonus: number;
  bonusFormat: 'percent';
  maxLevel: number;
}

export const ALL_HEADQUARTERS_UPGRADES: GlobalUpgrade[] = [
  { id: 'globalDpsPercent', name: 'Tactical Coordination', description: 'Increases the DPS of all heroes.', icon: 'M17 20h5v-5h-5v5zM15 20h-5v-5h5v5zM7 20h5v-5H7v5zM17 13h5V8h-5v5zM15 13h-5V8h5v5zM7 13h5V8H7v5zM17 6h5V1h-5v5zM15 6h-5V1h5v5zM7 6h5V1H7v5z', department: 'War Council', baseCost: 1e6, costMultiplier: 1.5, baseBonus: 0.01, bonusFormat: 'percent', maxLevel: 100, },
  { id: 'globalClickDamagePercent', name: 'Targeted Strikes', description: 'Increases the damage of your clicks.', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z', department: 'War Council', baseCost: 5e5, costMultiplier: 1.8, baseBonus: 0.05, bonusFormat: 'percent', maxLevel: 50, },
  { id: 'globalGoldPercent', name: 'Economic Stimulus', description: 'Increases all gold earned from enemies.', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z M12 12.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z', department: 'Treasury', baseCost: 2e6, costMultiplier: 1.6, baseBonus: 0.02, bonusFormat: 'percent', maxLevel: 100, },
  { id: 'offlineGoldPercent', name: 'Automated Treasury', description: 'Increases gold earned while offline.', icon: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z M13 7h-2v5l4.25 2.52.75-1.23-3.5-2.02V7z', department: 'Treasury', baseCost: 1e7, costMultiplier: 2.0, baseBonus: 0.05, bonusFormat: 'percent', maxLevel: 50, },
  { id: 'heroCostReductionPercent', name: 'Efficient Training', description: 'Reduces the gold cost of leveling up all heroes.', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z', department: 'Training Grounds', baseCost: 5e6, costMultiplier: 2.2, baseBonus: 0.005, bonusFormat: 'percent', maxLevel: 50, },
  { id: 'globalXpPercent', name: 'Accelerated Learning', description: 'Increases all XP earned by heroes.', icon: 'M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1z M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z', department: 'Training Grounds', baseCost: 1e8, costMultiplier: 1.9, baseBonus: 0.02, bonusFormat: 'percent', maxLevel: 50, }
];

export const ALL_HEROES: Omit<Hero, 'currentDps' | 'nextLevelCost' | 'equipment' | 'skillCharge' | 'skillReady' | 'currentXp' | 'xpToNextLevel' | 'offlineXp'>[] = [
  // Starting Heroes
  { id: 1, name: 'Starlight Knight', level: 1, baseDps: 2, baseHp: 160, maxHp: 160, currentHp: 160, baseCost: 10, upgradeCostMultiplier: 1.1, rarity: 'Common', role: 'DPS', skillDescription: 'Deals a burst of holy damage to the enemy.', lore: 'A loyal knight sworn to protect the innocent, wielding a sword blessed by the cosmos.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Knight' },
  { id: 2, name: 'Shadow Archer', level: 0, baseDps: 10, baseHp: 800, maxHp: 0, currentHp: 0, baseCost: 100, upgradeCostMultiplier: 1.15, rarity: 'Rare', role: 'Marksman', skillDescription: 'Fires a shadow-infused arrow that pierces enemy defenses.', lore: 'A silent hunter from the twilight forests, her arrows never miss their mark.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Archer' },
  { id: 3, name: 'Chrono Mage', level: 0, baseDps: 50, baseHp: 4000, maxHp: 0, currentHp: 0, baseCost: 1000, upgradeCostMultiplier: 1.2, rarity: 'Epic', role: 'Mage', skillDescription: 'Unleashes a time-distorting spell, causing massive damage.', lore: 'A master of time magic, she can bend reality to her will, though fears its ultimate price.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Mage' },
  { id: 4, name: 'Iron Guardian', level: 0, baseDps: 2, baseHp: 300, maxHp: 0, currentHp: 0, baseCost: 200, upgradeCostMultiplier: 1.12, rarity: 'Rare', role: 'Tank', skillDescription: 'Hardens its armor, becoming nearly invulnerable for a short time.', lore: 'An ancient golem animated by a powerful rune, its only purpose is to protect its allies.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Guardian' },
  { id: 5, name: 'Sun Priestess', level: 0, baseDps: 4, baseHp: 400, maxHp: 0, currentHp: 0, baseCost: 500, upgradeCostMultiplier: 1.18, rarity: 'Epic', role: 'Healer', skillDescription: 'Heals all allies and grants a temporary damage boost.', lore: 'A devoted follower of the sun god, her prayers can mend wounds and inspire courage.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Priest' },
  // Summonable Heroes
  { id: 6, name: 'Village Guard', level: 0, baseDps: 1, baseHp: 150, maxHp: 0, currentHp: 0, baseCost: 15, upgradeCostMultiplier: 1.1, rarity: 'Common', role: 'Tank', skillDescription: 'Raises his shield, absorbing a moderate amount of damage.', lore: 'A simple man with uncommon courage, he stands firm to protect his home and friends.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Guard' },
  { id: 7, name: 'Forest Scout', level: 0, baseDps: 3, baseHp: 240, maxHp: 0, currentHp: 0, baseCost: 25, upgradeCostMultiplier: 1.11, rarity: 'Common', role: 'Assassin', skillDescription: 'Throws a poisoned dagger, dealing damage over time.', lore: 'Swift and unseen, he knows every secret path through the whispering woods.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Scout' },
  { id: 8, name: 'Rogue Assassin', level: 0, baseDps: 15, baseHp: 1200, maxHp: 0, currentHp: 0, baseCost: 120, upgradeCostMultiplier: 1.16, rarity: 'Rare', role: 'Assassin', skillDescription: 'Strikes from the shadows, dealing critical damage.', lore: 'A former member of a thieves\' guild, she now fights for her own code of honor.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Rogue' },
  { id: 9, name: 'Ice Sorceress', level: 0, baseDps: 8, baseHp: 640, maxHp: 0, currentHp: 0, baseCost: 150, upgradeCostMultiplier: 1.17, rarity: 'Rare', role: 'Mage', skillDescription: 'Freezes the enemy, slowing their attacks for a period.', lore: 'Born in the frozen north, she commands the biting cold with elegant fury.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Sorcerer' },
  { id: 10, name: 'Dragon Knight', level: 0, baseDps: 20, baseHp: 2400, maxHp: 0, currentHp: 0, baseCost: 1200, upgradeCostMultiplier: 1.21, rarity: 'Epic', role: 'Bruiser', skillDescription: 'Breathes fire in a wide arc, damaging the enemy.', lore: 'Bonded with a mighty dragon, his armor is infused with its fiery essence.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Knight' },
  { id: 11, name: 'Celestial Healer', level: 0, baseDps: 10, baseHp: 1000, maxHp: 0, currentHp: 0, baseCost: 1500, upgradeCostMultiplier: 1.22, rarity: 'Epic', role: 'Healer', skillDescription: 'Summons a star that heals the most wounded ally over time.', lore: 'An angelic being who descended to aid mortals in their endless struggle against darkness.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Healer' },
  { id: 12, name: 'Void Walker', level: 0, baseDps: 250, baseHp: 20000, maxHp: 0, currentHp: 0, baseCost: 10000, upgradeCostMultiplier: 1.25, rarity: 'Legendary', role: 'Démoniste', skillDescription: 'Opens a rift to the void, dealing immense and unpredictable damage.', lore: 'A being who has gazed into the abyss and returned, wielding its chaotic power.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Warlock' },
  { id: 13, name: 'Phoenix Rider', level: 0, baseDps: 300, baseHp: 24000, maxHp: 0, currentHp: 0, baseCost: 12000, upgradeCostMultiplier: 1.26, rarity: 'Legendary', role: 'Mage', skillDescription: 'Engulfs the battlefield in flames, dealing heavy damage.', lore: 'Reborn from ashes alongside his immortal companion, he is a symbol of eternal struggle and rebirth.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Mage' },
  // New Heroes
  { id: 14, name: 'Cyber Ninja', level: 0, baseDps: 120, baseHp: 9600, maxHp: 0, currentHp: 0, baseCost: 5000, upgradeCostMultiplier: 1.23, rarity: 'Epic', role: 'Video game Hero', skillDescription: 'Unleashes a flurry of high-tech shurikens at blinding speed.', lore: 'A warrior from a dystopian future, enhanced with cybernetics to be the perfect assassin.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Ninja' },
  { id: 15, name: 'Mech Pilot', level: 0, baseDps: 400, baseHp: 60000, maxHp: 0, currentHp: 0, baseCost: 15000, upgradeCostMultiplier: 1.28, rarity: 'Legendary', role: 'Tank', skillDescription: 'Fires a massive laser cannon from his mech suit.', lore: 'A prodigy engineer and pilot, his custom-built mech is both a shield and a devastating weapon.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Pilot' },
  { id: 16, name: 'Monster Slayer', level: 0, baseDps: 15, baseHp: 1800, maxHp: 0, currentHp: 0, baseCost: 180, upgradeCostMultiplier: 1.18, rarity: 'Rare', role: 'Video game Hero', skillDescription: 'Performs a powerful swing with her greatsword, effective against large foes.', lore: 'She wanders the land, hunting down the most dangerous beasts for coin and glory.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Slayer' },
  { id: 17, name: 'Cosmic Sorcerer', level: 0, baseDps: 800, baseHp: 64000, maxHp: 0, currentHp: 0, baseCost: 50000, upgradeCostMultiplier: 1.3, rarity: 'Legendary', role: 'Mage', skillDescription: 'Summons a meteor shower, stunning and damaging the enemy.', lore: 'An ancient sage who draws power from the stars themselves, his knowledge is as vast as the universe.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Sorcerer' },
  { id: 18, name: 'Stealth Operative', level: 0, baseDps: 90, baseHp: 7200, maxHp: 0, currentHp: 0, baseCost: 4000, upgradeCostMultiplier: 1.22, rarity: 'Epic', role: 'Assassin', skillDescription: 'Uses a cloaking device to land a guaranteed critical hit.', lore: 'A top-secret agent from a shadowy organization, her past is a classified secret.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Operative' },
  { id: 19, name: 'Pirate Captain', level: 0, baseDps: 75, baseHp: 6000, maxHp: 0, currentHp: 0, baseCost: 3500, upgradeCostMultiplier: 1.20, rarity: 'Epic', role: 'Mangas Hero', skillDescription: 'Orders a cannon barrage from his unseen ship.', lore: 'Feared across the seven seas, he lives for adventure, treasure, and the thrill of battle.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Captain' },
  { id: 20, name: 'Dwarven Brawler', level: 0, baseDps: 25, baseHp: 3000, maxHp: 0, currentHp: 0, baseCost: 250, upgradeCostMultiplier: 1.19, rarity: 'Rare', role: 'Bruiser', skillDescription: 'Slams the ground, stunning the enemy for a moment.', lore: 'Hailing from mountain strongholds, he loves a good fight and a better ale.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Brawler' },
  { id: 21, name: 'Plague Doctor', level: 0, baseDps: 5, baseHp: 500, maxHp: 0, currentHp: 0, baseCost: 40, upgradeCostMultiplier: 1.13, rarity: 'Common', role: 'Shaman', skillDescription: 'Throws a vial that weakens the enemy, increasing damage taken.', lore: 'A mysterious figure whose methods are unorthodox, but surprisingly effective.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Doctor' },
  { id: 22, name: 'Vampire Lord', level: 0, baseDps: 1500, baseHp: 120000, maxHp: 0, currentHp: 0, baseCost: 100000, upgradeCostMultiplier: 1.35, rarity: 'Mythic', role: 'DPS', skillDescription: 'Drains the life force of his enemy to heal himself.', lore: 'An ancient noble cursed with immortality and an unquenchable thirst. His power is matched only by his tragic elegance.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Lord' },
  { id: 23, name: 'Time Traveler', level: 0, baseDps: 12, baseHp: 1200, maxHp: 0, currentHp: 0, baseCost: 1000, upgradeCostMultiplier: 1.24, rarity: 'Epic', role: 'Controller', skillDescription: 'Rewinds time slightly, giving other heroes a second chance to use skills.', lore: 'He has seen the beginning and the end, and now seeks to alter a future he cannot accept.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Traveler' },
  // 20 New Heroes
  { id: 24, name: 'Rift Strider', level: 0, baseDps: 350, baseHp: 28000, maxHp: 0, currentHp: 0, baseCost: 14000, upgradeCostMultiplier: 1.27, rarity: 'Legendary', role: 'Assassin', skillDescription: 'Dashes through the enemy, dealing damage that ignores a portion of defense.', lore: 'Lost between dimensions, the Rift Strider seeks a way back home, using his unstable powers to eliminate obstacles.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Strider' },
  { id: 25, name: 'Golem Forgemaster', level: 0, baseDps: 100, baseHp: 12000, maxHp: 0, currentHp: 0, baseCost: 4500, upgradeCostMultiplier: 1.22, rarity: 'Epic', role: 'Bruiser', skillDescription: 'The golem smashes the ground, dealing AoE damage and stunning the enemy.', lore: 'He doesn\'t just build machines; he gives them a soul. His masterpiece, a golem of living stone and fire, fights by his side.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Forgemaster' },
  { id: 26, name: 'Star Shanty Bard', level: 0, baseDps: 5, baseHp: 500, maxHp: 0, currentHp: 0, baseCost: 200, upgradeCostMultiplier: 1.16, rarity: 'Rare', role: 'Support', skillDescription: 'Plays a song that increases the attack speed of all heroes for a short time.', lore: 'He\'s sailed the cosmic seas, collecting stories and songs. His music channels the very energy of the stars.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Bard' },
  { id: 27, name: 'Feral Berserker', level: 0, baseDps: 18, baseHp: 1440, maxHp: 0, currentHp: 0, baseCost: 220, upgradeCostMultiplier: 1.18, rarity: 'Rare', role: 'DPS', skillDescription: 'For a few seconds, his damage is increased based on his missing health.', lore: 'Exiled from his tribe for his uncontrollable rage, he now channels his fury against the forces of darkness.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Berserker' },
  { id: 28, name: 'Arcane Gunslinger', level: 0, baseDps: 130, baseHp: 10400, maxHp: 0, currentHp: 0, baseCost: 5500, upgradeCostMultiplier: 1.23, rarity: 'Epic', role: 'Marksman', skillDescription: 'Fires a magically-infused bullet that ricochets between enemies.', lore: 'In a world where magic is fading, he\'s found a way to keep it alive, one bullet at a time.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Gunslinger' },
  { id: 29, name: 'Slime King', level: 0, baseDps: 2, baseHp: 300, maxHp: 0, currentHp: 0, baseCost: 30, upgradeCostMultiplier: 1.12, rarity: 'Common', role: 'Tank', skillDescription: 'Splits temporarily, distracting the enemy and reducing incoming damage.', lore: 'Started as a simple ooze, but after absorbing a fallen king\'s crown, he gained intelligence and a rather pompous attitude.', ascensionLevel: 0, skillLevel: 1, baseClass: 'King' },
  { id: 30, name: 'Cursed Samurai', level: 0, baseDps: 500, baseHp: 40000, maxHp: 0, currentHp: 0, baseCost: 25000, upgradeCostMultiplier: 1.29, rarity: 'Legendary', role: 'Mangas Hero', skillDescription: 'A devastating single strike that also damages the Samurai himself.', lore: 'Bound by a blood pact to a demonic sword, he seeks a worthy opponent to finally break his curse or die trying.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Samurai' },
  { id: 31, name: 'Quantum Scientist', level: 0, baseDps: 60, baseHp: 6000, maxHp: 0, currentHp: 0, baseCost: 3000, upgradeCostMultiplier: 1.21, rarity: 'Epic', role: 'Controller', skillDescription: 'Increases the enemy\'s chance to miss attacks for a short period.', lore: 'After a lab accident sent him spiraling through alternate realities, he learned to see and manipulate the threads of chance.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Scientist' },
  { id: 32, name: 'Spirit Shaman', level: 0, baseDps: 12, baseHp: 1200, maxHp: 0, currentHp: 0, baseCost: 180, upgradeCostMultiplier: 1.17, rarity: 'Rare', role: 'Shaman', skillDescription: 'Summons a spirit wolf to attack alongside the heroes for a few seconds.', lore: 'The whispers of generations guide her hand. She is the bridge between the world of the living and the great spirit world.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Shaman' },
  { id: 33, name: 'Galaxy Serpent', level: 0, baseDps: 2000, baseHp: 160000, maxHp: 0, currentHp: 0, baseCost: 150000, upgradeCostMultiplier: 1.36, rarity: 'Mythic', role: 'Mage', skillDescription: 'Calls down a collapsing star, dealing massive damage to the enemy.', lore: 'Older than galaxies, the Serpent is a force of nature, a cycle of cosmic destruction and rebirth made manifest.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Serpent' },
  { id: 34, name: 'Street Brawler', level: 0, baseDps: 4, baseHp: 480, maxHp: 0, currentHp: 0, baseCost: 35, upgradeCostMultiplier: 1.11, rarity: 'Common', role: 'Bruiser', skillDescription: 'A powerful punch that has a small chance to stun the enemy.', lore: 'Grew up fighting for every scrap. Now, he\'s found a bigger fight, and the pay is better.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Brawler' },
  { id: 35, name: 'Elven Mystic', level: 0, baseDps: 6, baseHp: 600, maxHp: 0, currentHp: 0, baseCost: 250, upgradeCostMultiplier: 1.17, rarity: 'Rare', role: 'Healer', skillDescription: 'Creates an aura that slowly regenerates the health of the team.', lore: 'As old as the forest she protects, her wisdom is deep and her magic is woven from life itself.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Mystic' },
  { id: 36, name: 'War Machine Alpha', level: 0, baseDps: 450, baseHp: 36000, maxHp: 0, currentHp: 0, baseCost: 20000, upgradeCostMultiplier: 1.28, rarity: 'Legendary', role: 'Video game Hero', skillDescription: 'Unleashes a barrage of missiles, rockets, and lasers.', lore: 'Originally a military AI, it achieved self-awareness and now fights to protect all forms of life, organic and synthetic.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Machine' },
  { id: 37, name: 'Sand Wraith', level: 0, baseDps: 95, baseHp: 7600, maxHp: 0, currentHp: 0, baseCost: 4800, upgradeCostMultiplier: 1.23, rarity: 'Epic', role: 'Assassin', skillDescription: 'Envelops the enemy in a cursed sandstorm, dealing persistent damage.', lore: 'Born from the last breath of a betrayed king, the Sand Wraith tirelessly hunts those who have wronged the innocent.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Wraith' },
  { id: 38, name: 'Gravity Witch', level: 0, baseDps: 70, baseHp: 7000, maxHp: 0, currentHp: 0, baseCost: 4200, upgradeCostMultiplier: 1.22, rarity: 'Epic', role: 'Controller', skillDescription: 'Crushes the enemy under immense gravitational force, significantly slowing them.', lore: 'She carries the weight of a dying star in her heart, allowing her to bend the fundamental forces of the universe to her will.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Witch' },
  { id: 39, name: 'JRPG Protagonist', level: 0, baseDps: 600, baseHp: 48000, maxHp: 0, currentHp: 0, baseCost: 40000, upgradeCostMultiplier: 1.31, rarity: 'Legendary', role: 'Mangas Hero', skillDescription: 'Unleashes a multi-hit combo attack that grows stronger with each prestige.', lore: 'He woke up in this universe with amnesia, a giant sword, and an unshakable feeling that he needs to save the world.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Protagonist' },
  { id: 40, name: 'Field Medic', level: 0, baseDps: 1, baseHp: 100, maxHp: 0, currentHp: 0, baseCost: 20, upgradeCostMultiplier: 1.1, rarity: 'Common', role: 'Healer', skillDescription: 'Applies a bandage to the most damaged hero, healing a small amount of health.', lore: 'She\'s seen the horrors of war and is determined to save as many lives as she can, one bandage at a time.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Medic' },
  { id: 41, name: 'Abyssal Warlock', level: 0, baseDps: 1800, baseHp: 144000, maxHp: 0, currentHp: 0, baseCost: 120000, upgradeCostMultiplier: 1.35, rarity: 'Mythic', role: 'Démoniste', skillDescription: 'Forces the enemy to gaze into the abyss, dealing massive damage and causing a random debuff.', lore: 'In his thirst for knowledge, he reached out to the entities between the stars. They answered, granting him power at the cost of his sanity.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Warlock' },
  { id: 42, name: 'Kaiju Hunter', level: 0, baseDps: 380, baseHp: 45600, maxHp: 0, currentHp: 0, baseCost: 16000, upgradeCostMultiplier: 1.27, rarity: 'Legendary', role: 'Bruiser', skillDescription: 'An uppercut that deals bonus damage to bosses.', lore: 'From a world constantly under threat from colossal beasts, she and her Jaeger-like suit are humanity\'s last line of defense.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Hunter' },
  { id: 43, name: 'Aether Blade', level: 0, baseDps: 2500, baseHp: 200000, maxHp: 0, currentHp: 0, baseCost: 200000, upgradeCostMultiplier: 1.38, rarity: 'Mythic', role: 'Assassin', skillDescription: 'Focuses all its energy into a single point, dealing astronomical damage.', lore: 'Not a person, but a weapon given form. The Aether Blade is a living concept of the \'perfect strike\', existing only to end conflicts.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Blade' },
  { id: 44, name: 'Mech Goliath', level: 0, baseDps: 420, baseHp: 63000, maxHp: 0, currentHp: 0, baseCost: 18000, upgradeCostMultiplier: 1.28, rarity: 'Legendary', role: 'Tank', skillDescription: 'Activates a kinetic shield that reflects a portion of enemy damage back.', lore: 'A colossal war machine from a fallen civilization, reactivated to serve a new master.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Mech' },
  { id: 45, name: 'Astral Ranger', level: 0, baseDps: 140, baseHp: 11200, maxHp: 0, currentHp: 0, baseCost: 6000, upgradeCostMultiplier: 1.24, rarity: 'Epic', role: 'Marksman', skillDescription: 'Fires an arrow of pure starlight that never misses and deals extra damage to bosses.', lore: 'A constellation given human form, she hunts down rogue stars and cosmic horrors.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Ranger' },
  { id: 46, name: 'Goblin Tinkerer', level: 0, baseDps: 3, baseHp: 300, maxHp: 0, currentHp: 0, baseCost: 45, upgradeCostMultiplier: 1.14, rarity: 'Common', role: 'Support', skillDescription: 'Throws a gadget that slightly increases the team\'s gold find for a few seconds.', lore: 'More interested in building contraptions than fighting, but his inventions sometimes work.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Tinkerer' },
  { id: 47, name: 'Crimson Witch', level: 0, baseDps: 700, baseHp: 56000, maxHp: 0, currentHp: 0, baseCost: 45000, upgradeCostMultiplier: 1.32, rarity: 'Legendary', role: 'Démoniste', skillDescription: 'Sacrifices a small amount of her own HP to cast a devastating blood magic spell.', lore: 'A powerful sorceress from a shonen universe, she walks the line between chaos and control.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Witch' },
  { id: 48, name: 'Paladin of the Sun', level: 0, baseDps: 80, baseHp: 8000, maxHp: 0, currentHp: 0, baseCost: 4800, upgradeCostMultiplier: 1.22, rarity: 'Epic', role: 'Healer', skillDescription: 'Calls down a beam of sunlight, healing the team and damaging the enemy.', lore: 'A knight whose faith is as unbreakable as his armor. He serves a forgotten deity of light.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Paladin' },
  { id: 49, name: 'Cyberpunk Hacker', level: 0, baseDps: 10, baseHp: 1000, maxHp: 0, currentHp: 0, baseCost: 160, upgradeCostMultiplier: 1.17, rarity: 'Rare', role: 'Controller', skillDescription: 'Uploads a virus that causes the enemy\'s attacks to temporarily deal less damage.', lore: 'She can break any firewall and bypass any security. Now she uses her skills to disrupt enemy forces.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Hacker' },
  { id: 50, name: 'Sand Scythe', level: 0, baseDps: 16, baseHp: 1280, maxHp: 0, currentHp: 0, baseCost: 190, upgradeCostMultiplier: 1.18, rarity: 'Rare', role: 'Assassin', skillDescription: 'A swift strike with a blade of hardened sand that causes the enemy to bleed damage over time.', lore: 'A nomad of the great desert, she is as deadly and silent as the shifting dunes.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Scythe' },
  { id: 51, name: 'Barbarian Chieftain', level: 0, baseDps: 110, baseHp: 13200, maxHp: 0, currentHp: 0, baseCost: 5200, upgradeCostMultiplier: 1.23, rarity: 'Epic', role: 'Bruiser', skillDescription: 'A mighty warcry that boosts his own DPS and the DPS of adjacent heroes.', lore: 'He united the warring clans of the north through sheer strength and force of will.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Barbarian' },
  { id: 52, name: 'Fungal Shaman', level: 0, baseDps: 13, baseHp: 1300, maxHp: 0, currentHp: 0, baseCost: 170, upgradeCostMultiplier: 1.17, rarity: 'Rare', role: 'Shaman', skillDescription: 'Summons toxic spores that poison the enemy, reducing their defense.', lore: 'He communicates with the vast mycelial network beneath the world, drawing strange powers from it.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Shaman' },
  { id: 53, name: 'Knight Errant', level: 0, baseDps: 4, baseHp: 320, maxHp: 0, currentHp: 0, baseCost: 38, upgradeCostMultiplier: 1.12, rarity: 'Common', role: 'DPS', skillDescription: 'A simple, honest sword strike that deals reliable damage.', lore: 'A young knight on a quest to prove his worth. He lacks experience but not courage.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Knight' },
  { id: 54, name: 'Cosmic Overlord', level: 0, baseDps: 2200, baseHp: 176000, maxHp: 0, currentHp: 0, baseCost: 180000, upgradeCostMultiplier: 1.37, rarity: 'Mythic', role: 'Mage', skillDescription: 'Rewrites a law of physics, dealing a percentage of the enemy\'s MAX HP as damage.', lore: 'A being from a higher plane of existence, it views battles as mere equations to be solved.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Overlord' },
  { id: 55, name: 'Silent Blade', level: 0, baseDps: 150, baseHp: 12000, maxHp: 0, currentHp: 0, baseCost: 6500, upgradeCostMultiplier: 1.24, rarity: 'Epic', role: 'Assassin', skillDescription: 'Finds a weak point in the enemy\'s form, increasing all critical damage against them for a time.', lore: 'A member of an ancient order of spies and killers, her name is only a rumor.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Blade' },
  { id: 56, name: 'Shield Maiden', level: 0, baseDps: 7, baseHp: 1050, maxHp: 0, currentHp: 0, baseCost: 140, upgradeCostMultiplier: 1.16, rarity: 'Rare', role: 'Tank', skillDescription: 'Bangs her shield, taunting the enemy and increasing her own defense for a short duration.', lore: 'A fierce warrior from a land of ice and sagas, she is the immovable object to any unstoppable force.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Maiden' },
  { id: 57, name: 'Grove Protector', level: 0, baseDps: 2, baseHp: 300, maxHp: 0, currentHp: 0, baseCost: 32, upgradeCostMultiplier: 1.11, rarity: 'Common', role: 'Tank', skillDescription: 'Roots himself, slightly regenerating his health over a few seconds.', lore: 'A treant given life by ancient magic, he is slow to anger but terrible when roused.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Protector' },
  { id: 58, name: 'Pirate Gunslinger', level: 0, baseDps: 22, baseHp: 1760, maxHp: 0, currentHp: 0, baseCost: 240, upgradeCostMultiplier: 1.18, rarity: 'Rare', role: 'Marksman', skillDescription: 'Fires a "trick shot" that has a chance to drop extra gold on hit.', lore: 'He sails the seas of a popular manga world, known for his incredible aim and even more incredible luck.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Gunslinger' },
  { id: 59, name: 'Chrono Warden', level: 0, baseDps: 320, baseHp: 32000, maxHp: 0, currentHp: 0, baseCost: 13000, upgradeCostMultiplier: 1.26, rarity: 'Legendary', role: 'Controller', skillDescription: 'Creates a time loop, forcing the enemy to repeat its last action, effectively stunning them.', lore: 'Tasked with protecting the timeline, he eliminates anomalies that threaten reality.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Warden' },
  { id: 60, name: 'Archangel of Valor', level: 0, baseDps: 280, baseHp: 28000, maxHp: 0, currentHp: 0, baseCost: 12500, upgradeCostMultiplier: 1.25, rarity: 'Legendary', role: 'Support', skillDescription: 'Grants the entire team a divine shield that absorbs a significant amount of damage.', lore: 'The commander of the celestial host, his presence inspires unwavering courage in his allies.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Angel' },
  { id: 61, name: 'Void Horror', level: 0, baseDps: 2800, baseHp: 224000, maxHp: 0, currentHp: 0, baseCost: 220000, upgradeCostMultiplier: 1.39, rarity: 'Mythic', role: 'DPS', skillDescription: 'Inflicts \'madness\', a debuff that deals increasing damage the longer it stays on the enemy.', lore: 'An eldritch being that slipped through the cracks of reality. Its very presence is a poison to the mind.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Horror' },
  { id: 62, name: 'Spearmaster', level: 0, baseDps: 160, baseHp: 12800, maxHp: 0, currentHp: 0, baseCost: 7000, upgradeCostMultiplier: 1.24, rarity: 'Epic', role: 'Mangas Hero', skillDescription: 'A lightning-fast spear thrust that has a high chance to be a critical hit.', lore: 'A hero from a martial arts manga, his spear is said to be able to pierce the heavens.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Spearmaster' },
  { id: 63, name: 'Detective Enigma', level: 0, baseDps: 11, baseHp: 1100, maxHp: 0, currentHp: 0, baseCost: 175, upgradeCostMultiplier: 1.17, rarity: 'Rare', role: 'Controller', skillDescription: 'Points out a flaw, increasing the damage the enemy takes from all sources for a short time.', lore: 'A famous detective from a mystery video game, he can solve any crime and spot any weakness.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Detective' },
  // New Epic Heroes
  { id: 64, name: 'Golem Sentinel', level: 0, baseDps: 40, baseHp: 6000, maxHp: 0, currentHp: 0, baseCost: 4500, upgradeCostMultiplier: 1.22, rarity: 'Epic', role: 'Tank', skillDescription: 'Taunts the enemy and gains a damage-absorbing shield.', lore: 'An ancient construct built to defend a long-lost city, now bound to protect its new master.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Guardian' },
  { id: 65, name: 'Storm Shaman', level: 0, baseDps: 100, baseHp: 10000, maxHp: 0, currentHp: 0, baseCost: 4800, upgradeCostMultiplier: 1.23, rarity: 'Epic', role: 'Shaman', skillDescription: 'Calls down a chain lightning that strikes the enemy multiple times.', lore: 'A shaman who communes with the tempest, wielding the raw power of thunder and lightning.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Shaman' },
  { id: 66, name: 'Gunslinger Outlaw', level: 0, baseDps: 150, baseHp: 12000, maxHp: 0, currentHp: 0, baseCost: 6000, upgradeCostMultiplier: 1.24, rarity: 'Epic', role: 'Marksman', skillDescription: 'Fires a rapid volley of shots, increasing in damage with each hit.', lore: 'A wanted fugitive from a futuristic world, known for his unmatched speed and deadly accuracy with his twin blasters.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Gunslinger' },
  { id: 67, name: 'Bloodmancer', level: 0, baseDps: 90, baseHp: 7200, maxHp: 0, currentHp: 0, baseCost: 5200, upgradeCostMultiplier: 1.23, rarity: 'Epic', role: 'Démoniste', skillDescription: 'Curses the enemy, causing them to take increased damage from all sources.', lore: 'A warlock who delves into the forbidden art of blood magic, trading life force for immense power.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Warlock' },
  { id: 68, name: 'Battle Cleric', level: 0, baseDps: 85, baseHp: 8500, maxHp: 0, currentHp: 0, baseCost: 5500, upgradeCostMultiplier: 1.23, rarity: 'Epic', role: 'Healer', skillDescription: 'Smites the enemy, dealing damage and healing the hero with the lowest health.', lore: 'A cleric who believes the best defense is a strong offense, wading into battle to protect allies and punish foes.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Priest' },
  // New Legendary Heroes
  { id: 69, name: 'Archon of Justice', level: 0, baseDps: 650, baseHp: 52000, maxHp: 0, currentHp: 0, baseCost: 42000, upgradeCostMultiplier: 1.31, rarity: 'Legendary', role: 'DPS', skillDescription: 'Summons a pillar of divine fire, dealing massive damage and stunning the enemy.', lore: 'An angelic being of pure law and order, tasked with purging injustice from all realities.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Angel' },
  { id: 70, name: 'Chronos, The Time Weaver', level: 0, baseDps: 550, baseHp: 55000, maxHp: 0, currentHp: 0, baseCost: 38000, upgradeCostMultiplier: 1.30, rarity: 'Legendary', role: 'Controller', skillDescription: 'Freezes the enemy in time. All damage dealt during this period is applied in a single burst at the end.', lore: 'A master of time itself, Chronos has seen countless futures and works to steer reality away from oblivion.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Traveler' },
  { id: 71, name: 'Yamato, the Wandering Blade', level: 0, baseDps: 750, baseHp: 60000, maxHp: 0, currentHp: 0, baseCost: 48000, upgradeCostMultiplier: 1.32, rarity: 'Legendary', role: 'Mangas Hero', skillDescription: 'Unleashes "Dimension Slash," a single strike that ignores a large portion of enemy defenses.', lore: 'A swordsman from another world, whose blade is said to be so sharp it can cut through space and time itself.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Samurai' },
  { id: 72, name: 'Celestial Sentinel', level: 0, baseDps: 300, baseHp: 50000, maxHp: 0, currentHp: 0, baseCost: 20000, upgradeCostMultiplier: 1.28, rarity: 'Legendary', role: 'Support', skillDescription: 'Creates a divine shield for all allies that absorbs damage equal to a percentage of his own max HP.', lore: 'A silent guardian forged from the heart of a collapsed star, his only purpose is to shield the universe from interdimensional threats.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Sentinel' },
  { id: 73, name: 'Phantom Blade', level: 0, baseDps: 700, baseHp: 45000, maxHp: 0, currentHp: 0, baseCost: 45000, upgradeCostMultiplier: 1.31, rarity: 'Legendary', role: 'Assassin', skillDescription: 'Dashes through the enemy multiple times, with each hit dealing bonus damage based on the enemy\'s missing health.', lore: 'A warrior trapped between the planes of existence. He appears only as a blur of steel, his strikes echoing from dimensions unseen.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Blade Dancer' },
  // 10 New Heroes
  { id: 74, name: 'Brave Squire', level: 0, baseDps: 2, baseHp: 200, maxHp: 0, currentHp: 0, baseCost: 12, upgradeCostMultiplier: 1.09, rarity: 'Common', role: 'DPS', skillDescription: 'A spirited charge that deals a quick burst of damage.', lore: 'A young squire eager to prove himself, despite lacking experience.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Squire' },
  { id: 75, name: 'Forest Druid', level: 0, baseDps: 6, baseHp: 700, maxHp: 0, currentHp: 0, baseCost: 180, upgradeCostMultiplier: 1.15, rarity: 'Rare', role: 'Support', skillDescription: 'Summons healing vines that restore health to the lowest ally.', lore: 'A wise guardian of the ancient groves, her magic flows with the life of the forest.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Druid' },
  { id: 76, name: 'Artificer Sniper', level: 0, baseDps: 180, baseHp: 10000, maxHp: 0, currentHp: 0, baseCost: 8000, upgradeCostMultiplier: 1.25, rarity: 'Epic', role: 'Marksman', skillDescription: 'Deploys an automated turret that fires rapidly at the enemy for a few seconds.', lore: 'A master inventor who combines precision engineering with deadly marksmanship.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Artificer' },
  { id: 77, name: 'Stone Behemoth', level: 0, baseDps: 450, baseHp: 75000, maxHp: 0, currentHp: 0, baseCost: 22000, upgradeCostMultiplier: 1.29, rarity: 'Legendary', role: 'Tank', skillDescription: 'Slams the ground, dealing damage and gaining a massive shield.', lore: 'A living mountain, slow to anger but virtually indestructible once roused.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Behemoth' },
  { id: 78, name: 'Cosmic Weaver', level: 0, baseDps: 2800, baseHp: 200000, maxHp: 0, currentHp: 0, baseCost: 250000, upgradeCostMultiplier: 1.40, rarity: 'Mythic', role: 'Mage', skillDescription: 'Unleashes a cosmic storm, dealing area damage and slowing all enemies.', lore: 'A mystical being capable of weaving the very fabric of reality, its power is boundless but enigmatic.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Weaver' },
  { id: 79, name: 'Trickster Goblin', level: 0, baseDps: 3, baseHp: 250, maxHp: 0, currentHp: 0, baseCost: 30, upgradeCostMultiplier: 1.10, rarity: 'Common', role: 'Controller', skillDescription: 'Throws a smoke bomb, temporarily blinding the enemy and causing them to miss attacks.', lore: 'A mischievous goblin who delights in confusing and outsmarting his foes.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Goblin' },
  { id: 80, name: 'Mountain Bear', level: 0, baseDps: 20, baseHp: 2000, maxHp: 0, currentHp: 0, baseCost: 280, upgradeCostMultiplier: 1.19, rarity: 'Rare', role: 'Bruiser', skillDescription: 'Lets out a fearsome roar, increasing his own defense and retaliating with damage.', lore: 'A colossal bear from the highest peaks, fiercely territorial and incredibly strong.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Beast' },
  { id: 81, name: 'Spirit Guide', level: 0, baseDps: 110, baseHp: 9000, maxHp: 0, currentHp: 0, baseCost: 5800, upgradeCostMultiplier: 1.23, rarity: 'Epic', role: 'Healer', skillDescription: 'Channels ancestral spirits to greatly heal one ally and grant them a temporary buff.', lore: 'A shamanistic figure who can commune with the spirits of the dead and guide them to aid the living.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Shaman' },
  { id: 82, name: 'Nightblade', level: 0, baseDps: 800, baseHp: 50000, maxHp: 0, currentHp: 0, baseCost: 55000, upgradeCostMultiplier: 1.33, rarity: 'Legendary', role: 'Assassin', skillDescription: 'Vanishes into shadows, then reappears behind the enemy to deliver a devastating critical strike.', lore: 'A legendary assassin whose existence is whispered only in the darkest corners of the underworld.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Rogue' },
  { id: 83, name: 'Phoenix Champion', level: 0, baseDps: 3200, baseHp: 250000, maxHp: 0, currentHp: 0, baseCost: 300000, upgradeCostMultiplier: 1.42, rarity: 'Mythic', role: 'DPS', skillDescription: 'Explodes in a fiery nova, dealing massive damage to all enemies and granting himself a temporary damage boost.', lore: 'Reborn from literal ashes, this champion embodies eternal fire and unyielding resilience.', ascensionLevel: 0, skillLevel: 1, baseClass: 'Champion' },
];

export const ALL_ARTIFACTS: Artifact[] = [
  { id: 1, name: 'Orb of Power', description: '+10% to all hero DPS.', bonusType: 'dpsPercent', bonusValue: 0.10 },
  { id: 2, name: 'Amulet of Midas', description: '+25% gold from all sources.', bonusType: 'goldDropPercent', bonusValue: 0.25 },
  { id: 3, name: 'Gauntlets of Haste', description: '+50% to all click damage.', bonusType: 'clickDamagePercent', bonusValue: 0.50 },
  { id: 4, name: 'Tome of Focus', description: 'Hero skills charge 10% faster.', bonusType: 'skillChargeRate', bonusValue: 0.10 },
  { id: 5, name: 'Tome of Elem', description: 'Hero skills charge 15% faster.', bonusType: 'skillChargeRate', bonusValue: 0.15 },
];

export const ALL_PETS: Pet[] = [
  { id: 1, name: 'Goldie the Goblin', rarity: 'Common', bonusType: 'goldDropPercent', baseBonus: 0.01, bonusPerLevel: 0.001, description: 'Increases gold dropped from enemies.', lore: 'A greedy but loyal goblin who has a knack for finding loose change.', art: '($.$)\\n/| |\\\\\\n / \\\\ ' },
  { id: 2, name: 'Fury the Fire Sprite', rarity: 'Rare', bonusType: 'dpsPercent', baseBonus: 0.02, bonusPerLevel: 0.002, description: 'Increases total DPS of all heroes.', lore: 'A tiny elemental of pure rage. Its presence invigorates your heroes.', art: '(`A`)\\n<{*}>\\n V V ', evolutionCostEssence: 10 },
  { id: 3, name: 'Clicky the Crab', rarity: 'Epic', bonusType: 'clickDamagePercent', baseBonus: 0.05, bonusPerLevel: 0.005, description: 'Increases damage from your clicks.', lore: 'This crab clicks its claws with such force, it inspires you to do the same.', art: '(\\\\/)\\n(o.o)\\n(><)', evolutionCostEssence: 25 },
];

export const ALL_BLESSINGS: Blessing[] = [
  { type: 'goldRush', name: 'Blessing of Midas', description: 'Doubles all gold earned from enemies for 60 seconds.', durationSeconds: 60, cooldownSeconds: 86400, bonusMultiplier: 2 }, // 24 hours
  { type: 'powerSurge', name: 'Warrior\'s Zeal', description: 'Increases all hero DPS by 50% for 60 seconds.', durationSeconds: 60, cooldownSeconds: 86400, bonusMultiplier: 1.5 },
  { type: 'skillFrenzy', name: 'Arcane Haste', description: 'Instantly recharges all hero skills.', durationSeconds: 0, cooldownSeconds: 86400, bonusMultiplier: 0 }, // Instant effect
];

export const SYNERGY_BONUSES: { [key in Role]?: { count: number, bonus: { type: 'dpsPercent' | 'goldDropPercent' | 'clickDamagePercent', value: number }, description: string }[] } = {
  DPS: [
    { count: 2, bonus: { type: 'dpsPercent', value: 0.10 }, description: '+10% All DPS' },
    { count: 4, bonus: { type: 'dpsPercent', value: 0.25 }, description: '+25% All DPS' }
  ],
  Tank: [
    { count: 2, bonus: { type: 'goldDropPercent', value: 0.15 }, description: '+15% Gold Find' },
  ],
  Support: [
    { count: 2, bonus: { type: 'goldDropPercent', value: 0.10 }, description: '+10% Gold Find' },
  ],
  Assassin: [
    { count: 2, bonus: { type: 'clickDamagePercent', value: 0.20 }, description: '+20% Click Damage' },
  ],
  Mage: [
    { count: 2, bonus: { type: 'dpsPercent', value: 0.05 }, description: '+5% All DPS' },
    { count: 3, bonus: { type: 'dpsPercent', value: 0.15 }, description: '+15% All DPS' },
  ],
};

export const ALL_EXPEDITIONS: Expedition[] = [
  {
    id: 1,
    name: "Patrol the Whispering Woods",
    description: "A quick patrol to clear out any stray goblins and gather some resources.",
    durationSeconds: 3600, // 1 hour
    requirements: { minHeroes: 1, minTotalLevel: 10 },
    rewards: { gold: 5000, equipmentDrop: { chance: 0.25, rarity: 'Common' } }
  },
  {
    id: 2,
    name: "Explore the Sunken Crypt",
    description: "A delve into an ancient crypt. Requires a sturdy warrior to lead the way.",
    durationSeconds: 14400, // 4 hours
    requirements: { minHeroes: 2, minTotalLevel: 50, roles: [{ role: 'Tank', count: 1 }] },
    rewards: { gold: 25000, equipmentDrop: { chance: 0.5, rarity: 'Rare' } }
  },
  {
    id: 3,
    name: "Mine the Glimmering Caves",
    description: "These caves are rumored to hold not just ore, but crystallized prestige.",
    durationSeconds: 28800, // 8 hours
    requirements: { minHeroes: 3, minTotalLevel: 100 },
    rewards: { gold: 60000, prestigePoints: 5, equipmentDrop: { chance: 0.1, rarity: 'Rare' } }
  },
  {
    id: 4,
    name: "Assassinate the Orc Warlord",
    description: "A high-risk, high-reward mission that requires a stealthy approach.",
    durationSeconds: 43200, // 12 hours
    requirements: { minHeroes: 4, minTotalLevel: 200, roles: [{ role: 'Assassin', count: 1 }, { role: 'DPS', count: 2 }] },
    rewards: { gold: 150000, prestigePoints: 15, equipmentDrop: { chance: 0.75, rarity: 'Epic' } }
  }
];

export interface MiningOperation {
  id: number;
  name: string;
  description: string;
  durationSeconds: number;
  goldReward: number;
  stageRequirement: number;
}

export const ALL_MINING_OPERATIONS: MiningOperation[] = [
  { id: 1, name: 'Surface Prospecting', description: 'A quick scan of the surface for loose gold nuggets.', durationSeconds: 900, goldReward: 1500, stageRequirement: 1 }, // 15 mins
  { id: 2, name: 'Crystal Cavern', description: 'Explore a nearby cave known for its gold-rich crystals.', durationSeconds: 3600, goldReward: 7500, stageRequirement: 25 }, // 1 hour
  { id: 3, name: 'Deep Vein Mining', description: 'A serious operation to tap into a rich vein of gold deep underground.', durationSeconds: 14400, goldReward: 40000, stageRequirement: 50 }, // 4 hours
  { id: 4, name: 'Heart of the Mountain', description: 'A long and dangerous expedition to the molten core where legendary treasures are forged.', durationSeconds: 43200, goldReward: 150000, stageRequirement: 100 }, // 12 hours
  { id: 5, name: 'Asteroid Harvesting', description: 'Launch a rocket to a nearby asteroid belt to mine precious metals.', durationSeconds: 86400, goldReward: 350000, stageRequirement: 200 }, // 24 hours
];

export const ALL_DUNGEONS: Dungeon[] = [
    { 
        id: 1, name: 'Goblin Tunnels', description: 'A short raid on a nearby goblin nest. Quick and easy loot.', 
        difficulties: {
            'Normal': { stageRequirement: 10, durationSeconds: 1800, rewards: { gold: 3000, dungeonCrests: 1, equipmentDrop: { chance: 0.5, rarity: 'Common' } } },
            'Hard': { stageRequirement: 50, durationSeconds: 3600, cost: { gold: 1000 }, rewards: { gold: 10000, dungeonCrests: 3, petCrystals: 5, equipmentDrop: { chance: 0.6, rarity: 'Common' } } },
            'Nightmare': { stageRequirement: 100, durationSeconds: 7200, cost: { gold: 5000 }, rewards: { gold: 30000, dungeonCrests: 7, equipmentDrop: { chance: 0.5, rarity: 'Rare' }, petEggDrop: { chance: 0.05 } } }
        }
    },
    { 
        id: 2, name: 'Undead Catacombs', description: 'A spooky delve into a crypt teeming with restless dead.',
        difficulties: {
            'Normal': { stageRequirement: 40, durationSeconds: 7200, cost: { gold: 5000 }, rewards: { gold: 20000, dungeonCrests: 4, equipmentDrop: { chance: 0.75, rarity: 'Rare' } } },
            'Hard': { stageRequirement: 90, durationSeconds: 14400, cost: { gold: 20000 }, rewards: { gold: 80000, dungeonCrests: 10, petCrystals: 15, equipmentDrop: { chance: 0.85, rarity: 'Rare' } } },
            'Nightmare': { stageRequirement: 150, durationSeconds: 28800, cost: { gold: 75000 }, rewards: { gold: 250000, dungeonCrests: 25, equipmentDrop: { chance: 0.75, rarity: 'Epic' }, petEggDrop: { chance: 0.10 } } }
        }
    },
    { 
        id: 3, name: 'Dragon\'s Hoard', description: 'A daring attempt to sneak past a sleeping dragon and pilfer its treasure.',
        difficulties: {
            'Normal': { stageRequirement: 80, durationSeconds: 21600, cost: { gold: 25000 }, rewards: { gold: 120000, dungeonCrests: 15, equipmentDrop: { chance: 0.25, rarity: 'Epic' } } },
            'Hard': { stageRequirement: 140, durationSeconds: 43200, cost: { gold: 100000 }, rewards: { gold: 500000, dungeonCrests: 40, petCrystals: 30, equipmentDrop: { chance: 0.35, rarity: 'Epic' } } },
            'Nightmare': { stageRequirement: 200, durationSeconds: 86400, cost: { gold: 250000 }, rewards: { gold: 1500000, dungeonCrests: 100, equipmentDrop: { chance: 0.25, rarity: 'Legendary' }, petEggDrop: { chance: 0.20 } } }
        }
    },
    { 
        id: 4, name: 'The Void Abyss', description: 'A perilous journey into a realm of madness where reality frays at the edges.',
        difficulties: {
            'Normal': { stageRequirement: 150, durationSeconds: 86400, cost: { gold: 100000 }, rewards: { gold: 500000, dungeonCrests: 50, equipmentDrop: { chance: 0.1, rarity: 'Legendary' } } },
            'Hard': { stageRequirement: 250, durationSeconds: 172800, cost: { gold: 400000 }, rewards: { gold: 2000000, dungeonCrests: 150, petCrystals: 50, equipmentDrop: { chance: 0.15, rarity: 'Legendary' } } },
            'Nightmare': { stageRequirement: 400, durationSeconds: 172800, cost: { gold: 1000000 }, rewards: { gold: 5000000, dungeonCrests: 350, equipmentDrop: { chance: 0.1, rarity: 'Mythic' }, petEggDrop: { chance: 0.30 } } }
        }
    },
];

export const ALL_DUNGEON_BOUNTIES: DungeonBounty[] = [
  { id: 1, name: 'Scout the Depths', description: 'A lone hero scouts ahead for minimal but quick rewards.', durationSeconds: 1800, requiredHeroCount: 1, rewards: { dungeonCrests: 2, gold: 1000, petCrystals: 1 } },
  { id: 2, name: 'Clear the Antechamber', description: 'A small team is needed to clear out the first rooms of a dungeon.', durationSeconds: 7200, requiredHeroCount: 2, rewards: { dungeonCrests: 5, gold: 5000, petCrystals: 5 } },
  { id: 3, name: 'Assassinate the Captain', description: 'A full squad is required for this high-risk, high-reward mission.', durationSeconds: 21600, requiredHeroCount: 4, rewards: { dungeonCrests: 15, gold: 20000, petCrystals: 10, essenceOfLoyalty: { chance: 0.1, amount: 1 } } },
];

export const ALL_DUNGEON_SHOP_ITEMS: DungeonShopItem[] = [
  {
    id: 1, name: 'Minor Gold Coffer', description: 'A small coffer of gold.', cost: 10,
    isSoldOut: () => false,
    purchase: (gameService: GameService) => {
      gameService.addGold(10000);
      return true;
    }
  },
  {
    id: 2, name: 'Rare Equipment Cache', description: 'Guaranteed to contain a Rare item.', cost: 50,
    isSoldOut: () => false,
    purchase: (gameService: GameService) => {
      // Logic to add a rare item to inventory
      const newItem = (gameService as any)._generateDroppedItem(gameService.gameState().stage, 'Rare');
      gameService.inventory.update(inv => [...inv, newItem]);
      return true;
    }
  },
  {
    id: 3, name: 'Tome of Wealth', description: 'Permanently increases all gold gains by 1%. (Max 10)', cost: 100, stock: 10,
    isSoldOut: (gameService: GameService) => (gameService.gameState().purchasedDungeonShopItems[3] || 0) >= 10,
    purchase: (gameService: GameService) => {
      gameService.gameState.update(s => {
        const newPurchased = {...s.purchasedDungeonShopItems};
        newPurchased[3] = (newPurchased[3] || 0) + 1;
        return {
          ...s,
          goldMultiplier: s.goldMultiplier + 0.01,
          purchasedDungeonShopItems: newPurchased
        };
      });
      return true;
    }
  }
];

export const ALL_CODEX_MONSTERS: CodexMonster[] = [
    {
        type: 'Normal',
        name: 'Common Critter',
        description: 'Represents a wide variety of standard foes found throughout the realms, from goblins to slimes. They are the bread and butter of any adventurer\'s journey.',
        asciiArt: '(o.o)\\n--| |-\n  / \\',
        habitat: 'Almost everywhere.'
    },
    {
        type: 'Armored',
        name: 'Armored Brute',
        description: 'These heavily fortified enemies, like Iron Golems, can shrug off blows that would fell lesser creatures. Their tough exterior reduces incoming damage.',
        asciiArt: '/[o-o]\\\n=[|:::|]=\n  | H |',
        strengths: 'High damage reduction.',
        weaknesses: 'Often slower than other enemies.',
        habitat: 'Fortresses, mountains, and ancient ruins.'
    },
    {
        type: 'Swift',
        name: 'Swift Hunter',
        description: 'Creatures like Dire Wolves that rely on speed over raw power. They have less health and offer fewer rewards but are quickly defeated.',
        asciiArt: ' (> \'>)\n--))((-\n  /\' \'\\',
        strengths: 'Attacks quickly (conceptual). Low health.',
        weaknesses: 'Low gold and item drop rates.',
        habitat: 'Forests, plains, and open fields.'
    },
    {
        type: 'Hoarder',
        name: 'Treasure Hoarder',
        description: 'Often a Goblin with an oversized sack, these enemies are tough to take down but drop a massive amount of gold upon defeat.',
        asciiArt: '  ($-$)\n /|$$$|\\\n [\\_$_/]',
        strengths: 'Very high health.',
        weaknesses: 'Minimal damage output.',
        habitat: 'Dungeons, caves, and anywhere treasure might be found.'
    },
    {
        type: 'Boss',
        name: 'Stage Guardian',
        description: 'Powerful sentinels that appear every 10 stages. Defeating them is a true test of your team\'s strength and is required to progress.',
        asciiArt: '   (ಠ益ಠ)\n--[[+]]--\n /| | |\\\n  L   J',
        strengths: 'Extremely high health and gold rewards.',
        weaknesses: 'None.',
        habitat: 'End of major stage milestones.'
    },
    {
        type: 'Caster',
        name: 'Magical Anomaly',
        description: 'Creatures that wield arcane energies. While physically frail, their magical attacks can be unpredictable. They often drop magical reagents.',
        asciiArt: '   *.*\n ~(-,-)~\n --)|(--\n   /\"\\',
        strengths: 'Can apply debuffs (conceptual).',
        weaknesses: 'Low health.',
        habitat: 'Magic-infused forests, ancient libraries, and ley-line convergences.'
    },
    {
        type: 'Squad',
        name: 'Enemy Squad',
        description: 'A group of weaker enemies fighting together. Their combined strength makes them tougher and more rewarding than a single foe.',
        asciiArt: '(o.o) (o.o)\\n-| |---| |-\n / \\   / \\',
        strengths: 'Higher health and rewards than a normal enemy.',
        weaknesses: 'Still just a bunch of minions.',
        habitat: 'Camps, outposts, and patrol routes.'
    },
    {
        type: 'Minerals',
        name: 'Rock Golem',
        description: 'Living creatures made of stone and crystal. They are sturdy and often drop valuable ores and stones when defeated.',
        asciiArt: '  (¤-¤)\\n /[ # ]\\\n/[_#_]\\',
        strengths: 'Slightly higher health.',
        weaknesses: 'None',
        habitat: 'Caves, mountains, and anywhere with rich mineral deposits.'
    },
    {
        type: 'Flora',
        name: 'Vineshrieker',
        description: 'Aggressive plant life, often camouflaged in forests or swamps. They can entangle their prey and sometimes drop rare herbs.',
        asciiArt: '   \\|/\n  (o,o)\n --)|(--\n   /|\\',
        strengths: 'Can slow heroes (conceptual).',
        weaknesses: 'Fire-based attacks.',
        habitat: 'Deep forests, jungles, and overgrown ruins.'
    },
    {
        type: 'Fauna',
        name: 'Wild Beast',
        description: 'A general term for the aggressive animals of the world, from giant boars to fierce wolves. They are a primary source for leathers and hides.',
        asciiArt: '  (ô..ô)\n /| \'--\'|\\\n/ |    | \\',
        strengths: 'Often fast and aggressive.',
        weaknesses: 'None in particular.',
        habitat: 'Plains, mountains, and forests.'
    },
    {
        type: 'Aquatic',
        name: 'Water Elemental',
        description: 'Creatures of pure water, they can be tough to damage with physical attacks.',
        asciiArt: '  ( o )\n-(~o~)-\n<><><>',
        strengths: 'Resistant to physical harm.',
        weaknesses: 'Vulnerable to lightning.',
        habitat: 'Oceans, lakes, and elemental planes.'
    },
];

@Injectable({ providedIn: 'root' })
export class GameService {
  static STANDARD_SUMMON_COST_GOLD = 1000;
  static PREMIUM_SUMMON_COST_PRESTIGE = 10;
  // FIX: Added missing GUILD_CREATE_COST static property.
  static readonly GUILD_CREATE_COST = 1_000_000;
  // FIX: Defined WEAVE_MEMORY_COST as a static readonly property.
  static readonly WEAVE_MEMORY_COST = 5; // Prestige Points
  // FIX: Defined FORGE_DESTINY_COST as a static readonly property.
  static readonly FORGE_DESTINY_COST = 50000; // Gold
  
  gameState = signal<GameState>(INITIAL_GAME_STATE);
  heroes = signal<Hero[]>([]);
  inventory = signal<EquipmentItem[]>([]);
  quests = signal<Quest[]>([]);

  // Signals for combat effects
  damageFlashes = signal<{ id: number; damage: number; x: number; type: 'click' | 'dps' | 'skill' }[]>([]);
  goldFlashes = signal<{ id: number; amount: number; x: number; y: number }[]>([]); // NEW: for gold collection animation
  lastSkillUsed = signal<{ heroId: number; rarity: Rarity } | null>(null);
  stageCleared = signal(false);
  enemyIsShaking = signal(false);
  enemyHit = signal(false);
  heroAttackPulse = signal(false);
  lastItemDrop = signal<EquipmentItem | null>(null);
  lastMaterialDrop = signal<{ name: string; quantity: number; rarity: Rarity; }[] | null>(null);
  
  // Navigation signals
  heroToViewInTeam = signal<number | undefined>(undefined);
  itemToViewInEnchant = signal<number | undefined>(undefined);
  
  // Offline report
  offlineReport = signal<{ seconds: number; gold: number; xp: number } | null>(null);
  
  // Tower
  towerEnemy = signal<Enemy | null>(null);
  towerChoices = signal<TowerChallenge[]>([]);
  isInTowerCombat = signal(false);
  
  // Rift
  currentRiftEnemy = signal<RiftEnemy | null>(null);
  
  // Combat State
  _currentEnemy = signal<Enemy | null>(null);
  currentEnemy = computed(() => this._currentEnemy());

  private _gameLoopInterval: any;
  private _lastTickTimestamp: number = Date.now();
  private _dpsDamageQueue: { amount: number, type: 'dps' | 'click' | 'skill' }[] = [];
  private _heroAttackTimer: number = 0;
  private readonly _HERO_ATTACK_INTERVAL_MS = 1000; // How often individual heroes contribute visually
  private readonly _TICK_INTERVAL_MS = 100; // 10 ticks per second

  // Computed for active team and synergies
  activeHeroes = computed(() => {
    const allHeroes = this.heroes();
    const activeIds = this.gameState().activeHeroIds;
    return activeIds
      .map(id => (id ? allHeroes.find(h => h.id === id) : null))
      .filter(h => h !== null) as Hero[];
  });

  totalDps = computed(() => {
    let baseDps = this.activeHeroes().reduce((sum, hero) => sum + hero.currentDps, 0);
    const globalDpsBonus = this.gameState().headquartersUpgrades['globalDpsPercent'] ?
                           this.gameState().headquartersUpgrades['globalDpsPercent'] * 0.01 : 0; // Each level gives 1%

    // Apply skill tree bonuses
    for (const nodeId of this.gameState().unlockedSkillTreeNodes) {
        const node = SKILL_TREE_DATA.find(n => n.id === nodeId);
        if (node) {
            for (const effect of node.effects) {
                if (effect.type === 'dpsPercent') {
                    baseDps *= (1 + effect.value);
                }
            }
        }
    }
    // Apply guild bonuses
    const guild = this.gameState().guild;
    if (guild) {
        const guildBonuses = this.getGuildBonuses(guild.level);
        if (guildBonuses.dpsPercent) {
            baseDps *= (1 + guildBonuses.dpsPercent);
        }
    }

    return baseDps * (1 + globalDpsBonus);
  });

  activeSynergies = computed(() => {
    const activeHeroes = this.activeHeroes();
    const roleCounts: Partial<Record<Role, number>> = {};
    for (const hero of activeHeroes) {
      roleCounts[hero.role] = (roleCounts[hero.role] || 0) + 1;
    }

    const activeBonuses: { role: Role, description: string, bonus: { type: 'dpsPercent' | 'goldDropPercent' | 'clickDamagePercent', value: number } }[] = [];

    for (const role in roleCounts) {
      const bonusesForRole = SYNERGY_BONUSES[role as Role];
      if (bonusesForRole) {
        for (const synergy of bonusesForRole) {
          if (roleCounts[role as Role]! >= synergy.count) {
            activeBonuses.push({ role: role as Role, ...synergy });
          }
        }
      }
    }
    return activeBonuses;
  });
  
  constructor(private chronicleService: ChronicleService) {
    this._loadGame();
    this.startGameLoop();
  }

  /**
   * Recalculates derived stats (DPS, HP, cost) for a hero based on its level, ascension, and base stats.
   * Initializes any missing mutable properties (equipment, XP, etc.) with default values, ensuring a complete Hero object.
   * @param heroData A partial Hero object, which can be a base hero template or an existing hero with some mutable properties.
   * @returns A complete Hero object with all derived stats calculated and mutable properties initialized.
   */
  private _recalculateHeroStats(heroData: Partial<Hero>): Hero {
    const baseHeroTemplate = ALL_HEROES.find(h => h.id === heroData.id);
    if (!baseHeroTemplate) {
      console.error(`Attempted to recalculate stats for unknown hero ID: ${heroData.id}. Returning a minimal valid hero.`);
      // Return a default/minimal valid hero to prevent crashes, but log the error.
      return {
        id: heroData.id ?? -1,
        name: heroData.name ?? 'Unknown Hero',
        level: heroData.level ?? 1,
        baseDps: heroData.baseDps ?? 1,
        baseHp: heroData.baseHp ?? 100,
        baseCost: heroData.baseCost ?? 10,
        upgradeCostMultiplier: heroData.upgradeCostMultiplier ?? 1.1,
        rarity: heroData.rarity ?? 'Common',
        role: heroData.role ?? 'DPS',
        baseClass: heroData.baseClass ?? 'Unknown',
        skillDescription: heroData.skillDescription ?? '',
        lore: heroData.lore ?? '',
        currentDps: 1, // Will be recalculated
        maxHp: 100,    // Will be recalculated
        currentHp: 100, // Will be recalculated
        nextLevelCost: 10, // Will be recalculated
        equipment: { Weapon: null, Armor: null, Accessory: null },
        skillCharge: 0,
        skillReady: false,
        isFavorite: false,
        currentXp: 0,
        xpToNextLevel: 100,
        offlineXp: 0,
        stats: { totalDamageDealt: 0, skillsUsed: 0 },
        ascensionLevel: 0,
        skillLevel: 1,
      };
    }

    // Combine base template with existing hero data, applying defaults for unset mutable properties
    const hero: Hero = {
      ...baseHeroTemplate, // Base stats (id, name, rarity, role, baseDps, baseHp, etc.)
      ...heroData,        // Overwrite with existing heroData (level, ascensionLevel, currentHp etc.)
      
      // Ensure mutable properties have defaults if not provided in heroData
      level: heroData.level ?? 1,
      ascensionLevel: heroData.ascensionLevel ?? 0,
      skillLevel: heroData.skillLevel ?? 1,
      currentXp: heroData.currentXp ?? 0,
      // xpToNextLevel should scale with level, default to 100 for level 1 if not provided
      xpToNextLevel: heroData.xpToNextLevel ?? (heroData.level ? Math.floor(100 * Math.pow(1.1, heroData.level - 1)) : 100),
      offlineXp: heroData.offlineXp ?? 0,
      isFavorite: heroData.isFavorite ?? false,
      
      // Ensure complex objects are initialized
      equipment: heroData.equipment ?? { Weapon: null, Armor: null, Accessory: null },
      stats: heroData.stats ?? { totalDamageDealt: 0, skillsUsed: 0 },

      // Derived properties - these will be recalculated below
      currentDps: 0,
      maxHp: 0,
      currentHp: 0,
      skillCharge: heroData.skillCharge ?? 0,
      skillReady: heroData.skillReady ?? false,
      nextLevelCost: 0,
    };

    // 1. Calculate currentDps
    let dpsMultiplier = 1;
    dpsMultiplier += hero.ascensionLevel * 0.15; // 15% bonus per ascension level

    hero.currentDps = Math.floor(hero.baseDps * hero.level * dpsMultiplier);

    // 2. Calculate maxHp
    let hpMultiplier = 1;
    hpMultiplier += hero.ascensionLevel * 0.20; // 20% bonus per ascension level for HP (arbitrary, adjust for balance)

    hero.maxHp = Math.floor(hero.baseHp * hero.level * hpMultiplier);
    
    // Ensure currentHp is set based on new maxHp, or preserved if it's an existing hero below max.
    // If heroData.currentHp was not provided (e.g. new hero), set to max.
    // Otherwise, clamp existing currentHp to new maxHp.
    hero.currentHp = heroData.currentHp !== undefined ? Math.min(heroData.currentHp, hero.maxHp) : hero.maxHp;

    // 3. Calculate nextLevelCost
    hero.nextLevelCost = Math.floor(hero.baseCost * Math.pow(hero.upgradeCostMultiplier, hero.level));

    return hero;
  }

  private _loadGame() {
    try {
      const savedState = localStorage.getItem('idleHeroesUniverse');
      if (savedState) {
        const loadedState: GameState = JSON.parse(savedState);
        this.gameState.set(loadedState);
        
        // Re-initialize heroes based on loaded state
        const initialHeroesMap = new Map(ALL_HEROES.map(h => [h.id, h]));
        const loadedHeroes = loadedState.unlockedHeroIds.map(id => {
          const baseHero = initialHeroesMap.get(id);
          // For now, reconstruct based on base data. Full hero saving/loading would be more complex.
          if (baseHero) {
            // Merge base properties with any loaded mutable properties from gameState if available
            // Note: Current GameState only saves heroSkillLevels and heroSpecializations.
            // Other mutable properties like individual hero level, XP, equipment, ascensionLevel,
            // currentHp, isFavorite are NOT directly saved in GameState object itself.
            // They would reset to defaults provided here or in _recalculateHeroStats.
            const partialHero: Partial<Hero> = {
                id: baseHero.id,
                level: loadedState.heroSkillLevels[id] ? Math.floor(loadedState.heroSkillLevels[id]) : 1, // Using skill level to infer hero level (can be adjusted)
                skillLevel: loadedState.heroSkillLevels[id] ?? 1,
                // Add any other saved hero properties here once they are added to GameState
                // e.g., currentXp: loadedState.heroXp[id] || 0,
                // ascensionLevel: loadedState.heroAscension[id] || 0,
                // equipment: loadedState.heroEquipment[id] || { Weapon: null, Armor: null, Accessory: null },
            };
            return this._recalculateHeroStats(partialHero);
          }
          return null;
        }).filter(h => h !== null) as Hero[];

        this.heroes.set(loadedHeroes);
      } else {
        // Initial setup for the starting hero
        const initialHero = ALL_HEROES.find(h => h.id === 1)!;
        this.heroes.set([this._recalculateHeroStats({
            ...initialHero,
            level: 1, // Starting level
            ascensionLevel: 0,
            skillLevel: 1,
            // The rest will be initialized by _recalculateHeroStats
        })]);
        this.gameState.update(state => ({ ...state, unlockedHeroIds: [1] }));
      }
    } catch (e) {
      console.error('Failed to load game state:', e);
      this.gameState.set(INITIAL_GAME_STATE);
      // Reset heroes if loading fails
      this.heroes.set([this._recalculateHeroStats({
        ...ALL_HEROES.find(h => h.id === 1)!,
        level: 1,
        ascensionLevel: 0,
        skillLevel: 1,
        // The rest will be initialized by _recalculateHeroStats
      })]);
    }
    this._generateNewEnemy(); // Ensure an enemy is present
  }
  
  saveGame() {
    // Only save essential game state, heroes and inventory are handled
    const stateToSave = {
        ...this.gameState(),
        // Add specific fields from heroes if they are modified outside of gameState
        // e.g., this.heroes().map(h => ({id: h.id, level: h.level, equipment: h.equipment}))
    };
    localStorage.setItem('idleHeroesUniverse', JSON.stringify(stateToSave));
  }

  startGameLoop() {
    if (this._gameLoopInterval) clearInterval(this._gameLoopInterval);
    this._gameLoopInterval = setInterval(() => {
      this._gameLoopTick();
    }, this._TICK_INTERVAL_MS);
  }

  private _gameLoopTick() {
    const now = Date.now();
    const deltaTime = (now - this._lastTickTimestamp) / 1000; // in seconds
    this._lastTickTimestamp = now;

    // Apply passive DPS
    if (this.gameState().autoDpsEnabled && this._currentEnemy()) {
      const dps = this.totalDps();
      this._applyDamageToEnemy(dps * deltaTime, 'dps');
    }

    // Charge hero skills
    this._chargeHeroSkills(deltaTime);

    // Visual pulse for hero attacks (every second, purely cosmetic)
    this._heroAttackTimer += deltaTime;
    if (this._heroAttackTimer >= 1) {
      this.heroAttackPulse.set(true);
      setTimeout(() => this.heroAttackPulse.set(false), 100); // Brief flash
      this._heroAttackTimer = 0;
    }

    // Clear damage flashes after animation
    this.damageFlashes.update(flashes => flashes.filter(f => now - f.id < 1000)); // Remove flashes older than 1 second
    this.goldFlashes.update(flashes => flashes.filter(f => now - f.id < 2000)); // Remove gold flashes older than 2 seconds

  }

  private _applyDamageToEnemy(amount: number, type: 'dps' | 'click' | 'skill', heroRarity?: Rarity) {
    if (!this._currentEnemy()) return;

    let damageToApply = amount;
    this._currentEnemy.update(enemy => {
        const newHp = Math.max(0, enemy.currentHp - damageToApply);
        
        // Trigger visual feedback
        this.enemyHit.set(true);
        this.enemyIsShaking.set(true);
        setTimeout(() => {
          this.enemyHit.set(false);
          this.enemyIsShaking.set(false);
        }, 100);

        this.damageFlashes.update(flashes => [
          ...flashes, 
          { 
            id: Date.now() + Math.random(), 
            damage: Math.floor(damageToApply), 
            x: 40 + Math.random() * 20, // Random X around center
            y: 50 + Math.random() * 20, // Random Y around center
            type: type 
          }
        ]);

        return { ...enemy, currentHp: newHp };
    });

    if (this._currentEnemy()!.currentHp <= 0) {
        this._enemyDefeated();
    }
  }

  private _chargeHeroSkills(deltaTime: number) {
    this.heroes.update(allHeroes => allHeroes.map(hero => {
      if (hero.level === 0 || hero.skillReady) return hero;

      const baseChargeRate = 10; // Base charge per second
      let skillChargeMultiplier = 1;

      // Apply skill tree bonuses
      for (const nodeId of this.gameState().unlockedSkillTreeNodes) {
          const node = SKILL_TREE_DATA.find(n => n.id === nodeId);
          if (node) {
              for (const effect of node.effects) {
                  if (effect.type === 'skillChargeRate') {
                      skillChargeMultiplier += effect.value;
                  }
              }
          }
      }
      // Apply pet bonuses
      const equippedPet = this.gameState().pets.find(p => p.isEquipped);
      if (equippedPet) {
          const petDetails = ALL_PETS.find(p => p.id === equippedPet.petId);
          if (petDetails && petDetails.bonusType === 'skillChargeRate') {
              const ascensionMultiplier = 1 + (equippedPet.ascensionLevel * 1);
              skillChargeMultiplier += (petDetails.baseBonus + ((equippedPet.level - 1) * petDetails.bonusPerLevel)) * ascensionMultiplier;
          }
      }

      const newCharge = hero.skillCharge + (baseChargeRate * skillChargeMultiplier * deltaTime);
      if (newCharge >= 100) {
        return { ...hero, skillCharge: 100, skillReady: true };
      }
      return { ...hero, skillCharge: newCharge };
    }));
  }

  private _enemyDefeated() {
    const defeatedEnemy = this._currentEnemy();
    if (!defeatedEnemy) return;

    // Discover monster type for Codex
    this.gameState.update(state => {
      if (!state.discoveredMonsterTypes.includes(defeatedEnemy.type)) {
        return { ...state, discoveredMonsterTypes: [...state.discoveredMonsterTypes, defeatedEnemy.type] };
      }
      return state;
    });

    // Award Gold
    let goldEarned = defeatedEnemy.goldReward * this.gameState().goldMultiplier;
    // Apply skill tree bonuses
    for (const nodeId of this.gameState().unlockedSkillTreeNodes) {
        const node = SKILL_TREE_DATA.find(n => n.id === nodeId);
        if (node) {
            for (const effect of node.effects) {
                if (effect.type === 'goldDropPercent') {
                    goldEarned *= (1 + effect.value);
                }
            }
        }
    }
    // Apply pet bonuses
    const equippedPet = this.gameState().pets.find(p => p.isEquipped);
    if (equippedPet) {
        const petDetails = ALL_PETS.find(p => p.id === equippedPet.petId);
        if (petDetails && petDetails.bonusType === 'goldDropPercent') {
            const ascensionMultiplier = 1 + (equippedPet.ascensionLevel * 1);
            goldEarned *= (1 + (petDetails.baseBonus + ((equippedPet.level - 1) * petDetails.bonusPerLevel)) * ascensionMultiplier);
        }
    }
    // Apply guild bonuses
    const guild = this.gameState().guild;
    if (guild) {
        const guildBonuses = this.getGuildBonuses(guild.level);
        if (guildBonuses.goldDropPercent) {
            goldEarned *= (1 + guildBonuses.goldDropPercent);
        }
    }


    this.gameState.update(state => ({
      ...state,
      gold: state.gold + goldEarned,
      totalGoldEarned: state.totalGoldEarned + goldEarned,
      totalEnemiesDefeated: state.totalEnemiesDefeated + 1,
    }));
    
    // Trigger gold particles
    this.goldFlashes.update(flashes => [
        ...flashes,
        {
            id: Date.now(),
            amount: goldEarned,
            x: 40 + Math.random() * 20, // Random X around center
            y: 50 + Math.random() * 20, // Random Y around center
        }
    ]);

    // Award XP to active heroes (simple distribution for now)
    const xpPerEnemy = 10 * this.gameState().stage; // Base XP
    const active = this.activeHeroes();
    if (active.length > 0) {
        const xpPerHero = xpPerEnemy / active.length;
        this.heroes.update(allHeroes => allHeroes.map(hero => {
            if (active.some(ah => ah.id === hero.id)) {
                return { ...hero, currentXp: hero.currentXp + xpPerHero };
            }
            return hero;
        }));
    }

    // Item Drop (simplified for now)
    if (Math.random() < 0.1) { // 10% chance for an item drop
        const newItem = this._generateDroppedItem(this.gameState().stage);
        if (newItem) {
            this.inventory.update(inv => [...inv, newItem]);
            this.lastItemDrop.set(newItem);
            setTimeout(() => this.lastItemDrop.set(null), 3000);
            this.gameState.update(s => ({ ...s, totalItemsForged: s.totalItemsForged + 1 })); // Incorrect counter, will fix later
        }
    }
    
    // Material Drop (simplified for now)
    if (Math.random() < 0.2) { // 20% chance for a material drop
        const newMaterial = this._generateDroppedMaterial(defeatedEnemy.type);
        if (newMaterial) {
            // FIX: Replaced `this.addMaterial` with the newly defined method.
            this.addMaterial(newMaterial.id, 1);
            this.lastMaterialDrop.set([{ name: newMaterial.name, quantity: 1, rarity: newMaterial.rarity }]);
            setTimeout(() => this.lastMaterialDrop.set(null), 3000);
        }
    }

    // Stage progression
    this.gameState.update(state => ({ ...state, stage: state.stage + 1 }));
    this.stageCleared.set(true);
    setTimeout(() => this.stageCleared.set(false), 1500);

    // Generate new enemy
    this._generateNewEnemy();
  }

  private _generateDroppedItem(stage: number, forcedRarity?: Rarity): EquipmentItem | null {
    const possibleRarities: Rarity[] = ['Common', 'Rare', 'Epic']; // For simplicity
    const rarity = forcedRarity || possibleRarities[Math.floor(Math.random() * possibleRarities.length)];

    const stats = this._generateItemStats(rarity, stage);
    if (!stats) return null;

    const newItem: EquipmentItem = {
      id: Date.now() + Math.random(),
      name: `${rarity} ${stats.slot}`,
      slot: stats.slot,
      bonusType: stats.bonusType,
      bonusValue: stats.bonusValue,
      baseBonusValue: stats.bonusValue,
      enchantLevel: 0,
      rarity: rarity,
      lore: `Found on stage ${stage}`
    };
    return newItem;
  }

  private _generateItemStats(rarity: Rarity, stage: number) {
    const baseValue = stage * 0.5 + 5; // Scales with stage
    let multiplier = 1;
    switch(rarity) {
      case 'Rare': multiplier = 1.5; break;
      case 'Epic': multiplier = 2.5; break;
      case 'Legendary': multiplier = 5; break;
      case 'Mythic': multiplier = 10; break;
    }
    const bonusValue = Math.floor(baseValue * multiplier);

    const possibleSlots: EquipmentSlot[] = ['Weapon', 'Armor', 'Accessory'];
    const slot = possibleSlots[Math.floor(Math.random() * possibleSlots.length)];
    const bonusType: EquipmentBonusType = 'dpsFlat'; // Simplified

    return { slot, bonusType, bonusValue };
  }
  
  private _generateDroppedMaterial(enemyType: EnemyType): Material | null {
    const possibleMaterials: Material[] = ALL_MATERIALS.filter(m => {
        switch(enemyType) {
            case 'Minerals': return m.type === 'Ore' || m.type === 'Stone';
            case 'Flora': return m.type === 'Herb' || m.type === 'Wood';
            case 'Fauna': return m.type === 'Leather';
            case 'Aquatic': return m.type === 'Fish';
            case 'Caster': return m.type === 'Reagent' || m.type === 'Dust';
            case 'Normal':
            case 'Armored':
            case 'Swift':
            case 'Hoarder':
            case 'Boss':
            case 'Squad':
            default: return m.type === 'Dust' || m.type === 'Cloth' || m.type === 'Herb'; // General drops
        }
    });

    if (possibleMaterials.length === 0) return null;

    // Simple rarity weighting
    const rarityRoll = Math.random();
    let targetRarity: Rarity = 'Common';
    if (rarityRoll < 0.05) targetRarity = 'Epic';
    else if (rarityRoll < 0.25) targetRarity = 'Rare';

    const filteredByRarity = possibleMaterials.filter(m => m.rarity === targetRarity);
    if (filteredByRarity.length > 0) {
        return filteredByRarity[Math.floor(Math.random() * filteredByRarity.length)];
    }
    // Fallback to any material if target rarity not found
    return possibleMaterials[Math.floor(Math.random() * possibleMaterials.length)];
  }

  private _generateNewEnemy() {
    const stage = this.gameState().stage;
    const isBoss = stage % 10 === 0;
    const enemyLevel = Math.floor(stage / 5) + 1;

    let enemyType: EnemyType = 'Normal';
    const randType = Math.random();
    if (isBoss) {
      enemyType = 'Boss';
    } else if (stage > 10 && randType < 0.1) {
      enemyType = 'Hoarder';
    } else if (stage > 20 && randType < 0.2) {
      enemyType = 'Armored';
    } else if (stage > 30 && randType < 0.3) {
      enemyType = 'Caster';
    } else if (stage > 40 && randType < 0.4) {
      enemyType = 'Squad';
    } else if (stage > 50 && randType < 0.5) {
      enemyType = 'Minerals';
    } else if (stage > 60 && randType < 0.6) {
      enemyType = 'Flora';
    } else if (stage > 70 && randType < 0.7) {
      enemyType = 'Fauna';
    } else if (stage > 80 && randType < 0.8) {
      enemyType = 'Aquatic';
    }


    const possibleArt = ASCII_ART[enemyType];
    const asciiArt = possibleArt[Math.floor(Math.random() * possibleArt.length)];

    const baseHp = 100 * (1 + (stage * 0.1));
    const goldReward = 10 * (1 + (stage * 0.05));

    this._currentEnemy.set({
      name: `${enemyType} Foe Lvl ${enemyLevel}`,
      maxHp: baseHp,
      currentHp: baseHp,
      asciiArt: asciiArt,
      goldReward: goldReward,
      isBoss: isBoss,
      type: enemyType,
    });
  }

  isDailyRewardAvailable(): boolean {
    const state = this.gameState();
    if (!state.lastLoginDate) return true; // First login ever

    const today = new Date().toISOString().split('T')[0];
    return state.lastLoginDate < today;
  }
  
  getDailyRewardForDay(day: number): { gold: number; prestigePoints: number } {
    const baseGold = 1000 + (day * 500);
    const prestige = day % 7 === 0 ? 5 : 0; // Every 7th day, get prestige
    return { gold: baseGold, prestigePoints: prestige };
  }

  clearOfflineReport() {
    this.offlineReport.set(null);
  }

  claimDailyReward() {
    this.gameState.update(state => {
      const today = new Date().toISOString().split('T')[0];
      const newConsecutiveDays = state.lastLoginDate === today ? state.consecutiveLoginDays : state.consecutiveLoginDays + 1;
      const rewards = this.getDailyRewardForDay(newConsecutiveDays);
      
      return {
        ...state,
        gold: state.gold + rewards.gold,
        prestigePoints: state.prestigePoints + rewards.prestigePoints,
        lastLoginDate: today,
        consecutiveLoginDays: newConsecutiveDays,
      };
    });
  }
  
  playerClick() {
    if (!this._currentEnemy()) return;
    let clickDamage = this.gameState().clickDamage;

    // Apply skill tree bonuses
    for (const nodeId of this.gameState().unlockedSkillTreeNodes) {
        const node = SKILL_TREE_DATA.find(n => n.id === nodeId);
        if (node) {
            for (const effect of node.effects) {
                if (effect.type === 'clickDamagePercent') {
                    clickDamage *= (1 + effect.value);
                }
            }
        }
    }
    // Apply pet bonuses
    const equippedPet = this.gameState().pets.find(p => p.isEquipped);
    if (equippedPet) {
        const petDetails = ALL_PETS.find(p => p.id === equippedPet.petId);
        if (petDetails && petDetails.bonusType === 'clickDamagePercent') {
            const ascensionMultiplier = 1 + (equippedPet.ascensionLevel * 1);
            clickDamage *= (1 + (petDetails.baseBonus + ((equippedPet.level - 1) * petDetails.bonusPerLevel)) * ascensionMultiplier);
        }
    }


    this.gameState.update(state => ({ ...state, totalClicks: state.totalClicks + 1 }));
    this._applyDamageToEnemy(clickDamage, 'click');
  }

  activateHeroSkill(id: number) {
    this.heroes.update(allHeroes => allHeroes.map(hero => {
      if (hero.id === id && hero.skillReady) {
        let skillDamage = hero.currentDps * (5 + (hero.skillLevel - 1) * 0.5); // Base skill damage multiplier
        
        // Apply skill tree bonuses
        for (const nodeId of this.gameState().unlockedSkillTreeNodes) {
            const node = SKILL_TREE_DATA.find(n => n.id === nodeId);
            if (node) {
                for (const effect of node.effects) {
                    if (effect.type === 'skillDamagePercent') {
                        skillDamage *= (1 + effect.value);
                    }
                }
            }
        }

        this._applyDamageToEnemy(skillDamage, 'skill', hero.rarity);
        this.gameState.update(state => ({ ...state, totalSkillsUsed: state.totalSkillsUsed + 1 }));
        this.lastSkillUsed.set({ heroId: hero.id, rarity: hero.rarity });
        setTimeout(() => this.lastSkillUsed.set(null), 500);

        return { ...hero, skillCharge: 0, skillReady: false };
      }
      return hero;
    }));
  }

  toggleAutoDps() {
    this.gameState.update(s => ({...s, autoDpsEnabled: !s.autoDpsEnabled}));
  }

  toggleAutoSkill() {
    this.gameState.update(s => ({...s, autoSkillEnabled: !s.autoSkillEnabled}));
  }
  autoEquipBestGear(id: number) {}

  // --- Implemented Hero Progression ---
  
  getFusionCost(hero: Hero): { shards: number; gold: number } {
    const rarityMultiplier: Record<Rarity, number> = {
      'Common': 1, 'Rare': 5, 'Epic': 25, 'Legendary': 100, 'Mythic': 500,
    };
    const shards = (10 + (hero.ascensionLevel * 5)) * rarityMultiplier[hero.rarity];
    const gold = (10000 + (hero.ascensionLevel * 25000)) * rarityMultiplier[hero.rarity];
    return { shards, gold };
  }

  calculateCost(hero: Hero, levels: number): number {
    if (levels <= 0) return 0;
    const r = hero.upgradeCostMultiplier;
    const currentLevelCostReduction = this.gameState().headquartersUpgrades['heroCostReductionPercent'] ?? 0;
    const effectiveCostMultiplier = Math.max(1, 1 - (currentLevelCostReduction * 0.01));

    let totalCost = 0;
    for (let i = 0; i < levels; i++) {
        const costForLevel = Math.floor(hero.baseCost * Math.pow(r, hero.level + i) * effectiveCostMultiplier);
        totalCost += costForLevel;
    }
    return totalCost;
  }

  calculateMaxLevels(hero: Hero, gold: number): { levels: number, cost: number } {
    if (gold <= 0) return { levels: 0, cost: 0 };
    const r = hero.upgradeCostMultiplier;
    const currentLevelCostReduction = this.gameState().headquartersUpgrades['heroCostReductionPercent'] ?? 0;
    const effectiveCostMultiplier = Math.max(0.1, 1 - (currentLevelCostReduction * 0.01)); // Ensure it doesn't go below 10% cost

    let currentGold = gold;
    let levels = 0;
    let accumulatedCost = 0;

    for (let i = 0; i < 1000; i++) { // Limit iterations to prevent infinite loop for very large numbers
      const costForNextLevel = Math.floor(hero.baseCost * Math.pow(r, hero.level + levels) * effectiveCostMultiplier);
      if (currentGold >= costForNextLevel) {
        currentGold -= costForNextLevel;
        accumulatedCost += costForNextLevel;
        levels++;
      } else {
        break;
      }
    }
    return { levels, cost: accumulatedCost };
  }

  levelUpHero(id: number) {
    const heroToUpdate = this.heroes().find(h => h.id === id);
    if (!heroToUpdate) return;
    
    const cost = this.calculateCost(heroToUpdate, 1);

    if (this.gameState().gold >= cost) {
      this.gameState.update(state => ({ ...state, gold: state.gold - cost }));
      
      this.heroes.update(heroes => heroes.map(h => 
        h.id === id ? this._recalculateHeroStats({ ...h, level: h.level + 1 }) : h
      ));

      if (heroToUpdate.level === 0) {
        this.gameState.update(state => ({ ...state, unlockedHeroIds: [...state.unlockedHeroIds, id] }));
      }
    }
  }

  levelUpHeroMultiple(id: number, levels: number) {
    const heroToUpdate = this.heroes().find(h => h.id === id);
    if (!heroToUpdate || levels <= 0) return;

    const totalCost = this.calculateCost(heroToUpdate, levels);

    if (this.gameState().gold >= totalCost) {
      this.gameState.update(state => ({ ...state, gold: state.gold - totalCost }));
      this.heroes.update(heroes => heroes.map(h => 
        h.id === id ? this._recalculateHeroStats({ ...h, level: h.level + levels }) : h
      ));
    }
  }

  levelUpAllHeroes() {
    let currentGold = this.gameState().gold;
    // Create a deep copy of heroes to simulate upgrades without directly modifying the signal
    let heroesWorkingCopy = this.heroes().filter(h => h.level > 0).map(h => ({...h}));
    
    if (heroesWorkingCopy.length === 0) return;

    let somethingWasUpgraded = true;
    while(somethingWasUpgraded) {
        somethingWasUpgraded = false;
        // Sort by next level cost (cheapest first)
        heroesWorkingCopy.sort((a, b) => {
            const costA = this.calculateCost(a, 1);
            const costB = this.calculateCost(b, 1);
            return costA - costB;
        });
        
        // Try to upgrade the cheapest hero
        const cheapestHero = heroesWorkingCopy[0];
        if (cheapestHero && currentGold >= this.calculateCost(cheapestHero, 1)) {
            const costForNextLevel = this.calculateCost(cheapestHero, 1);
            currentGold -= costForNextLevel;
            // Update the hero's level in the working copy
            Object.assign(cheapestHero, this._recalculateHeroStats({ ...cheapestHero, level: cheapestHero.level + 1 }));
            somethingWasUpgraded = true;
        }
    }

    this.gameState.update(state => ({ ...state, gold: currentGold }));
    // Update the actual heroes signal with the changes from the working copy
    this.heroes.update(currentHeroes => currentHeroes.map(ch => {
        const updatedHero = heroesWorkingCopy.find(uh => uh.id === ch.id);
        return updatedHero ? this._recalculateHeroStats(updatedHero) : ch;
    }));
  }

  fuseHero(id: number): boolean {
    const heroToUpdate = this.heroes().find(h => h.id === id);
    if (!heroToUpdate) return false;

    const cost = this.getFusionCost(heroToUpdate);
    const state = this.gameState();
    
    const hasEnoughShards = (state.heroShards[id] || 0) >= cost.shards;
    const hasEnoughGold = state.gold >= cost.gold;

    if (hasEnoughShards && hasEnoughGold) {
      this.gameState.update(s => ({
        ...s,
        gold: s.gold - cost.gold,
        heroShards: { ...s.heroShards, [id]: (s.heroShards[id] || 0) - cost.shards }
      }));
      this.heroes.update(heroes => heroes.map(h => 
        h.id === id ? this._recalculateHeroStats({ ...h, ascensionLevel: h.ascensionLevel + 1 }) : h
      ));
      return true;
    }
    return false;
  }

  claimOfflineXp(id: number): number {
    let levelsGained = 0;
    this.heroes.update(heroes => {
      const heroIndex = heroes.findIndex(h => h.id === id);
      if (heroIndex === -1) return heroes;
      
      const newHeroes = [...heroes];
      let hero = { ...newHeroes[heroIndex] };

      let xpToSpend = hero.offlineXp;
      if (xpToSpend <= 0) return heroes;
      
      hero.currentXp += xpToSpend;
      hero.offlineXp = 0;

      while (hero.currentXp >= hero.xpToNextLevel) {
        hero.currentXp -= hero.xpToNextLevel;
        hero.level += 1;
        levelsGained++;
        hero.xpToNextLevel = Math.floor(hero.xpToNextLevel * 1.1); // XP required increases
      }
      
      newHeroes[heroIndex] = this._recalculateHeroStats(hero); // Recalculate stats after leveling up
      return newHeroes;
    });
    return levelsGained;
  }
  
  toggleHeroFavorite(id: number) {
    this.heroes.update(heroes => 
      heroes.map(h => h.id === id ? { ...h, isFavorite: !h.isFavorite } : h)
    );
  }

  swapActiveHero(heroIdToPlace: number, targetIndex: number) {
    this.gameState.update(state => {
      const newActiveIds = [...state.activeHeroIds];
      const heroAlreadyActiveAtIndex = newActiveIds.findIndex(id => id === heroIdToPlace);
      const heroAtTargetIndex = newActiveIds[targetIndex];

      if (heroAlreadyActiveAtIndex > -1) {
        newActiveIds[targetIndex] = heroIdToPlace;
        newActiveIds[heroAlreadyActiveAtIndex] = heroAtTargetIndex;
      } else {
        newActiveIds[targetIndex] = heroIdToPlace;
      }
      return { ...state, activeHeroIds: newActiveIds };
    });
  }

  removeHeroFromActiveSlot(index: number) {
    this.gameState.update(state => {
      const newActiveIds = [...state.activeHeroIds];
      if (index >= 0 && index < newActiveIds.length) {
        newActiveIds[index] = null;
      }
      return { ...state, activeHeroIds: newActiveIds };
    });
  }

  toggleTheme() {
    this.gameState.update(s => ({
      ...s,
      theme: s.theme === 'dark' ? 'light' : 'dark'
    }));
  }
  
  hardReset() {
    this.gameState.set(INITIAL_GAME_STATE);
  }

  addGold(amount: number) {
    this.gameState.update(s => ({ ...s, gold: s.gold + amount }));
  }

  // FIX: Added addMaterial method
  addMaterial(materialId: string, quantity: number) {
    this.gameState.update(state => ({
      ...state,
      materials: {
        ...state.materials,
        [materialId]: (state.materials[materialId] || 0) + quantity
      }
    }));
  }

  // FIX: Added utility formatNumber method for internal service use
  private _formatNumber(num: number): string {
    if (num < 1000) {
      return num.toFixed(0);
    }
    const suffixes = ["", "k", "M", "B", "T"];
    const i = Math.floor(Math.log10(num) / 3);
    const shortNum = (num / Math.pow(1000, i)).toFixed(1);
    return shortNum.replace(/\.0$/, '') + suffixes[i];
  }

  getShardCost(rarity: Rarity): number {
    switch(rarity) {
      case 'Common': return 10;
      case 'Rare': return 50;
      case 'Epic': return 250;
      case 'Legendary': return 1000;
      case 'Mythic': return 5000;
      default: return 10;
    }
  }
  purchaseHeroShards(heroId: number, amount: number): boolean {
    const hero = this.heroes().find(h => h.id === heroId);
    if (!hero) return false;
    
    const costPerShard = this.getShardCost(hero.rarity);
    const totalCost = costPerShard * amount;

    if (this.gameState().heroEssence < totalCost) {
      return false;
    }

    this.gameState.update(state => {
      const newShards = { ...state.heroShards };
      newShards[heroId] = (newShards[heroId] || 0) + amount;
      
      return {
        ...state,
        heroEssence: state.heroEssence - totalCost,
        heroShards: newShards,
      };
    });
    return true;
  }
  
  // Methods added to make components compile
  claimQuestReward(id: number) {
    this.quests.update(quests => quests.map(q => q.id === id ? { ...q, isClaimed: true } : q));
  }
  claimChronicleQuestReward(heroId: number, memoryId: string, questId: string) {
    this.gameState.update(state => {
      const heroMemories = { ...state.heroMemories };
      if (heroMemories[heroId]) {
        heroMemories[heroId] = heroMemories[heroId].map(mem => {
          if (mem.id === memoryId && mem.quest?.id === questId) {
            return { ...mem, quest: { ...mem.quest, isClaimed: true } };
          }
          return mem;
        });
      }
      return { ...state, heroMemories };
    });
  }
  
  claimMissionReward(missionId: string): MissionReward | null {
    const mission = ALL_MISSIONS.find(m => m.id === missionId);
    if (!mission) return null;

    const missionProgress = this.gameState().missionProgress;
    const highestClaimedTier = missionProgress[missionId] ?? -1;
    const currentTierIndex = highestClaimedTier + 1;
    const tierToClaim = mission.tiers[currentTierIndex];

    if (!tierToClaim) return null;

    this.gameState.update(state => {
      const newMissionProgress = { ...state.missionProgress };
      newMissionProgress[missionId] = currentTierIndex;
      
      let newGold = state.gold;
      let newPrestigePoints = state.prestigePoints;
      let newEnchantingDust = state.enchantingDust;
      let newSkillTomes = state.skillTomes;

      const reward = tierToClaim.reward;
      if (reward.gold) newGold += reward.gold;
      if (reward.prestigePoints) newPrestigePoints += reward.prestigePoints;
      if (reward.enchantingDust) newEnchantingDust += reward.enchantingDust;
      if (reward.skillTomes) newSkillTomes += reward.skillTomes;

      return {
        ...state,
        missionProgress: newMissionProgress,
        gold: newGold,
        prestigePoints: newPrestigePoints,
        enchantingDust: newEnchantingDust,
        skillTomes: newSkillTomes,
      };
    });

    return tierToClaim.reward;
  }

  craftItems(ids: number[]): boolean {
    const selectedItems = this.inventory().filter(item => ids.includes(item.id));
    if (selectedItems.length !== 3) return false;
  
    const firstItem = selectedItems[0];
    if (firstItem.rarity === 'Mythic') return false; // Max rarity
    if (!selectedItems.every(item => item.rarity === firstItem.rarity && item.slot === firstItem.slot)) return false;
  
    const currentRarityIndex = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'].indexOf(firstItem.rarity);
    const nextRarity = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'][currentRarityIndex + 1] as Rarity;
  
    // Remove old items
    this.inventory.update(inv => inv.filter(item => !ids.includes(item.id)));
  
    // Create new item
    const newItem: EquipmentItem = {
      id: Date.now() + Math.random(),
      name: `Superior ${firstItem.slot}`,
      slot: firstItem.slot,
      bonusType: firstItem.bonusType,
      bonusValue: firstItem.baseBonusValue * 2, // Double base value as an example
      baseBonusValue: firstItem.baseBonusValue * 2,
      enchantLevel: 0,
      rarity: nextRarity,
      lore: `Forged from ${firstItem.rarity} items`
    };
    this.inventory.update(inv => [...inv, newItem]);
    
    // Update highest rarity forged
    this.gameState.update(state => {
      const currentHighestIndex = state.highestRarityForged ? ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'].indexOf(state.highestRarityForged) : -1;
      const newRarityIndex = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'].indexOf(nextRarity);
      if (newRarityIndex > currentHighestIndex) {
        return { ...state, highestRarityForged: nextRarity, totalItemsForged: state.totalItemsForged + 1 };
      }
      return { ...state, totalItemsForged: state.totalItemsForged + 1 };
    });
    
    return true;
  }
  freeStandardSummon() {
    const unlockedHeroIds = this.gameState().unlockedHeroIds;
    const allHeroes = ALL_HEROES.filter(h => h.level === 0 || unlockedHeroIds.includes(h.id)); // All possible heroes, even if not yet unlocked

    const commonHeroes = allHeroes.filter(h => h.rarity === 'Common');
    const rareHeroes = allHeroes.filter(h => h.rarity === 'Rare');
    
    let selectedHeroData: Omit<Hero, 'currentDps' | 'nextLevelCost' | 'equipment' | 'skillCharge' | 'skillReady' | 'currentXp' | 'xpToNextLevel' | 'offlineXp'>;
    const roll = Math.random();

    if (roll < 0.10 && rareHeroes.length > 0) { // 10% chance for Rare
        selectedHeroData = rareHeroes[Math.floor(Math.random() * rareHeroes.length)];
    } else { // 90% chance for Common
        selectedHeroData = commonHeroes[Math.floor(Math.random() * commonHeroes.length)];
    }

    const isNew = !unlockedHeroIds.includes(selectedHeroData.id);
    let goldBonus = null;
    let shardsGained = null;

    if (isNew) {
      // Unlock the hero
      this.heroes.update(heroes => [...heroes, this._recalculateHeroStats(selectedHeroData)]);
      this.gameState.update(state => ({ ...state, unlockedHeroIds: [...state.unlockedHeroIds, selectedHeroData.id], totalHeroesSummoned: state.totalHeroesSummoned + 1 }));
    } else {
      // Duplicate, give shards and gold
      goldBonus = selectedHeroData.baseCost * 10;
      shardsGained = this.getShardCost(selectedHeroData.rarity);
      this.addGold(goldBonus);
      this.gameState.update(state => ({
        ...state,
        heroShards: {
          ...state.heroShards,
          [selectedHeroData.id]: (state.heroShards[selectedHeroData.id] || 0) + shardsGained
        }
      }));
    }

    this.gameState.update(state => ({ ...state, lastFreeStandardSummonTimestamp: Date.now(), standardPityCount: (state.standardPityCount ?? 0) + 1 }));
    
    return { hero: selectedHeroData, isNew, goldBonus, shardsGained };
  }
  summonHero(type: 'standard' | 'premium') {
    const unlockedHeroIds = this.gameState().unlockedHeroIds;
    const allHeroes = ALL_HEROES.filter(h => h.level === 0 || unlockedHeroIds.includes(h.id)); // All possible heroes, even if not yet unlocked

    let selectedHeroData: Omit<Hero, 'currentDps' | 'nextLevelCost' | 'equipment' | 'skillCharge' | 'skillReady' | 'currentXp' | 'xpToNextLevel' | 'offlineXp'>;
    let isNew: boolean;
    let goldBonus: number | null = null;
    let shardsGained: number | null = null;

    this.gameState.update(state => {
      let newStandardPity = state.standardPityCount ?? 0;
      let newPremiumPity = state.premiumPityCount ?? 0;

      if (type === 'standard') {
        const cost = GameService.STANDARD_SUMMON_COST_GOLD;
        if (state.gold < cost) return state; // Should be checked before calling
        state = { ...state, gold: state.gold - cost };
        newStandardPity++;
        
        const commonHeroes = allHeroes.filter(h => h.rarity === 'Common');
        const rareHeroes = allHeroes.filter(h => h.rarity === 'Rare');
        const epicHeroes = allHeroes.filter(h => h.rarity === 'Epic');

        const roll = Math.random();

        if (newStandardPity >= 50 || (roll < 0.05 && epicHeroes.length > 0)) { // 5% chance for Epic, 100% at 50 pity
          selectedHeroData = epicHeroes[Math.floor(Math.random() * epicHeroes.length)];
          newStandardPity = 0;
        } else if (roll < 0.25 && rareHeroes.length > 0) { // 25% chance for Rare
          selectedHeroData = rareHeroes[Math.floor(Math.random() * rareHeroes.length)];
        } else { // Remainder for Common
          selectedHeroData = commonHeroes[Math.floor(Math.random() * commonHeroes.length)];
        }
      } else { // Premium Summon
        const cost = GameService.PREMIUM_SUMMON_COST_PRESTIGE;
        if (state.prestigePoints < cost) return state; // Should be checked before calling
        state = { ...state, prestigePoints: state.prestigePoints - cost };
        newPremiumPity++;

        const rareHeroes = allHeroes.filter(h => h.rarity === 'Rare');
        const epicHeroes = allHeroes.filter(h => h.rarity === 'Epic');
        const legendaryHeroes = allHeroes.filter(h => h.rarity === 'Legendary');
        const mythicHeroes = allHeroes.filter(h => h.rarity === 'Mythic');

        const roll = Math.random();

        if (newPremiumPity >= 20 || (roll < 0.02 && mythicHeroes.length > 0)) { // 2% chance for Mythic, 100% at 20 pity
          selectedHeroData = mythicHeroes[Math.floor(Math.random() * mythicHeroes.length)];
          newPremiumPity = 0;
        } else if (roll < 0.10 && legendaryHeroes.length > 0) { // 10% chance for Legendary
          selectedHeroData = legendaryHeroes[Math.floor(Math.random() * legendaryHeroes.length)];
        } else if (roll < 0.40 && epicHeroes.length > 0) { // 40% chance for Epic
          selectedHeroData = epicHeroes[Math.floor(Math.random() * epicHeroes.length)];
        } else { // Remainder for Rare (guaranteed rare or better)
          selectedHeroData = rareHeroes[Math.floor(Math.random() * rareHeroes.length)];
        }
      }

      isNew = !unlockedHeroIds.includes(selectedHeroData.id);

      if (isNew) {
        this.heroes.update(heroes => [...heroes, this._recalculateHeroStats(selectedHeroData)]);
        state = { ...state, unlockedHeroIds: [...state.unlockedHeroIds, selectedHeroData.id], totalHeroesSummoned: state.totalHeroesSummoned + 1 };
      } else {
        goldBonus = selectedHeroData.baseCost * 10;
        shardsGained = this.getShardCost(selectedHeroData.rarity);
        state = { ...state, gold: state.gold + goldBonus, heroShards: { ...state.heroShards, [selectedHeroData.id]: (state.heroShards[selectedHeroData.id] || 0) + shardsGained } };
      }

      return { ...state, standardPityCount: newStandardPity, premiumPityCount: newPremiumPity };
    });
    
    return { hero: selectedHeroData!, isNew, goldBonus, shardsGained };
  }
  summonHeroes(type: 'standard', count: number): { hero: Omit<Hero, 'currentDps' | 'nextLevelCost' | 'equipment' | 'skillCharge' | 'skillReady' | 'currentXp' | 'xpToNextLevel' | 'offlineXp'>, isNew: boolean, goldBonus: number | null, shardsGained: number | null }[] {
    const results: { hero: Omit<Hero, 'currentDps' | 'nextLevelCost' | 'equipment' | 'skillCharge' | 'skillReady' | 'currentXp' | 'xpToNextLevel' | 'offlineXp'>, isNew: boolean, goldBonus: number | null, shardsGained: number | null }[] = [];
    for (let i = 0; i < count; i++) {
        results.push(this.summonHero(type)!); // Call single summon logic repeatedly
    }
    return results;
  }
  generateTowerChoices() {
    const choices: TowerChallenge[] = [];
    const floor = this.gameState().towerFloor;

    // Mock choices for now
    choices.push({
      type: 'Combat',
      title: 'Fight Monster',
      description: 'Engage a challenging foe for rewards.',
      rewardText: 'Gold & XP',
      style: {
        borderColor: 'border-red-500',
        textColor: 'text-red-400',
        shadowColor: 'shadow-red-500/30',
        dividerColor: 'border-red-700',
        icon: '⚔️'
      }
    });
    choices.push({
      type: 'Treasure',
      title: 'Open Chest',
      description: 'Claim a chest with various resources.',
      rewardText: 'Gold, Items, or Dust',
      style: {
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-400',
        shadowColor: 'shadow-yellow-500/30',
        dividerColor: 'border-yellow-700',
        icon: '💰'
      }
    });
    choices.push({
      type: 'Mystery',
      title: 'Mysterious Portal',
      description: 'Step through a portal to an unknown fate.',
      rewardText: 'Anything could happen!',
      style: {
        borderColor: 'border-purple-500',
        textColor: 'text-purple-400',
        shadowColor: 'shadow-purple-500/30',
        dividerColor: 'border-purple-700',
        icon: '🔮'
      }
    });

    this.gameState.update(state => ({
      ...state,
      towerState: { ...state.towerState, currentChoices: choices }
    }));
  }

  selectTowerChallenge(challenge: TowerChallenge): TowerChallengeOutcome {
    this.gameState.update(state => ({ ...state, towerState: { ...state.towerState, currentChoices: [] } })); // Clear choices
    
    if (challenge.type === 'Combat') {
      const floor = this.gameState().towerFloor;
      const enemyHp = 1000 * (1 + floor * 0.2);
      this.towerEnemy.set({
        name: `Tower Guardian F${floor}`,
        maxHp: enemyHp,
        currentHp: enemyHp,
        asciiArt: ASCII_ART['Boss'][0], // Use a boss art
        goldReward: 0, // No gold in tower combat directly
        isBoss: true,
        type: 'Boss'
      });
      this.isInTowerCombat.set(true);
      return { type: 'combat_start', title: 'Combat Initiated', description: 'Defeat the Tower Guardian!' };
    } else if (challenge.type === 'Treasure') {
      const goldReward = 5000 * this.gameState().towerFloor;
      this.addGold(goldReward);
      return { type: 'reward', title: 'Treasure Found!', description: `You found ${this._formatNumber(goldReward)} Gold!` };
    } else { // Mystery
      const rand = Math.random();
      if (rand < 0.5) {
        this.addGold(1000 * this.gameState().towerFloor);
        return { type: 'reward', title: 'A Lucky Find!', description: `A friendly spirit grants you ${this._formatNumber(1000 * this.gameState().towerFloor)} Gold!` };
      } else {
        // Lose some gold, or get a weak enemy
        this.addGold(-500 * this.gameState().towerFloor);
        return { type: 'reward', title: 'A Costly Misstep!', description: `You lose ${this._formatNumber(500 * this.gameState().towerFloor)} Gold to a trap.` };
      }
    }
  }

  endTowerChallenge(victory: boolean) {
    this.isInTowerCombat.set(false);
    this.towerEnemy.set(null); // Clear enemy from tower state
    if (victory) {
      this.gameState.update(state => ({ ...state, towerFloor: state.towerFloor + 1 }));
    }
    // No explicit rewards here, managed by selectTowerChallenge
  }
  applyTowerDamage(damage: number, type: 'dps' | 'click' | 'skill') {
    this.towerEnemy.update(enemy => {
      if (!enemy) return enemy;
      const newHp = Math.max(0, enemy.currentHp - damage);
      this.damageFlashes.update(flashes => [
        ...flashes, 
        { 
          id: Date.now() + Math.random(), 
          damage: Math.floor(damage), 
          x: 40 + Math.random() * 20, 
          y: 50 + Math.random() * 20, 
          type: type 
        }
      ]);
      return { ...enemy, currentHp: newHp };
    });
  }
  prestige() {
    this.gameState.update(state => {
      if (state.stage < 50) return state; // Requires stage 50 to prestige

      const prestigePointsGained = this.getPrestigePointsReward();
      let skillTomesGained = 1; // Base 1 tome per prestige
      // Apply skill tree bonus
      for (const nodeId of state.unlockedSkillTreeNodes) {
          const node = SKILL_TREE_DATA.find(n => n.id === nodeId);
          if (node) {
              for (const effect of node.effects) {
                  if (effect.type === 'skillTomesPerPrestige') {
                      skillTomesGained += effect.value;
                  }
              }
          }
      }

      return {
        ...INITIAL_GAME_STATE, // Reset to initial state
        theme: state.theme, // Keep theme
        prestigePoints: state.prestigePoints + prestigePointsGained,
        totalPrestiges: state.totalPrestiges + 1,
        unlockedHeroIds: state.unlockedHeroIds, // Keep unlocked heroes
        heroes: this.heroes().map(h => ({ ...h, level: 1, currentXp: 0, offlineXp: 0, currentHp: h.maxHp, skillCharge: 0, skillReady: false })), // Reset hero levels to 1 and full HP
        unlockedSkillTreeNodes: state.unlockedSkillTreeNodes, // Keep skill tree progress
        heroSpecializations: state.heroSpecializations, // Keep specializations
        skillTomes: state.skillTomes + skillTomesGained, // Add skill tomes
        pets: state.pets, // Keep pets
        petCrystals: state.petCrystals, // Keep pet crystals
        essenceOfLoyalty: state.essenceOfLoyalty, // Keep loyalty essence
        heroMemories: state.heroMemories, // Keep hero memories
        heroEssence: state.heroEssence, // Keep hero essence
        heroFarm: state.heroFarm, // Keep farm state
        materials: state.materials, // Keep materials
        unlockedHybridSouls: state.unlockedHybridSouls, // Keep hybrid souls
        missionProgress: state.missionProgress, // Keep mission progress
        necroConstructs: state.necroConstructs, // Keep necro constructs
        riftLevel: state.riftLevel, // Keep rift level
        highestRiftLevel: state.highestRiftLevel, // Keep highest rift level
        riftShards: state.riftShards, // Keep rift shards
        guild: state.guild, // Keep guild state
        headquartersUpgrades: state.headquartersUpgrades, // Keep headquarters upgrades
        artifacts: state.artifacts, // Keep artifacts
      };
    });
    this.heroes.update(heroes => heroes.map(h => this._recalculateHeroStats({ ...h, level: 1, currentXp: 0, offlineXp: 0, currentHp: h.maxHp, skillCharge: 0, skillReady: false })));
  }
  canPrestige(): boolean { return this.gameState().stage >= 50; }
  getPrestigePointsReward(): number { return Math.floor(this.gameState().stage / 10); } // 1 point per 10 stages
  unlockSkillTreeNode(id: string) {
    this.gameState.update(state => {
      const node = SKILL_TREE_DATA.find(n => n.id === id);
      if (!node || state.unlockedSkillTreeNodes.includes(id) || state.prestigePoints < node.cost) {
        return state;
      }
      return {
        ...state,
        prestigePoints: state.prestigePoints - node.cost,
        unlockedSkillTreeNodes: [...state.unlockedSkillTreeNodes, id]
      };
    });
  }
  getExpeditionSlotsEffect(): number {
    let baseSlots = 1;
    for (const nodeId of this.gameState().unlockedSkillTreeNodes) {
        const node = SKILL_TREE_DATA.find(n => n.id === nodeId);
        if (node) {
            for (const effect of node.effects) {
                if (effect.type === 'expeditionSlots') {
                    baseSlots += effect.value;
                }
            }
        }
    }
    return baseSlots;
  }
  startExpedition(id: number, heroIds: number[]): boolean {
    const expedition = ALL_EXPEDITIONS.find(e => e.id === id);
    if (!expedition || this.gameState().ongoingExpeditions.length >= this.getExpeditionSlotsEffect()) return false;

    const now = Date.now();
    const newExpedition: OngoingExpedition = {
      expeditionId: id,
      heroIds: heroIds,
      startTime: now,
      completionTime: now + expedition.durationSeconds * 1000,
    };

    this.gameState.update(state => ({
      ...state,
      ongoingExpeditions: [...state.ongoingExpeditions, newExpedition],
    }));
    return true;
  }
  claimExpedition(exp: OngoingExpedition): { gold: number; prestige: number; item: EquipmentItem | null } {
    const details = ALL_EXPEDITIONS.find(e => e.id === exp.expeditionId)!;
    let goldReward = details.rewards.gold;
    let prestigeReward = details.rewards.prestigePoints || 0;
    let itemDrop: EquipmentItem | null = null;

    // Check for item drop
    if (details.rewards.equipmentDrop && Math.random() < details.rewards.equipmentDrop.chance) {
        itemDrop = this._generateDroppedItem(this.gameState().stage, details.rewards.equipmentDrop.rarity);
        if (itemDrop) {
            this.inventory.update(inv => [...inv, itemDrop!]);
        }
    }

    this.gameState.update(state => ({
      ...state,
      gold: state.gold + goldReward,
      prestigePoints: state.prestigePoints + prestigeReward,
      ongoingExpeditions: state.ongoingExpeditions.filter(oe => oe.startTime !== exp.startTime),
      totalExpeditionsCompleted: state.totalExpeditionsCompleted + 1,
    }));

    return { gold: goldReward, prestige: prestigeReward, item: itemDrop };
  }
  requestStrategicAnalysis(): Promise<string> {
    const activeHeroesData = this.activeHeroes().map(h => ({
      name: h.name,
      level: h.level,
      role: h.role,
      dps: h.currentDps,
    }));
    const prestigeUpgradesData: { name: string; level: number }[] = []; // Populate with actual upgrades later

    const payload: StrategicAnalysisPayload = {
      stage: this.gameState().stage,
      gold: this.gameState().gold,
      prestigePoints: this.gameState().prestigePoints,
      totalDps: this.totalDps(),
      activeTeam: activeHeroesData,
      prestigeUpgrades: prestigeUpgradesData,
    };

    return this.chronicleService.getStrategicAnalysis(payload);
  }
  enterRift() {
    this.gameState.update(state => ({...state, riftLevel: state.highestRiftLevel + 1 }));
    // Generate first rift enemy
  }
  leaveRift() {
    this.gameState.update(state => ({...state, riftLevel: 0 }));
    this.currentRiftEnemy.set(null);
  }
  getDungeonSlotsEffect(): number {
    let baseSlots = 1;
    for (const nodeId of this.gameState().unlockedSkillTreeNodes) {
        const node = SKILL_TREE_DATA.find(n => n.id === nodeId);
        if (node) {
            for (const effect of node.effects) {
                if (effect.type === 'dungeonSlots') {
                    baseSlots += effect.value;
                }
            }
        }
    }
    return baseSlots;
  }
  startDungeonRun(id: number, diff: DungeonDifficulty) {
    const dungeon = ALL_DUNGEONS.find(d => d.id === id);
    if (!dungeon || this.gameState().activeDungeonRuns.length >= this.getDungeonSlotsEffect()) return;
    
    const diffDetails = dungeon.difficulties[diff];
    const cost = diffDetails.cost || {};

    if (this.gameState().gold < (cost.gold || 0) || this.gameState().prestigePoints < (cost.prestigePoints || 0)) {
        console.warn("Not enough resources to start dungeon run.");
        return;
    }

    const now = Date.now();
    const newRun: ActiveDungeonRun = {
      dungeonId: id,
      difficulty: diff,
      startTime: now,
      completionTime: now + diffDetails.durationSeconds * 1000,
    };

    this.gameState.update(state => ({
      ...state,
      gold: state.gold - (cost.gold || 0),
      prestigePoints: state.prestigePoints - (cost.prestigePoints || 0),
      activeDungeonRuns: [...state.activeDungeonRuns, newRun],
    }));
  }
  claimDungeonRun(run: ActiveDungeonRun): { gold: number; item: EquipmentItem | null; crests: number; petCrystals: number; petEgg: boolean; } {
    const dungeonDetails = ALL_DUNGEONS.find(d => d.id === run.dungeonId)!;
    const difficultyDetails = dungeonDetails.difficulties[run.difficulty];
    let goldReward = difficultyDetails.rewards.gold;
    let crestsReward = difficultyDetails.rewards.dungeonCrests;
    let petCrystalsReward = difficultyDetails.rewards.petCrystals || 0;
    let itemDrop: EquipmentItem | null = null;
    let petEggDropped = false;

    if (Math.random() < difficultyDetails.rewards.equipmentDrop.chance) {
      itemDrop = this._generateDroppedItem(this.gameState().stage, difficultyDetails.rewards.equipmentDrop.rarity);
      if (itemDrop) this.inventory.update(inv => [...inv, itemDrop]);
    }
    if (difficultyDetails.rewards.petEggDrop && Math.random() < difficultyDetails.rewards.petEggDrop.chance) {
        petEggDropped = true;
        // Logic to grant a random new pet or pet crystals
        this._grantRandomPet();
    }

    this.gameState.update(state => ({
      ...state,
      gold: state.gold + goldReward,
      dungeonCrests: state.dungeonCrests + crestsReward,
      petCrystals: state.petCrystals + petCrystalsReward,
      activeDungeonRuns: state.activeDungeonRuns.filter(r => r.startTime !== run.startTime),
      totalDungeonsCompleted: state.totalDungeonsCompleted + 1,
    }));
    return { gold: goldReward, item: itemDrop, crests: crestsReward, petCrystals: petCrystalsReward, petEgg: petEggDropped };
  }
  private _grantRandomPet() {
    const unownedPets = ALL_PETS.filter(p => !this.gameState().pets.some(pp => pp.petId === p.id));
    if (unownedPets.length > 0) {
      const newPetDetails = unownedPets[Math.floor(Math.random() * unownedPets.length)];
      this.gameState.update(state => ({
        ...state,
        pets: [...state.pets, { petId: newPetDetails.id, level: 1, isEquipped: false, ascensionLevel: 0 }],
      }));
    } else {
      // If all pets are owned, give pet crystals instead
      this.gameState.update(state => ({ ...state, petCrystals: state.petCrystals + 50 }));
    }
  }
  startDungeonBounty(id: number, heroIds: number[]) {
    const bounty = ALL_DUNGEON_BOUNTIES.find(b => b.id === id);
    if (!bounty || heroIds.length !== bounty.requiredHeroCount) return; // Basic validation

    const now = Date.now();
    const newBounty: ActiveDungeonBounty = {
      bountyId: id,
      heroIds: heroIds,
      startTime: now,
      completionTime: now + bounty.durationSeconds * 1000,
    };
    this.gameState.update(state => ({ ...state, activeDungeonBounties: [...state.activeDungeonBounties, newBounty] }));
  }
  claimDungeonBounty(bounty: ActiveDungeonBounty): { gold: number; crests: number; petCrystals: number; essence: number; } | null {
    const bountyDetails = ALL_DUNGEON_BOUNTIES.find(db => db.id === bounty.bountyId);
    if (!bountyDetails) return null;

    let goldReward = bountyDetails.rewards.gold;
    let crestsReward = bountyDetails.rewards.dungeonCrests;
    let petCrystalsReward = bountyDetails.rewards.petCrystals || 0;
    let essenceReward = 0;

    if (bountyDetails.rewards.essenceOfLoyalty && Math.random() < bountyDetails.rewards.essenceOfLoyalty.chance) {
        essenceReward = bountyDetails.rewards.essenceOfLoyalty.amount;
    }

    this.gameState.update(state => ({
      ...state,
      gold: state.gold + goldReward,
      dungeonCrests: state.dungeonCrests + crestsReward,
      petCrystals: state.petCrystals + petCrystalsReward,
      essenceOfLoyalty: state.essenceOfLoyalty + essenceReward,
      activeDungeonBounties: state.activeDungeonBounties.filter(b => b.startTime !== bounty.startTime),
    }));
    return { gold: goldReward, crests: crestsReward, petCrystals: petCrystalsReward, essence: essenceReward };
  }
  purchaseDungeonShopItem(id: number): DungeonShopItem | null {
    const item = ALL_DUNGEON_SHOP_ITEMS.find(i => i.id === id);
    if (!item || item.isSoldOut(this) || this.gameState().dungeonCrests < item.cost) {
      return null;
    }

    if (item.purchase(this)) {
      this.gameState.update(state => {
        const newPurchased = { ...state.purchasedDungeonShopItems };
        newPurchased[item.id] = (newPurchased[item.id] || 0) + 1;
        return { ...state, dungeonCrests: state.dungeonCrests - item.cost, purchasedDungeonShopItems: newPurchased };
      });
      return item;
    }
    return null;
  }
  
  activateBlessing(type: BlessingType) {
    const blessing = ALL_BLESSINGS.find(b => b.type === type);
    if (!blessing) return;

    this.gameState.update(state => {
      const now = Date.now();
      const cooldown = state.blessingCooldowns.find(c => c.type === type);
      if (cooldown && cooldown.readyTime > now) return state;
      const active = state.activeBlessings.find(b => b.type === type);
      if (active && active.endTime > now) return state;

      const newActiveBlessings = [...state.activeBlessings.filter(b => b.type !== type)];
      if (blessing.durationSeconds > 0) {
        newActiveBlessings.push({ type, endTime: now + blessing.durationSeconds * 1000 });
      }
      
      const newBlessingCooldowns = [...state.blessingCooldowns.filter(b => b.type !== type)];
      newBlessingCooldowns.push({ type, readyTime: now + blessing.cooldownSeconds * 1000 });

      return { ...state, activeBlessings: newActiveBlessings, blessingCooldowns: newBlessingCooldowns };
    });
  }

  getLeaderboardData(): LeaderboardEntry[] {
    // Mock data for now
    return [
      { rank: 1, name: 'ElitePlayerX', stage: 1250, isPlayer: false },
      { rank: 2, name: 'LegendaryHero', stage: 1100, isPlayer: false },
      { rank: 3, name: 'AlphaStriker', stage: 1050, isPlayer: false },
      { rank: 4, name: 'You', stage: this.gameState().stage, isPlayer: true },
      { rank: 5, name: 'CosmicVoyager', stage: 980, isPlayer: false },
      { rank: 6, name: 'RiftBreaker', stage: 950, isPlayer: false },
      { rank: 7, name: 'ShadowAssassin', stage: 900, isPlayer: false },
      { rank: 8, name: 'GoldHoarder', stage: 870, isPlayer: false },
      { rank: 9, name: 'MysticMage', stage: 850, isPlayer: false },
      { rank: 10, name: 'IronWall', stage: 820, isPlayer: false },
    ].sort((a,b) => b.stage - a.stage);
  }
  equipPet(id: number) {
    this.gameState.update(state => ({
      ...state,
      pets: state.pets.map(p => ({
        ...p,
        isEquipped: p.petId === id ? true : false // Equip selected, unequip others
      }))
    }));
  }
  levelUpPet(id: number) {
    this.gameState.update(state => {
      const petIndex = state.pets.findIndex(p => p.petId === id);
      if (petIndex === -1) return state;

      const pet = state.pets[petIndex];
      // FIX: Added 'as any' to `pet.levelUpCost` because the `PlayerPet` interface doesn't have `levelUpCost` property directly. It's on `DisplayPet` interface in `pets.component.ts`
      if (state.petCrystals < (pet as any).levelUpCost) return state;

      const newPets = [...state.pets];
      newPets[petIndex] = { ...pet, level: pet.level + 1 };

      return {
        ...state,
        // FIX: Added 'as any' to `pet.levelUpCost` because the `PlayerPet` interface doesn't have `levelUpCost` property directly.
        petCrystals: state.petCrystals - (pet as any).levelUpCost,
        pets: newPets,
      };
    });
  }
  ascendPet(id: number): boolean {
    let success = false;
    this.gameState.update(state => {
        const petIndex = state.pets.findIndex(p => p.petId === id);
        if (petIndex === -1) return state;

        const pet = state.pets[petIndex];
        const petDetails = ALL_PETS.find(p => p.id === pet.petId);
        if (!petDetails?.evolutionCostEssence) return state; // Only evolvable pets

        const ascensionCost = petDetails.evolutionCostEssence * (pet.ascensionLevel + 1);
        const ascensionThreshold = pet.ascensionLevel < 1 ? 25 : (pet.ascensionLevel < 2 ? 50 : 75); // Example: Lvl 25 for first, 50 for second, etc.
        
        if (pet.level >= ascensionThreshold && state.essenceOfLoyalty >= ascensionCost) {
            const newPets = [...state.pets];
            newPets[petIndex] = { ...pet, ascensionLevel: pet.ascensionLevel + 1, level: 1 }; // Reset level on ascension
            success = true;
            return {
                ...state,
                pets: newPets,
                essenceOfLoyalty: state.essenceOfLoyalty - ascensionCost,
            };
        }
        return state;
    });
    return success;
  }
  loadTeamFromPreset(index: number) {
    this.gameState.update(state => {
      const preset = state.teamPresets[index];
      if (preset) {
        return { ...state, activeHeroIds: [...preset.heroIds] };
      }
      return state;
    });
  }
  saveActiveTeamToPreset(index: number) {
    this.gameState.update(state => {
      const newPresets = [...state.teamPresets];
      newPresets[index] = { ...newPresets[index], heroIds: [...state.activeHeroIds] };
      return { ...state, teamPresets: newPresets };
    });
  }
  updatePresetName(index: number, name: string) {
    this.gameState.update(state => {
      const newPresets = [...state.teamPresets];
      if (newPresets[index]) {
        newPresets[index] = { ...newPresets[index], name: name };
      }
      return { ...state, teamPresets: newPresets };
    });
  }
  equipItem(heroId: number, itemId: number) {
    this.heroes.update(allHeroes => allHeroes.map(hero => {
      if (hero.id === heroId) {
        const itemToEquip = this.inventory().find(item => item.id === itemId);
        if (!itemToEquip) return hero;

        const newEquipment = { ...hero.equipment };
        const oldItemInSlot = newEquipment[itemToEquip.slot];

        // If there's an item currently in the slot, unequip it first (add back to inventory)
        if (oldItemInSlot) {
          this.inventory.update(inv => [...inv, oldItemInSlot]);
        }

        // Remove the new item from inventory
        this.inventory.update(inv => inv.filter(item => item.id !== itemId));

        // Equip the new item
        newEquipment[itemToEquip.slot] = itemToEquip;
        return { ...hero, equipment: newEquipment };
      }
      return hero;
    }));
  }
  unequipItemById(itemId: number) {
    let unequippedItem: EquipmentItem | null = null;
    this.heroes.update(allHeroes => allHeroes.map(hero => {
      const newEquipment = { ...hero.equipment };
      for (const slot in newEquipment) {
        if (newEquipment[slot as EquipmentSlot]?.id === itemId) {
          unequippedItem = newEquipment[slot as EquipmentSlot];
          newEquipment[slot as EquipmentSlot] = null;
          return { ...hero, equipment: newEquipment };
        }
      }
      return hero;
    }));
    if (unequippedItem) {
      this.inventory.update(inv => [...inv, unequippedItem!]);
    }
  }
  unequipItem(heroId: number, slot: EquipmentSlot) {
    this.heroes.update(allHeroes => allHeroes.map(hero => {
      if (hero.id === heroId) {
        const itemToUnequip = hero.equipment[slot];
        if (!itemToUnequip) return hero;

        this.inventory.update(inv => [...inv, itemToUnequip]);
        const newEquipment = { ...hero.equipment, [slot]: null };
        return { ...hero, equipment: newEquipment };
      }
      return hero;
    }));
  }
  salvageItems(ids: number[]): number {
    let dustGained = 0;
    this.inventory.update(inv => inv.filter(item => {
      if (ids.includes(item.id)) {
        dustGained += this.getDustValue(item.rarity);
        return false; // Remove from inventory
      }
      return true;
    }));

    this.gameState.update(state => ({
      ...state,
      enchantingDust: state.enchantingDust + dustGained,
    }));
    return dustGained;
  }
  private getDustValue(rarity: Rarity): number {
    switch(rarity) {
      case 'Common': return 1;
      case 'Rare': return 5;
      case 'Epic': return 25;
      case 'Legendary': return 100;
      case 'Mythic': return 500;
      default: return 0;
    }
  }
  transmuteEnchantingDustForGold(amount: number): number {
    let goldGained = 0;
    this.gameState.update(state => {
      if (state.enchantingDust < amount) return state;

      goldGained = amount * 500; // 1 Dust = 500 Gold
      return {
        ...state,
        enchantingDust: state.enchantingDust - amount,
        gold: state.gold + goldGained,
      };
    });
    return goldGained;
  }
  getEnchantCost(item: EquipmentItem): { dust: number; gold: number } {
    const baseDustCost = 10;
    const baseGoldCost = 1000;
    const levelMultiplier = Math.pow(1.5, item.enchantLevel); // Cost scales with current enchant level
    
    return {
      dust: Math.floor(baseDustCost * levelMultiplier),
      gold: Math.floor(baseGoldCost * levelMultiplier),
    };
  }
  enchantItem(id: number): boolean {
    let success = false;
    this.inventory.update(inv => inv.map(item => {
      if (item.id === id) {
        const cost = this.getEnchantCost(item);
        const state = this.gameState();
        
        if (state.enchantingDust >= cost.dust && state.gold >= cost.gold) {
          this.gameState.update(s => ({
            ...s,
            enchantingDust: s.enchantingDust - cost.dust,
            gold: s.gold - cost.gold,
          }));
          
          const newBonusValue = item.baseBonusValue * (1 + (item.enchantLevel + 1) * 0.10); // 10% increase per enchant level
          success = true;
          return { ...item, enchantLevel: item.enchantLevel + 1, bonusValue: newBonusValue };
        }
      }
      return item;
    }));
    return success;
  }
  getGuildExpToNextLevel(level: number): number {
    // Simple exponential scaling for example
    return Math.floor(1000 * Math.pow(1.2, level));
  }
  getGuildBonuses(level: number): { dpsPercent: number; goldDropPercent: number } {
    // Simple linear scaling for example
    return {
      dpsPercent: level * 0.005, // 0.5% DPS per level
      goldDropPercent: level * 0.002, // 0.2% Gold per level
    };
  }
  createGuild(name: string) {
    this.gameState.update(state => {
      if (state.guild) return state; // Already in a guild
      // FIX: Used the newly defined static property `GameService.GUILD_CREATE_COST`
      if (state.gold < GameService.GUILD_CREATE_COST) return state; // Not enough gold

      const newGuild = {
        id: `guild_${Date.now()}`,
        name: name,
        level: 1,
        exp: 0,
        members: [{ name: 'You', stage: state.stage, title: 'Guild Master' }],
      };
      // FIX: Used the newly defined static property `GameService.GUILD_CREATE_COST`
      return { ...state, gold: state.gold - GameService.GUILD_CREATE_COST, guild: newGuild };
    });
  }
  joinGuild(id: string, name: string) {
    this.gameState.update(state => {
      if (state.guild) return state; // Already in a guild

      const newGuild = {
        id: id,
        name: name,
        level: 1, // Assume joining a level 1 guild for simplicity
        exp: 0,
        members: [{ name: 'You', stage: state.stage, title: 'Member' }], // You join as a member
      };
      return { ...state, guild: newGuild };
    });
  }
  leaveGuild() {
    this.gameState.update(state => ({ ...state, guild: null }));
  }
  donateToGuild(amount: number) {
    this.gameState.update(state => {
      if (!state.guild || state.gold < amount) return state;
      return {
        ...state,
        gold: state.gold - amount,
        guild: {
          ...state.guild,
          exp: state.guild.exp + Math.floor(amount / 1000), // 1 Guild Exp per 1000 Gold
          // Members update for 'You' can be handled here if needed, but the mockLog already does.
        }
      };
    });
  }
  getHeadquartersUpgradeCost(upgrade: GlobalUpgrade): number {
    const level = this.gameState().headquartersUpgrades[upgrade.id] || 0;
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
  }
  purchaseHeadquartersUpgrade(upgradeId: string): boolean {
    const upgrade = ALL_HEADQUARTERS_UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return false;

    const currentLevel = this.gameState().headquartersUpgrades[upgradeId] || 0;
    if (currentLevel >= upgrade.maxLevel) return false;

    const cost = this.getHeadquartersUpgradeCost(upgrade);
    if (this.gameState().gold < cost) return false;

    this.gameState.update(state => ({
      ...state,
      gold: state.gold - cost,
      headquartersUpgrades: {
        ...state.headquartersUpgrades,
        [upgradeId]: currentLevel + 1,
      },
    }));
    return true;
  }
  getSpecializationPathForHero(heroId: number): SpecializationPath | null {
    const hero = ALL_HEROES.find(h => h.id === heroId);
    if (!hero) return null;
    return ALL_SPECIALIZATION_PATHS[hero.baseClass] || null;
  }
  getSpecializationById(specId: string): Specialization | null {
    return ALL_SPECIALIZATIONS[specId] || null;
  }
  async promoteHero(heroId: number, specializationId: string): Promise<boolean> {
    const hero = this.heroes().find(h => h.id === heroId);
    if (!hero) return false;
    
    const path = this.getSpecializationPathForHero(hero.id);
    if (!path) return false;

    const currentSpecializations = this.gameState().heroSpecializations[hero.id] || [];
    const specToUnlock = this.getSpecializationById(specializationId);
    if (!specToUnlock || currentSpecializations.includes(specializationId)) return false;

    let cost = 0;
    let requiredLevel = 0;

    if (currentSpecializations.length === 0) { // Promotion 1
      if (!path.promotion1.options.includes(specializationId)) return false;
      cost = path.promotion1.cost;
      requiredLevel = path.promotion1.levelReq;
    } else if (currentSpecializations.length === 1) { // Promotion 2
      const prevSpecId = currentSpecializations[0];
      if (!path.promotion2.options[prevSpecId]?.includes(specializationId)) return false;
      cost = path.promotion2.cost;
      requiredLevel = path.promotion2.levelReq;
    } else {
      return false; // Hero already fully specialized
    }

    if (hero.level < requiredLevel || this.gameState().essenceOfLoyalty < cost) {
      return false;
    }

    this.gameState.update(state => ({
      ...state,
      essenceOfLoyalty: state.essenceOfLoyalty - cost,
      heroSpecializations: {
        ...state.heroSpecializations,
        [hero.id]: [...currentSpecializations, specializationId],
      },
    }));
    return true;
  }
  
  weaveMemory(heroId: number, prompt: string): Promise<boolean> {
    const hero = this.heroes().find(h => h.id === heroId);
    // FIX: Used the newly defined static property `GameService.WEAVE_MEMORY_COST`.
    if (!hero || this.gameState().prestigePoints < GameService.WEAVE_MEMORY_COST) return Promise.resolve(false);

    return this.chronicleService.generateMemory(hero, prompt).then(memoryText => {
      if (memoryText && memoryText !== "The mists of time are cloudy... Unable to recall a memory at this moment.") {
        this.gameState.update(state => {
          const newMemories = { ...state.heroMemories };
          const heroMemories = newMemories[heroId] || [];
          heroMemories.push({ id: `mem_${Date.now()}`, prompt: prompt, text: memoryText, timestamp: Date.now() });
          newMemories[heroId] = heroMemories;
          return {
            ...state,
            // FIX: Used the newly defined static property `GameService.WEAVE_MEMORY_COST`.
            prestigePoints: state.prestigePoints - GameService.WEAVE_MEMORY_COST,
            heroMemories: newMemories,
          };
        });
        return true;
      }
      return false;
    });
  }

  forgeDestiny(heroId: number, memoryId: string): Promise<boolean> {
    const hero = this.heroes().find(h => h.id === heroId);
    // FIX: Used the newly defined static property `GameService.FORGE_DESTINY_COST`.
    if (!hero || this.gameState().gold < GameService.FORGE_DESTINY_COST) return Promise.resolve(false);

    const memories = this.gameState().heroMemories[heroId] || [];
    const memory = memories.find(m => m.id === memoryId);
    if (!memory || memory.quest) return Promise.resolve(false); // Already has a quest

    return this.chronicleService.generateQuest(hero, memory.text!).then(questData => {
      if (questData) {
        this.gameState.update(state => {
          const newMemories = { ...state.heroMemories };
          if (newMemories[heroId]) {
            newMemories[heroId] = newMemories[heroId].map(mem => {
              if (mem.id === memoryId) {
                return {
                  ...mem,
                  quest: {
                    id: `quest_${Date.now()}`,
                    title: questData.title,
                    narrative: questData.narrative,
                    questType: questData.questType,
                    target: questData.target,
                    reward: { type: 'heroShards', heroId: hero.id, amount: hero.rarity === 'Common' ? 10 : 5 }, // Example reward
                    isCompleted: false,
                    isClaimed: false,
                    progress: 0, // Initial progress
                  },
                };
              }
              return mem;
            });
          }
          return {
            ...state,
            // FIX: Used the newly defined static property `GameService.FORGE_DESTINY_COST`.
            gold: state.gold - GameService.FORGE_DESTINY_COST,
            heroMemories: newMemories,
          };
        });
        return true;
      }
      return false;
    });
  }
  // Codex
  markHeroAsViewedInCodex(heroId: number) {
    this.gameState.update(state => {
        if (!state.viewedHeroIdsInCodex.includes(heroId)) {
            return { ...state, viewedHeroIdsInCodex: [...state.viewedHeroIdsInCodex, heroId] };
        }
        return state;
    });
  }
  markPetAsViewedInCodex(petId: number) {
    this.gameState.update(state => {
        if (!state.viewedPetIdsInCodex.includes(petId)) {
            return { ...state, viewedPetIdsInCodex: [...state.viewedPetIdsInCodex, petId] };
        }
        return state;
    });
  }
  markMaterialAsViewedInCodex(materialId: string) {
    this.gameState.update(state => {
        if (!state.viewedMaterialsInCodex.includes(materialId)) {
            return { ...state, viewedMaterialsInCodex: [...state.viewedMaterialsInCodex, materialId] };
        }
        return state;
    });
  }
  // Skill Training
  getHeroSkillUpgradeCost(hero: Hero): { tomes: number } {
    const baseCost = 10;
    const rarityMultiplier: Record<Rarity, number> = {
      'Common': 1, 'Rare': 2, 'Epic': 5, 'Legendary': 10, 'Mythic': 20,
    };
    const cost = Math.floor(baseCost * hero.skillLevel * rarityMultiplier[hero.rarity]);
    return { tomes: cost };
  }
  upgradeHeroSkill(heroId: number): boolean {
    const heroToUpdate = this.heroes().find(h => h.id === heroId);
    if (!heroToUpdate) return false;

    const cost = this.getHeroSkillUpgradeCost(heroToUpdate);
    if (this.gameState().skillTomes < cost.tomes) return false;

    this.gameState.update(state => ({
      ...state,
      skillTomes: state.skillTomes - cost.tomes,
      heroSkillLevels: {
        ...state.heroSkillLevels,
        [heroId]: (state.heroSkillLevels[heroId] || 1) + 1,
      },
    }));

    this.heroes.update(heroes => heroes.map(h => 
      h.id === heroId ? this._recalculateHeroStats({ ...h, skillLevel: h.skillLevel + 1 }) : h
    ));
    return true;
  }
  // Hero Farm
  getEssenceGenerationRate(): number {
    const assignedHeroes = this.gameState().heroFarm.assignedHeroIds.filter(id => id !== null).length;
    return assignedHeroes * 0.1; // 0.1 essence per second per hero
  }
  getLoyaltyEssenceGenerationRate(): number {
    const assignedHeroes = this.gameState().heroFarm.assignedHeroIds.filter(id => id !== null).length;
    if (assignedHeroes === 0) return 0;
    return assignedHeroes * 0.01; // 0.01 loyalty essence per second per hero
  }
  assignHeroToFarm(heroId: number, slotIndex: number) {
    this.gameState.update(state => {
      const newAssigned = [...state.heroFarm.assignedHeroIds];
      // Remove hero from any other slot first if already assigned
      const existingIndex = newAssigned.indexOf(heroId);
      if (existingIndex !== -1) {
          newAssigned[existingIndex] = null;
      }
      newAssigned[slotIndex] = heroId;
      return { ...state, heroFarm: { ...state.heroFarm, assignedHeroIds: newAssigned } };
    });
  }
  removeHeroFromFarm(slotIndex: number) {
    this.gameState.update(state => {
      const newAssigned = [...state.heroFarm.assignedHeroIds];
      newAssigned[slotIndex] = null;
      return { ...state, heroFarm: { ...state.heroFarm, assignedHeroIds: newAssigned } };
    });
  }
  collectFarmResources(): { heroEssence: number; loyaltyEssence: number } {
    let collectedEssence = 0;
    let collectedLoyaltyEssence = 0;

    this.gameState.update(state => {
      const now = Date.now();
      const timeElapsedSeconds = (now - state.heroFarm.lastCollectionTimestamp) / 1000;
      
      const essenceRate = this.getEssenceGenerationRate();
      const loyaltyEssenceRate = this.getLoyaltyEssenceGenerationRate();

      collectedEssence = Math.floor(essenceRate * timeElapsedSeconds);
      collectedLoyaltyEssence = Math.floor(loyaltyEssenceRate * timeElapsedSeconds);

      return {
        ...state,
        heroEssence: state.heroEssence + collectedEssence,
        essenceOfLoyalty: state.essenceOfLoyalty + collectedLoyaltyEssence,
        heroFarm: {
          ...state.heroFarm,
          lastCollectionTimestamp: now,
          accumulatedEssence: 0,
          accumulatedEssenceOfLoyalty: 0,
        },
      };
    });
    return { heroEssence: collectedEssence, loyaltyEssence: collectedLoyaltyEssence };
  }
  // Mining Operations
  startMiningOperation(operationId: number): boolean {
    const operation = ALL_MINING_OPERATIONS.find(op => op.id === operationId);
    if (!operation || this.gameState().activeMiningOperation) return false;

    if (this.gameState().stage < operation.stageRequirement) return false;

    const now = Date.now();
    this.gameState.update(state => ({
      ...state,
      activeMiningOperation: {
        operationId: operationId,
        completionTime: now + operation.durationSeconds * 1000,
      },
    }));
    return true;
  }
  claimMiningOperation(): number {
    let goldGained = 0;
    this.gameState.update(state => {
      const activeOp = state.activeMiningOperation;
      if (!activeOp || activeOp.completionTime > Date.now()) return state;

      const details = ALL_MINING_OPERATIONS.find(op => op.id === activeOp.operationId);
      if (!details) return state;

      goldGained = details.goldReward;
      return {
        ...state,
        gold: state.gold + goldGained,
        activeMiningOperation: null,
      };
    });
    return goldGained;
  }
  // Soul Alchemy
  getFusionRecipe(soul1Id: string, soul2Id: string): string | null {
    if (soul1Id === 'soul_fire' && soul2Id === 'soul_earth' || soul1Id === 'soul_earth' && soul2Id === 'soul_fire') return 'magma_soul';
    if (soul1Id === 'soul_water' && soul2Id === 'soul_air' || soul1Id === 'soul_air' && soul2Id === 'soul_water') return 'storm_soul';
    if (soul1Id === 'soul_fire' && soul2Id === 'soul_air' || soul1Id === 'soul_air' && soul2Id === 'soul_fire') return 'lightning_soul';
    if (soul1Id === 'soul_water' && soul2Id === 'soul_earth' || soul1Id === 'soul_earth' && soul2Id === 'soul_water') return 'geode_soul';
    return null;
  }
  fuseSouls(soul1Id: string, soul2Id: string): { success: boolean; result: Material | null } {
    const resultId = this.getFusionRecipe(soul1Id, soul2Id);
    if (!resultId) return { success: false, result: null };

    const materials = this.gameState().materials;
    const hasSoul1 = (materials[soul1Id] || 0) >= 1;
    const hasSoul2 = (materials[soul2Id] || 0) >= 1;
    const canCraft = (soul1Id === soul2Id && (materials[soul1Id] || 0) >= 2) || (soul1Id !== soul2Id && hasSoul1 && hasSoul2);

    if (!canCraft) return { success: false, result: null };

    this.gameState.update(state => {
      const newMaterials = { ...state.materials };
      newMaterials[soul1Id] = (newMaterials[soul1Id] || 0) - 1;
      newMaterials[soul2Id] = (newMaterials[soul2Id] || 0) - 1;
      newMaterials[resultId] = (newMaterials[resultId] || 0) + 1;

      const newUnlockedHybridSouls = new Set(state.unlockedHybridSouls);
      newUnlockedHybridSouls.add(resultId);

      return {
        ...state,
        materials: newMaterials,
        unlockedHybridSouls: Array.from(newUnlockedHybridSouls),
      };
    });
    const resultMaterial = ALL_MATERIALS.find(m => m.id === resultId);
    return { success: true, result: resultMaterial || null };
  }
  // Necro Artisanat
  craftNecroConstruct(constructId: string): boolean {
    const recipe = ALL_NECRO_RECIPES.find(r => r.constructId === constructId);
    if (!recipe) return false;

    const currentMaterials = this.gameState().materials;
    const canCraft = Object.entries(recipe.materials).every(([matId, required]) => (currentMaterials[matId] || 0) >= required);

    if (!canCraft) return false;

    this.gameState.update(state => {
      const newMaterials = { ...state.materials };
      for (const [matId, required] of Object.entries(recipe.materials)) {
        newMaterials[matId] = (newMaterials[matId] || 0) - required;
      }
      const newConstructs = { ...state.necroConstructs };
      newConstructs[constructId] = (newConstructs[constructId] || 0) + 1;

      return {
        ...state,
        materials: newMaterials,
        necroConstructs: newConstructs,
      };
    });
    return true;
  }
}