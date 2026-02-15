import { Component, ChangeDetectionStrategy, input, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { Hero } from '../../models/hero.model';
import { Rarity } from '../../models/equipment.model';
import { TooltipDirective } from '../../directives/tooltip.directive';

@Component({
  selector: 'app-fusion',
  standalone: true,
  templateUrl: './fusion.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class FusionComponent {
  gameService = input.required<GameService>();

  selectedHeroId = signal<number | null>(null);
  isFusing = signal(false);
  fusionSuccess = signal(false);

  fusibleHeroes = computed(() => {
    return this.gameService().heroes()
      .filter(h => h.level > 0) // Only show unlocked heroes
      .sort((a, b) => b.level - a.level);
  });

  selectedHero = computed(() => {
    const id = this.selectedHeroId();
    if (!id) return null;
    return this.fusibleHeroes().find(h => h.id === id) ?? null;
  });

  fusionCost = computed(() => {
    const hero = this.selectedHero();
    if (!hero) return null;
    return this.gameService().getFusionCost(hero);
  });
  
  heroShards = computed(() => {
      const hero = this.selectedHero();
      if (!hero) return 0;
      return this.gameService().gameState().heroShards[hero.id] || 0;
  });

  canFuse = computed(() => {
    const cost = this.fusionCost();
    const hero = this.selectedHero();
    if (!cost || !hero) return false;
    
    const hasEnoughShards = this.heroShards() >= cost.shards;
    const hasEnoughGold = this.gameService().gameState().gold >= cost.gold;

    return hasEnoughShards && hasEnoughGold;
  });
  
  statsAfterFusion = computed(() => {
      const hero = this.selectedHero();
      if (!hero) return null;

      const ascensionBonus = 1 + (hero.ascensionLevel * 0.15);
      const nextAscensionBonus = 1 + ((hero.ascensionLevel + 1) * 0.15);
      const newDps = Math.floor(hero.currentDps / ascensionBonus * nextAscensionBonus);
      
      return {
          ascensionLevel: hero.ascensionLevel + 1,
          dps: newDps
      };
  });

  constructor() {
    effect(() => {
      const heroIdToSelect = this.gameService().heroToViewInTeam();
      if (typeof heroIdToSelect === 'number') {
        // Check if this hero is actually in the list to avoid errors
        if (this.fusibleHeroes().some(h => h.id === heroIdToSelect)) {
          this.selectedHeroId.set(heroIdToSelect);
        }
        // Reset the signal in the service so it doesn't trigger again
        this.gameService().heroToViewInTeam.set(undefined);
      }
    });
  }

  selectHero(heroId: number) {
    this.selectedHeroId.set(heroId);
    this.fusionSuccess.set(false);
  }

  executeFusion() {
    if (!this.canFuse() || !this.selectedHeroId()) return;

    this.isFusing.set(true);

    setTimeout(() => {
        const success = this.gameService().fuseHero(this.selectedHeroId()!);
        if(success) {
            this.fusionSuccess.set(true);
        }
        this.isFusing.set(false);
        setTimeout(() => this.fusionSuccess.set(false), 1500);
    }, 1200); // Animation duration
  }

  // --- UI Helpers ---
  getRarityBorderClass(r: Rarity): string { switch(r){ case 'Mythic': return 'border-red-500'; case 'Legendary': return 'border-yellow-400'; case 'Epic': return 'border-purple-500'; case 'Rare': return 'border-blue-500'; default: return 'border-gray-600'; } }
  getRarityTextColor(r: Rarity): string { switch(r){ case 'Mythic': return 'text-red-500'; case 'Legendary': return 'text-yellow-400'; case 'Epic': return 'text-purple-500'; case 'Rare': return 'text-blue-400'; default: return 'text-gray-400'; } }
  getHeroInitials(n: string): string { const p=n.split(' '); return p.length > 1 ? `${p[0][0]}${p[1][0]}` : n.substring(0,2).toUpperCase(); }
  formatNumber(n: number): string { if(n<1e3)return n.toFixed(0); const s=["","k","M","B","T"],i=Math.floor(Math.log10(n)/3); const sn=(n/1e3**i).toFixed(1); return sn.replace(/\.0$/,'')+s[i]; }
}
