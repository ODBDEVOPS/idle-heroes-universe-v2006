import { Component, ChangeDetectionStrategy, input, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { Hero, Role } from '../../models/hero.model';
import { EquipmentItem, EquipmentSlot, Rarity } from '../../models/equipment.model';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { View } from '../../app.component';

type SortOption = 'level' | 'dps' | 'rarity' | 'name' | 'favorite';

interface DisplayHero extends Hero {
  shardCount: number;
  requiredShards: number;
  ascensionGoldCost: number;
  canAscend: boolean;
  cost10: number;
  cost25: number;
  maxLevels: { levels: number, cost: number };
}

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class TeamComponent {
  gameService = input.required<GameService>();
  viewChange = output<View>();

  // Modals
  isLevelUpAllConfirmOpen = signal(false);
  levelUpNotice = signal<{ heroId: number, levelsGained: number } | null>(null);

  // Sorting and Filtering State
  searchTerm = signal<string>('');
  listFilter = signal<'all' | 'active' | 'reserve'>('all');
  roles: (Role | 'All')[] = ['All', 'Tank', 'Bruiser', 'DPS', 'Assassin', 'Marksman', 'Mage', 'Healer', 'Support', 'Controller', 'Démoniste', 'Shaman', 'Mangas Hero', 'Video game Hero'];
  sortOptions: { value: SortOption, label: string }[] = [
    { value: 'level', label: 'Level' },
    { value: 'dps', label: 'DPS' },
    { value: 'rarity', label: 'Rarity' },
    { value: 'favorite', label: 'Favorite' },
    { value: 'name', label: 'Name' },
  ];
  activeRoleFilter = signal<Role | 'All'>('All');
  activeSort = signal<SortOption>('level');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // --- Computed Signals ---
  activeHeroIdSet = computed(() => new Set(this.gameService().gameState().activeHeroIds));

  hasEmptySlot = computed(() => this.gameService().gameState().activeHeroIds.includes(null));

  // Step 1: Filter heroes based on UI controls
  private readonly filteredHeroes = computed<Hero[]>(() => {
    const allHeroes = this.gameService().heroes();
    const activeIds = this.activeHeroIdSet();
    const term = this.searchTerm().toLowerCase();
    const listFilter = this.listFilter();
    const roleFilter = this.activeRoleFilter();

    let heroes: Hero[];

    switch (listFilter) {
      case 'active':
        heroes = allHeroes.filter(h => activeIds.has(h.id) && h.level > 0);
        break;
      case 'reserve':
        heroes = allHeroes.filter(h => !activeIds.has(h.id));
        break;
      default: // 'all'
        heroes = [...allHeroes];
    }

    if (roleFilter !== 'All') {
      heroes = heroes.filter(h => h.role === roleFilter);
    }

    if (term) {
      heroes = heroes.filter(h => h.name.toLowerCase().includes(term));
    }

    return heroes;
  });

  // Step 2: Sort the filtered list of heroes
  private readonly sortedHeroes = computed<Hero[]>(() => {
    const heroes = this.filteredHeroes();
    const sort = this.activeSort();
    const direction = this.sortDirection();
    const rarityOrder: Rarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
    
    // .slice() creates a shallow copy to avoid mutating the array from the previous computed signal
    return heroes.slice().sort((a, b) => {
        // Primary grouping: Unlocked heroes always come before locked heroes.
        if (a.level > 0 && b.level === 0) return -1;
        if (a.level === 0 && b.level > 0) return 1;

        // Secondary grouping: Favorited heroes come first within their locked/unlocked group.
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;

        // Main sorting logic based on user selection.
        let compare = 0;
        switch (sort) {
            case 'level': compare = b.level - a.level; break;
            case 'dps': compare = b.currentDps - a.currentDps; break;
            case 'rarity': compare = rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity); break;
            case 'name': compare = a.name.localeCompare(b.name); break;
            case 'favorite': return 0; // Already handled by secondary grouping.
        }

        // Apply sort direction. 'name' is naturally ascending, others are descending.
        if (sort === 'name') {
           return compare * (direction === 'desc' ? -1 : 1);
        }
        return compare * (direction === 'desc' ? 1 : -1);
    });
  });

  // Step 3: Map sorted heroes to DisplayHero, adding dynamic properties for the template.
  // This is the public computed signal used by the template.
  readonly filteredAndSortedHeroes = computed<DisplayHero[]>(() => {
    const heroes = this.sortedHeroes();
    const heroShards = this.gameService().gameState().heroShards;
    const gold = this.gameService().gameState().gold;
    
    return heroes.map(hero => {
        const cost = this.gameService().getFusionCost(hero);
        const shardCount = heroShards[hero.id] || 0;
        const canAscend = shardCount >= cost.shards && gold >= cost.gold;

        const cost10 = this.gameService().calculateCost(hero, 10);
        const cost25 = this.gameService().calculateCost(hero, 25);
        const maxLevels = this.gameService().calculateMaxLevels(hero, gold);
        
        return {
            ...hero,
            shardCount,
            requiredShards: cost.shards,
            ascensionGoldCost: cost.gold,
            canAscend,
            cost10,
            cost25,
            maxLevels,
        };
    });
  });

  viewHeroDetails(heroId: number, event?: MouseEvent) {
    event?.stopPropagation();
    this.gameService().heroToViewInTeam.set(heroId);
    this.viewChange.emit('heroDetail');
  }

  // --- Team Management ---
  quickPlaceHero(heroId: number, event: MouseEvent) {
    event.stopPropagation();
    if (this.activeHeroIdSet().has(heroId)) return;

    const emptySlotIndex = this.gameService().gameState().activeHeroIds.indexOf(null);
    if (emptySlotIndex > -1) {
      this.gameService().swapActiveHero(heroId, emptySlotIndex);
    }
  }

  // --- Hero Actions & Modals ---
  quickUnlockHero(hero: DisplayHero, event: MouseEvent) {
    event.stopPropagation();
    if (hero.level > 0 || this.gameService().gameState().gold < hero.nextLevelCost) return;
    this.gameService().levelUpHero(hero.id);
  }
  
  quickLevelUp(hero: DisplayHero, event: MouseEvent) {
    event.stopPropagation();
    if (this.gameService().gameState().gold < hero.nextLevelCost) return;
    this.gameService().levelUpHero(hero.id);
  }

  quickLevelUpMultiple(hero: DisplayHero, levels: number, event: MouseEvent) {
    event.stopPropagation();
    this.gameService().levelUpHeroMultiple(hero.id, levels);
  }

  quickLevelUpMax(hero: DisplayHero, event: MouseEvent) {
    event.stopPropagation();
    if (hero.maxLevels.levels > 0) {
      this.gameService().levelUpHeroMultiple(hero.id, hero.maxLevels.levels);
    }
  }

  quickAutoEquip(heroId: number, event: MouseEvent) {
    event.stopPropagation();
    this.gameService().autoEquipBestGear(heroId);
  }

  quickAscend(hero: DisplayHero, event: MouseEvent) {
    event.stopPropagation();
    if (!hero.canAscend) return;

    const success = this.gameService().fuseHero(hero.id);
    if (success) {
      // Use a special value for levelsGained to signify ascension
      this.levelUpNotice.set({ heroId: hero.id, levelsGained: -1 }); 
      setTimeout(() => this.levelUpNotice.set(null), 2000);
    }
  }

  quickClaimXp(heroId: number, event: MouseEvent) {
    event.stopPropagation();
    const levelsGained = this.gameService().claimOfflineXp(heroId);
    if (levelsGained > 0) {
        this.levelUpNotice.set({ heroId, levelsGained });
        setTimeout(() => this.levelUpNotice.set(null), 2000);
    }
  }

  openLevelUpAllConfirm() { this.isLevelUpAllConfirmOpen.set(true); }
  closeLevelUpAllConfirm() { this.isLevelUpAllConfirmOpen.set(false); }

  confirmLevelUpAll() {
    this.gameService().levelUpAllHeroes();
    this.closeLevelUpAllConfirm();
  }
  
  toggleFavorite(heroId: number, event: MouseEvent) {
    event.stopPropagation();
    this.gameService().toggleHeroFavorite(heroId);
  }

  setListFilter(filter: 'all' | 'active' | 'reserve') {
    this.listFilter.set(filter);
  }
  
  onRoleFilterChange(event: Event) {
    this.activeRoleFilter.set((event.target as HTMLSelectElement).value as Role | 'All');
  }

  onSortOptionChange(event: Event) {
    this.activeSort.set((event.target as HTMLSelectElement).value as SortOption);
  }

  onSearchTermChange(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  toggleSortDirection() {
    this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
  }

  // --- UI Helpers ---
  getRarityBorderClass(r: Rarity): string { switch(r){ case 'Mythic': return 'border-red-500'; case 'Legendary': return 'border-yellow-400'; case 'Epic': return 'border-purple-500'; case 'Rare': return 'border-blue-500'; default: return 'border-gray-600'; } }
  getRarityBgClass(r: Rarity): string {
    switch (r) {
      case 'Mythic': return 'bg-gradient-to-r from-red-900/30 to-slate-900/30';
      case 'Legendary': return 'bg-gradient-to-r from-yellow-800/20 to-slate-900/30';
      case 'Epic': return 'bg-gradient-to-r from-purple-900/30 to-slate-900/30';
      case 'Rare': return 'bg-gradient-to-r from-blue-900/30 to-slate-900/30';
      default: return 'bg-slate-800/50';
    }
  }
  getRarityPillClass(r: Rarity): string { switch(r){ case 'Mythic': return 'bg-red-500/20 text-red-400'; case 'Legendary': return 'bg-yellow-500/20 text-yellow-400'; case 'Epic': return 'bg-purple-500/20 text-purple-400'; case 'Rare': return 'bg-blue-500/20 text-blue-400'; default: return 'bg-gray-500/20 text-gray-300'; } }
  getHeroInitials(n: string): string { const p=n.split(' '); return p.length > 1 ? `${p[0][0]}${p[1][0]}` : n.substring(0,2).toUpperCase(); }
  formatNumber(n: number): string { if(n<1e3)return n.toFixed(0); const s=["","k","M","B","T"],i=Math.floor(Math.log10(n)/3); const sn=(n/1e3**i).toFixed(1); return sn.replace(/\.0$/,'')+s[i]; }

  getSlotIcon(s: EquipmentSlot): string {
    switch (s) {
        case 'Weapon': return 'M12 1.75L4.75 6.25V13.25C4.75 19.25 12 22.25 12 22.25C12 22.25 19.25 19.25 19.25 13.25V6.25L12 1.75Z M10 13L12 11L14 13 M12 11V17';
        case 'Armor': return 'M9 20V12L5 12V8C5 5.79086 6.79086 4 9 4H15C17.2091 4 19 5.79086 19 8V12L15 12V20H9Z';
        case 'Accessory': return 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z';
        default: return '';
    }
  }

  formatBonus(i: EquipmentItem): string { 
      switch(i.bonusType){ 
          case 'dpsFlat': return `+${this.formatNumber(i.bonusValue)} DPS`; 
          case 'dpsPercent': return `+${(i.bonusValue * 100).toFixed(0)}% DPS`; 
          case 'goldDropPercent': return `+${(i.bonusValue * 100).toFixed(0)}% Gold`; 
          case 'clickDamageFlat': return `+${this.formatNumber(i.bonusValue)} Click DMG`; 
          default: return ''; 
      }
  }

  getEquipmentTooltip(item: EquipmentItem | null): string {
      if (!item) return 'Empty Slot';
      let tooltip = `<strong>${item.name}</strong> (${item.rarity})`;
      if (item.enchantLevel > 0) {
          tooltip += ` <span style="color: #facc15;">+${item.enchantLevel}</span>`;
      }
      tooltip += `<br>${this.formatBonus(item)}`;
      if(item.lore) {
        tooltip += `<br><br><em style="color: #9ca3af;">"${item.lore}"</em>`;
      }
      return tooltip;
  }
  
  getRarityTextColor(r: Rarity): string {
    switch(r){
      case 'Mythic': return 'text-red-500';
      case 'Legendary': return 'text-yellow-400';
      case 'Epic': return 'text-purple-500';
      case 'Rare': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  }
}
