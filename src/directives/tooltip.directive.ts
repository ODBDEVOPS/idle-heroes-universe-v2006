import { Directive, ElementRef, OnDestroy, ComponentRef, ViewContainerRef, input, Renderer2, HostListener } from '@angular/core';
import { TooltipComponent } from '../components/tooltip/tooltip.component';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  appTooltip = input.required<string>();

  private componentRef: ComponentRef<TooltipComponent> | null = null;

  constructor(
    private elementRef: ElementRef,
    private viewContainerRef: ViewContainerRef,
    private renderer: Renderer2
  ) {}

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.componentRef || !this.appTooltip()) {
      return;
    }
    
    this.componentRef = this.viewContainerRef.createComponent(TooltipComponent);
    this.componentRef.setInput('text', this.appTooltip());

    const tooltipElement = this.componentRef.location.nativeElement;
    this.renderer.appendChild(document.body, tooltipElement);
    this.positionTooltip();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.destroyTooltip();
  }

  ngOnDestroy(): void {
    this.destroyTooltip();
  }

  private positionTooltip(): void {
    if (!this.componentRef) return;
    
    const hostPos = this.elementRef.nativeElement.getBoundingClientRect();
    const tooltipElement = this.componentRef.location.nativeElement;
    
    // Position needs to be calculated after the tooltip has rendered and has a size
    // We can use a small timeout to let the browser render it
    setTimeout(() => {
        if (!this.componentRef) return;
        const tooltipPos = tooltipElement.getBoundingClientRect();
        
        // Default position is top-center
        let top = hostPos.top - tooltipPos.height - 8; // 8px offset
        let left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;

        // Adjust if it goes off-screen vertically
        if (top < 0) {
          top = hostPos.bottom + 8; // Move below
        }

        // Adjust if it goes off-screen horizontally
        if (left < 5) {
          left = 5; // Margin from left edge
        }
        if (left + tooltipPos.width > window.innerWidth) {
          left = window.innerWidth - tooltipPos.width - 5; // Margin from right edge
        }

        this.renderer.setStyle(tooltipElement, 'position', 'fixed');
        this.renderer.setStyle(tooltipElement, 'top', `${top}px`);
        this.renderer.setStyle(tooltipElement, 'left', `${left}px`);
        this.renderer.setStyle(tooltipElement, 'z-index', '9999');
    });
  }

  private destroyTooltip(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
  }
}