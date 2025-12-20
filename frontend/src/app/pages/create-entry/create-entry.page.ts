import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { TagChipsInputComponent } from '../../components/tag-chips-input/tag-chips-input.component';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { EntriesStore } from '../../store/entries.store';

@Component({
  selector: 'app-create-entry-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, TagChipsInputComponent],
  template: `
    <section class="page">
      <header class="pageHeader">
        <a class="link" routerLink="/entries">Back</a>
        <h1>New entry</h1>
      </header>

      <form class="form" [formGroup]="form" (ngSubmit)="submit()">
        <label class="field">
          <span class="label">URL *</span>
          <input class="textInput" formControlName="url" placeholder="https://…" />
          @if (form.controls.url.touched && form.controls.url.invalid) {
            <span class="error">URL is required.</span>
          }
        </label>

        <label class="field">
          <span class="label">Title (optional)</span>
          <input class="textInput" formControlName="title" />
        </label>

        <label class="field">
          <span class="label">Description (optional)</span>
          <textarea class="textArea" rows="4" formControlName="description"></textarea>
        </label>

        <label class="field">
          <span class="label">Tags (optional)</span>
          <app-tag-chips-input [tags]="tags()" (tagsChange)="tags.set($event)" />
        </label>

        <label class="field">
          <span class="label">Attachments (PDF/images)</span>
          <input type="file" multiple (change)="onFilesSelected($event)" />
          @if (files().length > 0) {
            <div class="muted">{{ files().length }} file(s) selected</div>
          }
        </label>

        @if (error()) {
          <div class="errorBox">{{ error() }}</div>
        }

        <div class="actions">
          <button class="button" type="submit" [disabled]="saving() || form.invalid">Create</button>
          @if (saving()) {
            <span class="muted">Saving… enrichment will run in background.</span>
          }
        </div>
      </form>
    </section>
  `,
  styles: `
    .page {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
    }
    .pageHeader {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 24px;
    }
    h1 {
      margin: 0;
      font-size: 22px;
      letter-spacing: -0.02em;
    }
    .muted {
      color: rgba(255, 255, 255, 0.7);
    }
    .link {
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
    }
    .form {
      display: grid;
      gap: 14px;
      padding: 14px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.10);
    }
    .field {
      display: grid;
      gap: 6px;
    }
    .label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
    }
    .textInput,
    .textArea {
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.92);
      padding: 10px 10px;
      outline: none;
      font-size: 14px;
    }
    .actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 14px;
      border-radius: 10px;
      color: white;
      background: rgba(255, 255, 255, 0.14);
      border: 1px solid rgba(255, 255, 255, 0.18);
      cursor: pointer;
    }
    .button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .error {
      color: rgba(255, 210, 210, 0.9);
      font-size: 12px;
    }
    .errorBox {
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(255, 80, 80, 0.14);
      border: 1px solid rgba(255, 80, 80, 0.25);
      color: rgba(255, 220, 220, 0.92);
    }
  `,
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
        void this.router.navigate(['/entries', res.entry.id]);
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to create entry');
      }
    });
  }
}


