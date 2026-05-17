import crypto from "crypto"

import { redis } from "../config/redis"

const OTP_TTL = 300
const ATTEMPT_TTL = 15 * 60
const MAX_VERIFY_ATTEMPTS = 5
const RATE_KEY = (phone: string) => `otp:rate:${phone}`
const OTP_KEY = (phone: string) => `otp:code:${phone}`
const ATTEMPTS_KEY = (phone: string) => `otp:attempts:${phone}`

function createOtpLockoutError(): Error & { statusCode: number } {
  const error = new Error("Too many attempts. Request a new code.") as Error & { statusCode: number }
  error.statusCode = 429
  return error
}

async function recordFailedVerifyAttempt(phone: string): Promise<void> {
  const key = ATTEMPTS_KEY(phone)
  const attempts = await redis.incr(key)
  const ttl = await redis.ttl(key)
  if (ttl === -1) await redis.expire(key, ATTEMPT_TTL)
  if (attempts >= MAX_VERIFY_ATTEMPTS) {
    await redis.del(OTP_KEY(phone))
    throw createOtpLockoutError()
  }
}

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
  if (!stored || stored !== code) {
    await recordFailedVerifyAttempt(phone)
    return false
  }
  await redis.del(OTP_KEY(phone))
  await redis.del(ATTEMPTS_KEY(phone))
  return true
}
