import { Component, ChangeDetectionStrategy, input, computed, signal, effect, OnDestroy, untracked, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { Rarity } from '../../models/equipment.model';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { View } from '../../app.component';

@Component({
  selector: 'app-dimensional-rift',
  standalone: true,
  templateUrl: './dimensional-rift.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class DimensionalRiftComponent implements OnDestroy {
  gameService = input.required<GameService>();
  viewChange = output<View>();

  activatingSkillHeroId = signal<number | null>(null);
  healthBarHit = signal(false);
  dpsChanged = signal(false);

  enemyHpPercentage = computed(() => {
    const enemy = this.gameService().currentRiftEnemy();
    if (!enemy || enemy.maxHp === 0) return 0;
    return (enemy.currentHp / enemy.maxHp) * 100;
  });

  delayedEnemyHpPercentage = signal(100);
  private hpUpdateTimeout: any;

  constructor() {
    // Effect to handle the delayed health bar
    effect(() => {
        const currentPercentage = this.enemyHpPercentage();
        if (untracked(this.delayedEnemyHpPercentage) > currentPercentage) {
             if (this.hpUpdateTimeout) clearTimeout(this.hpUpdateTimeout);
             this.hpUpdateTimeout = setTimeout(() => {
                this.delayedEnemyHpPercentage.set(currentPercentage);
            }, 300);
        } else {
             if (this.hpUpdateTimeout) clearTimeout(this.hpUpdateTimeout);
             this.delayedEnemyHpPercentage.set(currentPercentage);
        }
    }, { allowSignalWrites: true });

     // Effect for health bar hit flash
    effect(() => {
        if (this.gameService().damageFlashes().length > 0) {
            if (!untracked(this.healthBarHit)) {
                this.healthBarHit.set(true);
                setTimeout(() => this.healthBarHit.set(false), 200);
            }
        }
    }, { allowSignalWrites: true });

    // Effect for DPS change pulse
    effect((onCleanup) => {
        const previousDps = untracked(() => this.gameService().totalDps());
        const currentDps = this.gameService().totalDps();

        if (currentDps !== previousDps && previousDps !== 0) {
            this.dpsChanged.set(true);
            const timeoutId = setTimeout(() => this.dpsChanged.set(false), 500);
            onCleanup(() => clearTimeout(timeoutId));
        }
    }, { allowSignalWrites: true });
  }

  ngOnDestroy() {
    if (this.hpUpdateTimeout) {
      clearTimeout(this.hpUpdateTimeout);
    }
    // Ensure we leave the rift if the component is destroyed
    this.gameService().leaveRift();
  }
  
  leaveRift() {
    this.gameService().leaveRift();
    this.viewChange.emit('base');
  }

  onEnemyClick() {
    this.gameService().playerClick();
  }

  activateSkill(heroId: number) {
    this.gameService().activateHeroSkill(heroId);
    this.activatingSkillHeroId.set(heroId);
    setTimeout(() => this.activatingSkillHeroId.set(null), 300);
  }

  formatNumber(num: number): string {
    if (num < 1000) return num.toFixed(0);
    const suffixes = ["", "k", "M", "B", "T"];
    const i = Math.floor(Math.log10(num) / 3);
    const shortNum = (num / Math.pow(1000, i)).toFixed(1);
    return shortNum.replace(/\.0$/, '') + suffixes[i];
  }

  getRarityBorderClass(rarity: Rarity | undefined): string {
    const map: Record<Rarity, string> = { 'Mythic': 'border-red-500', 'Legendary': 'border-yellow-400', 'Epic': 'border-purple-500', 'Rare': 'border-blue-500', 'Common': 'border-gray-500' };
    return rarity ? map[rarity] : map['Common'];
  }

  getRarityBgClass(rarity: Rarity): string {
    switch (rarity) {
        case 'Mythic': return 'bg-gradient-to-br from-red-700 to-gray-800';
        case 'Legendary': return 'bg-gradient-to-br from-yellow-600 to-gray-800';
        case 'Epic': return 'bg-gradient-to-br from-purple-700 to-gray-800';
        case 'Rare': return 'bg-gradient-to-br from-blue-700 to-gray-800';
        default: return 'bg-gradient-to-br from-gray-600 to-gray-800';
    }
  }

  getSkillSlashClass(rarity: Rarity): string {
    const slashClasses: Record<Rarity, string> = {
        'Mythic': 'via-red-400/80',
        'Legendary': 'via-yellow-300/80',
        'Epic': 'via-purple-400/80',
        'Rare': 'via-blue-400/80',
        'Common': 'via-gray-300/80',
    };
    return slashClasses[rarity] || slashClasses['Common'];
  }
}
