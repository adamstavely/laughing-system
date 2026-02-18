import { Component, input, output, signal, effect, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FeedbackStore } from '../store/feedback.store';
import { StorageService } from '../services/storage.service';
import { ScreenshotService } from '../services/screenshot.service';
import { ContextCaptureService } from '../services/context-capture.service';
import { AnimationPauseService } from '../services/animation-pause.service';
import { SubmissionService } from '../services/submission.service';
import { FeedbackToolbarComponent } from './feedback-toolbar';
import { FeedbackModalComponent } from './feedback-modal';
import { BugReportModalComponent } from './bug-report-modal';
import { FeatureRequestModalComponent } from './feature-request-modal';
import { GeneralFeedbackModalComponent } from './general-feedback-modal';
import { AnnotationOverlayComponent } from './annotation-overlay';
import { InlineFeedbackTooltipComponent } from './inline-feedback-tooltip';
import { ErrorFallbackComponent } from './error-fallback';
import { validateConfig } from '../utils/validation';
import type {
  Annotation,
  FeedbackData,
  ToolbarPosition,
  Theme,
} from '../models/feedback.model';

@Component({
  selector: 'fb-feedback-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FeedbackToolbarComponent,
    FeedbackModalComponent,
    BugReportModalComponent,
    FeatureRequestModalComponent,
    GeneralFeedbackModalComponent,
    AnnotationOverlayComponent,
    InlineFeedbackTooltipComponent,
    ErrorFallbackComponent,
  ],
  providers: [
    FeedbackStore,
    StorageService,
    ScreenshotService,
    ContextCaptureService,
    AnimationPauseService,
    SubmissionService,
  ],
  template: `
    <fb-error-fallback>
      <div class="feedback-component-container">
        <!-- Skip link for keyboard navigation -->
        <a
          href="#feedback-main-content"
          class="sr-only focus:not-sr-only focus:fixed focus:right-2.5 focus:top-2.5 focus:z-[99999] focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:no-underline"
        >
          Skip to main content
        </a>
        <div id="feedback-main-content" tabindex="-1" class="outline-none"></div>

        <fb-toolbar
          [position]="position()"
          (generalFeedbackClick)="handleGeneralFeedbackClick()"
          (bugReportClick)="handleBugReportClick()"
          (featureRequestClick)="handleFeatureRequestClick()"
        />

        @if (store.isModalOpen()) {
          <fb-feedback-modal
            [enableNPS]="enableNPS()"
            [requireCategory]="requireCategory()"
            [onSubmit]="onSubmitFn()"
            [onError]="onErrorFn()"
            [getUserId]="getUserId()"
            [appVersion]="appVersion()"
            [customContext]="customContext()"
            [screenshotQuality]="screenshotQuality()"
            (addAnnotationRequested)="pendingModal.set('feedback')"
          />
        }

        @if (showBugModal()) {
          <fb-bug-report-modal
            [onSubmit]="onSubmitFn()"
            [onError]="onErrorFn()"
            [getUserId]="getUserId()"
            [appVersion]="appVersion()"
            [customContext]="customContext()"
            [screenshotQuality]="screenshotQuality()"
            (closed)="showBugModal.set(false)"
            (addAnnotationRequested)="pendingModal.set('bug')"
          />
        }

        @if (showFeatureModal()) {
          <fb-feature-request-modal
            [onSubmit]="onSubmitFn()"
            [onError]="onErrorFn()"
            [getUserId]="getUserId()"
            [appVersion]="appVersion()"
            [customContext]="customContext()"
            [screenshotQuality]="screenshotQuality()"
            (closed)="showFeatureModal.set(false)"
            (addAnnotationRequested)="pendingModal.set('feature')"
          />
        }

        @if (showGeneralModal()) {
          <fb-general-feedback-modal
            [onSubmit]="onSubmitFn()"
            [onError]="onErrorFn()"
            [getUserId]="getUserId()"
            [appVersion]="appVersion()"
            [customContext]="customContext()"
            [screenshotQuality]="screenshotQuality()"
            (closed)="showGeneralModal.set(false)"
            (addAnnotationRequested)="pendingModal.set('general')"
          />
        }

        @if (enableAnnotations()) {
          <fb-annotation-overlay
            [toolMode]="store.toolMode()"
            [selectorPriority]="selectorPriority()"
            (annotationCreated)="handleAnnotationCreate($event)"
          />
        }

        @if (quickFeedbackAnnotation()) {
          <fb-inline-feedback-tooltip
            [annotation]="quickFeedbackAnnotation()!"
            [position]="tooltipPosition()"
            (closed)="quickFeedbackAnnotation.set(null)"
            (submitted)="handleQuickFeedbackSubmit($event)"
          />
        }
      </div>
    </fb-error-fallback>
  `,
})
export class FeedbackRootComponent implements OnInit {
  private readonly doc = inject(DOCUMENT);
  protected readonly store = inject(FeedbackStore);
  private readonly animationPause = inject(AnimationPauseService);
  private readonly storage = inject(StorageService);

