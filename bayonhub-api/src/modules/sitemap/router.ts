import { Router } from 'express'
import { prisma } from '../../lib/prisma'

const router = Router()

const SITE_URL = process.env.FRONTEND_URL || 'https://bayonhub.com'

router.get('/sitemap', async (_req, res) => {
  const listings = await prisma.listing.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    select: { id: true, title: true, categorySlug: true, province: true, slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 5000,
  })

  const urls: Array<{ loc: string; priority: string; changefreq: string; lastmod?: string }> = [
    { loc: SITE_URL, priority: '1.0', changefreq: 'daily' },
    { loc: `${SITE_URL}/about`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${SITE_URL}/pricing`, priority: '0.6', changefreq: 'weekly' },
    ...listings.map((listing) => ({
      loc: `${SITE_URL}/l/${listing.categorySlug}/${listing.province}/${listing.slug}-${listing.id.slice(0, 8)}`,
      lastmod: listing.updatedAt.toISOString().split('T')[0],
      priority: '0.7',
      changefreq: 'weekly',
    })),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url>\n    <loc>${u.loc}</loc>\n${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ''}    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
    .join('\n')}\n</urlset>`

  res.header('Content-Type', 'application/xml')
  res.header('Cache-Control', 'public, max-age=3600')
  res.send(xml)
})

router.get('/sitemap.xml', async (_req, res) => {
  res.redirect(301, '/api/sitemap')
})

export default router
