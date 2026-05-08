import { randomUUID } from "crypto"
import {
  LeadType,
  ListingStatus,
  Prisma,
  ReportReason,
  ReportStatus,
  Role,
} from "@prisma/client"

import { prisma } from "../../lib/prisma"
import { processAndUpload } from "../../lib/s3"
import { generateUniqueSlug } from "../../lib/slug"
import { notifyUser } from "../messages/notifications.service"
import { isUserPlus } from "../users/service"
import { listingSchema } from "./validators"

export const SAFE_LISTING_INCLUDE = {
  images: { take: 1, orderBy: { order: "asc" as const } },
  seller: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      verificationTier: true,
      isVerifiedSeller: true,
      responseRate: true,
      lastSeen: true,
      plusUntil: true,
      isLifetimePlus: true,
      createdAt: true,
      phoneVerifiedAt: true,
      _count: { select: { listings: true, sellerFollowers: true } },
    },
  },
} satisfies Prisma.ListingInclude

const FULL_LISTING_INCLUDE = {
  images: { orderBy: { order: "asc" as const } },
  seller: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      phone: true,
      bio: true,
      verificationTier: true,
      isVerifiedSeller: true,
      responseRate: true,
      lastSeen: true,
      plusUntil: true,
      isLifetimePlus: true,
      createdAt: true,
      phoneVerifiedAt: true,
      _count: { select: { listings: true, sellerFollowers: true } },
    },
  },
} satisfies Prisma.ListingInclude

const viewedSessions = new Set<string>()

export interface ListingFilters {
  category?: string
  subcategory?: string
  province?: string
  district?: string
  minPrice?: number
  maxPrice?: number
  q?: string
  promoted?: boolean
  cursor?: string
  limit?: number
}

export interface ListingInput {
  title?: string
  titleKm?: string
  description?: string
  descriptionKm?: string
  price?: string | number
  currency?: string
  negotiable?: string | boolean
  condition?: string
  categorySlug?: string
  subcategorySlug?: string
  province?: string
  district?: string
  addressDetail?: string
  lat?: string | number
  lng?: string | number
  facets?: unknown
  promoted?: string | boolean
  urgent?: string | boolean
  previousPrice?: string | number
  discountPercent?: string | number
  topSeller?: string | boolean
  facebookPage?: string
}

export interface ListingSearchFilters {
  q?: string
  category?: string
  location?: string
  priceMin?: number
  priceMax?: number
  condition?: string
  sortBy?: string
  page?: number
  limit?: number
}

function createHttpError(status: number, message: string): Error & { status: number } {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

function createLimitError(code: string, message: string): Error & { status: number; publicError: string; code: string } {
  const error = new Error(message) as Error & { status: number; publicError: string; code: string }
  error.status = 403
  error.publicError = code
  error.code = code
  return error
}

function parseNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : undefined
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === "") return undefined
  if (typeof value === "boolean") return value
  return value === "true" || value === "1"
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createHttpError(400, `${field} is required`)
  }
  return value.trim()
}

function parseJsonObject(value: unknown): Prisma.JsonObject | typeof Prisma.JsonNull {
  if (value === undefined || value === null || value === "") return Prisma.JsonNull
  const parsed = typeof value === "string" ? JSON.parse(value) : value
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Prisma.JsonObject)
    : Prisma.JsonNull
}

function normalizeListingInput(input: unknown): ListingInput & { images?: unknown; id?: unknown } {
  const data = { ...((input as Record<string, unknown>) || {}) } as ListingInput & {
    categoryId?: string
    location?: string
    metadata?: unknown
    images?: unknown
    id?: unknown
  }
  if (data.categoryId && !data.categorySlug) data.categorySlug = data.categoryId
  if (data.location && !data.province) data.province = data.location
  if (data.metadata !== undefined && data.facets === undefined) data.facets = data.metadata
  if (data.price !== undefined && Number(data.price) === 0 && data.negotiable === undefined) {
    data.negotiable = true
  }
  return data
}

function imageUrlsFromInput(input: unknown): string[] {
  const images = (input as { images?: unknown })?.images
  if (!Array.isArray(images)) return []
  return images.filter((image): image is string => typeof image === "string" && image.trim().length > 0)
}

