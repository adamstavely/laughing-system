import { Component, ErrorHandler, Injectable, signal, inject } from '@angular/core';

@Injectable()
export class FeedbackErrorHandler extends ErrorHandler {
  readonly hasError = signal(false);
  readonly error = signal<Error | null>(null);

  override handleError(error: unknown): void {
    console.error('FeedbackComponent error:', error);
    this.hasError.set(true);
    this.error.set(error instanceof Error ? error : new Error(String(error)));
  }
}

@Component({
  selector: 'fb-error-fallback',
  standalone: true,
  providers: [
    FeedbackErrorHandler,
    { provide: ErrorHandler, useExisting: FeedbackErrorHandler },
  ],
  template: `
    @if (errorHandler.hasError()) {
      <div class="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <h3 class="text-lg font-semibold text-foreground">Something went wrong</h3>
        <p class="mt-2 text-sm text-muted-foreground">
          The feedback component encountered an error. Please refresh the page and try again.
        </p>
        @if (errorHandler.error()) {
          <details class="mt-4 text-left">
            <summary class="cursor-pointer text-sm text-muted-foreground">Error details</summary>
            <pre class="mt-2 overflow-auto rounded bg-muted p-2 text-xs text-destructive">{{ errorHandler.error()?.message }}</pre>
          </details>
        }
        <button
          class="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          (click)="reload()"
        >
          Reload Page
        </button>
      </div>
    } @else {
      <ng-content />
    }
  `,
})
export class ErrorFallbackComponent {
  protected readonly errorHandler = inject(FeedbackErrorHandler);

  reload(): void {
    window.location.reload();
  }
}
