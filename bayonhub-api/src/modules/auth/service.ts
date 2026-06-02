import type { Response } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { Prisma, Role, VerificationTier } from "@prisma/client"

import { generateAndStoreOTP, verifyAndConsumeOTP } from "../../lib/otp"
import { sendPasswordResetEmail, sendWelcomeEmail } from "../../lib/emailTemplates"
import { generateUserSlug } from "../../lib/slug"
import { sendLocalSms } from "../../lib/sms"
import { prisma } from "../../lib/prisma"
import { redis } from "../../config/redis"

import { safeUser } from "../../utils/safeUser"

const isProduction = process.env.NODE_ENV === "production"

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  domain: undefined,
  path: "/",
} as const

export const SAFE_USER_SELECT = {
  id: true,
  phone: true,
  email: true,
  name: true,
  slug: true,
  avatarUrl: true,
  bio: true,
  language: true,
  role: true,
  verificationTier: true,
  isActive: true,
  isAdmin: true,
  banReason: true,
  bannedUntil: true,
  phoneVerified: true,
  isVerifiedSeller: true,
  lastSeen: true,
  responseRate: true,
  telegramChatId: true,
  referralCode: true,
  plusUntil: true,
  isLifetimePlus: true,
  phoneVerifiedAt: true,
  idVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect

export type SafeUser = Prisma.UserGetPayload<{ select: typeof SAFE_USER_SELECT }>

function createHttpError(status: number, message: string): Error & { status: number } {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

function createStatusCodeError(statusCode: number, message: string): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number }
  error.statusCode = statusCode
  return error
}

const DB_OTP_ATTEMPT_TTL = 15 * 60
const MAX_DB_OTP_VERIFY_ATTEMPTS = 5
const DB_OTP_ATTEMPTS_KEY = (phone: string) => `otp:db:attempts:${phone}`

async function recordFailedDbOtpAttempt(phone: string): Promise<void> {
  const key = DB_OTP_ATTEMPTS_KEY(phone)
  const attempts = await redis.incr(key)
  const ttl = await redis.ttl(key)
  if (ttl === -1) await redis.expire(key, DB_OTP_ATTEMPT_TTL)
  if (attempts >= MAX_DB_OTP_VERIFY_ATTEMPTS) {
    await prisma.phoneOTP.updateMany({
      where: {
        phone,
        used: false,
        expiresAt: { gt: new Date() },
      },
      data: { used: true },
    })
    throw createStatusCodeError(429, "Too many attempts. Request a new code.")
  }
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
): void {
  res.cookie("accessToken", tokens.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  })
  res.cookie("refreshToken", tokens.refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  })
}

async function storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
  await prisma.refreshToken.create({
    data: {
      userId,
      token: await bcrypt.hash(refreshToken, 12),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })
}

export async function generateTokens(
  userId: string,
  role: Role,
  verificationTier: VerificationTier,
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = jwt.sign(
    { userId, role, verificationTier },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" },
  )
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "30d",
  })
  await storeRefreshToken(userId, refreshToken)
  return { accessToken, refreshToken }
}

export async function registerUser(
  res: Response,
  phone: string,
  password: string,
  name: string,
  language = "en",
  referralCode?: string,
): Promise<{ user: SafeUser; accessToken: string }> {
  const existing = await prisma.user.findUnique({ where: { phone }, select: { id: true } })
  if (existing) throw createHttpError(409, "Phone already in use")

  const referrer = referralCode
    ? await prisma.user.findUnique({
        where: { referralCode },
        select: { id: true },
      })
    : null

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        phone,
        passwordHash: await bcrypt.hash(password, 12),
        name,
        language,
      },
      select: SAFE_USER_SELECT,
    })
    if (referrer && referrer.id !== created.id) {
      await tx.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: created.id,
        },
      })
    }
    return created
  })

  const slug = await generateUserSlug(name, user.id)
  await prisma.user.update({ where: { id: user.id }, data: { slug } })

  if (user.email) {
    sendWelcomeEmail(user.email, user.name).catch(() => {})
  }

  const tokens = await generateTokens(user.id, user.role, user.verificationTier)
  setAuthCookies(res, tokens)
  return { user: { ...user, slug }, accessToken: tokens.accessToken }
}

