import { Request, Response, Router } from 'express'
import sharp from 'sharp'
import { prisma } from '../../lib/prisma'

const router = Router()

const SITE_URL = process.env.FRONTEND_URL || 'https://bayonhub.com'
const SITEMAP_CACHE_MS = 60 * 60 * 1000
const MAX_SITEMAP_URLS = 50_000
const CATEGORY_SLUGS = [
  'vehicles',
  'phones-tablets',
  'electronics',
  'house-land',
  'jobs',
  'services',
  'fashion',
  'furniture-home',
  'books-sports-hobbies',
  'pets-animals',
  'food-drinks',
  'tuk-tuk',
]

let sitemapCache: { xml: string; expiresAt: number } | null = null

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function escapeSvg(value: string) {
  return escapeXml(value)
}

function sitePath(path: string) {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

function formatPrice(value: unknown, currency = 'USD') {
  const amount = Number(value || 0)
  if (!amount) return 'Negotiable'
  const formatted = amount.toLocaleString('en-US', { maximumFractionDigits: 0 })
  return currency === 'KHR' ? `៛ ${formatted}` : `$${formatted}`
}

function wrapText(value: string, maxChars: number, maxLines: number) {
  const words = value.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
    if (lines.length === maxLines) break
  }

  if (current && lines.length < maxLines) lines.push(current)
  return lines
}

async function buildSitemapXml() {
  const listings = await prisma.listing.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: MAX_SITEMAP_URLS - CATEGORY_SLUGS.length - 1,
  })

  const urls: Array<{ loc: string; priority: string; changefreq: string; lastmod?: string }> = [
    { loc: SITE_URL, priority: '1.0', changefreq: 'daily' },
    ...CATEGORY_SLUGS.map((slug) => ({
      loc: sitePath(`/category/${slug}`),
      priority: '0.8',
      changefreq: 'daily',
    })),
    ...listings.map((listing) => ({
      loc: sitePath(`/listing/${listing.id}`),
      lastmod: listing.updatedAt.toISOString().split('T')[0],
      priority: '0.7',
      changefreq: 'weekly',
    })),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ''}    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
    .join('\n')}\n</urlset>`
}

async function sitemapHandler(_req: Request, res: Response) {
  if (!sitemapCache || sitemapCache.expiresAt <= Date.now()) {
    sitemapCache = {
      xml: await buildSitemapXml(),
      expiresAt: Date.now() + SITEMAP_CACHE_MS,
    }
  }

  res.header('Content-Type', 'application/xml')
  res.header('Cache-Control', 'public, max-age=3600')
  res.send(sitemapCache.xml)
}

async function fetchImageBuffer(url?: string | null) {
  if (!url || !/^https?:\/\//i.test(url)) return null
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) })
    if (!response.ok) return null
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) return null
    return Buffer.from(await response.arrayBuffer())
  } catch {
    return null
  }
}

router.get('/sitemap', sitemapHandler)
router.get('/sitemap.xml', sitemapHandler)

router.get('/og-image/:listingId', async (req, res, next) => {
  try {
    const listing = await prisma.listing.findFirst({
      where: {
        id: req.params.listingId,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      select: {
        title: true,
        price: true,
        currency: true,
        images: {
          select: { url: true },
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
    })

    if (!listing) {
      res.status(404).json({ error: 'Listing not found' })
      return
    }

    const imageBuffer = await fetchImageBuffer(listing.images[0]?.url)
    const titleLines = wrapText(listing.title, 34, 3)
    const price = formatPrice(listing.price, listing.currency)
    const textSvg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#111827" stop-opacity="0.92"/>
            <stop offset="58%" stop-color="#111827" stop-opacity="0.64"/>
            <stop offset="100%" stop-color="#111827" stop-opacity="0.12"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="${imageBuffer ? 'url(#shade)' : '#111827'}"/>
        <rect x="0" y="0" width="1200" height="630" fill="url(#shade)"/>
        <text x="72" y="100" fill="#ffffff" font-family="Arial, sans-serif" font-size="34" font-weight="700">BayonHub</text>
        ${titleLines.map((line, index) => `<text x="72" y="${230 + index * 66}" fill="#ffffff" font-family="Arial, sans-serif" font-size="56" font-weight="800">${escapeSvg(line)}</text>`).join('')}
        <text x="72" y="520" fill="#ffffff" font-family="Arial, sans-serif" font-size="50" font-weight="800">${escapeSvg(price)}</text>
        <rect x="72" y="548" width="186" height="10" rx="5" fill="#C62828"/>
      </svg>`
    const overlay = Buffer.from(textSvg)
    const output = imageBuffer
      ? await sharp(imageBuffer)
          .resize(1200, 630, { fit: 'cover' })
          .composite([{ input: overlay }])
          .png()
          .toBuffer()
      : await sharp(overlay).png().toBuffer()

    res.header('Content-Type', 'image/png')
    res.header('Cache-Control', 'public, max-age=3600')
    res.send(output)
  } catch (error) {
    next(error)
  }
})

export default router
