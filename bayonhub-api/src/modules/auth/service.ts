import type { Response } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { Prisma, Role, VerificationTier } from "@prisma/client"

import { generateAndStoreOTP, verifyAndConsumeOTP } from "../../lib/otp"
import { generateUserSlug } from "../../lib/slug"
import { sendLocalSms } from "../../lib/sms"
import { prisma } from "../../lib/prisma"
import { redis } from "../../config/redis"

const isProduction = process.env.NODE_ENV === "production"

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  domain: isProduction ? ".bayonhub.com" : undefined,
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

  const tokens = await generateTokens(user.id, user.role, user.verificationTier)
  setAuthCookies(res, tokens)
  return { user: { ...user, slug }, accessToken: tokens.accessToken }
}

export async function sendOTP(phone: string): Promise<{ success: true }> {
  const user = await prisma.user.findUnique({ where: { phone }, select: { id: true } })
  if (!user) throw createHttpError(404, "User not found")

  const code = await generateAndStoreOTP(phone)
  await sendLocalSms(phone, code)
  
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
  if (!otp) throw createHttpError(400, "Invalid or expired OTP")

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

  // Clear existing sessions to force re-login on other devices
  await redis.del(`refresh_token:${user.id}`)

  return { success: true }
}

export async function loginUser(
  res: Response,
  phone: string,
  password: string,
): Promise<{ user: SafeUser; accessToken: string }> {
  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user) throw createHttpError(401, "Invalid credentials")
  const banned = user.banReason && (!user.bannedUntil || user.bannedUntil > new Date())
  if (banned) throw createHttpError(403, "Account suspended")

  const match = await bcrypt.compare(password, user.passwordHash)
  if (!match) throw createHttpError(401, "Invalid credentials")

  const tokens = await generateTokens(user.id, user.role, user.verificationTier)
  setAuthCookies(res, tokens)
  const { passwordHash: _passwordHash, ...safeUser } = user
  return { user: safeUser, accessToken: tokens.accessToken }
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
  if (!stored || stored.expiresAt < new Date()) {
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

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: SAFE_USER_SELECT,
  })
  if (!user) throw createHttpError(404, "User not found")
  return user
}
