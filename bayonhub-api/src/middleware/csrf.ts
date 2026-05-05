import crypto from 'crypto'
import { type Request, type Response, type NextFunction } from 'express'

const COOKIE_NAME = 'XSRF-TOKEN'
const HEADER_NAME = 'x-xsrf-token'

export function setCsrfCookie(req: Request, res: Response, next: NextFunction) {
  if (!req.cookies?.[COOKIE_NAME]) {
    res.cookie(COOKIE_NAME, crypto.randomUUID(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
  }
  next()
}

export function verifyCsrfToken(req: Request, res: Response, next: NextFunction) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (safeMethods.includes(req.method)) {
    return next()
  }

  const cookieToken = req.cookies?.[COOKIE_NAME]
  const headerToken = String(req.headers[HEADER_NAME] || '')
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'CSRF token mismatch' })
  }

  return next()
}
