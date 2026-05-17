import { randomUUID } from "crypto"
import { PaymentStatus, PromotionPlan } from "@prisma/client"

import { env } from "../../config/env"
import { prisma } from "../../lib/prisma"
import { uploadPrivateDocument } from "../../lib/s3"
import { sendTelegramMessage } from "../../lib/telegram"
import { validateMagicBytes } from "../../middleware/upload"

const PLUS_MONTHLY_AMOUNT = 2.5
const RECEIPT_TTL_DAYS = 30

function createHttpError(status: number, message: string): Error & { status: number } {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function plusReference() {
  return `PLUS-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`
}

async function sendAdminEmail(input: {
  subject: string
  text: string
  html: string
}) {
  if (!env.adminEmail) {
    console.warn("[Payments] ADMIN_EMAIL missing; skipped admin email notification.")
    return false
  }
  if (!env.resendApiKey) {
    console.warn("[Payments] RESEND_API_KEY missing; skipped admin email notification.")
    return false
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "BayonHub <notifications@bayonhub.com>",
      to: [env.adminEmail],
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  })
  if (!response.ok) {
    console.warn("[Payments] Admin email notification failed:", response.status)
    return false
  }
  return true
}

async function notifyAdminPaymentSubmitted(payment: {
  id: string
  screenshotUrl: string | null
  note: string | null
  createdAt: Date
  user: {
    name: string
    email: string | null
    phone: string
  }
}) {
  const reviewUrl = env.adminPanelUrl
  const submittedAt = payment.createdAt.toISOString()
  const note = payment.note || "-"
  const subject = "New Plus payment submission"
  const text = [
    "New Plus payment submission",
    `User: ${payment.user.name}`,
    `Email: ${payment.user.email || "-"}`,
    `Phone: ${payment.user.phone}`,
    `Submitted: ${submittedAt}`,
    `Screenshot: ${payment.screenshotUrl || "-"}`,
    `Note: ${note}`,
    `Review: ${reviewUrl}`,
  ].join("\n")
  const html = `
    <p><strong>New Plus payment submission</strong></p>
    <p>User: ${payment.user.name} (${payment.user.phone})</p>
    <p>Email: ${payment.user.email || "-"}</p>
    <p>Submitted: ${submittedAt}</p>
    <p>Screenshot: ${payment.screenshotUrl || "-"}</p>
    <p>Note: ${note}</p>
    <p>Review: <a href="${reviewUrl}">${reviewUrl}</a></p>
  `

  await Promise.all([
    sendAdminEmail({ subject, text, html }),
    sendTelegramMessage(
      env.adminTelegramChatId,
      `💳 New Plus payment\nUser: ${payment.user.name} (${payment.user.phone})\nNote: ${note}\nReview: ${reviewUrl}`,
      reviewUrl,
    ),
  ])
}

export async function submitPlusPayment(
  userId: string,
  file: Express.Multer.File | undefined,
  note?: string,
) {
  if (!file) throw createHttpError(400, "Payment screenshot is required")
  if (!file.mimetype.startsWith("image/")) throw createHttpError(400, "Only image files are allowed")
  const validImage = await validateMagicBytes(file.buffer, file.mimetype)
  if (!validImage) throw createHttpError(400, "Invalid image file")

  const screenshotKey = await uploadPrivateDocument(file.buffer, `payments/${userId}/${randomUUID()}.webp`)
  const payment = await prisma.payment.create({
    data: {
      reference: plusReference(),
      userId,
      plan: PromotionPlan.VIP_30,
      amount: PLUS_MONTHLY_AMOUNT,
      currency: "USD",
      status: PaymentStatus.PENDING,
      screenshotUrl: screenshotKey,
      note: typeof note === "string" && note.trim() ? note.trim() : null,
      expiresAt: addDays(new Date(), RECEIPT_TTL_DAYS),
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  })

  await notifyAdminPaymentSubmitted(payment)
  return { message: "Payment submitted for review" }
}

export async function getMyPayments(userId: string) {
  return prisma.payment.findMany({
    where: {
      userId,
      screenshotUrl: { not: null },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      reviewNote: true,
    },
  })
}