function imageCreateData(
  uploadedImages: Awaited<ReturnType<typeof processAndUpload>>[],
  imageUrls: string[],
) {
  return [
    ...imageUrls.map((url) => ({ url, thumbUrl: url })),
    ...uploadedImages.map((image) => ({ url: image.url, thumbUrl: image.thumbUrl })),
  ].map((image, index) => ({
    ...image,
    order: index,
  }))
}

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function listingExpiryDate(isPlus: boolean, now = new Date()) {
  const days = isPlus ? 90 : 30
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
}

function sellerIsPlusMember(seller?: { isLifetimePlus?: boolean | null; plusUntil?: Date | null }) {
  return Boolean(seller?.isLifetimePlus || (seller?.plusUntil && seller.plusUntil > new Date()))
}

function decorateListing<T extends { seller?: { isLifetimePlus?: boolean | null; plusUntil?: Date | null } | null }>(
  listing: T,
) {
  const isPlusMember = sellerIsPlusMember(listing.seller || undefined)
  return {
    ...listing,
    isPlusMember,
    seller: listing.seller ? { ...listing.seller, isPlusMember } : listing.seller,
  }
}

function decorateListings<T extends { seller?: { isLifetimePlus?: boolean | null; plusUntil?: Date | null } | null }>(
  listings: T[],
) {
  return listings.map((listing) => decorateListing(listing))
}

function plusRankForListing(listing: { seller?: { isLifetimePlus?: boolean | null; plusUntil?: Date | null } | null }) {
  return sellerIsPlusMember(listing.seller || undefined) ? 1 : 0
}

function bumpedTodayRank(bumpedAt?: Date | null, now = new Date()) {
  return bumpedAt && bumpedAt >= startOfUtcDay(now) ? 1 : 0
}

function buildListingMutationData(data: ListingInput): Prisma.ListingUpdateInput {
  const updateData: Prisma.ListingUpdateInput = {}
  if (data.title !== undefined) updateData.title = requireString(data.title, "title")
  if (data.titleKm !== undefined) updateData.titleKm = data.titleKm || null
  if (data.description !== undefined) {
    updateData.description = requireString(data.description, "description")
  }
  if (data.descriptionKm !== undefined) updateData.descriptionKm = data.descriptionKm || null
  if (data.price !== undefined) updateData.price = parseNumber(data.price)
  if (data.currency !== undefined) updateData.currency = requireString(data.currency, "currency")
  if (data.negotiable !== undefined) updateData.negotiable = parseBoolean(data.negotiable)
  if (data.condition !== undefined) updateData.condition = data.condition || null
  if (data.categorySlug !== undefined) {
    updateData.categorySlug = requireString(data.categorySlug, "categorySlug")
  }
  if (data.subcategorySlug !== undefined) updateData.subcategorySlug = data.subcategorySlug || null
  if (data.province !== undefined) updateData.province = requireString(data.province, "province")
  if (data.district !== undefined) updateData.district = data.district || null
  if (data.addressDetail !== undefined) updateData.addressDetail = data.addressDetail || null
  if (data.lat !== undefined) updateData.lat = parseNumber(data.lat)
  if (data.lng !== undefined) updateData.lng = parseNumber(data.lng)
  if (data.facets !== undefined) {
    updateData.facets = parseJsonObject(data.facets)
  }
  if (data.promoted !== undefined) updateData.promoted = parseBoolean(data.promoted)
  if (data.urgent !== undefined) updateData.urgent = parseBoolean(data.urgent)
  if (data.previousPrice !== undefined) updateData.previousPrice = parseNumber(data.previousPrice)
  if (data.discountPercent !== undefined) {
    updateData.discountPercent = parseNumber(data.discountPercent)
  }
  if (data.topSeller !== undefined) updateData.topSeller = parseBoolean(data.topSeller)
  if (data.facebookPage !== undefined) updateData.facebookPage = data.facebookPage || null
  return updateData
}

