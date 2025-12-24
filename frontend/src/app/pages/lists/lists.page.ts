import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import type { ListResponse } from '../../models';
import { VestigiumApiService } from '../../services/vestigium-api.service';
import { EntriesStore } from '../../store/entries.store';
import { ListsStore } from '../../store/lists.store';

@Component({
  selector: 'app-lists-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './lists.page.html',
  styleUrl: './lists.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListsPage {
  readonly lists = inject(ListsStore);
  private readonly api = inject(VestigiumApiService);
  private readonly entriesStore = inject(EntriesStore);
  private readonly router = inject(Router);

  readonly createName = signal('');
  readonly error = signal<string | null>(null);

  constructor() {
    this.lists.load();
  }

  create() {
    const name = this.createName().trim();
    if (!name) return;
    this.error.set(null);
    this.api.createList(name).subscribe({
      next: () => {
        this.createName.set('');
        this.lists.load();
      },
      error: (e) => this.error.set(e?.error?.detail ?? e?.message ?? 'Failed to create list')
    });
  }

  delete(list: ListResponse) {
    this.error.set(null);
    this.api.deleteList(list.id!, false).subscribe({
      next: () => this.lists.load(),
      error: () => {
        if (confirm(`Delete list "${list.name}"? It has ${list.entryCount} linked entries.`)) {
          this.api.deleteList(list.id!, true).subscribe({
            next: () => this.lists.load(),
            error: (e2) => this.error.set(e2?.error?.detail ?? e2?.message ?? 'Failed to delete list')
          });
        }
      }
    });
  }

  addToEntriesFilter(list: ListResponse) {
    const next = Array.from(new Set([...this.entriesStore.listFilter(), list.id!])) as string[];
    this.entriesStore.setListFilter(next);
    void this.router.navigate(['/entries']);
  }
}


