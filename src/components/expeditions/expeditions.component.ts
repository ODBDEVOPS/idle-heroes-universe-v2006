import { Component, ChangeDetectionStrategy, input, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService, ALL_EXPEDITIONS } from '../../services/game.service';
import { Expedition, OngoingExpedition, OngoingExpeditionWithDetails, ExpeditionRequirements } from '../../models/expedition.model';
import { Hero, Role } from '../../models/hero.model';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { EquipmentItem, Rarity } from '../../models/equipment.model';

interface RequirementCheck {
  isMet: boolean;
  text: string;
  current: string | number;
  required: string | number;
}

@Component({
  selector: 'app-expeditions',
  templateUrl: './expeditions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class ExpeditionsComponent {
  gameService = input.required<GameService>();

  // Main screen state
  currentTime = signal(Date.now());
  
  // Modal state
  isModalOpen = signal(false);
  expeditionToStart = signal<Expedition | null>(null);
  selectedHeroIds = signal<number[]>([]);

  // Claim notification
  claimResult = signal<{ gold: number, prestige: number, item: EquipmentItem | null } | null>(null);

  constructor() {
    effect((onCleanup) => {
      const interval = setInterval(() => {
        this.currentTime.set(Date.now());
      }, 1000);
      onCleanup(() => clearInterval(interval));
    });
  }

  expeditionSlots = computed(() => ({
    current: this.gameService().gameState().ongoingExpeditions.length,
    max: this.gameService().getExpeditionSlotsEffect()
  }));

  ongoingExpeditions = computed(() => {
    const now = this.currentTime();
    return this.gameService().gameState().ongoingExpeditions.map(oe => {
        const details = ALL_EXPEDITIONS.find(e => e.id === oe.expeditionId)!;
        const heroes = this.gameService().heroes().filter(h => oe.heroIds.includes(h.id));
        return {
            ...oe,
            details,
            remainingSeconds: Math.max(0, Math.floor((oe.completionTime - now) / 1000)),
            heroes
        };
    }).sort((a,b) => a.completionTime - b.completionTime);
  });
  
  heroesOnExpedition = computed(() => {
    return new Set(this.gameService().gameState().ongoingExpeditions.flatMap(oe => oe.heroIds));
  });

  availableExpeditions = computed(() => {
    const ongoingIds = this.gameService().gameState().ongoingExpeditions.map(oe => oe.expeditionId);
    return ALL_EXPEDITIONS.filter(e => !ongoingIds.includes(e.id));
  });

  availableHeroes = computed(() => {
    const busyHeroes = this.heroesOnExpedition();
    return this.gameService().heroes().filter(h => h.level > 0 && !busyHeroes.has(h.id))
      .sort((a,b) => b.level - a.level);
  });
  
  selectedHeroes = computed(() => {
    const ids = new Set(this.selectedHeroIds());
    return this.availableHeroes().filter(h => ids.has(h.id));
  });
  
  requirementChecks = computed((): RequirementCheck[] => {
    const expedition = this.expeditionToStart();
    if (!expedition) return [];
    
    const team = this.selectedHeroes();
    const checks: RequirementCheck[] = [];
    const reqs = expedition.requirements;

    // Min Heroes
    const currentHeroes = team.length;
    const requiredHeroes = reqs.minHeroes;
    checks.push({
      text: `Assign ${requiredHeroes} Heroes`,
      current: currentHeroes,
      required: requiredHeroes,
      isMet: currentHeroes >= requiredHeroes,
    });

    // Min Total Level
    if (reqs.minTotalLevel) {
      const currentLevel = team.reduce((sum, h) => sum + h.level, 0);
      checks.push({
        text: `Total Level ${this.formatNumber(reqs.minTotalLevel)}`,
        current: this.formatNumber(currentLevel),
        required: this.formatNumber(reqs.minTotalLevel),
        isMet: currentLevel >= reqs.minTotalLevel,
      });
    }

    // Role Requirements
    if (reqs.roles) {
      for (const roleReq of reqs.roles) {
        const currentCount = team.filter(h => h.role === roleReq.role).length;
        checks.push({
          text: `Requires ${roleReq.count} ${roleReq.role}`,
          current: currentCount,
          required: roleReq.count,
          isMet: currentCount >= roleReq.count,
        });
      }
    }
    
    return checks;
  });

  canDispatch = computed(() => this.requirementChecks().every(r => r.isMet));

  openModal(expedition: Expedition) {
    this.expeditionToStart.set(expedition);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.expeditionToStart.set(null);
    this.selectedHeroIds.set([]);
  }

  toggleHeroSelection(heroId: number) {
    this.selectedHeroIds.update(ids => {
        const newIds = new Set(ids);
        if (newIds.has(heroId)) {
            newIds.delete(heroId);
        } else {
            newIds.add(heroId);
        }
        return Array.from(newIds);
    });
  }

  dispatchTeam() {
    if (!this.canDispatch() || !this.expeditionToStart()) return;
    const success = this.gameService().startExpedition(this.expeditionToStart()!.id, this.selectedHeroIds());
    if (success) {
        this.closeModal();
    }
  }

  claim(expedition: OngoingExpedition) {
    const result = this.gameService().claimExpedition(expedition);
    this.claimResult.set(result);
    setTimeout(() => this.claimResult.set(null), 3000);
  }

  formatDuration(seconds: number): string {
    if (seconds <= 0) return "00:00:00";
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  formatNumber(num: number): string {
    if (num < 1000) return num.toString();
    const suffixes = ["", "k", "M", "B", "T"];
    const i = Math.floor(Math.log10(num) / 3);
    const shortNum = (num / Math.pow(1000, i)).toFixed(1);
    return shortNum.replace(/\.0$/, '') + suffixes[i];
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
  
  getHeroInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`;
    }
    return name.substring(0, 2).toUpperCase();
  }
}
