import { Directive, HostListener, inject } from '@angular/core';
import { FeedbackStore } from '../store/feedback.store';

@Directive({
  selector: '[fbKeyboardShortcut]',
  standalone: true,
})
export class KeyboardShortcutDirective {
  private readonly store = inject(FeedbackStore);

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
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
