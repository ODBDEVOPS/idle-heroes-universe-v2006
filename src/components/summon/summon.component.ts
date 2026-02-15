import { Component, ChangeDetectionStrategy, input, signal, computed, output, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { Hero } from '../../models/hero.model';
import { Rarity } from '../../models/equipment.model';
import { TooltipDirective } from '../../directives/tooltip.directive';

type SummonResult = { hero: Omit<Hero, 'currentDps' | 'nextLevelCost' | 'equipment' | 'skillCharge' | 'skillReady' | 'currentXp' | 'xpToNextLevel' | 'offlineXp'>, isNew: boolean, goldBonus: number | null, shardsGained: number | null };

interface SummonParticle {
  id: number;
  width: string;
  height: string;
  backgroundColor: string;
  tx: string;
  ty: string;
}

@Component({
  selector: 'app-summon',
  templateUrl: './summon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class SummonComponent implements OnDestroy {
  gameService = input.required<GameService>();
  heroUnlocked = output<number>();

  isModalOpen = signal(false);
  summonResult = signal<SummonResult[] | null>(null);
  isSummoning = signal<'standard' | 'premium' | null>(null);
  summonParticles = signal<SummonParticle[]>([]);

  standardSummonCost = GameService.STANDARD_SUMMON_COST_GOLD;
  premiumSummonCost = GameService.PREMIUM_SUMMON_COST_PRESTIGE;

  // For Cooldown Timer
  private timerInterval: any;
  private particleClearTimeout: any;
  currentTime = signal(Date.now());

  // Pity System
  PITY_LIMIT_STANDARD = 50;
  PITY_LIMIT_PREMIUM = 20;

  standardPityCount = computed(() => this.gameService().gameState().standardPityCount ?? 0);
  premiumPityCount = computed(() => this.gameService().gameState().premiumPityCount ?? 0);

  constructor() {
    this.timerInterval = setInterval(() => {
      this.currentTime.set(Date.now());
    }, 1000);

    effect(() => {
      const type = this.isSummoning();
      if (type) {
        this.createSummonParticles(type);
      }
    }, { allowSignalWrites: true });
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
    if (this.particleClearTimeout) {
      clearTimeout(this.particleClearTimeout);
    }
  }

  private createSummonParticles(type: 'standard' | 'premium'): void {
    if (this.particleClearTimeout) {
      clearTimeout(this.particleClearTimeout);
    }
    const newParticles: SummonParticle[] = [];
    const count = 15;
    const distance = 150;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 6.28;
      newParticles.push({
        id: Math.random(),
        width: `${(Math.random() * 8) + 4}px`,
        height: `${(Math.random() * 8) + 4}px`,
        backgroundColor: type === 'premium' ? (Math.random() > 0.5 ? '#8b5cf6' : '#22d3ee') : '#d1d5db',
        tx: `${Math.cos(angle) * distance}px`,
        ty: `${Math.sin(angle) * distance}px`,
      });
    }
    
    this.summonParticles.set(newParticles);
    
    // Clear particles after animation
    this.particleClearTimeout = setTimeout(() => {
        this.summonParticles.set([]);
    }, 800);
  }

  standardSummonButtonState = computed(() => {
    const lastClaim = this.gameService().gameState().lastFreeStandardSummonTimestamp ?? 0;
    const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours
    const readyTime = lastClaim + cooldownMs;
    const now = this.currentTime();
    
    if (now >= readyTime) {
      return { state: 'free' as const, cooldownSeconds: 0 };
    }
    
    const canAfford = this.gameService().gameState().gold >= this.standardSummonCost;
    const cooldownSeconds = Math.ceil((readyTime - now) / 1000);

    if (canAfford) {
      return { state: 'payable' as const, cooldownSeconds };
    } else {
      return { state: 'cooldown' as const, cooldownSeconds };
    }
  });

  totalGoldBonus = computed(() => {
    return this.summonResult()?.reduce((sum, result) => sum + (result.goldBonus || 0), 0) || 0;
  });

  totalShardsGained = computed(() => {
    const results = this.summonResult();
    if (!results || results.length <= 1) return [];

    const shardMap: Record<string, { heroName: string, amount: number }> = {};
    for (const result of results) {
        if (result.shardsGained) {
            if (shardMap[result.hero.id]) {
                shardMap[result.hero.id].amount += result.shardsGained;
            } else {
                shardMap[result.hero.id] = { heroName: result.hero.name, amount: result.shardsGained };
            }
        }
    }
    return Object.values(shardMap);
  });

  onStandardSummonClick() {
    const state = this.standardSummonButtonState().state;
    if (state === 'free') {
      this.onFreeSummon();
    } else if (state === 'payable') {
      this.onSummon('standard');
    }
  }

  onFreeSummon() {
    if (this.isSummoning()) return;

    this.isSummoning.set('standard');

    setTimeout(() => {
      const result = this.gameService().freeStandardSummon();
      if (result) {
        this.summonResult.set([result]);
        this.isModalOpen.set(true);
      }
      this.isSummoning.set(null);
    }, 800);
  }

  onSummon(type: 'standard' | 'premium') {
    if (this.isSummoning()) return;

    const canAfford = type === 'standard' 
      ? this.gameService().gameState().gold >= this.standardSummonCost
      : this.gameService().gameState().prestigePoints >= this.premiumSummonCost;

    if (!canAfford) return;

    this.isSummoning.set(type);

    setTimeout(() => {
      const result = this.gameService().summonHero(type);
      if (result) {
        this.summonResult.set([result]);
        this.isModalOpen.set(true);
      }
      this.isSummoning.set(null);
    }, 800); // Duration for the summon animation
  }

  onSummonMultiple(type: 'standard', count: number) {
    if (this.isSummoning()) return;
    const cost = type === 'standard' ? this.standardSummonCost * count : 0; // Only standard supported for now
    if (cost === 0) return;

    const canAfford = this.gameService().gameState().gold >= cost;
    if (!canAfford) return;

    this.isSummoning.set(type);

     setTimeout(() => {
      const results = this.gameService().summonHeroes(type, count);
      if (results && results.length > 0) {
        this.summonResult.set(results);
        this.isModalOpen.set(true);
      }
      this.isSummoning.set(null);
    }, 800);
  }

  closeModal() {
    const results = this.summonResult();
    const isSingleNewHero = results && results.length === 1 && results[0].isNew;
    
    this.isModalOpen.set(false);
    
    if (isSingleNewHero) {
      this.heroUnlocked.emit(results[0].hero.id);
    }
    
    // Delay clearing the result to allow for fade-out animation
    setTimeout(() => this.summonResult.set(null), 200);
  }

  getRarityColor(rarity: Rarity): string {
    switch (rarity) {
      case 'Mythic': return 'border-red-500';
      case 'Legendary': return 'border-yellow-400';
      case 'Epic': return 'border-purple-500';
      case 'Rare': return 'border-blue-500';
      default: return 'border-gray-400';
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
  
  getHeroInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`;
    }
    return name.substring(0, 2).toUpperCase();
  }

  formatNumber(num: number): string {
    if (num < 1000) {
      return num.toString();
    }
    const suffixes = ["", "k", "M", "B", "T"];
    const i = Math.floor(Math.log10(num) / 3);
    const shortNum = (num / Math.pow(1000, i)).toFixed(2);
    return shortNum + suffixes[i];
  }
  
  formatDuration(seconds: number): string {
    if (seconds <= 0) return "00:00:00";
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
}
