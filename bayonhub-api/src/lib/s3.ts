import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import fs from "fs"
import path from "path"
import sharp from "sharp"

const hasR2 = Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID)
if (!hasR2) {
  console.warn("[R2] Credentials not configured — using local storage. Set R2_* vars in .env for production.")
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

export async function processAndUpload(
  buffer: Buffer,
  key: string,
): Promise<{ url: string; thumbUrl: string }> {
  const webp = await sharp(buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()
  const thumb = await sharp(buffer)
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
  if (hasR2 && s3) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      }),
    )
    return
  }

  const filepath = path.join(LOCAL_UPLOAD_DIR, key.replace(/^\/+/, ""))
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
}
