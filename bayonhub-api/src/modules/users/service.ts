import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import { Prisma } from "@prisma/client"

import { prisma } from "../../lib/prisma"
import { processAndUpload } from "../../lib/s3"
import { getTelegramBotUsername } from "../../lib/telegram"

const CAMBODIA_PHONE_REGEX = /^\+855[1-9][0-9]{7,8}$/

const USER_PROFILE_SELECT = {
  id: true,
  phone: true,
  email: true,
  name: true,
  slug: true,
  avatarUrl: true,
  bio: true,
  language: true,
  province: true,
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

function createHttpError(status: number, message: string): Error & { status: number } {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

function createPlusRequiredError(): Error & { status: number; publicError: string; code: string } {
  const error = new Error("Plus feature") as Error & { status: number; publicError: string; code: string }
  error.status = 403
  error.publicError = "PLUS_REQUIRED"
  error.code = "PLUS_REQUIRED"
  return error
}

export async function isUserPlus(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isLifetimePlus: true, plusUntil: true },
  })
  return Boolean(user?.isLifetimePlus || (user?.plusUntil && user.plusUntil > new Date()))
}

function userIsPlusMember(user: { isLifetimePlus?: boolean | null; plusUntil?: Date | null }) {
  return Boolean(user.isLifetimePlus || (user.plusUntil && user.plusUntil > new Date()))
}

export async function getSavedListings(userId: string, cursor?: string, limit = 20) {
  const take = Math.min(limit, 50)
  const savedListings = await prisma.savedListing.findMany({
    where: { userId },
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        include: {
          images: { take: 1, orderBy: { order: "asc" } },
          seller: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              verificationTier: true,
              createdAt: true,
              phoneVerifiedAt: true,
            },
          },
        },
      },
    },
  })
  const nextCursor =
    savedListings.length === take ? savedListings[savedListings.length - 1]?.id || null : null
  return { savedListings, nextCursor }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_PROFILE_SELECT,
  })
  if (!user) throw createHttpError(404, "User not found")

  const [totalListings, totalViews] = await Promise.all([
    prisma.listing.count({ where: { sellerId: userId, status: { not: "REMOVED" } } }),
    prisma.listing.aggregate({
      where: { sellerId: userId, status: { not: "REMOVED" } },
      _sum: { viewCount: true },
    }),
  ])

  return {
    ...user,
    isPlusMember: userIsPlusMember(user),
    avatar: user.avatarUrl,
    memberSince: user.createdAt,
    totalListings,
    totalViews: totalViews._sum.viewCount || 0,
  }
}

function makeReferralCode(userId: string) {
  return `BH${userId.replace(/-/g, "").slice(0, 8).toUpperCase()}`
}

export async function getReferralSummary(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  })
  if (!user) throw createHttpError(404, "User not found")
  const [referralCount, rewardCount] = await Promise.all([
    prisma.referral.count({ where: { referrerId: userId } }),
    prisma.referral.count({ where: { referrerId: userId, rewardGiven: true } }),
  ])
  return {
    referralCode: user.referralCode,
    referralCount,
    rewardEarned: rewardCount > 0,
  }
}

