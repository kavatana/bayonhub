import { Router } from "express"

const router = Router()

/**
 * @route POST /api/payments/khqr
 * @desc Generate a placeholder KHQR payment reference
 * @access Private
 */
router.post("/khqr", async (req, res) => {
  const { listingId, plan, amount, currency } = req.body

  // TODO: Replace with ABA PayWay KHQR generation
  // ABA PayWay docs: https://payway.ababank.com
  // Required: ABA merchant account + API credentials

  const reference = `BAYONHUB-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`

  res.json({
    reference,
    amount,
    currency,
    qrPayload: "PLACEHOLDER_KHQR_STRING",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    status: "pending",
  })
})

export default router
