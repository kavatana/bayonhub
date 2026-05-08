import { create } from "zustand"
import {
  deleteNotification as deleteNotificationApi,
  fetchNotifications as fetchNotificationsApi,
  fetchVapidPublicKey as fetchVapidPublicKeyApi,
  markAllNotificationsRead as markAllNotificationsReadApi,
  markNotificationRead as markNotificationReadApi,
  subscribePush as subscribePushApi,
} from "../api/notifications"

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadTotal: 0,
  total: 0,
  page: 1,
  totalPages: 1,
  loading: false,
  error: null,
  pushEnabled: false,

  fetchNotifications: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const result = await fetchNotificationsApi(params)
      set({
        notifications: result.data || [],
        unreadTotal: result.unreadTotal || 0,
        total: result.total || 0,
        page: result.page || 1,
        totalPages: result.totalPages || 1,
        loading: false,
      })
      return result
    } catch (error) {
      set({ error: error.message, loading: false })
      return null
    }
  },

  markAllRead: async () => {
    await markAllNotificationsReadApi()
    set((state) => ({
      notifications: state.notifications.map((item) => ({ ...item, read: true })),
      unreadTotal: 0,
    }))
  },

  markRead: async (id) => {
    await markNotificationReadApi(id)
    set((state) => {
      const wasUnread = state.notifications.some((item) => String(item.id) === String(id) && !item.read)
      const notifications = state.notifications.map((item) =>
        String(item.id) === String(id) ? { ...item, read: true } : item,
      )
      return {
        notifications,
        unreadTotal: wasUnread ? Math.max(0, state.unreadTotal - 1) : state.unreadTotal,
      }
    })
  },

  deleteNotification: async (id) => {
    await deleteNotificationApi(id)
    set((state) => {
      const notifications = state.notifications.filter((item) => String(item.id) !== String(id))
      const removedUnread = state.notifications.some((item) => String(item.id) === String(id) && !item.read)
      return {
        notifications,
        total: Math.max(0, state.total - 1),
        unreadTotal: removedUnread ? Math.max(0, state.unreadTotal - 1) : state.unreadTotal,
      }
    })
  },

  refreshUnread: async () => {
    const result = await get().fetchNotifications({ page: 1, limit: 10 })
    return result?.unreadTotal || 0
  },

  enablePushNotifications: async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      set({ error: "notif.pushUnsupported" })
      return { success: false }
    }
    try {
      const permission = await window.Notification.requestPermission()
      if (permission !== "granted") return { success: false }
      const publicKey = await fetchVapidPublicKeyApi()
      if (!publicKey) return { success: false }
      const registration =
        (await navigator.serviceWorker.getRegistration()) ||
        (await navigator.serviceWorker.register("/sw.js"))
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      await subscribePushApi(subscription.toJSON())
      set({ pushEnabled: true, error: null })
      return { success: true }
    } catch (error) {
      set({ error: error.message })
      return { success: false, error: error.message }
    }
  },
}))