export async function recordLoginFailure(ip: string): Promise<void> {
  // Disabled Redis dependency for portfolio stability
}

export async function clearLoginFailures(ip: string): Promise<void> {
  // Disabled Redis dependency for portfolio stability
}

export async function checkLoginFailures(ip: string): Promise<void> {
  // Disabled Redis dependency for portfolio stability
}

export async function sendOTP(phone: string): Promise<{ success: true }> {
  const user = await prisma.user.findUnique({ where: { phone }, select: { id: true, email: true, name: true } })
  if (!user) throw createHttpError(404, "User not found")

  const code = await generateAndStoreOTP(phone)
  await sendLocalSms(phone, code)
  if (user.email) {
    sendPasswordResetEmail(user.email, user.name, code).catch(() => {})
  }
  
  return { success: true }
}

export async function sendPhoneOTP(phone: string): Promise<{ success: true; code?: string }> {
  const recentCount = await prisma.phoneOTP.count({
    where: {
      phone,
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
    },
  })
  if (recentCount >= 3) throw createHttpError(429, "Too many OTP requests")

  const code = String(Math.floor(100000 + Math.random() * 900000))
  await prisma.phoneOTP.create({
    data: {
      phone,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })
  console.info(`[DEV OTP] ${phone}: ${code}`)

  if (isProduction) {
    throw createHttpError(501, "SMS provider required for production OTP")
  }
  return { success: true, code }
}

export async function verifyPhoneOTP(
  userId: string | undefined,
  phone: string,
  code: string,
): Promise<{ success: true; user?: SafeUser }> {
  const otp = await prisma.phoneOTP.findFirst({
    where: {
      phone,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  })
  if (!otp) {
    await recordFailedDbOtpAttempt(phone)
    throw createHttpError(400, "Invalid or expired OTP")
  }

  await redis.del(DB_OTP_ATTEMPTS_KEY(phone))
  await prisma.phoneOTP.update({ where: { id: otp.id }, data: { used: true } })
  if (!userId) return { success: true }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      phone,
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
      verificationTier: VerificationTier.PHONE,
    },
    select: SAFE_USER_SELECT,
  })
  return { success: true, user }
}

export async function verifyOTP(phone: string, code: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { phone }, select: { id: true } })
  if (!user) throw createHttpError(404, "User not found")

  const valid = await verifyAndConsumeOTP(phone, code)
  if (!valid) throw createHttpError(400, "Invalid or expired OTP")

  return prisma.user.update({
    where: { phone },
    data: {
      phoneVerifiedAt: new Date(),
      phoneVerified: true,
      verificationTier: VerificationTier.PHONE,
    },
    select: SAFE_USER_SELECT,
  })
}

function isRealVerifiedPhone(user: { phone: string; phoneVerified?: boolean | null; phoneVerifiedAt?: Date | null }): boolean {
  return Boolean(
    user.phoneVerified &&
    user.phoneVerifiedAt &&
    !user.phone.startsWith("google-") &&
    !user.phone.startsWith("facebook-"),
  )
}

export async function sendAdminTwoFactorOTP(userId: string): Promise<{ success: true }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, phoneVerified: true, phoneVerifiedAt: true, isAdmin: true },
  })
  if (!user || !user.isAdmin) throw createHttpError(403, "Forbidden")
  if (!isRealVerifiedPhone(user)) throw createHttpError(400, "Verified phone required for admin 2FA")

  const code = await generateAndStoreOTP(user.phone)
  await sendLocalSms(user.phone, code)
  return { success: true }
}

export async function verifyAdminTwoFactorOTP(userId: string, code: string): Promise<{ success: true }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, phoneVerified: true, phoneVerifiedAt: true, isAdmin: true },
  })
  if (!user || !user.isAdmin) throw createHttpError(403, "Forbidden")
  if (!isRealVerifiedPhone(user)) throw createHttpError(400, "Verified phone required for admin 2FA")

  const valid = await verifyAndConsumeOTP(user.phone, code)
  if (!valid) throw createHttpError(400, "Invalid or expired OTP")
  await redis.set(`admin:2fa:${user.id}`, "1", "EX", 43_200)
  return { success: true }
}

