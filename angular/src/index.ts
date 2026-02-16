/**
 * Angular Feedback Component - Public API
 *
 * Usage:
 *   import { FeedbackRootComponent, FeedbackStore } from './angular/src';
 *
 *   @Component({
 *     imports: [FeedbackRootComponent],
 *     template: `
 *       <fb-feedback-root
 *         [onSubmitFn]="handleSubmit"
 *         [enableNPS]="true"
 *         [enableAnnotations]="true"
 *         position="bottom-right"
 *         theme="dark"
 *       />
 *     `
 *   })
 */

// Root component
export { FeedbackRootComponent } from './components/feedback-root';

// Store (for advanced usage / external access to state)
export { FeedbackStore } from './store/feedback.store';

// Models
export type {
  Annotation,
  FeedbackData,
  FeedbackState,
  ToolMode,
  ToolbarPosition,
  Theme,
  ScreenshotOptions,
  DraftData,
  ContextData,
  ValidationResult,
} from './models/feedback.model';
export type { SubmissionOptions, SubmissionResult } from './models/submission.model';

// Services (for advanced usage / DI overrides)
export { StorageService } from './services/storage.service';
export { ScreenshotService } from './services/screenshot.service';
export { ContextCaptureService } from './services/context-capture.service';
export { AnimationPauseService } from './services/animation-pause.service';
export { AnnotationService } from './services/annotation.service';
export { SubmissionService } from './services/submission.service';

// Utilities (pure functions for external use)
export { calculateNPSSegment, validateFeedbackText, validateNPSScore } from './utils/validation';
export { generateSelector, validateSelector } from './utils/selector';

// Sub-components (for customization / composition)
export { FeedbackToolbarComponent } from './components/feedback-toolbar';
export { BaseModalComponent } from './components/base-modal';
export { AnnotationOverlayComponent } from './components/annotation-overlay';
export { AnnotationListComponent } from './components/annotation-list';
export { NpsRatingComponent } from './components/nps-rating';
export { ControlledTextareaComponent } from './components/controlled-textarea';
export { CategorySelectorComponent } from './components/category-selector';
export { InlineFeedbackTooltipComponent } from './components/inline-feedback-tooltip';
export { ErrorFallbackComponent } from './components/error-fallback';

// Directives
export { SmartSelectorDirective } from './directives/smart-selector.directive';
export { KeyboardShortcutDirective } from './directives/keyboard-shortcut.directive';

// Pipes
export { TruncatePipe } from './pipes/truncate.pipe';
