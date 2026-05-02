import axios from "axios"

export async function sendLocalSms(phone: string, code: string): Promise<void> {
  // DEV fallback: log to console in non-production, or if we want to test locally
  if (process.env.NODE_ENV !== "production") {
    console.log("=".repeat(40))
    console.log(`  [DEV OTP] ${phone}: ${code}  `)
    console.log("=".repeat(40))
    return
  }

  const privateKey = process.env.PLASGATE_PRIVATE_KEY
  const secret = process.env.PLASGATE_SECRET
  const senderId = process.env.PLASGATE_SENDER_ID || "Verify"
  // Default URL but can be overridden
  const apiUrl = process.env.PLASGATE_API_URL || "https://cloudapi.plasgate.com/rest/send"

  if (!privateKey || !secret) {
    console.warn("⚠️ PLASGATE_PRIVATE_KEY or PLASGATE_SECRET is not set. Falling back to console log.")
    console.log(`[SMS FALLBACK] ${phone}: ${code}`)
    return
  }

  try {
    // Strip the "+" from the phone number as Plasgate usually expects just the country code and number
    const cleanPhone = phone.replace("+", "")

    // Plasgate REST API Format
    // https://cloudapi.plasgate.com/rest/send?private_key=YOUR_PRIVATE_KEY
    await axios.post(
      `${apiUrl}?private_key=${privateKey}`,
      {
        to: cleanPhone,
        content: `Your BayonHub verification code is: ${code}. Valid for 10 minutes.`,
        sender: senderId,
      },
      {
        headers: {
          "X-Secret": secret,
          "Content-Type": "application/json",
        },
      }
    )
    console.log(`✅ SMS sent to ${phone} via PlasGate`)
  } catch (error) {
    console.error(`❌ Failed to send SMS to ${phone} via PlasGate`, error instanceof Error ? error.message : error)
    throw new Error("Failed to send SMS")
  }
}
