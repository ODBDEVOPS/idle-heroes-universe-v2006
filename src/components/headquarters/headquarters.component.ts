import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService, GlobalUpgrade, ALL_HEADQUARTERS_UPGRADES } from '../../services/game.service';
import { TooltipDirective } from '../../directives/tooltip.directive';

@Component({
  selector: 'app-headquarters',
  standalone: true,
  templateUrl: './headquarters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class HeadquartersComponent {
  gameService = inject(GameService);
  purchaseFeedback = signal<string | null>(null);

  private upgradesWithState = computed(() => {
    const ownedUpgrades = this.gameService.gameState().headquartersUpgrades;
    const gold = this.gameService.gameState().gold;
    
    return ALL_HEADQUARTERS_UPGRADES.map(upgrade => {
      const level = ownedUpgrades[upgrade.id] || 0;
      const cost = this.gameService.getHeadquartersUpgradeCost(upgrade);
      const currentBonus = level * upgrade.baseBonus;
      const nextBonus = (level + 1) * upgrade.baseBonus;
      const canAfford = gold >= cost;
      
      return { ...upgrade, level, cost, canAfford, currentBonus, nextBonus };
    });
  });

  warCouncilUpgrades = computed(() => this.upgradesWithState().filter(u => u.department === 'War Council'));
  treasuryUpgrades = computed(() => this.upgradesWithState().filter(u => u.department === 'Treasury'));
  trainingGroundsUpgrades = computed(() => this.upgradesWithState().filter(u => u.department === 'Training Grounds'));

  purchase(upgradeId: string) {
    if (this.gameService.purchaseHeadquartersUpgrade(upgradeId)) {
      this.purchaseFeedback.set(upgradeId);
      setTimeout(() => this.purchaseFeedback.set(null), 400);
    }
  }

  formatNumber(num: number): string {
    if (num < 1000) return num.toFixed(0);
    const suffixes = ["", "k", "M", "B", "T", "q", "Q"];
    const i = Math.floor(Math.log10(num) / 3);
    const shortNum = (num / Math.pow(1000, i));
    return (shortNum < 10 ? shortNum.toFixed(1) : shortNum.toFixed(0)) + suffixes[i];
  }

  formatBonus(value: number, format: 'percent'): string {
    if (format === 'percent') {
      return `${(value * 100).toFixed(1)}%`;
    }
    return this.formatNumber(value);
  }
}
