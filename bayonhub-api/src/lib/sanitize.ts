/**
 * F2.3 — XSS sanitization helpers using sanitize-html.
 * Use stripTags() for plain text fields (title, location, name, bio).
 * Use allowBasicHtml() for rich text fields (description).
 */
import sanitizeHtml from "sanitize-html"

/** Strip all HTML — safe for plain text fields */
export function stripTags(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim()
}

/** Allow basic safe inline formatting — for description fields */
export function allowBasicHtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: ["b", "i", "em", "strong", "br"],
    allowedAttributes: {},
  }).trim()
}
