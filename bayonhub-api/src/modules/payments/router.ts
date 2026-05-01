import crypto from "crypto"
import { PaymentStatus, PromotionPlan } from "@prisma/client"
import { Router } from "express"

import { env } from "../../config/env"
import { prisma } from "../../lib/prisma"
import { redis } from "../../config/redis"
import { sendTelegramMessage } from "../../lib/telegram"
import { requireAuth } from "../../middleware/auth"

const router = Router()

const PLAN_PRICES: Record<PromotionPlan, number> = {
  BOOST: 2,
  TOP_AD: 5,
  VIP_30: 15,
}

const PLAN_DAYS: Record<PromotionPlan, number> = {
  BOOST: 7,
  TOP_AD: 7,
  VIP_30: 30,
}

function createHttpError(status: number, message: string): Error & { status: number } {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function generateReference(): string {
  return `BAYON-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`
}

function validatePlan(value: unknown): PromotionPlan {
  if (value === "BOOST" || value === "TOP_AD" || value === "VIP_30") return value
  throw createHttpError(400, "Invalid promotion plan")
}

type EscrowType = "Commercial" | "Public" | "Social" | "Individual" | "Financial"

type CustomerKYCData = {
  first_name: string
  last_name: string
  id_number: string
}

type PreAuthPayload = {
  transactionId: string
  amount: number
  currency: "USD" | "KHR"
  returnUrl: string
  customerKycData: CustomerKYCData
  escrowType: EscrowType
  merchantTelegramChatId?: string
  riskCode?: string
}

class PreAuthPayloadBuilder {
  private payload = {} as PreAuthPayload

  static builder() {
    return new PreAuthPayloadBuilder()
  }

  setTransactionId(transactionId: unknown) {
    if (typeof transactionId !== "string" || !transactionId.trim()) {
      throw createHttpError(400, "transaction_id must be a non-empty string")
    }
    this.payload.transactionId = transactionId.trim()
    return this
  }

  setAmount(amount: unknown) {
    const parsed = Number(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw createHttpError(400, "amount must be a positive decimal")
    }
    this.payload.amount = parsed
    return this
  }

  setCurrency(currency: unknown) {
    if (currency !== "USD" && currency !== "KHR") {
      throw createHttpError(400, "currency must be USD or KHR")
    }
    this.payload.currency = currency
    return this
  }

  setReturnUrl(returnUrl: unknown) {
    if (typeof returnUrl !== "string" || !returnUrl.trim()) {
      throw createHttpError(400, "return_url must be a valid URL")
    }
    try {
      new URL(returnUrl)
    } catch {
      throw createHttpError(400, "return_url must be a valid URL")
    }
    this.payload.returnUrl = returnUrl.trim()
    return this
  }

  setCustomerKycData(value: unknown) {
    if (!value || typeof value !== "object") {
      throw createHttpError(400, "customer_kyc_data must be an object")
    }
    const data = value as Record<string, unknown>
    const first_name = typeof data.first_name === "string" && data.first_name.trim()
    const last_name = typeof data.last_name === "string" && data.last_name.trim()
    const id_number = typeof data.id_number === "string" && data.id_number.trim()
    if (!first_name || !last_name || !id_number) {
      throw createHttpError(400, "customer_kyc_data must include first_name, last_name, and id_number")
    }
    this.payload.customerKycData = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      id_number: id_number.trim(),
    }
    return this
  }

  setEscrowType(value: unknown) {
    const validTypes: EscrowType[] = ["Commercial", "Public", "Social", "Individual", "Financial"]
    if (typeof value !== "string" || !validTypes.includes(value as EscrowType)) {
      throw createHttpError(400, "escrow_type must be one of Commercial, Public, Social, Individual, Financial")
    }
    this.payload.escrowType = value as EscrowType
    return this
  }

  setMerchantTelegramChatId(value: unknown) {
    if (value === undefined) return this
    if (typeof value !== "string" || !value.trim()) {
      throw createHttpError(400, "merchant_telegram_chat_id must be a non-empty string")
    }
    this.payload.merchantTelegramChatId = value.trim()
    return this
  }

  setRiskCode(value: unknown) {
    if (value === undefined) return this
    if (typeof value !== "string" || !value.trim()) {
      throw createHttpError(400, "risk_code must be a non-empty string")
    }
    this.payload.riskCode = value.trim()
    return this
  }

  build() {
    const required = ["transactionId", "amount", "currency", "returnUrl", "customerKycData", "escrowType"]
    for (const field of required) {
      if (!(field in this.payload)) {
        throw createHttpError(400, `Missing required field: ${field}`)
      }
    }
    return this.payload
  }
}

