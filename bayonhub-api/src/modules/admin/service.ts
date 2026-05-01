import { randomUUID } from "crypto"
import bcrypt from "bcryptjs"
import { KYCStatus, ListingStatus, Prisma, ReportStatus, Role, VerificationTier } from "@prisma/client"

import { prisma } from "../../lib/prisma"
import { processAndUpload } from "../../lib/s3"
import { generateUniqueSlug } from "../../lib/slug"
import { SAFE_USER_SELECT } from "../auth/service"

export interface ImportListing {
  title: string
  titleKm?: string
  description: string
  price: number
  currency: "USD" | "KHR"
  categorySlug: string
  subcategorySlug?: string
  province: string
  district?: string
  condition: string
  images: string[]
  sellerName: string
  sellerPhone: string
  facets?: Record<string, unknown>
}

function todayStart(): Date {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

export async function getReports(cursor?: string, limit = 20) {
  const take = Math.min(limit, 50)
  const reports = await prisma.report.findMany({
    where: { status: ReportStatus.PENDING },
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: { id: true, title: true, slug: true, status: true },
      },
      reporter: {
        select: { id: true, name: true, phone: true, avatarUrl: true },
      },
    },
  })
  const nextCursor = reports.length === take ? reports[reports.length - 1]?.id || null : null
  return { reports, nextCursor }
}

export async function updateReport(
  id: string,
  data: { status: ReportStatus; listingStatus?: ListingStatus },
) {
  const report = await prisma.report.update({
    where: { id },
    data: {
      status: data.status,
      resolvedAt: new Date(),
      listing: data.listingStatus ? { update: { status: data.listingStatus } } : undefined,
    },
    include: { listing: true, reporter: { select: SAFE_USER_SELECT } },
  })
  return report
}

export async function getAdminListings(cursor?: string, limit = 20) {
  const take = Math.min(limit, 50)
  const listings = await prisma.listing.findMany({
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      images: { take: 1, orderBy: { order: "asc" } },
      seller: { select: SAFE_USER_SELECT },
    },
  })
  const nextCursor = listings.length === take ? listings[listings.length - 1]?.id || null : null
  return { listings, nextCursor }
}

export async function updateListingStatus(id: string, status: ListingStatus) {
  return prisma.listing.update({ where: { id }, data: { status } })
}

export async function getUsers(cursor?: string, limit = 20) {
  const take = Math.min(limit, 50)
  const users = await prisma.user.findMany({
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    select: SAFE_USER_SELECT,
  })
  const nextCursor = users.length === take ? users[users.length - 1]?.id || null : null
  return { users, nextCursor }
}

export async function updateUserRole(id: string, role: Role) {
  return prisma.user.update({ where: { id }, data: { role }, select: SAFE_USER_SELECT })
}

export async function updateUserVerification(id: string, verificationTier: VerificationTier) {
  return prisma.user.update({
    where: { id },
    data: {
      verificationTier,
      phoneVerifiedAt:
        verificationTier === VerificationTier.PHONE || verificationTier === VerificationTier.IDENTITY
          ? new Date()
          : null,
      idVerifiedAt: verificationTier === VerificationTier.IDENTITY ? new Date() : null,
    },
    select: SAFE_USER_SELECT,
  })
}

export async function getStats() {
  const start = todayStart()
  const [
    totalListings,
    totalUsers,
    totalLeads,
    totalReports,
    activeListings,
    newTodayListings,
    newTodayUsers,
  ] = await Promise.all([
    prisma.listing.count(),
    prisma.user.count(),
    prisma.lead.count(),
    prisma.report.count(),
    prisma.listing.count({ where: { status: ListingStatus.ACTIVE } }),
    prisma.listing.count({ where: { createdAt: { gte: start } } }),
    prisma.user.count({ where: { createdAt: { gte: start } } }),
  ])
  return {
    totalListings,
    totalUsers,
    totalLeads,
    totalReports,
    activeListings,
    newTodayListings,
    newTodayUsers,
    newToday: newTodayListings,
  }
}

