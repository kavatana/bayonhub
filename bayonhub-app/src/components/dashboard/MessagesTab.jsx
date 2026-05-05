import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ImagePlus, Send } from "lucide-react"
import { getConversations, getThread } from "../../api/messages"
import { API_BASE_URL, readStorage, STORAGE_KEYS, writeStorage } from "../../api/client"
import { useTranslation } from "../../hooks/useTranslation"
import { connectSocket, disconnectSocket, sendMessage as sendSocketMessage } from "../../lib/socket"
import { cn } from "../../lib/utils"
import { sanitizeText } from "../../lib/sanitize"
import { useAuthStore } from "../../store/useAuthStore"
import { useUIStore } from "../../store/useUIStore"
import Button from "../ui/Button"

import { MessageSquare } from "lucide-react"

const mockConversations = [
  {
    id: "demo-chat",
    nameKey: "app.name",
    unread: 1,
    messages: [
      { id: 1, sender: "them", textKey: "dashboard.mockMessage", createdAt: new Date().toISOString(), read: true },
    ],
  },
]

function getConversationName(conversation, t) {
  if (!conversation) return ""
  return conversation.name || (conversation.nameKey ? t(conversation.nameKey) : "")
}

function getInitials(name) {
  return name ? name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2) : "?"
}

function normalizeMessage(message, userId) {
  return {
    id: message.id,
    sender: message.senderId === userId ? "me" : "them",
    text: sanitizeText(message.body || message.text),
    createdAt: message.createdAt,
    read: Boolean(message.readAt),
    raw: message,
  }
}

function normalizeConversation(conversation, userId) {
  const partner = conversation.partner || {}
  const lastMessage = conversation.lastMessage
  return {
    id: partner.id || conversation.id,
    partnerId: partner.id,
    name: partner.name,
    unread: conversation.unreadCount || conversation.unread || 0,
    listingId: lastMessage?.listingId,
    messages: lastMessage ? [normalizeMessage(lastMessage, userId)] : [],
  }
}

