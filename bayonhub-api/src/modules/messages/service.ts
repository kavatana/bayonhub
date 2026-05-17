import { prisma } from "../../lib/prisma"
import { notifyUser } from "./notifications.service"

async function recalculateSellerResponseRate(sellerId: string) {
  const [totalConversations, repliedConversations] = await Promise.all([
    prisma.conversation.count({ where: { sellerId } }),
    prisma.conversation.count({
      where: {
        sellerId,
        messages: { some: { senderId: sellerId } },
      },
    }),
  ])
  const responseRate = totalConversations > 0 ? (repliedConversations / totalConversations) * 100 : null
  await prisma.user.update({
    where: { id: sellerId },
    data: { responseRate },
  })
}

export async function getOrCreateConversation(
  listingId: string | null,
  buyerId: string,
  sellerId: string,
) {
  const existing = await prisma.conversation.findFirst({
    where: { listingId, buyerId, sellerId },
    include: {
      buyer: { select: { id: true, name: true, avatarUrl: true } },
      seller: { select: { id: true, name: true, avatarUrl: true } },
    },
  })
  if (existing) return existing

  const conversation = await prisma.conversation.create({
    data: { listingId, buyerId, sellerId },
    include: {
      buyer: { select: { id: true, name: true, avatarUrl: true } },
      seller: { select: { id: true, name: true, avatarUrl: true } },
    },
  })
  await recalculateSellerResponseRate(sellerId)
  return conversation
}

export async function getMyConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      buyer: { select: { id: true, name: true, avatarUrl: true } },
      seller: { select: { id: true, name: true, avatarUrl: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, body: true, senderId: true, read: true, createdAt: true },
      },
    },
  })

  const conversationIds = conversations.map((conversation) => conversation.id)
  const unreadCounts = conversationIds.length
    ? await prisma.message.groupBy({
        by: ["conversationId"],
        where: {
          conversationId: { in: conversationIds },
          senderId: { not: userId },
          read: false,
        },
        _count: { _all: true },
      })
    : []
  const unreadCountByConversation = new Map(
    unreadCounts.map((item) => [item.conversationId, item._count._all]),
  )
  const withUnread = conversations.map((conversation) => ({
    ...conversation,
    lastMessage: conversation.messages[0] || null,
    unreadCount: unreadCountByConversation.get(conversation.id) || 0,
  }))

  return { conversations: withUnread }
}

export async function getMessages(conversationId: string, userId: string) {
  // Verify the user is a participant
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  })
  if (!conversation || (conversation.buyerId !== userId && conversation.sellerId !== userId)) {
    const error = new Error("Conversation not found") as Error & { status: number }
    error.status = 404
    throw error
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
    },
  })

  return { messages, conversation }
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  // Verify the sender is a participant
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  })
  if (!conversation || (conversation.buyerId !== senderId && conversation.sellerId !== senderId)) {
    const error = new Error("Conversation not found") as Error & { status: number }
    error.status = 404
    throw error
  }
  const sellerFirstReply =
    conversation.sellerId === senderId &&
    (await prisma.message.count({ where: { conversationId, senderId } })) === 0

  const message = await prisma.message.create({
    data: { conversationId, senderId, body },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
    },
  })

  // Touch conversation updatedAt so it sorts to top
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })

  if (sellerFirstReply) {
    await recalculateSellerResponseRate(senderId)
  }

  const recipientId = conversation.buyerId === senderId ? conversation.sellerId : conversation.buyerId
  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { telegramChatId: true },
  })
  const preview = body.length > 120 ? `${body.slice(0, 117)}...` : body
  void notifyUser({
    userId: recipientId,
    type: "message",
    title: "New message on BayonHub",
    body: preview,
    link: `/inbox/${conversationId}`,
    telegramChatId: recipient?.telegramChatId,
  })

  return message
}

export async function markAsRead(conversationId: string, userId: string) {
  // Mark all messages NOT sent by this user as read
  const result = await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      read: false,
    },
    data: { read: true },
  })

  return { updated: result.count }
}

export async function getUnreadCount(userId: string) {
  // Count unread messages across all conversations where user is a participant
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    select: { id: true },
  })

  const conversationIds = conversations.map((c) => c.id)
  if (conversationIds.length === 0) return { count: 0 }

  const count = await prisma.message.count({
    where: {
      conversationId: { in: conversationIds },
      senderId: { not: userId },
      read: false,
    },
  })

  return { count }
}
