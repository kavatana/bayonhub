// bayonhub-api/src/modules/auth/oauth.ts
/**
 * Google & Facebook OAuth strategies via Passport.js
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *   FACEBOOK_APP_ID, FACEBOOK_APP_SECRET
 *   FRONTEND_URL (e.g. https://bayonhub.com)
 */
import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import { Strategy as FacebookStrategy } from "passport-facebook"
import { prisma } from "../../lib/prisma"
import { generateTokens, setAuthCookies } from "./service"
import { generateUserSlug } from "../../lib/slug"
import type { Router, Request, Response } from "express"

const FRONTEND_URL = process.env.FRONTEND_URL || "https://bayonhub.com"

const apiBase = (process.env.API_URL || "https://api.bayonhub.com").replace(/\/$/, "")

// ─── Google ───────────────────────────────────────────────────────────────────

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || `${apiBase}/api/auth/google/callback`,
        scope: ["profile", "email"],
      },
      async (_accessToken: any, _refreshToken: any, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value
          if (!email) return done(new Error("No email from Google"), undefined)

          let user = await prisma.user.findUnique({ where: { email } })
          if (!user) {
            // Create a minimal user — phone must be verified later
            user = await prisma.user.create({
              data: {
                email,
                phone: `google-${profile.id}`, // placeholder; user must add real phone
                name: profile.displayName || "Google User",
                passwordHash: "", // OAuth users have no local password
                avatarUrl: profile.photos?.[0]?.value ?? null,
              },
            })
            const slug = await generateUserSlug(user.name, user.id)
            user = await prisma.user.update({ where: { id: user.id }, data: { slug } })
          }

          return done(null, user)
        } catch (err) {
          return done(err as Error, undefined)
        }
      },
    ),
  )
  console.info("[OAuth] Google strategy registered")
} else {
  console.warn("[OAuth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — Google login disabled")
}

// ─── Facebook ─────────────────────────────────────────────────────────────────

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL || `${apiBase}/api/auth/facebook/callback`,
        profileFields: ["id", "displayName", "emails", "photos"],
      },
      async (_accessToken: any, _refreshToken: any, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value
          const fbId = profile.id

          let user = email ? await prisma.user.findUnique({ where: { email } }) : null
          if (!user) {
            user = await prisma.user.create({
              data: {
                email: email ?? null,
                phone: `facebook-${fbId}`,
                name: profile.displayName || "Facebook User",
                passwordHash: "",
                avatarUrl: profile.photos?.[0]?.value ?? null,
              },
            })
            const slug = await generateUserSlug(user.name, user.id)
            user = await prisma.user.update({ where: { id: user.id }, data: { slug } })
          }

          return done(null, user)
        } catch (err) {
          return done(err as Error, undefined)
        }
      },
    ),
  )
  console.info("[OAuth] Facebook strategy registered")
} else {
  console.warn("[OAuth] FACEBOOK_APP_ID or FACEBOOK_APP_SECRET not set — Facebook login disabled")
}

// ─── Shared OAuth callback handler ────────────────────────────────────────────

export async function oauthSuccessHandler(req: Request, res: Response): Promise<void> {
  const user = req.user as { id: string; role: string; verificationTier: string } | undefined
  if (!user) {
    res.redirect(`${FRONTEND_URL}/auth?error=oauth_failed`)
    return
  }

  const { accessToken, refreshToken } = await generateTokens(
    user.id,
    user.role as "USER" | "SELLER" | "ADMIN",
    user.verificationTier as "NONE" | "PHONE" | "IDENTITY",
  )
  setAuthCookies(res, { accessToken, refreshToken })
  res.redirect(`${FRONTEND_URL}/?auth=success`)
}

export function oauthFailureHandler(req: Request, res: Response): void {
  res.redirect(`${FRONTEND_URL}/auth?error=oauth_cancelled`)
}

/**
 * Mount OAuth routes on an Express router.
 * Called from auth/router.ts.
 */
export function mountOAuthRoutes(router: Router): void {
  if (process.env.GOOGLE_CLIENT_ID) {
    router.get(
      "/google",
      passport.authenticate("google", { scope: ["profile", "email"], session: false }),
    )
    router.get(
      "/google/callback",
      passport.authenticate("google", { session: false, failureRedirect: `${FRONTEND_URL}/auth?error=oauth_cancelled` }),
      oauthSuccessHandler,
    )
  }

  if (process.env.FACEBOOK_APP_ID) {
    router.get(
      "/facebook",
      passport.authenticate("facebook", { scope: ["email"], session: false }),
    )
    router.get(
      "/facebook/callback",
      passport.authenticate("facebook", { session: false, failureRedirect: `${FRONTEND_URL}/auth?error=oauth_cancelled` }),
      oauthSuccessHandler,
    )
  }
}