function formatUsd(value: unknown) {
  return `$${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
}

async function notifyPriceDrop(listingId: string, title: string, oldPrice: unknown, newPrice: unknown) {
  const recentPriceDrop = await prisma.notification.findFirst({
    where: {
      type: "price_drop",
      link: `/listing/${listingId}`,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    select: { id: true },
  })
  if (recentPriceDrop) return

  const savedUsers = await prisma.savedListing.findMany({
    where: { listingId },
    select: {
      userId: true,
      user: { select: { telegramChatId: true } },
    },
  })
  await Promise.all(
    savedUsers.map((saved) =>
      notifyUser({
        userId: saved.userId,
        type: "price_drop",
        title: "Price dropped on a saved listing",
        body: `${title} dropped from ${formatUsd(oldPrice)} to ${formatUsd(newPrice)}`,
        link: `/listing/${listingId}`,
        telegramChatId: saved.user.telegramChatId,
      }),
    ),
  )
}

async function rewardReferralIfFirstListing(userId: string) {
  const activeListingCount = await prisma.listing.count({
    where: { sellerId: userId, status: ListingStatus.ACTIVE },
  })
  if (activeListingCount !== 1) return

  const referral = await prisma.referral.findUnique({
    where: { referredId: userId },
    include: {
      referrer: { select: { id: true, plusUntil: true, telegramChatId: true } },
    },
  })
  if (!referral || referral.rewardGiven) return

  const now = new Date()
  const baseDate = referral.referrer.plusUntil && referral.referrer.plusUntil > now
    ? referral.referrer.plusUntil
    : now
  const plusUntil = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000)
  await prisma.$transaction([
    prisma.user.update({
      where: { id: referral.referrerId },
      data: { plusUntil },
    }),
    prisma.referral.update({
      where: { id: referral.id },
      data: { rewardGiven: true },
    }),
  ])
  await notifyUser({
    userId: referral.referrerId,
    type: "digest",
    title: "Your referral posted their first listing!",
    body: "You got 1 month Plus free.",
    link: "/account",
    telegramChatId: referral.referrer.telegramChatId,
  })
}

async function notifyFollowersOfNewListing(listing: Prisma.ListingGetPayload<{ include: typeof FULL_LISTING_INCLUDE }>) {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todaysListings = await prisma.listing.count({
    where: {
      sellerId: listing.sellerId,
      status: ListingStatus.ACTIVE,
      createdAt: { gte: todayStart },
    },
  })
  if (todaysListings > 3) return

  const followers = await prisma.follow.findMany({
    where: { sellerId: listing.sellerId },
    include: {
      follower: { select: { id: true, telegramChatId: true } },
    },
  })
  await Promise.all(
    followers.map((follow) =>
      notifyUser({
        userId: follow.followerId,
        type: "new_listing",
        title: `${listing.seller.name} posted a new listing`,
        body: `${listing.title} — ${formatUsd(listing.price)}`,
        link: `/listing/${listing.id}`,
        telegramChatId: follow.follower.telegramChatId,
      }),
    ),
  )
}

function buildWhere(filters: ListingFilters, includeCursor: boolean): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = {
    status: ListingStatus.ACTIVE,
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ],
  }
  if (filters.category) where.categorySlug = filters.category
  if (filters.subcategory) where.subcategorySlug = filters.subcategory
  if (filters.province) where.province = filters.province
  if (filters.district) where.district = filters.district
  if (filters.promoted !== undefined) where.promoted = filters.promoted
  if (filters.cursor && includeCursor) where.id = { lt: filters.cursor }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {
      gte: filters.minPrice,
      lte: filters.maxPrice,
    }
  }
  return where
}

function buildHomepageWhere(filters: ListingFilters): Prisma.ListingWhereInput {
  return buildWhere({ ...filters, province: undefined, cursor: undefined }, false)
}

function normalizeSearchCategory(category: string): Pick<Prisma.ListingWhereInput, "categorySlug" | "subcategorySlug"> {
  if (category === "cars") return { categorySlug: "vehicles", subcategorySlug: "cars" }
  if (category === "phones") return { categorySlug: "phones-tablets" }
  if (category === "property_rent") return { categorySlug: "house-land", subcategorySlug: "rent" }
  if (category === "property_sale") return { categorySlug: "house-land", subcategorySlug: "sale" }
  return { categorySlug: category }
}

function buildSearchWhere(filters: ListingSearchFilters): Prisma.ListingWhereInput {
  const q = filters.q?.trim()
  const where: Prisma.ListingWhereInput = {
    status: ListingStatus.ACTIVE,
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ]
  }
  if (filters.category) Object.assign(where, normalizeSearchCategory(filters.category))
  if (filters.location) where.province = filters.location
  if (filters.condition) where.condition = { equals: filters.condition, mode: "insensitive" }
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    where.price = {
      gte: filters.priceMin,
      lte: filters.priceMax,
    }
  }

  return where
}

function searchOrderBy(sortBy = "newest"): Prisma.ListingOrderByWithRelationInput {
  if (sortBy === "price_asc" || sortBy === "priceLow") return { price: "asc" }
  if (sortBy === "price_desc" || sortBy === "priceHigh") return { price: "desc" }
  if (sortBy === "most_viewed" || sortBy === "views") return { viewCount: "desc" }
  return { createdAt: "desc" }
}

function buildSearchSqlWhere(filters: ListingSearchFilters) {
  const clauses: Prisma.Sql[] = [Prisma.sql`l.status = 'ACTIVE'`]
  const q = filters.q?.trim()
  if (q) {
    clauses.push(Prisma.sql`(l.title ILIKE ${`%${q}%`} OR l.description ILIKE ${`%${q}%`})`)
  }
  if (filters.category) {
    const category = normalizeSearchCategory(filters.category)
    if (category.categorySlug) clauses.push(Prisma.sql`l."categorySlug" = ${category.categorySlug}`)
    if (category.subcategorySlug) clauses.push(Prisma.sql`l."subcategorySlug" = ${category.subcategorySlug}`)
  }
  if (filters.location) clauses.push(Prisma.sql`l.province = ${filters.location}`)
  if (filters.condition) clauses.push(Prisma.sql`LOWER(l.condition) = LOWER(${filters.condition})`)
  if (filters.priceMin !== undefined) clauses.push(Prisma.sql`l.price >= ${filters.priceMin}`)
  if (filters.priceMax !== undefined) clauses.push(Prisma.sql`l.price <= ${filters.priceMax}`)
  return Prisma.join(clauses, " AND ")
}

function sortRankedListings<T extends {
  bumpedAt?: Date | null
  createdAt?: Date | string | null
  seller?: { isLifetimePlus?: boolean | null; plusUntil?: Date | null } | null
}>(listings: T[]) {
  return [...listings].sort((a, b) => {
    const bumpedDelta = bumpedTodayRank(b.bumpedAt) - bumpedTodayRank(a.bumpedAt)
    if (bumpedDelta !== 0) return bumpedDelta
    const plusDelta = plusRankForListing(b) - plusRankForListing(a)
    if (plusDelta !== 0) return plusDelta
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  })
}

export async function getListings(filters: ListingFilters) {
  const limit = Math.min(filters.limit || 50, 50)
  const where = buildWhere(filters, true)
  const countWhere = buildWhere(filters, false)
  const q = filters.q?.trim()

  if (q) {
    const todayStart = startOfUtcDay()
    const searchResults = await prisma.$queryRaw<{ id: string }[]>`
      SELECT l.id
      FROM "Listing" l
      JOIN "User" u ON u.id = l."sellerId"
      WHERE (
        l.search_vector @@ websearch_to_tsquery('english', ${q})
        OR l.title % ${q}
        OR l.title ILIKE ${`%${q}%`}
      )
      AND l.status = 'ACTIVE'
      AND (l."expiresAt" IS NULL OR l."expiresAt" > NOW())
      ORDER BY 
        CASE WHEN l."bumpedAt" >= ${todayStart} THEN 0 ELSE 1 END,
        CASE WHEN u."isLifetimePlus" = true OR u."plusUntil" > NOW() THEN 0 ELSE 1 END,
        ts_rank(l.search_vector, websearch_to_tsquery('english', ${q})) DESC,
        similarity(l.title, ${q}) DESC,
        l."createdAt" DESC
      LIMIT ${limit}
    `
    const ids = searchResults.map((result) => result.id)
    if (ids.length === 0) return { listings: [], total: 0, nextCursor: null }

    const listings = await prisma.listing.findMany({
      where: { id: { in: ids }, ...where },
      include: SAFE_LISTING_INCLUDE,
    })
    const listingsById = new Map(listings.map((listing) => [listing.id, listing]))
    const orderedListings = ids
      .map((id) => listingsById.get(id))
      .filter((listing): listing is NonNullable<typeof listing> => Boolean(listing))
    const countResult = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "Listing" l
      WHERE (
        l.search_vector @@ websearch_to_tsquery('english', ${q})
        OR l.title % ${q}
        OR l.title ILIKE ${`%${q}%`}
      )
      AND l.status = 'ACTIVE'
      AND (l."expiresAt" IS NULL OR l."expiresAt" > NOW())
    `
    const total = Number(countResult[0]?.count || 0)
    const nextCursor =
      orderedListings.length === limit ? orderedListings[orderedListings.length - 1]?.id || null : null
    return { listings: decorateListings(orderedListings), total, nextCursor }
  }

  const homepageWhere = buildHomepageWhere(filters)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const listingsPromise =
    filters.province && !filters.cursor
      ? Promise.all([
          prisma.listing.findMany({
            where,
            orderBy: [{ promoted: "desc" }, { createdAt: "desc" }],
            take: limit,
            include: SAFE_LISTING_INCLUDE,
          }),
          prisma.listing.findMany({
            where: { ...homepageWhere, province: { not: filters.province } },
            orderBy: [{ promoted: "desc" }, { createdAt: "desc" }],
            take: limit,
            include: SAFE_LISTING_INCLUDE,
          }),
        ]).then(([provinceListings, otherListings]) => [
          ...provinceListings,
          ...otherListings.slice(0, Math.max(0, limit - provinceListings.length)),
        ])
      : prisma.listing.findMany({
          where,
          orderBy: [{ promoted: "desc" }, { createdAt: "desc" }],
          take: limit,
          include: SAFE_LISTING_INCLUDE,
        })

  const [listings, total, featured, recent, newToday, trending] = await Promise.all([
    listingsPromise,
    prisma.listing.count({ where: countWhere }),
    prisma.listing.findMany({
      where: homepageWhere,
      orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
      take: 6,
      include: SAFE_LISTING_INCLUDE,
    }),
    prisma.listing.findMany({
      where: homepageWhere,
      orderBy: { createdAt: "desc" },
      take: 12,
      include: SAFE_LISTING_INCLUDE,
    }),
    prisma.listing.count({
      where: {
        ...homepageWhere,
        createdAt: { gte: today },
      },
    }),
    prisma.listing.groupBy({
      by: ["categorySlug"],
      where: homepageWhere,
      _count: { categorySlug: true },
      orderBy: { _count: { categorySlug: "desc" } },
      take: 8,
    }),
  ])
  const rankedListings = sortRankedListings(listings)
  const nextCursor = rankedListings.length === limit ? rankedListings[rankedListings.length - 1]?.id || null : null
  return {
    listings: decorateListings(rankedListings),
    total,
    nextCursor,
    featured: decorateListings(featured),
    recent: decorateListings(recent),
    newToday,
    trending: trending.map((item) => ({
      categoryId: item.categorySlug,
      count: item._count.categorySlug,
    })),
  }
}

