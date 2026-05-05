import DOMPurify from 'dompurify'

export function sanitizeText(input) {
  if (!input || typeof input !== 'string') return ''
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

export function sanitizeHtml(input) {
  if (!input || typeof input !== 'string') return ''
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: [],
  })
}
