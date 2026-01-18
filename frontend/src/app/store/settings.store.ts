import { Injectable, signal } from '@angular/core';

const KEY_SHOW_NSFW = 'vestigium.showNsfw';
const KEY_COMPACT_COLUMNS = 'vestigium.compactColumns';

function readBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return fallback;
  } catch {
    return fallback;
  }
}

function writeBool(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? 'true' : 'false');
  } catch {
    // ignore
  }
}

function readInt(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const n = parseInt(raw, 10);
    return isNaN(n) ? fallback : n;
  } catch {
    return fallback;
  }
}

function writeInt(key: string, value: number) {
  try {
    localStorage.setItem(key, value.toString());
  } catch {
    // ignore
  }
}

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  // default ON
  readonly showNsfw = signal<boolean>(readBool(KEY_SHOW_NSFW, true));
  readonly compactColumns = signal<number>(readInt(KEY_COMPACT_COLUMNS, 5));

  setShowNsfw(next: boolean) {
    this.showNsfw.set(!!next);
    writeBool(KEY_SHOW_NSFW, !!next);
  }

  setCompactColumns(next: number) {
    this.compactColumns.set(next);
    writeInt(KEY_COMPACT_COLUMNS, next);
  }
}
