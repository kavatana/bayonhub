import { prisma } from "../../lib/prisma"

export async function getConversations(userId: string) {
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
      receiver: { select: { id: true, name: true, avatarUrl: true } },
      listing: {
        select: {
          id: true,
          title: true,
          slug: true,
          images: { take: 1, orderBy: { order: "asc" } },
        },
      },
    },
  })

  const byPartner = new Map<string, (typeof messages)[number]>()
  for (const message of messages) {
    const partnerId = message.senderId === userId ? message.receiverId : message.senderId
    if (!byPartner.has(partnerId)) byPartner.set(partnerId, message)
  }

  const conversations = await Promise.all(
    Array.from(byPartner.entries()).map(async ([partnerId, lastMessage]) => {
      const unreadCount = await prisma.message.count({
        where: { senderId: partnerId, receiverId: userId, readAt: null },
      })
      return {
        partner:
          lastMessage.senderId === userId ? lastMessage.receiver : lastMessage.sender,
        lastMessage,
        unreadCount,
      }
    }),
  )

  return { conversations }
}

export async function getThread(currentUserId: string, partnerId: string, cursor?: string, limit = 50) {
  const take = Math.min(limit, 100)
  const messagesDesc = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: currentUserId, receiverId: partnerId },
        { senderId: partnerId, receiverId: currentUserId },
      ],
    },
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
      listing: {
        select: {
          id: true,
          title: true,
          slug: true,
          images: { take: 1, orderBy: { order: "asc" } },
        },
      },
    },
  })

  await prisma.message.updateMany({
    where: { senderId: partnerId, receiverId: currentUserId, readAt: null },
    data: { readAt: new Date() },
  })

  const nextCursor =
    messagesDesc.length === take ? messagesDesc[messagesDesc.length - 1]?.id || null : null
  return { messages: messagesDesc.reverse(), nextCursor }
}
