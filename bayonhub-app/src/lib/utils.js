import { clsx } from "clsx"

export function cn(...values) {
  return clsx(values)
}

export function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function toKhmerNumerals(value) {
  const map = {
    "0": "០",
    "1": "១",
    "2": "២",
    "3": "៣",
    "4": "៤",
    "5": "៥",
    "6": "៦",
    "7": "៧",
    "8": "៨",
    "9": "៩",
  }
  return String(value || "").replace(/[0-9]/g, (w) => map[w])
}

export function formatPrice(value, currency = "USD", language = "en") {
  let amount = Number(value || 0).toLocaleString()
  if (language === "km") amount = toKhmerNumerals(amount)
  return currency === "KHR" ? `${amount}៛` : `$${amount}`
}

export function timeAgo(value, language = "en") {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return language === "km" ? "ថ្មីៗនេះ" : "Recently"
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMs / 3600000)
  const days = Math.floor(diffMs / 86400000)
  if (minutes < 1) return language === "km" ? "ថ្មីៗនេះ" : "Just now"
  if (minutes < 60) return language === "km" ? `${minutes} នាទីមុន` : `${minutes}m ago`
  if (hours < 24) return language === "km" ? `${hours} ម៉ោងមុន` : `${hours}h ago`
  if (days === 1) return language === "km" ? "ម្សិលមិញ" : "Yesterday"
  return language === "km" ? `${days} ថ្ងៃមុន` : `${days} days ago`
}

export function getListingImage(listing) {
  return (
    listing?.images?.[0] ||
    listing?.imageUrl ||
    "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1200&q=80"
  )
}

export function getListingSlug(listing) {
  return slugify(listing?.title || `listing-${listing?.id}`)
}

export function listingUrl(listing) {
  if (!listing || !listing.id) return "/404"
  const category = listing.categorySlug || "general"
  const province = listing.province || "cambodia"
  const titleSlug = slugify(listing.title || "listing").slice(0, 40)
  const idStr = String(listing.id)
  return `/buy/${province}/${category}/${titleSlug}-${idStr}`
}

export function sellerUrl(seller) {
  if (!seller) return "/404"
  if (seller.slug) return `/u/${seller.slug}`
  return `/seller/${seller.id || seller.sellerId}`
}

export function maskPhone(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, "")
  if (digits.length < 8) return phone
  // Khmer style: 012 345 678 -> 012 34X XXX
  const part1 = digits.slice(0, 3)
  const part2 = digits.slice(3, 5)
  return `${part1} ${part2}X XXX`
}

const R2_BASE = import.meta.env.VITE_R2_PUBLIC_URL || ""

export function getSrcSet(src) {
  if (!src) return undefined
  if (src.startsWith("data:")) return undefined
  if (src.includes("unsplash.com")) {
    return `${src}&w=400 400w, ${src}&w=800 800w`
  }
  if (src.includes("picsum.photos")) {
    const base = src.split("?")[0]
    const parts = base.split("/")
    const seedIndex = parts.indexOf("seed")
    const seed = seedIndex !== -1 ? parts[seedIndex + 1] : null
    if (seed) {
      return [
        `https://picsum.photos/seed/${seed}/400/300 400w`,
        `https://picsum.photos/seed/${seed}/800/600 800w`,
      ].join(", ")
    }
    return undefined
  }
  if (R2_BASE && src.startsWith(R2_BASE)) {
    return undefined
  }
  return undefined
}

export function telegramShare(url, text) {
  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(text)
  const deepLink = `tg://msg_url?url=${encodedUrl}&text=${encodedText}`
  const webFallback = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`

  // Track whether the page lost focus (Telegram app opened)
  let blurred = false
  function onBlur() { blurred = true }
  function onVisibilityChange() { if (document.hidden) blurred = true }

  window.addEventListener("blur", onBlur, { once: true })
  document.addEventListener("visibilitychange", onVisibilityChange, { once: true })

  // Open deep link without leaving the current page
  window.open(deepLink, "_self")

  // After delay: if app didn't open (page still visible), use web fallback
  window.setTimeout(() => {
    window.removeEventListener("blur", onBlur)
    document.removeEventListener("visibilitychange", onVisibilityChange)
    if (!blurred) {
      window.open(webFallback, "_blank", "noopener,noreferrer")
    }
  }, 1000)
}
