export const CAMBODIA_PHONE_REGEX = /^\+855[1-9][0-9]{7,8}$/
export const LEAD_TYPES = ["CALL", "WHATSAPP", "TELEGRAM", "CHAT", "OFFER"]

export function normalizePhone(input) {
  if (!input) return ""
  let phone = input.replace(/[\s\-().]/g, "")
  if (phone.startsWith("0")) phone = `+855${phone.slice(1)}`
  if (phone.startsWith("855") && !phone.startsWith("+")) phone = `+${phone}`
  if (!phone.startsWith("+")) phone = `+855${phone}`
  return phone
}

export function validatePhone(input) {
  const phone = normalizePhone(input)
  if (!CAMBODIA_PHONE_REGEX.test(phone)) {
    return {
      valid: false,
      error: "invalidPhone",
      normalized: null,
    }
  }
  return { valid: true, error: null, normalized: phone }
}

export function buildLeadPayload(type, data = {}) {
  if (!LEAD_TYPES.includes(type)) throw new Error(`Invalid lead type: ${type}`)
  const base = {
    type,
    createdAt: new Date().toISOString(),
    sessionId: getSessionId(),
  }

  switch (type) {
    case "CALL":
      return { ...base, phone: data.phone || null }
    case "WHATSAPP":
      return { ...base, phone: data.phone || null, message: data.message || null }
    case "TELEGRAM":
      return { ...base, message: data.message || null }
    case "CHAT":
      return { ...base, message: data.message || "Is this still available?" }
    case "OFFER":
      if (!data.offerPrice || Number.isNaN(Number(data.offerPrice))) {
        throw new Error("Offer price is required and must be a number")
      }
      if (Number(data.offerPrice) <= 0) {
        throw new Error("Offer price must be greater than 0")
      }
      return {
        ...base,
        offerPrice: Number(data.offerPrice),
        message: data.message || null,
      }
    default:
      return base
  }
}

function getSessionId() {
  let id = sessionStorage.getItem("bayonhub:session")
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem("bayonhub:session", id)
  }
  return id
}