export async function getPendingKycApplications() {
  return prisma.kYCApplication.findMany({
    where: { status: KYCStatus.PENDING },
    orderBy: { submittedAt: "asc" },
    include: { user: { select: SAFE_USER_SELECT } },
  })
}

export async function updateKycApplication(id: string, reviewerId: string, status: KYCStatus, note?: string) {
  const application = await prisma.kYCApplication.update({
    where: { id },
    data: {
      status,
      reviewNote: note || null,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      user:
        status === KYCStatus.APPROVED
          ? {
              update: {
                verificationTier: VerificationTier.IDENTITY,
                idVerifiedAt: new Date(),
                phoneVerifiedAt: new Date(),
              },
            }
          : undefined,
    },
    include: { user: { select: SAFE_USER_SELECT } },
  })
  return application
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Image download failed: ${url}`)
  return Buffer.from(await response.arrayBuffer())
}

function requireImportString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is required`)
  }
  return value.trim()
}

function validateImportListing(input: ImportListing): ImportListing {
  const currency = input.currency === "KHR" ? "KHR" : "USD"
  return {
    title: requireImportString(input.title, "title"),
    titleKm: input.titleKm,
    description: requireImportString(input.description, "description"),
    price: Number(input.price),
    currency,
    categorySlug: requireImportString(input.categorySlug, "categorySlug"),
    subcategorySlug: input.subcategorySlug,
    province: requireImportString(input.province, "province"),
    district: input.district,
    condition: requireImportString(input.condition, "condition"),
    images: Array.isArray(input.images) ? input.images.filter(Boolean).slice(0, 8) : [],
    sellerName: requireImportString(input.sellerName, "sellerName"),
    sellerPhone: requireImportString(input.sellerPhone, "sellerPhone"),
    facets: input.facets,
  }
}

export async function importListings(inputs: ImportListing[]) {
  if (!Array.isArray(inputs)) throw new Error("listings must be an array")
  if (inputs.length > 100) throw new Error("Maximum 100 listings per request")

  let imported = 0
  let skipped = 0
  const errors: { index: number; title?: string; error: string }[] = []

  for (const [index, rawInput] of inputs.entries()) {
    try {
      const input = validateImportListing(rawInput)
      const existingSeller = await prisma.user.findUnique({ where: { phone: input.sellerPhone } })
      const seller =
        existingSeller ||
        (await prisma.user.create({
          data: {
          phone: input.sellerPhone,
          passwordHash: await bcrypt.hash(randomUUID(), 12),
          name: input.sellerName,
          role: Role.SELLER,
          verificationTier: VerificationTier.PHONE,
          phoneVerifiedAt: new Date(),
          },
        }))

      const existing = await prisma.listing.findFirst({
        where: { title: input.title, sellerId: seller.id },
        select: { id: true },
      })
      if (existing) {
        skipped += 1
        continue
      }

      const uploadedImages = await Promise.all(
        input.images.map(async (url) => {
          const buffer = await downloadImage(url)
          return processAndUpload(buffer, `listings/${randomUUID()}.webp`)
        }),
      )
      const slug = await generateUniqueSlug(input.title)

      await prisma.listing.create({
        data: {
          title: input.title,
          titleKm: input.titleKm || null,
          description: input.description,
          price: input.price,
          currency: input.currency,
          categorySlug: input.categorySlug,
          subcategorySlug: input.subcategorySlug || null,
          province: input.province,
          district: input.district || null,
          condition: input.condition,
          status: ListingStatus.ACTIVE,
          slug,
          sellerId: seller.id,
          facets: input.facets ? (input.facets as Prisma.InputJsonValue) : Prisma.JsonNull,
          images: {
            create: uploadedImages.map((image, imageIndex) => ({
              url: image.url,
              thumbUrl: image.thumbUrl,
              order: imageIndex,
            })),
          },
        },
      })
      imported += 1
    } catch (error) {
      errors.push({
        index,
        title: rawInput?.title,
        error: error instanceof Error ? error.message : "Import failed",
      })
    }
  }

  return { imported, failed: errors.length, skipped, errors }
}
