import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { EntryExportItem } from '../../models/import-export.model';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { EntriesStore } from '../../store/entries.store';

@Component({
  selector: 'app-import-export-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './import-export.page.html',
  styleUrl: './import-export.page.scss',
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


