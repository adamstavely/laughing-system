import { Component, inject, input, output, effect, computed, ChangeDetectionStrategy } from '@angular/core';
import { FeedbackStore } from '../store/feedback.store';
import { SubmissionService } from '../services/submission.service';
import { StorageService } from '../services/storage.service';
import { BaseModalComponent } from './base-modal';
import { AnnotationListComponent } from './annotation-list';
import { NpsRatingComponent } from './nps-rating';
import type { FeedbackData } from '../models/feedback.model';
import { LucideAngularModule, MessageSquare } from 'lucide-angular';

const TOTAL_STEPS = 3;

@Component({
  selector: 'fb-feedback-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BaseModalComponent,
    AnnotationListComponent,
    NpsRatingComponent,
    LucideAngularModule,
  ],
  template: `
    <fb-base-modal
      [isOpen]="store.isModalOpen()"
      title="Share Your Feedback"
      ariaLabelledBy="feedback-modal-title"
      (closed)="handleClose()"
    >
      <lucide-icon modalIcon name="message-square" [size]="20" class="text-primary" />

      <!-- Step indicator + progress -->
      <div class="mb-4">
        <div class="mb-2 text-xs text-muted-foreground">
          Step {{ store.currentStep() }} of {{ totalSteps }}
        </div>
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            class="h-full rounded-full bg-primary transition-all"
            [style.width.%]="progress()"
          ></div>
        </div>
      </div>

      <!-- Step content -->
      @switch (store.currentStep()) {
        @case (1) {
          <div class="space-y-4">
            <div>
              <h3 class="text-sm font-semibold text-foreground">Review Annotations</h3>
              <p class="mt-1 text-xs text-muted-foreground">
                Review and edit your annotations. At least one annotation is required.
              </p>
            </div>
            @if (submission.isGeneratingScreenshots()) {
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <div class="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"></div>
                <p>Generating screenshots...</p>
              </div>
            }
            <fb-annotation-list />
            <button
              class="inline-flex items-center rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              (click)="handleAddAnnotation()"
              type="button"
            >
              + Add Another Annotation
            </button>
          </div>
        }
        @case (2) {
          <div class="space-y-4">
            <div>
              <h3 class="text-sm font-semibold text-foreground">How satisfied are you with this application?</h3>
              <p class="mt-1 text-xs text-muted-foreground">
                Your feedback has been submitted! This step is optional.
              </p>
            </div>
            <fb-nps-rating
              (next)="handleNPSNext()"
              (skip)="store.setCurrentStep(3)"
            />
          </div>
        }
        @case (3) {
          <div class="flex flex-col items-center py-8 text-center">
            <div class="mb-4 flex size-12 items-center justify-center rounded-full bg-green-500/20 text-green-500 text-2xl">
              &#10003;
            </div>
            <h3 class="text-lg font-semibold text-foreground">Thank you for your feedback!</h3>
            <p class="mt-1 text-sm text-muted-foreground">Your feedback has been submitted successfully.</p>
            <button
              class="mt-4 inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
              (click)="handleSubmitAnother()"
              type="button"
            >
              Submit Another
            </button>
          </div>
        }
      }

      <!-- Errors -->
      @if (submission.errors().length > 0) {
        <div class="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3" role="alert" aria-live="assertive">
          @for (error of submission.errors(); track error) {
            <div class="text-sm text-destructive">{{ error }}</div>
          }
        </div>
      }

      <!-- Footer -->
      <div modalFooter>
        @switch (store.currentStep()) {
          @case (1) {
            <div class="flex-1"></div>
            <button
              class="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              (click)="handleSubmitStep()"
              type="button"
              [disabled]="submission.isSubmitting() || store.annotations().length === 0"
            >
              {{ submission.isSubmitting() ? 'Submitting...' : 'Submit' }}
            </button>
          }
          @case (2) {
            <div class="flex-1"></div>
            <button
              class="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              (click)="store.setCurrentStep(3)"
              type="button"
            >
              Continue
            </button>
          }
          @case (3) {
            <div class="flex-1"></div>
            <button
              class="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              (click)="handleFinalClose()"
              type="button"
            >
              Close
            </button>
          }
        }
      </div>
    </fb-base-modal>
  `,
})
export class FeedbackModalComponent {
  protected readonly store = inject(FeedbackStore);
  protected readonly submission = inject(SubmissionService);
  private readonly storage = inject(StorageService);

  readonly enableNPS = input<boolean>(true);
  readonly requireCategory = input<boolean>(false);
  readonly onSubmit = input<((feedback: FeedbackData) => void) | undefined>();
  readonly onError = input<((error: Error) => void) | undefined>();
  readonly getUserId = input<(() => string | null) | undefined>();
  readonly appVersion = input<string | undefined>();
  readonly customContext = input<Record<string, unknown> | undefined>();
  readonly screenshotQuality = input<number>(0.8);
  readonly addAnnotationRequested = output<void>();

  protected readonly totalSteps = TOTAL_STEPS;
  protected readonly progress = computed(
    () => (this.store.currentStep() / TOTAL_STEPS) * 100,
  );

  constructor() {
    effect(() => {
      if (this.submission.isSuccess()) {
        if (this.enableNPS()) {
          this.store.setCurrentStep(2);
        } else {
          this.store.setCurrentStep(3);
        }
      }
    });
  }

  protected handleClose(): void {
    this.store.setModalOpen(false);
    this.store.setCurrentStep(1);
    this.submission.setErrors([]);
    this.submission.setIsSuccess(false);
  }

  protected async handleSubmitStep(): Promise<void> {
    if (this.store.annotations().length === 0) {
      this.submission.setErrors(['Please add at least one annotation']);
      return;
    }

    await this.submission.submit({
      category: this.store.category(),
      severity: this.store.severity(),
      npsScore: this.store.npsScore() ?? 0,
      npsSegment: this.store.npsSegment() ?? 'detractor',
      getUserId: this.getUserId(),
      appVersion: this.appVersion(),
      customContext: this.customContext(),
      screenshotQuality: this.screenshotQuality(),
      onSubmit: this.onSubmit(),
      onError: this.onError(),
    });
  }

  protected handleNPSNext(): void {
    if (this.store.npsScore() !== null) {
      this.storage.saveLastNPSSubmission();
    }
    this.store.setCurrentStep(3);
  }

  protected handleAddAnnotation(): void {
    this.store.setModalOpen(false);
    this.store.setToolbarExpanded(true);
    this.store.setToolMode('element');
    this.addAnnotationRequested.emit();
  }

  protected handleSubmitAnother(): void {
    this.store.reset();
    this.submission.setIsSuccess(false);
    this.submission.setErrors([]);
    this.store.setModalOpen(false);
    this.store.setToolbarExpanded(true);
    this.store.setToolMode('element');
  }

  protected handleFinalClose(): void {
    this.store.reset();
    this.submission.setIsSuccess(false);
    this.submission.setErrors([]);
    this.store.setModalOpen(false);
  }
}
