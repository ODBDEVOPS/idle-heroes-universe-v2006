import { Component, ChangeDetectionStrategy, output, input, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';
import { Hero } from '../../models/hero.model';
import { Rarity } from '../../models/equipment.model';
import { TooltipDirective } from '../../directives/tooltip.directive';

@Component({
  selector: 'app-skill-training',
  standalone: true,
  templateUrl: './skill-training.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class SkillTrainingComponent implements OnInit {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  selectedHeroId = signal<number | null>(null);
  isUpgrading = signal(false);
  upgradeSuccess = signal(false);

  constructor() {
    effect(() => {
      const heroIdToSelect = this.gameService().heroToViewInTeam();
      if (typeof heroIdToSelect === 'number') {
        if (this.trainingHeroes().some(h => h.id === heroIdToSelect)) {
          this.selectedHeroId.set(heroIdToSelect);
        }
        this.gameService().heroToViewInTeam.set(undefined);
      }
    });
  }

  ngOnInit() {
    const heroes = this.trainingHeroes();
    if (heroes.length > 0 && !this.selectedHeroId()) {
      this.selectedHeroId.set(heroes[0].id);
    }
  }

  trainingHeroes = computed(() => {
    return this.gameService().heroes()
      .filter(h => h.level > 0)
      .sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return b.level - a.level;
      });
  });

  selectedHero = computed(() => {
    const id = this.selectedHeroId();
    if (!id) return null;
    return this.trainingHeroes().find(h => h.id === id) ?? null;
  });

  upgradeCost = computed(() => {
    const hero = this.selectedHero();
    if (!hero) return null;
    return this.gameService().getHeroSkillUpgradeCost(hero);
  });

  canUpgrade = computed(() => {
    const cost = this.upgradeCost();
    if (!cost) return false;
    return this.gameService().gameState().skillTomes >= cost.tomes;
  });
  
  skillMultiplier = computed(() => {
    const hero = this.selectedHero();
    if (!hero) return { current: 0, next: 0 };
    const current = 5 + (hero.skillLevel - 1) * 0.5;
    const next = 5 + hero.skillLevel * 0.5;
    return { current, next };
  });

  selectHero(heroId: number) {
    this.selectedHeroId.set(heroId);
    this.upgradeSuccess.set(false);
  }

  upgradeSkill() {
    const heroId = this.selectedHeroId();
    if (!this.canUpgrade() || !heroId || this.isUpgrading()) return;

    this.isUpgrading.set(true);

    // Short delay to show "upgrading" state
    setTimeout(() => {
      const success = this.gameService().upgradeHeroSkill(heroId);
      if (success) {
        this.upgradeSuccess.set(true);
        setTimeout(() => this.upgradeSuccess.set(false), 1500);
      }
      this.isUpgrading.set(false);
    }, 500);
  }

  // UI Helpers
  getHeroInitials(n: string): string { const p=n.split(' '); return p.length > 1 ? `${p[0][0]}${p[1][0]}` : n.substring(0,2).toUpperCase(); }
  getRarityBorderClass(r: Rarity): string { switch(r){ case 'Mythic': return 'border-red-500'; case 'Legendary': return 'border-yellow-400'; case 'Epic': return 'border-purple-500'; case 'Rare': return 'border-blue-500'; default: return 'border-gray-600'; } }
  getRarityTextColor(r: Rarity): string { switch(r){ case 'Mythic': return 'text-red-500'; case 'Legendary': return 'text-yellow-400'; case 'Epic': return 'text-purple-500'; case 'Rare': return 'text-blue-400'; default: return 'text-gray-400'; } }
  formatNumber(n: number): string { if(n<1e3)return n.toFixed(0); const s=["","k","M","B","T"],i=Math.floor(Math.log10(n)/3); const sn=(n/1e3**i).toFixed(1); return sn.replace(/\.0$/,'')+s[i]; }
}
