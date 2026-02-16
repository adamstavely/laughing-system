import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmDialogImports } from '@spartan-ng/ui-dialog-helm';

@Component({
  selector: 'fb-base-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BrnDialogImports, HlmDialogImports],
  template: `
    <brn-dialog
      [state]="isOpen() ? 'open' : 'closed'"
      [closeOnBackdropClick]="closeOnBackdropClick()"
      (stateChanged)="onStateChanged($event)"
    >
      <brn-dialog-overlay hlm class="bg-black/40 backdrop-blur-sm" />
      <div brnDialogContent hlm class="flex max-h-[85vh] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xl" [style.max-width]="maxWidth()">
        <!-- Header -->
        <div class="flex items-center border-b border-border px-6 py-5">
          <div class="flex flex-1 items-center gap-3">
            <ng-content select="[modalIcon]" />
            <h2 [id]="ariaLabelledBy()" class="text-xl font-semibold text-card-foreground">
              {{ title() }}
            </h2>
          </div>
          <button
            brnDialogClose
            class="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="Close modal"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <ng-content />
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <ng-content select="[modalFooter]" />
        </div>
      </div>
    </brn-dialog>
  `,
})
export class BaseModalComponent {
  readonly isOpen = input.required<boolean>();
  readonly title = input.required<string>();
  readonly maxWidth = input<string>('700px');
  readonly closeOnBackdropClick = input<boolean>(true);
  readonly ariaLabelledBy = input<string>('modal-title');
  readonly closed = output<void>();

  protected onStateChanged(state: 'open' | 'closed'): void {
    if (state === 'closed') {
      this.closed.emit();
    }
  }
}
