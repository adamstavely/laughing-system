import { Component, input, model, signal, effect, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'fb-controlled-textarea',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div [class]="label() ? 'space-y-2' : ''">
      @if (label()) {
        <label class="text-sm font-medium text-foreground" [attr.for]="id()">
          {{ label() }}
        </label>
      }
      <textarea
        class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        [id]="id()"
        [rows]="rows()"
        [maxlength]="maxLength()"
        [required]="required()"
        [placeholder]="placeholder()"
        [ngModel]="localValue()"
        (ngModelChange)="handleChange($event)"
        (blur)="handleBlur()"
      ></textarea>
      @if (showCharCount()) {
        <div class="mt-1 text-right text-xs" [class]="remaining() < 100 ? 'text-yellow-500' : 'text-muted-foreground'">
          {{ remaining() }} characters remaining
        </div>
      }
    </div>
  `,
})
export class ControlledTextareaComponent implements OnDestroy {
  readonly id = input.required<string>();
  readonly value = model<string>('');
  readonly placeholder = input<string>('');
  readonly rows = input<number>(4);
  readonly maxLength = input<number>(5000);
  readonly required = input<boolean>(false);
  readonly label = input<string | undefined>();
  readonly showCharCount = input<boolean>(true);

  protected readonly localValue = signal('');
  private syncTimeoutId: ReturnType<typeof setTimeout> | null = null;

  protected readonly remaining = () => this.maxLength() - this.localValue().length;

  constructor() {
    effect(() => {
      const v = this.value();
      if (v !== this.localValue()) {
        this.localValue.set(v);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.syncTimeoutId) clearTimeout(this.syncTimeoutId);
  }

  protected handleChange(newValue: string): void {
    this.localValue.set(newValue);

    if (this.syncTimeoutId) clearTimeout(this.syncTimeoutId);

    this.syncTimeoutId = setTimeout(() => {
      this.value.set(newValue);
    }, 500);
  }

  protected handleBlur(): void {
    if (this.localValue() !== this.value()) {
      if (this.syncTimeoutId) clearTimeout(this.syncTimeoutId);
      this.value.set(this.localValue());
    }
  }
}
