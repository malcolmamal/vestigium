import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'entries' },
  {
    path: 'entries',
    loadComponent: () => import('./pages/entries/entries.page').then((m) => m.EntriesPage)
  },
  {
    path: 'entries/new',
    loadComponent: () => import('./pages/create-entry/create-entry.page').then((m) => m.CreateEntryPage)
  },
  {
    path: 'entries/:id',
    loadComponent: () => import('./pages/entry-details/entry-details.page').then((m) => m.EntryDetailsPage)
  }
];
