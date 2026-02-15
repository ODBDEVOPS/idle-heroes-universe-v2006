import { Component, ChangeDetectionStrategy, output, input, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';
import { Hero } from '../../models/hero.model';
import { Rarity } from '../../models/equipment.model';
import { Specialization, SpecializationPath } from '../../models/specialization.model';
import { TooltipDirective } from '../../directives/tooltip.directive';

interface SpecializationNode {
  spec: Specialization;
  status: 'unlocked' | 'available' | 'locked';
  requirements: string[];
}

@Component({
  selector: 'app-hero-specialization',
  standalone: true,
  templateUrl: './hero-specialization.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class HeroSpecializationComponent implements OnInit {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  selectedHeroId = signal<number | null>(null);
  isPromoting = signal(false);

  constructor() {
    effect(() => {
      const heroIdToSelect = this.gameService().heroToViewInTeam();
      if (typeof heroIdToSelect === 'number') {
        if (this.eligibleHeroes().some(h => h.id === heroIdToSelect)) {
          this.selectedHeroId.set(heroIdToSelect);
        }
        this.gameService().heroToViewInTeam.set(undefined);
      }
    });
  }

  ngOnInit() {
    const heroes = this.eligibleHeroes();
    if (heroes.length > 0 && !this.selectedHeroId()) {
      this.selectedHeroId.set(heroes[0].id);
    }
  }

  eligibleHeroes = computed(() => {
    return this.gameService().heroes()
      .filter(h => h.level > 0 && this.gameService().getSpecializationPathForHero(h.id))
      .sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return b.level - a.level;
      });
  });

  hero = computed(() => {
    const id = this.selectedHeroId();
    if (id === null) return null;
    return this.eligibleHeroes().find(h => h.id === id) ?? null;
  });

  path = computed<SpecializationPath | null>(() => {
    const h = this.hero();
    if (!h) return null;
    return this.gameService().getSpecializationPathForHero(h.id);
  });
  
  heroSpecPath = computed(() => {
    const h = this.hero();
    if (!h) return [];
    return this.gameService().gameState().heroSpecializations[h.id] || [];
  });

  promotion1Nodes = computed<SpecializationNode[]>(() => this.getPromotionNodes(1));
  promotion2Nodes = computed<SpecializationNode[]>(() => this.getPromotionNodes(2));
  
  private getPromotionNodes(tier: 1 | 2): SpecializationNode[] {
    const h = this.hero();
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

  async promote(specializationId: string) {
    const h = this.hero();
    if (!h || this.isPromoting()) return;

    this.isPromoting.set(true);
    await this.gameService().promoteHero(h.id, specializationId);
    this.isPromoting.set(false);
  }

  selectHero(id: number) {
    this.selectedHeroId.set(id);
  }

  back() {
    this.viewChange.emit('heroCommand');
  }

  // UI Helpers
  getHeroInitials(n: string): string { const p=n.split(' '); return p.length > 1 ? `${p[0][0]}${p[1][0]}` : n.substring(0,2).toUpperCase(); }
  getRarityBorderClass(r: Rarity): string { switch(r){ case 'Mythic': return 'border-red-500'; case 'Legendary': return 'border-yellow-400'; case 'Epic': return 'border-purple-500'; case 'Rare': return 'border-blue-500'; default: return 'border-gray-600'; } }
}
