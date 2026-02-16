import { Component, inject, input, output, computed } from '@angular/core';
import { FeedbackStore } from '../store/feedback.store';
import { KeyboardShortcutDirective } from '../directives/keyboard-shortcut.directive';
import type { ToolbarPosition } from '../models/feedback.model';
import { LucideAngularModule, MessageSquareDiff, MessageSquareText, Bug, Sparkles } from 'lucide-angular';

@Component({
  selector: 'fb-toolbar',
  standalone: true,
  imports: [KeyboardShortcutDirective, LucideAngularModule],
  host: { fbKeyboardShortcut: '' },
  template: `
    @if (!store.isToolbarExpanded()) {
      <!-- Collapsed FAB -->
      <div class="fixed z-[99998]" [class]="positionClasses()">
        <div class="group relative">
          <button
            class="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
            (click)="toggleExpand()"
            aria-label="Open feedback toolbar"
            aria-expanded="false"
            type="button"
          >
            <lucide-icon name="message-square-diff" [size]="20" />
            @if (store.annotationCount() > 0) {
              <span class="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-xs font-semibold text-destructive-foreground">
                {{ store.annotationCount() }}
              </span>
            }
          </button>
          <div class="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow transition-opacity group-hover:opacity-100">
            Provide feedback
          </div>
        </div>
      </div>
    } @else {
      <!-- Expanded panel -->
      <div
        class="fixed z-[99998] w-80 rounded-[var(--radius)] border border-border bg-card text-card-foreground shadow-xl"
        [class]="positionClasses()"
        role="toolbar"
        aria-label="Feedback toolbar"
        aria-expanded="true"
      >
        <!-- Header -->
        <div class="border-b border-border px-4 py-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <lucide-icon name="message-square-diff" [size]="20" class="text-primary" />
              <h3 class="text-sm font-semibold text-foreground">Provide Feedback</h3>
            </div>
            <button
              class="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              (click)="toggleExpand()"
              aria-label="Close toolbar"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <p class="mt-1 text-xs text-muted-foreground">
            Share your thoughts, report issues, or suggest improvements.
          </p>
        </div>

        <!-- Action buttons -->
        <div class="flex gap-2 border-b border-border p-4">
          <button
            class="flex flex-1 flex-col items-center gap-1 rounded-md border border-border p-3 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            (click)="generalFeedbackClick.emit()"
            aria-label="General Feedback"
            type="button"
          >
            <lucide-icon name="message-square-text" [size]="20" />
            <span class="text-xs font-medium">General Feedback</span>
          </button>
          <button
            class="flex flex-1 flex-col items-center gap-1 rounded-md border border-border p-3 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            (click)="bugReportClick.emit()"
            aria-label="Bug Report"
            type="button"
          >
            <lucide-icon name="bug" [size]="20" />
            <span class="text-xs font-medium">Bug Report</span>
          </button>
          <button
            class="flex flex-1 flex-col items-center gap-1 rounded-md border border-border p-3 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            (click)="featureRequestClick.emit()"
            aria-label="Feature Request"
            type="button"
          >
            <lucide-icon name="sparkles" [size]="20" />
            <span class="text-xs font-medium">Feature Request</span>
          </button>
        </div>

        <!-- NPS Section -->
        <div class="p-4">
          @if (store.npsScore() !== null) {
            <p class="text-center text-sm text-muted-foreground">
              Thanks for your feedback!
            </p>
          } @else {
            <p class="mb-2 text-xs font-medium text-foreground">
              How satisfied are you with this application?
            </p>
            <div class="flex gap-1" role="radiogroup" aria-label="NPS rating scale">
              @for (i of npsRange; track i) {
                <button
                  class="flex size-7 items-center justify-center rounded text-xs font-medium transition-colors"
                  [class]="store.npsScore() === i
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
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
            <div class="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>Not Satisfied</span>
              <span>Very Satisfied</span>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class FeedbackToolbarComponent {
  protected readonly store = inject(FeedbackStore);
  readonly position = input<ToolbarPosition>('bottom-right');
  readonly generalFeedbackClick = output<void>();
  readonly bugReportClick = output<void>();
  readonly featureRequestClick = output<void>();

  protected readonly npsRange = Array.from({ length: 11 }, (_, i) => i);

  protected readonly positionClasses = computed(() => {
    switch (this.position()) {
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  });

  protected toggleExpand(): void {
    this.store.setToolbarExpanded(!this.store.isToolbarExpanded());
  }
}
