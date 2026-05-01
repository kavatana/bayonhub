import { get as idbGet, set as idbSet, del as idbDel, clear as idbClear, keys as idbKeys } from 'idb-keyval';

/**
 * Synchronous storage for small settings and UI state.
 * Uses localStorage.
 */
export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return fallback
      return JSON.parse(raw)
    } catch {
      console.warn(`[storage] Failed to parse key "${key}" - returning fallback`)
      return fallback
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        console.error("[storage] localStorage quota exceeded - consider using asyncStorage for this data")
        this.evictOldest()
        return false
      }
      console.warn(`[storage] Failed to set key "${key}"`, error)
      return false
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch {
      // Keep cleanup best-effort
    }
  },

  evictOldest() {
    const evictable = ["bayonhub:recentlyViewed", "bayonhub:feedback", "bayonhub:notifications"]
    evictable.forEach((key) => this.remove(key))
  },

  clear(prefix = "bayonhub:") {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => this.remove(key))
  },
}

/**
 * Asynchronous storage for large datasets (listings, search indices, merchant profiles).
 * Uses IndexedDB via idb-keyval.
 * Recommended for data > 50KB or long-running cache.
 */
export const asyncStorage = {
  async get(key, fallback = null) {
    try {
      const value = await idbGet(key);
      return value ?? fallback;
    } catch (error) {
      console.warn(`[asyncStorage] Error reading "${key}"`, error);
      return fallback;
    }
  },

  async set(key, value) {
    try {
      await idbSet(key, value);
      return true;
    } catch (error) {
      console.error(`[asyncStorage] Error writing "${key}"`, error);
      return false;
    }
  },

  async remove(key) {
    try {
      await idbDel(key);
      return true;
    } catch {
      return false;
    }
  },

  async clear() {
    try {
      await idbClear();
      return true;
    } catch {
      return false;
    }
  },

  async keys() {
    try {
      return await idbKeys();
    } catch {
      return [];
    }
  }
}
