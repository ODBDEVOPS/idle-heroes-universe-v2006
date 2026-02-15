import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService, ALL_ARTIFACTS } from '../../services/game.service';
import { Artifact } from '../../models/artifact.model';

@Component({
  selector: 'app-artifacts',
  standalone: true,
  templateUrl: './artifacts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class ArtifactsComponent {
  gameService = input.required<GameService>();

  unlockedCount = computed(() => this.gameService().gameState().artifacts.length);
  totalCount = ALL_ARTIFACTS.length;

  artifactsWithStatus = computed(() => {
    const unlockedIds = this.gameService().gameState().artifacts;
    return ALL_ARTIFACTS.map(artifact => {
      let unlockHint = '';
      switch (artifact.id) {
        case 1: unlockHint = 'Reward for clearing Floor 10 of the Tower.'; break;
        case 2: unlockHint = 'Reward for clearing Floor 20 of the Tower.'; break;
        case 3: unlockHint = 'Reward for clearing Floor 30 of the Tower.'; break;
        case 4: unlockHint = 'Reward for clearing Floor 40 of the Tower.'; break;
        case 5: unlockHint = 'Reward for clearing Floor 50 of the Tower.'; break;
        default: unlockHint = 'Found within the Tower of Trials.'; break;
      }
      return {
        ...artifact,
        unlocked: unlockedIds.includes(artifact.id),
        unlockHint: unlockHint,
      };
    });
  });

  formatBonus(artifact: Artifact): string {
    const value = artifact.bonusValue * 100;
    return `+${value.toFixed(0)}%`;
  }

  getArtifactIcon(id: number): string {
    switch (id) {
      case 1: // Orb of Power
        return 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';
      case 2: // Amulet of Midas
        return 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z';
      case 3: // Gauntlets of Haste
        return 'M13 2L3 14h9l-1 8 10-12h-9l1-8z';
      case 4: // Tome of Focus
        return 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }
}
