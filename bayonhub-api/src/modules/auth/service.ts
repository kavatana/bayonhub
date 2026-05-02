import type { Response } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import twilio from "twilio"
import { Prisma, Role, VerificationTier } from "@prisma/client"

import { generateAndStoreOTP, verifyAndConsumeOTP } from "../../lib/otp"
import { prisma } from "../../lib/prisma"

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
}

export const SAFE_USER_SELECT = {
  id: true,
  phone: true,
  email: true,
  name: true,
  avatarUrl: true,
  bio: true,
  language: true,
  role: true,
  verificationTier: true,
  isActive: true,
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
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  })
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
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
): Promise<SafeUser> {
  const existing = await prisma.user.findUnique({ where: { phone }, select: { id: true } })
  if (existing) throw createHttpError(409, "Phone already in use")

  const user = await prisma.user.create({
    data: {
      phone,
      passwordHash: await bcrypt.hash(password, 12),
      name,
      language,
    },
    select: SAFE_USER_SELECT,
  })
  const tokens = await generateTokens(user.id, user.role, user.verificationTier)
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken)
  return user
}

export async function sendOTP(phone: string): Promise<{ success: true }> {
  const user = await prisma.user.findUnique({ where: { phone }, select: { id: true } })
  if (!user) throw createHttpError(404, "User not found")

  const code = await generateAndStoreOTP(phone)
  if (process.env.TWILIO_ACCOUNT_SID) {
    if (process.env.TWILIO_PHONE_NUMBER === phone) {
      console.error("[Twilio] FATAL: Cannot send SMS to the same number as TWILIO_PHONE_NUMBER")
      console.error("[Twilio] Fix: Set TWILIO_PHONE_NUMBER to a different number in Railway Variables")
      console.log("=".repeat(40))
      console.log(`  [DEV OTP FALLBACK] ${phone}: ${code}  `)
      console.log("=".repeat(40))
      return { success: true }
    }
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
      await client.messages.create({
        to: phone,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: `BayonHub OTP: ${code}`,
      })
    } catch (error) {
      console.warn("[Twilio] OTP send failed:", error instanceof Error ? error.message : error)
      console.log("=".repeat(40))
      console.log(`  [DEV OTP FALLBACK] ${phone}: ${code}  `)
      console.log("=".repeat(40))
    }
  } else {
    console.warn("[Twilio] Not configured — OTP logged to console only. Set TWILIO_* vars for production.")
    console.log("=".repeat(40))
    console.log(`  [DEV OTP] ${phone}: ${code}  `)
    console.log("=".repeat(40))
  }
  return { success: true }
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
      verificationTier: VerificationTier.PHONE,
    },
    select: SAFE_USER_SELECT,
  })
}

export async function loginUser(
  res: Response,
  phone: string,
  password: string,
): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user) throw createHttpError(401, "Invalid credentials")

  const match = await bcrypt.compare(password, user.passwordHash)
  if (!match) throw createHttpError(401, "Invalid credentials")

  const tokens = await generateTokens(user.id, user.role, user.verificationTier)
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken)

  const { passwordHash: _passwordHash, ...safeUser } = user
  return safeUser
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
): Promise<SafeUser> {
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
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken)
  return user
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
