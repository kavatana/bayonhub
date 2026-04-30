import crypto from "crypto"

import { prisma } from "./prisma"

export async function generateUniqueSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\u1780-\u17FF]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
  const suffix = crypto.randomUUID().slice(0, 5)
  const candidate = `${base || "listing"}-${suffix}`
  const existing = await prisma.listing.findUnique({ where: { slug: candidate } })
  if (existing) return generateUniqueSlug(title)
  return candidate
}
