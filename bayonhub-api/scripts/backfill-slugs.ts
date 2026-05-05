import { prisma } from "../src/lib/prisma"
import { generateUserSlug } from "../src/lib/slug"

async function main() {
  const users = await prisma.user.findMany({
    where: { slug: null },
    select: { id: true, name: true },
  })

  console.log(`[Backfill] Found ${users.length} users without slugs.`)

  for (const user of users) {
    const slug = await generateUserSlug(user.name, user.id)
    await prisma.user.update({
      where: { id: user.id },
      data: { slug },
    })
    console.log(`[Backfill] Updated user ${user.id} with slug: ${slug}`)
  }

  console.log("[Backfill] Completed.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
