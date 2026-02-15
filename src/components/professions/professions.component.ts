import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';

@Component({
  selector: 'app-professions',
  standalone: true,
  templateUrl: './professions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class ProfessionsComponent {
  viewChange = output<View>();

  navigateTo(view: View) {
    this.viewChange.emit(view);
  }
}