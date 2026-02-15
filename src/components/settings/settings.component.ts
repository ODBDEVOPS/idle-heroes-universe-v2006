import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class SettingsComponent {
  gameService = input.required<GameService>();
  
  confirmingReset = signal(false);

  promptHardReset() {
    this.confirmingReset.set(true);
  }

  cancelReset() {
    this.confirmingReset.set(false);
  }

  executeHardReset() {
    this.gameService().hardReset();
  }

  formatNumber(num: number): string {
    if (num < 1000) {
      return num.toFixed(0);
    }
    const suffixes = ["", "k", "M", "B", "T", "q", "Q"];
    const i = Math.floor(Math.log10(num) / 3);
    if (i >= suffixes.length) {
        return num.toExponential(2);
    }
    const shortNum = (num / Math.pow(1000, i));
    return (shortNum < 10 ? shortNum.toFixed(2) : shortNum < 100 ? shortNum.toFixed(1) : shortNum.toFixed(0)) + suffixes[i];
  }
}
