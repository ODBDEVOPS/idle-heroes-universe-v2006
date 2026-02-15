// FIX: Import Rarity from equipment.model.ts to break circular dependency.
import { Rarity } from './equipment.model';

export type MaterialType = 'Ore' | 'Cloth' | 'Leather' | 'Herb' | 'Fish' | 'Dust' | 'Reagent' | 'Wood' | 'Stone';

export interface Material {
  id: string; // e.g., 'copper_ore'
  name: string;
  type: MaterialType;
  description: string;
  rarity: Rarity;
}

export const ALL_MATERIALS: Material[] = [
  // Mining & Smithing
  { id: 'stone', name: 'Rough Stone', type: 'Stone', description: 'A common piece of rock. Useful for basic constructions.', rarity: 'Common' },
  { id: 'copper_ore', name: 'Copper Ore', type: 'Ore', description: 'A soft, malleable metal ore.', rarity: 'Common' },
  { id: 'iron_ore', name: 'Iron Ore', type: 'Ore', description: 'A sturdy and common metal.', rarity: 'Common' },
  { id: 'silver_ore', name: 'Silver Ore', type: 'Ore', description: 'A lustrous ore, valued by jewelcrafters.', rarity: 'Rare' },
  { id: 'gold_ore', name: 'Gold Ore', type: 'Ore', description: 'A rare and precious metal.', rarity: 'Rare' },
  { id: 'obsidian_chunk', name: 'Obsidian Chunk', type: 'Stone', description: 'Volcanic glass, sharp and brittle.', rarity: 'Rare' },
  { id: 'mithril_ore', name: 'Mithril Ore', type: 'Ore', description: 'An exceptionally light and strong metal of legend.', rarity: 'Epic' },

  // Herbalism & Alchemy
  { id: 'peacebloom', name: 'Peacebloom', type: 'Herb', description: 'A simple flower with calming properties.', rarity: 'Common' },
  { id: 'shimmering_herb', name: 'Shimmering Herb', type: 'Herb', description: 'A common herb that glows faintly.', rarity: 'Common' },
  { id: 'stranglekelp', name: 'Stranglekelp', type: 'Herb', description: 'An aquatic plant used in many potions.', rarity: 'Rare' },
  { id: 'voidbloom', name: 'Voidbloom', type: 'Herb', description: 'A rare flower that seems to absorb light.', rarity: 'Rare' },
  { id: 'black_lotus', name: 'Black Lotus', type: 'Herb', description: 'An exceedingly rare and powerful herb, sought by master alchemists.', rarity: 'Mythic' },

  // Skinning & Leatherworking
  { id: 'light_leather', name: 'Light Leather', type: 'Leather', description: 'A pliable piece of leather from a small creature.', rarity: 'Common' },
  { id: 'tough_leather', name: 'Tough Leather', type: 'Leather', description: 'A sturdy piece of leather from a common beast.', rarity: 'Common' },
  { id: 'heavy_hide', name: 'Heavy Hide', type: 'Leather', description: 'A thick and durable hide from a large beast.', rarity: 'Rare' },
  { id: 'dire_pelt', name: 'Dire Pelt', type: 'Leather', description: 'The thick and rugged pelt of a fearsome predator.', rarity: 'Rare' },
  { id: 'onyx_scale', name: 'Onyx Scale', type: 'Leather', description: 'A scale from a draconic creature, as hard as obsidian.', rarity: 'Epic' },

  // Lumberjacking
  { id: 'pine_wood', name: 'Pine Wood', type: 'Wood', description: 'Common wood, useful for simple constructions.', rarity: 'Common' },
  { id: 'oak_wood', name: 'Oak Wood', type: 'Wood', description: 'A hard and resilient type of wood.', rarity: 'Rare' },
  { id: 'redwood_plank', name: 'Redwood Plank', type: 'Wood', description: 'Wood from an ancient, giant tree.', rarity: 'Epic' },
  
  // Tailoring
  { id: 'linen_cloth', name: 'Linen Cloth', type: 'Cloth', description: 'A simple cloth that drops from humanoid creatures.', rarity: 'Common' },
  { id: 'wool_cloth', name: 'Wool Cloth', type: 'Cloth', description: 'A thicker, warmer type of cloth.', rarity: 'Common' },
  { id: 'silk_cloth', name: 'Silk Cloth', type: 'Cloth', description: 'A fine and delicate fabric, surprisingly strong.', rarity: 'Rare' },
  { id: 'mageweave_cloth', name: 'Mageweave Cloth', type: 'Cloth', description: 'Cloth imbued with faint magical energies.', rarity: 'Epic' },

  // Fishing
  { id: 'raw_fish', name: 'Raw Fish', type: 'Fish', description: 'A basic fish, suitable for cooking.', rarity: 'Common' },
  { id: 'silverfin', name: 'Silverfin', type: 'Fish', description: 'A common river fish with shimmering scales.', rarity: 'Common' },
  { id: 'river_grouper', name: 'River Grouper', type: 'Fish', description: 'A plump and surprisingly heavy fish.', rarity: 'Common' },
  { id: 'glimmering_trout', name: 'Glimmering Trout', type: 'Fish', description: 'Its scales seem to catch the light in an unnatural way.', rarity: 'Rare' },
  { id: 'abyssal_eel', name: 'Abyssal Eel', type: 'Fish', description: 'An eel from deep waters, crackling with energy.', rarity: 'Rare' },
  { id: 'voidfish', name: 'Voidfish', type: 'Fish', description: 'A creature that seems to swim through space as much as water. It feels cold to the touch.', rarity: 'Epic' },
  { id: 'leviathan_scale', name: 'Leviathan Scale', type: 'Fish', description: 'A massive, iridescent scale from a creature of the deep ocean. It hums with latent power.', rarity: 'Mythic' },
  
  // Reagents (General, Jewelcrafting, Alchemy, Inscription)
  { id: 'strange_dust', name: 'Strange Dust', type: 'Dust', description: 'A common magical residue.', rarity: 'Common' },
  { id: 'crystal_vial', name: 'Crystal Vial', type: 'Reagent', description: 'A container needed for brewing potions.', rarity: 'Common' },
  { id: 'light_parchment', name: 'Light Parchment', type: 'Reagent', description: 'A blank sheet of parchment, ready for inscription.', rarity: 'Common' },
  { id: 'glowing_ember', name: 'Glowing Ember', type: 'Reagent', description: 'A magical ember that never cools.', rarity: 'Rare' },
  { id: 'jade', name: 'Jade', type: 'Reagent', description: 'A beautiful green gemstone, often used in enchanting.', rarity: 'Rare' },
  { id: 'umbral_pigment', name: 'Umbral Pigment', type: 'Reagent', description: 'A dark pigment created by milling shadowy herbs.', rarity: 'Rare' },
  { id: 'arcane_crystal', name: 'Arcane Crystal', type: 'Reagent', description: 'A crystal humming with raw magical power.', rarity: 'Epic' },
  { id: 'prismatic_diamond', name: 'Prismatic Diamond', type: 'Reagent', description: 'A flawless diamond that refracts light into a rainbow of colors.', rarity: 'Legendary' },
  
  // Soul Alchemy Materials
  { id: 'soul_fire', name: 'Soul of Fire', type: 'Reagent', description: 'The volatile essence of a fiery spirit.', rarity: 'Rare' },
  { id: 'soul_water', name: 'Soul of Water', type: 'Reagent', description: 'The fluid essence of a water spirit.', rarity: 'Rare' },
  { id: 'soul_earth', name: 'Soul of Earth', type: 'Reagent', description: 'The resilient essence of an earth spirit.', rarity: 'Rare' },
  { id: 'soul_air', name: 'Soul of Air', type: 'Reagent', description: 'The fleeting essence of an air spirit.', rarity: 'Rare' },

  // Hybrid Souls
  { id: 'magma_soul', name: 'Magma Soul', type: 'Reagent', description: 'A fusion of Fire and Earth. Resonates with raw power.', rarity: 'Epic' },
  { id: 'storm_soul', name: 'Storm Soul', type: 'Reagent', description: 'A fusion of Water and Air. Resonates with chaotic energy.', rarity: 'Epic' },
  { id: 'lightning_soul', name: 'Lightning Soul', type: 'Reagent', description: 'A fusion of Fire and Air. Resonates with sudden, sharp power.', rarity: 'Epic' },
  { id: 'geode_soul', name: 'Geode Soul', type: 'Reagent', description: 'A fusion of Water and Earth. Resonates with hidden potential.', rarity: 'Epic' },
];