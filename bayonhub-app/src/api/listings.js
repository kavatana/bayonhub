import client, { hasApiBackend, STORAGE_KEYS } from "./client"
import { CATEGORIES } from "../lib/categories"
import { storage } from "../lib/storage"
import { PROVINCES } from "../lib/locations"

const fallbackImage =
  "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1200&q=80"

const seedListings = [
  {
    id: 1001,
    title: "iPhone 15 Pro Max 256GB Natural Titanium",
    price: 899,
    currency: "USD",
    category: "Phones & Tablets",
    subcategory: "Smartphones",
    location: "Phnom Penh",
    district: "BKK1",
    lat: 11.566,
    lng: 104.9216,
    condition: "Like new",
    sellerId: "store-sokha-mobile",
    sellerName: "Sokha Mobile",
    username: "@SmartBoys09",
    followers: 186,
    following: 12,
    sellerRating: 4.8,
    verified: true,
    phoneVerified: true,
    phoneVerifiedAt: "2026-01-15T09:00:00+07:00",
    idVerifiedAt: "2026-02-02T10:20:00+07:00",
    facebookLinked: false,
    googleLinked: true,
    topSeller: true,
    facebookPage: "sokhamobilekh",
    urgent: false,
    previousPrice: 999,
    views: 1820,
    postedAt: "2026-04-27T08:30:00+07:00",
    premium: true,
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
    ],
    description:
      "Original device with clean body, battery health 94%, box included, and face-to-face inspection available near BKK1.",
  },
  {
    id: 1002,
    title: "Honda Dream 2024 Black, Tax Card Ready",
    price: 2150,
    currency: "USD",
    category: "Vehicles",
    subcategory: "Motorbikes",
    location: "Phnom Penh",
    district: "Toul Kork",
    lat: 11.5801,
    lng: 104.9031,
    condition: "Used",
    sellerId: "store-vathanak-motors",
    sellerName: "Vathanak Motors",
    username: null,
    followers: 74,
    following: 5,
    sellerRating: 4.6,
    verified: true,
    phoneVerified: true,
    phoneVerifiedAt: "2026-03-04T13:30:00+07:00",
    idVerifiedAt: null,
    facebookLinked: false,
    googleLinked: false,
    topSeller: false,
    urgent: true,
    previousPrice: null,
    views: 2440,
    postedAt: "2026-04-26T16:10:00+07:00",
    premium: true,
    imageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80",
    images: [],
    description:
      "One owner, smooth engine, documents ready, and test ride available with ID at the showroom.",
  },
  {
    id: 1003,
    title: "Modern Condo Studio Near Aeon 1",
    price: 450,
    currency: "USD",
    category: "House & Land",
    subcategory: "Rent",
    location: "Phnom Penh",
    district: "Chamkarmon",
    lat: 11.5564,
    lng: 104.9282,
    condition: "For rent",
    sellerId: "store-urban-home-kh",
    sellerName: "Urban Home KH",
    username: "@PPProperty",
    followers: 312,
    following: 18,
    sellerRating: 4.7,
    verified: true,
    phoneVerified: true,
    phoneVerifiedAt: "2026-02-18T12:00:00+07:00",
    idVerifiedAt: "2026-02-20T15:10:00+07:00",
    facebookLinked: true,
    googleLinked: false,
    topSeller: false,
    urgent: false,
    previousPrice: 520,
    views: 1284,
    postedAt: "2026-04-27T11:45:00+07:00",
    premium: false,
    facets: {
      type: "condo",
      bedrooms: "1",
      bathrooms: "1",
      size_sqm: 42,
      floor: 12,
      furnishing: "furnished",
    },
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    ],
    description:
      "Fully furnished studio with gym, pool, security, parking, and a six-month minimum contract.",
  },
  {
    id: 1004,
    title: "MacBook Pro M2 14-inch 16GB 512GB",
    price: 1390,
    currency: "USD",
    category: "Electronics",
    subcategory: "Other",
    location: "Siem Reap",
    district: "Svay Dangkum",
    lat: 13.3671,
    lng: 103.8448,
    condition: "Like new",
    sellerId: "store-tech-sr",
    sellerName: "Tech Store SR",
    username: null,
    followers: 22,
    following: 2,
    sellerRating: 4.1,
    verified: false,
    phoneVerified: false,
    phoneVerifiedAt: null,
    idVerifiedAt: null,
    facebookLinked: false,
    googleLinked: false,
    topSeller: false,
    urgent: true,
    previousPrice: null,
    views: 930,
    postedAt: "2026-04-25T12:20:00+07:00",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    images: [],
    description:
      "Clean machine with original charger, used for design work, and video call inspection available before meeting.",
  },
  {
    id: 1005,
    title: "Toyota Prius 2012 Full Option",
    price: 12800,
    currency: "USD",
    category: "Vehicles",
    subcategory: "Cars",
    location: "Phnom Penh",
    district: "Sen Sok",
    lat: 11.5801,
    lng: 104.9031,
    condition: "Used",
    sellerId: "store-auto-trust-cambodia",
    sellerName: "Auto Trust Cambodia",
    username: "@CamboCarDealer",
    followers: 428,
    following: 9,
    sellerRating: 4.9,
    verified: true,
    phoneVerified: true,
    phoneVerifiedAt: "2026-01-08T08:45:00+07:00",
    idVerifiedAt: "2026-01-10T11:00:00+07:00",
    facebookLinked: true,
    googleLinked: true,
    topSeller: true,
    facebookPage: "autotrustcambodia",
    urgent: false,
    previousPrice: 13500,
    views: 3980,
    postedAt: "2026-04-23T09:00:00+07:00",
    premium: true,
    facets: {
      make: "toyota",
      model: "Prius",
      year: 2012,
      bodyType: "hatchback",
      fuel: "hybrid",
      transmission: "auto",
      mileage: 92000,
      color: "white",
      doors: "5+",
    },
    imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    ],
    description:
      "Clean interior and exterior, hybrid battery checked, import documents ready, and inspection welcome.",
  },
  {
    id: "seed-1",
    title: "Toyota Prius 2012 Full Option - White",
    price: 18500,
    currency: "USD",
    category: "Vehicles",
    categorySlug: "vehicles",
    subcategory: "Cars",
    subcategorySlug: "cars",
    condition: "Used",
    location: "Phnom Penh",
    province: "Phnom Penh",
    district: "Chamkar Mon",
    sellerId: "seller-1",
    sellerName: "Sokha Auto",
    phone: "+85512345678",
    description: "Very clean car, no hit, original paint. tax paper ready.",
    imageUrl: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80",
    ],
    status: "active",
    premium: true,
    leads: 12,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "seed-2",
    title: "iPhone 15 Pro Max 256GB - Natural Titanium",
    price: 1050,
    currency: "USD",
    category: "Phones & Tablets",
    categorySlug: "phones-tablets",
    subcategory: "Smartphones",
    subcategorySlug: "smartphones",
    condition: "Used",
    location: "Siem Reap",
    province: "Siem Reap",
    district: "Siem Reap",
    sellerId: "seller-2",
    sellerName: "Vireak Store",
    phone: "+85598765432",
    description: "Battery health 99%, screen protector and case included.",
    imageUrl: "https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&w=800&q=80",
    status: "active",
    premium: false,
    leads: 4,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "seed-3",
    title: "Modern Condo for Sale in BKK1",
    price: 125000,
    currency: "USD",
    category: "House & Land",
    categorySlug: "house-land",
    subcategory: "Sale",
    subcategorySlug: "sale",
    condition: "New",
    location: "Phnom Penh",
    province: "Phnom Penh",
    district: "Chamkar Mon",
    sellerId: "seller-3",
    sellerName: "Phnom Penh Real Estate",
    phone: "+85511223344",
    description: "Luxury condo with pool and gym. 2 bedrooms, 1 bathroom.",
    imageUrl: "https://images.unsplash.com/photo-1567496898669-ee935f5f647a?auto=format&fit=crop&w=800&q=80",
    status: "active",
    premium: true,
    leads: 8,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "seed-4",
    title: "Honda Dream 2024 - Gold Edition",
    price: 2450,
    currency: "USD",
    category: "Vehicles",
    categorySlug: "vehicles",
    subcategory: "Motorbikes",
    subcategorySlug: "motorbikes",
    condition: "New",
    location: "Kampong Cham",
    province: "Kampong Cham",
    district: "Kampong Cham",
    sellerId: "seller-4",
    sellerName: "Sreng Cycle",
    phone: "+85577889900",
    description: "Brand new Honda Dream with full warranty.",
    imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
    status: "active",
    premium: false,
    leads: 25,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 1006,
    title: "Sony A6400 Camera with Kit Lens",
    price: 720,
    currency: "USD",
    category: "Electronics",
    subcategory: "Cameras",
    location: "Battambang",
    district: "City Center",
    lat: 13.0957,
    lng: 103.2022,
    condition: "Good",
    sellerId: "store-lens-house",
    sellerName: "Lens House",
    username: null,
    followers: 91,
    following: 4,
    sellerRating: 4.5,
    verified: true,
    phoneVerified: true,
    phoneVerifiedAt: null,
    idVerifiedAt: null,
    facebookLinked: false,
    googleLinked: false,
    topSeller: false,
    urgent: false,
    previousPrice: 780,
    views: 1100,
    postedAt: "2026-04-27T07:15:00+07:00",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
    images: [],
    description: "Low shutter count, strong autofocus, includes battery, strap, and kit lens.",
  },
  {
    id: 1007,
    title: "Office Desk Set for Startup Team",
    price: 260,
    currency: "USD",
    category: "Furniture & Home",
    subcategory: "Furniture",
    location: "Kandal",
    district: "Ta Khmao",
    condition: "Good",
    sellerId: "store-workspace-kh",
    sellerName: "Workspace KH",
    username: null,
    followers: 11,
    following: 1,
    sellerRating: 3.9,
    verified: false,
    phoneVerified: false,
    phoneVerifiedAt: null,
    idVerifiedAt: null,
    facebookLinked: false,
    googleLinked: false,
    topSeller: false,
    urgent: false,
    previousPrice: null,
    views: 540,
    postedAt: "2026-04-24T15:00:00+07:00",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80",
    images: [],
    description: "Four desks and chairs, suitable for a small office, buyer collects from Ta Khmao.",
  },
  {
    id: 1008,
    title: "Retail Sales Assistant, Full Time",
    price: 320,
    currency: "USD",
    category: "Jobs",
    subcategory: "Full-time",
    location: "Sihanoukville",
    district: "Ochheuteal",
    condition: "New",
    sellerId: "store-coastal-recruitment",
    sellerName: "Coastal Recruitment",
    username: null,
    followers: 58,
    following: 6,
    sellerRating: 4.4,
    verified: true,
    phoneVerified: true,
    phoneVerifiedAt: null,
    idVerifiedAt: null,
    facebookLinked: false,
    googleLinked: false,
    topSeller: false,
    urgent: true,
    previousPrice: null,
    views: 780,
    postedAt: "2026-04-22T10:30:00+07:00",
    premium: false,
    imageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
    images: [],
    description: "Monthly salary plus commission, basic English preferred, training provided.",
  },
]

