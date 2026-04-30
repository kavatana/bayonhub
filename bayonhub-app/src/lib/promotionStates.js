export const PROMOTION_STATES = Object.freeze({
  STANDARD: "standard",
  BOOST: "boost",
  TOP: "top",
  PROMOTED: "promoted",
  PENDING: "pending",
  EXPIRED: "expired",
})

export const PROMOTION_LABELS = Object.freeze({
  [PROMOTION_STATES.STANDARD]: {
    en: "Standard",
    km: "ស្តង់ដារ",
  },
  [PROMOTION_STATES.BOOST]: {
    en: "Boost",
    km: "បង្កើន",
  },
  [PROMOTION_STATES.TOP]: {
    en: "Top Ad",
    km: "ប្រកាសកំពូល",
  },
  [PROMOTION_STATES.PROMOTED]: {
    en: "Promoted",
    km: "បានផ្សព្វផ្សាយ",
  },
  [PROMOTION_STATES.PENDING]: {
    en: "Pending",
    km: "កំពុងរង់ចាំ",
  },
  [PROMOTION_STATES.EXPIRED]: {
    en: "Expired",
    km: "ផុតកំណត់",
  },
})

function normalizePromotionValue(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[_\s]+/g, "-")
  if (["boost", "boosted"].includes(normalized)) return PROMOTION_STATES.BOOST
  if (["top", "top-ad", "topad", "featured"].includes(normalized)) return PROMOTION_STATES.TOP
  if (["promoted", "premium", "paid"].includes(normalized)) return PROMOTION_STATES.PROMOTED
  if (normalized === "pending") return PROMOTION_STATES.PENDING
  if (normalized === "expired") return PROMOTION_STATES.EXPIRED
  return PROMOTION_STATES.STANDARD
}

export function getPromotionState(listing = {}) {
  const statusValue = listing.promotionStatus || listing.promotionState
  const statusState = normalizePromotionValue(statusValue)
  if ([PROMOTION_STATES.PENDING, PROMOTION_STATES.EXPIRED].includes(statusState)) return statusState

  const expiresAt = listing.promotionExpiresAt || listing.promotedUntil || listing.premiumUntil
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return PROMOTION_STATES.EXPIRED

  const tierState = normalizePromotionValue(listing.promotion || listing.promotionTier || listing.plan)
  if (tierState !== PROMOTION_STATES.STANDARD) return tierState

  if (listing.promoted || listing.premium) return PROMOTION_STATES.PROMOTED
  return PROMOTION_STATES.STANDARD
}

export function isPromotedListing(listing = {}) {
  return getPromotionState(listing) !== PROMOTION_STATES.STANDARD
}
