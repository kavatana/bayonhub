import { DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import fs from "fs"
import path from "path"
import sharp from "sharp"

const hasR2 = Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID)
const isProd = process.env.NODE_ENV === "production"

if (!hasR2) {
  if (isProd) {
    console.error("=".repeat(60))
    console.error("[FATAL] R2 not configured in production. Images will be lost on redeploy.")
    console.error("Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY immediately.")
    console.error("=".repeat(60))
  } else {
    console.warn("[R2] Credentials not configured — using local storage. Set R2_* vars in .env for production.")
  }
}

const s3 = hasR2
  ? new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : null

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")
if (!hasR2) fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true })
const LOCAL_PRIVATE_DIR = path.join(process.cwd(), "private", "uploads")
if (!hasR2) fs.mkdirSync(LOCAL_PRIVATE_DIR, { recursive: true })

export async function processAndUpload(
  buffer: Buffer,
  key: string,
): Promise<{ url: string; thumbUrl: string }> {
  // F3.3 — .rotate() auto-orients from EXIF then strips all EXIF metadata
  // when re-encoding to WebP. GPS, camera model, timestamps are all removed.
  const webp = await sharp(buffer)
    .rotate()                                  // read EXIF orientation, then discard EXIF
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()
  const thumb = await sharp(buffer)
    .rotate()                                  // same EXIF strip for thumbnails
    .resize({ width: 400, withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer()

  if (hasR2 && s3) {
    const thumbKey = key.replace(/(\.[^.]+)$/, "-thumb$1")
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: webp,
        ContentType: "image/webp",
      }),
    )
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: thumbKey,
        Body: thumb,
        ContentType: "image/webp",
      }),
    )
    const base = process.env.R2_PUBLIC_URL!
    return { url: `${base}/${key}`, thumbUrl: `${base}/${thumbKey}` }
  }

  if (isProd) {
    const error = new Error("Image upload unavailable. Configure R2 storage.") as any
    error.status = 503
    throw error
  }

  // F3.5 — Dev fallback: files served directly from Express at localhost.
  // TODO: In production this path is unreachable (R2 is required). If adding a
  // staging environment, wire a real CDN here — never serve user uploads from
  // the same Express origin in production (no Content-Disposition isolation).
  const filename = key.replace(/^\/+/, "")
  const thumbFilename = filename.replace(".webp", "-thumb.webp")
  fs.mkdirSync(path.dirname(path.join(LOCAL_UPLOAD_DIR, filename)), { recursive: true })
  fs.writeFileSync(path.join(LOCAL_UPLOAD_DIR, filename), webp)
  fs.writeFileSync(path.join(LOCAL_UPLOAD_DIR, thumbFilename), thumb)
  const base = `http://localhost:${process.env.PORT || 4000}/uploads`
  return { url: `${base}/${filename}`, thumbUrl: `${base}/${thumbFilename}` }
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  if (!hasR2 || !s3) {
    return {
      uploadUrl: `http://localhost:${process.env.PORT || 4000}/api/listings/upload-local`,
      publicUrl: `http://localhost:${process.env.PORT || 4000}/uploads/${key}`,
      key,
    }
  }

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  })
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 })
  return { uploadUrl, publicUrl: `${process.env.R2_PUBLIC_URL}/${key}`, key }
}

export async function deleteFromStorage(key: string): Promise<void> {
  const normalizedKey = normalizeStorageKey(key)
  if (hasR2 && s3) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: normalizedKey,
      }),
    )
    return
  }

  const filepath = path.join(LOCAL_UPLOAD_DIR, normalizedKey.replace(/^\/+/, ""))
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
}

export async function deleteFromR2(urlOrKey: string): Promise<void> {
  await deleteFromStorage(urlOrKey)
}

function normalizeStorageKey(urlOrKey: string): string {
  const value = urlOrKey.trim()
  if (!value) return value
  const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "")
  if (publicBase && value.startsWith(`${publicBase}/`)) {
    return value.slice(publicBase.length + 1)
  }
  try {
    const url = new URL(value)
    return url.pathname.replace(/^\/+/, "")
  } catch {
    return value.replace(/^\/+/, "")
  }
}

export async function uploadPrivateDocument(buffer: Buffer, key: string): Promise<string> {
  // F3.3 — .rotate() strips EXIF (including ID document metadata) before storage
  const webp = await sharp(buffer)
    .rotate()                                  // read EXIF orientation, then discard EXIF
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer()

  if (hasR2 && s3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: webp,
        ContentType: "image/webp",
      }),
    )
    return key
  }

  if (isProd) {
    const error = new Error("Private document upload unavailable. Configure R2 storage.") as any
    error.status = 503
    throw error
  }

  const filename = key.replace(/^\/+/, "")
  const filepath = path.join(LOCAL_PRIVATE_DIR, filename)
  fs.mkdirSync(path.dirname(filepath), { recursive: true })
  fs.writeFileSync(filepath, webp)
  return filename
}

export function getLocalPrivateDocumentPath(key: string): string {
  return path.join(LOCAL_PRIVATE_DIR, key.replace(/^\/+/, ""))
}

export async function getPrivateDocumentReadUrl(key: string, ttlSeconds = 900): Promise<string | null> {
  if (!hasR2 || !s3) return null
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  })
  return getSignedUrl(s3, command, { expiresIn: ttlSeconds })
}

export async function testR2Connection(): Promise<boolean> {
  if (!hasR2 || !s3) {
    console.warn("[R2] Not configured — using local storage fallback")
    return false
  }
  try {
    await s3.send(new HeadBucketCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
    }))
    console.info("[R2] Connected to bucket:", process.env.R2_BUCKET_NAME)
    return true
  } catch (err) {
    console.error("[R2] Connection failed:", err instanceof Error ? err.message : err)
    return false
  }
}