export function normalizeListing(listing) {
  const categorySource = listing.categorySlug || listing.category
  const categoryMatch = CATEGORIES.find((category) =>
    [category.id, category.slug, category.label.en].includes(categorySource),
  )
  const subcategorySource = listing.subcategorySlug || listing.subcategory
  const subcategoryMatch = categoryMatch?.subcategories.find((subcategory) =>
    [subcategory.id, subcategory.slug, subcategory.label.en].includes(subcategorySource),
  )
  const provinceSource = listing.province || listing.location
  const provinceMatch = PROVINCES.find((province) =>
    [province.id, province.slug, province.label.en].includes(provinceSource),
  )
  const imageUrls = Array.isArray(listing.images)
    ? listing.images
        .map((image) => (typeof image === "string" ? image : image?.url || image?.thumbUrl))
        .filter(Boolean)
    : []
  const [category, subcategory] = String(listing.category || "").includes(" / ")
    ? listing.category.split(" / ")
    : [listing.category, listing.subcategory]
  const seller = listing.seller || {}
  const sellerListingsCount = seller._count?.listings
  const verificationTier = seller.verificationTier || listing.verificationTier || "NONE"
  const views = Number(listing.viewCount ?? listing.views ?? 0)
  return {
    currency: "USD",
    username: null,
    followers: Number(sellerListingsCount || listing.followers || 0),
    following: 0,
    sellerRating: listing.sellerRating || 4,
    phoneVerified: Boolean(listing.phoneVerified || seller.phoneVerifiedAt),
    phoneVerifiedAt: listing.phoneVerifiedAt || seller.phoneVerifiedAt || null,
    idVerifiedAt: listing.idVerifiedAt || seller.idVerifiedAt || null,
    facebookLinked: false,
    googleLinked: false,
    seller: {
      verificationTier: listing.verified ? "IDENTITY" : listing.phoneVerified ? "PHONE" : verificationTier,
      createdAt: listing.memberSince || listing.postedAt || listing.createdAt || seller.createdAt || null,
      ...seller,
    },
    lat: listing.lat || null,
    lng: listing.lng || null,
    urgent: false,
    previousPrice: null,
    topSeller: false,
    facebookPage: null,
    viewCount: views,
    views,
    facets: {},
    ...listing,
    categorySlug: listing.categorySlug || categoryMatch?.slug || categoryMatch?.id || category,
    subcategorySlug: listing.subcategorySlug || subcategoryMatch?.slug || subcategoryMatch?.id || subcategory,
    category: categoryMatch?.label.en || category,
    subcategory: subcategoryMatch?.label.en || subcategory,
    location: provinceMatch?.label.en || listing.location || listing.province,
    province: provinceMatch?.slug || listing.province,
    sellerId: listing.sellerId || seller.id,
    sellerName: listing.sellerName || seller.name,
    postedAt: listing.postedAt || listing.createdAt,
    images: imageUrls,
    imageUrl: imageUrls[0] || listing.imageUrl || fallbackImage,
    premium: Boolean(listing.promoted || listing.premium),
  }
}

