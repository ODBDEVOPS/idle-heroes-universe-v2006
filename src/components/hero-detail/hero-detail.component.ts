import { Component, ChangeDetectionStrategy, input, signal, computed, effect, output, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';
import { Hero, Role } from '../../models/hero.model';
import { EquipmentSlot, EquipmentItem, Rarity, ALL_EQUIPMENT_SETS } from '../../models/equipment.model';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { Specialization, SpecializationPath } from '../../models/specialization.model';

interface DisplayHero extends Hero {
  shardCount: number;
  requiredShards: number;
  canAscend: boolean;
}

interface SpecializationNode {
  spec: Specialization;
  status: 'unlocked' | 'available' | 'locked';
  requirements: string[];
}


@Component({
  selector: 'app-hero-detail',
  standalone: true,
  templateUrl: './hero-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective, FormsModule],
})
export class HeroDetailComponent implements OnDestroy, OnInit {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  heroId = signal<number | null>(null);

  // Modals
  isEquipModalOpen = signal(false);
  levelUpNotice = signal<{ heroId: number, levelsGained: number } | null>(null);

  // View state
  internalView = signal<'stats' | 'specialization' | 'lore'>('stats');
  selectedSlot = signal<EquipmentSlot | null>(null);
  isPlacementMode = signal(false);
  isPromoting = signal(false);


  // --- Computed Signals ---
  heroData = computed<DisplayHero | null>(() => {
    const id = this.heroId();
    if (!id) return null;
    
    const hero = this.gameService().heroes().find(h => h.id === id);
    if (!hero) return null;

    const cost = this.gameService().getFusionCost(hero);
    const shardCount = this.gameService().gameState().heroShards[hero.id] || 0;
    const canAscend = shardCount >= cost.shards && this.gameService().gameState().gold >= cost.gold;

    return {
        ...hero,
        shardCount,
        requiredShards: cost.shards,
        canAscend,
    };
  });

  activeTeamHeroes = computed(() => {
    const activeIds = this.gameService().gameState().activeHeroIds;
    const allHeroes = this.gameService().heroes();
    return activeIds.map(id => allHeroes.find(h => h.id === id) || null);
  });

  activeHeroIdSet = computed(() => new Set(this.gameService().gameState().activeHeroIds));

  availableItemsForSlot = computed(() => {
    const slot = this.selectedSlot();
    if (!slot) return [];
    return this.gameService().inventory().filter(item => item.slot === slot);
  });

  activeSetBonuses = computed(() => {
    const hero = this.heroData();
    if (!hero) return [];

    const setCounts: { [setName: string]: number } = {};
    for (const slot in hero.equipment) {
      const item = hero.equipment[slot as EquipmentSlot];
      if (item && item.set) {
        setCounts[item.set] = (setCounts[item.set] || 0) + 1;
      }
    }

    const activeBonuses: { setName: string, description: string }[] = [];

    for (const setId in setCounts) {
      const setInfo = ALL_EQUIPMENT_SETS.find(s => s.id === setId);
      if (setInfo) {
        const count = setCounts[setId];
        setInfo.bonuses.forEach(bonus => {
          if (count >= bonus.threshold) {
            activeBonuses.push({ setName: setInfo.name, description: bonus.description });
          }
        });
      }
    }
    return activeBonuses;
  });

  // --- Specialization Computed Signals ---
  path = computed<SpecializationPath | null>(() => {
    const h = this.heroData();
    if (!h) return null;
    return this.gameService().getSpecializationPathForHero(h.id);
  });
  
  heroSpecPath = computed(() => {
    const h = this.heroData();
    if (!h) return [];
    return this.gameService().gameState().heroSpecializations[h.id] || [];
  });

  promotion1Nodes = computed<SpecializationNode[]>(() => this.getPromotionNodes(1));
  promotion2Nodes = computed<SpecializationNode[]>(() => this.getPromotionNodes(2));
  
  private getPromotionNodes(tier: 1 | 2): SpecializationNode[] {
    const h = this.heroData();
    const p = this.path();
    if (!h || !p) return [];

    const currentPath = this.heroSpecPath();
    const nodes: SpecializationNode[] = [];
    const essence = this.gameService().gameState().essenceOfLoyalty;

    if (tier === 1) {
      const promotionInfo = p.promotion1;
      for (const specId of promotionInfo.options) {
        const spec = this.gameService().getSpecializationById(specId);
        if (spec) {
          const isUnlocked = currentPath.includes(specId);
          const canAfford = essence >= promotionInfo.cost;
          const meetsLevelReq = h.level >= promotionInfo.levelReq;
          const isAvailable = !isUnlocked && currentPath.length === 0 && meetsLevelReq && canAfford;
          const isLocked = !isUnlocked && !isAvailable;
          
          const requirements = [];
          if(isLocked) {
            if (!meetsLevelReq) requirements.push(`Lvl ${promotionInfo.levelReq}`);
            if (!canAfford) requirements.push(`🌟 ${promotionInfo.cost}`);
          }

          nodes.push({ spec, status: isUnlocked ? 'unlocked' : (isAvailable ? 'available' : 'locked'), requirements });
        }
      }
    } else if (tier === 2 && currentPath.length > 0) {
      const promotionInfo = p.promotion2;
      const promo1Id = currentPath[0];
      const options = promotionInfo.options[promo1Id] || [];
      
      for (const specId of options) {
        const spec = this.gameService().getSpecializationById(specId);
        if (spec) {
          const isUnlocked = currentPath.includes(specId);
          const canAfford = essence >= promotionInfo.cost;
          const meetsLevelReq = h.level >= promotionInfo.levelReq;
          const isAvailable = !isUnlocked && currentPath.length === 1 && meetsLevelReq && canAfford;
          const isLocked = !isUnlocked && !isAvailable;

          const requirements = [];
          if(isLocked) {
            if (!meetsLevelReq) requirements.push(`Lvl ${promotionInfo.levelReq}`);
            if (!canAfford) requirements.push(`🌟 ${promotionInfo.cost}`);
          }

          nodes.push({ spec, status: isUnlocked ? 'unlocked' : (isAvailable ? 'available' : 'locked'), requirements });
        }
      }
    }
    return nodes;
  }

  constructor() {
    effect(() => {
      const heroIdFromService = this.gameService().heroToViewInTeam();
      if (typeof heroIdFromService === 'number') {
        this.heroId.set(heroIdFromService);
      }
    });
  }
  
  ngOnInit() {
    if (this.heroId() === null) {
      const firstHero = this.gameService().heroes()[0];
      if (firstHero) {
        this.heroId.set(firstHero.id);
      }
    }
  }

  ngOnDestroy() {
    this.gameService().heroToViewInTeam.set(undefined);
  }

  back() {
    this.viewChange.emit('team');
  }

  async promote(specializationId: string) {
    const h = this.heroData();
    if (!h || this.isPromoting()) return;

    this.isPromoting.set(true);
    await this.gameService().promoteHero(h.id, specializationId);
    this.isPromoting.set(false);
  }

  // --- Team Management ---
  enterPlacementMode() {
    const hero = this.heroData();
    if (!hero || this.activeHeroIdSet().has(hero.id)) return;
    this.isPlacementMode.set(true);
  }

  cancelPlacementMode() {
    this.isPlacementMode.set(false);
  }

  placeHeroInSlot(slotIndex: number) {
    const heroId = this.heroId();
    if (!this.isPlacementMode() || !heroId) return;
    this.gameService().swapActiveHero(heroId, slotIndex);
    this.isPlacementMode.set(false);
  }

  removeHeroFromTeam() {
    const heroId = this.heroId();
    if (!heroId || !this.activeHeroIdSet().has(heroId)) return;
    const activeIds = this.gameService().gameState().activeHeroIds;
    const slotIndex = activeIds.indexOf(heroId);
    if (slotIndex > -1) {
        this.gameService().removeHeroFromActiveSlot(slotIndex);
    }
  }

  goToFusion(heroId: number) {
    this.gameService().heroToViewInTeam.set(heroId);
    this.viewChange.emit('fusion');
  }
  
  goToSpecialization(heroId: number) {
    this.gameService().heroToViewInTeam.set(heroId);
    this.viewChange.emit('heroSpecialization');
  }

  // --- Hero Actions & Modals ---
  levelUp(heroId: number) { this.gameService().levelUpHero(heroId); }
  levelUpMultiple(heroId: number, levels: number) { this.gameService().levelUpHeroMultiple(heroId, levels); }

  levelUpMax(heroId: number) {
    const hero = this.gameService().heroes().find(h => h.id === heroId);
    const gold = this.gameService().gameState().gold;
    if (!hero) return;
    const { levels } = this.calculateMaxLevels(hero, gold);
    if (levels > 0) this.gameService().levelUpHeroMultiple(heroId, levels);
  }

  autoEquip(heroId: number) { this.gameService().autoEquipBestGear(heroId); }

  calculateCost(hero: Hero, levels: number): number {
    return this.gameService().calculateCost(hero, levels);
  }

  calculateMaxLevels(hero: Hero, currentGold: number): { levels: number, cost: number } {
    return this.gameService().calculateMaxLevels(hero, currentGold);
  }

  claimXp(heroId: number, event: MouseEvent) {
    event.stopPropagation();
    const levelsGained = this.gameService().claimOfflineXp(heroId);
    if (levelsGained > 0) {
        this.levelUpNotice.set({ heroId, levelsGained });
        setTimeout(() => this.levelUpNotice.set(null), 2000);
    }
  }
  
  toggleFavorite(heroId: number, event: MouseEvent) {
    event.stopPropagation();
    this.gameService().toggleHeroFavorite(heroId);
  }

  openEquipModal(slot: EquipmentSlot) {
    this.selectedSlot.set(slot);
    this.isEquipModalOpen.set(true);
  }

  closeEquipModal() {
    this.isEquipModalOpen.set(false);
    this.selectedSlot.set(null);
  }

  onEquipItem(itemId: number) {
    const heroId = this.heroData()?.id;
    if (heroId) this.gameService().equipItem(heroId, itemId);
    this.closeEquipModal();
  }

  onUnequipItem() {
    const heroId = this.heroData()?.id;
    const slot = this.selectedSlot();
    if (heroId && slot) this.gameService().unequipItem(heroId, slot);
    this.closeEquipModal();
  }
  
  getEquipmentTooltip(item: EquipmentItem | null): string {
      if (!item) return 'Empty Slot';
      let tooltip = `<strong>${item.name}</strong> (${item.rarity})`;
      if (item.enchantLevel > 0) {
          tooltip += ` <span style="color: #facc15;">+${item.enchantLevel}</span>`;
      }
      tooltip += `<br>${this.formatBonus(item)}`;

      if (item.set) {
        const setInfo = ALL_EQUIPMENT_SETS.find(s => s.id === item.set);
        if (setInfo) {
          tooltip += `<br><br><span style="color: #6ee7b7;">${setInfo.name}</span>`;
          const hero = this.heroData();
          let equippedCount = 0;
          if (hero) {
            for (const slot in hero.equipment) {
              const equippedItem = hero.equipment[slot as EquipmentSlot];
              if (equippedItem && equippedItem.set === item.set) {
                equippedCount++;
              }
            }
          }

          setInfo.bonuses.forEach(bonus => {
            const color = equippedCount >= bonus.threshold ? '#6ee7b7' : '#6b7280';
            tooltip += `<br><span style="color: ${color}">(${bonus.threshold}) ${bonus.description}</span>`;
          });
        }
      }
      
      if(item.lore) {
        tooltip += `<br><br><em style="color: #9ca3af;">"${item.lore}"</em>`;
      }
      return tooltip;
  }
  
  formatBonus(item: EquipmentItem): string { 
      switch(item.bonusType){ 
          case 'dpsFlat': return `+${this.formatNumber(item.bonusValue)} DPS`; 
          case 'dpsPercent': return `+${(item.bonusValue * 100).toFixed(0)}% DPS`; 
          case 'goldDropPercent': return `+${(item.bonusValue * 100).toFixed(0)}% Gold`; 
          case 'clickDamageFlat': return `+${this.formatNumber(item.bonusValue)} Click DMG`; 
          default: return ''; 
      }
  }

  formatNumber(num: number): string { 
    if(num<1e3)return num.toFixed(0); 
    const s=["","k","M","B","T"],i=Math.floor(Math.log10(num)/3); 
    const sn=(num/Math.pow(1000,i)).toFixed(1); 
    return sn.replace(/\.0$/,'')+s[i]; 
  }

  getRarityHeaderBgClass(rarity: Rarity): string {
    switch (rarity) {
        case 'Mythic': return 'bg-gradient-to-br from-red-600 to-gray-900';
        case 'Legendary': return 'bg-gradient-to-br from-yellow-600 to-gray-900';
        case 'Epic': return 'bg-gradient-to-br from-purple-600 to-gray-900';
        case 'Rare': return 'bg-gradient-to-br from-blue-600 to-gray-900';
        default: return 'bg-gradient-to-br from-gray-600 to-gray-900';
    }
  }

  getRarityShadowClass(rarity: Rarity): string {
      switch (rarity) {
          case 'Mythic': return 'shadow-red-500/50';
          case 'Legendary': return 'shadow-yellow-400/50';
          case 'Epic': return 'shadow-purple-500/50';
          case 'Rare': return 'shadow-blue-500/50';
          default: return 'shadow-gray-500/50';
      }
  }

  getSlotIcon(slot: EquipmentSlot): string {
    switch (slot) {
        case 'Weapon': return 'M12 1.75L4.75 6.25V13.25C4.75 19.25 12 22.25 12 22.25C12 22.25 19.25 19.25 19.25 13.25V6.25L12 1.75Z M10 13L12 11L14 13 M12 11V17';
        case 'Armor': return 'M9 20V12L5 12V8C5 5.79086 6.79086 4 9 4H15C17.2091 4 19 5.79086 19 8V12L15 12V20H9Z';
        case 'Accessory': return 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z';
        default: return '';
    }
  }

  getRarityPillClass(rarity: Rarity): string {
    switch(rarity){ 
        case 'Mythic': return 'bg-red-500/20 text-red-400'; 
        case 'Legendary': return 'bg-yellow-500/20 text-yellow-400'; 
        case 'Epic': return 'bg-purple-500/20 text-purple-400'; 
        case 'Rare': return 'bg-blue-500/20 text-blue-400'; 
        default: return 'bg-gray-500/20 text-gray-300'; 
    }
  }

  getRarityBorderClass(rarity: Rarity): string { 
    switch(rarity){ 
        case 'Mythic': return 'border-red-500'; 
        case 'Legendary': return 'border-yellow-400'; 
        case 'Epic': return 'border-purple-500'; 
        case 'Rare': return 'border-blue-500'; 
        default: return 'border-gray-600'; 
    }
  }

  getRarityBgClass(rarity: Rarity): string {
    switch(rarity){
      case 'Mythic': return 'bg-red-900/30';
      case 'Legendary': return 'bg-yellow-700/20';
      case 'Epic': return 'bg-purple-800/30';
      case 'Rare': return 'bg-blue-800/30';
      default: return 'bg-gray-800/50';
    }
  }

  getRarityTextColor(rarity: Rarity): string { 
    switch(rarity){ 
        case 'Mythic': return 'text-red-500'; 
        case 'Legendary': return 'text-yellow-400'; 
        case 'Epic': return 'text-purple-500'; 
        case 'Rare': return 'text-blue-400'; 
        default: return 'text-gray-400'; 
    }
  }

  getHeroInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`;
    }
    return name.substring(0, 2).toUpperCase();
  }

  // --- UI Helpers ---
  roleIcons: Record<Role, string> = { 'Tank': 'M12,2 L12,11 L4,11 L4,15 L12,15 L12,22 L14,22 L14,15 L20,15 L20,11 L14,11 L14,2 L12,2 Z M4,6 L20,6 L20,9 L4,9 L4,6 Z', 'DPS': 'M18.2,1.3l-5.6,5.6l1.4,1.4l5.6-5.6L18.2,1.3z M3,14.1l2.8-2.8l4.2,4.2l-2.8,2.8L3,14.1z M8.6,8.6 L3.4,13.8l1.4,1.4l5.2-5.2L8.6,8.6z M12.8,4.4l-7,7l1.4,1.4l7-7L12.8,4.4z M17,8.6l-7,7l1.4,1.4l7-7 L17,8.6z', 'Support': 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z', 'Assassin': 'M14.5,3 l-1.5-1 h-2 L9.5,3 L8,4.5 V6 h8 V4.5 L14.5,3 z M16,7 H8 L9,16 l3,6 l3-6 l1-9 z', 'Controller': 'M6,2v6h12V2H6z M8,4h8v2H8V4z M6,22v-6h12v6H6z M8,20h8v-2H8V20z M12,10 c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S13.1,10,12,10z', 'Bruiser': 'M20.5,10L23,12.5L20.5,15H17v3h-3v-3h-4v3H7v-3H3.5L1,12.5L3.5,10H7V7h3v3h4V7h3V10H20.5z', 'Marksman': 'M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8 s3.59-8,8-8s8,3.59,8,8S16.41,20,12,20z M12,6c-3.31,0-6,2.69-6,6s2.69,6,6,6s6-2.69,6-6S15.31,6,12,6z M12,16 c-2.21,0-4-1.79-4-4s1.79-4,4-4s4,1.79,4,4S14.21,16,12,16z', 'Mage': 'M12,3L9.11,8.33L3,9.5l4.5,4.36L6.22,20L12,17.27L17.78,20L16.5,13.86L21,9.5l-6.11-1.17L12,3z', 'Healer': 'M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7v-2h4V7h2v4h4v2h-4v4h-2z', 'Démoniste': 'M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10s10-4.47,10-10S17.53,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8S16.41,20,12,20z M15.5,11h-7v2h7V11z M9.5,8 C8.67,8,8,7.33,8,6.5S8.67,5,9.5,5s1.5,0.67,1.5,1.5S10.33,8,9.5,8z M14.5,8c-0.83,0-1.5-0.67-1.5-1.5S13.67,5,14.5,5 s1.5,0.67,1.5,1.5S15.33,8,14.5,8z', 'Shaman': 'M12,2c-1.95,0-3.8,0.73-5.25,2.04L12,9.3V2z M12,14.7l-5.25,5.25C8.2,21.27,10.05,22,12,22c1.95,0,3.8-0.73,5.25-2.04 L12,14.7z M20,12c0,1.95-0.73,3.8-2.04,5.25L12,12l5.96-5.25C19.27,8.2,20,10.05,20,12z M4,12c0-1.95,0.73-3.8,2.04-5.25L12,12 L6.04,17.25C4.73,15.8,4,13.95,4,12z', 'Mangas Hero': 'M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,13.5c-0.83,0-1.5-0.67-1.5-1.5 s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S12.83,13.5,12,13.5z M16,9H8V7h8V9z M16,17H8v-2h8V17z', 'Video game Hero': 'M9,4H7V2h2V4z M13,4h-2V2h2V4z M17,4h-2V2h2V4z M21,8V6h-2V4h-2V6h-2v2h2v2h2V8h2V6h2v2H21z M19,10h-2V8h2V10z M15,10h-2V8h2V10z M11,10H9V8h2V10z M7,10H5V8h2V10z M3,8V6H1v2H3z M19,22v-2h-2v-2h-2v2h-2v2h2v2h2v-2h2v2h2v-2H19z M15,18h-2v2h2V18z M11,18H9v2h2V18z M7,18H5v2h2V18z M3,20v-2H1v2H3z' };
}
