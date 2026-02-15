import { Component, ChangeDetectionStrategy, input, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { EquipmentItem, EquipmentSlot, EquipmentBonusType, Rarity } from '../../models/equipment.model';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { View } from '../../app.component';

const RARITY_ORDER: Rarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class InventoryComponent {
  gameService = input.required<GameService>();
  viewChange = output<View>();

  rarities: (Rarity | 'All')[] = ['All', ...RARITY_ORDER];
  activeRarityFilter = signal<Rarity | 'All'>('All');
  activeSort = signal<'rarity' | 'name'>('rarity');
  searchTerm = signal<string>('');
  
  slots: EquipmentSlot[] = ['Weapon', 'Armor', 'Accessory'];

  // Modal State
  isDetailModalOpen = signal(false);
  selectedItem = signal<EquipmentItem | null>(null);
  isConfirmingSalvage = signal(false);

  equippedByHeroMap = computed(() => {
    const map = new Map<number, string>();
    for (const hero of this.gameService().heroes()) {
        for (const slot in hero.equipment) {
            const item = hero.equipment[slot as EquipmentSlot];
            if (item) {
                map.set(item.id, hero.name);
            }
        }
    }
    return map;
  });

  filteredAndSortedInventory = computed(() => {
    const inventory = this.gameService().inventory();
    const rarityFilter = this.activeRarityFilter();
    const sort = this.activeSort();
    const term = this.searchTerm().toLowerCase();

    // 1. Group by slot
    const grouped: Record<string, EquipmentItem[]> = {
      Weapon: [],
      Armor: [],
      Accessory: [],
    };

    for (const item of inventory) {
      // 2. Filter
      const rarityMatch = rarityFilter === 'All' || item.rarity === rarityFilter;
      const nameMatch = !term || item.name.toLowerCase().includes(term);
      
      if (rarityMatch && nameMatch) {
        grouped[item.slot].push(item);
      }
    }

    // 3. Sort each group
    for (const slot of this.slots) {
      grouped[slot].sort((a, b) => {
        if (sort === 'rarity') {
          return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
        }
        if (sort === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
    }

    return grouped;
  });

  heroesWhoCanEquip = computed(() => {
    const item = this.selectedItem();
    if (!item) return [];
    
    return this.gameService().heroes().filter(hero => hero.level > 0 && !hero.equipment[item.slot])
      .sort((a,b) => b.level - a.level);
  });

  openDetailModal(item: EquipmentItem) {
    this.selectedItem.set(item);
    this.isDetailModalOpen.set(true);
    this.isConfirmingSalvage.set(false);
  }

  closeDetailModal() {
    this.isDetailModalOpen.set(false);
    this.selectedItem.set(null);
  }

  equipItem(heroId: number) {
    const item = this.selectedItem();
    if (!item) return;
    this.gameService().equipItem(heroId, item.id);
    this.closeDetailModal();
  }

  unequipItem() {
    const item = this.selectedItem();
    if (!item) return;
    this.gameService().unequipItemById(item.id);
    this.closeDetailModal();
  }

  salvageItem() {
    const item = this.selectedItem();
    if (!item) return;
    this.gameService().salvageItems([item.id]);
    this.closeDetailModal();
  }

  goToEnchant() {
    const item = this.selectedItem();
    if (!item) return;
    this.gameService().itemToViewInEnchant.set(item.id);
    this.viewChange.emit('enchant');
    this.closeDetailModal();
  }

  setRarityFilter(rarity: Rarity | 'All') {
    this.activeRarityFilter.set(rarity);
  }
  
  onSearchChange(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onSortChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.activeSort.set(selectElement.value as 'rarity' | 'name');
  }
  
  isEquipped(itemId: number): boolean {
    return this.equippedByHeroMap().has(itemId);
  }
  
  getEquippedBy(itemId: number): string | undefined {
    return this.equippedByHeroMap().get(itemId);
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

  formatBonus(item: EquipmentItem): string {
    switch(item.bonusType) {
        case 'dpsFlat':
            return `+${this.formatNumber(item.bonusValue)} DPS`;
        case 'dpsPercent':
            return `+${(item.bonusValue * 100).toFixed(0)}% DPS`;
        case 'goldDropPercent':
            return `+${(item.bonusValue * 100).toFixed(0)}% Gold`;
        case 'clickDamageFlat':
            return `+${this.formatNumber(item.bonusValue)} Click DMG`;
        default:
            return '';
    }
  }

  formatNumber(num: number): string {
    if (num < 1000) {
      return num.toFixed(0);
    }
    const suffixes = ["", "k", "M", "B", "T"];
    const i = Math.floor(Math.log10(num) / 3);
    const shortNum = (num / Math.pow(1000, i)).toFixed(1);
    return shortNum.replace(/\.0$/, '') + suffixes[i];
  }
  
  getSlotIcon(s: EquipmentSlot): string {
    switch (s) {
      case 'Weapon': return 'M12 1.75L4.75 6.25V13.25C4.75 19.25 12 22.25 12 22.25C12 22.25 19.25 19.25 19.25 13.25V6.25L12 1.75Z M10 13L12 11L14 13 M12 11V17';
      case 'Armor': return 'M9 20V12L5 12V8C5 5.79086 6.79086 4 9 4H15C17.2091 4 19 5.79086 19 8V12L15 12V20H9Z';
      case 'Accessory': return 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z';
      default: return '';
    }
  }
  
  getBonusIconPath(type: EquipmentBonusType): string {
    switch (type) {
      case 'dpsFlat':
      case 'dpsPercent':
        return 'M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414z';
      case 'goldDropPercent':
        return 'M8.433 7.418c.158-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-1.167-.337c-1.108 0-2.062.64-2.5 1.5C4.833 8.718 5.782 7.082 8.433 7.418z M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 110-12 6 6 0 010 12z';
      case 'clickDamageFlat':
        return 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122';
    }
  }

  getHeroInitials(n: string): string {
    const p=n.split(' ');
    return p.length > 1 ? `${p[0][0]}${p[1][0]}` : n.substring(0,2).toUpperCase();
  }
  
  getEquipmentTooltip(item: EquipmentItem): string {
    let tooltip = `<strong style="color: ${this.getRarityColorForTooltip(item.rarity)}">${item.name}</strong>`;
    if (item.enchantLevel > 0) {
      tooltip += ` <span style="color: #facc15;">+${item.enchantLevel}</span>`;
    }
    tooltip += `<br><span style="color: ${this.getRarityColorForTooltip(item.rarity)}">${item.rarity} ${item.slot}</span>`;
    tooltip += `<br><span style="color: #10b981;">${this.formatBonus(item)}</span>`;
    if(item.lore) {
      tooltip += `<br><br><em style="color: #9ca3af;">"${item.lore}"</em>`;
    }
    return tooltip;
  }
  
  private getRarityColorForTooltip(rarity: Rarity): string {
    switch (rarity) {
      case 'Mythic': return '#ef4444';
      case 'Legendary': return '#facc15';
      case 'Epic': return '#a855f7';
      case 'Rare': return '#3b82f6';
      default: return '#9ca3af';
    }
  }
}
