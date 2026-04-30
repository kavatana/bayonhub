import { storage } from "./storage"

class ClientRateLimiter {
  constructor() {
    this.actions = storage.get("bayonhub:actionLog", {})
  }

  canPerform(actionType, listingId, limits = {}) {
    const defaults = {
      CALL: { max: 5, windowMs: 60 * 60 * 1000 },
      WHATSAPP: { max: 10, windowMs: 60 * 60 * 1000 },
      TELEGRAM: { max: 10, windowMs: 60 * 60 * 1000 },
      CHAT: { max: 20, windowMs: 60 * 60 * 1000 },
      OFFER: { max: 3, windowMs: 24 * 60 * 60 * 1000 },
      REPORT: { max: 5, windowMs: 24 * 60 * 60 * 1000 },
    }
    const limit = { ...defaults[actionType], ...limits }
    const key = `${actionType}:${listingId}`
    const now = Date.now()
    const events = (this.actions[key] || []).filter((timestamp) => now - timestamp < limit.windowMs)
    return events.length < limit.max
  }

  record(actionType, listingId) {
    const key = `${actionType}:${listingId}`
    const now = Date.now()
    if (!this.actions[key]) this.actions[key] = []
    this.actions[key].push(now)
    this.actions[key] = this.actions[key].filter((timestamp) => now - timestamp < 24 * 60 * 60 * 1000)
    storage.set("bayonhub:actionLog", this.actions)
  }
}

export const rateLimiter = new ClientRateLimiter()