export async function generateReferralCode(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, referralCode: true },
  })
  if (!user) throw createHttpError(404, "User not found")
  if (user.referralCode) return { referralCode: user.referralCode }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referralCode = attempt === 0
      ? makeReferralCode(user.id)
      : `BH${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { referralCode },
        select: { referralCode: true },
      })
      return { referralCode: updated.referralCode }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue
      throw error
    }
  }
  throw createHttpError(500, "Could not generate referral code")
}

export async function followSeller(followerId: string, sellerId: string) {
  if (followerId === sellerId) throw createHttpError(400, "Cannot follow yourself")
  const seller = await prisma.user.findUnique({ where: { id: sellerId }, select: { id: true } })
  if (!seller) throw createHttpError(404, "Seller not found")
  const follow = await prisma.follow.upsert({
    where: { followerId_sellerId: { followerId, sellerId } },
    update: {},
    create: { followerId, sellerId },
  })
  const followersCount = await prisma.follow.count({ where: { sellerId } })
  return { follow, followersCount }
}

export async function unfollowSeller(followerId: string, sellerId: string) {
  await prisma.follow
    .delete({ where: { followerId_sellerId: { followerId, sellerId } } })
    .catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return null
      throw error
    })
  const followersCount = await prisma.follow.count({ where: { sellerId } })
  return { success: true, followersCount }
}

export async function getFollowing(userId: string) {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          slug: true,
          avatarUrl: true,
          isVerifiedSeller: true,
          plusUntil: true,
          isLifetimePlus: true,
          verificationTier: true,
          listings: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { images: { take: 1, orderBy: { order: "asc" } } },
          },
          _count: { select: { sellerFollowers: true } },
        },
      },
    },
  })
  return {
    following: follows.map((follow) => ({
      id: follow.id,
      followedAt: follow.createdAt,
      seller: {
        ...follow.seller,
        isPlusMember: userIsPlusMember(follow.seller),
        followersCount: follow.seller._count.sellerFollowers,
        latestListing: follow.seller.listings[0]
          ? {
              ...follow.seller.listings[0],
              seller: {
                id: follow.seller.id,
                name: follow.seller.name,
                slug: follow.seller.slug,
                avatarUrl: follow.seller.avatarUrl,
                isVerifiedSeller: follow.seller.isVerifiedSeller,
                verificationTier: follow.seller.verificationTier,
                isPlusMember: userIsPlusMember(follow.seller),
                followersCount: follow.seller._count.sellerFollowers,
              },
            }
          : null,
      },
    })),
  }
}

export async function getFollowerSummary(sellerId: string) {
  const followersCount = await prisma.follow.count({ where: { sellerId } })
  return { followersCount }
}

export async function getPublicUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...USER_PROFILE_SELECT,
      listings: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 12,
        include: { images: { take: 1, orderBy: { order: "asc" } } },
      },
      _count: { select: { listings: true, sellerFollowers: true } },
    },
  })
  if (!user) throw createHttpError(404, "User not found")
  return {
    ...user,
    isPlusMember: userIsPlusMember(user),
    followersCount: user._count.sellerFollowers,
    totalListings: user._count.listings,
  }
}

export async function updateProfile(
  userId: string,
  data: {
    name?: string
    phone?: string
    bio?: string
    avatar?: string
    avatarUrl?: string
    language?: string
    province?: string
    whatsapp?: string
    whatsappNumber?: string
    telegram?: string
    telegramUsername?: string
    telegramHandle?: string
  },
) {
  if (data.phone && !CAMBODIA_PHONE_REGEX.test(data.phone)) {
    throw createHttpError(400, "Invalid Cambodia phone number")
  }
  const contactLinkRequested = [
    data.whatsapp,
    data.whatsappNumber,
    data.telegram,
    data.telegramUsername,
    data.telegramHandle,
  ].some((value) => typeof value === "string" && value.trim().length > 0)
  if (contactLinkRequested && !(await isUserPlus(userId))) throw createPlusRequiredError()

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: typeof data.name === "string" ? data.name.trim() : undefined,
      phone: data.phone,
      bio: data.bio,
      avatarUrl: data.avatarUrl || data.avatar,
      language: data.language,
      province: data.province,
    },
    select: USER_PROFILE_SELECT,
  })
  return getMe(user.id)
}

export async function updatePassword(
  userId: string,
  oldPassword: string | undefined,
  newPassword: string,
) {
  if (!oldPassword) throw createHttpError(400, "Current password is required")
  if (!newPassword || newPassword.length < 8) {
    throw createHttpError(400, "New password must be at least 8 characters")
  }
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw createHttpError(404, "User not found")

  const matches = await bcrypt.compare(oldPassword, user.passwordHash)
  if (!matches) throw createHttpError(400, "Current password is incorrect")

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  })
  return { success: true }
}

export async function uploadAvatar(userId: string, file: Express.Multer.File) {
  const result = await processAndUpload(file.buffer, `avatars/${userId}/${randomUUID()}.webp`)
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: result.url },
    select: USER_PROFILE_SELECT,
  })
  return { url: result.url, user: { ...user, avatar: user.avatarUrl } }
}

export async function submitSellerVerification(
  userId: string,
  files: { idFront?: Express.Multer.File[]; idBack?: Express.Multer.File[] },
) {
  const idFront = files.idFront?.[0]
  const idBack = files.idBack?.[0]
  if (!idFront) throw createHttpError(400, "idFront is required")
  const [frontUpload, backUpload] = await Promise.all([
    processAndUpload(idFront.buffer, `verifications/${userId}/${randomUUID()}-front.webp`),
    idBack ? processAndUpload(idBack.buffer, `verifications/${userId}/${randomUUID()}-back.webp`) : null,
  ])
  const request = await prisma.verificationRequest.upsert({
    where: { userId },
    update: {
      idFrontUrl: frontUpload.url,
      idBackUrl: backUpload?.url || null,
      status: "pending",
      adminNote: null,
      submittedAt: new Date(),
      reviewedAt: null,
    },
    create: {
      userId,
      idFrontUrl: frontUpload.url,
      idBackUrl: backUpload?.url || null,
    },
  })
  return { status: request.status, request }
}

export async function getSellerVerification(userId: string) {
  const request = await prisma.verificationRequest.findUnique({ where: { userId } })
  return {
    status: request?.status || "not_submitted",
    adminNote: request?.adminNote || null,
    request,
  }
}

export async function createTelegramConnectLink(userId: string) {
  const botUsername = await getTelegramBotUsername()
  return {
    botUsername,
    link: `https://t.me/${botUsername}?start=${encodeURIComponent(userId)}`,
  }
}

export async function handleTelegramWebhook(update: unknown) {
  const message = (update as { message?: { text?: unknown; chat?: { id?: unknown } } })?.message
  const text = typeof message?.text === "string" ? message.text.trim() : ""
  const chatId = message?.chat?.id === undefined ? "" : String(message.chat.id)
  const [, userId] = text.match(/^\/start\s+([0-9a-f-]{36})$/i) || []
  if (!userId || !chatId) return { success: true, connected: false }

  await prisma.user.update({
    where: { id: userId },
    data: { telegramChatId: chatId },
  })
  return { success: true, connected: true }
}

export async function submitAppeal(userId: string, reason: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, banReason: true, bannedUntil: true },
  })
  if (!user) throw createHttpError(404, "User not found")
  const banned = user.banReason && (!user.bannedUntil || user.bannedUntil > new Date())
  if (!banned) throw createHttpError(400, "Only banned users can submit an appeal")
  const activeAppeal = await prisma.appeal.findFirst({
    where: { userId, status: "pending" },
    select: { id: true },
  })
  if (activeAppeal) throw createHttpError(409, "Appeal already pending")
  const appeal = await prisma.appeal.create({
    data: { userId, reason: reason.trim() },
  })
  return { appeal }
}
