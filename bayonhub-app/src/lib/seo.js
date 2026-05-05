import { listingUrl } from "./utils"
import { sanitizeText } from "./sanitize"

const SITE_URL = import.meta.env.VITE_SITE_URL

if (import.meta.env.PROD && !SITE_URL) {
  console.error("[SEO] FATAL: VITE_SITE_URL is not set. Canonical URLs and structured data will be broken in production.")
}

export function canonicalUrl(path) {
  const base = SITE_URL || "https://bayonhub.com"
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}

export function buildProductSchema(listing) {
  if (!listing) return null
  const base = SITE_URL || "https://bayonhub.com"
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: sanitizeText(listing.description).slice(0, 300),
    image: listing.images?.[0]?.url || `${base}/icons/icon-512.png`,
    url: canonicalUrl(listingUrl(listing)),
    sku: listing.id,
    brand: {
      "@type": "Brand",
      name: "BayonHub",
    },
    category: listing.categorySlug,
    location: {
      "@type": "Place",
      name: listing.province,
    },
    offers: {
      "@type": "Offer",
      price: listing.price || "0",
      priceCurrency: listing.currency || "USD",
      availability: listing.status === "ACTIVE" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: canonicalUrl(listingUrl(listing)),
      seller: {
        "@type": "Organization",
        name: listing.seller?.name || "BayonHub Seller",
      },
    },
  }
}
