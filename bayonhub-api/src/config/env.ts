import dotenv from "dotenv"

dotenv.config()

const nodeEnv = process.env.NODE_ENV || "development"
const productionRequired = ["FRONTEND_URL", "JWT_SECRET", "DATABASE_URL", "REDIS_URL"] as const

if (nodeEnv === "production") {
  productionRequired.forEach((key) => {
    if (!process.env[key]) throw new Error(`[FATAL] Missing production env var: ${key}`)
  })
}

const required = [
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_EXPIRES_IN",
  "JWT_REFRESH_EXPIRES_IN",
  "PORT",
] as const

required.forEach((key) => {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`)
})

function optionalEnv(key: string): string | null {
  const value = process.env[key]
  if (!value) {
    console.warn(`[Env] Optional env var missing: ${key}`)
    return null
  }
  return value
}

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN!,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN!,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  port: Number(process.env.PORT),
  nodeEnv,
  r2AccountId: optionalEnv("R2_ACCOUNT_ID"),
  r2AccessKeyId: optionalEnv("R2_ACCESS_KEY_ID"),
  r2SecretAccessKey: optionalEnv("R2_SECRET_ACCESS_KEY"),
  r2BucketName: process.env.R2_BUCKET_NAME || "bayonhub-media",
  r2PublicUrl: process.env.R2_PUBLIC_URL || "https://media.bayonhub.com",
  twilioAccountSid: optionalEnv("TWILIO_ACCOUNT_SID"),
  twilioAuthToken: optionalEnv("TWILIO_AUTH_TOKEN"),
  twilioPhoneNumber: optionalEnv("TWILIO_PHONE_NUMBER"),
}