async function generateKhqrPayload(reference: string, amount: number): Promise<string> {
  if (env.abaMerchantId && env.abaApiKey) {
    return `ABA_PAYWAY_PENDING:${env.abaMerchantId}:${reference}:${amount.toFixed(2)}`
  }
  return `MOCK_KHQR|merchant=BayonHub|reference=${reference}|amount=${amount.toFixed(2)}|currency=USD`
}

function verifyWebhookSignature(body: unknown, signature: string | undefined): boolean {
  if (!env.abaWebhookSecret) {
    console.warn("[Payments] ABA_WEBHOOK_SECRET missing — processing webhook without signature in development.")
    return true
  }
  if (!signature) {
    console.error("[Payments] Missing signature in webhook request")
    return false
  }

  // NOTE: JSON.stringify can sometimes reorder keys, which might break signatures.
  // In a high-traffic production environment, it is better to use the raw body buffer.
  const payload = JSON.stringify(body)
  const expected = crypto
    .createHmac("sha256", env.abaWebhookSecret)
    .update(payload)
    .digest("hex")

  const isValid = expected === signature
  if (!isValid) {
    console.error("[Payments] Webhook signature mismatch")
  }
  return isValid
}

router.post("/preauth", requireAuth, async (req, res, next) => {
  try {
    const payload = PreAuthPayloadBuilder.builder()
      .setTransactionId(req.body.transaction_id)
      .setAmount(req.body.amount)
      .setCurrency(req.body.currency)
      .setReturnUrl(req.body.return_url)
      .setCustomerKycData(req.body.customer_kyc_data)
      .setEscrowType(req.body.escrow_type)
      .setMerchantTelegramChatId(req.body.merchant_telegram_chat_id)
      .setRiskCode(req.body.risk_code)
      .build()

    const holdId = `PREAUTH-${payload.transactionId}`
    const highRiskCodes = ["NEG - P15: High Risk", "NEG - P14: Negative Info"]
    const isRejected = payload.riskCode ? highRiskCodes.includes(payload.riskCode) : false
    const status = isRejected ? "REJECTED" : "PRE_AUTHORIZED"
    const result = {
      holdId,
      transaction_id: payload.transactionId,
      status,
      escrow_type: payload.escrowType,
      currency: payload.currency,
      amount: payload.amount,
      return_url: payload.returnUrl,
      customer_kyc_data: payload.customerKycData,
      rejected_reason: isRejected ? payload.riskCode : undefined,
      created_at: new Date().toISOString(),
    }

    await redis.set(
      `preauth:${payload.transactionId}`,
      JSON.stringify(result),
      "EX",
      60 * 60 * 24,
    )

    if (isRejected) {
      res.status(422).json(result)
      return
    }

    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

router.post("/omw/:transactionId/action", requireAuth, async (req, res, next) => {
  try {
    const transactionId = String(req.params.transactionId || "").trim()
    if (!transactionId) throw createHttpError(400, "Invalid transactionId")

    const action = String(req.body.action || "").trim().toLowerCase()
    const validActions = ["accept", "hold", "reject"]
    if (!validActions.includes(action)) {
      throw createHttpError(400, "Action must be accept, hold, or reject")
    }

    const stored = await redis.get(`preauth:${transactionId}`)
    if (!stored) throw createHttpError(404, "Pre-authorization transaction not found")

    const data = JSON.parse(stored) as Record<string, unknown>
    data.status = action.toUpperCase()
    data.updated_at = new Date().toISOString()
    data.actioned_by = req.user?.id ?? "unknown"

    await redis.set(`preauth:${transactionId}`, JSON.stringify(data), "EX", 60 * 60 * 24)

    res.status(200).json({ transaction_id: transactionId, status: data.status, actioned_by: data.actioned_by, updated_at: data.updated_at })
  } catch (error) {
    next(error)
  }
})

router.get("/omw/:transactionId", requireAuth, async (req, res, next) => {
  try {
    const transactionId = String(req.params.transactionId || "").trim()
    if (!transactionId) throw createHttpError(400, "Invalid transactionId")

    const stored = await redis.get(`preauth:${transactionId}`)
    if (!stored) throw createHttpError(404, "Pre-authorization transaction not found")

    res.status(200).json(JSON.parse(stored))
  } catch (error) {
    next(error)
  }
})

router.post("/khqr/generate", requireAuth, async (req, res, next) => {
  try {
    const plan = validatePlan(req.body.plan)
    const listingId = typeof req.body.listingId === "string" ? req.body.listingId : undefined

    if (listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { id: true, sellerId: true },
      })
      if (!listing) throw createHttpError(404, "Listing not found")
      if (listing.sellerId !== req.user?.id && req.user?.role !== "ADMIN") {
        throw createHttpError(403, "Forbidden")
      }
    }

    const amount = PLAN_PRICES[plan]
    const expiresAt = addMinutes(new Date(), 30)
    const reference = generateReference()
    const qrPayload = await generateKhqrPayload(reference, amount)

    const payment = await prisma.payment.create({
      data: {
        reference,
        userId: req.user!.id,
        listingId,
        plan,
        amount,
        currency: "USD",
        khqrPayload: qrPayload,
        expiresAt,
      },
    })

    if (typeof req.body.merchantTelegramChatId === "string" && req.body.merchantTelegramChatId.trim()) {
      await redis.set(`payment:telegram:${reference}`, req.body.merchantTelegramChatId.trim(), "EX", 60 * 60 * 24)
    }

    res.status(201).json({
      reference: payment.reference,
      amount,
      currency: payment.currency,
      qrPayload,
      expiresAt: payment.expiresAt,
      status: payment.status,
    })
  } catch (error) {
    next(error)
  }
})

router.post("/khqr/webhook", async (req, res, next) => {
  try {
    const signature = String(req.headers["x-aba-signature"] || "")
    if (!verifyWebhookSignature(req.body, signature)) {
      throw createHttpError(401, "Invalid webhook signature")
    }

    const reference = String(req.body.reference || req.body.tran_id || "")
    if (!reference) throw createHttpError(400, "Missing payment reference")
    const confirmed =
      req.body.status === "PAID" ||
      req.body.status === "APPROVED" ||
      req.body.payment_status === "APPROVED"

    const payment = await prisma.payment.findUnique({ where: { reference } })
    if (!payment) throw createHttpError(404, "Payment not found")

    if (confirmed && payment.status !== PaymentStatus.PAID) {
      const promotionExpiresAt = addDays(new Date(), PLAN_DAYS[payment.plan])
      if (!payment.listingId) throw createHttpError(400, "Payment is not tied to a listing")
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
            webhookPayload: req.body,
          },
        }),
        prisma.listingPromotion.create({
          data: {
            listingId: payment.listingId!,
            paymentId: payment.id,
            plan: payment.plan,
            expiresAt: promotionExpiresAt,
          },
        }),
        prisma.listing.update({
          where: { id: payment.listingId },
          data: { promoted: true, promotedUntil: promotionExpiresAt },
        }),
      ])
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: confirmed ? PaymentStatus.PAID : PaymentStatus.FAILED,
          webhookPayload: req.body,
        },
      })
    }

    const telegramChatId = await redis.get(`payment:telegram:${reference}`)
    if (telegramChatId) {
      const amountText = `${payment.currency === "KHR" ? `${payment.amount.toFixed(2)} ៛` : `$${payment.amount.toFixed(2)}`}`
      const message = `✅ Payment confirmed for BayonHub\nTransaction: ${reference}\nAmount: ${amountText}\nStatus: Paid`
      await sendTelegramMessage(telegramChatId, message)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    next(error)
  }
})

router.get("/status/:reference", requireAuth, async (req, res, next) => {
  try {
    const reference = typeof req.params.reference === "string" ? req.params.reference : undefined
    if (!reference) throw createHttpError(400, "Invalid payment reference")
    const payment = await prisma.payment.findUnique({
      where: { reference },
      select: {
        reference: true,
        userId: true,
        listingId: true,
        plan: true,
        amount: true,
        currency: true,
        status: true,
        expiresAt: true,
        paidAt: true,
      },
    })
    if (!payment) throw createHttpError(404, "Payment not found")
    if (payment.userId !== req.user?.id && req.user?.role !== "ADMIN") {
      throw createHttpError(403, "Forbidden")
    }

    if (payment.status === PaymentStatus.PENDING && payment.expiresAt.getTime() < Date.now()) {
      const expired = await prisma.payment.update({
        where: { reference: payment.reference },
        data: { status: PaymentStatus.EXPIRED },
        select: {
          reference: true,
          listingId: true,
          plan: true,
          amount: true,
          currency: true,
          status: true,
          expiresAt: true,
          paidAt: true,
        },
      })
      res.status(200).json(expired)
      return
    }

    res.status(200).json(payment)
  } catch (error) {
    next(error)
  }
})

export default router
