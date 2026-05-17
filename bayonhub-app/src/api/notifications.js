import client, { hasApiBackend, readStorage, writeStorage } from "./client"

const NOTIFICATIONS_KEY = "bayonhub:notifications"

function unwrapEnvelope(payload) {
  if (payload && typeof payload === "object" && !Array.isArray(payload) && Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload.data
  }
  return payload
}

function mockNotifications() {
  return readStorage(NOTIFICATIONS_KEY, [])
}

function normalizeNotification(notification) {
  return {
    id: notification.id,
    type: notification.type || "digest",
    title: notification.title || "",
    body: notification.body || "",
    read: Boolean(notification.read),
    link: notification.link || null,
    createdAt: notification.createdAt || new Date().toISOString(),
  }
}

export async function fetchNotifications({ page = 1, limit = 20, filter = "all" } = {}) {
  if (!hasApiBackend()) {
    const all = mockNotifications().map(normalizeNotification)
    const filtered = filter === "unread" ? all.filter((item) => !item.read) : all
    const start = (page - 1) * limit
    return {
      data: filtered.slice(start, start + limit),
      total: filtered.length,
      unreadTotal: all.filter((item) => !item.read).length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
    }
  }
  try {
    const response = await client.get("/api/notifications", { params: { page, limit, filter } })
    const data = unwrapEnvelope(response.data)
    return {
      ...data,
      data: (data.data || []).map(normalizeNotification),
    }
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}

export async function markAllNotificationsRead() {
  if (!hasApiBackend()) {
    writeStorage(NOTIFICATIONS_KEY, mockNotifications().map((item) => ({ ...item, read: true })))
    return { success: true }
  }
  const response = await client.patch("/api/notifications/read-all")
  return unwrapEnvelope(response.data)
}

export async function markNotificationRead(id) {
  if (!hasApiBackend()) {
    const next = mockNotifications().map((item) => String(item.id) === String(id) ? { ...item, read: true } : item)
    writeStorage(NOTIFICATIONS_KEY, next)
    return next.find((item) => String(item.id) === String(id)) || null
  }
  const response = await client.patch(`/api/notifications/${id}/read`)
  return normalizeNotification(unwrapEnvelope(response.data))
}

export async function deleteNotification(id) {
  if (!hasApiBackend()) {
    writeStorage(NOTIFICATIONS_KEY, mockNotifications().filter((item) => String(item.id) !== String(id)))
    return { success: true }
  }
  const response = await client.delete(`/api/notifications/${id}`)
  return unwrapEnvelope(response.data)
}

export async function fetchVapidPublicKey() {
  if (!hasApiBackend()) return import.meta.env.VITE_VAPID_PUBLIC_KEY || ""
  const response = await client.get("/api/notifications/vapid-public-key")
  const data = unwrapEnvelope(response.data)
  return data.publicKey || ""
}

export async function subscribePush(subscription) {
  if (!hasApiBackend()) return { success: true }
  const response = await client.post("/api/notifications/subscribe", subscription)
  return unwrapEnvelope(response.data)
}
