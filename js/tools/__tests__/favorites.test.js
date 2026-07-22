import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadFavorites,
  saveFavorites,
  isFavorite,
  toggleFavorite,
  sortItemsByFavorites
} from '../../shared/favorites.js';

class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  clear() {
    this.store = {};
  }
}

describe('Favorites Shared Utility', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  it('should load empty array when storage is empty', () => {
    const favs = loadFavorites(mockStorage);
    expect(favs).toEqual([]);
  });

  it('should load saved favorites array from storage', () => {
    mockStorage.setItem('favorite_tools', JSON.stringify(['json-to-csv', 'pdf-split-join']));
    const favs = loadFavorites(mockStorage);
    expect(favs).toEqual(['json-to-csv', 'pdf-split-join']);
  });

  it('should save favorites array to storage', () => {
    saveFavorites(['percentage-calculator'], mockStorage);
    expect(mockStorage.getItem('favorite_tools')).toBe(JSON.stringify(['percentage-calculator']));
  });

  it('should correctly check if a tool is favorited', () => {
    const favs = ['percentage-calculator', 'utm-build-verify'];
    expect(isFavorite('percentage-calculator', favs)).toBe(true);
    expect(isFavorite('json-to-csv', favs)).toBe(false);
  });

  it('should toggle favorites (add if missing, remove if present)', () => {
    let favs = ['percentage-calculator'];
    
    // Add new
    favs = toggleFavorite('json-to-csv', favs);
    expect(favs).toEqual(['percentage-calculator', 'json-to-csv']);

    // Remove existing
    favs = toggleFavorite('percentage-calculator', favs);
    expect(favs).toEqual(['json-to-csv']);
  });

  it('should sort items placing favorited tools first while preserving relative order', () => {
    const items = [
      { id: 'tool-a' },
      { id: 'tool-b' },
      { id: 'tool-c' },
      { id: 'tool-d' }
    ];
    const favs = ['tool-c', 'tool-a'];

    const sorted = sortItemsByFavorites(items, item => item.id, favs);
    const sortedIds = sorted.map(item => item.id);

    expect(sortedIds).toEqual(['tool-a', 'tool-c', 'tool-b', 'tool-d']);
  });
});
