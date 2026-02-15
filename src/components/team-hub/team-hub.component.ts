import { Component, ChangeDetectionStrategy, output, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';
import { Hero, Role } from '../../models/hero.model';
import { Rarity } from '../../models/equipment.model';
import { TooltipDirective } from '../../directives/tooltip.directive';

@Component({
  selector: 'app-team-hub',
  standalone: true,
  templateUrl: './team-hub.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class TeamHubComponent {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  // NEW: Internal view state
  internalView = signal<'team' | 'roster'>('team');

  // UI State
  placementMode = signal<{ type: 'place' | 'swap' | 'replace', fromIndex: number } | null>(null);
  contextMenu = signal<{ slotIndex: number, heroId: number } | null>(null);
  
  // Roster Filtering State
  roles: (Role | 'All')[] = ['All', 'Tank', 'Bruiser', 'DPS', 'Assassin', 'Marksman', 'Mage', 'Healer', 'Support', 'Controller', 'Démoniste', 'Shaman', 'Mangas Hero', 'Video game Hero'];
  activeRoleFilter = signal<Role | 'All'>('All');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // --- Computed Data ---
  activeTeam = computed(() => {
    const activeIds = this.gameService().gameState().activeHeroIds;
    const heroes = this.gameService().heroes();
    return activeIds.map(id => heroes.find(h => h.id === id) || null);
  });
  
  activeHeroIdSet = computed(() => new Set(this.gameService().gameState().activeHeroIds));

  presets = computed(() => {
    const presets = this.gameService().gameState().teamPresets;
    const heroes = this.gameService().heroes();
    return presets.map(p => ({
      ...p,
      heroes: p.heroIds.map(id => heroes.find(h => h.id === id) || null)
    }));
  });

  availableHeroes = computed(() => {
    const activeIds = this.activeHeroIdSet();
    const roleFilter = this.activeRoleFilter();
    const direction = this.sortDirection();

    let heroes = this.gameService().heroes().filter(h => h.level > 0 && !activeIds.has(h.id));

    if (roleFilter !== 'All') {
      heroes = heroes.filter(h => h.role === roleFilter);
    }

    return heroes.sort((a, b) => {
      const compare = b.level - a.level;
      return compare * (direction === 'desc' ? 1 : -1);
    });
  });
  
  // --- Actions ---
  onSlotClick(slotIndex: number) {
    const heroInSlot = this.activeTeam()[slotIndex];
    const currentMode = this.placementMode();

    if (currentMode) {
      if (currentMode.type === 'swap') {
        const sourceHeroId = this.activeTeam()[currentMode.fromIndex]?.id;
        if (sourceHeroId) {
          this.gameService().swapActiveHero(sourceHeroId, slotIndex);
        }
        this.placementMode.set(null);
      }
    } else {
      if (heroInSlot) {
        this.contextMenu.set({ slotIndex, heroId: heroInSlot.id });
      } else {
        this.placementMode.set({ type: 'place', fromIndex: slotIndex });
        this.internalView.set('roster');
      }
    }
  }

  onRosterHeroClick(heroId: number) {
    const currentMode = this.placementMode();
    if (currentMode && (currentMode.type === 'place' || currentMode.type === 'replace')) {
      this.gameService().swapActiveHero(heroId, currentMode.fromIndex);
      this.cancelPlacementMode();
    } else {
      this.viewHeroDetails(heroId);
    }
  }

  viewHeroDetails(heroId: number) {
    this.gameService().heroToViewInTeam.set(heroId);
    this.viewChange.emit('heroDetail');
    this.closeContextMenu();
  }

  removeHero(slotIndex: number) {
    this.gameService().removeHeroFromActiveSlot(slotIndex);
    this.closeContextMenu();
  }

  startSwap(slotIndex: number) {
    this.placementMode.set({ type: 'swap', fromIndex: slotIndex });
    this.closeContextMenu();
  }

  startReplace(slotIndex: number) {
    this.placementMode.set({ type: 'replace', fromIndex: slotIndex });
    this.internalView.set('roster');
    this.closeContextMenu();
  }

  cancelPlacementMode() {
    this.placementMode.set(null);
    this.internalView.set('team');
  }

  closeContextMenu() {
    this.contextMenu.set(null);
  }

  // Preset Actions
  loadPreset(index: number) { this.gameService().loadTeamFromPreset(index); }
  savePreset(index: number) { this.gameService().saveActiveTeamToPreset(index); }
  updatePresetName(index: number, event: Event) {
    const newName = (event.target as HTMLInputElement).value;
    if (newName) this.gameService().updatePresetName(index, newName);
  }
  
  // Roster Filter Actions
  onRoleFilterChange(event: Event) {
    this.activeRoleFilter.set((event.target as HTMLSelectElement).value as Role | 'All');
  }

  toggleSortDirection() {
    this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
  }

  // --- UI Helpers ---
  getHeroInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`;
    return name.substring(0, 2).toUpperCase();
  }

  getRarityBorderClass(rarity: Rarity): string {
    switch (rarity) {
      case 'Mythic': return 'border-red-500';
      case 'Legendary': return 'border-yellow-400';
      case 'Epic': return 'border-purple-500';
      case 'Rare': return 'border-blue-500';
      default: return 'border-gray-600';
    }
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
}
