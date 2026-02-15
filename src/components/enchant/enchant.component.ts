import { Component, ChangeDetectionStrategy, output, input, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';
import { EquipmentItem, Rarity } from '../../models/equipment.model';
import { TooltipDirective } from '../../directives/tooltip.directive';

const RARITY_ORDER: Rarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];

@Component({
  selector: 'app-enchant',
  standalone: true,
  templateUrl: './enchant.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class EnchantComponent implements OnInit {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  selectedItemId = signal<number | null>(null);
  isEnchanting = signal(false);
  enchantSuccess = signal(false);

  inventory = computed(() => 
    this.gameService().inventory().slice().sort((a, b) => {
        const rarityDiff = RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
        if (rarityDiff !== 0) return rarityDiff;
        return b.enchantLevel - a.enchantLevel;
    })
  );

  selectedItem = computed(() => {
    const id = this.selectedItemId();
    if (!id) return null;
    return this.inventory().find(item => item.id === id) ?? null;
  });
  
  enchantCost = computed(() => {
    const item = this.selectedItem();
    if (!item) return null;
    return this.gameService().getEnchantCost(item);
  });
  
  statsAfterEnchant = computed(() => {
    const item = this.selectedItem();
    if (!item) return null;
    const newEnchantLevel = item.enchantLevel + 1;
    const newBonusValue = item.baseBonusValue * (1 + newEnchantLevel * 0.10);
    return {
      enchantLevel: newEnchantLevel,
      bonusValue: newBonusValue,
    };
  });
  
  canEnchant = computed(() => {
    const cost = this.enchantCost();
    if (!cost) return false;
    const state = this.gameService().gameState();
    return state.enchantingDust >= cost.dust && state.gold >= cost.gold;
  });

  constructor() {
    effect(() => {
      const itemIdToSelect = this.gameService().itemToViewInEnchant();
      if (typeof itemIdToSelect === 'number') {
        if (this.inventory().some(i => i.id === itemIdToSelect)) {
          this.selectedItemId.set(itemIdToSelect);
        }
        this.gameService().itemToViewInEnchant.set(undefined);
      }
    });
  }

  ngOnInit() {
    if (!this.selectedItemId() && this.inventory().length > 0) {
      this.selectedItemId.set(this.inventory()[0].id);
    }
  }

  selectItem(itemId: number) {
    this.selectedItemId.set(itemId);
    this.enchantSuccess.set(false);
  }

  executeEnchant() {
    const itemId = this.selectedItemId();
    if (!this.canEnchant() || !itemId) return;
    
    this.isEnchanting.set(true);
    
    setTimeout(() => {
      const success = this.gameService().enchantItem(itemId);
      if (success) {
        this.enchantSuccess.set(true);
      }
      this.isEnchanting.set(false);
      setTimeout(() => this.enchantSuccess.set(false), 2000);
    }, 1000); // Animation duration
  }

  // --- UI Helpers ---
  getRarityBorderClass(r: Rarity): string { switch(r){ case 'Mythic': return 'border-red-500'; case 'Legendary': return 'border-yellow-400'; case 'Epic': return 'border-purple-500'; case 'Rare': return 'border-blue-500'; default: return 'border-gray-600'; } }
  getRarityTextColor(r: Rarity): string { switch(r){ case 'Mythic': return 'text-red-500'; case 'Legendary': return 'text-yellow-400'; case 'Epic': return 'text-purple-500'; case 'Rare': return 'text-blue-400'; default: return 'text-gray-400'; } }
  formatNumber(n: number): string { if(n<1e3)return n.toFixed(0); const s=["","k","M","B","T"],i=Math.floor(Math.log10(n)/3); const sn=(n/1e3**i).toFixed(1); return sn.replace(/\.0$/,'')+s[i]; }
  formatBonus(item: EquipmentItem, value?: number): string { 
    const val = value !== undefined ? value : item.bonusValue;
    switch(item.bonusType){ 
        case 'dpsFlat': return `+${this.formatNumber(val)} DPS`; 
        case 'dpsPercent': return `+${(val * 100).toFixed(1)}% DPS`; 
        case 'goldDropPercent': return `+${(val * 100).toFixed(1)}% Gold`; 
        case 'clickDamageFlat': return `+${this.formatNumber(val)} Click DMG`; 
        default: return ''; 
    }
  }
}
