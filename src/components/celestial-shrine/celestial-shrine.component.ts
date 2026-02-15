import { Component, ChangeDetectionStrategy, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService, ALL_BLESSINGS } from '../../services/game.service';
import { BlessingType } from '../../models/celestial-shrine.model';
import { TooltipDirective } from '../../directives/tooltip.directive';

@Component({
  selector: 'app-celestial-shrine',
  templateUrl: './celestial-shrine.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TooltipDirective],
})
export class CelestialShrineComponent {
  gameService = input.required<GameService>();
  allBlessings = ALL_BLESSINGS;
  
  // This signal is used to keep the cooldown timers reactive in the template
  currentTime = signal(Date.now());

  constructor() {
    effect((onCleanup) => {
        const interval = setInterval(() => {
            this.currentTime.set(Date.now());
        }, 1000);
        onCleanup(() => clearInterval(interval));
    });
  }

  getBlessingStatus(type: BlessingType) {
      const now = this.currentTime();
      const active = this.gameService().gameState().activeBlessings.find(b => b.type === type);
      if (active && active.endTime > now) {
          return { status: 'active', remainingSeconds: Math.ceil((active.endTime - now) / 1000) };
      }
      const cooldown = this.gameService().gameState().blessingCooldowns.find(b => b.type === type);
      if (cooldown && cooldown.readyTime > now) {
          return { status: 'cooldown', remainingSeconds: Math.ceil((cooldown.readyTime - now) / 1000) };
      }
      return { status: 'ready', remainingSeconds: 0 };
  }
  
  activate(type: BlessingType) {
      this.gameService().activateBlessing(type);
  }

  formatDuration(seconds: number): string {
    if (seconds <= 0) return "00:00:00";
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
}