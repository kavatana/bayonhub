declare module "prerender-node" {
  import { RequestHandler } from "express"

  interface PrerenderMiddleware extends RequestHandler {
    set(key: string, value: string): PrerenderMiddleware
    addSearchEngineUserAgent(userAgent: string): void
  }

  const prerender: PrerenderMiddleware
  export default prerender
}