export async function resetPassword(
  phone: string,
  code: string,
  newPassword: string
): Promise<{ success: true }> {
  const user = await prisma.user.findUnique({ where: { phone }, select: { id: true } })
  if (!user) throw createHttpError(404, "User not found")

  const valid = await verifyAndConsumeOTP(phone, code)
  if (!valid) throw createHttpError(400, "Invalid or expired OTP")

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { phone },
    data: {
      passwordHash: hashedPassword,
      phoneVerifiedAt: new Date(),
      phoneVerified: true,
      verificationTier: VerificationTier.PHONE,
    },
  })

  // F1.6 — Session invalidation: delete all refresh tokens so other devices are signed out
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } })
  // Clear legacy redis key as well
  await redis.del(`refresh_token:${user.id}`)

  return { success: true }
}

export async function loginUser(
  res: Response,
  phone: string,
  password: string,
  ip?: string,
): Promise<{ user: SafeUser; accessToken: string }> {
  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user) {
    if (ip) await recordLoginFailure(ip)
    throw createHttpError(401, "Invalid credentials")
  }
  const banned = user.banReason && (!user.bannedUntil || user.bannedUntil > new Date())
  if (banned) throw createHttpError(403, "Account suspended")

  const match = await bcrypt.compare(password, user.passwordHash)
  if (!match) {
    if (ip) await recordLoginFailure(ip)
    throw createHttpError(401, "Invalid credentials")
  }

  if (ip) await clearLoginFailures(ip)
  const tokens = await generateTokens(user.id, user.role, user.verificationTier)
  setAuthCookies(res, tokens)
  return { user: safeUser(user), accessToken: tokens.accessToken }
}

async function findStoredRefreshToken(
  userId: string,
  refreshToken: string,
): Promise<{ id: string; expiresAt: Date } | null> {
  const tokens = await prisma.refreshToken.findMany({
    where: { userId },
    select: { id: true, token: true, expiresAt: true },
  })

  for (const token of tokens) {
    const matches = await bcrypt.compare(refreshToken, token.token)
    if (matches) return { id: token.id, expiresAt: token.expiresAt }
  }
  return null
}

export async function refreshAuthTokens(
  res: Response,
  refreshTokenFromCookie?: string,
): Promise<{ user: SafeUser; accessToken: string }> {
  if (!refreshTokenFromCookie) throw createHttpError(401, "Unauthorized")

  const payload = jwt.verify(refreshTokenFromCookie, process.env.JWT_REFRESH_SECRET!) as {
    userId: string
  }
  const stored = await findStoredRefreshToken(payload.userId, refreshTokenFromCookie)
  if (!stored) {
    // TODO: implement token family tracking for full replay protection
    throw createHttpError(401, "Invalid refresh token")
  }
  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: stored.id } })
    throw createHttpError(401, "Invalid refresh token")
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: SAFE_USER_SELECT,
  })
  if (!user || !user.isActive) throw createHttpError(401, "Unauthorized")

  await prisma.refreshToken.delete({ where: { id: stored.id } })
  const tokens = await generateTokens(user.id, user.role, user.verificationTier)
  setAuthCookies(res, tokens)
  return { user, accessToken: tokens.accessToken }
}

export async function logoutUser(refreshTokenFromCookie?: string): Promise<{ success: true }> {
  if (refreshTokenFromCookie) {
    try {
      const payload = jwt.verify(refreshTokenFromCookie, process.env.JWT_REFRESH_SECRET!) as {
        userId: string
      }
      const stored = await findStoredRefreshToken(payload.userId, refreshTokenFromCookie)
      if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } })
    } catch {
      // Logout should still clear cookies for invalid or expired refresh tokens.
    }
  }
  return { success: true }
}

export function clearAuthCookies(res: Response): void {
  res.cookie("accessToken", "", { ...cookieOptions, maxAge: 0 })
  res.cookie("refreshToken", "", { ...cookieOptions, maxAge: 0 })
}

// F1.7 — Logout from all devices: delete all refresh tokens for this user
export async function logoutAllSessions(userId: string): Promise<{ message: string }> {
  await prisma.refreshToken.deleteMany({ where: { userId } })
  return { message: "Logged out from all devices" }
}

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: SAFE_USER_SELECT,
  })
  if (!user) throw createHttpError(404, "User not found")
  return user
}