  // Configuration inputs
  readonly enableNPS = input<boolean>(true);
  readonly enableAnnotations = input<boolean>(true);
  readonly requireCategory = input<boolean>(false);
  readonly enableAnimationPause = input<boolean>(true);
  readonly position = input<ToolbarPosition>('bottom-right');
  readonly theme = input<Theme>('dark');
  readonly accentColor = input<string | undefined>();
  readonly appVersion = input<string | undefined>();
  readonly customContext = input<Record<string, unknown> | undefined>();
  readonly getUserId = input<(() => string | null) | undefined>();
  readonly selectorPriority = input<string[] | undefined>();
  readonly screenshotQuality = input<number>(0.8);
  readonly maxAnnotations = input<number>(10);
  readonly debounceMs = input<number>(500);

  // Callback inputs (functions can't be outputs in the traditional sense for consuming apps)
  readonly onSubmitFn = input<((feedback: FeedbackData) => void) | undefined>(undefined);
  readonly onErrorFn = input<((error: Error) => void) | undefined>(undefined);

  // Event outputs
  readonly feedbackSubmitted = output<FeedbackData>();
  readonly errorOccurred = output<Error>();
  readonly annotationCreated = output<Annotation>();

  // Local state
  protected readonly quickFeedbackAnnotation = signal<Annotation | null>(null);
  protected readonly showBugModal = signal(false);
  protected readonly showFeatureModal = signal(false);
  protected readonly showGeneralModal = signal(false);
  protected readonly pendingModal = signal<'bug' | 'feature' | 'general' | 'feedback' | null>(null);

  protected readonly tooltipPosition = () => {
    const ann = this.quickFeedbackAnnotation();
    if (!ann) return { x: 0, y: 0 };
    return {
      x: ann.coordinates.x + ann.coordinates.width / 2,
      y: ann.coordinates.y + ann.coordinates.height / 2,
    };
  };

  constructor() {
    // Theme effect
    effect(() => {
      const t = this.theme();
      this.doc.documentElement.setAttribute('data-theme', t);
    });

    // Accent color effect
    effect(() => {
      const color = this.accentColor();
      if (color) {
        this.doc.documentElement.style.setProperty('--feedback-accent', color);
        this.doc.documentElement.style.setProperty('--feedback-primary', color);
      }
    });

    // Animation pause effect
    effect(() => {
      if (this.enableAnimationPause() && this.store.isAnimationPaused()) {
        this.animationPause.pause();
      } else {
        this.animationPause.resume();
      }
    });

    // Debounce config effect
    effect(() => {
      this.store.setDebounceMs(this.debounceMs());
    });
  }

  ngOnInit(): void {
    // Validate config
    const validation = validateConfig({
      screenshotQuality: this.screenshotQuality(),
      maxAnnotations: this.maxAnnotations(),
      debounceMs: this.debounceMs(),
      selectorPriority: this.selectorPriority(),
      customContext: this.customContext(),
      onSubmit: this.onSubmitFn(),
    });

    if (!validation.valid) {
      console.error('FeedbackComponent configuration errors:', validation.errors);
      const onError = this.onErrorFn();
      if (onError) {
        onError(new Error(validation.errors.join('; ')));
      }
    }

    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('FeedbackComponent configuration warnings:', validation.warnings);
    }
  }

  protected handleGeneralFeedbackClick(): void {
    this.store.setModalOpen(false);
    this.showBugModal.set(false);
    this.showFeatureModal.set(false);
    this.quickFeedbackAnnotation.set(null);
    this.store.setCategory('other');
    this.showGeneralModal.set(true);
  }

  protected handleBugReportClick(): void {
    this.store.setModalOpen(false);
    this.showGeneralModal.set(false);
    this.showFeatureModal.set(false);
    this.quickFeedbackAnnotation.set(null);
    this.store.setCategory('bug');
    this.showBugModal.set(true);
  }

  protected handleFeatureRequestClick(): void {
    this.store.setModalOpen(false);
    this.showBugModal.set(false);
    this.showGeneralModal.set(false);
    this.quickFeedbackAnnotation.set(null);
    this.store.setCategory('feature');
    this.showFeatureModal.set(true);
  }

  protected handleAnnotationCreate(annotation: Annotation): void {
    this.quickFeedbackAnnotation.set(annotation);
    this.annotationCreated.emit(annotation);

    // Close the active modal and track which one was open
    if (this.showBugModal()) {
      this.pendingModal.set('bug');
      this.showBugModal.set(false);
    } else if (this.showFeatureModal()) {
      this.pendingModal.set('feature');
      this.showFeatureModal.set(false);
    } else if (this.showGeneralModal()) {
      this.pendingModal.set('general');
      this.showGeneralModal.set(false);
    }
  }

  protected handleQuickFeedbackSubmit(feedbackText: string): void {
    const ann = this.quickFeedbackAnnotation();
    if (!ann) return;

    const updatedAnnotation: Annotation = {
      ...ann,
      metadata: { ...ann.metadata, feedbackText },
    };

    this.store.addAnnotation(updatedAnnotation);
    this.quickFeedbackAnnotation.set(null);

    // Reopen the pending modal
    const pending = this.pendingModal();
    if (pending) {
      this.store.setToolMode('none');
      switch (pending) {
        case 'bug':
          this.showBugModal.set(true);
          break;
        case 'feature':
          this.showFeatureModal.set(true);
          break;
        case 'general':
          this.showGeneralModal.set(true);
          break;
      }
      this.pendingModal.set(null);
    } else {
      this.store.setToolMode('element');
    }
  }
}
