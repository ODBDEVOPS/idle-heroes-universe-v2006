import { Component, ChangeDetectionStrategy, output, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { EquipmentItem, Rarity } from '../../models/equipment.model';

interface Auction {
  id: number;
  item: EquipmentItem;
  buyoutPrice: number;
  timeLeft: 'Short' | 'Medium' | 'Long';
  seller: string;
}

@Component({
  selector: 'app-auction-house',
  standalone: true,
  templateUrl: './auction-house.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TooltipDirective],
})
export class AuctionHouseComponent {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  activeTab = signal<'browse' | 'bids' | 'auctions'>('browse');
  auctions = signal<Auction[]>([
    { id: 1, item: { id: 9001, name: 'Blade of the Undefeated', slot: 'Weapon', bonusType: 'dpsPercent', bonusValue: 0.25, baseBonusValue: 0.25, enchantLevel: 0, rarity: 'Epic', lore: 'A legendary blade, said to have never lost a battle.' }, buyoutPrice: 150000, timeLeft: 'Medium', seller: 'ShadowSlayer' },
    { id: 2, item: { id: 9002, name: 'Sturdy Iron Helm', slot: 'Armor', bonusType: 'dpsFlat', bonusValue: 50, baseBonusValue: 50, enchantLevel: 0, rarity: 'Rare', lore: 'Solid and dependable, if a little plain.' }, buyoutPrice: 7500, timeLeft: 'Short', seller: 'IronTide' },
    { id: 3, item: { id: 9003, name: 'Pendant of Swiftness', slot: 'Accessory', bonusType: 'dpsPercent', bonusValue: 0.10, baseBonusValue: 0.10, enchantLevel: 0, rarity: 'Rare', lore: 'Feels light to the touch.' }, buyoutPrice: 12000, timeLeft: 'Long', seller: 'RiftWalker' },
    { id: 4, item: { id: 9004, name: 'Goblin-forged Shiv', slot: 'Weapon', bonusType: 'dpsFlat', bonusValue: 15, baseBonusValue: 15, enchantLevel: 0, rarity: 'Common', lore: 'Crude, but gets the job done.' }, buyoutPrice: 800, timeLeft: 'Short', seller: 'Grizelda' },
  ]);
  playerAuctions = signal<Auction[]>([]);
  purchaseNotification = signal<string | null>(null);

  // My Auctions Tab State
  itemToSell = signal<EquipmentItem | null>(null);
  sellPrice = signal<number | null>(null);

  inventoryItems = computed(() => this.gameService().inventory());

  constructor() {}

  buyoutItem(auctionId: number) {
    const auction = this.auctions().find(a => a.id === auctionId);
    if (!auction) return;

    if (this.gameService().gameState().gold >= auction.buyoutPrice) {
      this.gameService().gameState.update(s => ({...s, gold: s.gold - auction.buyoutPrice}));
      this.gameService().inventory.update(inv => [...inv, auction.item]);
      this.auctions.update(auctions => auctions.filter(a => a.id !== auctionId));
      
      this.purchaseNotification.set(`Purchased ${auction.item.name}!`);
      setTimeout(() => this.purchaseNotification.set(null), 3000);
    }
  }

  createAuction() {
    const item = this.itemToSell();
    const price = this.sellPrice();
    if (!item || !price || price <= 0) return;

    this.gameService().inventory.update(inv => inv.filter(i => i.id !== item.id));

    const newAuction: Auction = {
      id: Date.now(),
      item: item,
      buyoutPrice: price,
      timeLeft: 'Long',
      seller: 'You'
    };

    this.playerAuctions.update(pa => [...pa, newAuction]);
    this.itemToSell.set(null);
    this.sellPrice.set(null);
  }

  getTooltip(item: EquipmentItem): string {
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
  
  formatBonus(item: EquipmentItem): string { 
      switch(item.bonusType){ 
          case 'dpsFlat': return `+${this.formatNumber(item.bonusValue)} DPS`; 
          case 'dpsPercent': return `+${(item.bonusValue * 100).toFixed(0)}% DPS`; 
          case 'goldDropPercent': return `+${(item.bonusValue * 100).toFixed(0)}% Gold`; 
          case 'clickDamageFlat': return `+${this.formatNumber(item.bonusValue)} Click DMG`; 
          default: return ''; 
      }
  }
  
  getRarityTextColor(rarity: Rarity): string { switch(rarity){ case 'Mythic': return 'text-red-500'; case 'Legendary': return 'text-yellow-400'; case 'Epic': return 'text-purple-500'; case 'Rare': return 'text-blue-400'; default: return 'text-gray-400'; } }
  formatNumber(n: number): string { if(n<1e3)return n.toFixed(0); const s=["","k","M","B","T"],i=Math.floor(Math.log10(n)/3); const sn=(n/Math.pow(1000,i)).toFixed(1); return sn.replace(/\.0$/,'')+s[i]; }
}
