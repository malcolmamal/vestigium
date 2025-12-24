import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { TagSuggestionResponse } from '../../models';

@Component({
  selector: 'app-tag-chips-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tag-chips-input.component.html',
  styleUrl: './tag-chips-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagChipsInputComponent {
  readonly tags = input<string[]>([]);
  readonly placeholder = input<string>('Add tag and press Enter');
  readonly hint = input<string | null>(null);
  readonly suggestions = input<TagSuggestionResponse[]>([]);
  readonly suggestionsLoading = input<boolean>(false);

  readonly tagsChange = output<string[]>();
  readonly searchChange = output<string>();

  readonly draft = signal('');
  readonly draftTrimmed = computed(() => this.draft().trim());

  readonly showSuggestions = computed(() => this.draftTrimmed().length >= 2);
  readonly activeIndex = signal(0);

  onInput(evt: Event) {
    const value = (evt.target as HTMLInputElement).value;
    this.draft.set(value);
    this.searchChange.emit(value);
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
          this.pickSuggestion(item.name!);
          return;
        }
      }
      if (evt.key === 'Escape') {
        evt.preventDefault();
        this.draft.set('');
        this.searchChange.emit('');
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
    this.searchChange.emit('');
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
    this.searchChange.emit('');
    this.activeIndex.set(0);
  }
}


