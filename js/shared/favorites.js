// Shared Favorites helper functions for tinytools

const FAVORITES_KEY = 'favorite_tools';

/**
 * Loads the list of favorited tool IDs from storage.
 * @param {Storage|null} [storage]
 * @returns {string[]}
 */
export function loadFavorites(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return [];
  try {
    const saved = storage.getItem(FAVORITES_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves favorited tool IDs array to storage.
 * @param {string[]} favorites
 * @param {Storage|null} [storage]
 * @returns {string[]}
 */
export function saveFavorites(favorites, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return favorites;
  try {
    storage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {
    // Handle storage errors
  }
  return favorites;
}

/**
 * Checks if a tool ID is in the favorited list.
 * @param {string} toolId
 * @param {string[]} favorites
 * @returns {boolean}
 */
export function isFavorite(toolId, favorites) {
  if (!toolId || !Array.isArray(favorites)) return false;
  return favorites.includes(toolId);
}

/**
 * Toggles a tool ID in the favorites list (adds if missing, removes if present).
 * @param {string} toolId
 * @param {string[]} favorites
 * @returns {string[]} Updated favorites array
 */
export function toggleFavorite(toolId, favorites) {
  if (!toolId) return Array.isArray(favorites) ? favorites : [];
  const list = Array.isArray(favorites) ? [...favorites] : [];
  const index = list.indexOf(toolId);
  if (index >= 0) {
    list.splice(index, 1);
  } else {
    list.push(toolId);
  }
  return list;
}

/**
 * Sorts array of items based on favorited status, preserving relative order.
 * @template T
 * @param {T[]} items
 * @param {(item: T) => string} getToolId
 * @param {string[]} favorites
 * @returns {T[]} Sorted items array
 */
export function sortItemsByFavorites(items, getToolId, favorites) {
  const favList = Array.isArray(favorites) ? favorites : [];
  return [...items].sort((a, b) => {
    const idA = getToolId(a);
    const idB = getToolId(b);
    const isFavA = favList.includes(idA);
    const isFavB = favList.includes(idB);
    if (isFavA && !isFavB) return -1;
    if (!isFavA && isFavB) return 1;
    return 0;
  });
}
