import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { TagChipsInputComponent } from '../../components/tag-chips-input/tag-chips-input.component';
import type { EntryDetailsResponse } from '../../models/entry.model';
import { VestigiumApiService } from '../../services/vestigium-api.service';

@Component({
  selector: 'app-entry-details-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, TagChipsInputComponent],
  template: `
    <section class="page">
      <header class="pageHeader">
        <a class="link" routerLink="/entries">Back</a>
        <h1>{{ data()?.entry?.title || 'Entry' }}</h1>
      </header>

      @if (error()) {
        <div class="errorBox">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="muted">Loading…</div>
      } @else if (data() === null) {
        <div class="muted">Not found.</div>
      } @else {
        <div class="content">
          <div class="topRow">
            <div class="thumb">
              <img [src]="data()!.entry.thumbnailUrl" alt="" (error)="onImgError($event)" />
            </div>
            <div class="meta">
              <a class="url" [href]="data()!.entry.url" target="_blank" rel="noreferrer">
                {{ data()!.entry.url }}
              </a>
              <div class="pillRow">
                <span class="pill" [class.on]="data()!.entry.important">Important</span>
                <span class="pill" [class.on]="!!data()!.entry.visitedAt">Visited</span>
              </div>
              <div class="actions">
                <button class="button" type="button" (click)="toggleImportant()">
                  {{ data()!.entry.important ? 'Unmark important' : 'Mark important' }}
                </button>
                <button class="button" type="button" (click)="markVisited()" [disabled]="!!data()!.entry.visitedAt">
                  Mark visited
                </button>
                <button class="button" type="button" (click)="enqueueEnrich()">Update via LLM</button>
                <button class="button" type="button" (click)="enqueueThumbnail()">Regenerate thumbnail</button>
              </div>
              @if (actionHint()) {
                <div class="muted">{{ actionHint() }}</div>
              }
            </div>
          </div>

          <form class="form" [formGroup]="form" (ngSubmit)="save()">
            <label class="field">
              <span class="label">Title</span>
              <input class="textInput" formControlName="title" />
            </label>

            <label class="field">
              <span class="label">Description</span>
              <textarea class="textArea" rows="5" formControlName="description"></textarea>
            </label>

            <label class="field">
              <span class="label">Tags</span>
              <app-tag-chips-input [tags]="tags()" (tagsChange)="tags.set($event)" />
            </label>

            <div class="actions">
              <button class="button" type="submit" [disabled]="saving()">Save</button>
              @if (saving()) {
                <span class="muted">Saving…</span>
              }
            </div>
          </form>

          <section class="attachments">
            <h2>Attachments</h2>
            @if (data()!.attachments.length === 0) {
              <div class="muted">No attachments.</div>
            } @else {
              <ul class="list">
                @for (a of data()!.attachments; track a.id) {
                  <li>
                    <a [href]="a.downloadUrl" target="_blank" rel="noreferrer">
                      {{ a.originalName }} ({{ a.kind }})
                    </a>
                  </li>
                }
              </ul>
            }
          </section>
        </div>
      }
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
    .errorBox {
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(255, 80, 80, 0.14);
      border: 1px solid rgba(255, 80, 80, 0.25);
      color: rgba(255, 220, 220, 0.92);
      margin-bottom: 12px;
    }
    .content {
      display: grid;
      gap: 14px;
    }
    .topRow {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 14px;
      padding: 14px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.10);
    }
    .thumb {
      border-radius: 14px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.10);
      height: 140px;
    }
    .thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .meta {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 0;
    }
    .url {
      color: rgba(255, 255, 255, 0.92);
      text-decoration: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .pillRow {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pill {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.78);
    }
    .pill.on {
      color: rgba(255, 255, 255, 0.92);
      background: rgba(90, 97, 255, 0.16);
      border-color: rgba(90, 97, 255, 0.28);
    }
    .actions {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
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
    .attachments {
      padding: 14px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.10);
    }
    h2 {
      margin: 0 0 10px 0;
      font-size: 16px;
    }
    .list {
      margin: 0;
      padding-left: 18px;
      color: rgba(255, 255, 255, 0.85);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntryDetailsPage {
  private readonly api = inject(VestigiumApiService);
  private readonly route = inject(ActivatedRoute);

  readonly id = signal<string | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly actionHint = signal<string | null>(null);

  readonly data = signal<EntryDetailsResponse | null>(null);
  readonly tags = signal<string[]>([]);

  readonly form = new FormGroup({
    title: new FormControl<string>('', { nonNullable: true }),
    description: new FormControl<string>('', { nonNullable: true })
  });

  readonly entry = computed(() => this.data()?.entry ?? null);

  constructor() {
    effect(
      () => {
        const id = this.route.snapshot.paramMap.get('id');
        this.id.set(id);
        if (id) this.refresh(id);
      },
      { allowSignalWrites: true }
    );
  }

  refresh(id: string) {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getEntry(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.data.set(res);
          this.form.controls.title.setValue(res.entry.title ?? '');
          this.form.controls.description.setValue(res.entry.description ?? '');
          this.tags.set(res.entry.tags ?? []);
        },
        error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to load entry')
      });
  }

  save() {
    const id = this.id();
    if (!id) return;
    this.saving.set(true);
    this.error.set(null);

    this.api
      .patchEntry(id, {
        title: this.form.controls.title.value.trim() || null,
        description: this.form.controls.description.value.trim() || null,
        tags: this.tags()
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.refresh(id),
        error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to save')
      });
  }

  toggleImportant() {
    const id = this.id();
    const entry = this.entry();
    if (!id || !entry) return;
    this.api.patchEntry(id, { important: !entry.important }).subscribe({
      next: () => this.refresh(id),
      error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to update')
    });
  }

  markVisited() {
    const id = this.id();
    if (!id) return;
    this.api.markVisited(id).subscribe({
      next: () => this.refresh(id),
      error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to mark visited')
    });
  }

  enqueueEnrich() {
    const id = this.id();
    if (!id) return;
    this.actionHint.set('Enrichment queued. Refresh in a moment to see updates.');
    this.api.enqueueEnrich(id).subscribe({
      error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to enqueue enrichment')
    });
  }

  enqueueThumbnail() {
    const id = this.id();
    if (!id) return;
    this.actionHint.set('Thumbnail regeneration queued. Refresh in a moment.');
    this.api.enqueueThumbnail(id).subscribe({
      error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to enqueue thumbnail regeneration')
    });
  }

  onImgError(evt: Event) {
    (evt.target as HTMLImageElement).style.display = 'none';
  }
}


