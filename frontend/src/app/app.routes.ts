import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'entries' },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage)
  },
  {
    path: 'recommended',
    loadComponent: () =>
      import('./pages/recommended/recommended.page').then((m) => m.RecommendedPage)
  },
  {
    path: 'entries',
    loadComponent: () => import('./pages/entries/entries.page').then((m) => m.EntriesPage)
  },
  {
    path: 'tags',
    loadComponent: () => import('./pages/tags/tags.page').then((m) => m.TagsPage)
  },
  {
    path: 'lists',
    loadComponent: () => import('./pages/lists/lists.page').then((m) => m.ListsPage)
  },
  {
    path: 'queue',
    loadComponent: () => import('./pages/queue/queue.page').then((m) => m.QueuePage)
  },
  {
    path: 'entries/new',
    loadComponent: () =>
      import('./pages/create-entry/create-entry.page').then((m) => m.CreateEntryPage)
  },
  {
    path: 'entries/bulk',
    loadComponent: () => import('./pages/bulk-add/bulk-add.page').then((m) => m.BulkAddPage)
  },
  {
    path: 'entries/import-export',
    loadComponent: () =>
      import('./pages/import-export/import-export.page').then((m) => m.ImportExportPage)
  },
  {
    path: 'entries/:id',
    loadComponent: () =>
      import('./pages/entry-details/entry-details.page').then((m) => m.EntryDetailsPage)
  }
];
