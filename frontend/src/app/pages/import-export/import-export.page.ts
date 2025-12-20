import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { EntryExportItem } from '../../models/import-export.model';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { EntriesStore } from '../../store/entries.store';

@Component({
  selector: 'app-import-export-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page">
      <header class="pageHeader">
        <a class="link" routerLink="/entries">Back</a>
        <h1>Import / Export</h1>
      </header>

      <section class="card">
        <h2>Export</h2>
        <p class="muted">Exports JSON with: id, url, title, description, tags. No files/attachments.</p>
        <div class="actions">
          <button class="button" type="button" (click)="exportJson()" [disabled]="busy()">Download JSON</button>
        </div>
      </section>

      <section class="card">
        <h2>Import</h2>
        <p class="muted">Import JSON exported from here. Matching is by URL.</p>

        <label class="field">
          <span class="label">Mode</span>
          <select class="select" [value]="mode()" (change)="mode.set(($any($event.target).value ?? 'skip').toString())">
            <option value="skip">Skip existing (by url)</option>
            <option value="update">Update existing (by url)</option>
          </select>
        </label>

        <label class="field">
          <span class="label">JSON file</span>
          <input class="file" type="file" accept="application/json" (change)="onFileSelected($event)" />
        </label>

        <div class="actions">
          <button class="button" type="button" (click)="importJson()" [disabled]="busy() || !fileText()">
            Import
          </button>
        </div>

        @if (importResult()) {
          <div class="resultBox">
            <div><b>Created</b>: {{ importResult()!.createdCount }}</div>
            <div><b>Updated</b>: {{ importResult()!.updatedCount }}</div>
            <div><b>Skipped</b>: {{ importResult()!.skippedCount }}</div>
            @if (importResult()!.errors.length > 0) {
              <div class="errListTitle">Errors:</div>
              <ul class="errList">
                @for (e of importResult()!.errors; track e.url) {
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
    </section>
  `,
  styles: `
    .page {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
      display: grid;
      gap: 14px;
    }
    .pageHeader {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 6px;
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
    .card {
      padding: 14px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.10);
    }
    h2 {
      margin: 0 0 8px 0;
      font-size: 16px;
    }
    .muted {
      color: rgba(255, 255, 255, 0.7);
      margin: 0 0 12px 0;
    }
    .field {
      display: grid;
      gap: 6px;
      margin-top: 10px;
    }
    .label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
    }
    .select,
    .file {
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
export class ImportExportPage {
  private readonly api = inject(VestigiumApiService);
  private readonly entriesStore = inject(EntriesStore);

  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly mode = signal<'skip' | 'update'>('skip');
  readonly fileText = signal<string | null>(null);
  readonly importResult = signal<{
    createdCount: number;
    updatedCount: number;
    skippedCount: number;
    errors: { url: string; error: string }[];
  } | null>(null);

  exportJson() {
    this.error.set(null);
    this.busy.set(true);
    this.api.exportEntries().subscribe({
      next: (items) => {
        const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vestigium-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.busy.set(false);
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to export');
      }
    });
  }

  onFileSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.fileText.set(null);
    this.importResult.set(null);
    this.error.set(null);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.fileText.set((reader.result ?? '').toString());
    reader.onerror = () => this.error.set('Failed to read file');
    reader.readAsText(file);
  }

  importJson() {
    const text = this.fileText();
    if (!text) return;
    this.error.set(null);
    this.importResult.set(null);
    this.busy.set(true);

    let items: EntryExportItem[];
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array');
      items = parsed as EntryExportItem[];
    } catch (e: any) {
      this.busy.set(false);
      this.error.set(e?.message ?? 'Invalid JSON');
      return;
    }

    this.api.importEntries(this.mode(), items).subscribe({
      next: (res) => {
        this.importResult.set(res);
        this.entriesStore.refresh();
        this.busy.set(false);
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to import');
      }
    });
  }
}


