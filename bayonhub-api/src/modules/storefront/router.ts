import { Router } from "express"
import * as storefrontController from "./controller"
import { requireAuth } from "../../middleware/auth"

const router = Router()

router.get("/:identifier", storefrontController.getStorefront)
router.post("/review", requireAuth, storefrontController.postReview)

export default router
