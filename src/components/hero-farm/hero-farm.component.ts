import { Component, ChangeDetectionStrategy, output, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';
import { Hero } from '../../models/hero.model';
import { Rarity } from '../../models/equipment.model';
import { TooltipDirective } from '../../directives/tooltip.directive';

interface ShardShopItem {
  hero: Hero;
  cost: number;
}

@Component({
  selector: 'app-hero-farm',
  standalone: true,
  templateUrl: './hero-farm.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class HeroFarmComponent {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  isAssignModalOpen = signal(false);
  selectedSlotIndex = signal<number | null>(null);
  buyAmount = signal(1);
  collectionNotice = signal<{ heroEssence: number; loyaltyEssence: number } | null>(null);

  farmSlots = computed(() => {
    const assignedIds = this.gameService().gameState().heroFarm.assignedHeroIds;
    const heroes = this.gameService().heroes();
    return assignedIds.map(id => heroes.find(h => h.id === id) || null);
  });

  heroesOnFarmIds = computed(() => new Set(this.gameService().gameState().heroFarm.assignedHeroIds));
  
  availableHeroesForFarm = computed(() => {
    const heroesOnFarm = this.heroesOnFarmIds();
    const activeTeam = new Set(this.gameService().gameState().activeHeroIds);
    const heroesOnExpedition = new Set(this.gameService().gameState().ongoingExpeditions.flatMap(e => e.heroIds));
    const heroesOnBounty = new Set(this.gameService().gameState().activeDungeonBounties.flatMap(b => b.heroIds));

    return this.gameService().heroes().filter(h => 
      h.level > 0 &&
      !heroesOnFarm.has(h.id) && 
      !activeTeam.has(h.id) &&
      !heroesOnExpedition.has(h.id) &&
      !heroesOnBounty.has(h.id)
    ).sort((a,b) => b.level - a.level);
  });
  
  essenceRate = computed(() => {
    return this.gameService().getEssenceGenerationRate();
  });
  
  loyaltyEssenceRate = computed(() => {
    return this.gameService().getLoyaltyEssenceGenerationRate();
  });

  shardShopItems = computed<ShardShopItem[]>(() => {
    const unlockedHeroes = this.gameService().heroes().filter(h => h.level > 0);
    return unlockedHeroes.map(hero => ({
      hero,
      cost: this.gameService().getShardCost(hero.rarity)
    })).sort((a,b) => a.hero.id - b.hero.id);
  });

  openAssignModal(slotIndex: number) {
    this.selectedSlotIndex.set(slotIndex);
    this.isAssignModalOpen.set(true);
  }

  closeAssignModal() {
    this.isAssignModalOpen.set(false);
    this.selectedSlotIndex.set(null);
  }

  assignHero(heroId: number) {
    const slotIndex = this.selectedSlotIndex();
    if (slotIndex !== null) {
      this.gameService().assignHeroToFarm(heroId, slotIndex);
    }
    this.closeAssignModal();
  }
  
  removeHero(slotIndex: number, event: MouseEvent) {
    event.stopPropagation();
    this.gameService().removeHeroFromFarm(slotIndex);
  }

  collectResources() {
    const collected = this.gameService().collectFarmResources();
    if(collected.heroEssence > 0 || collected.loyaltyEssence > 0) {
      this.collectionNotice.set(collected);
      setTimeout(() => this.collectionNotice.set(null), 2000);
    }
  }
  
  buyShards(heroId: number) {
    this.gameService().purchaseHeroShards(heroId, this.buyAmount());
  }
  
  setBuyAmount(amount: number) {
    this.buyAmount.set(amount);
  }

  // --- UI Helpers ---
  formatNumber(n: number): string { if(n<1e3)return n.toFixed(0); const s=["","k","M","B","T"],i=Math.floor(Math.log10(n)/3); const sn=(n/1e3**i).toFixed(1); return sn.replace(/\.0$/,'')+s[i]; }
  getHeroInitials(n: string): string { const p=n.split(' '); return p.length > 1 ? `${p[0][0]}${p[1][0]}` : n.substring(0,2).toUpperCase(); }
  getRarityBorderClass(r: Rarity): string { switch(r){ case 'Mythic': return 'border-red-500'; case 'Legendary': return 'border-yellow-400'; case 'Epic': return 'border-purple-500'; case 'Rare': return 'border-blue-500'; default: return 'border-gray-600'; } }
  getRarityTextColor(r: Rarity): string { switch(r){ case 'Mythic': return 'text-red-500'; case 'Legendary': return 'text-yellow-400'; case 'Epic': return 'text-purple-500'; case 'Rare': return 'text-blue-400'; default: return 'text-gray-400'; } }
}
