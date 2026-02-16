import { Component, inject, input } from '@angular/core';
import { FeedbackStore } from '../store/feedback.store';
import type { FeedbackData } from '../models/feedback.model';
import { LucideAngularModule, Bug, Sparkles, HelpCircle, Heart, MessageSquare } from 'lucide-angular';

interface CategoryOption {
  value: FeedbackData['category'];
  label: string;
  icon: string;
}

const categories: CategoryOption[] = [
  { value: 'bug', label: 'Bug', icon: 'bug' },
  { value: 'feature', label: 'Feature Request', icon: 'sparkles' },
  { value: 'question', label: 'Question', icon: 'help-circle' },
  { value: 'praise', label: 'Praise', icon: 'heart' },
  { value: 'other', label: 'Other', icon: 'message-square' },
];

const severities: Array<{ value: FeedbackData['severity']; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

@Component({
  selector: 'fb-category-selector',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="space-y-4">
      <label class="text-sm font-medium text-foreground">
        Category
        @if (requireCategory()) {
          <span class="text-destructive"> *</span>
        }
      </label>
      <div class="flex flex-wrap gap-2">
        @for (category of categories; track category.value) {
          <button
            class="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
            [class]="store.category() === category.value
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground'"
            (click)="store.setCategory(category.value)"
            type="button"
          >
            <lucide-icon [name]="category.icon" [size]="16" />
            <span>{{ category.label }}</span>
          </button>
        }
      </div>

      @if (store.category() === 'bug') {
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">Severity</label>
          <div class="flex gap-2">
            @for (severity of severities; track severity.value) {
              <button
                class="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
                [class]="store.severity() === severity.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground'"
                (click)="store.setSeverity(severity.value)"
                type="button"
              >
                {{ severity.label }}
              </button>
            }
          </div>
        </div>
      }

      <label class="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          class="size-4 rounded border-border"
          [checked]="store.contactPreference()"
          (change)="onCheckboxChange($event)"
        />
        <span>I'm open to follow-up questions</span>
      </label>
    </div>
  `,
})
export class CategorySelectorComponent {
  protected readonly store = inject(FeedbackStore);
  readonly requireCategory = input<boolean>(false);

  protected readonly categories = categories;
  protected readonly severities = severities;

  protected onCheckboxChange(event: Event): void {
    this.store.setContactPreference((event.target as HTMLInputElement).checked);
  }
}
