import { Injectable, signal } from '@angular/core';

const KEY_SHOW_NSFW = 'vestigium.showNsfw';

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

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  // default ON
  readonly showNsfw = signal<boolean>(readBool(KEY_SHOW_NSFW, true));

  setShowNsfw(next: boolean) {
    this.showNsfw.set(!!next);
    writeBool(KEY_SHOW_NSFW, !!next);
  }
}


