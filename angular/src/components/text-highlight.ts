import { Component, input, computed } from '@angular/core';
import { TruncatePipe } from '../pipes/truncate.pipe';
import type { Annotation } from '../models/feedback.model';

@Component({
  selector: 'fb-text-highlight',
  standalone: true,
  imports: [TruncatePipe],
  template: `
    <div
      class="fixed pointer-events-none rounded border-2 border-yellow-500 bg-yellow-500/20 z-[99999]"
      [style.left.px]="coords().x"
      [style.top.px]="coords().y"
      [style.width.px]="coords().width"
      [style.height.px]="coords().height"
    >
      <div class="absolute -left-2 -top-2 flex size-5 items-center justify-center rounded-full bg-yellow-500 text-xs font-semibold text-white">
        {{ index() + 1 }}
      </div>
      @if (annotation().textContent) {
        <div class="absolute -bottom-7 left-0 max-w-xs truncate rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow">
          <span>{{ annotation().textContent | truncate:50 }}</span>
        </div>
      }
    </div>
  `,
})
export class TextHighlightComponent {
  readonly annotation = input.required<Annotation>();
  readonly index = input.required<number>();

  protected readonly coords = computed(() => this.annotation().coordinates);
}
