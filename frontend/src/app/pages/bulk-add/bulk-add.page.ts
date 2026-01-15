import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { VestigiumApiService } from '../../services/vestigium-api.service';
import { EntriesStore } from '../../store/entries.store';
import type { BulkCreateEntriesResponse } from '../../models';

@Component({
  selector: 'app-bulk-add-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './bulk-add.page.html',
  styleUrl: './bulk-add.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BulkAddPage {
  private readonly api = inject(VestigiumApiService);
  private readonly entriesStore = inject(EntriesStore);
  private readonly router = inject(Router);

  readonly raw = signal('');
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<BulkCreateEntriesResponse | null>(null);

  parsedItems() {
    const lines = this.raw()
      .split(/\r?\n/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const items: { url: string; title: string | null }[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('http://') || line.startsWith('https://')) {
        items.push({ url: line, title: null });
      } else {
        // Title? Only if next line is a URL
        if (i + 1 < lines.length && (lines[i + 1].startsWith('http://') || lines[i + 1].startsWith('https://'))) {
          items.push({ url: lines[i + 1], title: line });
          i++; // Skip the URL line
        }
      }
    }

    // De-dupe by URL, preserving order
    const seen = new Set<string>();
    return items.filter((it) => {
      if (seen.has(it.url)) return false;
      seen.add(it.url);
      return true;
    });
  }

  submit() {
    const items = this.parsedItems();
    if (items.length === 0) return;
    this.error.set(null);
    this.result.set(null);
    this.saving.set(true);

    this.api
      .bulkCreateEntries(items)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.entriesStore.refresh();
          // If we created anything, go back to entries list.
          if (res.createdCount! > 0) void this.router.navigate(['/entries']);
        },
        error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to bulk add')
      });
  }
}
