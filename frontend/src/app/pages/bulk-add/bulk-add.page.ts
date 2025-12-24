import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { VestigiumApiService } from '../../services/vestigium-api.service';
import { EntriesStore } from '../../store/entries.store';

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
  readonly result = signal<{
    createdCount: number;
    skippedCount: number;
    errors: { url: string; error: string }[];
  } | null>(null);

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
          this.result.set(res as any);
          this.entriesStore.refresh();
          // If we created anything, go back to entries list.
          if (res.createdCount! > 0) void this.router.navigate(['/entries']);
        },
        error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to bulk add')
      });
  }
}
