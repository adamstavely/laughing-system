import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FeedbackStore } from '../store/feedback.store';
import { TruncatePipe } from '../pipes/truncate.pipe';

@Component({
  selector: 'fb-annotation-list',
  standalone: true,
  imports: [FormsModule, TruncatePipe],
  template: `
    @if (store.annotations().length === 0) {
      <div class="rounded-md border border-dashed border-border p-6 text-center">
        <p class="text-sm text-muted-foreground">
          No annotations added. Add annotations by selecting elements, text, or areas on the page.
        </p>
      </div>
    } @else {
      <div class="space-y-3">
        @for (annotation of store.annotations(); track annotation.id; let i = $index) {
          <div class="rounded-md border border-border bg-card p-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  #{{ i + 1 }}
                </span>
                <span class="text-xs font-medium uppercase text-muted-foreground">{{ annotation.type }}</span>
              </div>
              <div class="flex items-center gap-1">
                @if (editingId() !== annotation.id) {
                  <button
                    class="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    (click)="startEdit(annotation)"
                    [attr.aria-label]="'Edit annotation ' + (i + 1)"
                    type="button"
                    title="Edit feedback"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  </button>
                }
                <button
                  class="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  (click)="store.removeAnnotation(annotation.id)"
                  [attr.aria-label]="'Remove annotation ' + (i + 1)"
                  type="button"
                  title="Remove annotation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            @if (annotation.selector) {
              <div class="mt-2 overflow-hidden rounded bg-muted px-2 py-1">
                <code class="text-xs text-muted-foreground">{{ annotation.selector }}</code>
              </div>
            }

            @if (annotation.textContent) {
              <div class="mt-2 text-xs text-muted-foreground">
                {{ annotation.textContent | truncate:100 }}
              </div>
            }

            <div class="mt-2">
              @if (editingId() === annotation.id) {
                <div class="space-y-2">
                  <textarea
                    class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    [ngModel]="editText()"
                    (ngModelChange)="editText.set($event)"
                    placeholder="What should change?"
                    rows="3"
                  ></textarea>
                  <div class="flex items-center gap-2">
                    <button
                      class="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      (click)="saveEdit(annotation.id)"
                      type="button"
                      [disabled]="!editText().trim()"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Save
                    </button>
                    <button
                      class="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      (click)="cancelEdit()"
                      type="button"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      Cancel
                    </button>
                  </div>
                </div>
              } @else {
                @if (annotation.metadata?.feedbackText) {
                  <div class="text-xs">
                    <span class="font-medium text-foreground">Feedback:</span>
                    <span class="ml-1 text-muted-foreground">{{ annotation.metadata.feedbackText }}</span>
                  </div>
                } @else {
                  <div class="text-xs text-muted-foreground/60 italic">
                    No feedback provided. Click edit to add feedback.
                  </div>
                }
              }
            </div>

            @if (annotation.screenshot) {
              <div class="mt-2">
                <img
                  [src]="annotation.screenshot"
                  [alt]="'Annotation ' + (i + 1) + ' screenshot'"
                  class="max-w-full rounded"
                />
              </div>
            }
          </div>
        }
      </div>
    }
  `,
})
export class AnnotationListComponent {
  protected readonly store = inject(FeedbackStore);
  protected readonly editingId = signal<string | null>(null);
  protected readonly editText = signal('');

  protected startEdit(annotation: { id: string; metadata?: { feedbackText?: string } }): void {
    this.editingId.set(annotation.id);
    this.editText.set(annotation.metadata?.feedbackText || '');
  }

  protected saveEdit(id: string): void {
    const annotation = this.store.annotations().find((a) => a.id === id);
    if (annotation) {
      this.store.updateAnnotation(id, {
        metadata: {
          ...annotation.metadata,
          feedbackText: this.editText().trim(),
        },
      });
    }
    this.editingId.set(null);
    this.editText.set('');
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.editText.set('');
  }
}
