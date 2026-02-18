import { Component, inject, input, output, effect, signal, ChangeDetectionStrategy } from '@angular/core';
import { FeedbackStore } from '../store/feedback.store';
import { SubmissionService } from '../services/submission.service';
import { BaseModalComponent } from './base-modal';
import { AnnotationListComponent } from './annotation-list';
import { ControlledTextareaComponent } from './controlled-textarea';
import type { FeedbackData } from '../models/feedback.model';
import { LucideAngularModule, Bug } from 'lucide-angular';

@Component({
  selector: 'fb-bug-report-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BaseModalComponent,
    AnnotationListComponent,
    ControlledTextareaComponent,
    LucideAngularModule,
  ],
  template: `
    <fb-base-modal
      [isOpen]="true"
      title="Bug Report"
      ariaLabelledBy="bug-report-title"
      (closed)="handleClose()"
    >
      <lucide-icon modalIcon name="bug" [size]="20" class="text-destructive" />

      @if (submission.isSuccess()) {
        <div class="flex flex-col items-center py-8 text-center">
          <div class="mb-4 flex size-12 items-center justify-center rounded-full bg-green-500/20 text-green-500 text-2xl">
            &#10003;
          </div>
          <h3 class="text-lg font-semibold text-foreground">Thank you for your feedback!</h3>
          <p class="mt-1 text-sm text-muted-foreground">Your bug report has been submitted successfully.</p>
        </div>
      } @else {
        <!-- Severity -->
        <div class="mb-4 space-y-2">
          <label class="text-sm font-medium text-foreground">
            Severity <span class="text-destructive">*</span>
          </label>
          <div class="flex gap-2">
            @for (severity of severities; track severity) {
              <button
                class="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
                [class]="store.severity() === severity
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground'"
                (click)="store.setSeverity(severity)"
                type="button"
              >
                {{ capitalize(severity) }}
              </button>
            }
          </div>
        </div>

        <!-- Annotations -->
        <div class="mb-4 space-y-2">
          <label class="text-sm font-medium text-foreground">
            Annotations <span class="text-destructive">*</span>
          </label>
          <p class="text-xs text-muted-foreground">
            Select elements, text, or areas on the page to highlight the bug
          </p>
          @if (submission.isGeneratingScreenshots()) {
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <div class="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"></div>
              <p>Generating screenshots...</p>
            </div>
          }
          @if (store.annotations().length === 0) {
            <div class="rounded-md border border-dashed border-border p-6 text-center">
              <p class="text-sm text-muted-foreground">No annotations yet.</p>
              <button
                class="mt-2 inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                (click)="handleAddAnnotation()"
                type="button"
              >
                Add Annotation
              </button>
            </div>
          } @else {
            <fb-annotation-list />
            <button
              class="mt-2 inline-flex items-center rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              (click)="handleAddAnnotation()"
              type="button"
            >
              + Add Another Annotation
            </button>
          }
        </div>

        <!-- Details -->
        <div class="mb-4">
          <fb-controlled-textarea
            id="bug-additional-details"
            [value]="feedbackTextValue()"
            (valueChange)="feedbackTextValue.set($event)"
            label="Additional Details (optional)"
            placeholder="Describe the bug in detail, steps to reproduce, expected vs actual behavior..."
            [rows]="4"
            [maxLength]="5000"
          />
        </div>

        <!-- Follow-up -->
        <div class="mb-4">
          <label class="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              class="size-4 rounded border-border"
              [checked]="store.contactPreference()"
              (change)="onCheckboxChange($event)"
            />
            <span>I'm open to follow-up questions about this bug</span>
          </label>
        </div>

        <!-- Errors -->
        @if (submission.errors().length > 0) {
          <div class="rounded-md border border-destructive/30 bg-destructive/10 p-3" role="alert" aria-live="assertive">
            @for (error of submission.errors(); track error) {
              <div class="text-sm text-destructive">{{ error }}</div>
            }
          </div>
        }
      }

      <!-- Footer -->
      <div modalFooter>
        @if (!submission.isSuccess()) {
          <button
            class="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            (click)="handleClose()"
            type="button"
          >
            Cancel
          </button>
          <button
            class="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            (click)="handleSubmit()"
            type="button"
            [disabled]="submission.isSubmitting() || store.annotations().length === 0 || !store.severity()"
          >
            {{ submission.isSubmitting() ? 'Submitting...' : 'Submit Bug Report' }}
          </button>
        }
      </div>
    </fb-base-modal>
  `,
})
export class BugReportModalComponent {
  protected readonly store = inject(FeedbackStore);
  protected readonly submission = inject(SubmissionService);

  readonly onSubmit = input<((feedback: FeedbackData) => void) | undefined>();
  readonly onError = input<((error: Error) => void) | undefined>();
  readonly getUserId = input<(() => string | null) | undefined>();
  readonly appVersion = input<string | undefined>();
  readonly customContext = input<Record<string, unknown> | undefined>();
  readonly screenshotQuality = input<number>(0.8);
  readonly closed = output<void>();
  readonly addAnnotationRequested = output<void>();

  protected readonly severities = ['low', 'medium', 'high', 'critical'] as const;
  protected readonly feedbackTextValue = signal('');

  constructor() {
    this.store.setToolbarExpanded(true);
    this.feedbackTextValue.set(this.store.feedbackText());

    effect((onCleanup) => {
      if (this.submission.isSuccess()) {
        const timer = setTimeout(() => {
          this.store.reset();
          this.closed.emit();
        }, 2000);
        onCleanup(() => clearTimeout(timer));
      }
    });
  }

  protected capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  protected onCheckboxChange(event: Event): void {
    this.store.setContactPreference((event.target as HTMLInputElement).checked);
  }

  protected handleAddAnnotation(): void {
    this.closed.emit();
    this.store.setToolbarExpanded(true);
    this.store.setToolMode('element');
    this.addAnnotationRequested.emit();
  }

  protected handleClose(): void {
    this.store.clearDraftFeedback();
    this.closed.emit();
  }

  protected async handleSubmit(): Promise<void> {
    this.store.setFeedbackText(this.feedbackTextValue());

    const validationErrors: string[] = [];
    if (this.store.annotations().length === 0) {
      validationErrors.push('Please add at least one annotation');
    }
    if (!this.store.severity()) {
      validationErrors.push('Please select a severity level');
    }

    if (validationErrors.length > 0) {
      this.submission.setErrors(validationErrors);
      return;
    }

    await this.submission.submit({
      category: 'bug',
      severity: this.store.severity(),
      npsSegment: 'detractor',
      getUserId: this.getUserId(),
      appVersion: this.appVersion(),
      customContext: this.customContext(),
      screenshotQuality: this.screenshotQuality(),
      onSubmit: this.onSubmit(),
      onError: this.onError(),
    });
  }
}
