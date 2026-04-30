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
    description: listing.description?.slice(0, 300),
    image: listing.images?.[0]?.url || `${base}/icons/icon-512.png`,
    url: canonicalUrl(`/listing/${listing.id}/${listing.slug || ""}`),
    offers: {
      "@type": "Offer",
      price: listing.price || "0",
      priceCurrency: listing.currency || "USD",
      availability: listing.status === "ACTIVE" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Person",
        name: listing.seller?.name || "BayonHub Seller",
      },
    },
  }
}
