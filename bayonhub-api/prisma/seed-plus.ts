import bcrypt from "bcryptjs"
import { ListingStatus, Role, VerificationTier } from "@prisma/client"
import { prisma } from "../src/lib/prisma"

async function main(): Promise<void> {
  const plusUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const passwordHash = await bcrypt.hash("test1234", 12)

  const user = await prisma.user.upsert({
    where: { phone: "+85510000002" },
    update: {
      name: "Test Plus User",
      role: Role.USER,
      plusUntil,
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
      verificationTier: VerificationTier.PHONE,
    },
    create: {
      phone: "+85510000002",
      email: "test-plus@bayonhub.local",
      passwordHash,
      name: "Test Plus User",
      role: Role.USER,
      plusUntil,
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
      verificationTier: VerificationTier.PHONE,
      language: "en",
    },
  })

  await prisma.listing.upsert({
    where: { slug: "test-plus-phnom-penh-map-listing" },
    update: {
      sellerId: user.id,
      status: ListingStatus.ACTIVE,
      deletedAt: null,
      province: "Phnom Penh",
      lat: 11.5564,
      lng: 104.9282,
    },
    create: {
      slug: "test-plus-phnom-penh-map-listing",
      title: "Test Plus Phnom Penh Map Listing",
      description: "Local development listing for Plus badge and map testing.",
      price: 1000,
      currency: "USD",
      negotiable: true,
      condition: "used",
      categorySlug: "vehicles",
      subcategorySlug: "cars",
      province: "Phnom Penh",
      district: "BKK1",
      lat: 11.5564,
      lng: 104.9282,
      status: ListingStatus.ACTIVE,
      sellerId: user.id,
    },
  })

  console.info("Seeded Test Plus User: +85510000002 / test1234")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
