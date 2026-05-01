import { env } from "../config/env"

interface TelegramResponse {
  ok: boolean
  description?: string
  result?: unknown
}

function telegramApiUrl(method: string) {
  if (!env.telegramBotToken) throw new Error("Telegram bot token is not configured")
  return `https://api.telegram.org/bot${env.telegramBotToken}/${method}`
}

export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  if (!env.telegramBotToken) {
    console.warn("[Telegram] Bot token missing; skipping Telegram notification")
    return false
  }

  try {
    const response = await fetch(telegramApiUrl("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    })
    const data = (await response.json()) as TelegramResponse
    if (!response.ok || !data.ok) {
      console.warn("[Telegram] sendMessage failed", data.description || response.status)
      return false
    }

    return true
  } catch (error) {
    console.warn("[Telegram] sendMessage error", error)
    return false
  }
}
