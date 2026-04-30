import client, { hasApiBackend } from "./client"

export async function getConversations() {
  if (!hasApiBackend()) return { conversations: [] }
  const response = await client.get("/api/messages/conversations")
  return response.data
}

export async function getThread(userId, params = {}) {
  if (!hasApiBackend()) return { messages: [] }
  const response = await client.get(`/api/messages/${userId}`, { params })
  return response.data
}