function findCategoryByValue(value) {
  return CATEGORIES.find((category) =>
    [category.id, category.slug, category.label.en].includes(value),
  )
}

function findCategoryForSubcategory(value) {
  return CATEGORIES.find((category) =>
    category.subcategories.some((subcategory) =>
      [subcategory.id, subcategory.slug, subcategory.label.en].includes(value),
    ),
  )
}

function findSubcategoryByValue(category, value) {
  return category?.subcategories.find((subcategory) =>
    [subcategory.id, subcategory.slug, subcategory.label.en].includes(value),
  )
}

function provinceSlug(value) {
  const province = PROVINCES.find((item) =>
    [item.id, item.slug, item.label.en].includes(value),
  )
  return province?.slug || value
}

function toBackendParams(params = {}) {
  const next = { ...params }
  if (next.location && !next.province) {
    next.province = provinceSlug(next.location)
    delete next.location
  }
  if (next.province) next.province = provinceSlug(next.province)
  if (next.category) {
    const category = findCategoryByValue(next.category)
    const subcategoryCategory = category ? null : findCategoryForSubcategory(next.category)
    const subcategory = findSubcategoryByValue(subcategoryCategory, next.category)
    if (category) {
      next.category = category.slug
    } else if (subcategoryCategory && subcategory) {
      next.category = subcategoryCategory.slug
      next.subcategory = subcategory.slug
    }
  }
  if (next.subcategory) {
    const category = findCategoryByValue(next.category) || findCategoryForSubcategory(next.subcategory)
    const subcategory = findSubcategoryByValue(category, next.subcategory)
    if (subcategory) next.subcategory = subcategory.slug
  }
  Object.keys(next).forEach((key) => {
    if (next[key] === "" || next[key] === null || next[key] === undefined) delete next[key]
  })
  return next
}

