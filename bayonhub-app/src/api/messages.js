import client, { hasApiBackend } from "./client"

function unwrapEnvelope(payload) {
  if (payload && typeof payload === "object" && !Array.isArray(payload) && Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload.data
  }
  return payload
}

export async function getConversations() {
  if (!hasApiBackend()) return { conversations: [] }
  try {
    const response = await client.get("/api/conversations/mine")
    return unwrapEnvelope(response.data)
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}

export async function getThread(conversationId, params = {}) {
  if (!hasApiBackend()) return { messages: [] }
  try {
    const response = await client.get(`/api/conversations/${conversationId}/messages`, { params })
    return unwrapEnvelope(response.data)
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}

export async function sendMessageRest(conversationId, body) {
  if (!hasApiBackend()) return { ok: true }
  try {
    const response = await client.post(`/api/conversations/${conversationId}/messages`, { body })
    return unwrapEnvelope(response.data)
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}
