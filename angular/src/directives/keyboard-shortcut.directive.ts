import { Directive, inject } from '@angular/core';
import { FeedbackStore } from '../store/feedback.store';

@Directive({
  selector: '[fbKeyboardShortcut]',
  host: {
    '(document:keydown)': 'handleKeyDown($event)',
  },
})
export class KeyboardShortcutDirective {
  private readonly store = inject(FeedbackStore);

  protected handleKeyDown(event: KeyboardEvent): void {
    if (
      (event.metaKey || event.ctrlKey) &&
      event.shiftKey &&
      event.key === 'F' &&
      !event.defaultPrevented
    ) {
      event.preventDefault();
      this.store.setToolbarExpanded(!this.store.isToolbarExpanded());
    }
  }
}