function appendIfPresent(formData, key, value) {
  if (value === undefined || value === null || value === "") return
  formData.append(key, value)
}

function listingFormData(data) {
  if (data instanceof FormData) return data
  const formData = new FormData()
  const category = findCategoryByValue(data.categorySlug || data.categoryId || data.category)
  const subcategory =
    findSubcategoryByValue(category, data.subcategorySlug || data.subcategoryId || data.subcategory) ||
    findSubcategoryByValue(category, data.detailCategoryId)
  appendIfPresent(formData, "title", data.title)
  appendIfPresent(formData, "titleKm", data.titleKm)
  appendIfPresent(formData, "description", data.description || data.title)
  appendIfPresent(formData, "descriptionKm", data.descriptionKm)
  appendIfPresent(formData, "price", data.price)
  appendIfPresent(formData, "currency", data.currency || "USD")
  appendIfPresent(formData, "categorySlug", data.categorySlug || category?.slug || data.category)
  appendIfPresent(formData, "subcategorySlug", data.subcategorySlug || subcategory?.slug)
  appendIfPresent(formData, "province", provinceSlug(data.province || data.location))
  appendIfPresent(formData, "district", data.district)
  appendIfPresent(formData, "addressDetail", data.addressDetail)
  appendIfPresent(formData, "condition", data.condition)
  appendIfPresent(formData, "negotiable", data.negotiable)
  appendIfPresent(formData, "lat", data.lat)
  appendIfPresent(formData, "lng", data.lng)
  appendIfPresent(formData, "facets", data.facets ? JSON.stringify(data.facets) : "")
  const promoted = Boolean(data.premium) || (data.promotion ? data.promotion !== "standard" : false)
  appendIfPresent(formData, "promoted", promoted ? "true" : "false")
  ;(data.images || []).forEach((image, index) => {
    const file = image?.file || image
    if (file instanceof Blob) {
      formData.append("images", file, `image-${index}.jpg`)
    }
  })
  return formData
}

