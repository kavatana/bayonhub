import multer from "multer"
import { randomUUID } from "crypto"

import FileType from "file-type"

// F3.1 — Explicit allowlist of permitted image MIME types
// Only these four types are accepted for all upload endpoints
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

// F3.6 — Expanded rejection list: dangerous content types that must never be stored
// SVG can carry XSS payloads, executables/scripts are obvious threats
const REJECTED_TYPES = new Set([
  "image/svg+xml",
  "image/svg",
  "application/x-msdownload",  // .exe / .dll
  "application/x-php",          // PHP scripts
  "application/javascript",     // JS files disguised as uploads
  "application/x-sh",           // Shell scripts
  "text/javascript",            // Alt JS MIME
  "text/x-php",                 // Alt PHP MIME
  "application/octet-stream",   // Generic binary — reject to prevent disguised executables
])

/**
 * F3.1 — Validate a buffer's magic bytes against the declared MIME type.
 * Enforces the ALLOWED_IMAGE_TYPES allowlist — if the declared type is not
 * in the allowlist, or if the buffer's actual type doesn't match the declared
 * type, the file is rejected.
 *
 * Called AFTER multer has streamed the file into memory in the controller/service layer.
 */
export async function validateMagicBytes(buffer: Buffer, mimeType: string): Promise<boolean> {
  // F3.1: Allowlist check — reject anything not explicitly permitted
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) return false

  // F3.6: Extra rejection safety net — belt + suspenders with the fileFilter below
  if (REJECTED_TYPES.has(mimeType)) return false

  // Magic bytes check — verify the buffer content matches the declared MIME
  const type = await FileType.fromBuffer(buffer)
  if (!type) return false

  // The buffer's actual MIME must match the declared MIME exactly
  return type.mime === mimeType
}

/**
 * Generate a UUID-based safe filename with the given extension.
 * Prevents path traversal and strips original filenames from storage keys.
 */
export function safeFilename(ext = "jpg"): string {
  return `${randomUUID()}.${ext}`
}

export const upload = multer({
  storage: multer.memoryStorage(),
  // F3.2 — 5 MB server-side maximum per file; limit total file count
  limits: { fileSize: 5 * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) => {
    // F3.6: Hard-reject dangerous content types regardless of MIME prefix
    if (REJECTED_TYPES.has(file.mimetype)) {
      return cb(new Error(`File type '${file.mimetype}' is not permitted`))
    }

    // F3.1: Reject anything not in the explicit image allowlist
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      return cb(new Error(`File type '${file.mimetype}' is not allowed. Permitted types: JPEG, PNG, WebP, GIF`))
    }

    // Magic-byte validation happens after the full buffer is available.
    // See validateMagicBytes() — called in the controller/service layer
    // after multer has written the file into memory.
    cb(null, true)
  },
})
