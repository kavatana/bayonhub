import type { RequestHandler } from "express"
import prerender from "prerender-node"

/**
 * Middleware to detect crawlers and serve pre-rendered HTML via Prerender.io.
 * 
 * Requires PRERENDER_TOKEN in .env for production use.
 * If token is missing, it will still function but might be rate-limited by Prerender.io.
 */
const prerenderMiddleware: RequestHandler = (req, res, next) => {
  const token = process.env.PRERENDER_TOKEN

  // Only run if we are in production or have a token explicitly
  if (process.env.NODE_ENV === "production" || token) {
    const middleware = prerender.set("prerenderServiceUrl", "https://service.prerender.io/")
    
    if (token) {
      middleware.set("prerenderToken", token)
    }

    // Default bots are already configured in prerender-node

    return middleware(req, res, next)
  }

  next()
}

export default prerenderMiddleware
