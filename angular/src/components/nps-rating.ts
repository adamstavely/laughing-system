import { Component, inject, output, computed } from '@angular/core';
import { FeedbackStore } from '../store/feedback.store';
import { calculateNPSSegment } from '../utils/validation';

@Component({
  selector: 'fb-nps-rating',
  standalone: true,
  template: `
    <div class="space-y-4">
      @if (store.npsScore() !== null) {
        <h3 class="text-center text-lg font-semibold text-foreground">
          Thanks for your feedback!
        </h3>
      } @else {
        <h3 class="text-sm font-medium text-foreground">
          How satisfied are you with this application?
        </h3>

        <div class="flex gap-1" role="radiogroup" aria-label="NPS rating scale">
          @for (i of npsRange; track i) {
            <button
              class="flex size-9 items-center justify-center rounded-md border text-sm font-medium transition-colors"
              [class]="store.npsScore() === i
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground'"
              (click)="store.setNPSScore(i)"
              [attr.aria-label]="'Rate ' + i + ' out of 10'"
              type="button"
              role="radio"
              [attr.aria-checked]="store.npsScore() === i"
            >
              {{ i }}
            </button>
          }
        </div>

        <div class="flex justify-between text-xs text-muted-foreground">
          <span>Not at all likely</span>
          <span>Extremely likely</span>
        </div>
      }

      @if (segment()) {
        <div class="mt-3">
          <p class="text-sm text-muted-foreground">
            @switch (segment()) {
              @case ('detractor') { What frustrated you? }
              @case ('passive') { What would make this better? }
              @case ('promoter') { What do you love most? }
            }
          </p>
        </div>
      }

      <div class="mt-4 flex items-center justify-end gap-2">
        @if (skipEnabled) {
          <button
            class="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            (click)="skip.emit()"
            type="button"
          >
            Skip
          </button>
        }
        @if (store.npsScore() !== null) {
          <button
            class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            (click)="next.emit()"
            type="button"
          >
            Continue
          </button>
        }
      </div>
    </div>
  `,
})
export class NpsRatingComponent {
  protected readonly store = inject(FeedbackStore);
  readonly next = output<void>();
  readonly skip = output<void>();
  readonly skipEnabled = true;

  protected readonly npsRange = Array.from({ length: 11 }, (_, i) => i);
  protected readonly segment = computed(() => calculateNPSSegment(this.store.npsScore()));
}
