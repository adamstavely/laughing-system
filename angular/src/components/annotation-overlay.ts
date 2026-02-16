import { Component, inject, input, output } from '@angular/core';
import { FeedbackStore } from '../store/feedback.store';
import { SmartSelectorDirective } from '../directives/smart-selector.directive';
import { ElementHighlightComponent } from './element-highlight';
import { TextHighlightComponent } from './text-highlight';
import { AreaHighlightComponent } from './area-highlight';
import type { ToolMode, Annotation } from '../models/feedback.model';

@Component({
  selector: 'fb-annotation-overlay',
  standalone: true,
  imports: [
    SmartSelectorDirective,
    ElementHighlightComponent,
    TextHighlightComponent,
    AreaHighlightComponent,
  ],
  template: `
    <!-- Smart selector directive activates when toolMode != 'none' -->
    <div
      [fbSmartSelector]="toolMode() !== 'none'"
      [selectorPriority]="selectorPriority()"
      (annotationCreated)="annotationCreated.emit($event)"
    >
    </div>

    @if (store.hasAnnotations()) {
      <div class="feedback-annotation-overlay">
        @for (annotation of store.annotations(); track annotation.id; let i = $index) {
          @switch (annotation.type) {
            @case ('element') {
              <fb-element-highlight [annotation]="annotation" [index]="i" />
            }
            @case ('text') {
              <fb-text-highlight [annotation]="annotation" [index]="i" />
            }
            @case ('area') {
              <fb-area-highlight [annotation]="annotation" [index]="i" />
            }
          }
        }
      </div>
    }
  `,
})
export class AnnotationOverlayComponent {
  protected readonly store = inject(FeedbackStore);
  readonly toolMode = input.required<ToolMode>();
  readonly selectorPriority = input<string[]>();
  readonly annotationCreated = output<Annotation>();
}
