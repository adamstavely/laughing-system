import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import type { Annotation } from '../models/feedback.model';

@Component({
  selector: 'fb-area-highlight',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed pointer-events-none rounded border-2 border-dashed border-green-500 bg-green-500/10 z-[99999]"
      [style.left.px]="coords().x"
      [style.top.px]="coords().y"
      [style.width.px]="coords().width"
      [style.height.px]="coords().height"
    >
      <div class="absolute -left-2 -top-2 flex size-5 items-center justify-center rounded-full bg-green-500 text-xs font-semibold text-white">
        {{ index() + 1 }}
      </div>
      <div class="absolute -bottom-7 left-0 max-w-xs truncate rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow">
        Area Selection ({{ dimensions().width }} &times; {{ dimensions().height }}px)
      </div>
    </div>
  `,
})
export class AreaHighlightComponent {
  readonly annotation = input.required<Annotation>();
  readonly index = input.required<number>();

  protected readonly coords = computed(() => this.annotation().coordinates);
  protected readonly dimensions = computed(() => ({
    width: Math.round(this.coords().width),
    height: Math.round(this.coords().height),
  }));
}
