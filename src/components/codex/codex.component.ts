import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService, ALL_HEROES, ALL_PETS } from '../../services/game.service';
import { Rarity } from '../../models/equipment.model';
import { Role } from '../../models/hero.model';
import { Pet } from '../../models/pet.model';
import { Material, ALL_MATERIALS, MaterialType } from '../../models/material.model';

type HeroData = typeof ALL_HEROES[0];

@Component({
  selector: 'app-codex',
  standalone: true,
  templateUrl: './codex.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class CodexComponent {
  gameService = input.required<GameService>();
  
  // Modal State
  isModalOpen = signal(false);
  selectedHeroData = signal<{ hero: HeroData, unlocked: boolean, isNew: boolean } | null>(null);
  selectedPetData = signal<{ pet: Pet, unlocked: boolean, isNew: boolean } | null>(null);
  selectedMaterialData = signal<{ material: Material, unlocked: boolean, isNew: boolean } | null>(null);

  // Tab State
  activeTab = signal<'heroes' | 'pets' | 'resources'>('heroes');

  // Filters & Sort
  searchTerm = signal('');

  // Hero Filters
  rarities: (Rarity | 'All')[] = ['All', 'Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
  roles: (Role | 'All')[] = ['All', 'Tank', 'Bruiser', 'DPS', 'Assassin', 'Marksman', 'Mage', 'Healer', 'Support', 'Controller', 'Démoniste', 'Shaman', 'Mangas Hero', 'Video game Hero'];
  sortOptions: { value: 'id' | 'name' | 'rarity', label: string }[] = [
    { value: 'id', label: 'Default' },
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'rarity', label: 'Rarity' }
  ];
  activeRarityFilter = signal<Rarity | 'All'>('All');
  activeRoleFilter = signal<Role | 'All'>('All');
  activeHeroSort = signal<'id' | 'name' | 'rarity'>('id');

  // Material Filters
  materialTypes = computed<('All' | MaterialType)[]>(() => {
    const types = new Set(ALL_MATERIALS.map(m => m.type));
    return ['All', ...Array.from(types).sort()];
  });
  activeMaterialTypeFilter = signal<MaterialType | 'All'>('All');
  
  // Hero Data
  filteredHeroes = computed(() => {
    const rarityFilter = this.activeRarityFilter();
    const roleFilter = this.activeRoleFilter();
    const term = this.searchTerm().toLowerCase();
    const sort = this.activeHeroSort();
    
    const heroes = ALL_HEROES.filter(hero => {
      const rarityMatch = rarityFilter === 'All' || hero.rarity === rarityFilter;
      const roleMatch = roleFilter === 'All' || hero.role === roleFilter;
      const nameMatch = !term || hero.name.toLowerCase().includes(term);
      return rarityMatch && roleMatch && nameMatch;
    });

    const rarityOrder: Rarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];

    return heroes.sort((a, b) => {
      switch(sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rarity':
          return rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
        case 'id':
        default:
          return a.id - b.id;
      }
    });
  });

  newlyUnlockedHeroIds = computed(() => {
    const unlocked = new Set(this.gameService().gameState().unlockedHeroIds);
    const viewed = new Set(this.gameService().gameState().viewedHeroIdsInCodex);
    return new Set([...unlocked].filter(id => !viewed.has(id)));
  });

  heroProgress = computed(() => ({
    unlocked: this.gameService().gameState().unlockedHeroIds.length,
    total: ALL_HEROES.length
  }));

  // Pet Data
  allPets = ALL_PETS;
  unlockedPetIds = computed(() => new Set(this.gameService().gameState().pets.map(p => p.petId)));

  newlyUnlockedPetIds = computed(() => {
    const unlocked = this.unlockedPetIds();
    const viewed = new Set(this.gameService().gameState().viewedPetIdsInCodex);
    return new Set([...unlocked].filter(id => !viewed.has(id)));
  });

  petProgress = computed(() => ({
    unlocked: this.unlockedPetIds().size,
    total: ALL_PETS.length
  }));

  // Material Data
  allMaterials = ALL_MATERIALS.slice().sort((a,b) => a.name.localeCompare(b.name));
  unlockedMaterialIds = computed(() => new Set(this.gameService().gameState().discoveredMaterials));
  
  newlyUnlockedMaterialIds = computed(() => {
      const unlocked = this.unlockedMaterialIds();
      const viewed = new Set(this.gameService().gameState().viewedMaterialsInCodex);
      return new Set([...unlocked].filter(id => !viewed.has(id)));
  });
  
  materialProgress = computed(() => ({
    unlocked: this.unlockedMaterialIds().size,
    total: ALL_MATERIALS.length
  }));

  filteredMaterials = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const typeFilter = this.activeMaterialTypeFilter();

    return this.allMaterials.filter(m => {
      const nameMatch = !term || m.name.toLowerCase().includes(term);
      const typeMatch = typeFilter === 'All' || m.type === typeFilter;
      return nameMatch && typeMatch;
    });
  });

  setActiveTab(tab: 'heroes' | 'pets' | 'resources') {
    this.activeTab.set(tab);
    // Reset filters and search to avoid confusion when switching contexts
    this.searchTerm.set('');
    this.activeRarityFilter.set('All');
    this.activeRoleFilter.set('All');
    this.activeHeroSort.set('id');
    this.activeMaterialTypeFilter.set('All');
  }
  
  openHeroDetails(hero: HeroData) {
    const unlocked = this.isHeroUnlocked(hero.id);
    const isNew = this.isHeroNew(hero.id);
    this.selectedPetData.set(null);
    this.selectedMaterialData.set(null);
    this.selectedHeroData.set({ hero, unlocked, isNew });
    this.isModalOpen.set(true);

    if (unlocked) {
      this.gameService().markHeroAsViewedInCodex(hero.id);
    }
  }

  openPetDetails(pet: Pet) {
    const unlocked = this.isPetUnlocked(pet.id);
    const isNew = this.isPetNew(pet.id);
    this.selectedHeroData.set(null);
    this.selectedMaterialData.set(null);
    this.selectedPetData.set({ pet, unlocked, isNew });
    this.isModalOpen.set(true);

    if (unlocked) {
      this.gameService().markPetAsViewedInCodex(pet.id);
    }
  }

  openMaterialDetails(material: Material) {
    const unlocked = this.isMaterialUnlocked(material.id);
    const isNew = this.isMaterialNew(material.id);
    this.selectedHeroData.set(null);
    this.selectedPetData.set(null);
    this.selectedMaterialData.set({ material, unlocked, isNew });
    this.isModalOpen.set(true);

    if (unlocked) {
      this.gameService().markMaterialAsViewedInCodex(material.id);
    }
  }

  closeModal() {
    this.isModalOpen.set(false);
  }
  
  onSearchChange(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  isHeroUnlocked(heroId: number): boolean {
    return this.gameService().gameState().unlockedHeroIds.includes(heroId);
  }

  isPetUnlocked(petId: number): boolean {
    return this.unlockedPetIds().has(petId);
  }
  
  isMaterialUnlocked(materialId: string): boolean {
    return this.unlockedMaterialIds().has(materialId);
  }

  isHeroNew(heroId: number): boolean {
    return this.newlyUnlockedHeroIds().has(heroId);
  }
  
  isPetNew(petId: number): boolean {
    return this.newlyUnlockedPetIds().has(petId);
  }

  isMaterialNew(materialId: string): boolean {
    return this.newlyUnlockedMaterialIds().has(materialId);
  }
  
  getMaterialSources(type: MaterialType): string {
    switch(type) {
      case 'Ore':
      case 'Stone':
        return "Gathered from the Mining mini-game or by defeating 'Minerals' type enemies.";
      case 'Herb':
        return "Gathered from the Herbalism mini-game or by defeating 'Flora' type enemies.";
      case 'Leather':
        return "Gathered from the Skinning mini-game or by defeating 'Fauna' type enemies.";
      case 'Fish':
        return "Caught via the Fishing mini-game or by defeating 'Aquatic' type enemies.";
      case 'Wood':
        return "Gathered from the Lumberjack mini-game or by defeating 'Flora' type enemies.";
      case 'Cloth':
      case 'Dust':
        return "Commonly dropped by humanoid and magical enemies.";
      case 'Reagent':
        return "Found through various means including Alchemy, drops from magical creatures, and special events.";
      default:
        return "Sources unknown.";
    }
  }

  onRarityFilterChange(event: Event) {
    this.activeRarityFilter.set((event.target as HTMLSelectElement).value as Rarity | 'All');
  }

  onRoleFilterChange(event: Event) {
    this.activeRoleFilter.set((event.target as HTMLSelectElement).value as Role | 'All');
  }
  
  onHeroSortChange(event: Event) {
    this.activeHeroSort.set((event.target as HTMLSelectElement).value as 'id' | 'name' | 'rarity');
  }
  
  onMaterialTypeFilterChange(type: MaterialType | 'All') {
    this.activeMaterialTypeFilter.set(type);
  }

  getMaterialIcon(type: Material['type']): string {
    const icons: Record<Material['type'], string> = {
      'Ore': '⛏️', 'Cloth': '🧵', 'Leather': '🦌', 'Herb': '🌿', 'Fish': '🐟', 'Dust': '✨', 'Reagent': '🧪', 'Wood': '🪵', 'Stone': '🪨'
    };
    return icons[type] || '❓';
  }

  getRarityTextColor(rarity: Rarity): string {
    switch (rarity) {
      case 'Mythic': return 'text-red-500';
      case 'Legendary': return 'text-yellow-400';
      case 'Epic': return 'text-purple-500';
      case 'Rare': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  }

  getRarityBorderClass(rarity: Rarity): string {
    switch (rarity) {
      case 'Mythic': return 'border-red-500';
      case 'Legendary': return 'border-yellow-400';
      case 'Epic': return 'border-purple-500';
      case 'Rare': return 'border-blue-400';
      default: return 'border-gray-400';
    }
  }

  getHeroInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`;
    }
    return name.substring(0, 2).toUpperCase();
  }
}
