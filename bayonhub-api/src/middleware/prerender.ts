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

    // List of additional bot agents we want to handle
    middleware.addSearchEngineUserAgent("googlebot")
    middleware.addSearchEngineUserAgent("bingbot")
    middleware.addSearchEngineUserAgent("baiduspider")
    middleware.addSearchEngineUserAgent("facebookexternalhit")
    middleware.addSearchEngineUserAgent("twitterbot")
    middleware.addSearchEngineUserAgent("rogerbot")
    middleware.addSearchEngineUserAgent("linkedinbot")
    middleware.addSearchEngineUserAgent("embedly")
    middleware.addSearchEngineUserAgent("quora link preview")
    middleware.addSearchEngineUserAgent("showyoubot")
    middleware.addSearchEngineUserAgent("outbrain")
    middleware.addSearchEngineUserAgent("pinterest/0.")
    middleware.addSearchEngineUserAgent("developers.google.com/+/web/snippet")
    middleware.addSearchEngineUserAgent("slackbot")
    middleware.addSearchEngineUserAgent("vkShare")
    middleware.addSearchEngineUserAgent("W3C_Validator")
    middleware.addSearchEngineUserAgent("redditbot")
    middleware.addSearchEngineUserAgent("Applebot")
    middleware.addSearchEngineUserAgent("WhatsApp")
    middleware.addSearchEngineUserAgent("flipboard")
    middleware.addSearchEngineUserAgent("tumblr")
    middleware.addSearchEngineUserAgent("bitlybot")
    middleware.addSearchEngineUserAgent("SkypeShell")
    middleware.addSearchEngineUserAgent("bufferbot")
    middleware.addSearchEngineUserAgent("adidxbot")
    middleware.addSearchEngineUserAgent("CloudFlare-AlwaysOnline")
    middleware.addSearchEngineUserAgent("Google-Structure-Data-Testing-Tool")

    return middleware(req, res, next)
  }

  next()
}

export default prerenderMiddleware
