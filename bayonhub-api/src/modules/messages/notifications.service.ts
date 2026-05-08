import { Prisma } from "@prisma/client"

import { env } from "../../config/env"
import { prisma } from "../../lib/prisma"
import { sendPushToUser } from "../../lib/push"
import { sendTelegramMessage } from "../../lib/telegram"

export interface NotificationInput {
  userId: string
  type: string
  title: string
  body: string
  link?: string | null
}

export async function createNotification(input: NotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link || null,
    },
  })
}

export async function createNotifications(inputs: NotificationInput[]) {
  if (!inputs.length) return { count: 0 }
  return prisma.notification.createMany({ data: inputs })
}

export async function getNotifications(userId: string, options: { page?: number; limit?: number; unreadOnly?: boolean }) {
  const page = Math.max(1, Number(options.page || 1))
  const limit = Math.min(Math.max(1, Number(options.limit || 20)), 50)
  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(options.unreadOnly ? { read: false } : {}),
  }
  const [data, total, unreadTotal] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: [{ read: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, read: false } }),
  ])
  return {
    data,
    total,
    unreadTotal,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  }
}

export async function markAllNotificationsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
  return { success: true, updated: result.count }
}

export async function markNotificationRead(userId: string, id: string) {
  return prisma.notification.update({
    where: { id, userId },
    data: { read: true },
  })
}

export async function deleteNotification(userId: string, id: string) {
  await prisma.notification.delete({ where: { id, userId } })
  return { success: true }
}

export async function notifyUser(input: NotificationInput & { telegramChatId?: string | null }) {
  const notification = await createNotification(input)
  if (input.telegramChatId) {
    void sendTelegramMessage(
      input.telegramChatId,
      `${input.title}\n${input.body}`,
      input.link ? `${env.frontendUrl}${input.link}` : undefined,
    )
  }
  void sendPushToUser(input.userId, {
    title: input.title,
    body: input.body,
    link: input.link || undefined,
    type: input.type,
  })
  return notification
}
