import { z } from "zod"
import DOMPurify from "dompurify"
import { JSDOM } from "jsdom"

const window = new JSDOM("").window
const purify = DOMPurify(window)

const sanitize = (val: string) => purify.sanitize(val, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()
const sanitizeHtml = (val: string) => purify.sanitize(val, {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "br"],
  ALLOWED_ATTR: [],
}).trim()

export const listingSchema = z.object({
  title: z.string().min(1).max(100).transform(sanitize),
  titleKm: z.string().max(100).transform(sanitize).optional().nullable(),
  description: z.string().min(1).max(5000).transform(sanitizeHtml),
  descriptionKm: z.string().max(5000).transform(sanitizeHtml).optional().nullable(),
  price: z.union([z.string(), z.number()]).transform((val: string | number) => Number(val)),
  currency: z.string().default("USD"),
  categorySlug: z.string().min(1).transform(sanitize),
  subcategorySlug: z.string().transform(sanitize).optional().nullable(),
  province: z.string().min(1).transform(sanitize),
  district: z.string().transform(sanitize).optional().nullable(),
  addressDetail: z.string().transform(sanitize).optional().nullable(),
  condition: z.string().transform(sanitize).optional().nullable(),
  negotiable: z.union([z.boolean(), z.string()]).transform((val: boolean | string) => val === true || val === "true"),
  lat: z.union([z.string(), z.number()]).optional().nullable().transform((val: string | number | null | undefined) => val ? Number(val) : null),
  lng: z.union([z.string(), z.number()]).optional().nullable().transform((val: string | number | null | undefined) => val ? Number(val) : null),
})

export type ListingInputValidated = z.infer<typeof listingSchema>
