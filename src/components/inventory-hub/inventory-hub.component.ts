import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { View } from '../../app.component';

@Component({
  selector: 'app-inventory-hub',
  templateUrl: './inventory-hub.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class InventoryHubComponent {
  viewChange = output<View>();

  navigateTo(view: View) {
    this.viewChange.emit(view);
  }
}