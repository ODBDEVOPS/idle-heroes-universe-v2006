import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { View } from '../../app.component';
import { EquipmentItem, EquipmentSlot, Rarity } from '../../models/equipment.model';
import { TooltipDirective } from '../../directives/tooltip.directive';

const RARITY_ORDER: Rarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];

@Component({
  selector: 'app-alchemy-lab',
  standalone: true,
  templateUrl: './alchemy-lab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class AlchemyLabComponent {
  gameService = input.required<GameService>();
  viewChange = output<View>();

  activeTab = signal<'salvage' | 'transmute'>('salvage');
  
  // Salvage state
  selectedItemIds = signal<number[]>([]);
  salvageResult = signal<number | null>(null);

  // Transmute state
  transmuteDustAmount = signal(0);
  transmuteResult = signal<number | null>(null);

  salvageableItems = computed(() => 
    this.gameService().inventory().slice().sort((a,b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity))
  );

  potentialDustGain = computed(() => {
    const ids = this.selectedItemIds();
    if (ids.length === 0) return 0;
    const items = this.gameService().inventory().filter(i => ids.includes(i.id));
    return items.reduce((sum, item) => sum + this.getDustValue(item.rarity), 0);
  });

  potentialGoldGain = computed(() => {
    return this.transmuteDustAmount() * 500;
  });

  getDustValue(rarity: Rarity): number {
    switch(rarity) {
      case 'Common': return 1;
      case 'Rare': return 5;
      case 'Epic': return 25;
      case 'Legendary': return 100;
      case 'Mythic': return 500;
      default: return 0;
    }
  }

  toggleItemSelection(itemId: number) {
    this.selectedItemIds.update(ids => {
      const newIds = new Set(ids);
      if (newIds.has(itemId)) {
        newIds.delete(itemId);
      } else {
        newIds.add(itemId);
      }
      return Array.from(newIds);
    });
  }

  selectAllRarity(rarity: Rarity) {
    const commonItems = this.gameService().inventory().filter(i => i.rarity === rarity);
    this.selectedItemIds.set(commonItems.map(i => i.id));
  }

  executeSalvage() {
    const ids = this.selectedItemIds();
    if (ids.length === 0) return;
    
    const dustGained = this.gameService().salvageItems(ids);
    this.salvageResult.set(dustGained);
    this.selectedItemIds.set([]);
    setTimeout(() => this.salvageResult.set(null), 2000);
  }

  setTransmuteAmount(percentage: number) {
    const maxDust = this.gameService().gameState().enchantingDust;
    this.transmuteDustAmount.set(Math.floor(maxDust * percentage));
  }
  
  onTransmuteAmountChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    const maxDust = this.gameService().gameState().enchantingDust;
    this.transmuteDustAmount.set(Math.max(0, Math.min(maxDust, isNaN(value) ? 0 : value)));
  }

  executeTransmute() {
    const amount = this.transmuteDustAmount();
    if (amount <= 0) return;

    const goldGained = this.gameService().transmuteEnchantingDustForGold(amount);
    if (goldGained > 0) {
      this.transmuteResult.set(goldGained);
      this.transmuteDustAmount.set(0);
      setTimeout(() => this.transmuteResult.set(null), 2000);
    }
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
  
  formatNumber(num: number): string {
    if (num < 1000) return num.toFixed(0);
    const suffixes = ["", "k", "M", "B", "T"];
    const i = Math.floor(Math.log10(num) / 3);
    const shortNum = (num / Math.pow(1000, i)).toFixed(1);
    return shortNum.replace(/\.0$/, '') + suffixes[i];
  }

  formatBonus(item: EquipmentItem): string {
    switch(item.bonusType) {
        case 'dpsFlat': return `+${this.formatNumber(item.bonusValue)} DPS`;
        case 'dpsPercent': return `+${(item.bonusValue * 100).toFixed(0)}% DPS`;
        case 'goldDropPercent': return `+${(item.bonusValue * 100).toFixed(0)}% Gold`;
        case 'clickDamageFlat': return `+${this.formatNumber(item.bonusValue)} Click`;
        default: return '';
    }
  }
}
