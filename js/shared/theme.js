// Shared Theme helper functions for tinytools

/**
 * Resolves initial theme based on saved preference or system preference.
 * @param {Storage|null} [storage]
 * @param {boolean} [systemPrefersDark]
 * @returns {'dark'|'light'}
 */
export function getInitialTheme(
  storage = typeof localStorage !== 'undefined' ? localStorage : null,
  systemPrefersDark = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : true
) {
  if (storage) {
    const saved = storage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  }
  return systemPrefersDark ? 'dark' : 'light';
}
