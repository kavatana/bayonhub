import { Router, type RequestHandler } from "express"
import * as storefrontController from "./controller"
import { requireAuth } from "../../middleware/auth"

const router = Router()

const responseEnvelope: RequestHandler = (_req, res, next) => {
  const originalJson = res.json.bind(res)
  res.json = (body?: unknown) => {
    if (res.statusCode >= 400) {
      const errorBody = body && typeof body === "object" ? body as { message?: unknown; error?: unknown } : {}
      const message = typeof errorBody.message === "string"
        ? errorBody.message
        : typeof errorBody.error === "string"
          ? errorBody.error
          : "An error occurred"
      return originalJson({ error: true, message })
    }
    return originalJson({ data: body ?? null })
  }
  next()
}

router.use(responseEnvelope)

router.get("/:identifier", storefrontController.getStorefront)
router.post("/review", requireAuth, storefrontController.postReview)

export default router
