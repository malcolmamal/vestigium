import { ChangeDetectionStrategy, Component, computed, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import type { TagSuggestionResponse } from '../../models/tag-suggestion.model';
import { finalize } from 'rxjs';

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
      @if (showSuggestions() && suggestions().length > 0) {
        <div class="suggestions" (mousedown)="$event.preventDefault()">
          @for (s of suggestions(); track s.name; let i = $index) {
            <button
              type="button"
              class="suggestion"
              [class.active]="i === activeIndex()"
              (click)="pickSuggestion(s.name)"
            >
              <span class="sName">{{ s.name }}</span>
              <span class="sCount">{{ s.count }}</span>
            </button>
          }
        </div>
      }
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
    .suggestions {
      display: grid;
      gap: 6px;
      padding: 10px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.10);
      background: rgba(12, 14, 18, 0.92);
      backdrop-filter: blur(8px);
    }
    .suggestion {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      width: 100%;
      text-align: left;
      border: 1px solid rgba(255, 255, 255, 0.10);
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.92);
      padding: 8px 10px;
      border-radius: 10px;
      cursor: pointer;
    }
    .suggestion:hover {
      background: rgba(255, 255, 255, 0.10);
    }
    .suggestion.active {
      border-color: rgba(90, 97, 255, 0.35);
      background: rgba(90, 97, 255, 0.10);
    }
    .sName {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sCount {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagChipsInputComponent {
  private readonly api = inject(VestigiumApiService);

  readonly tags = input<string[]>([]);
  readonly placeholder = input<string>('Add tag and press Enter');
  readonly hint = input<string | null>(null);

  readonly tagsChange = output<string[]>();

  readonly draft = signal('');
  readonly draftTrimmed = computed(() => this.draft().trim());

  readonly suggestionsLoading = signal(false);
  readonly suggestions = signal<TagSuggestionResponse[]>([]);
  readonly showSuggestions = computed(() => this.draftTrimmed().length >= 2);
  readonly activeIndex = signal(0);

  private suggestTimer: any = null;

  onInput(evt: Event) {
    const value = (evt.target as HTMLInputElement).value;
    this.draft.set(value);
    this.scheduleSuggest();
  }

  onKeydown(evt: KeyboardEvent) {
    const hasSuggestions = this.showSuggestions() && this.suggestions().length > 0;
    if (hasSuggestions) {
      if (evt.key === 'ArrowDown') {
        evt.preventDefault();
        this.activeIndex.set(Math.min(this.activeIndex() + 1, this.suggestions().length - 1));
        return;
      }
      if (evt.key === 'ArrowUp') {
        evt.preventDefault();
        this.activeIndex.set(Math.max(this.activeIndex() - 1, 0));
        return;
      }
      if (evt.key === 'Enter') {
        evt.preventDefault();
        const idx = this.activeIndex();
        const item = this.suggestions().at(idx);
        if (item) {
          this.pickSuggestion(item.name);
          return;
        }
      }
      if (evt.key === 'Escape') {
        evt.preventDefault();
        this.suggestions.set([]);
        return;
      }
    }

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
    this.suggestions.set([]);
    this.activeIndex.set(0);
  }

  remove(tag: string) {
    this.tagsChange.emit(this.tags().filter((t) => t !== tag));
  }

  pickSuggestion(tag: string) {
    const normalized = (tag ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (!normalized) return;
    if (!this.tags().includes(normalized)) {
      this.tagsChange.emit([...this.tags(), normalized]);
    }
    this.draft.set('');
    this.suggestions.set([]);
    this.activeIndex.set(0);
  }

  private scheduleSuggest() {
    if (this.suggestTimer) {
      clearTimeout(this.suggestTimer);
    }

    const q = this.draftTrimmed().toLowerCase();
    if (q.length < 2) {
      this.suggestions.set([]);
      this.activeIndex.set(0);
      return;
    }

    this.suggestTimer = setTimeout(() => {
      this.suggestionsLoading.set(true);
      this.api
        .suggestTags(q, 10)
        .pipe(finalize(() => this.suggestionsLoading.set(false)))
        .subscribe({
          next: (items) => {
            const selected = new Set(this.tags());
            const filtered = items.filter((s) => !selected.has(s.name));
            this.suggestions.set(filtered);
            this.activeIndex.set(0);
          },
          error: () => {
            this.suggestions.set([]);
            this.activeIndex.set(0);
          }
        });
    }, 200);
  }
}


