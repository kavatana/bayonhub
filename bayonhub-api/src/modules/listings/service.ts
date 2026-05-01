import { randomUUID } from "crypto"
import {
  LeadType,
  ListingStatus,
  Prisma,
  ReportReason,
  Role,
} from "@prisma/client"

import { prisma } from "../../lib/prisma"
import { processAndUpload } from "../../lib/s3"
import { generateUniqueSlug } from "../../lib/slug"

export const SAFE_LISTING_INCLUDE = {
  images: { take: 1, orderBy: { order: "asc" as const } },
  seller: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      verificationTier: true,
      createdAt: true,
      phoneVerifiedAt: true,
      _count: { select: { listings: true } },
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
      bio: true,
      verificationTier: true,
      createdAt: true,
      phoneVerifiedAt: true,
      _count: { select: { listings: true } },
    },
  },
} satisfies Prisma.ListingInclude

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

function createHttpError(status: number, message: string): Error & { status: number } {
  const error = new Error(message) as Error & { status: number }
  error.status = status
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
    updateData.facets =
      typeof data.facets === "string" ? JSON.parse(data.facets) : (data.facets as Prisma.JsonObject)
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

function buildWhere(filters: ListingFilters, includeCursor: boolean): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = { status: ListingStatus.ACTIVE }
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

export async function getListings(filters: ListingFilters) {
  const limit = Math.min(filters.limit || 50, 50)
  const where = buildWhere(filters, true)
  const countWhere = buildWhere(filters, false)
  const q = filters.q?.trim()

  if (q) {
    const searchResults = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM "Listing"
      WHERE (
        search_vector @@ websearch_to_tsquery('english', ${q})
        OR title % ${q}
        OR title ILIKE ${`%${q}%`}
      )
      AND status = 'ACTIVE'
      ORDER BY 
        ts_rank(search_vector, websearch_to_tsquery('english', ${q})) DESC,
        similarity(title, ${q}) DESC,
        "createdAt" DESC
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
      FROM "Listing"
      WHERE (
        search_vector @@ websearch_to_tsquery('english', ${q})
        OR title % ${q}
        OR title ILIKE ${`%${q}%`}
      )
      AND status = 'ACTIVE'
    `
    const total = Number(countResult[0]?.count || 0)
    const nextCursor =
      orderedListings.length === limit ? orderedListings[orderedListings.length - 1]?.id || null : null
    return { listings: orderedListings, total, nextCursor }
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: [{ promoted: "desc" }, { createdAt: "desc" }],
      take: limit,
      include: SAFE_LISTING_INCLUDE,
    }),
    prisma.listing.count({ where: countWhere }),
  ])
  const nextCursor = listings.length === limit ? listings[listings.length - 1]?.id || null : null
  return { listings, total, nextCursor }
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

  await prisma.listing.update({
    where: { id: listing.id },
    data: { viewCount: { increment: 1 } },
  })
  return { ...listing, viewCount: listing.viewCount + 1 }
}

export async function createListing(
  userId: string,
  data: ListingInput,
  files: Express.Multer.File[] = [],
) {
  const title = requireString(data.title, "title")
  const description = requireString(data.description, "description")
  const categorySlug = requireString(data.categorySlug, "categorySlug")
  const province = requireString(data.province, "province")
  const slug = await generateUniqueSlug(title)
  const uploadedImages = await Promise.all(
    files.map((file) => processAndUpload(file.buffer, `listings/${randomUUID()}.webp`)),
  )

  const createData: Prisma.ListingCreateInput = {
    title,
    titleKm: data.titleKm || null,
    description,
    descriptionKm: data.descriptionKm || null,
    price: parseNumber(data.price),
    currency: data.currency || "USD",
    negotiable: parseBoolean(data.negotiable) || false,
    condition: data.condition || null,
    categorySlug,
    subcategorySlug: data.subcategorySlug || null,
    province,
    district: data.district || null,
    addressDetail: data.addressDetail || null,
    lat: parseNumber(data.lat),
    lng: parseNumber(data.lng),
    facets:
      data.facets === undefined
        ? Prisma.JsonNull
        : typeof data.facets === "string"
          ? JSON.parse(data.facets)
          : (data.facets as Prisma.InputJsonValue),
    promoted: parseBoolean(data.promoted) || false,
    urgent: parseBoolean(data.urgent) || false,
    previousPrice: parseNumber(data.previousPrice),
    discountPercent: parseNumber(data.discountPercent),
    topSeller: parseBoolean(data.topSeller) || false,
    facebookPage: data.facebookPage || null,
    slug,
    seller: { connect: { id: userId } },
    images: {
      create: uploadedImages.map((image, index) => ({
        url: image.url,
        thumbUrl: image.thumbUrl,
        order: index,
      })),
    },
  }

  return prisma.listing.create({
    data: createData,
    include: FULL_LISTING_INCLUDE,
  })
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
  data: ListingInput,
  files: Express.Multer.File[] = [],
) {
  await assertListingOwner(userId, role, listingId)
  const updateData = buildListingMutationData(data)
  const uploadedImages = await Promise.all(
    files.map((file) => processAndUpload(file.buffer, `listings/${randomUUID()}.webp`)),
  )

  return prisma.listing.update({
    where: { id: listingId },
    data: {
      ...updateData,
      images:
        uploadedImages.length > 0
          ? {
              create: uploadedImages.map((image, index) => ({
                url: image.url,
                thumbUrl: image.thumbUrl,
                order: index,
              })),
            }
          : undefined,
    },
    include: FULL_LISTING_INCLUDE,
  })
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
  detail?: string,
) {
  const report = await prisma.report.create({
    data: { reporterId, listingId, reason, detail },
  })
  const pendingReports = await prisma.report.count({
    where: { listingId, status: "PENDING" },
  })
  if (pendingReports >= 3) {
    console.warn(`[Reports] Listing ${listingId} has ${pendingReports} pending reports`)
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

  if (sameSubcategory.length >= limit) return sameSubcategory

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
  return [...sameSubcategory, ...sameCategory]
}