function getMockListings() {
  const listings = storage.get(STORAGE_KEYS.listings, null)
  if (listings) return listings.map(normalizeListing)
  storage.set(STORAGE_KEYS.listings, seedListings)
  return seedListings.map(normalizeListing)
}

function applyFilters(listings, params = {}) {
  const q = params.q?.trim().toLowerCase()
  const categoryParam = params.category?.toLowerCase()
  const resolvedCategory = categoryParam
    ? (CATEGORIES.find((item) => item.id === categoryParam || item.slug === categoryParam || item.label.en.toLowerCase() === categoryParam)?.label.en.toLowerCase() || categoryParam)
    : null
  const locationParam = params.location?.toLowerCase()

  return listings.filter((listing) => {
    const title = (listing.title || "").toLowerCase()
    const description = (listing.description || "").toLowerCase()
    const sellerName = (listing.sellerName || "").toLowerCase()
    const location = (listing.location || "").toLowerCase()
    const district = (listing.district || "").toLowerCase()
    const category = (listing.category || "").toLowerCase()
    const subcategory = (listing.subcategory || "").toLowerCase()

    const text = `${title} ${description} ${sellerName} ${location} ${district}`
    const matchesQ = !q || text.includes(q)
    const matchesCategory = !resolvedCategory || category === resolvedCategory || subcategory === resolvedCategory
    const matchesLocation = !locationParam || location === locationParam || district === locationParam
    const matchesMin = !params.minPrice || Number(listing.price) >= Number(params.minPrice)
    const matchesMax = !params.maxPrice || Number(listing.price) <= Number(params.maxPrice)
    const matchesCondition = !params.condition || String(listing.condition).toLowerCase() === params.condition.toLowerCase()
    
    return matchesQ && matchesCategory && matchesLocation && matchesMin && matchesMax && matchesCondition
  }).sort((a, b) => {
    if (params.sort === "priceLow") return Number(a.price || 0) - Number(b.price || 0)
    if (params.sort === "priceHigh") return Number(b.price || 0) - Number(a.price || 0)
    if (params.sort === "views") return Number(b.views || 0) - Number(a.views || 0)
    return new Date(b.updatedAt || b.postedAt || 0) - new Date(a.updatedAt || a.postedAt || 0)
  })
}

