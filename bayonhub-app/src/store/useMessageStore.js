import { create } from "zustand"
import client from "../api/client"
import { API_BASE_URL } from "../api/client"
import { storage } from "../lib/storage"

const CONVERSATIONS_KEY = "bayonhub:conversations"
const MESSAGES_KEY = "bayonhub:messages"
const UNREAD_KEY = "bayonhub:unreadCount"

export const useMessageStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  unreadCount: storage.get(UNREAD_KEY, 0),
  loading: false,
  error: null,

  fetchConversations: async () => {
    set({ loading: true, error: null })
    try {
      if (API_BASE_URL) {
        const { data } = await client.get("/api/conversations/mine")
        const conversations = data.conversations || []
        set({ conversations, loading: false })
        return conversations
      }
      // localStorage fallback
      const conversations = storage.get(CONVERSATIONS_KEY, [])
      set({ conversations, loading: false })
      return conversations
    } catch (error) {
      set({ error: error.message, loading: false })
      return []
    }
  },

  fetchMessages: async (conversationId) => {
    set({ loading: true, error: null })
    try {
      if (API_BASE_URL) {
        const { data } = await client.get(`/api/conversations/${conversationId}/messages`)
        set({
          messages: data.messages || [],
          currentConversation: data.conversation || null,
          loading: false,
        })
        return data.messages || []
      }
      // localStorage fallback
      const allMessages = storage.get(MESSAGES_KEY, {})
      const messages = allMessages[conversationId] || []
      set({ messages, loading: false })
      return messages
    } catch (error) {
      set({ error: error.message, loading: false })
      return []
    }
  },

  sendMessage: async (conversationId, body) => {
    try {
      if (API_BASE_URL) {
        const { data } = await client.post(`/api/conversations/${conversationId}/messages`, { body })
        set((state) => ({ messages: [...state.messages, data] }))
        return data
      }
      // localStorage fallback
      const message = {
        id: crypto.randomUUID(),
        conversationId,
        senderId: "local-user",
        body,
        read: false,
        createdAt: new Date().toISOString(),
        sender: { id: "local-user", name: "You", avatarUrl: null },
      }
      const allMessages = storage.get(MESSAGES_KEY, {})
      const existing = allMessages[conversationId] || []
      allMessages[conversationId] = [...existing, message]
      storage.set(MESSAGES_KEY, allMessages)
      set((state) => ({ messages: [...state.messages, message] }))
      return message
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  startConversation: async (listingId, sellerId) => {
    try {
      if (API_BASE_URL) {
        const { data } = await client.post("/api/conversations", { listingId, sellerId })
        set({ currentConversation: data })
        return data
      }
      // localStorage fallback
      const conversations = storage.get(CONVERSATIONS_KEY, [])
      const existing = conversations.find(
        (c) => c.listingId === listingId && c.sellerId === sellerId,
      )
      if (existing) {
        set({ currentConversation: existing })
        return existing
      }
      const conversation = {
        id: crypto.randomUUID(),
        listingId,
        buyerId: "local-user",
        sellerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        lastMessage: null,
        unreadCount: 0,
      }
      const updated = [conversation, ...conversations]
      storage.set(CONVERSATIONS_KEY, updated)
      set({ currentConversation: conversation, conversations: updated })
      return conversation
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  markAsRead: async (conversationId) => {
    try {
      if (API_BASE_URL) {
        await client.patch(`/api/conversations/${conversationId}/read`)
      }
      // Update local unread count
      set((state) => {
        const conversations = state.conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c,
        )
        const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
        storage.set(UNREAD_KEY, totalUnread)
        return { conversations, unreadCount: totalUnread }
      })
    } catch (error) {
      set({ error: error.message })
    }
  },

  fetchUnreadCount: async () => {
    try {
      if (API_BASE_URL) {
        const { data } = await client.get("/api/notifications/unread-count")
        const count = data.count || 0
        storage.set(UNREAD_KEY, count)
        set({ unreadCount: count })
        return count
      }
      // localStorage fallback
      const count = storage.get(UNREAD_KEY, 0)
      set({ unreadCount: count })
      return count
    } catch {
      // Non-critical — silently use cached value
      return get().unreadCount
    }
  },
}))
