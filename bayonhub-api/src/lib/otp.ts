import crypto from "crypto"

import { redis } from "../config/redis"

const OTP_TTL = 300
const RATE_KEY = (phone: string) => `otp:rate:${phone}`
const OTP_KEY = (phone: string) => `otp:code:${phone}`
const VERIFIED_KEY = (phone: string) => `otp:verified:${phone}`

export async function generateAndStoreOTP(phone: string): Promise<string> {
  const rateCount = await redis.incr(RATE_KEY(phone))
  if (rateCount === 1) await redis.expire(RATE_KEY(phone), 600)
  if (rateCount > 3) {
    throw new Error("Too many OTP requests. Try again in 10 minutes.")
  }

  const code = crypto.randomInt(100000, 999999).toString()
  await redis.set(OTP_KEY(phone), code, "EX", OTP_TTL)
  return code
}

export async function verifyAndConsumeOTP(
  phone: string,
  code: string,
): Promise<boolean> {
  const stored = await redis.get(OTP_KEY(phone))
  if (!stored || stored !== code) return false
  await redis.del(OTP_KEY(phone))
  return true
}

export async function markOTPAsVerified(phone: string): Promise<void> {
  await redis.set(VERIFIED_KEY(phone), "true", "EX", OTP_TTL)
  // Delete the old code key since we verified it natively
  await redis.del(OTP_KEY(phone))
}

export async function checkAndConsumeVerifiedOTP(phone: string): Promise<boolean> {
  const verified = await redis.get(VERIFIED_KEY(phone))
  if (verified === "true") {
    await redis.del(VERIFIED_KEY(phone))
    return true
  }
  return false
}
