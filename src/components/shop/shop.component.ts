import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { View } from '../../app.component';
import { Hero } from '../../models/hero.model';
import { Rarity } from '../../models/equipment.model';

interface ShopHero extends Hero {
  shardCost: number;
}

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class ShopComponent {
  gameService = input.required<GameService>();
  viewChange = output<View>();

  activeTab = signal<'featured' | 'fragments' | 'resources'>('fragments');
  purchaseNotice = signal<string | null>(null);

  unlockedHeroesForShop = computed<ShopHero[]>(() => {
    return this.gameService().heroes()
      .filter(h => h.level > 0)
      .map(h => ({
        ...h,
        shardCost: this.gameService().getShardCost(h.rarity)
      }));
  });

  purchaseHeroShards(heroId: number) {
    if (this.gameService().purchaseHeroShards(heroId, 1)) {
      this.showPurchaseNotice(`Purchased 1 shard!`);
    }
  }

  purchaseResource(item: 'gold' | 'dust' | 'tomes') {
    // This is a mock implementation
    let cost = 0;
    let notice = '';
    switch(item) {
      case 'gold':
        cost = 10; // prestige points
        if (this.gameService().gameState().prestigePoints >= cost) {
          this.gameService().gameState.update(s => ({
            ...s,
            prestigePoints: s.prestigePoints - cost,
            gold: s.gold + 100000,
          }));
          notice = 'Purchased 100k Gold!';
        }
        break;
      case 'dust':
        cost = 25;
        if (this.gameService().gameState().prestigePoints >= cost) {
          this.gameService().gameState.update(s => ({
            ...s,
            prestigePoints: s.prestigePoints - cost,
            enchantingDust: s.enchantingDust + 100,
          }));
          notice = 'Purchased 100 Enchanting Dust!';
        }
        break;
      case 'tomes':
        cost = 50;
        if (this.gameService().gameState().prestigePoints >= cost) {
           this.gameService().gameState.update(s => ({
            ...s,
            prestigePoints: s.prestigePoints - cost,
            skillTomes: s.skillTomes + 10,
          }));
          notice = 'Purchased 10 Tomes of Skill!';
        }
        break;
    }
    if (notice) {
      this.showPurchaseNotice(notice);
    }
  }

  private showPurchaseNotice(message: string) {
    this.purchaseNotice.set(message);
    setTimeout(() => this.purchaseNotice.set(null), 2000);
  }

  formatNumber(n: number): string {
    if (n < 1000) return n.toFixed(0);
    const s=["","k","M","B","T"],i=Math.floor(Math.log10(n)/3);
    const sn=(n/1e3**i).toFixed(1);
    return sn.replace(/\.0$/,'')+s[i];
  }

  getHeroInitials(n: string): string { const p=n.split(' '); return p.length > 1 ? `${p[0][0]}${p[1][0]}` : n.substring(0,2).toUpperCase(); }
  getRarityTextColor(r: Rarity): string { switch(r){ case 'Mythic': return 'text-red-500'; case 'Legendary': return 'text-yellow-400'; case 'Epic': return 'text-purple-500'; case 'Rare': return 'text-blue-400'; default: return 'text-gray-400'; } }
  getRarityBorderClass(r: Rarity): string { switch(r){ case 'Mythic': return 'border-red-500'; case 'Legendary': return 'border-yellow-400'; case 'Epic': return 'border-purple-500'; case 'Rare': return 'border-blue-500'; default: return 'border-gray-600'; } }
}
