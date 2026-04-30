import {
  LeadType,
  ListingStatus,
  PrismaClient,
  ReportReason,
  Role,
  VerificationTier,
} from "@prisma/client"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"

const prisma = new PrismaClient()

const PROVINCES = [
  "phnom-penh",
  "siem-reap",
  "sihanoukville",
  "battambang",
  "kampong-cham",
  "kampong-speu",
  "kandal",
  "takeo",
  "prey-veng",
  "svay-rieng",
  "pursat",
  "kampot",
  "kep",
  "kampong-thom",
  "kampong-chhnang",
  "kratie",
  "stung-treng",
  "mondulkiri",
  "ratanakiri",
  "preah-vihear",
  "oddar-meanchey",
  "pailin",
  "tboung-khmum",
  "preah-sihanouk",
  "koh-kong",
]

const CATEGORIES = [
  "vehicles",
  "phones-tablets",
  "electronics",
  "house-land",
  "jobs",
  "services",
  "fashion-beauty",
  "furniture-home",
  "books-sports",
  "pets-animals",
  "food-drinks",
  "tuk-tuk",
]

const LISTING_TITLES = [
  { en: "Toyota Camry 2020 for Sale", km: "Toyota Camry 2020" },
  { en: "iPhone 15 Pro Max 256GB", km: "iPhone 15 Pro Max 256GB" },
  { en: "Modern 2BR Apartment BKK1", km: "2BR Apartment BKK1" },
  { en: "Honda Wave 110 2022", km: "Honda Wave 110 2022" },
  { en: "Samsung Galaxy S24 Ultra", km: "Samsung Galaxy S24 Ultra" },
  { en: "Villa for Sale Toul Kork", km: "Villa Toul Kork" },
  { en: "Mazda CX-5 2021 Automatic", km: "Mazda CX-5 2021 Automatic" },
  { en: "MacBook Pro M3 512GB", km: "MacBook Pro M3 512GB" },
  { en: "Land for Sale Sen Sok", km: "Land Sen Sok" },
  { en: "Kia Sportage 2022 Full Option", km: "Kia Sportage 2022" },
  { en: "Marketing Manager Position", km: "Marketing Manager" },
  { en: "Hyundai Tucson 2023", km: "Hyundai Tucson 2023" },
  { en: "Studio Apartment Chamkarmon", km: "Studio Apartment Chamkarmon" },
  { en: "Yamaha Exciter 150 2023", km: "Yamaha Exciter 150 2023" },
  { en: "Software Developer Job", km: "Software Developer Job" },
  { en: "BMW 320i 2020 for Sale", km: "BMW 320i 2020" },
  { en: "Shophouse for Rent BKK2", km: "Shophouse BKK2" },
  { en: "Lexus RX350 2019", km: "Lexus RX350 2019" },
  { en: "iPhone 14 128GB Like New", km: "iPhone 14 128GB Like New" },
  { en: "Office Space for Rent", km: "Office Space for Rent" },
  { en: "Toyota Fortuner 2021", km: "Toyota Fortuner 2021" },
  { en: "Accounting Officer Needed", km: "Accounting Officer Needed" },
  { en: "Honda City 2022 Sedan", km: "Honda City 2022 Sedan" },
  { en: "4BR Villa for Rent Siem Reap", km: "4BR Villa Siem Reap" },
  { en: "Tuk Tuk Electric 2023", km: "Tuk Tuk Electric 2023" },
  { en: "Restaurant for Sale PP", km: "Restaurant for Sale PP" },
  { en: "Mitsubishi Outlander 2022", km: "Mitsubishi Outlander 2022" },
  { en: "Land 500sqm Battambang", km: "Land 500sqm Battambang" },
  { en: 'Samsung 65" QLED TV', km: 'Samsung 65" QLED TV' },
  { en: "Mazda 3 2023 Hatchback", km: "Mazda 3 2023 Hatchback" },
]

const COORDS: Record<string, { lat: number; lng: number }> = {
  "phnom-penh": { lat: 11.5564, lng: 104.9282 },
  "siem-reap": { lat: 13.3671, lng: 103.8448 },
  sihanoukville: { lat: 10.6278, lng: 103.5228 },
  battambang: { lat: 13.0957, lng: 103.2022 },
  "kampong-cham": { lat: 11.9929, lng: 105.463 },
}

