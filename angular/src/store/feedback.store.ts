import { Injectable, signal, computed, effect, inject, Injector } from '@angular/core';
import type { Annotation, FeedbackData, ToolMode } from '../models/feedback.model';
import { StorageService } from '../services/storage.service';
import { calculateNPSSegment } from '../utils/validation';

@Injectable()
export class FeedbackStore {
  private readonly storage = inject(StorageService);
  private readonly injector = inject(Injector);
  private saveTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private debounceMs = 500;

  // Private writable state signals
  private readonly _annotations = signal<Annotation[]>([]);
  private readonly _npsScore = signal<number | null>(null);
  private readonly _feedbackText = signal<string>('');
  private readonly _category = signal<FeedbackData['category']>(undefined);
  private readonly _severity = signal<FeedbackData['severity']>(undefined);
  private readonly _contactPreference = signal<boolean>(false);
  private readonly _isSubmitting = signal<boolean>(false);
  private readonly _currentStep = signal<number>(1);
  private readonly _toolMode = signal<ToolMode>('none');
  private readonly _isAnimationPaused = signal<boolean>(false);
  private readonly _isModalOpen = signal<boolean>(false);
  private readonly _isToolbarExpanded = signal<boolean>(false);

  // Public readonly signals
  readonly annotations = this._annotations.asReadonly();
  readonly npsScore = this._npsScore.asReadonly();
  readonly feedbackText = this._feedbackText.asReadonly();
  readonly category = this._category.asReadonly();
  readonly severity = this._severity.asReadonly();
  readonly contactPreference = this._contactPreference.asReadonly();
  readonly isSubmitting = this._isSubmitting.asReadonly();
  readonly currentStep = this._currentStep.asReadonly();
  readonly toolMode = this._toolMode.asReadonly();
  readonly isAnimationPaused = this._isAnimationPaused.asReadonly();
  readonly isModalOpen = this._isModalOpen.asReadonly();
  readonly isToolbarExpanded = this._isToolbarExpanded.asReadonly();

  // Computed signals
  readonly annotationCount = computed(() => this._annotations().length);
  readonly hasAnnotations = computed(() => this._annotations().length > 0);
  readonly npsSegment = computed(() => calculateNPSSegment(this._npsScore()));

  constructor() {
    this.checkNPSReset();
    this.loadDraft();
    this.setupDraftPersistence();
  }

  setDebounceMs(ms: number): void {
    this.debounceMs = ms;
  }

  // Annotation mutations
  addAnnotation(annotation: Annotation): void {
    this._annotations.update((list) => [...list, annotation]);
  }

  removeAnnotation(id: string): void {
    this._annotations.update((list) => list.filter((a) => a.id !== id));
  }

  updateAnnotation(id: string, updates: Partial<Annotation>): void {
    this._annotations.update((list) =>
      list.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    );
  }

  clearAnnotations(): void {
    this._annotations.set([]);
  }

  // Simple setters
  setNPSScore(score: number | null): void {
    this._npsScore.set(score);
  }

  setFeedbackText(text: string): void {
    this._feedbackText.set(text);
  }

  setCategory(category: FeedbackData['category']): void {
    this._category.set(category);
  }

  setSeverity(severity: FeedbackData['severity']): void {
    this._severity.set(severity);
  }

  setContactPreference(preference: boolean): void {
    this._contactPreference.set(preference);
  }

  setSubmitting(submitting: boolean): void {
    this._isSubmitting.set(submitting);
  }

  setCurrentStep(step: number): void {
    this._currentStep.set(step);
  }

  setToolMode(mode: ToolMode): void {
    this._toolMode.set(mode);
  }

  setAnimationPaused(paused: boolean): void {
    this._isAnimationPaused.set(paused);
  }

  setModalOpen(open: boolean): void {
    this._isModalOpen.set(open);
  }

  setToolbarExpanded(expanded: boolean): void {
    this._isToolbarExpanded.set(expanded);
  }

  // Lifecycle actions
  reset(): void {
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId);
      this.saveTimeoutId = null;
    }
    this._annotations.set([]);
    this._npsScore.set(null);
    this._feedbackText.set('');
    this._category.set(undefined);
    this._severity.set(undefined);
    this._contactPreference.set(false);
    this._isSubmitting.set(false);
    this._currentStep.set(1);
    this._toolMode.set('none');
    this._isAnimationPaused.set(false);
    this._isModalOpen.set(false);
    this._isToolbarExpanded.set(false);
    this.storage.clearDraft();
  }

  clearDraftFeedback(): void {
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId);
      this.saveTimeoutId = null;
    }
    this._feedbackText.set('');
    this._category.set(undefined);
    this._severity.set(undefined);
    this._contactPreference.set(false);
    this._npsScore.set(null);
    this._annotations.set([]);
    this.storage.clearDraft();
    this.storage.saveDraft({
      feedbackText: '',
      npsScore: null,
      category: undefined,
      severity: undefined,
      annotations: [],
    });
  }

  resetNPS(): void {
    this._npsScore.set(null);
    this.storage.clearLastNPSSubmission();
  }

  private checkNPSReset(): void {
    if (this.storage.shouldResetNPS() && this._npsScore() !== null) {
      this._npsScore.set(null);
    }
  }

  private loadDraft(): void {
    const draft = this.storage.loadDraft();
    if (draft.feedbackText) this._feedbackText.set(draft.feedbackText);
    if (draft.npsScore !== undefined && draft.npsScore !== null) this._npsScore.set(draft.npsScore);
    if (draft.category) this._category.set(draft.category as FeedbackData['category']);
    if (draft.severity) this._severity.set(draft.severity as FeedbackData['severity']);
    if (draft.annotations && draft.annotations.length > 0) {
      this._annotations.set(draft.annotations as Annotation[]);
    }
  }

  private setupDraftPersistence(): void {
    effect(
      (onCleanup) => {
        const text = this._feedbackText();
        const score = this._npsScore();
        const cat = this._category();
        const sev = this._severity();
        const anns = this._annotations();

        if (this.saveTimeoutId) clearTimeout(this.saveTimeoutId);

        this.saveTimeoutId = setTimeout(() => {
          if (text || score !== null || anns.length > 0) {
            this.storage.saveDraft({
              feedbackText: text,
              npsScore: score,
              category: cat,
              severity: sev,
              annotations: anns,
            });
          }
        }, this.debounceMs);

        onCleanup(() => {
          if (this.saveTimeoutId) {
            clearTimeout(this.saveTimeoutId);
          }
        });
      },
      { injector: this.injector },
    );
  }
}
