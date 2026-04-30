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
        console.error("[storage] localStorage quota exceeded - clearing old data")
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
      // Keep cleanup best-effort for privacy and logout paths.
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
