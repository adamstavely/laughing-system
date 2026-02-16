import { Component, inject, input, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import type { Annotation } from '../models/feedback.model';

@Component({
  selector: 'fb-element-highlight',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (position()) {
      <div
        class="fixed pointer-events-none rounded border-2 border-primary bg-primary/15 z-[99999]"
        [style.left.px]="position()!.x"
        [style.top.px]="position()!.y"
        [style.width.px]="position()!.width"
        [style.height.px]="position()!.height"
      >
        <div class="absolute -left-2 -top-2 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {{ index() + 1 }}
        </div>
        @if (annotation().selector) {
          <div class="absolute -bottom-7 left-0 max-w-xs truncate rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow">
            <code>{{ annotation().selector }}</code>
          </div>
        }
      </div>
    }
  `,
})
export class ElementHighlightComponent {
  private readonly doc = inject(DOCUMENT);
  readonly annotation = input.required<Annotation>();
  readonly index = input.required<number>();

  protected readonly position = signal<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  constructor() {
    effect(() => {
      const ann = this.annotation();
      if (!ann.selector) return;

      try {
        const element = this.doc.querySelector(ann.selector);
        if (element) {
          const rect = element.getBoundingClientRect();
          const win = this.doc.defaultView;
          this.position.set({
            x: rect.x + (win?.scrollX ?? 0),
            y: rect.y + (win?.scrollY ?? 0),
            width: rect.width,
            height: rect.height,
          });
        }
      } catch (error) {
        console.warn('Failed to highlight element:', error);
      }
    });
  }
}