function paginate(items, page = 1, limit = 24) {
  const start = (Number(page) - 1) * Number(limit)
  return {
    data: items.slice(start, start + Number(limit)),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: items.length,
    },
  }
}

function objectFromPayload(data) {
  if (!(data instanceof FormData)) return data
  const payload = Object.fromEntries(data.entries())
  return {
    ...payload,
    price: Number(payload.price || 0),
    images: data.getAll("images").filter(Boolean),
  }
}

export async function getListings(params = {}) {
  if (hasApiBackend()) {
    try {
      const response = await client.get("/api/listings", { params: toBackendParams(params) })
      return {
        listings: (response.data.listings || []).map(normalizeListing),
        total: response.data.total || 0,
        nextCursor: response.data.nextCursor || null,
      }
    } catch {
      console.warn("[listings] GET failed, using localStorage fallback")
    }
  }
  const filtered = applyFilters(getMockListings(), params)
  return paginate(filtered, params.page || 1, params.limit || 24)
}

export async function getListingById(id) {
  if (hasApiBackend()) {
    try {
      const response = await client.get(`/api/listings/${id}`)
      return normalizeListing(response.data)
    } catch (error) {
      if (error.response?.status === 404) return null
      console.warn("[listings] Detail GET failed, using localStorage fallback")
    }
  }
  const listings = getMockListings()
  const listing = listings.find((item) => String(item.id) === String(id))
  return listing || null
}

