import webpush, { PushSubscription as WebPushSubscription } from "web-push"

import { env } from "../config/env"
import { prisma } from "./prisma"

const pushConfigured = Boolean(env.vapidPublicKey && env.vapidPrivateKey)

if (pushConfigured) {
  webpush.setVapidDetails(env.vapidSubject, env.vapidPublicKey!, env.vapidPrivateKey!)
}

export function getVapidPublicKey() {
  return env.vapidPublicKey
}

export async function savePushSubscription(
  userId: string,
  data: {
    endpoint?: unknown
    keys?: { p256dh?: unknown; auth?: unknown }
  },
) {
  if (typeof data.endpoint !== "string" || !data.endpoint) {
    const error = new Error("Push endpoint is required") as Error & { status: number }
    error.status = 400
    throw error
  }
  const p256dh = typeof data.keys?.p256dh === "string" ? data.keys.p256dh : ""
  const auth = typeof data.keys?.auth === "string" ? data.keys.auth : ""
  if (!p256dh || !auth) {
    const error = new Error("Push keys are required") as Error & { status: number }
    error.status = 400
    throw error
  }

  return prisma.pushSubscription.upsert({
    where: { endpoint: data.endpoint },
    update: { userId, p256dh, auth },
    create: { userId, endpoint: data.endpoint, p256dh, auth },
  })
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; link?: string | null; type?: string },
) {
  if (!pushConfigured) return
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  })
  await Promise.all(
    subscriptions.map(async (subscription) => {
      const pushSubscription: WebPushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      }
      try {
        await webpush.sendNotification(pushSubscription, JSON.stringify(payload))
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => null)
        } else {
          console.warn("[Push] Notification send failed:", error instanceof Error ? error.message : error)
        }
      }
    }),
  )
}
