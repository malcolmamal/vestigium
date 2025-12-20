import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tag-chips-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wrap">
      <div class="chips" [class.empty]="tags().length === 0">
        @for (tag of tags(); track tag) {
          <span class="chip">
            <span class="chipText">{{ tag }}</span>
            <button type="button" class="chipX" (click)="remove(tag)" aria-label="Remove tag">×</button>
          </span>
        }
        <input
          class="input"
          [placeholder]="placeholder()"
          [value]="draft()"
          (input)="onInput($event)"
          (keydown)="onKeydown($event)"
          (blur)="commitDraft()"
        />
      </div>
      @if (hint()) {
        <div class="hint">{{ hint() }}</div>
      }
    </div>
  `,
  styles: `
    .wrap {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px 10px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(255, 255, 255, 0.06);
      align-items: center;
      min-height: 46px;
    }
    .chip {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.12);
      font-size: 13px;
    }
    .chipText {
      color: rgba(255, 255, 255, 0.92);
    }
    .chipX {
      background: transparent;
      border: 0;
      color: rgba(255, 255, 255, 0.85);
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      padding: 0 2px;
    }
    .input {
      flex: 1 1 180px;
      min-width: 160px;
      background: transparent;
      border: 0;
      outline: none;
      color: rgba(255, 255, 255, 0.92);
      font-size: 14px;
      padding: 6px 4px;
    }
    .hint {
      color: rgba(255, 255, 255, 0.65);
      font-size: 12px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagChipsInputComponent {
  readonly tags = input<string[]>([]);
  readonly placeholder = input<string>('Add tag and press Enter');
  readonly hint = input<string | null>(null);

  readonly tagsChange = output<string[]>();

  readonly draft = signal('');
  readonly draftTrimmed = computed(() => this.draft().trim());

  onInput(evt: Event) {
    const value = (evt.target as HTMLInputElement).value;
    this.draft.set(value);
  }

  onKeydown(evt: KeyboardEvent) {
    if (evt.key === 'Enter' || evt.key === ',') {
      evt.preventDefault();
      this.commitDraft();
      return;
    }
    if (evt.key === 'Backspace' && this.draftTrimmed().length === 0 && this.tags().length > 0) {
      this.remove(this.tags().at(-1)!);
    }
  }

  commitDraft() {
    const raw = this.draftTrimmed();
    if (!raw) return;
    const normalized = raw.toLowerCase().replace(/\s+/g, ' ');
    if (!this.tags().includes(normalized)) {
      this.tagsChange.emit([...this.tags(), normalized]);
    }
    this.draft.set('');
  }

  remove(tag: string) {
    this.tagsChange.emit(this.tags().filter((t) => t !== tag));
  }
}