export default function MessagesTab() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const setCurrentUserId = useUIStore((state) => state.setCurrentUserId)
  const [conversations, setConversations] = useState(() => readStorage(STORAGE_KEYS.messages, mockConversations))
  const [activeId, setActiveId] = useState(conversations[0]?.id || null)
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const active = useMemo(() => conversations.find((conversation) => conversation.id === activeId), [activeId, conversations])
  const activeName = getConversationName(active, t)

  useEffect(() => {
    setCurrentUserId(user?.id || null)
  }, [setCurrentUserId, user?.id])

  useEffect(() => {
    if (!API_BASE_URL || !user?.id) return undefined
    let cancelled = false
    getConversations()
      .then((result) => {
        if (cancelled) return
        const next = (result.conversations || []).map((conversation) => normalizeConversation(conversation, user.id))
        setConversations(next)
        setActiveId(next[0]?.id || null)
      })
      .catch(() => null)
    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    if (!API_BASE_URL || !active?.partnerId || !user?.id) return undefined
    let cancelled = false
    getThread(active.partnerId)
      .then((result) => {
        if (cancelled) return
        const messages = (result.messages || []).map((message) => normalizeMessage(message, user.id))
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === active.id ? { ...conversation, messages, unread: 0 } : conversation,
          ),
        )
      })
      .catch(() => null)
    return () => {
      cancelled = true
    }
  }, [active?.id, active?.partnerId, user?.id])

  useEffect(() => {
    if (!API_BASE_URL || !user?.id) return undefined
    const socket = connectSocket()
    if (!socket) return undefined
    const handleTyping = () => setTyping(true)
    const handleMessage = (message) => {
      const normalized = normalizeMessage(message, user.id)
      const partnerId = message.senderId === user.id ? message.receiverId : message.senderId
      setConversations((current) => {
        const allMessages = current.flatMap((conversation) => conversation.messages || [])
        if (allMessages.some((item) => item.id === normalized.id)) return current
        const existing = current.find((conversation) => conversation.partnerId === partnerId || conversation.id === partnerId)
        const next = existing
          ? current.map((conversation) =>
              conversation === existing
                ? { ...conversation, messages: [...conversation.messages, normalized], unread: activeId === conversation.id ? 0 : conversation.unread + 1 }
                : conversation,
            )
          : [
              {
                id: partnerId,
                partnerId,
                name: message.sender?.name,
                unread: 1,
                messages: [normalized],
              },
              ...current,
            ]
        writeStorage(STORAGE_KEYS.messages, next)
        return next
      })
    }
    const handleReadReceipt = ({ messageId }) => {
      setConversations((current) =>
        current.map((conversation) => ({
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === messageId ? { ...message, read: true } : message,
          ),
        })),
      )
    }
    socket.on("message:typing", handleTyping)
    socket.on("message:receive", handleMessage)
    socket.on("message:sent", handleMessage)
    socket.on("message:read_receipt", handleReadReceipt)
    return () => {
      socket.off("message:typing", handleTyping)
      socket.off("message:receive", handleMessage)
      socket.off("message:sent", handleMessage)
      socket.off("message:read_receipt", handleReadReceipt)
      disconnectSocket()
    }
  }, [activeId, user?.id])

  function sendMessage() {
    if (!input.trim() || !active) return
    if (API_BASE_URL && active.partnerId) {
      sendSocketMessage({ receiverId: active.partnerId, listingId: active.listingId, body: input.trim() })
      setInput("")
      return
    }
    const message = {
      id: Date.now(),
      sender: "me",
      text: input.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    }
    const next = conversations.map((conversation) =>
      conversation.id === active.id
        ? { ...conversation, messages: [...conversation.messages, message], unread: 0 }
        : conversation,
    )
    setConversations(next)
    writeStorage(STORAGE_KEYS.messages, next)
    setInput("")
  }

  if (!conversations.length) {
    return (
      <div className="grid min-h-64 place-items-center gap-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <MessageSquare className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-lg font-black text-neutral-900">{t("dashboard.noMessages")}</h3>
          <p className="mt-1 text-sm font-semibold text-neutral-500">{t("dashboard.noMessagesDesc")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-[520px] overflow-hidden rounded-2xl border border-neutral-200 bg-white md:grid-cols-[280px_minmax(0,1fr)]">
      <aside className={cn("border-r border-neutral-100", activeId && "hidden md:block")}>
        <p className="border-b border-neutral-100 p-4 text-sm font-black uppercase tracking-widest text-neutral-400">
          {t("dashboard.conversations")}
        </p>
        {conversations.map((conversation) => {
          const last = conversation.messages.at(-1)
          const name = getConversationName(conversation, t)
          return (
            <button
              className={cn(
                "flex w-full items-center gap-3 border-b border-neutral-100 p-4 text-left transition hover:bg-neutral-50",
                conversation.id === activeId && "bg-neutral-50",
              )}
              key={conversation.id}
              onClick={() => setActiveId(conversation.id)}
              type="button"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-sm font-black text-primary">
                {getInitials(name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-neutral-900">{name}</span>
                <span className="block truncate text-xs font-semibold text-neutral-500">{last?.text || t(last?.textKey)}</span>
              </span>
              {conversation.unread ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-black text-white">
                  {conversation.unread}
                </span>
              ) : null}
            </button>
          )
        })}
      </aside>

      <section className={cn("flex flex-col", !activeId && "hidden md:flex")}>
        <header className="flex items-center gap-3 border-b border-neutral-100 p-4">
          <button className="grid h-11 w-9 place-items-center rounded-full border border-neutral-200 md:hidden" onClick={() => setActiveId(null)} type="button">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{t("ui.back")}</span>
          </button>
          {active ? (
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-sm font-black text-primary">
              {getInitials(activeName)}
            </span>
          ) : null}
          <h3 className="font-black text-neutral-900">{active ? activeName : t("dashboard.messages")}</h3>
        </header>
        <div className="flex-1 space-y-3 overflow-auto bg-neutral-50 p-4">
          {active?.messages.map((message) => {
            const mine = message.sender === "me"
            return (
              <div className={cn("flex", mine ? "justify-end" : "justify-start")} key={message.id}>
                <div className={cn("max-w-[78%] rounded-2xl px-4 py-2 text-sm font-semibold", mine ? "bg-primary text-white" : "bg-white text-neutral-800")}>
                  <p>{message.text || t(message.textKey)}</p>
                  <span className={cn("mt-1 block text-[10px]", mine ? "text-white/70" : "text-neutral-400")}>
                    {message.read ? t("dashboard.read") : t("dashboard.sent")}
                  </span>
                </div>
              </div>
            )
          })}
          {typing ? (
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-400" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-400" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-400" />
              <span className="sr-only">{t("dashboard.typing")}</span>
            </div>
          ) : null}
        </div>
        <footer className="flex items-end gap-2 border-t border-neutral-100 p-3">
          <button className="grid h-11 w-11 place-items-center rounded-xl border border-neutral-200 text-neutral-500" type="button">
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">{t("dashboard.attachImage")}</span>
          </button>
          <textarea
            className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary"
            onChange={(event) => setInput(event.target.value)}
            placeholder={t("dashboard.typeMessage")}
            rows={Math.min(4, Math.max(1, input.split("\n").length))}
            value={input}
          />
          <Button onClick={sendMessage}>
            <Send className="h-4 w-4" aria-hidden="true" />
            {t("dashboard.send")}
          </Button>
        </footer>
      </section>
    </div>
  )
}
