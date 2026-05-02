import type { Request, Response } from "express"
import { redis } from "../../config/redis"
import { markOTPAsVerified } from "../../lib/otp"

export async function telegramWebhookHandler(req: Request, res: Response): Promise<void> {
  try {
    const update = req.body
    
    // Always respond 200 OK immediately to Telegram
    res.status(200).send("OK")

    if (!update || !update.message) return

    const message = update.message
    const chatId = message.chat.id

    // Check if it's a /start command
    if (message.text && message.text.startsWith("/start")) {
      await sendTelegramMessage(chatId, "Welcome to BayonHub! 🇰🇭\n\nPlease tap the button below to share your contact so we can verify your phone number and automatically log you in.", {
        reply_markup: {
          keyboard: [
            [{ text: "📱 Share Contact to Verify", request_contact: true }]
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      })
      return
    }

    // Check if user shared contact
    if (message.contact && message.contact.phone_number) {
      let phone = message.contact.phone_number
      if (!phone.startsWith("+")) {
        phone = "+" + phone
      }

      // Security check: ensure the user is sharing their own contact
      if (message.contact.user_id !== message.from.id) {
        await sendTelegramMessage(chatId, "Security error: You can only share your own contact.", {
          reply_markup: { remove_keyboard: true }
        })
        return
      }

      // Look up OTP in Redis (uses the exact key format from lib/otp.ts)
      const storedOtp = await redis.get(`otp:code:${phone}`)

      if (storedOtp) {
        await markOTPAsVerified(phone)
        await sendTelegramMessage(chatId, `✅ **Verification Successful!**\n\nYou are now logged into BayonHub. You can return to the website.`, {
          parse_mode: "Markdown",
          reply_markup: { remove_keyboard: true }
        })
      } else {
        await sendTelegramMessage(chatId, "We couldn't find a pending login for your phone number.\n\nPlease go to bayonhub.com and try again.", {
          reply_markup: { remove_keyboard: true }
        })
      }
      return
    }
  } catch (error) {
    console.error("[Telegram Webhook] Error:", error)
    if (!res.headersSent) {
      res.status(500).send("Error")
    }
  }
}

async function sendTelegramMessage(chatId: number, text: string, options: any = {}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    console.error("[Telegram Webhook] TELEGRAM_BOT_TOKEN is not set")
    return
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...options,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("[Telegram Webhook] Failed to send message:", err)
    }
  } catch (error) {
    console.error("[Telegram Webhook] Fetch error:", error)
  }
}
