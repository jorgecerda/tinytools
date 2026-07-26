import { describe, it, expect, beforeEach } from 'vitest';
import { getInitialTheme } from '../../shared/theme.js';

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
}

describe('Theme Helper', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
  });

  it('should return saved theme if explicit setting exists in storage', () => {
    mockStorage.setItem('theme', 'light');
    expect(getInitialTheme(mockStorage, true)).toBe('light');

    mockStorage.setItem('theme', 'dark');
    expect(getInitialTheme(mockStorage, false)).toBe('dark');
  });

  it('should auto-detect system dark mode when no theme is saved in storage', () => {
    expect(getInitialTheme(mockStorage, true)).toBe('dark');
    expect(getInitialTheme(mockStorage, false)).toBe('light');
  });

  it('should fallback to dark if storage and system preferences are unavailable', () => {
    expect(getInitialTheme(null, false)).toBe('light');
    expect(getInitialTheme(null, true)).toBe('dark');
  });
});
