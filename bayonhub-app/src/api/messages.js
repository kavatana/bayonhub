import client, { hasApiBackend } from "./client"

export async function getConversations() {
  if (!hasApiBackend()) return { conversations: [] }
  try {
    const response = await client.get("/api/messages/conversations")
    return response.data
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}

export async function getThread(userId, params = {}) {
  if (!hasApiBackend()) return { messages: [] }
  try {
    const response = await client.get(`/api/messages/${userId}`, { params })
    return response.data
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}

export async function sendMessageRest(recipientId, content) {
  if (!hasApiBackend()) return { ok: true }
  try {
    const response = await client.post("/api/messages/send", { recipientId, content })
    return response.data
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}
