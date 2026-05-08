import { env } from "../config/env"

const BAYONHUB_BOT_FALLBACK = "BayonHub_Bot"

let botUsernamePromise: Promise<string> | null = null

function telegramApiUrl(method: string) {
  return `https://api.telegram.org/bot${env.telegramBotToken}/${method}`
}

export async function getTelegramBotUsername() {
  if (!env.telegramBotToken) return BAYONHUB_BOT_FALLBACK
  if (!botUsernamePromise) {
    botUsernamePromise = fetch(telegramApiUrl("getMe"))
      .then((response) => response.json() as Promise<{ ok?: boolean; result?: { username?: string } }>)
      .then((payload) => payload.result?.username || BAYONHUB_BOT_FALLBACK)
      .catch(() => BAYONHUB_BOT_FALLBACK)
  }
  return botUsernamePromise
}

export async function sendTelegramMessage(chatId: string | null | undefined, text: string, link?: string) {
  if (!env.telegramBotToken || !chatId) return false
  try {
    const response = await fetch(telegramApiUrl("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: link
          ? {
              inline_keyboard: [[{ text: "Open BayonHub", url: link }]],
            }
          : undefined,
      }),
    })
    return response.ok
  } catch {
    return false
  }
}
