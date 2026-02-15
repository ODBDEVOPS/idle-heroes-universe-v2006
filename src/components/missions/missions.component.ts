import { Component, ChangeDetectionStrategy, output, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';
import { ALL_MISSIONS } from '../../data/missions-data';
import { Mission, MissionReward, MissionTier } from '../../models/mission.model';

interface DisplayMission extends Mission {
  isFullyCompleted: boolean;
  currentTier: MissionTier | null;
  progressPercent: number;
  progressValue: number;
  canClaim: boolean;
  totalTiers: number;
}

@Component({
  selector: 'app-missions',
  standalone: true,
  templateUrl: './missions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class MissionsComponent {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  claimNotice = signal<{ missionTitle: string; reward: MissionReward } | null>(null);

  displayMissions = computed<DisplayMission[]>(() => {
    const missionProgress = this.gameService().gameState().missionProgress;
    const allHeroes = this.gameService().heroes();
    const gameState = this.gameService().gameState();

    return ALL_MISSIONS.map(mission => {
      const highestClaimedTier = missionProgress[mission.id] ?? -1;
      const currentTierIndex = highestClaimedTier + 1;
      const currentTier = mission.tiers[currentTierIndex] ?? null;

      if (!currentTier) {
        return { 
          ...mission, 
          isFullyCompleted: true, 
          currentTier: null, 
          progressPercent: 100,
          progressValue: 0,
          canClaim: false,
          totalTiers: mission.tiers.length
        };
      }

      let progressValue = 0;
      switch (mission.stat) {
        case 'stage':
          progressValue = gameState.stage;
          break;
        case 'totalHeroLevels':
          progressValue = allHeroes.reduce((sum, h) => sum + h.level, 0);
          break;
        case 'totalGoldEarned':
          progressValue = gameState.totalGoldEarned;
          break;
        case 'totalPrestiges':
            progressValue = gameState.totalPrestiges;
            break;
      }
      
      const progressPercent = Math.min(100, (progressValue / currentTier.target) * 100);
      const canClaim = progressValue >= currentTier.target;
      
      return {
        ...mission,
        isFullyCompleted: false,
        currentTier,
        progressPercent,
        progressValue,
        canClaim,
        totalTiers: mission.tiers.length
      };
    });
  });

  claimReward(missionId: string) {
    const mission = this.displayMissions().find(m => m.id === missionId);
    if (!mission || !mission.canClaim) return;
    
    const reward = this.gameService().claimMissionReward(missionId);
    if (reward) {
        this.claimNotice.set({ missionTitle: mission.title, reward });
        setTimeout(() => this.claimNotice.set(null), 3000);
    }
  }

  back() {
    this.viewChange.emit('base');
  }

  formatNumber(n: number): string { 
    if(n<1e3)return n.toFixed(0); 
    const s=["","k","M","B","T", "q", "Q"], i=Math.floor(Math.log10(n)/3);
    const sn=(n/Math.pow(1000,i)).toFixed(1); 
    return sn.replace(/\.0$/,'')+s[i];
  }

  getRewardText(reward: MissionReward): string {
    if (reward.gold) return `💰 ${this.formatNumber(reward.gold)}`;
    if (reward.prestigePoints) return `💎 ${this.formatNumber(reward.prestigePoints)}`;
    if (reward.enchantingDust) return `💧 ${this.formatNumber(reward.enchantingDust)}`;
    if (reward.skillTomes) return `📚 ${this.formatNumber(reward.skillTomes)}`;
    return '';
  }
}
