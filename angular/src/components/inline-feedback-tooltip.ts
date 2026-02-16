import {
  Component,
  input,
  output,
  signal,
  effect,
  viewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Annotation } from '../models/feedback.model';

@Component({
  selector: 'fb-inline-feedback-tooltip',
  standalone: true,
  imports: [FormsModule],
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-[99998]"
      (click)="handleCancel()"
      aria-hidden="true"
    ></div>

    <!-- Tooltip -->
    <div
      #tooltipEl
      class="fixed z-[99999] w-72 rounded-lg border border-border bg-popover p-4 shadow-lg"
      [style.left.px]="tooltipPosition().x"
      [style.top.px]="tooltipPosition().y"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inline-feedback-title"
      (click)="$event.stopPropagation()"
    >
      <div class="mb-2">
        <label
          for="inline-feedback-text"
          id="inline-feedback-title"
          class="text-sm font-medium text-popover-foreground"
        >
          What should change?
        </label>
      </div>
      <div>
        <textarea
          #textareaEl
          id="inline-feedback-text"
          class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          [ngModel]="feedback()"
          (ngModelChange)="feedback.set($event)"
          placeholder="Describe what should change..."
          rows="3"
          (keydown.meta.enter)="handleSubmit()"
          (keydown.control.enter)="handleSubmit()"
        ></textarea>
      </div>
      <div class="mt-3 flex items-center justify-end gap-2">
        <button
          class="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          (click)="handleCancel()"
          type="button"
        >
          Cancel
        </button>
        <button
          class="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          (click)="handleSubmit()"
          type="button"
          [disabled]="!feedback().trim()"
        >
          Add
        </button>
      </div>
    </div>
  `,
})
export class InlineFeedbackTooltipComponent implements OnDestroy {
  readonly annotation = input.required<Annotation>();
  readonly position = input.required<{ x: number; y: number }>();
  readonly closed = output<void>();
  readonly submitted = output<string>();

  protected readonly tooltipEl = viewChild<ElementRef<HTMLDivElement>>('tooltipEl');
  protected readonly textareaEl = viewChild<ElementRef<HTMLTextAreaElement>>('textareaEl');

  protected readonly feedback = signal('');
  protected readonly tooltipPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  private keydownHandler = this.handleKeyDown.bind(this);

  constructor() {
    effect(() => {
      const pos = this.position();
      const tooltip = this.tooltipEl()?.nativeElement;

      if (tooltip) {
        const rect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let x = pos.x;
        let y = pos.y - rect.height - 10;

        if (x + rect.width > viewportWidth) x = viewportWidth - rect.width - 10;
        if (x < 10) x = 10;
        if (y < 10) y = pos.y + 10;
        if (y + rect.height > viewportHeight - 10) y = viewportHeight - rect.height - 10;

        this.tooltipPosition.set({ x, y });
      } else {
        this.tooltipPosition.set(pos);
      }

      this.textareaEl()?.nativeElement.focus();
    });

    document.addEventListener('keydown', this.keydownHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.keydownHandler);
  }

  protected handleSubmit(): void {
    if (this.feedback().trim()) {
      this.submitted.emit(this.feedback().trim());
      this.closed.emit();
    }
  }

  protected handleCancel(): void {
    this.closed.emit();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.closed.emit();
    }
  }
}