export async function searchListings(filters: ListingSearchFilters) {
  const page = Math.max(1, filters.page || 1)
  const limit = Math.min(Math.max(1, filters.limit || 20), 50)
  const skip = (page - 1) * limit
  const where = buildSearchWhere(filters)
  const orderBy = searchOrderBy(filters.sortBy)
  const rankedSort = !filters.sortBy || filters.sortBy === "newest"

  if (rankedSort) {
    const sqlWhere = buildSearchSqlWhere(filters)
    const start = startOfUtcDay()
    const [idRows, countRows] = await Promise.all([
      prisma.$queryRaw<{ id: string }[]>`
        SELECT l.id
        FROM "Listing" l
        JOIN "User" u ON u.id = l."sellerId"
        WHERE ${sqlWhere}
        ORDER BY
          CASE WHEN l."bumpedAt" >= ${start} THEN 0 ELSE 1 END,
          CASE WHEN u."isLifetimePlus" = true OR u."plusUntil" > NOW() THEN 0 ELSE 1 END,
          l."createdAt" DESC
        OFFSET ${skip}
        LIMIT ${limit}
      `,
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count
        FROM "Listing" l
        JOIN "User" u ON u.id = l."sellerId"
        WHERE ${sqlWhere}
      `,
    ])
    const ids = idRows.map((row) => row.id)
    const listings = ids.length
      ? await prisma.listing.findMany({
          where: { id: { in: ids } },
          include: SAFE_LISTING_INCLUDE,
        })
      : []
    const byId = new Map(listings.map((listing) => [listing.id, listing]))
    const data = ids
      .map((id) => byId.get(id))
      .filter((listing): listing is NonNullable<typeof listing> => Boolean(listing))
    const total = Number(countRows[0]?.count || 0)
    return {
      data: decorateListings(data),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    }
  }

  const [data, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: SAFE_LISTING_INCLUDE,
    }),
    prisma.listing.count({ where }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return {
    data: decorateListings(data),
    total,
    page,
    limit,
    totalPages,
  }
}

export async function getListingLocations() {
  const rows = await prisma.listing.findMany({
    where: {
      status: ListingStatus.ACTIVE,
      province: { not: "" },
    },
    distinct: ["province"],
    select: { province: true },
    orderBy: { province: "asc" },
  })
  return rows.map((row) => row.province).filter(Boolean)
}

export async function getListing(idOrSlug: string) {
  const listing = await prisma.listing.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: FULL_LISTING_INCLUDE,
  })
  if (!listing || listing.status !== ListingStatus.ACTIVE) {
    throw createHttpError(404, "Listing not found")
  }

  const [totalActiveListings, totalSellerConversations, sellerIsPlusMember] = await Promise.all([
    prisma.listing.count({
      where: {
        sellerId: listing.sellerId,
        status: ListingStatus.ACTIVE,
      },
    }),
    prisma.conversation.count({
      where: { sellerId: listing.sellerId },
    }),
    isUserPlus(listing.sellerId),
  ])

  return {
    ...listing,
    isPlusMember: sellerIsPlusMember,
    seller: {
      ...listing.seller,
      isPlusMember: sellerIsPlusMember,
      avatar: listing.seller.avatarUrl,
      memberSince: listing.seller.createdAt,
      totalActiveListings,
      totalSellerConversations,
      followersCount: listing.seller._count.sellerFollowers,
      telegramUsername: null,
      whatsappNumber: listing.seller.phone,
    },
  }
}

export async function createListing(
  userId: string,
  input: unknown,
  files: Express.Multer.File[] = [],
  triggerGrowthRewards = true,
) {
  const [user, plus] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { phoneVerified: true },
    }),
    isUserPlus(userId),
  ])
  if (!user?.phoneVerified) throw createHttpError(403, "Phone verification required to post listings")
  const normalizedInput = normalizeListingInput(input)
  const data = listingSchema.parse(normalizedInput)
  const imageUrls = imageUrlsFromInput(normalizedInput)
  const imageCount = files.length + imageUrls.length
  const photoLimit = plus ? 20 : 5
  if (imageCount > photoLimit) {
    throw createLimitError(
      "PHOTO_LIMIT_REACHED",
      plus
        ? "Plus accounts allow up to 20 photos per listing."
        : "Free accounts allow 5 photos per listing. Upgrade to Plus for up to 20.",
    )
  }
  if (!plus) {
    const todayCount = await prisma.listing.count({
      where: {
        sellerId: userId,
        createdAt: { gte: startOfUtcDay() },
      },
    })
    if (todayCount >= 5) {
      throw createLimitError(
        "LISTING_LIMIT_REACHED",
        "Free accounts can post 5 listings per day. Upgrade to Plus for unlimited.",
      )
    }
  }
  const slug = await generateUniqueSlug(data.title)
  const uploadedImages = await Promise.all(
    files.map((file) => processAndUpload(file.buffer, `listings/${randomUUID()}.webp`)),
  )
  const images = imageCreateData(uploadedImages, imageUrls)

  const createData: Prisma.ListingCreateInput = {
    title: data.title,
    titleKm: data.titleKm || null,
    description: data.description,
    descriptionKm: data.descriptionKm || null,
    price: data.price,
    currency: data.currency,
    negotiable: data.negotiable,
    condition: data.condition || null,
    categorySlug: data.categorySlug,
    subcategorySlug: data.subcategorySlug || null,
    province: data.province,
    district: data.district || null,
    addressDetail: data.addressDetail || null,
    lat: data.lat,
    lng: data.lng,
    facets: parseJsonObject(normalizedInput.facets),
    promoted: normalizedInput.promoted === "true" || normalizedInput.promoted === true,
    urgent: normalizedInput.urgent === "true" || normalizedInput.urgent === true,
    expiresAt: listingExpiryDate(plus),
    slug,
    seller: { connect: { id: userId } },
    images: {
      create: images,
    },
  }

  const listing = await prisma.listing.create({
    data: createData,
    include: FULL_LISTING_INCLUDE,
  })
  if (triggerGrowthRewards) {
    await Promise.all([
      rewardReferralIfFirstListing(userId),
      notifyFollowersOfNewListing(listing),
    ])
  }
  return decorateListing(listing)
}

async function assertListingOwner(userId: string, role: string, listingId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } })
  if (!listing) throw createHttpError(404, "Listing not found")
  if (listing.sellerId !== userId && role !== Role.ADMIN) {
    throw createHttpError(403, "Forbidden")
  }
  return listing
}

export async function updateListing(
  userId: string,
  role: string,
  listingId: string,
  input: unknown,
  files: Express.Multer.File[] = [],
) {
  const existingListing = await assertListingOwner(userId, role, listingId)
  const normalizedInput = normalizeListingInput(input)
  const data = listingSchema.partial().parse(normalizedInput)
  const uploadedImages = await Promise.all(
    files.map((file) => processAndUpload(file.buffer, `listings/${randomUUID()}.webp`)),
  )
  const images = imageCreateData(uploadedImages, imageUrlsFromInput(normalizedInput))

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: {
      ...data,
      facets: normalizedInput.facets !== undefined ? parseJsonObject(normalizedInput.facets) : undefined,
      images:
        images.length > 0
          ? {
              create: images,
            }
          : undefined,
    },
    include: FULL_LISTING_INCLUDE,
  })
  const oldPrice = Number(existingListing.price || 0)
  const newPrice = Number(updated.price || 0)
  if (data.price !== undefined && oldPrice > 0 && newPrice > 0 && newPrice < oldPrice) {
    await notifyPriceDrop(updated.id, updated.title, oldPrice, newPrice)
  }
  return decorateListing(updated)
}

export async function saveDraft(
  userId: string,
  role: string,
  input: unknown,
  files: Express.Multer.File[] = [],
) {
  const normalizedInput = normalizeListingInput(input)
  const draftId = typeof normalizedInput.id === "string" ? normalizedInput.id : null
  if (draftId) {
    await assertListingOwner(userId, role, draftId)
    const draft = await updateListing(userId, role, draftId, normalizedInput, files)
    const listing = await prisma.listing.update({
      where: { id: draft.id },
      data: { status: ListingStatus.DRAFT },
      include: FULL_LISTING_INCLUDE,
    })
    return decorateListing(listing)
  }

  const draft = await createListing(userId, normalizedInput, files, false)
  const listing = await prisma.listing.update({
    where: { id: draft.id },
    data: { status: ListingStatus.DRAFT },
    include: FULL_LISTING_INCLUDE,
  })
  return decorateListing(listing)
}

export async function publishDraft(userId: string, role: string, listingId: string) {
  const listing = await assertListingOwner(userId, role, listingId)
  if (listing.status !== ListingStatus.DRAFT) throw createHttpError(400, "Listing is not a draft")
  const published = await prisma.listing.update({
    where: { id: listingId },
    data: { status: ListingStatus.ACTIVE },
    include: FULL_LISTING_INCLUDE,
  })
  await Promise.all([
    rewardReferralIfFirstListing(userId),
    notifyFollowersOfNewListing(published),
  ])
  return decorateListing(published)
}

export async function deleteListing(userId: string, role: string, listingId: string) {
  await assertListingOwner(userId, role, listingId)
  await prisma.listing.update({
    where: { id: listingId },
    data: { status: ListingStatus.REMOVED },
  })
  return { success: true }
}

export async function reportListing(
  reporterId: string,
  listingId: string,
  reason: ReportReason,
  data: {
    detail?: string
    evidenceUrl?: string
    contactEmail?: string
    userAgent?: string
    reporterSessionId?: string
    listingTitle?: string
  },
) {
  const report = await prisma.report.create({
    data: {
      reporterId,
      listingId,
      reason,
      detail: data.detail || null,
      evidenceUrl: data.evidenceUrl || null,
      contactEmail: data.contactEmail || null,
      userAgent: data.userAgent || null,
      reporterSessionId: data.reporterSessionId || null,
      listingTitle: data.listingTitle || null,
    },
  })
  const pendingReports = await prisma.report.count({
    where: { listingId, status: ReportStatus.PENDING },
  })
  if (pendingReports >= 3) {
    await prisma.listing.update({
      where: { id: listingId },
      data: { status: ListingStatus.FLAGGED },
    })
  }
  return report
}

export async function createLead(
  listingId: string,
  userId: string | undefined,
  type: LeadType,
  data: { phone?: string; message?: string; offerPrice?: string | number },
) {
  const lead = await prisma.lead.create({
    data: {
      listingId,
      userId,
      type,
      phone: data.phone,
      message: data.message,
      offerPrice: parseNumber(data.offerPrice),
    },
  })
  await prisma.listing.update({
    where: { id: listingId },
    data: { contactCount: { increment: 1 } },
  })
  return lead
}

export async function saveListing(userId: string, listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { price: true },
  })
  if (!listing) throw createHttpError(404, "Listing not found")

  return prisma.savedListing.upsert({
    where: { userId_listingId: { userId, listingId } },
    update: { savedPrice: listing.price },
    create: { userId, listingId, savedPrice: listing.price },
  })
}

export async function unsaveListing(userId: string, listingId: string) {
  await prisma.savedListing
    .delete({ where: { userId_listingId: { userId, listingId } } })
    .catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return null
      }
      throw error
    })
  return { success: true }
}

export async function getSavedListings(userId: string) {
  const savedListings = await prisma.savedListing.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        include: SAFE_LISTING_INCLUDE,
      },
    },
  })
  return savedListings.map((saved) => ({
    ...decorateListing(saved.listing),
    savedListingId: saved.id,
    savedAt: saved.createdAt,
    savedPrice: saved.savedPrice,
  }))
}

export async function getRelated(listingId: string, limit = 4) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { categorySlug: true, subcategorySlug: true },
  })
  if (!listing) throw createHttpError(404, "Listing not found")

  const baseWhere: Prisma.ListingWhereInput = {
    id: { not: listingId },
    status: ListingStatus.ACTIVE,
  }
  const sameSubcategory = listing.subcategorySlug
    ? await prisma.listing.findMany({
        where: { ...baseWhere, subcategorySlug: listing.subcategorySlug },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: SAFE_LISTING_INCLUDE,
      })
    : []

  if (sameSubcategory.length >= limit) return decorateListings(sameSubcategory)

  const sameCategory = await prisma.listing.findMany({
    where: {
      ...baseWhere,
      categorySlug: listing.categorySlug,
      id: { notIn: [listingId, ...sameSubcategory.map((item) => item.id)] },
    },
    take: limit - sameSubcategory.length,
    orderBy: { createdAt: "desc" },
    include: SAFE_LISTING_INCLUDE,
  })
  return decorateListings([...sameSubcategory, ...sameCategory])
}

export async function getSimilarListings(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { categorySlug: true },
  })
  if (!listing) throw createHttpError(404, "Listing not found")

  const listings = await prisma.listing.findMany({
    where: {
      id: { not: listingId },
      categorySlug: listing.categorySlug,
      status: ListingStatus.ACTIVE,
    },
    take: 6,
    orderBy: { createdAt: "desc" },
    include: SAFE_LISTING_INCLUDE,
  })
  return decorateListings(listings)
}

export async function getListingsByUser(userId: string, status?: string) {
  const listings = await prisma.listing.findMany({
    where: {
      sellerId: userId,
      status: status
        ? status.toUpperCase() as ListingStatus
        : { not: ListingStatus.REMOVED },
    },
    orderBy: { createdAt: "desc" },
    include: SAFE_LISTING_INCLUDE,
  })
  return decorateListings(listings)
}

export async function markSold(userId: string, role: string, listingId: string) {
  await assertListingOwner(userId, role, listingId)
  const listing = await prisma.listing.update({
    where: { id: listingId },
    data: { status: ListingStatus.SOLD },
    include: SAFE_LISTING_INCLUDE,
  })
  return decorateListing(listing)
}

export async function bumpListing(userId: string, role: string, listingId: string) {
  const listing = await assertListingOwner(userId, role, listingId)
  if (!(await isUserPlus(userId))) {
    throw createLimitError("PLUS_REQUIRED", "Bump to Top is a Plus feature.")
  }
  const todayStart = startOfUtcDay()
  if (listing.bumpedAt && listing.bumpedAt >= todayStart) {
    throw createLimitError("BUMP_LIMIT", "You can bump once per listing per day.")
  }
  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: { bumpedAt: new Date() },
    include: SAFE_LISTING_INCLUDE,
  })
  return { bumpedAt: updated.bumpedAt, listing: decorateListing(updated) }
}

export async function incrementView(listingId: string, sessionId?: string) {
  const sessionKey = sessionId ? `${listingId}:${sessionId}` : ""
  if (sessionKey && viewedSessions.has(sessionKey)) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { viewCount: true },
    })
    return listing?.viewCount || 0
  }

  if (sessionKey) viewedSessions.add(sessionKey)
  const [listing] = await prisma.$transaction([
    prisma.listing.update({
      where: { id: listingId },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    }),
    prisma.listingView.create({
      data: {
        listingId,
        sessionId: sessionId || null,
      },
    }),
  ])
  return listing.viewCount
}
