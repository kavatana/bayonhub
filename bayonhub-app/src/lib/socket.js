import { io } from "socket.io-client"
import { API_BASE_URL } from "../api/client"
import { useUIStore } from "../store/useUIStore"

let socket = null
const processedEvents = new Set()

function trackMessage(message) {
  if (!message?.id || processedEvents.has(message.id)) return
  processedEvents.add(message.id)
  if (processedEvents.size > 100) {
    const first = processedEvents.values().next().value
    processedEvents.delete(first)
  }
  useUIStore.getState().addMessage(message)
  useUIStore.getState().incrementUnreadCount()
}

export function getSocket() {
  if (!API_BASE_URL) return null
  if (!socket) connectSocket()
  return socket
}

export function connectSocket() {
  if (!API_BASE_URL) return null
  if (socket?.connected) return socket
  if (!socket) {
    socket = io(API_BASE_URL, {
      autoConnect: false,
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    })
  }
  socket.off("message:receive", trackMessage)
  socket.on("message:receive", trackMessage)
  socket.connect()
  return socket
}

export function disconnectSocket() {
  if (!socket) return
  socket.off("message:receive", trackMessage)
  if (socket.connected) socket.disconnect()
  socket = null
  processedEvents.clear()
}

export function sendMessage(payload) {
  getSocket()?.emit("message:send", payload)
}

export function markMessageRead(messageId) {
  getSocket()?.emit("message:read", { messageId })
}

export function sendTyping(receiverId) {
  getSocket()?.emit("message:typing", { receiverId })
}
