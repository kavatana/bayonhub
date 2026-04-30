import type { User } from "@prisma/client"

declare global {
  namespace Express {
    interface Request {
      user?: Pick<User, "id"> & {
        role: "USER" | "SELLER" | "ADMIN"
        verificationTier: "NONE" | "PHONE" | "IDENTITY"
      }
    }
  }
}

export {}
