import multer from "multer"
import { randomUUID } from "crypto"

import FileType from "file-type"

// SVG is explicitly rejected — it can contain embedded scripts
const REJECTED_TYPES = new Set(["image/svg+xml", "image/svg"])

/**
 * Validate a buffer's magic bytes against the declared MIME type.
 * Called AFTER multer has streamed the file into memory.
 */
export async function validateMagicBytes(buffer: Buffer, mimeType: string): Promise<boolean> {
  const type = await FileType.fromBuffer(buffer)
  if (!type) return false
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
  // Enforce 5 MB server-side maximum; individual files and total count
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    // 1. Hard-reject SVG (can carry XSS payloads)
    if (REJECTED_TYPES.has(file.mimetype)) {
      return cb(new Error("SVG files are not permitted"))
    }

    // 2. Reject anything that is not an image MIME type
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"))
    }

    // Magic-byte validation happens after the full buffer is available.
    // See validateMagicBytes() — called in the controller/service layer
    // after multer has written the file into memory.
    cb(null, true)
  },
})
