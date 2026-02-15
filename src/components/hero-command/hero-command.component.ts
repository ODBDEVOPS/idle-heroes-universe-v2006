import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';

@Component({
  selector: 'app-hero-command',
  standalone: true,
  templateUrl: './hero-command.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class HeroCommandComponent {
  viewChange = output<View>();

  navigateTo(view: View) {
    this.viewChange.emit(view);
  }
}
