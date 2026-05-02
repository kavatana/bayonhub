import axios from "axios"

export async function sendLocalSms(phone: string, code: string): Promise<void> {
  // DEV fallback: log to console in non-production, or if we want to test locally
  if (process.env.NODE_ENV !== "production") {
    console.log("=".repeat(40))
    console.log(`  [DEV OTP] ${phone}: ${code}  `)
    console.log("=".repeat(40))
    return
  }

  const apiUrl = process.env.LOCAL_SMS_API_URL
  const apiKey = process.env.LOCAL_SMS_API_KEY
  const senderId = process.env.LOCAL_SMS_SENDER_ID || "BayonHub"

  if (!apiUrl || !apiKey) {
    console.warn("⚠️ LOCAL_SMS_API_URL or LOCAL_SMS_API_KEY is not set. Falling back to console log.")
    console.log(`[SMS FALLBACK] ${phone}: ${code}`)
    return
  }

  try {
    // Example generic JSON payload. 
    // Replace this payload with your specific local SMS Gateway documentation.
    await axios.post(apiUrl, {
      apiKey: apiKey,
      sender: senderId,
      to: phone,
      message: `Your BayonHub verification code is: ${code}. Valid for 10 minutes.`,
    })
    console.log(`✅ SMS sent to ${phone} via Local Gateway`)
  } catch (error) {
    console.error(`❌ Failed to send SMS to ${phone}`, error instanceof Error ? error.message : error)
    throw new Error("Failed to send SMS")
  }
}
