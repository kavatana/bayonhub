import "dotenv/config"
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { PrismaClient } from "@prisma/client"
import Redis from "ioredis"
import { randomUUID } from "node:crypto"

type CheckResult = "PASS" | "FAIL"

const prisma = new PrismaClient()

function print(name: string, result: CheckResult, detail = "") {
  console.log(`${result} ${name}${detail ? ` - ${detail}` : ""}`)
}

function requiredEnvVars() {
  const vars = [
    "DATABASE_URL",
    "REDIS_URL",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "API_BASE_URL",
    "FRONTEND_URL",
    "FRONTEND_URL_WWW",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
  ]
  if (process.env.NODE_ENV === "production") vars.push("ABA_WEBHOOK_SECRET")
  return vars
}

function validUrl(value: string | undefined) {
  if (!value) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

async function checkEnv() {
  const missing = requiredEnvVars().filter((key) => !process.env[key])
  print("required env vars", missing.length ? "FAIL" : "PASS", missing.length ? `missing ${missing.join(", ")}` : "")
  return missing.length === 0
}

async function checkUrls() {
  const keys = ["API_BASE_URL", "FRONTEND_URL", "FRONTEND_URL_WWW"]
  const invalid = keys.filter((key) => !validUrl(process.env[key]))
  print("public URLs", invalid.length ? "FAIL" : "PASS", invalid.length ? `invalid ${invalid.join(", ")}` : "")
  return invalid.length === 0
}

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`
    print("database", "PASS")
    return true
  } catch {
    print("database", "FAIL", "connection failed")
    return false
  }
}

async function checkRedis() {
  const redis = new Redis(process.env.REDIS_URL || "", { lazyConnect: true, maxRetriesPerRequest: 1 })
  try {
    await redis.connect()
    await redis.ping()
    print("redis", "PASS")
    return true
  } catch {
    print("redis", "FAIL", "ping failed")
    return false
  } finally {
    redis.disconnect()
  }
}

async function checkR2() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET_NAME
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    print("r2 upload-read-delete", "FAIL", "missing R2 configuration")
    return false
  }
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
  const key = `health-checks/test-${randomUUID()}.txt`
  try {
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: "bayonhub-health-check", ContentType: "text/plain" }))
    await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    print("r2 upload-read-delete", "PASS")
    return true
  } catch {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    } catch {
      // best effort cleanup
    }
    print("r2 upload-read-delete", "FAIL", "cycle failed")
    return false
  }
}

async function checkHealth() {
  const base = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 4000}`
  try {
    const response = await fetch(`${base.replace(/\/+$/, "")}/health`)
    print("/health", response.ok ? "PASS" : "FAIL", response.ok ? "" : `status ${response.status}`)
    return response.ok
  } catch {
    print("/health", "FAIL", "request failed")
    return false
  }
}

async function main() {
  const checks = await Promise.all([
    checkEnv(),
    checkUrls(),
    checkDatabase(),
    checkRedis(),
    checkR2(),
    checkHealth(),
  ])
  await prisma.$disconnect()
  if (checks.some((value) => !value)) process.exit(1)
}

main().catch(async () => {
  print("launch check", "FAIL", "unexpected error")
  await prisma.$disconnect()
  process.exit(1)
})