async function main() {
  console.log("Seeding database...")

  await prisma.refreshToken.deleteMany()
  await prisma.report.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.savedListing.deleteMany()
  await prisma.message.deleteMany()
  await prisma.listingImage.deleteMany()
  await prisma.listing.deleteMany()
  await prisma.user.deleteMany()

  console.log("Cleared existing data")

  await prisma.user.create({
    data: {
      phone: "+85512345678",
      passwordHash: await bcrypt.hash("admin1234", 12),
      name: "BayonHub Admin",
      role: Role.ADMIN,
      verificationTier: VerificationTier.IDENTITY,
      phoneVerifiedAt: new Date(),
      idVerifiedAt: new Date(),
    },
  })

  const sellerNames = [
    "Sokha Motors",
    "Dara Tech",
    "Maly Property",
    "Rith Wheels",
    "Sreyleak Fashion",
  ]
  const sellers = await Promise.all(
    sellerNames.map((name, index) =>
      prisma.user.create({
        data: {
          phone: `+85501234567${index}`,
          passwordHash: bcrypt.hashSync("Seller1234!", 12),
          name,
          role: Role.SELLER,
          verificationTier: VerificationTier.PHONE,
          phoneVerifiedAt: new Date(Date.now() - index * 30 * 24 * 60 * 60 * 1000),
        },
      }),
    ),
  )

  console.log("Created users")

  const listings = await Promise.all(
    LISTING_TITLES.map(async (titleObj, index) => {
      const seller = sellers[index % sellers.length]
      const province = PROVINCES[index % PROVINCES.length]
      const category = CATEGORIES[index % CATEGORIES.length]
      const isKHR = index % 6 === 0
      const basePrice = [5000, 800, 150000, 3000, 1200, 200000][index % 6]
      const daysAgo = Math.floor(Math.random() * 90)
      const imgSeed = randomUUID().slice(0, 8)
      const coords = COORDS[province] || null

      return prisma.listing.create({
        data: {
          title: titleObj.en,
          titleKm: titleObj.km,
          description: `High quality ${titleObj.en}. Contact seller for more information. Available in ${province.replace(/-/g, " ")}.`,
          price: isKHR ? basePrice * 4100 : basePrice,
          currency: isKHR ? "KHR" : "USD",
          categorySlug: category,
          province,
          district:
            province === "phnom-penh"
              ? ["bkk1", "toul-kork", "chamkarmon", "sen-sok", "daun-penh"][index % 5]
              : null,
          status: ListingStatus.ACTIVE,
          promoted: index < 5,
          urgent: index % 7 === 0,
          previousPrice: index % 5 === 0 ? (isKHR ? basePrice * 4500 : basePrice * 1.15) : null,
          discountPercent: index % 8 === 0 ? 15 : index % 9 === 0 ? 20 : null,
          negotiable: index % 3 === 0,
          condition: ["new", "used", "refurbished"][index % 3],
          lat: coords ? coords.lat + (Math.random() - 0.5) * 0.05 : null,
          lng: coords ? coords.lng + (Math.random() - 0.5) * 0.05 : null,
          slug: `${titleObj.en
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .slice(0, 40)}-${randomUUID().slice(0, 5)}`,
          viewCount: Math.floor(Math.random() * 500),
          contactCount: Math.floor(Math.random() * 50),
          sellerId: seller.id,
          createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
          images: {
            create: Array.from({ length: Math.floor(Math.random() * 3) + 2 }, (_, imgIdx) => ({
              url: `https://picsum.photos/seed/${imgSeed}-${imgIdx}/800/600`,
              thumbUrl: `https://picsum.photos/seed/${imgSeed}-${imgIdx}/400/300`,
              order: imgIdx,
            })),
          },
        },
      })
    }),
  )

  console.log(`Created ${listings.length} listings`)

  for (let index = 0; index < 10; index += 1) {
    await prisma.savedListing
      .create({
        data: {
          userId: sellers[index % sellers.length].id,
          listingId: listings[(index * 3) % listings.length].id,
          savedPrice: listings[(index * 3) % listings.length].price,
        },
      })
      .catch(() => null)
  }

  const reportReasons = [
    ReportReason.SCAM,
    ReportReason.SPAM,
    ReportReason.INAPPROPRIATE,
    ReportReason.WRONG_CATEGORY,
    ReportReason.DUPLICATE,
  ]
  for (let index = 0; index < 5; index += 1) {
    await prisma.report.create({
      data: {
        listingId: listings[index].id,
        reporterId: sellers[(index + 1) % sellers.length].id,
        reason: reportReasons[index],
        detail: `Test report ${index + 1}`,
      },
    })
  }

  const leadTypes = [LeadType.CALL, LeadType.WHATSAPP, LeadType.TELEGRAM, LeadType.CHAT, LeadType.OFFER]
  for (let index = 0; index < 20; index += 1) {
    const type = leadTypes[index % leadTypes.length]
    await prisma.lead.create({
      data: {
        listingId: listings[index % listings.length].id,
        userId: sellers[index % sellers.length].id,
        type,
        message: index % 2 === 0 ? "Is this still available?" : null,
        offerPrice: type === LeadType.OFFER ? 4500 : null,
      },
    })
  }

  console.log("Seed complete")
  console.log("Admin login: +85512345678 / admin1234")
  console.log("Seller login: +855012345670 / Seller1234!")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
