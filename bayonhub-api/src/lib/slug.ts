import { prisma } from "./prisma"

export async function generateUserSlug(name: string, userId: string): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40)
  
  const suffix = userId.slice(0, 6)
  const candidate = `${base || "seller"}-${suffix}`
  
  const existing = await prisma.user.findFirst({
    where: { slug: candidate, NOT: { id: userId } },
  })
  
  if (existing) return `${base}-${userId.slice(0, 8)}`
  return candidate
}

export async function generateUniqueSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50) || "listing"

  let attempt = base
  let counter = 1

  while (await prisma.listing.findUnique({ where: { slug: attempt } })) {
    attempt = `${base}-${counter}`
    counter += 1
  }

  return attempt
}
