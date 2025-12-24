import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { TagChipsInputComponent } from '../../components/tag-chips-input/tag-chips-input.component';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { EntriesStore } from '../../store/entries.store';
import type { TagSuggestionResponse } from '../../models';

@Component({
  selector: 'app-create-entry-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, TagChipsInputComponent],
  templateUrl: './create-entry.page.html',
  styleUrl: './create-entry.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateEntryPage {
  private readonly api = inject(VestigiumApiService);
  private readonly router = inject(Router);
  private readonly entriesStore = inject(EntriesStore);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly tags = signal<string[]>([]);
  readonly files = signal<File[]>([]);

  readonly tagSuggestions = signal<TagSuggestionResponse[]>([]);
  readonly tagSuggestionsLoading = signal(false);
  private suggestTimer: any = null;

  onTagSearch(q: string) {
    if (this.suggestTimer) clearTimeout(this.suggestTimer);
    const query = q.trim().toLowerCase();
    if (query.length < 2) {
      this.tagSuggestions.set([]);
      return;
    }
    this.suggestTimer = setTimeout(() => {
      this.tagSuggestionsLoading.set(true);
      this.api.suggestTags(query, 10).subscribe({
        next: (items) => {
          this.tagSuggestions.set(items);
          this.tagSuggestionsLoading.set(false);
        },
        error: () => {
          this.tagSuggestions.set([]);
          this.tagSuggestionsLoading.set(false);
        }
      });
    }, 200);
  }

  readonly form = new FormGroup({
    url: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    title: new FormControl<string>('', { nonNullable: true }),
    description: new FormControl<string>('', { nonNullable: true })
  });

  onFilesSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const list = input.files ? Array.from(input.files) : [];
    this.files.set(list);
  }

  submit() {
    if (this.form.invalid) return;
    this.error.set(null);
    this.saving.set(true);

    const fd = new FormData();
    fd.set('url', this.form.controls.url.value);
    if (this.form.controls.title.value.trim()) fd.set('title', this.form.controls.title.value.trim());
    if (this.form.controls.description.value.trim())
      fd.set('description', this.form.controls.description.value.trim());
    for (const t of this.tags()) fd.append('tags', t);
    for (const f of this.files()) fd.append('attachments', f, f.name);

    this.api.createEntry(fd).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.entriesStore.refresh();
        void this.router.navigate(['/entries', res.entry!.id!]);
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to create entry');
      }
    });
  }
}


