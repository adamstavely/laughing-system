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

  // Core state signals
  readonly annotations = signal<Annotation[]>([]);
  readonly npsScore = signal<number | null>(null);
  readonly feedbackText = signal<string>('');
  readonly category = signal<FeedbackData['category']>(undefined);
  readonly severity = signal<FeedbackData['severity']>(undefined);
  readonly contactPreference = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly currentStep = signal<number>(1);
  readonly toolMode = signal<ToolMode>('none');
  readonly isAnimationPaused = signal<boolean>(false);
  readonly isModalOpen = signal<boolean>(false);
  readonly isToolbarExpanded = signal<boolean>(false);

  // Computed signals
  readonly annotationCount = computed(() => this.annotations().length);
  readonly hasAnnotations = computed(() => this.annotations().length > 0);
  readonly npsSegment = computed(() => calculateNPSSegment(this.npsScore()));

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
    this.annotations.update((list) => [...list, annotation]);
  }

  removeAnnotation(id: string): void {
    this.annotations.update((list) => list.filter((a) => a.id !== id));
  }

  updateAnnotation(id: string, updates: Partial<Annotation>): void {
    this.annotations.update((list) =>
      list.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    );
  }

  clearAnnotations(): void {
    this.annotations.set([]);
  }

  // Simple setters
  setNPSScore(score: number | null): void {
    this.npsScore.set(score);
  }

  setFeedbackText(text: string): void {
    this.feedbackText.set(text);
  }

  setCategory(category: FeedbackData['category']): void {
    this.category.set(category);
  }

  setSeverity(severity: FeedbackData['severity']): void {
    this.severity.set(severity);
  }

  setContactPreference(preference: boolean): void {
    this.contactPreference.set(preference);
  }

  setSubmitting(submitting: boolean): void {
    this.isSubmitting.set(submitting);
  }

  setCurrentStep(step: number): void {
    this.currentStep.set(step);
  }

  setToolMode(mode: ToolMode): void {
    this.toolMode.set(mode);
  }

  setAnimationPaused(paused: boolean): void {
    this.isAnimationPaused.set(paused);
  }

  setModalOpen(open: boolean): void {
    this.isModalOpen.set(open);
  }

  setToolbarExpanded(expanded: boolean): void {
    this.isToolbarExpanded.set(expanded);
  }

  // Lifecycle actions
  reset(): void {
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId);
      this.saveTimeoutId = null;
    }
    this.annotations.set([]);
    this.npsScore.set(null);
    this.feedbackText.set('');
    this.category.set(undefined);
    this.severity.set(undefined);
    this.contactPreference.set(false);
    this.isSubmitting.set(false);
    this.currentStep.set(1);
    this.toolMode.set('none');
    this.isAnimationPaused.set(false);
    this.isModalOpen.set(false);
    this.isToolbarExpanded.set(false);
    this.storage.clearDraft();
  }

  clearDraftFeedback(): void {
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId);
      this.saveTimeoutId = null;
    }
    this.feedbackText.set('');
    this.category.set(undefined);
    this.severity.set(undefined);
    this.contactPreference.set(false);
    this.npsScore.set(null);
    this.annotations.set([]);
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
    this.npsScore.set(null);
    this.storage.clearLastNPSSubmission();
  }

  private checkNPSReset(): void {
    if (this.storage.shouldResetNPS() && this.npsScore() !== null) {
      this.npsScore.set(null);
    }
  }

  private loadDraft(): void {
    const draft = this.storage.loadDraft();
    if (draft.feedbackText) this.feedbackText.set(draft.feedbackText);
    if (draft.npsScore !== undefined && draft.npsScore !== null) this.npsScore.set(draft.npsScore);
    if (draft.category) this.category.set(draft.category as FeedbackData['category']);
    if (draft.severity) this.severity.set(draft.severity as FeedbackData['severity']);
    if (draft.annotations && draft.annotations.length > 0) {
      this.annotations.set(draft.annotations as Annotation[]);
    }
  }

  private setupDraftPersistence(): void {
    effect(
      () => {
        const text = this.feedbackText();
        const score = this.npsScore();
        const cat = this.category();
        const sev = this.severity();
        const anns = this.annotations();

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
      },
      { injector: this.injector },
    );
  }
}
