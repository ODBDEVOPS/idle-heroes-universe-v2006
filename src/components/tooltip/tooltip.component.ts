import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  templateUrl: './tooltip.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'animate-tooltip-fade-in'
  }
})
export class TooltipComponent {
  text = input.required<string>();
}