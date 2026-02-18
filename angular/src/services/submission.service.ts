import { Injectable, inject, signal } from '@angular/core';
import { FeedbackStore } from '../store/feedback.store';
import { ScreenshotService } from './screenshot.service';
import { ContextCaptureService } from './context-capture.service';
import type { FeedbackData, Annotation } from '../models/feedback.model';
import type { SubmissionOptions } from '../models/submission.model';
import { calculateNPSSegment, getErrorMessage } from '../utils/validation';

@Injectable()
export class SubmissionService {
  private readonly store = inject(FeedbackStore);
  private readonly screenshotService = inject(ScreenshotService);
  private readonly contextService = inject(ContextCaptureService);
  private readonly screenshotsGenerated = new Set<string>();

  readonly isSubmitting = signal(false);
  readonly isSuccess = signal(false);
  readonly errors = signal<string[]>([]);
  readonly isGeneratingScreenshots = signal(false);

  setErrors(errors: string[]): void {
    this.errors.set(errors);
  }

  setIsSuccess(value: boolean): void {
    this.isSuccess.set(value);
  }

  async generateAnnotationScreenshots(
    quality: number = 0.8,
  ): Promise<void> {
    const annotations = this.store.annotations();
    const needScreenshots = annotations.filter(
      (a) => !a.screenshot && !this.screenshotsGenerated.has(a.id),
    );

    if (needScreenshots.length === 0) return;

    for (const annotation of needScreenshots) {
      this.screenshotsGenerated.add(annotation.id);
      try {
        const screenshot = await this.screenshotService.generateAnnotationScreenshot(annotation, {
          quality,
          maxWidth: 1200,
        });
        this.store.updateAnnotation(annotation.id, { screenshot });
      } catch (error) {
        console.warn('Failed to generate screenshot for annotation:', error);
        this.screenshotsGenerated.delete(annotation.id);
      }
    }
  }

  async submit(
    options: SubmissionOptions,
    validationFn?: () => string[],
  ): Promise<void> {
    const validationErrors = validationFn ? validationFn() : [];
    if (validationErrors.length > 0) {
      this.errors.set(validationErrors);
      return;
    }

    this.errors.set([]);
    this.isSubmitting.set(true);

    try {
      const annotationsWithScreenshots = await Promise.all(
        this.store.annotations().map(async (annotation: Annotation) => {
          if (annotation.screenshot) return annotation;

          try {
            const screenshot = await this.screenshotService.generateAnnotationScreenshot(
              annotation,
              { quality: options.screenshotQuality ?? 0.8, maxWidth: 1200 },
            );
            return { ...annotation, screenshot };
          } catch (error) {
            console.warn('Failed to generate screenshot:', error);
            return annotation;
          }
        }),
      );

      const context = this.contextService.captureContext(
        options.getUserId,
        options.appVersion,
        options.customContext,
      );

      const npsScore = options.npsScore ?? this.store.npsScore() ?? 0;
      const npsSegment = options.npsSegment ?? calculateNPSSegment(npsScore) ?? 'detractor';

      const completeFeedback: FeedbackData = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: this.contextService.getTimestamp(),
        npsScore,
        npsSegment,
        category: options.category ?? this.store.category(),
        severity: options.severity ?? this.store.severity(),
        feedbackText: this.store.feedbackText() || '',
        annotations: annotationsWithScreenshots,
        context,
        contactPreference: this.store.contactPreference(),
      };

      if (options.onSubmit) {
        await options.onSubmit(completeFeedback);
      }

      this.isSubmitting.set(false);
      this.isSuccess.set(true);
    } catch (error) {
      this.isSubmitting.set(false);
      const err = error instanceof Error ? error : new Error('Submission failed');
      const userFriendlyMessage = getErrorMessage(err);
      options.onError?.(err);
      this.errors.set([`Failed to submit: ${userFriendlyMessage}`]);
    }
  }
}
