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
    }
    interface Request {
      user?: User
    }
  }
}

export {}
