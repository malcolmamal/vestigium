import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { VestigiumApiService } from '../../services/vestigium-api.service';
import { EntriesStore } from '../../store/entries.store';

@Component({
  selector: 'app-bulk-add-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="pageHeader">
        <a class="link" routerLink="/entries">Back</a>
        <h1>Bulk add</h1>
      </header>

      <p class="muted">Paste one URL per line. We’ll create entries and queue enrichment/thumbnail jobs.</p>

      <textarea
        class="textArea"
        rows="12"
        [value]="raw()"
        (input)="raw.set(($any($event.target).value ?? '').toString())"
        placeholder="https://example.com/...\nhttps://www.youtube.com/watch?v=...\n..."
      ></textarea>

      <div class="actions">
        <button class="button" type="button" (click)="submit()" [disabled]="saving() || parsedUrls().length === 0">
          Add {{ parsedUrls().length }} URL(s)
        </button>
        @if (saving()) {
          <span class="muted">Queuing…</span>
        }
      </div>

      @if (result()) {
        <div class="resultBox">
          <div><b>Created</b>: {{ result()!.createdCount }}</div>
          <div><b>Skipped</b>: {{ result()!.skippedCount }}</div>
          @if (result()!.errors.length > 0) {
            <div class="errListTitle">Errors:</div>
            <ul class="errList">
              @for (e of result()!.errors; track e.url) {
                <li><b>{{ e.url }}</b> — {{ e.error }}</li>
              }
            </ul>
          }
        </div>
      }

      @if (error()) {
        <div class="errorBox">{{ error() }}</div>
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
      margin-bottom: 18px;
    }
    .link {
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
    }
    h1 {
      margin: 0;
      font-size: 22px;
      letter-spacing: -0.02em;
    }
    .muted {
      color: rgba(255, 255, 255, 0.7);
    }
    .textArea {
      width: 100%;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.92);
      padding: 10px 10px;
      outline: none;
      font-size: 14px;
      margin-top: 10px;
    }
    .actions {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-top: 12px;
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
    .errorBox {
      margin-top: 12px;
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(255, 80, 80, 0.14);
      border: 1px solid rgba(255, 80, 80, 0.25);
      color: rgba(255, 220, 220, 0.92);
    }
    .resultBox {
      margin-top: 14px;
      padding: 12px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.10);
    }
    .errListTitle {
      margin-top: 10px;
      font-weight: 600;
    }
    .errList {
      margin: 8px 0 0 0;
      padding-left: 18px;
      color: rgba(255, 255, 255, 0.85);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BulkAddPage {
  private readonly api = inject(VestigiumApiService);
  private readonly entriesStore = inject(EntriesStore);
  private readonly router = inject(Router);

  readonly raw = signal('');
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<{ createdCount: number; skippedCount: number; errors: { url: string; error: string }[] } | null>(null);

  parsedUrls() {
    const lines = this.raw()
      .split(/\r?\n/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    // de-dupe preserving order
    return Array.from(new Set(lines));
  }

  submit() {
    const urls = this.parsedUrls();
    if (urls.length === 0) return;
    this.error.set(null);
    this.result.set(null);
    this.saving.set(true);

    this.api
      .bulkCreateEntries(urls)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.entriesStore.refresh();
          // If we created anything, go back to entries list.
          if (res.createdCount > 0) void this.router.navigate(['/entries']);
        },
        error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to bulk add')
      });
  }
}


