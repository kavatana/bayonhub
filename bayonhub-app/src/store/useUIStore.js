import { create } from "zustand"
import { STORAGE_KEYS } from "../api/client"
import { storage } from "../lib/storage"

const UI_STORAGE_KEYS = {
  theme: "bayonhub:theme",
  selectedProvince: "bayonhub:selectedProvince",
  notifications: "bayonhub:notifications",
}

const seedNotifications = [
  {
    id: "seed-price-drop",
    type: "price_drop",
    titleKey: "dashboard.notificationPriceDropTitle",
    bodyKey: "dashboard.notificationPriceDropBody",
    listingId: 1001,
    read: false,
    createdAt: "2026-04-28T10:00:00+07:00",
  },
  {
    id: "seed-new-message",
    type: "new_message",
    titleKey: "dashboard.notificationNewMessageTitle",
    bodyKey: "dashboard.notificationNewMessageBody",
    listingId: 1005,
    read: false,
    createdAt: "2026-04-28T09:15:00+07:00",
  },
  {
    id: "seed-listing-view",
    type: "listing_view",
    titleKey: "dashboard.notificationListingViewTitle",
    bodyKey: "dashboard.notificationListingViewBody",
    listingId: 1002,
    read: false,
    createdAt: "2026-04-28T08:40:00+07:00",
  },
  {
    id: "seed-listing-approved",
    type: "listing_approved",
    titleKey: "dashboard.notificationListingApprovedTitle",
    bodyKey: "dashboard.notificationListingApprovedBody",
    listingId: 1003,
    read: true,
    createdAt: "2026-04-27T17:30:00+07:00",
  },
  {
    id: "seed-promo-expiry",
    type: "promo_expiry",
    titleKey: "dashboard.notificationPromoExpiryTitle",
    bodyKey: "dashboard.notificationPromoExpiryBody",
    listingId: 1002,
    read: true,
    createdAt: "2026-04-27T12:00:00+07:00",
  },
]

const initialNotifications = storage.get(UI_STORAGE_KEYS.notifications, seedNotifications)

export const useUIStore = create((set, get) => ({
  language: storage.get(STORAGE_KEYS.language, "km"),
  theme: storage.get(UI_STORAGE_KEYS.theme, "light"),
  selectedProvince: storage.get(UI_STORAGE_KEYS.selectedProvince, "all"),
  notifications: initialNotifications,
  notificationCount: initialNotifications.filter((notification) => !notification.read).length,
  conversations: storage.get(STORAGE_KEYS.messages, []),
  currentUserId: null,
  postModalOpen: false,
  authModalOpen: false,
  pendingAction: null,
  searchQuery: "",
  locationSelectorOpen: false,

  setLanguage: (language) => {
    storage.set(STORAGE_KEYS.language, language)
    document.documentElement.lang = language
    document.documentElement.classList.toggle("font-khmer", language === "km")
    set({ language })
  },

  toggleTheme: () => set(state => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light'
    storage.set(UI_STORAGE_KEYS.theme, newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    return { theme: newTheme }
  }),

  togglePostModal: (open = !get().postModalOpen) => {
    set({ postModalOpen: open })
  },

  toggleAuthModal: (open = !get().authModalOpen) => {
    set({ authModalOpen: open })
  },

  setPendingAction: (pendingAction) => {
    set({ pendingAction })
  },

  setSelectedProvince: (selectedProvince) => {
    storage.set(UI_STORAGE_KEYS.selectedProvince, selectedProvince)
    set({ selectedProvince })
  },

  setNotificationCount: (notificationCount) => {
    const ui = storage.get(STORAGE_KEYS.ui, {})
    storage.set(STORAGE_KEYS.ui, { ...ui, notificationCount })
    set({ notificationCount })
  },

  addNotification: (notification) => {
    const nextNotification = {
      id: notification.id || (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}`),
      read: false,
      createdAt: new Date().toISOString(),
      ...notification,
    }
    const notifications = [nextNotification, ...get().notifications]
    storage.set(UI_STORAGE_KEYS.notifications, notifications)
    set({
      notifications,
      notificationCount: notifications.filter((item) => !item.read).length,
    })
  },

  markRead: (id) => {
    const notifications = get().notifications.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification,
    )
    storage.set(UI_STORAGE_KEYS.notifications, notifications)
    set({
      notifications,
      notificationCount: notifications.filter((item) => !item.read).length,
    })
  },

  markAllRead: () => {
    const notifications = get().notifications.map((notification) => ({ ...notification, read: true }))
    storage.set(UI_STORAGE_KEYS.notifications, notifications)
    set({ notifications, notificationCount: 0 })
  },

  clearNotifications: () => {
    storage.set(UI_STORAGE_KEYS.notifications, [])
    set({ notifications: [], notificationCount: 0 })
  },

  incrementUnreadCount: () => {
    const notificationCount = get().notificationCount + 1
    const ui = storage.get(STORAGE_KEYS.ui, {})
    storage.set(STORAGE_KEYS.ui, { ...ui, notificationCount })
    set({ notificationCount })
  },

  setCurrentUserId: (currentUserId) => {
    set({ currentUserId })
  },

  addMessage: (message) => set((state) => {
    const allMessages = state.conversations.flatMap((conversation) => conversation.messages || [])
    if (allMessages.some((item) => item.id === message.id)) return state

    const convIndex = state.conversations.findIndex(
      (conversation) => conversation.partnerId === message.senderId || conversation.partnerId === message.receiverId,
    )

    if (convIndex === -1) {
      const partnerId = message.senderId === state.currentUserId ? message.receiverId : message.senderId
      const conversations = [
        {
          id: crypto.randomUUID(),
          partnerId,
          messages: [message],
          unreadCount: message.senderId !== state.currentUserId ? 1 : 0,
          lastMessage: message,
          updatedAt: message.createdAt,
        },
        ...state.conversations,
      ]
      storage.set(STORAGE_KEYS.messages, conversations)
      return { conversations }
    }

    const updated = [...state.conversations]
    const conversation = { ...updated[convIndex] }
    conversation.messages = [...(conversation.messages || []), message]
    conversation.lastMessage = message
    conversation.updatedAt = message.createdAt
    if (message.senderId !== state.currentUserId) {
      conversation.unreadCount = (conversation.unreadCount || 0) + 1
    }
    updated[convIndex] = conversation
    updated.splice(convIndex, 1)
    updated.unshift(conversation)
    storage.set(STORAGE_KEYS.messages, updated)
    return { conversations: updated }
  }),

  setSearchQuery: (searchQuery) => {
    set({ searchQuery })
  },

  toggleLocationSelector: (open = !get().locationSelectorOpen) => {
    set({ locationSelectorOpen: open })
  },
}))
