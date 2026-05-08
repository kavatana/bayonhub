import type { User as PrismaUser } from "@prisma/client"

declare global {
  namespace Express {
    interface User {
      id: string
      role: "USER" | "SELLER" | "ADMIN"
      verificationTier: "NONE" | "PHONE" | "IDENTITY"
      email: string | null
      name: string | null
      phone: string | null
      avatarUrl: string | null
      isActive: boolean
      isAdmin: boolean
      banReason: string | null
      bannedUntil: Date | null
      phoneVerified: boolean
      isVerifiedSeller: boolean
      lastSeen: Date | null
      responseRate: number | null
      telegramChatId: string | null
    }
    interface Request {
      user?: User
    }
  }
}

export {}
