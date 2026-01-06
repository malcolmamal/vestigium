import { TestBed } from '@angular/core/testing';
import { SettingsStore } from './settings.store';

describe('SettingsStore', () => {
  let store: SettingsStore;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [SettingsStore]
    });
    store = TestBed.inject(SettingsStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(store).toBeTruthy();
  });

  it('should default to showing NSFW when not set', () => {
    expect(store.showNsfw()).toBe(true);
  });

  it('should read NSFW setting from localStorage', () => {
    localStorage.setItem('vestigium.showNsfw', 'false');
    // Create a new instance to test localStorage reading
    const newStore = new SettingsStore();
    expect(newStore.showNsfw()).toBe(false);
  });

  it('should update NSFW setting', () => {
    store.setShowNsfw(false);
    expect(store.showNsfw()).toBe(false);
    expect(localStorage.getItem('vestigium.showNsfw')).toBe('false');

    store.setShowNsfw(true);
    expect(store.showNsfw()).toBe(true);
    expect(localStorage.getItem('vestigium.showNsfw')).toBe('true');
  });

  it('should handle invalid localStorage values', () => {
    localStorage.setItem('vestigium.showNsfw', 'invalid');
    // Create a new instance to test localStorage reading
    const newStore = new SettingsStore();
    // Should default to true when invalid
    expect(newStore.showNsfw()).toBe(true);
  });
});