export async function createListing(data) {
  if (hasApiBackend()) {
    try {
      const body = listingFormData(data)
      const response = await client.post("/api/listings", body, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return normalizeListing(response.data)
    } catch (error) {
      throw new Error(error.response?.data?.error || "post.error", { cause: error })
    }
  }
  const payload = objectFromPayload(data)
  const listings = getMockListings()
  const currentUser = storage.get(STORAGE_KEYS.authUser, null)
  const listing = {
    id: Date.now(),
    currency: "USD",
    sellerId: currentUser?.id || "local-demo-seller",
    sellerName: payload.sellerName || currentUser?.name || "Local Seller",
    username: currentUser?.username || null,
    followers: 0,
    following: 0,
    sellerRating: 4,
    verified: false,
    phoneVerified: false,
    phoneVerifiedAt: null,
    idVerifiedAt: null,
    facebookLinked: false,
    googleLinked: false,
    seller: {
      verificationTier: "NONE",
      createdAt: new Date().toISOString(),
    },
    lat: null,
    lng: null,
    urgent: false,
    previousPrice: null,
    topSeller: false,
    facebookPage: null,
    viewCount: 0,
    views: 0,
    facets: {},
    premium: false,
    postedAt: new Date().toISOString(),
    imageUrl: payload.imageUrl || fallbackImage,
    images: payload.images || [],
    ...payload,
  }
  storage.set(STORAGE_KEYS.listings, [listing, ...listings])
  return listing
}

export async function updateListing(id, data) {
  if (hasApiBackend()) {
    const response = await client.put(`/api/listings/${id}`, listingFormData(data), {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return normalizeListing(response.data)
  }
  const listings = getMockListings()
  const updated = listings.map((listing) =>
    String(listing.id) === String(id) ? { ...listing, ...data } : listing,
  )
  storage.set(STORAGE_KEYS.listings, updated)
  return updated.find((listing) => String(listing.id) === String(id))
}

export async function deleteListing(id) {
  if (hasApiBackend()) {
    const response = await client.delete(`/api/listings/${id}`)
    return response.data
  }
  const updated = getMockListings().filter((listing) => String(listing.id) !== String(id))
  storage.set(STORAGE_KEYS.listings, updated)
  return { ok: true }
}

export async function reportListing(id, reason, detail = "", extra = {}) {
  const payload = typeof reason === "object" && reason !== null ? reason : { reason, detail, ...extra }
  if (hasApiBackend()) {
    const response = await client.post(`/api/listings/${id}/report`, payload)
    return response.data
  }
  const reports = storage.get(STORAGE_KEYS.reports, [])
  const report = {
    id: crypto.randomUUID(),
    listingId: id,
    ...payload,
    createdAt: new Date().toISOString(),
    source: "react-web",
  }
  storage.set(STORAGE_KEYS.reports, [report, ...reports])
  return report
}

function normalizeLeadType(action, leadType) {
  const value = String(leadType || action?.type || action?.action || action || "CHAT").toUpperCase()
  if (value.includes("WHATSAPP")) return "WHATSAPP"
  if (value.includes("TELEGRAM")) return "TELEGRAM"
  if (value.includes("CALL")) return "CALL"
  if (value.includes("OFFER")) return "OFFER"
  return "CHAT"
}

export async function createLead(id, type, data = {}, metadata = {}) {
  if (hasApiBackend()) {
    const leadPayload = typeof type === "object" && type !== null ? type : { type, ...data }
    try {
      await client.post(`/api/listings/${id}/lead`, {
        type: normalizeLeadType(leadPayload, leadPayload.type || type),
        phone: leadPayload.phone || metadata.phone,
        message: leadPayload.message || metadata.message,
        offerPrice: leadPayload.offerPrice || metadata.offerPrice,
        sessionId: leadPayload.sessionId,
        createdAt: leadPayload.createdAt,
      })
    } catch {
      return null
    }
    return { success: true }
  }
  const leads = storage.get(STORAGE_KEYS.leads, [])
  const leadPayload = typeof type === "object" && type !== null ? type : { type, ...data }
  const lead = {
    id: crypto.randomUUID(),
    listingId: id,
    type: leadPayload.type || leadPayload.action,
    action: leadPayload.action,
    phone: leadPayload.phone,
    offerPrice: leadPayload.offerPrice,
    message: leadPayload.message,
    sessionId: leadPayload.sessionId,
    metadata,
    source: "react-web",
    createdAt: new Date().toISOString(),
  }
  storage.set(STORAGE_KEYS.leads, [lead, ...leads])
  return lead
}

export async function saveListing(id) {
  if (hasApiBackend()) {
    const response = await client.post(`/api/listings/${id}/save`)
    return response.data
  }
  return { success: true }
}

export async function unsaveListing(id) {
  if (hasApiBackend()) {
    const response = await client.delete(`/api/listings/${id}/save`)
    return response.data
  }
  return { success: true }
}

export async function getRelated(id, limit = 4) {
  if (hasApiBackend()) {
    try {
      const response = await client.get(`/api/listings/${id}/related`, { params: { limit } })
      return (response.data.listings || []).map(normalizeListing)
    } catch {
      return []
    }
  }
  const listing = getMockListings().find((item) => String(item.id) === String(id))
  if (!listing) return []
  return getMockListings()
    .filter((item) => String(item.id) !== String(id) && item.subcategory === listing.subcategory)
    .slice(0, limit)
}

export async function fetchStats() {
  if (hasApiBackend()) {
    try {
      const response = await client.get("/api/stats")
      return response.data
    } catch {
      return null
    }
  }
  return null
}
