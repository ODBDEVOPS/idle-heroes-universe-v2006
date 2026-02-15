import { Component, ChangeDetectionStrategy, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-reliques',
  standalone: true,
  templateUrl: './reliques.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class ReliquesComponent {
  viewChange = output<View>();
  gameService = input.required<GameService>();

  backToBase() {
    this.viewChange.emit('base');
  }
}
